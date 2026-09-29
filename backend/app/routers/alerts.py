"""
EDU CARD AI — Alerts Router
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.user import User, UserRole
from ..models.alert import Alert, AlertState
from ..models.student import Student
from ..schemas.alert import AlertOut, AlertStatusUpdate, AlertDismiss
from ..services.auth_service import get_current_user
from ..services.alert_service import alert_service
from ..services.audit_service import log_audit


router = APIRouter(prefix="/alerts", tags=["Alerts"])


@router.get("", response_model=List[AlertOut])
async def list_alerts(
    state: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    student_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Lists alerts with role-based scoping and filtering."""
    query = db.query(Alert).join(Student, Alert.student_id == Student.id)

    # Scoping
    if current_user.role == UserRole.FACULTY and current_user.department:
        query = query.filter(Student.department == current_user.department)
    elif current_user.role == UserRole.STUDENT:
        # Students do not see raw alerts
        return []

    if state and state != "All":
        query = query.filter(Alert.state == AlertState(state.lower()))
    if severity and severity != "All":
        query = query.filter(Alert.severity == severity)
    if student_id:
        query = query.filter(Alert.student_id == student_id)

    alerts = query.order_by(Alert.created_at.desc()).all()

    results = []
    for a in alerts:
        st = a.student
        results.append(
            AlertOut(
                id=a.id,
                student_id=a.student_id,
                student_code=st.student_id if st else None,
                student_name=st.name if st else None,
                department=st.department if st else None,
                week_number=a.week_number,
                severity=a.severity,
                alert_text=a.alert_text,
                signals=a.signals,
                state=a.state,
                faculty_id=a.faculty_id,
                faculty_name=a.faculty.full_name if a.faculty else None,
                feedback=a.feedback,
                is_sudden_change=a.is_sudden_change,
                created_at=a.created_at,
                updated_at=a.updated_at,
            )
        )
    return results


@router.patch("/{alert_id}/status", response_model=AlertOut)
async def update_alert_status(
    alert_id: int,
    payload: AlertStatusUpdate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Transitions alert state (e.g. from new to acknowledged or action_taken)."""
    alert = alert_service.update_alert_state(
        db=db,
        alert_id=alert_id,
        new_state=payload.state,
        user_id=current_user.id,
        feedback=payload.feedback,
    )
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    st = alert.student
    return AlertOut(
        id=alert.id,
        student_id=alert.student_id,
        student_code=st.student_id if st else None,
        student_name=st.name if st else None,
        department=st.department if st else None,
        week_number=alert.week_number,
        severity=alert.severity,
        alert_text=alert.alert_text,
        signals=alert.signals,
        state=alert.state,
        faculty_id=alert.faculty_id,
        faculty_name=alert.faculty.full_name if alert.faculty else None,
        feedback=alert.feedback,
        is_sudden_change=alert.is_sudden_change,
        created_at=alert.created_at,
        updated_at=alert.updated_at,
    )


@router.post("/{alert_id}/dismiss", response_model=AlertOut)
async def dismiss_alert(
    alert_id: int,
    payload: AlertDismiss,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Allows faculty/mentor to dismiss an alert as not relevant, logging human reason."""
    alert = alert_service.update_alert_state(
        db=db,
        alert_id=alert_id,
        new_state=AlertState.DISMISSED,
        user_id=current_user.id,
        feedback=f"Dismissed by faculty: {payload.reason}",
    )
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    st = alert.student
    return AlertOut(
        id=alert.id,
        student_id=alert.student_id,
        student_code=st.student_id if st else None,
        student_name=st.name if st else None,
        department=st.department if st else None,
        week_number=alert.week_number,
        severity=alert.severity,
        alert_text=alert.alert_text,
        signals=alert.signals,
        state=alert.state,
        faculty_id=alert.faculty_id,
        faculty_name=alert.faculty.full_name if alert.faculty else None,
        feedback=alert.feedback,
        is_sudden_change=alert.is_sudden_change,
        created_at=alert.created_at,
        updated_at=alert.updated_at,
    )
