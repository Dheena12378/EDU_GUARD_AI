"""
EDU CARD AI — Alert Rules Automated Test Suite

Tests alert firing criteria, sudden change override, and cooldown protection.
"""

import pytest
from backend.app.database import SessionLocal
from backend.app.models.prediction import Prediction
from backend.app.models.student import Student
from backend.app.services.alert_service import alert_service


@pytest.fixture
def db():
    session = SessionLocal()
    yield session
    session.close()


def test_low_indicator_never_triggers_alert(db):
    student = db.query(Student).first()
    student_id = student.id if student else 1
    pred = Prediction(
        student_id=student_id,
        week_number=15,
        model_name="test",
        probability=0.15,
        indicator_band="Low",
    )
    signals = [{"factor": "attendance_pct", "status": "Stable", "delta": 0.0}]
    alert = alert_service.evaluate_and_create_alert(
        db=db,
        student_id=student_id,
        week_number=15,
        prediction=pred,
        trend_signals=signals,
        is_sudden_change=False,
    )
    assert alert is None


def test_sudden_change_fires_alert(db):
    student = db.query(Student).first()
    student_id = student.id if student else 1
    pred = Prediction(
        student_id=student_id,
        week_number=16,
        model_name="test",
        probability=0.65,
        indicator_band="High",
    )
    signals = [{"factor": "attendance_pct", "status": "Sudden negative change", "delta": -25.0}]
    alert = alert_service.evaluate_and_create_alert(
        db=db,
        student_id=student_id,
        week_number=16,
        prediction=pred,
        trend_signals=signals,
        is_sudden_change=True,
    )
    assert alert is not None
    assert alert.severity == "High"
    assert alert.is_sudden_change is True
    assert alert.cooldown_until_week == 16 + alert_service.cooldown_weeks
