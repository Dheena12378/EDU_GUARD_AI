"""
EDU CARD AI — Dashboard Router
"""

from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from ..models.user import User, UserRole
from ..models.student import Student
from ..models.prediction import Prediction
from ..models.alert import Alert, AlertState
from ..models.intervention import Intervention
from ..models.weekly_record import WeeklyRecord
from ..services.auth_service import get_current_user
from ..schemas.dashboard import DashboardSummary, DashboardStats, BandDistribution


router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary", response_model=DashboardSummary)
async def get_dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns high-level KPI stats, indicator band distribution, and urgent alert feeds
    tailored to the user's role and departmental scope.
    """
    # 1. Scope query based on role
    student_query = db.query(Student)
    if current_user.role == UserRole.FACULTY and current_user.department:
        student_query = student_query.filter(Student.department == current_user.department)
    elif current_user.role == UserRole.STUDENT and current_user.linked_student_id:
        student_query = student_query.filter(Student.id == current_user.linked_student_id)

    students = student_query.all()
    student_ids = [s.id for s in students]
    total_students = len(students)

    active_demo_week = 8

    # 2. Get latest predictions (week 8)
    preds = (
        db.query(Prediction)
        .filter(
            Prediction.student_id.in_(student_ids),
            Prediction.week_number == active_demo_week,
        )
        .all()
    ) if student_ids else []

    low_count = sum(1 for p in preds if p.indicator_band == "Low")
    med_count = sum(1 for p in preds if p.indicator_band == "Medium")
    high_count = sum(1 for p in preds if p.indicator_band == "High")

    # If some students don't have predictions yet, count as low
    unpred = total_students - len(preds)
    if unpred > 0:
        low_count += unpred

    # 3. Active alerts
    alert_query = db.query(Alert).filter(
        Alert.student_id.in_(student_ids),
        Alert.state.in_([AlertState.NEW, AlertState.ACKNOWLEDGED, AlertState.ACTION_TAKEN]),
    )
    active_alerts = alert_query.all()
    active_alert_count = len(active_alerts)

    # 4. Interventions count
    intv_query = db.query(Intervention).filter(Intervention.student_id.in_(student_ids))
    completed_intv_count = intv_query.filter(Intervention.status == "completed").count()

    # 5. Cohort engagement averages
    recent_recs = (
        db.query(WeeklyRecord)
        .filter(
            WeeklyRecord.student_id.in_(student_ids),
            WeeklyRecord.week_number == active_demo_week,
        )
        .all()
    ) if student_ids else []

    avg_att = (
        float(sum(r.attendance_pct for r in recent_recs) / len(recent_recs))
        if recent_recs
        else 86.4
    )
    avg_assign = (
        float(sum(r.assignment_completion_pct for r in recent_recs) / len(recent_recs))
        if recent_recs
        else 84.1
    )

    # Indicator Band Distribution (Colour-blind safe: Teal/Emerald for Low, Amber for Medium, Royal Purple for High)
    denom = max(1, total_students)
    distribution = [
        BandDistribution(
            band="Low",
            count=low_count,
            percentage=round((low_count / denom) * 100, 1),
            color="#10B981",  # Emerald/Teal
        ),
        BandDistribution(
            band="Medium",
            count=med_count,
            percentage=round((med_count / denom) * 100, 1),
            color="#F59E0B",  # Amber
        ),
        BandDistribution(
            band="High",
            count=high_count,
            percentage=round((high_count / denom) * 100, 1),
            color="#8B5CF6",  # Royal Purple (Safe & Non-punitive)
        ),
    ]

    # Urgent Alerts feed
    urgent_alerts_data = []
    for a in active_alerts[:5]:
        st = next((s for s in students if s.id == a.student_id), None)
        urgent_alerts_data.append({
            "id": a.id,
            "student_id": a.student_id,
            "student_name": st.name if st else f"Student #{a.student_id}",
            "student_code": st.student_id if st else "",
            "department": st.department if st else "",
            "severity": a.severity,
            "alert_text": a.alert_text,
            "state": a.state.value,
            "week_number": a.week_number,
            "is_sudden_change": a.is_sudden_change,
            "created_at": a.created_at.isoformat(),
        })

    # Recent interventions feed
    recent_intvs = (
        db.query(Intervention)
        .filter(Intervention.student_id.in_(student_ids))
        .order_by(Intervention.created_at.desc())
        .limit(5)
        .all()
    ) if student_ids else []

    recent_intvs_data = []
    for inv in recent_intvs:
        st = next((s for s in students if s.id == inv.student_id), None)
        recent_intvs_data.append({
            "id": inv.id,
            "student_name": st.name if st else "",
            "action_title": inv.action_title,
            "action_type": inv.action_type,
            "status": inv.status,
            "outcome": inv.outcome,
            "created_at": inv.created_at.isoformat(),
        })

    return DashboardSummary(
        stats=DashboardStats(
            total_students=total_students,
            low_indicator_count=low_count,
            medium_indicator_count=med_count,
            high_indicator_count=high_count,
            active_alerts_count=active_alert_count,
            completed_interventions_count=completed_intv_count,
            average_attendance=round(avg_att, 1),
            average_assignment_completion=round(avg_assign, 1),
            active_semester_week=active_demo_week,
        ),
        distribution=distribution,
        urgent_alerts=urgent_alerts_data,
        recent_interventions=recent_intvs_data,
    )
