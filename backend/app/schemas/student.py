"""
EDU CARD AI — Student Schemas
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel


class StudentSummary(BaseModel):
    id: int
    student_id: str
    name: str
    department: str
    year: int
    semester: int
    course_id: Optional[str] = None
    latest_indicator_band: Optional[str] = "Low"
    latest_probability: Optional[float] = 0.10
    active_alert_count: int = 0
    attendance_latest: Optional[float] = None
    assignment_latest: Optional[float] = None

    class Config:
        from_attributes = True


class WeeklyRecordOut(BaseModel):
    week_number: int
    attendance_pct: float
    assignment_completion_pct: float
    assessment_score: Optional[float] = None
    lms_logins: int
    active_days: int
    time_spent_minutes: float
    class_participation_score: float

    class Config:
        from_attributes = True


class FeatureOut(BaseModel):
    week_number: int
    attendance_2w_avg: Optional[float] = None
    assignment_2w_avg: Optional[float] = None
    assessment_2w_avg: Optional[float] = None
    activity_2w_avg: Optional[float] = None
    participation_2w_avg: Optional[float] = None
    attendance_4w_slope: Optional[float] = None
    assignment_4w_slope: Optional[float] = None
    attendance_delta_baseline: Optional[float] = None
    assignment_delta_baseline: Optional[float] = None
    activity_delta_baseline: Optional[float] = None
    attendance_delta_median: Optional[float] = None
    consecutive_decline_count: Optional[int] = None
    missed_submission_streak: Optional[int] = None

    class Config:
        from_attributes = True


class PredictionOut(BaseModel):
    week_number: int
    model_name: str
    probability: float
    indicator_band: str
    disclaimer: str
    shap_values: Optional[Dict[str, float]] = None
    explanation_sentences: Optional[List[str]] = None
    what_would_change: Optional[List[str]] = None
    signals_fired: Optional[List[str]] = None
    playbook_suggestions: Optional[List[Dict[str, Any]]] = None

    class Config:
        from_attributes = True


class StudentDetail(BaseModel):
    id: int
    student_id: str
    name: str
    department: str
    year: int
    semester: int
    course_id: Optional[str] = None
    latest_prediction: Optional[PredictionOut] = None
    recent_records: List[WeeklyRecordOut] = []
    active_alerts: List[Dict[str, Any]] = []
    interventions: List[Dict[str, Any]] = []

    class Config:
        from_attributes = True
