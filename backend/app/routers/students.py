"""
EDU CARD AI — Students Router
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.user import User, UserRole
from ..models.student import Student
from ..models.weekly_record import WeeklyRecord
from ..models.feature import Feature
from ..models.prediction import Prediction
from ..models.alert import Alert, AlertState
from ..models.intervention import Intervention
from ..schemas.student import (
    StudentSummary,
    StudentDetail,
    WeeklyRecordOut,
    FeatureOut,
    PredictionOut,
)
from ..services.auth_service import get_current_user
from ..services.audit_service import log_audit
from ..services.trend_service import trend_service
from ..services.explanation_service import explanation_service
from ..config import DISCLAIMER


router = APIRouter(prefix="/students", tags=["Students"])


@router.get("", response_model=List[StudentSummary])
async def list_students(
    department: Optional[str] = Query(None),
    indicator_band: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns list of students with RBAC scoping:
    - Student role can ONLY see their own record.
    - Faculty role is scoped to their department.
    - HoD and Admin can view all.
    """
    query = db.query(Student)

    # RBAC Enforcement
    if current_user.role == UserRole.STUDENT:
        if not current_user.linked_student_id:
            return []
        query = query.filter(Student.id == current_user.linked_student_id)
    elif current_user.role == UserRole.FACULTY and current_user.department:
        query = query.filter(Student.department == current_user.department)

    # Department filter
    if department and department != "All":
        query = query.filter(Student.department == department)

    # Search filter
    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            (Student.name.ilike(search_fmt)) |
            (Student.student_id.ilike(search_fmt)) |
            (Student.department.ilike(search_fmt))
        )

    students = query.all()
    active_demo_week = 8

    results = []
    for s in students:
        # Get latest prediction
        latest_pred = (
            db.query(Prediction)
            .filter(Prediction.student_id == s.id, Prediction.week_number == active_demo_week)
            .first()
        )
        band = latest_pred.indicator_band if latest_pred else "Low"
        prob = latest_pred.probability if latest_pred else 0.10

        # Filter by indicator band if requested
        if indicator_band and indicator_band != "All" and band != indicator_band:
            continue

        # Get latest weekly record
        latest_rec = (
            db.query(WeeklyRecord)
            .filter(WeeklyRecord.student_id == s.id, WeeklyRecord.week_number == active_demo_week)
            .first()
        )

        alert_count = (
            db.query(Alert)
            .filter(
                Alert.student_id == s.id,
                Alert.state.in_([AlertState.NEW, AlertState.ACKNOWLEDGED]),
            )
            .count()
        )

        # For student role, do not expose indicator band to prevent anxiety
        display_band = "Standard" if current_user.role == UserRole.STUDENT else band
        display_prob = None if current_user.role == UserRole.STUDENT else prob

        results.append(
            StudentSummary(
                id=s.id,
                student_id=s.student_id,
                name=s.name,
                department=s.department,
                year=s.year,
                semester=s.semester,
                course_id=s.course_id,
                latest_indicator_band=display_band,
                latest_probability=display_prob,
                active_alert_count=alert_count,
                attendance_latest=latest_rec.attendance_pct if latest_rec else None,
                assignment_latest=latest_rec.assignment_completion_pct if latest_rec else None,
            )
        )

    return results


@router.get("/{student_id}", response_model=StudentDetail)
async def get_student_detail(
    student_id: int,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns complete profile and engagement context for a student.
    Strictly audited for privacy and compliance.
    """
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # RBAC Check
    if current_user.role == UserRole.STUDENT and current_user.linked_student_id != student.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are only permitted to view your own academic profile.",
        )
    if current_user.role == UserRole.FACULTY and current_user.department and student.department != current_user.department:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted: student belongs to another department.",
        )

    # Audit log this profile access
    log_audit(
        db=db,
        action="view_student_profile",
        user=current_user,
        resource_type="student",
        resource_id=str(student.id),
        details={"student_code": student.student_id, "department": student.department},
        request=request,
    )

    active_demo_week = 8

    # Fetch latest prediction
    pred = (
        db.query(Prediction)
        .filter(Prediction.student_id == student.id, Prediction.week_number == active_demo_week)
        .first()
    )

    pred_out = None
    if pred:
        # Extract playbook suggestions
        signals = pred.signals_fired or []
        suggestions = explanation_service.get_playbook_suggestions_for_factors(signals)

        band_label = "Standard" if current_user.role == UserRole.STUDENT else pred.indicator_band
        prob_val = 0.0 if current_user.role == UserRole.STUDENT else pred.probability

        pred_out = PredictionOut(
            week_number=pred.week_number,
            model_name=pred.model_name,
            probability=prob_val,
            indicator_band=band_label,
            disclaimer=DISCLAIMER,
            shap_values=pred.shap_values,
            explanation_sentences=pred.explanation_sentences,
            what_would_change=pred.what_would_change,
            signals_fired=pred.signals_fired,
            playbook_suggestions=suggestions,
        )

    # Fetch recent records (last 6 weeks)
    records = (
        db.query(WeeklyRecord)
        .filter(WeeklyRecord.student_id == student.id)
        .order_by(WeeklyRecord.week_number.desc())
        .limit(6)
        .all()
    )
    records.reverse()

    # Fetch alerts
    alerts = (
        db.query(Alert)
        .filter(Alert.student_id == student.id)
        .order_by(Alert.week_number.desc())
        .all()
    )
    alerts_data = [
        {
            "id": a.id,
            "severity": a.severity,
            "state": a.state.value,
            "alert_text": a.alert_text,
            "week_number": a.week_number,
            "signals": a.signals,
            "created_at": a.created_at.isoformat(),
        }
        for a in alerts
    ]

    # Fetch interventions
    interventions = (
        db.query(Intervention)
        .filter(Intervention.student_id == student.id)
        .order_by(Intervention.created_at.desc())
        .all()
    )
    intv_data = [
        {
            "id": i.id,
            "action_type": i.action_type,
            "action_title": i.action_title,
            "action_details": i.action_details,
            "status": i.status,
            "outcome": i.outcome,
            "created_at": i.created_at.isoformat(),
        }
        for i in interventions
    ]

    return StudentDetail(
        id=student.id,
        student_id=student.student_id,
        name=student.name,
        department=student.department,
        year=student.year,
        semester=student.semester,
        course_id=student.course_id,
        latest_prediction=pred_out,
        recent_records=[WeeklyRecordOut.from_orm(r) for r in records],
        active_alerts=alerts_data,
        interventions=intv_data,
    )


@router.get("/{student_id}/history", response_model=List[WeeklyRecordOut])
async def get_student_history(
    student_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Returns complete 16-week timeline of engagement records for charts."""
    records = (
        db.query(WeeklyRecord)
        .filter(WeeklyRecord.student_id == student_id)
        .order_by(WeeklyRecord.week_number.asc())
        .all()
    )
    return [WeeklyRecordOut.from_orm(r) for r in records]


@router.get("/{student_id}/features", response_model=List[FeatureOut])
async def get_student_features(
    student_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Returns engineered feature timeline for a student."""
    features = (
        db.query(Feature)
        .filter(Feature.student_id == student_id)
        .order_by(Feature.week_number.asc())
        .all()
    )
    return [FeatureOut.from_orm(f) for f in features]


@router.get("/{student_id}/trends")
async def get_student_trends(
    student_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Calculates statistical EWMA, CUSUM, baseline Z-scores and trend classifications."""
    records = (
        db.query(WeeklyRecord)
        .filter(WeeklyRecord.student_id == student_id)
        .order_by(WeeklyRecord.week_number.asc())
        .all()
    )
    recs_dict = [
        {
            "week_number": r.week_number,
            "attendance_pct": r.attendance_pct,
            "assignment_completion_pct": r.assignment_completion_pct,
            "assessment_score": r.assessment_score,
            "lms_logins": r.lms_logins,
            "class_participation_score": r.class_participation_score,
            "time_spent_minutes": r.time_spent_minutes,
        }
        for r in records
    ]
    analysis = trend_service.analyze_student_trends(recs_dict)
    return analysis
