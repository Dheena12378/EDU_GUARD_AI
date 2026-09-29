"""
EDU CARD AI — User model

Roles: admin, faculty, mentor, student, hod
Passwords stored as bcrypt hashes.
"""

import enum
from datetime import datetime, timezone

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import relationship

from ..database import Base


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    FACULTY = "faculty"
    MENTOR = "mentor"
    STUDENT = "student"
    HOD = "hod"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=True)
    role = Column(SQLEnum(UserRole), nullable=False)
    department = Column(String(100), nullable=True)
    # If role == STUDENT, link to student record
    linked_student_id = Column(Integer, ForeignKey("students.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    alerts_assigned = relationship(
        "Alert", back_populates="faculty",
        foreign_keys="Alert.faculty_id",
    )
    interventions_created = relationship(
        "Intervention", back_populates="created_by_user",
    )
    audit_logs = relationship("AuditLog", back_populates="user")

    def __repr__(self):
        return f"<User {self.username} ({self.role.value})>"
