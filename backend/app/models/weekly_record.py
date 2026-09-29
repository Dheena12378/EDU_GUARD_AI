"""
EDU CARD AI — WeeklyRecord model

Raw weekly engagement data per student.
One record per student per week.
"""

from datetime import datetime, timezone

from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship

from ..database import Base


class WeeklyRecord(Base):
    __tablename__ = "weekly_records"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    week_number = Column(Integer, nullable=False)

    # Core engagement metrics
    attendance_pct = Column(Float)             # 0–100
    assignment_completion_pct = Column(Float)   # 0–100
    assessment_score = Column(Float)            # 0–100 (NULL if no assessment)
    lms_logins = Column(Integer)                # Number of LMS logins that week
    active_days = Column(Integer)               # Days with any activity (0–7)
    time_spent_minutes = Column(Float)          # Total time on LMS
    class_participation_score = Column(Float)   # 0–10 scale

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    student = relationship("Student", back_populates="weekly_records")

    __table_args__ = (
        UniqueConstraint("student_id", "week_number", name="uq_weekly_student_week"),
    )

    def __repr__(self):
        return f"<WeeklyRecord student={self.student_id} week={self.week_number}>"
