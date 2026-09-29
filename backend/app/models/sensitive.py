"""
EDU CARD AI — SensitiveData model

Demographic/sensitive attributes stored in a SEPARATE table.
NEVER used as model features — only for fairness auditing.
Access restricted to Admin role.
"""

from datetime import datetime, timezone

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from ..database import Base


class SensitiveData(Base):
    __tablename__ = "sensitive_data"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), unique=True, nullable=False)

    # Demographic attributes — fairness audit ONLY
    gender = Column(String(20), nullable=True)
    category = Column(String(50), nullable=True)        # For fairness group analysis
    socioeconomic_band = Column(String(20), nullable=True)
    disability_flag = Column(Integer, default=0)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    student = relationship("Student", back_populates="sensitive_data")

    def __repr__(self):
        return f"<SensitiveData student={self.student_id}>"
