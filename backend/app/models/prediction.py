"""
EDU CARD AI — Prediction model

Stores model outputs: calibrated probability, indicator band,
SHAP values, plain-language explanations, and signals fired.
"""

from datetime import datetime, timezone

from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey, UniqueConstraint, JSON
from sqlalchemy.orm import relationship

from ..database import Base


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    week_number = Column(Integer, nullable=False)

    model_name = Column(String(50))        # "random_forest", "xgboost", "logistic_regression", "rule_baseline"
    probability = Column(Float)            # Calibrated probability [0, 1]
    indicator_band = Column(String(10))    # "Low", "Medium", "High"

    # SHAP explanations
    shap_values = Column(JSON)             # {"feature_name": shap_value, ...}
    explanation_sentences = Column(JSON)   # ["Attendance decreased from 90% to 68%", ...]
    what_would_change = Column(JSON)       # ["If attendance increased to 80%..."]

    # Trend signals that fired this week
    signals_fired = Column(JSON)           # ["attendance_decline", "assignment_zscore", ...]

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    student = relationship("Student", back_populates="predictions")

    __table_args__ = (
        UniqueConstraint(
            "student_id", "week_number", "model_name",
            name="uq_pred_student_week_model",
        ),
    )

    def __repr__(self):
        return f"<Prediction student={self.student_id} week={self.week_number} band={self.indicator_band}>"
