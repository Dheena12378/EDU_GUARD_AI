"""
EDU CARD AI — Trend Service

Statistical trend & change detection algorithms:
- EWMA (Exponentially Weighted Moving Average, span=4)
- CUSUM (Cumulative Sum Control Chart for sustained directional shifts)
- Z-score against personal baseline (first 3 weeks)
- Trend classification: Increasing, Stable, Decreasing, Sudden negative change
"""

from typing import Dict, List, Optional, Tuple
import numpy as np

from ..config import thresholds


class TrendService:
    def __init__(self):
        trend_cfg = thresholds.get("trend", {})
        self.inc_thresh = trend_cfg.get("increasing_threshold", 5.0)
        self.dec_thresh = trend_cfg.get("decreasing_threshold", -5.0)
        self.sudden_thresh = trend_cfg.get("sudden_change_threshold", -15.0)

        ewma_cfg = thresholds.get("ewma", {})
        self.ewma_span = ewma_cfg.get("span", 4)
        self.alpha = 2.0 / (self.ewma_span + 1.0)

        cusum_cfg = thresholds.get("cusum", {})
        self.cusum_thresh = cusum_cfg.get("threshold", 5.0)
        self.cusum_drift = cusum_cfg.get("drift", 1.0)

        zscore_cfg = thresholds.get("zscore", {})
        self.baseline_weeks = zscore_cfg.get("personal_baseline_weeks", 3)
        self.zscore_thresh = zscore_cfg.get("alert_threshold", -1.5)

    def classify_trend(self, current_val: float, prev_val: float) -> str:
        """
        Classifies trend based on single-week or window percentage point delta.
        Returns: 'Increasing', 'Stable', 'Decreasing', or 'Sudden negative change'
        """
        delta = current_val - prev_val
        if delta <= self.sudden_thresh:
            return "Sudden negative change"
        elif delta <= self.dec_thresh:
            return "Decreasing"
        elif delta >= self.inc_thresh:
            return "Increasing"
        else:
            return "Stable"

    def compute_ewma(self, series: List[float]) -> List[float]:
        """Calculates exponentially weighted moving average."""
        if not series:
            return []
        ewma = [series[0]]
        for val in series[1:]:
            smoothed = self.alpha * val + (1 - self.alpha) * ewma[-1]
            ewma.append(round(smoothed, 2))
        return ewma

    def compute_cusum_negative(self, series: List[float], target_mean: Optional[float] = None) -> List[float]:
        """
        Calculates tabular CUSUM for downward shifts (decline detector).
        C_minus = min(0, C_minus_prev + (x - target + drift))
        Accumulates negative deviations beyond slack allowance.
        """
        if not series:
            return []
        mean_val = target_mean if target_mean is not None else float(np.mean(series[:self.baseline_weeks]))
        c_minus = 0.0
        cusum_series = []
        for x in series:
            # Downward shift: (x - mean + drift)
            dev = x - mean_val + self.cusum_drift
            c_minus = min(0.0, c_minus + dev)
            cusum_series.append(round(abs(c_minus), 2))
        return cusum_series

    def compute_baseline_zscore(self, current_val: float, baseline_values: List[float]) -> Tuple[float, bool]:
        """
        Calculates student's current metric Z-score relative to their own personal baseline.
        Returns (z_score, is_alert_fired).
        """
        if len(baseline_values) < 2:
            return 0.0, False
        mean_b = float(np.mean(baseline_values))
        std_b = float(np.std(baseline_values))
        if std_b < 0.5:
            std_b = 1.0  # Avoid division by zero on very stable baseline
        z = (current_val - mean_b) / std_b
        return round(z, 2), bool(z <= self.zscore_thresh)

    def analyze_student_trends(self, records: List[Dict]) -> Dict:
        """
        Runs comprehensive trend analytics across all engagement dimensions.
        """
        if not records:
            return {}

        sorted_recs = sorted(records, key=lambda r: r["week_number"])
        current = sorted_recs[-1]
        prev = sorted_recs[-2] if len(sorted_recs) >= 2 else current
        baseline_recs = sorted_recs[:self.baseline_weeks]

        metrics = [
            ("attendance_pct", "Attendance"),
            ("assignment_completion_pct", "Assignment Completion"),
            ("assessment_score", "Assessment Score"),
            ("lms_logins", "LMS Logins"),
            ("class_participation_score", "Participation"),
            ("time_spent_minutes", "Time Spent (min)"),
        ]

        signals = []
        metric_trends = {}

        for key, label in metrics:
            curr_val = current.get(key, 0.0)
            prev_val = prev.get(key, 0.0)
            status = self.classify_trend(curr_val, prev_val)
            delta = round(curr_val - prev_val, 1)

            base_vals = [r.get(key, 0.0) for r in baseline_recs]
            z_score, z_alert = self.compute_baseline_zscore(curr_val, base_vals)
            
            series = [r.get(key, 0.0) for r in sorted_recs]
            ewma_series = self.compute_ewma(series)
            cusum_series = self.compute_cusum_negative(series, target_mean=float(np.mean(base_vals)) if base_vals else None)

            cusum_alert = bool(cusum_series[-1] >= self.cusum_thresh) if cusum_series else False

            if status in ("Decreasing", "Sudden negative change") or z_alert or cusum_alert:
                sig_type = "sudden_change" if status == "Sudden negative change" else "decline"
                signals.append({
                    "factor": key,
                    "label": label,
                    "type": sig_type,
                    "delta": delta,
                    "status": status,
                    "z_score": z_score,
                    "cusum_value": cusum_series[-1] if cusum_series else 0.0,
                })

            metric_trends[key] = {
                "label": label,
                "current": curr_val,
                "previous": prev_val,
                "delta": delta,
                "status": status,
                "z_score": z_score,
                "ewma": ewma_series[-1] if ewma_series else curr_val,
                "cusum": cusum_series[-1] if cusum_series else 0.0,
            }

        return {
            "week_number": current.get("week_number"),
            "signals": signals,
            "metrics": metric_trends,
            "is_sudden_change": any(s["type"] == "sudden_change" for s in signals),
        }


trend_service = TrendService()
