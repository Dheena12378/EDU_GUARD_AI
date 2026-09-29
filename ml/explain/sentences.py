"""
EDU CARD AI — Plain-Language Sentence Generator & Explainability

Translates SHAP feature attributions and trend signals into supportive,
respectful, plain-language sentences and 'What would change' counterfactuals.

CRITICAL RULE:
Strictly adheres to the Banned Words list (no stigmatizing, fatalistic, or punitive language).
"""

from typing import Dict, List, Tuple
from backend.app.config import BANNED_WORDS


FACTOR_FRIENDLY_NAMES = {
    "attendance_2w_avg": "Recent 2-week attendance average",
    "assignment_2w_avg": "Recent assignment completion rate",
    "assessment_2w_avg": "Recent assessment score",
    "activity_2w_avg": "Weekly LMS logins",
    "participation_2w_avg": "Classroom participation score",
    "attendance_4w_slope": "4-week attendance trajectory",
    "assignment_4w_slope": "4-week assignment trajectory",
    "assessment_4w_slope": "4-week assessment trajectory",
    "activity_4w_slope": "4-week platform activity trajectory",
    "participation_4w_slope": "4-week participation trajectory",
    "attendance_volatility": "Fluctuation in attendance",
    "assignment_volatility": "Fluctuation in assignment submissions",
    "attendance_delta_baseline": "Attendance change vs personal baseline",
    "assignment_delta_baseline": "Assignment completion vs personal baseline",
    "activity_delta_baseline": "LMS logins vs personal baseline",
    "consecutive_decline_count": "Consecutive weeks with lower engagement",
    "missed_submission_streak": "Recent unsubmitted tasks",
    "days_since_last_activity": "Days since last digital activity",
}


def sanitize_text(text: str) -> str:
    """Enforces banned words exclusion; raises error or cleans text if any detected."""
    lower_t = text.lower()
    for banned in BANNED_WORDS:
        if banned.lower() in lower_t:
            raise ValueError(f"Banned term '{banned}' detected in generated explanation text!")
    return text


def generate_explanation_sentences(
    top_shap_features: List[Tuple[str, float]],
    feature_values: Dict[str, float],
    max_sentences: int = 4,
) -> List[str]:
    """
    Converts top positive SHAP features (factors increasing support need)
    into plain-language, non-judgmental observations.
    """
    sentences = []
    
    for feat_name, shap_val in top_shap_features[:max_sentences]:
        val = feature_values.get(feat_name, 0.0)
        
        if "delta_baseline" in feat_name:
            metric = feat_name.replace("_delta_baseline", "").replace("_", " ").capitalize()
            drop_amt = abs(round(val, 1))
            sent = f"{metric} is {drop_amt}% lower than the student's initial personal baseline."
        elif "4w_slope" in feat_name:
            metric = feat_name.replace("_4w_slope", "").replace("_", " ").capitalize()
            slope_amt = abs(round(val, 1))
            sent = f"4-week {metric.lower()} shows a gradual downward trajectory (-{slope_amt}%/week)."
        elif "2w_avg" in feat_name:
            metric = feat_name.replace("_2w_avg", "").replace("_", " ").capitalize()
            sent = f"Recent 2-week average for {metric.lower()} is currently at {round(val, 1)}%."
        elif feat_name == "consecutive_decline_count":
            weeks = int(val)
            sent = f"Engagement indicators have softened over {weeks} consecutive weeks."
        elif feat_name == "missed_submission_streak":
            count = int(val)
            sent = f"{count} recent assignment deadlines passed without completed submissions."
        elif feat_name == "days_since_last_activity":
            days = int(val)
            sent = f"Digital learning portal has been inactive for {days} days."
        elif feat_name == "attendance_volatility":
            sent = "Weekly class attendance has shown higher variability over the past month."
        else:
            name = FACTOR_FRIENDLY_NAMES.get(feat_name, feat_name.replace("_", " ").capitalize())
            sent = f"Recent variation observed in {name.lower()} (value: {round(val, 1)})."

        clean_sent = sanitize_text(sent)
        sentences.append(clean_sent)

    if not sentences:
        sentences.append("All engagement indicators remain consistent with established personal baseline.")

    return sentences


def generate_what_would_change(
    top_shap_features: List[Tuple[str, float]],
    feature_values: Dict[str, float],
) -> List[str]:
    """
    Generates actionable counterfactual suggestions:
    'What small adjustments would return the indicator to Low?'
    """
    suggestions = []
    
    for feat_name, _ in top_shap_features[:3]:
        if "attendance" in feat_name:
            suggestions.append("Attending the next scheduled practical/lecture sessions this week.")
        elif "assignment" in feat_name or "submission" in feat_name:
            suggestions.append("Submitting the pending module assignment or requesting a brief extension.")
        elif "activity" in feat_name:
            suggestions.append("Engaging with digital study materials for 30+ minutes over 3 distinct days.")
        elif "participation" in feat_name:
            suggestions.append("A brief supportive check-in during tutorial discussion.")

    # Deduplicate while preserving order
    seen = set()
    unique_suggestions = []
    for s in suggestions:
        if s not in seen:
            seen.add(s)
            unique_suggestions.append(sanitize_text(s))

    if not unique_suggestions:
        unique_suggestions = ["Maintaining current consistent weekly study and attendance habits."]

    return unique_suggestions
