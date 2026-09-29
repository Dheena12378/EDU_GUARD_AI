"""
EDU CARD AI — Auth Router with Individual Student & Faculty Registration
"""

from typing import List, Optional
import random
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.user import User, UserRole
from ..models.student import Student
from ..models.weekly_record import WeeklyRecord
from ..models.sensitive import SensitiveData
from ..models.feature import Feature
from ..models.prediction import Prediction
from ..schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserResponse
from ..services.auth_service import verify_password, get_password_hash, create_access_token, get_current_user
from ..services.audit_service import log_audit
from ml.data.synthetic_generator import generate_weekly_series_for_archetype
from ml.features.engineer import compute_student_features
from ml.explain.shap_explain import ShapExplainer
from ..services.explanation_service import explanation_service


router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest, request: Request, db: Session = Depends(get_db)):
    """
    Authenticates user with username or student_id & password.
    Accepts:
    - Direct username (e.g. 'st101', 'faculty_cs', 'admin', 'student')
    - Student ID (e.g. 'ST101', 'ST102', 'ST115')
    """
    search_term = req.username.strip()

    # 1. Search directly by username (case-insensitive)
    user = db.query(User).filter(User.username.ilike(search_term)).first()

    # 2. If not found by username, search by student_id
    if not user:
        student = db.query(Student).filter(Student.student_id.ilike(search_term)).first()
        if student:
            user = db.query(User).filter(User.linked_student_id == student.id).first()

    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password. For demo accounts, use password 'Student@123' or 'Faculty@123'.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated",
        )

    access_token = create_access_token(data={"sub": user.username, "role": user.role.value})
    log_audit(
        db=db,
        action="user_login",
        user=user,
        resource_type="auth",
        resource_id=str(user.id),
        details={"role": user.role.value, "username": user.username},
        request=request,
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.from_orm(user),
    )


@router.post("/register", response_model=TokenResponse)
async def register(req: RegisterRequest, request: Request, db: Session = Depends(get_db)):
    """
    Registers a new individual Student or Faculty account.
    - If role is 'student': Creates academic profile, initial baseline records, and links user.
    - If role is 'faculty': Creates faculty user account scoped to department.
    """
    clean_username = req.username.strip().lower()

    # Check if username already exists
    existing_user = db.query(User).filter(User.username.ilike(clean_username)).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Username '{req.username}' is already registered. Please choose another username.",
        )

    # Check if email already exists
    if req.email:
        existing_email = db.query(User).filter(User.email.ilike(req.email.strip())).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Email '{req.email}' is already in use.",
            )

    linked_st_id = None

    if req.role == UserRole.STUDENT:
        # Generate or format student_id
        if req.student_id and req.student_id.strip():
            st_code = req.student_id.strip().upper()
        else:
            # Auto-assign next ID e.g. ST129
            highest_st = db.query(Student).order_by(Student.id.desc()).first()
            next_num = (highest_st.id + 101) if highest_st else 101
            st_code = f"ST{next_num}"

        # Check if student ID already registered
        existing_student = db.query(Student).filter(Student.student_id == st_code).first()
        if existing_student:
            student = existing_student
        else:
            student = Student(
                student_id=st_code,
                name=req.full_name.strip(),
                department=req.department.strip(),
                year=req.year or 1,
                semester=req.semester or 1,
                course_id=req.course_id or f"{req.department[:2].upper()}-101",
            )
            db.add(student)
            db.flush()

            # Separate demographic table entry (Demographic Isolation)
            sens = SensitiveData(
                student_id=student.id,
                gender="Not Disclosed",
                category="General",
                socioeconomic_band="Tier-2",
                disability_flag=0,
            )
            db.add(sens)

            # Generate initial 16 weeks of engagement data (Stable baseline by default)
            series = generate_weekly_series_for_archetype("stable", total_weeks=16)
            for rec in series:
                wr = WeeklyRecord(
                    student_id=student.id,
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

            # Pre-compute features & prediction
            features = compute_student_features(series)
            shap_engine = ShapExplainer()
            for f_dict in features:
                w = f_dict["week_number"]
                feat_db = Feature(
                    student_id=student.id,
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

                if w >= 4:
                    prob = 0.12
                    band = "Low"
                    shap_dict, _ = shap_engine.explain_instance(f_dict)
                    explanation = explanation_service.build_full_explanation(
                        indicator_band=band,
                        probability=prob,
                        shap_values=shap_dict,
                        feature_values=f_dict,
                    )
                    pred = Prediction(
                        student_id=student.id,
                        week_number=w,
                        model_name="random_forest_calibrated",
                        probability=prob,
                        indicator_band=band,
                        shap_values=shap_dict,
                        explanation_sentences=explanation["explanation_sentences"],
                        what_would_change=explanation["what_would_change"],
                        signals_fired=[],
                    )
                    db.add(pred)

        linked_st_id = student.id

    # Create the User record
    new_user = User(
        username=clean_username,
        password_hash=get_password_hash(req.password),
        full_name=req.full_name.strip(),
        email=req.email.strip() if req.email else f"{clean_username}@educard.ai",
        role=req.role,
        department=req.department.strip(),
        linked_student_id=linked_st_id,
        is_active=True,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    log_audit(
        db=db,
        action="user_registered",
        user=new_user,
        resource_type="auth",
        resource_id=str(new_user.id),
        details={"role": new_user.role.value, "username": new_user.username},
        request=request,
    )

    access_token = create_access_token(data={"sub": new_user.username, "role": new_user.role.value})
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.from_orm(new_user),
    )


@router.get("/me", response_model=UserResponse)
async def get_my_profile(current_user: User = Depends(get_current_user)):
    """Returns the profile of the currently authenticated user."""
    return UserResponse.from_orm(current_user)


@router.get("/demo-users")
async def get_demo_users():
    """Returns primary demo credentials for quick persona switching."""
    return [
        {"role": "FACULTY", "label": "Dr. Alan Turing (CS Faculty)", "username": "faculty_cs", "password": "Faculty@123", "dept": "Computer Science", "desc": "Reviews CS student indicators and initiates check-in actions."},
        {"role": "MENTOR", "label": "Prof. Grace Hopper (Academic Mentor)", "username": "mentor", "password": "Mentor@123", "dept": "Computer Science", "desc": "Conducts supportive 1-on-1 check-ins and logs outcomes."},
        {"role": "STUDENT", "label": "Aarav Sharma (Student ST101)", "username": "st101", "password": "Student@123", "dept": "Computer Science", "desc": "Privacy-first student view: own engagement habits, no peer comparison."},
        {"role": "FACULTY", "label": "Dr. Ada Lovelace (DS Faculty)", "username": "faculty_ds", "password": "Faculty@123", "dept": "Data Science", "desc": "Manages Data Science student cohorts and reviews sudden shifts."},
        {"role": "FACULTY", "label": "Prof. Tim Berners-Lee (IT Faculty)", "username": "faculty_it", "password": "Faculty@123", "dept": "Information Technology", "desc": "Manages Information Technology cohorts and silent decliners."},
        {"role": "ADMIN", "label": "System Administrator", "username": "admin", "password": "Admin@123", "dept": "Administration", "desc": "System settings, audit trails, and algorithmic fairness audits."},
        {"role": "HOD", "label": "Dr. Katherine Johnson (HoD)", "username": "hod", "password": "Hod@123", "dept": "Computer Science", "desc": "Cohort-level aggregate analytics with minimum cohort privacy protections."},
    ]


@router.get("/all-students-list")
async def get_all_students_for_login(db: Session = Depends(get_db)):
    """Returns directory of all 28 students with their individual login credentials."""
    students = db.query(Student).order_by(Student.id.asc()).all()
    results = []
    for s in students:
        # Find linked user
        user = db.query(User).filter(User.linked_student_id == s.id).first()
        results.append({
            "id": s.id,
            "student_id": s.student_id,
            "name": s.name,
            "department": s.department,
            "year": s.year,
            "semester": s.semester,
            "username": user.username if user else s.student_id.lower(),
            "default_password": "Student@123",
        })
    return results


@router.get("/all-faculty-list")
async def get_all_faculty_for_login(db: Session = Depends(get_db)):
    """Returns directory of all faculty members with login credentials."""
    faculties = db.query(User).filter(User.role == UserRole.FACULTY).all()
    return [
        {
            "id": f.id,
            "name": f.full_name,
            "username": f.username,
            "department": f.department,
            "default_password": "Faculty@123",
        }
        for f in faculties
    ]
