"""
EDU CARD AI — Alert Schemas
"""

from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel
from ..models.alert import AlertState


class AlertOut(BaseModel):
    id: int
    student_id: int
    student_code: Optional[str] = None
    student_name: Optional[str] = None
    department: Optional[str] = None
    week_number: int
    severity: str
    alert_text: str
    signals: Optional[List[Dict[str, Any]]] = None
    state: AlertState
    faculty_id: Optional[int] = None
    faculty_name: Optional[str] = None
    feedback: Optional[str] = None
    is_sudden_change: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AlertStatusUpdate(BaseModel):
    state: AlertState
    feedback: Optional[str] = None


class AlertDismiss(BaseModel):
    reason: str
