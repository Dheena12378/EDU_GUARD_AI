"""
EDU CARD AI — Explanation & Playbook Service

Bridges model attributions with the Support Playbook:
- Maps identified engagement factors to optional, recommended support actions
- Formats plain-language explanations
- Enforces human-in-the-loop review
"""

from typing import Dict, List, Optional
from ..config import playbook, DISCLAIMER
from ml.explain.sentences import generate_explanation_sentences, generate_what_would_change, sanitize_text


class ExplanationService:
    def __init__(self):
        self.playbook_factors = playbook.get("factors", {})
        self.disclaimer = DISCLAIMER

    def get_playbook_suggestions_for_factors(self, factors: List[str]) -> List[Dict]:
        """
        Looks up support suggestions defined in playbook.yaml for detected factors.
        All suggestions are explicitly optional and require mentor/faculty review.
        """
        suggestions = []
        seen_titles = set()

        for f in factors:
            factor_key = f.lower()
            # Normalize factor key
            if "attendance" in factor_key:
                cfg = self.playbook_factors.get("attendance", {})
            elif "assignment" in factor_key or "submission" in factor_key:
                cfg = self.playbook_factors.get("assignment_completion", {})
            elif "assessment" in factor_key or "score" in factor_key:
                cfg = self.playbook_factors.get("assessment_score", {})
            elif "activity" in factor_key or "login" in factor_key:
                cfg = self.playbook_factors.get("learning_activity", {})
            elif "participation" in factor_key:
                cfg = self.playbook_factors.get("class_participation", {})
            else:
                cfg = {}

            for item in cfg.get("suggestions", []):
                if item["title"] not in seen_titles:
                    seen_titles.add(item["title"])
                    suggestions.append({
                        "type": item.get("type", "mentor_discussion"),
                        "title": sanitize_text(item.get("title", "")),
                        "description": sanitize_text(item.get("description", "")),
                        "priority": item.get("priority", 2),
                        "factor_origin": cfg.get("display_name", f),
                    })

        # If no specific factor suggestions found, provide standard supportive check-in
        if not suggestions:
            suggestions.append({
                "type": "mentor_discussion",
                "title": "Supportive Check-in",
                "description": "Schedule a brief, friendly conversation to discuss academic goals and any current challenges.",
                "priority": 1,
                "factor_origin": "General",
            })

        suggestions.sort(key=lambda s: s["priority"])
        return suggestions

    def build_full_explanation(
        self,
        indicator_band: str,
        probability: float,
        shap_values: Dict[str, float],
        feature_values: Dict[str, float],
    ) -> Dict:
        """
        Produces the complete DETECT -> EXPLAIN -> SUPPORT payload for a student.
        """
        sorted_factors = sorted(shap_values.items(), key=lambda x: x[1], reverse=True)
        top_positive = [f for f in sorted_factors if f[1] > 0]
        
        sentences = generate_explanation_sentences(top_positive, feature_values, max_sentences=4)
        counterfactuals = generate_what_would_change(top_positive, feature_values)
        
        # Determine triggering factors for playbook lookup
        trigger_factors = [f[0] for f in top_positive[:3]]
        suggestions = self.get_playbook_suggestions_for_factors(trigger_factors)

        return {
            "indicator_band": indicator_band,
            "calibrated_probability": round(probability, 3),
            "disclaimer": self.disclaimer,
            "explanation_sentences": sentences,
            "what_would_change": counterfactuals,
            "top_contributing_factors": [
                {"feature": k, "shap_attribution": v, "value": feature_values.get(k)}
                for k, v in top_positive[:5]
            ],
            "playbook_suggestions": suggestions,
        }


explanation_service = ExplanationService()
