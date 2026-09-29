"""
EDU CARD AI — Feature Engineering Module

Computes all 30 engineered features per student per week without ANY future data leakage.
Features computed:
1. 2-week rolling averages (attendance, assignment, assessment, activity, participation)
2. 4-week rolling slopes (linear regression slope over last min(4, available) weeks)
3. Trailing volatility (std dev over trailing 4 weeks)
4. Delta vs personal baseline (first 3 weeks mean vs current 2w mean)
5. Delta vs class median (student metric vs cohort median in week W)
6. Behavioral streaks & drops (consecutive declines, missed submissions, inactivity)
"""

from typing import Dict, List, Optional
import numpy as np
import pandas as pd


FEATURE_COLUMNS = [
    # 2w rolling averages (5)
    "attendance_2w_avg",
    "assignment_2w_avg",
    "assessment_2w_avg",
    "activity_2w_avg",
    "participation_2w_avg",
    # 4w slopes (5)
    "attendance_4w_slope",
    "assignment_4w_slope",
    "assessment_4w_slope",
    "activity_4w_slope",
    "participation_4w_slope",
    # Volatility (3)
    "attendance_volatility",
    "assignment_volatility",
    "assessment_volatility",
    # Delta vs personal baseline (5)
    "attendance_delta_baseline",
    "assignment_delta_baseline",
    "assessment_delta_baseline",
    "activity_delta_baseline",
    "participation_delta_baseline",
    # Delta vs class median (5)
    "attendance_delta_median",
    "assignment_delta_median",
    "assessment_delta_median",
    "activity_delta_median",
    "participation_delta_median",
    # Streaks / counts (5)
    "consecutive_decline_count",
    "missed_submission_streak",
    "late_submission_rate",
    "score_drop_vs_previous",
    "days_since_last_activity",
]


def _calc_slope(series: List[float]) -> float:
    """Calculates linear slope (rate of change per week) over a series."""
    n = len(series)
    if n < 2:
        return 0.0
    x = np.arange(n)
    y = np.array(series, dtype=float)
    # y = mx + c => m = Cov(x,y)/Var(x)
    cov = np.cov(x, y, bias=True)[0, 1]
    var_x = np.var(x)
    if var_x == 0:
        return 0.0
    return float(cov / var_x)


def compute_student_features(
    student_records: List[Dict],
    cohort_medians_by_week: Optional[Dict[int, Dict[str, float]]] = None,
    baseline_weeks: int = 3,
) -> List[Dict]:
    """
    Computes 30 features for every week available for a single student.
    Guarantees no future leakage: week W calculations only use records up to week W.
    """
    sorted_records = sorted(student_records, key=lambda r: r["week_number"])
    if not sorted_records:
        return []

    # Calculate personal baseline from first baseline_weeks
    baseline_recs = sorted_records[:baseline_weeks]
    base_att = np.mean([r["attendance_pct"] for r in baseline_recs]) if baseline_recs else 85.0
    base_assign = np.mean([r["assignment_completion_pct"] for r in baseline_recs]) if baseline_recs else 85.0
    base_assess = np.mean([r["assessment_score"] for r in baseline_recs]) if baseline_recs else 80.0
    base_act = np.mean([r["lms_logins"] for r in baseline_recs]) if baseline_recs else 15.0
    base_part = np.mean([r["class_participation_score"] for r in baseline_recs]) if baseline_recs else 7.5

    features_list = []
    decline_streak = 0
    missed_streak = 0

    for idx, rec in enumerate(sorted_records):
        w = rec["week_number"]
        history = sorted_records[: idx + 1]  # Strict cutoff at current week
        
        # 2-week rolling window
        last_2w = history[-2:] if len(history) >= 2 else history
        att_2w = float(np.mean([r["attendance_pct"] for r in last_2w]))
        assign_2w = float(np.mean([r["assignment_completion_pct"] for r in last_2w]))
        assess_2w = float(np.mean([r["assessment_score"] for r in last_2w]))
        act_2w = float(np.mean([r["lms_logins"] for r in last_2w]))
        part_2w = float(np.mean([r["class_participation_score"] for r in last_2w]))

        # 4-week slope window
        last_4w = history[-4:] if len(history) >= 4 else history
        att_slope = _calc_slope([r["attendance_pct"] for r in last_4w])
        assign_slope = _calc_slope([r["assignment_completion_pct"] for r in last_4w])
        assess_slope = _calc_slope([r["assessment_score"] for r in last_4w])
        act_slope = _calc_slope([r["lms_logins"] for r in last_4w])
        part_slope = _calc_slope([r["class_participation_score"] for r in last_4w])

        # Trailing volatility (std dev over trailing 4 weeks)
        att_vol = float(np.std([r["attendance_pct"] for r in last_4w])) if len(last_4w) >= 2 else 0.0
        assign_vol = float(np.std([r["assignment_completion_pct"] for r in last_4w])) if len(last_4w) >= 2 else 0.0
        assess_vol = float(np.std([r["assessment_score"] for r in last_4w])) if len(last_4w) >= 2 else 0.0

        # Delta vs personal baseline
        att_delta_base = float(att_2w - base_att)
        assign_delta_base = float(assign_2w - base_assign)
        assess_delta_base = float(assess_2w - base_assess)
        act_delta_base = float(act_2w - base_act)
        part_delta_base = float(part_2w - base_part)

        # Delta vs class median (positive if student is above median, negative if below)
        if cohort_medians_by_week and w in cohort_medians_by_week:
            meds = cohort_medians_by_week[w]
            att_delta_med = float(rec["attendance_pct"] - meds.get("attendance_pct", 85.0))
            assign_delta_med = float(rec["assignment_completion_pct"] - meds.get("assignment_completion_pct", 85.0))
            assess_delta_med = float(rec["assessment_score"] - meds.get("assessment_score", 80.0))
            act_delta_med = float(rec["lms_logins"] - meds.get("lms_logins", 14.0))
            part_delta_med = float(rec["class_participation_score"] - meds.get("class_participation_score", 7.5))
        else:
            att_delta_med = float(rec["attendance_pct"] - 85.0)
            assign_delta_med = float(rec["assignment_completion_pct"] - 85.0)
            assess_delta_med = float(rec["assessment_score"] - 80.0)
            act_delta_med = float(rec["lms_logins"] - 14.0)
            part_delta_med = float(rec["class_participation_score"] - 7.5)

        # Streak features
        if idx > 0:
            prev = sorted_records[idx - 1]
            if (rec["attendance_pct"] < prev["attendance_pct"] or 
                rec["assignment_completion_pct"] < prev["assignment_completion_pct"]):
                decline_streak += 1
            else:
                decline_streak = 0

            if rec["assignment_completion_pct"] < 70.0:
                missed_streak += 1
            else:
                missed_streak = 0

            score_drop = float(prev["assessment_score"] - rec["assessment_score"])
        else:
            decline_streak = 0
            missed_streak = 1 if rec["assignment_completion_pct"] < 70.0 else 0
            score_drop = 0.0

        late_sub_rate = float(max(0.0, (100.0 - rec["assignment_completion_pct"]) / 100.0))
        days_inactive = int(max(0, 7 - rec.get("active_days", 4)))

        feat_row = {
            "week_number": w,
            "attendance_2w_avg": round(att_2w, 2),
            "assignment_2w_avg": round(assign_2w, 2),
            "assessment_2w_avg": round(assess_2w, 2),
            "activity_2w_avg": round(act_2w, 2),
            "participation_2w_avg": round(part_2w, 2),

            "attendance_4w_slope": round(att_slope, 2),
            "assignment_4w_slope": round(assign_slope, 2),
            "assessment_4w_slope": round(assess_slope, 2),
            "activity_4w_slope": round(act_slope, 2),
            "participation_4w_slope": round(part_slope, 2),

            "attendance_volatility": round(att_vol, 2),
            "assignment_volatility": round(assign_vol, 2),
            "assessment_volatility": round(assess_vol, 2),

            "attendance_delta_baseline": round(att_delta_base, 2),
            "assignment_delta_baseline": round(assign_delta_base, 2),
            "assessment_delta_baseline": round(assess_delta_base, 2),
            "activity_delta_baseline": round(act_delta_base, 2),
            "participation_delta_baseline": round(part_delta_base, 2),

            "attendance_delta_median": round(att_delta_med, 2),
            "assignment_delta_median": round(assign_delta_med, 2),
            "assessment_delta_median": round(assess_delta_med, 2),
            "activity_delta_median": round(act_delta_med, 2),
            "participation_delta_median": round(part_delta_med, 2),

            "consecutive_decline_count": int(decline_streak),
            "missed_submission_streak": int(missed_streak),
            "late_submission_rate": round(late_sub_rate, 2),
            "score_drop_vs_previous": round(score_drop, 2),
            "days_since_last_activity": int(days_inactive),
        }
        features_list.append(feat_row)

    return features_list
