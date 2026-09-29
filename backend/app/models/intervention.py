"""
EDU CARD AI — Intervention model

Tracks support actions taken for a student.
All actions are optional and human-reviewed.
"""

from datetime import datetime, timezone

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship

from ..database import Base


class Intervention(Base):
    __tablename__ = "interventions"

    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(Integer, ForeignKey("alerts.id"), nullable=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)

    action_type = Column(String(50), nullable=False)   # e.g. "mentor_discussion", "study_material"
    action_title = Column(String(200), nullable=False)
    action_details = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    outcome = Column(String(200), nullable=True)
    follow_up_date = Column(DateTime, nullable=True)
    status = Column(String(20), default="planned")     # planned, in_progress, completed, cancelled

    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    alert = relationship("Alert", back_populates="interventions")
    student = relationship("Student", back_populates="interventions")
    created_by_user = relationship("User", back_populates="interventions_created")

    def __repr__(self):
        return f"<Intervention id={self.id} type={self.action_type} status={self.status}>"
