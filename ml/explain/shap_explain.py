"""
EDU CARD AI — SHAP Explainability Engine

Extracts feature attributions using SHAP TreeExplainer / LinearExplainer.
Ranks factors and determines:
1. Factors increasing the Early Support Indicator (positive attributions)
2. Stabilizing factors (negative attributions protecting the student)
"""

from typing import Dict, List, Tuple
import numpy as np


class ShapExplainer:
    def __init__(self, model=None, feature_names: List[str] = None):
        self.model = model
        self.feature_names = feature_names or []
        self._explainer = None

    def explain_instance(self, feature_dict: Dict[str, float]) -> Tuple[Dict[str, float], List[Tuple[str, float]]]:
        """
        Computes SHAP attribution values for a single student-week feature vector.
        Returns:
        - shap_dict: {feature_name: shap_value}
        - sorted_top_factors: list of (feature_name, shap_value) sorted by impact
        """
        if not self.feature_names:
            self.feature_names = list(feature_dict.keys())

        feat_vector = np.array([[feature_dict.get(col, 0.0) for col in self.feature_names]])

        # If model is available and has tree structure or coef
        shap_values_dict = {}
        if hasattr(self.model, "predict_proba"):
            try:
                import shap
                if self._explainer is None:
                    # Random Forest or XGBoost
                    if hasattr(self.model, "estimators_") or "XGB" in str(type(self.model)):
                        self._explainer = shap.TreeExplainer(self.model)
                    else:
                        self._explainer = shap.LinearExplainer(self.model, feat_vector)
                
                shap_vals = self._explainer.shap_values(feat_vector)
                if isinstance(shap_vals, list) and len(shap_vals) > 1:
                    raw_vals = shap_vals[1][0]  # Positive class (support needed)
                elif isinstance(shap_vals, np.ndarray) and shap_vals.ndim == 3:
                    raw_vals = shap_vals[0, :, 1]
                else:
                    raw_vals = np.array(shap_vals).flatten()

                for name, val in zip(self.feature_names, raw_vals):
                    shap_values_dict[name] = float(round(val, 4))
            except Exception:
                # Robust fallback attribution based on standardized feature deviations
                shap_values_dict = self._fallback_attributions(feature_dict)
        else:
            shap_values_dict = self._fallback_attributions(feature_dict)

        # Sort features by highest positive impact (increasing support indicator)
        sorted_factors = sorted(shap_values_dict.items(), key=lambda x: x[1], reverse=True)
        return shap_values_dict, sorted_factors

    def _fallback_attributions(self, feature_dict: Dict[str, float]) -> Dict[str, float]:
        """Heuristic attribution when model is not yet fit, weighting baseline deltas & slopes."""
        attrs = {}
        for k, v in feature_dict.items():
            val = float(v)
            if "delta_baseline" in k and val < 0:
                attrs[k] = round(abs(val) * 0.03, 3)
            elif "4w_slope" in k and val < 0:
                attrs[k] = round(abs(val) * 0.04, 3)
            elif "volatility" in k and val > 10:
                attrs[k] = round(val * 0.015, 3)
            elif k == "consecutive_decline_count" and val > 0:
                attrs[k] = round(val * 0.08, 3)
            elif k == "missed_submission_streak" and val > 0:
                attrs[k] = round(val * 0.12, 3)
            else:
                attrs[k] = 0.001
        return attrs
