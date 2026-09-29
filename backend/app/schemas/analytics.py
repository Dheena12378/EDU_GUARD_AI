"""
EDU CARD AI — Analytics & Admin Schemas
"""

from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel


class CohortTrendPoint(BaseModel):
    week_number: int
    avg_attendance: float
    avg_assignment: float
    avg_logins: float
    avg_time_spent: float
    avg_score: float


class FeatureImportanceItem(BaseModel):
    feature: str
    display_name: str
    importance: float
    category: str


class FairnessAuditGroup(BaseModel):
    group_name: str
    sample_size: int
    selection_rate: float
    disparate_impact_ratio: float
    status: str


class FairnessAuditReport(BaseModel):
    metric: str
    audit_date: datetime
    overall_fairness: str
    categories: List[FairnessAuditGroup]
    genders: List[FairnessAuditGroup]
    socioeconomic_bands: List[FairnessAuditGroup]
    compliance_notes: str


class AuditLogOut(BaseModel):
    id: int
    user_id: Optional[int] = None
    username: Optional[str] = None
    action: str
    resource_type: Optional[str] = None
    resource_id: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True


class SystemSettingsOut(BaseModel):
    thresholds: Dict[str, Any]
    banned_words: List[str]
    disclaimer: str
    active_models: List[str]
