"""
EDU CARD AI — Student model

Non-sensitive academic profile only.
Demographics are stored separately in SensitiveData (fairness audit only).
"""

from datetime import datetime, timezone

from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship

from ..database import Base


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String(20), unique=True, index=True, nullable=False)  # e.g. "ST101"
    name = Column(String(100), nullable=False)
    department = Column(String(100), nullable=False)
    year = Column(Integer, nullable=False)
    semester = Column(Integer, nullable=False)
    course_id = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    weekly_records = relationship(
        "WeeklyRecord", back_populates="student",
        order_by="WeeklyRecord.week_number", cascade="all, delete-orphan",
    )
    features = relationship(
        "Feature", back_populates="student",
        order_by="Feature.week_number", cascade="all, delete-orphan",
    )
    predictions = relationship(
        "Prediction", back_populates="student",
        order_by="Prediction.week_number", cascade="all, delete-orphan",
    )
    alerts = relationship("Alert", back_populates="student", cascade="all, delete-orphan")
    interventions = relationship("Intervention", back_populates="student", cascade="all, delete-orphan")
    sensitive_data = relationship(
        "SensitiveData", back_populates="student", uselist=False, cascade="all, delete-orphan",
    )

    def __repr__(self):
        return f"<Student {self.student_id}: {self.name}>"
