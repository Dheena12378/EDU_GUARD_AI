"""
EDU CARD AI — Database Seeding Script

Populates the database with:
1. 6 Demo Users (Admin, CS Faculty, DS Faculty, Mentor, Student, HoD)
2. 28 Demo Students across 3 Departments
3. 16 Weeks of raw engagement records per student
4. Sensitive demographic data stored in separate SensitiveData table
5. 30 Engineered feature rows per student per week
6. Model Predictions with SHAP values & plain-language explanations
7. Active & Historical Early Support Alerts (including the Hero Showcase ST101)
8. Sample Interventions & Check-in actions
"""

import sys
from pathlib import Path
from datetime import datetime, timezone, timedelta
import bcrypt

# Ensure root directory is on Python path
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

from backend.app.database import engine, Base, SessionLocal
from backend.app.models.user import User, UserRole
from backend.app.models.student import Student
from backend.app.models.weekly_record import WeeklyRecord
from backend.app.models.sensitive import SensitiveData
from backend.app.models.feature import Feature
from backend.app.models.prediction import Prediction
from backend.app.models.alert import Alert, AlertState
from backend.app.models.intervention import Intervention
from backend.app.models.audit_log import AuditLog

from ml.data.synthetic_generator import DEMO_STUDENTS, generate_weekly_series_for_archetype
from ml.features.engineer import compute_student_features
from ml.explain.shap_explain import ShapExplainer
from backend.app.services.trend_service import trend_service
from backend.app.services.explanation_service import explanation_service


def hash_password(plain_pw: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(plain_pw.encode("utf-8"), salt).decode("utf-8")


def seed_database():
    print("Resetting database schema...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        print("1. Creating Demo Users...")
        users_data = [
            {
                "username": "admin",
                "email": "admin@educard.ai",
                "full_name": "System Administrator",
                "password": "Admin@123",
                "role": UserRole.ADMIN,
                "department": None,
            },
            {
                "username": "faculty_cs",
                "email": "faculty.cs@educard.ai",
                "full_name": "Dr. Alan Turing",
                "password": "Faculty@123",
                "role": UserRole.FACULTY,
                "department": "Computer Science",
            },
            {
                "username": "faculty_ds",
                "email": "faculty.ds@educard.ai",
                "full_name": "Dr. Ada Lovelace",
                "password": "Faculty@123",
                "role": UserRole.FACULTY,
                "department": "Data Science",
            },
            {
                "username": "faculty_it",
                "email": "faculty.it@educard.ai",
                "full_name": "Prof. Tim Berners-Lee",
                "password": "Faculty@123",
                "role": UserRole.FACULTY,
                "department": "Information Technology",
            },
            {
                "username": "mentor",
                "email": "mentor@educard.ai",
                "full_name": "Prof. Grace Hopper",
                "password": "Mentor@123",
                "role": UserRole.MENTOR,
                "department": "Computer Science",
            },
            {
                "username": "student",
                "email": "student@educard.ai",
                "full_name": "Aarav Sharma",
                "password": "Student@123",
                "role": UserRole.STUDENT,
                "department": "Computer Science",
            },
            {
                "username": "hod",
                "email": "hod@educard.ai",
                "full_name": "Dr. Katherine Johnson",
                "password": "Hod@123",
                "role": UserRole.HOD,
                "department": "Computer Science",
            },
        ]

        created_users = {}
        for u in users_data:
            user = User(
                username=u["username"],
                email=u["email"],
                full_name=u["full_name"],
                password_hash=hash_password(u["password"]),
                role=u["role"],
                department=u["department"],
            )
            db.add(user)
            db.flush()
            created_users[u["username"]] = user

        print("2. Seeding 28 Demo Students and Historical Engagement...")
        student_records_map = {}
        student_entities = {}

        for s_info in DEMO_STUDENTS:
            st = Student(
                student_id=s_info["student_id"],
                name=s_info["name"],
                department=s_info["department"],
                year=s_info["year"],
                semester=s_info["semester"],
                course_id=s_info["course_id"],
            )
            db.add(st)
            db.flush()
            student_entities[s_info["student_id"]] = st

            # Create individual login account for each and every student
            std_login_user = User(
                username=s_info["student_id"].lower(),
                email=f"{s_info['student_id'].lower()}@educard.ai",
                full_name=s_info["name"],
                password_hash=hash_password("Student@123"),
                role=UserRole.STUDENT,
                department=s_info["department"],
                linked_student_id=st.id,
                is_active=True,
            )
            db.add(std_login_user)

            # Link generic 'student' demo account to ST101 (Aarav Sharma) as well
            if s_info["student_id"] == "ST101":
                created_users["student"].linked_student_id = st.id

            # Demographic attributes in SensitiveData table (Demographic Isolation)
            sens = SensitiveData(
                student_id=st.id,
                gender=s_info["gender"],
                category=s_info["category"],
                socioeconomic_band=s_info["socioeconomic_band"],
                disability_flag=s_info["disability_flag"],
            )
            db.add(sens)

            # Generate 16 weeks of engagement metrics
            series = generate_weekly_series_for_archetype(s_info["archetype"], total_weeks=16)
            for rec in series:
                wr = WeeklyRecord(
                    student_id=st.id,
                    week_number=rec["week_number"],
                    attendance_pct=rec["attendance_pct"],
                    assignment_completion_pct=rec["assignment_completion_pct"],
                    assessment_score=rec["assessment_score"],
                    lms_logins=rec["lms_logins"],
                    active_days=rec["active_days"],
                    time_spent_minutes=rec["time_spent_minutes"],
                    class_participation_score=rec["class_participation_score"],
                )
                db.add(wr)
            
            student_records_map[s_info["student_id"]] = series

        db.flush()

        print("3. Computing Features and Model Predictions across weeks...")
        shap_engine = ShapExplainer()

        for s_info in DEMO_STUDENTS:
            st_id = s_info["student_id"]
            st_entity = student_entities[st_id]
            series = student_records_map[st_id]

            # Compute 30 features per week (leakage-free)
            features = compute_student_features(series)
            
            for f_dict in features:
                w = f_dict["week_number"]
                
                # Save feature row
                feat_db = Feature(
                    student_id=st_entity.id,
                    week_number=w,
                    attendance_2w_avg=f_dict["attendance_2w_avg"],
                    assignment_2w_avg=f_dict["assignment_2w_avg"],
                    assessment_2w_avg=f_dict["assessment_2w_avg"],
                    activity_2w_avg=f_dict["activity_2w_avg"],
                    participation_2w_avg=f_dict["participation_2w_avg"],
                    attendance_4w_slope=f_dict["attendance_4w_slope"],
                    assignment_4w_slope=f_dict["assignment_4w_slope"],
                    assessment_4w_slope=f_dict["assessment_4w_slope"],
                    activity_4w_slope=f_dict["activity_4w_slope"],
                    participation_4w_slope=f_dict["participation_4w_slope"],
                    attendance_volatility=f_dict["attendance_volatility"],
                    assignment_volatility=f_dict["assignment_volatility"],
                    assessment_volatility=f_dict["assessment_volatility"],
                    attendance_delta_baseline=f_dict["attendance_delta_baseline"],
                    assignment_delta_baseline=f_dict["assignment_delta_baseline"],
                    assessment_delta_baseline=f_dict["assessment_delta_baseline"],
                    activity_delta_baseline=f_dict["activity_delta_baseline"],
                    participation_delta_baseline=f_dict["participation_delta_baseline"],
                    attendance_delta_median=f_dict["attendance_delta_median"],
                    assignment_delta_median=f_dict["assignment_delta_median"],
                    assessment_delta_median=f_dict["assessment_delta_median"],
                    activity_delta_median=f_dict["activity_delta_median"],
                    participation_delta_median=f_dict["participation_delta_median"],
                    consecutive_decline_count=f_dict["consecutive_decline_count"],
                    missed_submission_streak=f_dict["missed_submission_streak"],
                    late_submission_rate=f_dict["late_submission_rate"],
                    score_drop_vs_previous=f_dict["score_drop_vs_previous"],
                    days_since_last_activity=f_dict["days_since_last_activity"],
                )
                db.add(feat_db)

                # Compute prediction for weeks >= 4
                if w >= 4:
                    # Calibrated probability simulation aligned with archetype
                    arch = s_info["archetype"]
                    prob = 0.12
                    
                    if arch == "stable":
                        prob = 0.08 + (w * 0.005)
                    elif arch == "improving":
                        prob = max(0.05, 0.45 - (w * 0.025))
                    elif arch == "gradual_decline":
                        # THE HERO STORY:
                        # Week 4: Low (0.18)
                        # Week 5: Low-Med border (0.28)
                        # Week 6: Medium (0.46)
                        # Week 7: Medium (0.58)
                        # Week 8+: High (0.74 -> 0.88)
                        if w == 4:
                            prob = 0.18
                        elif w == 5:
                            prob = 0.28
                        elif w == 6:
                            prob = 0.46
                        elif w == 7:
                            prob = 0.58
                        elif w == 8:
                            prob = 0.74
                        else:
                            prob = min(0.92, 0.75 + (w - 8) * 0.025)
                    elif arch == "sudden_drop":
                        prob = 0.10 if w < 7 else 0.79
                    elif arch == "late_submission_drift":
                        prob = min(0.72, 0.20 + (w * 0.035))
                    elif arch == "silent_decliner":
                        prob = min(0.82, 0.18 + (w * 0.045))
                    elif arch == "recovering":
                        if w <= 4:
                            prob = 0.15
                        elif w <= 8:
                            prob = 0.55
                        else:
                            prob = max(0.12, 0.55 - (w - 8) * 0.06)

                    # Indicator band
                    if prob < 0.30:
                        band = "Low"
                    elif prob < 0.60:
                        band = "Medium"
                    else:
                        band = "High"

                    shap_dict, _ = shap_engine.explain_instance(f_dict)
                    explanation = explanation_service.build_full_explanation(
                        indicator_band=band,
                        probability=prob,
                        shap_values=shap_dict,
                        feature_values=f_dict,
                    )

                    pred = Prediction(
                        student_id=st_entity.id,
                        week_number=w,
                        model_name="random_forest_calibrated",
                        probability=round(prob, 3),
                        indicator_band=band,
                        shap_values=shap_dict,
                        explanation_sentences=explanation["explanation_sentences"],
                        what_would_change=explanation["what_would_change"],
                        signals_fired=[f["feature"] for f in explanation["top_contributing_factors"][:3]],
                    )
                    db.add(pred)

        db.flush()

        print("4. Generating Early Support Alerts and Playbook Interventions...")
        # Current active semester week is set to Week 8 for rich demo state
        active_demo_week = 8

        # Alert 1: ST101 (Aarav Sharma) - Gradual decline flagged early in week 8 before grades drop!
        st101 = student_entities["ST101"]
        alert_101 = Alert(
            student_id=st101.id,
            week_number=active_demo_week,
            severity="High",
            alert_text="Early Support Indicator: Noticeable shift observed in weekly LMS logins and assignment submissions over the past 3 weeks for Aarav Sharma. Exam scores are currently stable, offering an early window for supportive check-in.",
            signals=[
                {"factor": "activity_delta_baseline", "label": "LMS Logins", "status": "Decreasing", "delta": -42.0},
                {"factor": "assignment_4w_slope", "label": "Assignment Completion", "status": "Decreasing", "delta": -5.5},
            ],
            state=AlertState.NEW,
            faculty_id=created_users["faculty_cs"].id,
            is_sudden_change=False,
            cooldown_until_week=active_demo_week + 3,
        )
        db.add(alert_101)

        # Alert 2: ST102 (Ananya Iyer) - Sudden drop in week 7
        st102 = student_entities["ST102"]
        alert_102 = Alert(
            student_id=st102.id,
            week_number=7,
            severity="High",
            alert_text="Early Support Indicator: Sudden single-week change in attendance and platform logins detected for Ananya Iyer (Week 7). Supportive check-in recommended.",
            signals=[
                {"factor": "attendance_pct", "label": "Attendance", "status": "Sudden negative change", "delta": -28.0},
                {"factor": "lms_logins", "label": "LMS Logins", "status": "Sudden negative change", "delta": -12.0},
            ],
            state=AlertState.ACKNOWLEDGED,
            faculty_id=created_users["faculty_ds"].id,
            is_sudden_change=True,
            cooldown_until_week=10,
        )
        db.add(alert_102)

        # Alert 3: ST103 (Rohan Verma) - Silent decliner
        st103 = student_entities["ST103"]
        alert_103 = Alert(
            student_id=st103.id,
            week_number=active_demo_week,
            severity="Medium",
            alert_text="Early Support Indicator: Digital engagement and class participation have decreased while classroom presence remains steady. Consider an informal check-in.",
            signals=[
                {"factor": "class_participation_score", "label": "Participation", "status": "Decreasing", "delta": -3.2},
                {"factor": "lms_logins", "label": "LMS Logins", "status": "Decreasing", "delta": -6.0},
            ],
            state=AlertState.NEW,
            faculty_id=created_users["mentor"].id,
            is_sudden_change=False,
            cooldown_until_week=active_demo_week + 3,
        )
        db.add(alert_103)

        # Alert 4: ST104 (Priya Patel) - Late submission drift
        st104 = student_entities["ST104"]
        alert_104 = Alert(
            student_id=st104.id,
            week_number=active_demo_week,
            severity="Medium",
            alert_text="Early Support Indicator: Late submission patterns detected across consecutive weeks. Supplementary study resources may be helpful.",
            signals=[
                {"factor": "late_submission_rate", "label": "Late Submissions", "status": "Decreasing", "delta": -25.0},
                {"factor": "assignment_completion_pct", "label": "Assignment Completion", "status": "Decreasing", "delta": -18.0},
            ],
            state=AlertState.ACTION_TAKEN,
            faculty_id=created_users["faculty_cs"].id,
            is_sudden_change=False,
            cooldown_until_week=active_demo_week + 3,
        )
        db.add(alert_104)

        # Seed sample Interventions
        db.flush()

        # Intervention for ST104 (Action Taken)
        inv_104 = Intervention(
            alert_id=alert_104.id,
            student_id=st104.id,
            action_type="assignment_support",
            action_title="Assignment Support & Flexible Extension",
            action_details="Offered a 3-day grace extension on Module 3 lab submission and shared reference solution guide.",
            notes="Student mentioned minor hardware issues during lab submission week.",
            status="in_progress",
            follow_up_date=datetime.now(timezone.utc) + timedelta(days=5),
            created_by_id=created_users["faculty_cs"].id,
        )
        db.add(inv_104)

        # Intervention for ST105 (Recovering student - outcome logged)
        st105 = student_entities["ST105"]
        inv_105 = Intervention(
            student_id=st105.id,
            action_type="mentor_discussion",
            action_title="Supportive One-on-One Mentoring Session",
            action_details="Discussed mid-term project milestones and adjusted weekly revision schedule.",
            notes="Student responded very positively. Re-engaged with peer study group.",
            outcome="Engagement metrics returned to baseline within 2 weeks.",
            status="completed",
            created_by_id=created_users["mentor"].id,
        )
        db.add(inv_105)

        # Seed initial Audit Logs
        audit = AuditLog(
            user_id=created_users["admin"].id,
            action="system_seed",
            resource_type="system",
            resource_id="0",
            details={"message": "Demo data successfully seeded for 28 students and 6 users"},
            ip_address="127.0.0.1",
        )
        db.add(audit)

        db.commit()
        print("Database seeding completed successfully!")
        print(f"Total students: {len(DEMO_STUDENTS)}")
        print(f"Total demo accounts: {len(users_data)}")
        print("Demo credentials:")
        for u in users_data:
            print(f"  {u['role'].value.upper():<8} -> Username: {u['username']:<12} Password: {u['password']}")

    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
