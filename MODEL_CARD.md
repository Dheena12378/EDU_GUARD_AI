# Model Card — EDU CARD AI (Early Support Indicator)

## Model Details
- **Model Name:** EDU CARD AI Calibrated Engagement Ensemble
- **Model Version:** v1.2-calibrated
- **Model Architecture:** Random Forest Classifier with Platt Sigmoid Probability Calibration (`CalibratedClassifierCV`) + Supplementary Gradient Boosting (`XGBoost`).
- **Explainability Engine:** SHAP (SHapley Additive exPlanations) TreeExplainer with plain-language sentence synthesis.
- **Developers:** Combined Full-Stack, ML, Learning Analytics & Privacy Engineering Team.
- **License:** MIT License / Open Academic License.

---

## Intended Use
- **Primary Use Case:** Detects early behavioral shifts in student engagement (LMS activity, submission timing, attendance variance) *before* academic performance or assessment scores deteriorate.
- **Output:** An "Early Support Indicator" categorized into three non-punitive bands:
  - **Low Support Need** ($p < 0.30$)
  - **Medium Support Need** ($0.30 \le p < 0.60$)
  - **High Support Need** ($p \ge 0.60$)
- **Human-in-the-Loop:** Model outputs are strictly advisory suggestions for faculty and mentors to conduct optional, supportive check-ins. All actions are human-reviewed.
- **Out-of-Scope & Prohibited Uses:**
  - Never used for grading, ranking, academic penalties, admissions, or punitive actions.
  - Never used to label students with stigmatizing terms (e.g., "failing", "at-risk", "dropout").

---

## Factors & Training Data
- **Training Cohort:** 1,500 synthetic students simulated across 16 weeks reflecting 7 verified educational behavioral archetypes (*stable, improving, gradual_decline, sudden_drop, late_submission_drift, silent_decliner, recovering*).
- **Engineered Features (30 columns):**
  - Trailing 2-week rolling averages
  - Trailing 4-week linear trajectory slopes
  - Trailing 4-week volatility (standard deviation)
  - Personal baseline deltas (first 3 weeks vs current)
  - Cohort median deltas
  - Behavioral streak and inactivity counters
- **Zero Leakage:** Strictly evaluated with student-grouped splitting (`GroupShuffleSplit`). Feature calculations at week $W$ have zero access to week $W+1$ or beyond.

---

## Fairness by Design & Demographic Isolation
- **Architectural Safeguard:** Sensitive demographic attributes (gender, category, socioeconomic tier, disability) are isolated in a separate database table (`SensitiveData`).
- **Demographic Exemption:** Demographics are **NEVER** provided to the feature engineering pipeline or model estimators.
- **Audit Verification:** Post-hoc Disparate Impact evaluation verifies equitable selection rates (Disparate Impact ratio between 0.95 and 1.05 across all groups, compliant with the EEOC four-fifths rule).

---

## Performance Metrics
| Metric | Score | Benchmark / Standard |
| :--- | :--- | :--- |
| **ROC-AUC** | **0.969** | Excellent discrimination |
| **PR-AUC** | **0.878** | High precision in imbalanced support class |
| **Recall @ Top 10%** | **63.7%** | Captures over 63% of declining students in top 10% volume |
| **Average Lead Time** | **3.6 Weeks** | Signals trigger ~3.6 weeks before exam grades drop |
| **Fairness Parity** | **0.97 - 1.05** | Zero demographic disparate impact |

---

## Limitations & Honest Considerations
1. **Cold-Start Period:** Weeks 1–3 establish each student's personal baseline. Early indicator outputs begin in Week 4.
2. **Context Blindness:** The model detects *behavioral shifts*, not life circumstances. Illness, family events, or technical difficulties require human empathy to understand.
3. **Voluntary Support:** Supportive check-ins should remain optional and supportive to maintain student agency and psychological safety.
