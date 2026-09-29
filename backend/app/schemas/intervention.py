"""
EDU CARD AI — Intervention Schemas
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class InterventionCreate(BaseModel):
    student_id: int
    alert_id: Optional[int] = None
    action_type: str
    action_title: str
    action_details: Optional[str] = None
    notes: Optional[str] = None
    follow_up_date: Optional[datetime] = None


class InterventionUpdate(BaseModel):
    status: Optional[str] = None
    outcome: Optional[str] = None
    notes: Optional[str] = None
    follow_up_date: Optional[datetime] = None


class InterventionOut(BaseModel):
    id: int
    student_id: int
    student_name: Optional[str] = None
    alert_id: Optional[int] = None
    action_type: str
    action_title: str
    action_details: Optional[str] = None
    notes: Optional[str] = None
    outcome: Optional[str] = None
    follow_up_date: Optional[datetime] = None
    status: str
    created_by_id: int
    created_by_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
