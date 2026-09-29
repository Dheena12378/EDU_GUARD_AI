"""
EDU CARD AI — Dashboard Schemas
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel


class DashboardStats(BaseModel):
    total_students: int
    low_indicator_count: int
    medium_indicator_count: int
    high_indicator_count: int
    active_alerts_count: int
    completed_interventions_count: int
    average_attendance: float
    average_assignment_completion: float
    active_semester_week: int = 8


class BandDistribution(BaseModel):
    band: str
    count: int
    percentage: float
    color: str


class DashboardSummary(BaseModel):
    stats: DashboardStats
    distribution: List[BandDistribution]
    urgent_alerts: List[Dict[str, Any]]
    recent_interventions: List[Dict[str, Any]]
