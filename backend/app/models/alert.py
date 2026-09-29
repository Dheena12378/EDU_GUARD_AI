"""
EDU CARD AI — Alert model

State machine: New → Acknowledged → Action Taken → Outcome / Dismissed
Alerts fire when indicator >= Medium AND conditions are met.
"""

import enum
from datetime import datetime, timezone

from sqlalchemy import (
    Column, Integer, String, DateTime, ForeignKey, JSON, Boolean,
    Enum as SQLEnum,
)
from sqlalchemy.orm import relationship

from ..database import Base


class AlertState(str, enum.Enum):
    NEW = "new"
    ACKNOWLEDGED = "acknowledged"
    ACTION_TAKEN = "action_taken"
    OUTCOME = "outcome"
    DISMISSED = "dismissed"


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    week_number = Column(Integer, nullable=False)

    severity = Column(String(10), nullable=False)      # "Medium" or "High"
    alert_text = Column(String(500), nullable=False)
    signals = Column(JSON)                             # Signals that triggered the alert
    state = Column(SQLEnum(AlertState), default=AlertState.NEW)
    faculty_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    feedback = Column(String(500), nullable=True)      # Faculty notes on relevance
    is_sudden_change = Column(Boolean, default=False)
    cooldown_until_week = Column(Integer, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    student = relationship("Student", back_populates="alerts")
    faculty = relationship("User", back_populates="alerts_assigned", foreign_keys=[faculty_id])
    interventions = relationship("Intervention", back_populates="alert")

    def __repr__(self):
        return f"<Alert id={self.id} student={self.student_id} severity={self.severity} state={self.state.value}>"
