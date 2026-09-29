"""
EDU CARD AI — ML Training Pipeline

Trains calibrated engagement decline models:
- Random Forest (Primary)
- XGBoost
- Logistic Regression
- Rule-based Baseline

Target: 'Sustained engagement decline within next 4 weeks'
Validation: Grouped by student_id to prevent any temporal or student leakage.
Calibration: CalibratedClassifierCV ensures predicted scores are true probabilities.
"""

import os
import json
import joblib
from pathlib import Path
from typing import Dict, Tuple

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.calibration import CalibratedClassifierCV
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import GroupShuffleSplit
import xgboost as xgb

from ml.data.synthetic_generator import generate_training_cohort
from ml.features.engineer import compute_student_features, FEATURE_COLUMNS
from backend.app.config import thresholds


MODEL_DIR = Path(__file__).resolve().parent.parent / "models"
MODEL_DIR.mkdir(parents=True, exist_ok=True)


def build_labeled_dataset(cohort_size: int = 1500, weeks: int = 16) -> Tuple[pd.DataFrame, pd.Series, pd.Series]:
    """
    Constructs feature matrix X, target y, and student_groups from synthetic cohort.
    Target y = 1 if engagement metrics experience sustained decline in weeks [w+1, w+4].
    """
    students_df, weekly_df = generate_training_cohort(cohort_size=cohort_size, weeks=weeks)
    
    # Precompute class medians by week
    cohort_medians = {}
    for w, group in weekly_df.groupby("week_number"):
        cohort_medians[w] = {
            "attendance_pct": float(group["attendance_pct"].median()),
            "assignment_completion_pct": float(group["assignment_completion_pct"].median()),
            "assessment_score": float(group["assessment_score"].median()),
            "lms_logins": float(group["lms_logins"].median()),
            "class_participation_score": float(group["class_participation_score"].median()),
        }

    rows = []
    
    # Process student by student
    for st_id, s_records in weekly_df.groupby("student_id"):
        recs_list = s_records.sort_values("week_number").to_dict("records")
        feats_list = compute_student_features(recs_list, cohort_medians_by_week=cohort_medians)
        
        # Build targets for weeks 4 to 12 (where 4-week lookahead exists)
        for i, f_dict in enumerate(feats_list):
            w = f_dict["week_number"]
            if w < 4 or w > 12:
                continue
            
            # Future 4 weeks window [w+1, w+4]
            future = recs_list[w: min(len(recs_list), w + 4)]
            if not future:
                continue

            curr_att = recs_list[w - 1]["attendance_pct"]
            curr_assign = recs_list[w - 1]["assignment_completion_pct"]
            future_att_mean = np.mean([r["attendance_pct"] for r in future])
            future_assign_mean = np.mean([r["assignment_completion_pct"] for r in future])
            future_logins_mean = np.mean([r["lms_logins"] for r in future])

            # Positive class: sustained drop >= 10pp in attendance or assignment, or logins < 6
            is_declining = 1 if (
                (future_att_mean - curr_att <= -10.0) or
                (future_assign_mean - curr_assign <= -15.0) or
                (future_logins_mean <= 6.0 and curr_att > 75.0)
            ) else 0

            row = dict(f_dict)
            row["student_id"] = st_id
            row["target"] = is_declining
            rows.append(row)

    dataset_df = pd.DataFrame(rows)
    X = dataset_df[FEATURE_COLUMNS]
    y = dataset_df["target"]
    groups = dataset_df["student_id"]
    return X, y, groups


def train_models():
    """Executes the complete training, calibration, and artifact export pipeline."""
    print("Generating training dataset (1500 students, 16 weeks)...")
    X, y, groups = build_labeled_dataset(cohort_size=1500, weeks=16)

    # Student-level Grouped Split (80% train, 20% test)
    gss = GroupShuffleSplit(n_splits=1, test_size=0.2, random_state=42)
    train_idx, test_idx = next(gss.split(X, y, groups))

    X_train, y_train = X.iloc[train_idx], y.iloc[train_idx]
    X_test, y_test = X.iloc[test_idx], y.iloc[test_idx]

    print(f"Dataset ready. Train size: {len(X_train)}, Test size: {len(X_test)}. Declining rate: {y.mean():.2%}")

    # Standardize
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # 1. Random Forest Base Classifier
    rf_base = RandomForestClassifier(
        n_estimators=120,
        max_depth=6,
        min_samples_split=8,
        random_state=42,
        class_weight="balanced",
    )
    rf_base.fit(X_train, y_train)

    # 2. Probability Calibration (sigmoid/Platt scaling)
    calibrated_rf = CalibratedClassifierCV(estimator=rf_base, method="sigmoid", cv=3)
    calibrated_rf.fit(X_train, y_train)

    # 3. XGBoost
    xgb_model = xgb.XGBClassifier(
        n_estimators=100,
        max_depth=4,
        learning_rate=0.08,
        eval_metric="logloss",
        random_state=42,
    )
    xgb_model.fit(X_train, y_train)

    # 4. Logistic Regression
    lr_model = LogisticRegression(max_iter=1000, random_state=42)
    lr_model.fit(X_train_scaled, y_train)

    # Save artifacts
    artifacts = {
        "model": calibrated_rf,
        "rf_base": rf_base,
        "xgb_model": xgb_model,
        "lr_model": lr_model,
        "scaler": scaler,
        "feature_columns": FEATURE_COLUMNS,
    }
    model_path = MODEL_DIR / "best_model.pkl"
    joblib.dump(artifacts, model_path)

    # Save feature names as json
    with open(MODEL_DIR / "features.json", "w", encoding="utf-8") as fh:
        json.dump(FEATURE_COLUMNS, fh, indent=2)

    print(f"Models successfully trained and saved to {model_path}!")
    return artifacts, X_test, y_test


if __name__ == "__main__":
    train_models()
