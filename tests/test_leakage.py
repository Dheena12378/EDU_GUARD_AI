"""
EDU CARD AI — Feature Leakage Automated Test Suite

Guarantees that feature calculation for week W has zero future knowledge
and that altering week W+1 data does NOT change week W feature values.
"""

from ml.features.engineer import compute_student_features


def test_zero_future_leakage():
    records_scenario_a = [
        {"week_number": 1, "attendance_pct": 90.0, "assignment_completion_pct": 95.0, "assessment_score": 85.0, "lms_logins": 15, "active_days": 5, "class_participation_score": 8.0},
        {"week_number": 2, "attendance_pct": 88.0, "assignment_completion_pct": 90.0, "assessment_score": 84.0, "lms_logins": 14, "active_days": 4, "class_participation_score": 7.8},
        {"week_number": 3, "attendance_pct": 85.0, "assignment_completion_pct": 88.0, "assessment_score": 82.0, "lms_logins": 12, "active_days": 4, "class_participation_score": 7.5},
        {"week_number": 4, "attendance_pct": 82.0, "assignment_completion_pct": 85.0, "assessment_score": 80.0, "lms_logins": 10, "active_days": 3, "class_participation_score": 7.0},
        {"week_number": 5, "attendance_pct": 80.0, "assignment_completion_pct": 80.0, "assessment_score": 78.0, "lms_logins": 8, "active_days": 3, "class_participation_score": 6.8},
    ]

    # In scenario B, week 5 has completely different future data (e.g. huge drop to 20%)
    records_scenario_b = [
        records_scenario_a[0],
        records_scenario_a[1],
        records_scenario_a[2],
        records_scenario_a[3],
        {"week_number": 5, "attendance_pct": 20.0, "assignment_completion_pct": 10.0, "assessment_score": 30.0, "lms_logins": 1, "active_days": 1, "class_participation_score": 2.0},
    ]

    feats_a = compute_student_features(records_scenario_a)
    feats_b = compute_student_features(records_scenario_b)

    # Features at week 4 (index 3) MUST be completely identical between A and B
    wk4_a = feats_a[3]
    wk4_b = feats_b[3]

    assert wk4_a["week_number"] == 4
    assert wk4_b["week_number"] == 4

    for key in wk4_a:
        assert (
            wk4_a[key] == wk4_b[key]
        ), f"Feature leakage detected on key '{key}' at week 4: {wk4_a[key]} vs {wk4_b[key]}"
