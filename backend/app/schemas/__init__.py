"""
EDU CARD AI — Schemas package
"""

from .auth import LoginRequest, TokenResponse, UserResponse
from .student import StudentSummary, StudentDetail, WeeklyRecordOut, FeatureOut, PredictionOut
from .alert import AlertOut, AlertStatusUpdate, AlertDismiss
from .intervention import InterventionCreate, InterventionUpdate, InterventionOut
from .dashboard import DashboardStats, BandDistribution, DashboardSummary
from .analytics import CohortTrendPoint, FeatureImportanceItem, FairnessAuditReport, AuditLogOut, SystemSettingsOut
