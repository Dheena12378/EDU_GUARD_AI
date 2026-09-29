"""
EDU CARD AI — Interventions Router
"""

from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.user import User, UserRole
from ..models.intervention import Intervention
from ..models.alert import Alert, AlertState
from ..models.student import Student
from ..schemas.intervention import InterventionCreate, InterventionUpdate, InterventionOut
from ..services.auth_service import get_current_user
from ..services.audit_service import log_audit


router = APIRouter(prefix="/interventions", tags=["Interventions"])


@router.get("", response_model=List[InterventionOut])
async def list_interventions(
    student_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Lists support interventions created by faculty and mentors."""
    query = db.query(Intervention).join(Student, Intervention.student_id == Student.id)

    if current_user.role == UserRole.FACULTY and current_user.department:
        query = query.filter(Student.department == current_user.department)
    elif current_user.role == UserRole.STUDENT and current_user.linked_student_id:
        query = query.filter(Intervention.student_id == current_user.linked_student_id)

    if student_id:
        query = query.filter(Intervention.student_id == student_id)

    items = query.order_by(Intervention.created_at.desc()).all()

    results = []
    for inv in items:
        results.append(
            InterventionOut(
                id=inv.id,
                student_id=inv.student_id,
                student_name=inv.student.name if inv.student else None,
                alert_id=inv.alert_id,
                action_type=inv.action_type,
                action_title=inv.action_title,
                action_details=inv.action_details,
                notes=inv.notes,
                outcome=inv.outcome,
                follow_up_date=inv.follow_up_date,
                status=inv.status,
                created_by_id=inv.created_by_id,
                created_by_name=inv.created_by_user.full_name if inv.created_by_user else None,
                created_at=inv.created_at,
                updated_at=inv.updated_at,
            )
        )
    return results


@router.post("", response_model=InterventionOut)
async def create_intervention(
    payload: InterventionCreate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Creates a new human-reviewed supportive intervention."""
    student = db.query(Student).filter(Student.id == payload.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    inv = Intervention(
        student_id=payload.student_id,
        alert_id=payload.alert_id,
        action_type=payload.action_type,
        action_title=payload.action_title,
        action_details=payload.action_details,
        notes=payload.notes,
        status="planned",
        follow_up_date=payload.follow_up_date,
        created_by_id=current_user.id,
    )
    db.add(inv)

    # If linked to an alert, transition alert state to ACTION_TAKEN
    if payload.alert_id:
        alert = db.query(Alert).filter(Alert.id == payload.alert_id).first()
        if alert:
            alert.state = AlertState.ACTION_TAKEN

    db.commit()
    db.refresh(inv)

    log_audit(
        db=db,
        action="create_intervention",
        user=current_user,
        resource_type="intervention",
        resource_id=str(inv.id),
        details={"student_id": payload.student_id, "action_type": payload.action_type},
        request=request,
    )

    return InterventionOut(
        id=inv.id,
        student_id=inv.student_id,
        student_name=student.name,
        alert_id=inv.alert_id,
        action_type=inv.action_type,
        action_title=inv.action_title,
        action_details=inv.action_details,
        notes=inv.notes,
        outcome=inv.outcome,
        follow_up_date=inv.follow_up_date,
        status=inv.status,
        created_by_id=inv.created_by_id,
        created_by_name=current_user.full_name,
        created_at=inv.created_at,
        updated_at=inv.updated_at,
    )


@router.patch("/{intervention_id}", response_model=InterventionOut)
async def update_intervention(
    intervention_id: int,
    payload: InterventionUpdate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Updates status, notes, or outcome of an intervention."""
    inv = db.query(Intervention).filter(Intervention.id == intervention_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Intervention not found")

    if payload.status:
        inv.status = payload.status
        # If status marked completed and linked to alert, mark alert as OUTCOME
        if payload.status == "completed" and inv.alert_id:
            alert = db.query(Alert).filter(Alert.id == inv.alert_id).first()
            if alert:
                alert.state = AlertState.OUTCOME

    if payload.outcome:
        inv.outcome = payload.outcome
    if payload.notes:
        inv.notes = payload.notes
    if payload.follow_up_date:
        inv.follow_up_date = payload.follow_up_date

    inv.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(inv)

    log_audit(
        db=db,
        action="update_intervention",
        user=current_user,
        resource_type="intervention",
        resource_id=str(inv.id),
        details={"status": inv.status, "outcome": inv.outcome},
        request=request,
    )

    return InterventionOut(
        id=inv.id,
        student_id=inv.student_id,
        student_name=inv.student.name if inv.student else None,
        alert_id=inv.alert_id,
        action_type=inv.action_type,
        action_title=inv.action_title,
        action_details=inv.action_details,
        notes=inv.notes,
        outcome=inv.outcome,
        follow_up_date=inv.follow_up_date,
        status=inv.status,
        created_by_id=inv.created_by_id,
        created_by_name=inv.created_by_user.full_name if inv.created_by_user else None,
        created_at=inv.created_at,
        updated_at=inv.updated_at,
    )
