"""
EDU CARD AI — Trend Classifier & Statistical Tests
"""

from backend.app.services.trend_service import trend_service


def test_classify_trend():
    # Increasing
    assert trend_service.classify_trend(90.0, 84.0) == "Increasing"
    # Stable
    assert trend_service.classify_trend(85.0, 84.0) == "Stable"
    assert trend_service.classify_trend(82.0, 85.0) == "Stable"
    # Decreasing
    assert trend_service.classify_trend(78.0, 85.0) == "Decreasing"
    # Sudden negative change (drop >= 15%)
    assert trend_service.classify_trend(65.0, 85.0) == "Sudden negative change"


def test_ewma_computation():
    series = [80.0, 82.0, 85.0, 88.0]
    ewma = trend_service.compute_ewma(series)
    assert len(ewma) == len(series)
    assert ewma[0] == 80.0
    # Values should smoothly trend upward
    assert ewma[-1] > ewma[0]


def test_cusum_negative_detection():
    # Stable baseline followed by downward shifts
    series = [90.0, 90.0, 90.0, 75.0, 70.0, 65.0]
    cusum = trend_service.compute_cusum_negative(series, target_mean=90.0)
    assert len(cusum) == len(series)
    # The negative deviation should accumulate
    assert cusum[-1] > cusum[0]
