"""
EDU CARD AI — ORM Models Package

All models are imported here so that:
  1. Base.metadata knows about every table for create_all()
  2. Other modules can do: from backend.app.models import Student, Alert, ...
"""

from .user import User, UserRole
from .student import Student
from .weekly_record import WeeklyRecord
from .feature import Feature
from .prediction import Prediction
from .alert import Alert, AlertState
from .intervention import Intervention
from .audit_log import AuditLog
from .sensitive import SensitiveData

__all__ = [
    "User", "UserRole",
    "Student",
    "WeeklyRecord",
    "Feature",
    "Prediction",
    "Alert", "AlertState",
    "Intervention",
    "AuditLog",
    "SensitiveData",
]
