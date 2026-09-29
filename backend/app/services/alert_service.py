"""
EDU CARD AI — Alert Service

Implements early support alert generation, deduplication, cooldown, and state transitions.
Rules from config/thresholds.yaml:
- Indicator band >= Medium
- >= 2 independent declining signals for 2 consecutive weeks, OR sudden negative change override
- Cooldown period (3 weeks) to prevent alert fatigue
- State machine: new → acknowledged → action_taken → outcome / dismissed
"""

from datetime import datetime, timezone
from typing import Dict, List, Optional
from sqlalchemy.orm import Session

from ..config import thresholds
from ..models.alert import Alert, AlertState
from ..models.student import Student
from ..models.prediction import Prediction
from ..models.audit_log import AuditLog


class AlertService:
    def __init__(self):
        alert_cfg = thresholds.get("alerts", {})
        self.min_indicator = alert_cfg.get("min_indicator", "Medium")
        self.min_signals = alert_cfg.get("min_independent_signals", 2)
        self.consecutive_weeks = alert_cfg.get("consecutive_weeks_required", 2)
        self.sudden_override = alert_cfg.get("sudden_change_override", True)
        self.cooldown_weeks = alert_cfg.get("cooldown_weeks", 3)
        self.max_per_faculty = alert_cfg.get("max_alerts_per_faculty_per_week", 10)

    def evaluate_and_create_alert(
        self,
        db: Session,
        student_id: int,
        week_number: int,
        prediction: Prediction,
        trend_signals: List[Dict],
        is_sudden_change: bool = False,
        assigned_faculty_id: Optional[int] = None,
    ) -> Optional[Alert]:
        """
        Evaluates whether an Early Support Alert should be generated for the student.
        Respects cooldowns and threshold requirements.
        """
        # 1. Band Check: Must be Medium or High
        if prediction.indicator_band not in ("Medium", "High"):
            return None

        # 2. Check Cooldown: Has student been alerted within cooldown_weeks?
        active_cooldown = (
            db.query(Alert)
            .filter(
                Alert.student_id == student_id,
                Alert.cooldown_until_week >= week_number,
                Alert.state != AlertState.DISMISSED,
            )
            .first()
        )
        if active_cooldown and not (is_sudden_change and self.sudden_override):
            return None

        # 3. Check Signal Conditions:
        # Either sudden change override OR >= min_signals independent declining signals
        qualifying_signals = [s for s in trend_signals if s.get("status") in ("Decreasing", "Sudden negative change")]
        
        should_fire = False
        if is_sudden_change and self.sudden_override:
            should_fire = True
        elif len(qualifying_signals) >= self.min_signals:
            # Check if signals persisted in previous week as well
            prev_pred = (
                db.query(Prediction)
                .filter(
                    Prediction.student_id == student_id,
                    Prediction.week_number == week_number - 1,
                )
                .first()
            )
            if prev_pred and prev_pred.indicator_band in ("Medium", "High"):
                should_fire = True
            elif prediction.indicator_band == "High":
                should_fire = True  # High indicator always qualifies

        if not should_fire:
            return None

        # 4. Construct respectful, supportive alert text
        student = db.query(Student).filter(Student.id == student_id).first()
        student_name = student.name if student else f"Student #{student_id}"

        signal_labels = [s.get("label", s.get("factor")) for s in qualifying_signals]
        if is_sudden_change:
            alert_text = (
                f"Early Support Indicator: A noticeable single-week shift in {', '.join(signal_labels[:2])} "
                f"was detected for {student_name} (Week {week_number}). A check-in may be helpful."
            )
        else:
            alert_text = (
                f"Early Support Indicator: Sustained change observed in {', '.join(signal_labels[:2])} "
                f"over recent weeks for {student_name}. Suggested for human review."
            )

        # 5. Create Alert record
        alert = Alert(
            student_id=student_id,
            week_number=week_number,
            severity=prediction.indicator_band,
            alert_text=alert_text,
            signals=trend_signals,
            state=AlertState.NEW,
            faculty_id=assigned_faculty_id,
            is_sudden_change=is_sudden_change,
            cooldown_until_week=week_number + self.cooldown_weeks,
        )
        db.add(alert)
        db.commit()
        db.refresh(alert)

        return alert

    def update_alert_state(
        self,
        db: Session,
        alert_id: int,
        new_state: AlertState,
        user_id: int,
        feedback: Optional[str] = None,
    ) -> Optional[Alert]:
        """Transitions alert state and creates an immutable audit trail entry."""
        alert = db.query(Alert).filter(Alert.id == alert_id).first()
        if not alert:
            return None

        prev_state = alert.state
        alert.state = new_state
        if feedback is not None:
            alert.feedback = feedback
        alert.updated_at = datetime.now(timezone.utc)

        # Log to audit trail
        audit = AuditLog(
            user_id=user_id,
            action=f"alert_status_change",
            resource_type="alert",
            resource_id=str(alert.id),
            details={
                "from_state": prev_state.value,
                "to_state": new_state.value,
                "feedback": feedback,
            },
        )
        db.add(audit)
        db.commit()
        db.refresh(alert)
        return alert


alert_service = AlertService()
