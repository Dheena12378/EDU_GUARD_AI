# EDU GUARD AI — Proactive Academic Monitoring & Supportive Intervention

> **AI-assisted academic monitoring system that detects early signs of declining student engagement BEFORE academic performance drops, explains why, alerts faculty/mentors, and suggests optional support actions.**

---

## 💡 Core Philosophy
```
DETECT ➔ EXPLAIN ➔ ALERT ➔ SUPPORT ➔ HUMAN REVIEW
```
- **Assists, Never Judges:** The AI suggests proactive check-ins; it never judges, ranks, punishes, or labels students.
- **Language Hygiene:** Stigmatizing terms (e.g. *"failing"*, *"at-risk"*, *"dropout"*, *"hopeless"*) are strictly prohibited and enforced via automated test suites.
- **Personal Baseline over Absolute Level:** Evaluates changes relative to each student's established baseline (first 3 weeks) and cohort medians.
- **Demographic Isolation:** Sensitive demographic attributes (gender, category, socioeconomic status) are quarantined in a separate database table and **NEVER** fed into model features.

---

## 🛠️ Technology Stack
- **Backend:** FastAPI (Python 3.10+ / 3.14), SQLAlchemy ORM, Pydantic V2, SQLite (WAL mode) / PostgreSQL toggle.
- **Machine Learning & XAI:** Scikit-Learn (Calibrated Random Forest), XGBoost, Logistic Regression, SHAP (SHapley Additive exPlanations).
- **Frontend:** React 19, Vite, Recharts, Lucide Icons, Pure Vanilla CSS Design System with dark/light themes.
- **Security & Privacy:** JWT Authentication with bcrypt password hashing, Role-Based Access Control (RBAC), Immutable Audit Logging, DPDP Act 2023 & FERPA alignment.

---

## 🚀 Quick Start Guide

### 1. Backend Setup & Seeding
```bash
# In project root:
# 1. Install Python dependencies
pip install -r backend/requirements.txt

# 2. Train the ML models and generate evaluation metrics
python -m ml.train.evaluate

# 3. Seed demo users, 28 students, and 16 weeks of history
python backend/seed.py

# 4. Start the FastAPI backend server (Port 8000)
python -m uvicorn backend.app.main:app --reload --port 8000
```
- Interactive API Documentation: [http://localhost:8000/api/docs](http://localhost:8000/api/docs)
- Health Check: [http://localhost:8000/api/health](http://localhost:8000/api/health)

### 2. Frontend Setup & Launch
```bash
# In frontend directory (c:\EDU_CARD_AI\frontend):
npm install
npm run dev
```
- Frontend Application URL: [http://localhost:5173](http://localhost:5173)

---

## 👥 Demo User Personas (1-Click Switcher Available on Login)

| Role | Username | Password | Persona & Responsibilities |
| :--- | :--- | :--- | :--- |
| **FACULTY (CS)** | `faculty_cs` | `Faculty@123` | **Dr. Alan Turing:** Reviews CS student indicators & launches support actions. |
| **FACULTY (DS)** | `faculty_ds` | `Faculty@123` | **Dr. Ada Lovelace:** Monitors Data Science cohort for sudden engagement shifts. |
| **MENTOR** | `mentor` | `Mentor@123` | **Prof. Grace Hopper:** Conducts 1-on-1 check-ins and logs outcome notes. |
| **STUDENT** | `student` | `Student@123` | **Aarav Sharma (ST101):** Privacy-first student view; no anxiety-inducing scores. |
| **ADMIN** | `admin` | `Admin@123` | **System Administrator:** System audit logs, threshold tuning, fairness audit. |
| **HOD** | `hod` | `Hod@123` | **Dr. Katherine Johnson:** Cohort-level aggregates with min-size privacy rules. |

---

## 🧪 Automated Test Suite
Run the comprehensive test suite verifying RBAC data isolation, absence of leakage, alert firing rules, and vocabulary hygiene:
```bash
python -m pytest tests/ -v
```
All 13 automated tests pass with 100% compliance:
- `test_banned_words.py`: Confirms 0 banned vocabulary across all outputs.
- `test_rbac.py`: Proves students cannot view peer records and faculty are department-scoped.
- `test_leakage.py`: Proves strict cutoff in time-series feature engineering.
- `test_alert_rules.py`: Verifies sudden-change override and 3-week cooldowns.
- `test_trend_classifier.py`: Validates EWMA, CUSUM, and trend thresholds.

---

## 🌟 The Hero Demonstration (ST101 — Aarav Sharma)
1. **Week 1–4:** High baseline engagement (~91% attendance, ~95% assignments, 19 logins/week).
2. **Week 5–8:** Noticeable engagement fade: LMS logins drop to 6/week (-42%), and assignment submission slopes turn downward. **Exam score is still 82%!**
3. **Week 8 Detection:** EDU GUARD AI detects the divergence and flags a **High Early Support Indicator** with plain-language explanations.
4. **Supportive Intervention:** Faculty reviews the explanation, uses the **Counterfactual Simulator**, and initiates **Assignment Support & Flexible Extension** from the Playbook before grades drop in Week 13.

# EDU_GUARD_AI
