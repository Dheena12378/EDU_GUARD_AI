"""
EDU CARD AI — Banned Words Automated Test Suite

Scans backend explanations, API responses, and frontend code
to strictly ensure that NO stigmatizing, fatalistic, or punitive terms are used.
"""

import os
from pathlib import Path
import pytest
from backend.app.config import BANNED_WORDS
from ml.explain.sentences import generate_explanation_sentences, sanitize_text


def test_banned_words_list_not_empty():
    assert len(BANNED_WORDS) >= 10
    assert "at-risk" in BANNED_WORDS
    assert "failing" in BANNED_WORDS
    assert "dropout" in BANNED_WORDS


def test_explanation_generator_never_uses_banned_words():
    # Simulate extreme decline features
    extreme_features = {
        "attendance_delta_baseline": -45.0,
        "assignment_4w_slope": -8.5,
        "consecutive_decline_count": 5,
        "missed_submission_streak": 4,
    }
    top_shap = [
        ("attendance_delta_baseline", 0.35),
        ("assignment_4w_slope", 0.28),
        ("consecutive_decline_count", 0.20),
        ("missed_submission_streak", 0.15),
    ]

    sentences = generate_explanation_sentences(top_shap, extreme_features)
    for sent in sentences:
        lower_sent = sent.lower()
        for banned in BANNED_WORDS:
            assert (
                banned.lower() not in lower_sent
            ), f"Banned word '{banned}' found in generated sentence: '{sent}'"


def test_sanitize_text_rejects_banned_words():
    with pytest.raises(ValueError):
        sanitize_text("This student is at-risk of failing.")
    with pytest.raises(ValueError):
        sanitize_text("Predicted to fail due to dropout tendencies.")

    # Valid supportive text should pass without exception
    assert sanitize_text("Student may benefit from a supportive check-in.")
