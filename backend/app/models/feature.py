"""
EDU CARD AI — Feature model

Engineered features computed per student per week.
Only uses data up to that week (no future leakage).
"""

from datetime import datetime, timezone

from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship

from ..database import Base


class Feature(Base):
    __tablename__ = "features"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    week_number = Column(Integer, nullable=False)

    # ── 2-week rolling averages ──────────────────────────────────
    attendance_2w_avg = Column(Float)
    assignment_2w_avg = Column(Float)
    assessment_2w_avg = Column(Float)
    activity_2w_avg = Column(Float)
    participation_2w_avg = Column(Float)

    # ── 4-week slopes (linear regression coefficient) ────────────
    attendance_4w_slope = Column(Float)
    assignment_4w_slope = Column(Float)
    assessment_4w_slope = Column(Float)
    activity_4w_slope = Column(Float)
    participation_4w_slope = Column(Float)

    # ── Volatility (std dev over trailing 4 weeks) ───────────────
    attendance_volatility = Column(Float)
    assignment_volatility = Column(Float)
    assessment_volatility = Column(Float)

    # ── Delta vs personal baseline (first 3 weeks) ──────────────
    attendance_delta_baseline = Column(Float)
    assignment_delta_baseline = Column(Float)
    assessment_delta_baseline = Column(Float)
    activity_delta_baseline = Column(Float)
    participation_delta_baseline = Column(Float)

    # ── Delta vs class median (same week) ────────────────────────
    attendance_delta_median = Column(Float)
    assignment_delta_median = Column(Float)
    assessment_delta_median = Column(Float)
    activity_delta_median = Column(Float)
    participation_delta_median = Column(Float)

    # ── Streak / count features ──────────────────────────────────
    consecutive_decline_count = Column(Integer)
    missed_submission_streak = Column(Integer)
    late_submission_rate = Column(Float)
    score_drop_vs_previous = Column(Float)
    days_since_last_activity = Column(Integer)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    student = relationship("Student", back_populates="features")

    __table_args__ = (
        UniqueConstraint("student_id", "week_number", name="uq_feature_student_week"),
    )

    def __repr__(self):
        return f"<Feature student={self.student_id} week={self.week_number}>"
