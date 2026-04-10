import numpy as np
from collections import deque


class RiskAssessor:
    """Weighted multi-factor risk evaluator."""

    def __init__(self, fps=20):
        self.fps = fps
        self.history = deque(maxlen=fps * 60) # 1 minute history
        self.abnormal_frames = 0
        self.persistence_threshold = fps * 5 # 5 seconds
        print(f"Initialization: Risk evaluation matrix loaded with {fps} FPS persistence.")

    def evaluate_risk(
        self,
        density_level: str,
        behavior_status: str,
        crowd_count: int = 0,
        behavior_confidence: float = 0.0,
    ):
        """
        Compute risk from multiple factors.

        Args:
            density_level:        "Low", "Medium", or "High".
            behavior_status:      "Normal" or "Abnormal".
            crowd_count:          Number of tracked people.
            behavior_confidence:  0.0 – 1.0 confidence from behavior model.

        Returns:
            (category, score):
                category — "Normal", "Warning", or "Critical"
                score    — 0–100 numeric risk score
        """
        score = 0.0

        # ---- Density component (40% weight) ---- #
        density_scores = {"Low": 5, "Medium": 40, "High": 80}
        score += density_scores.get(density_level, 5) * 0.40

        # ---- Behavior component (35% weight) ---- #
        if behavior_status == "Abnormal":
            behavior_score = 60 + (behavior_confidence * 40)
        else:
            behavior_score = 5
        score += behavior_score * 0.35

        # ---- Crowd count component (15% weight) ---- #
        if crowd_count > 150:
            count_score = 80
        elif crowd_count > 80:
            count_score = 50
        elif crowd_count > 40:
            count_score = 25
        else:
            count_score = 5
        score += count_score * 0.15

        # ---- Compound factor (10% weight) ---- #
        # Extra penalty when high density AND abnormal behavior
        if density_level == "High" and behavior_status == "Abnormal":
            score += 90 * 0.10
        elif density_level == "Medium" and behavior_status == "Abnormal":
            score += 60 * 0.10
        else:
            score += 5 * 0.10

        score = min(round(score, 1), 100.0)

        # ---- Categorise with Adaptive Sensitivity ---- #
        self.history.append(score)
        
        # Adaptive Baseline: Only use historical mean if we have enough data
        if len(self.history) > self.fps * 10:
            hist_arr = np.array(self.history)
            mean_val = np.mean(hist_arr)
            std_val = np.std(hist_arr)
            adaptive_threshold = mean_val + (2 * std_val)
            # Ensure threshold doesn't go too low or too high
            adaptive_threshold = max(35, min(adaptive_threshold, 70))
        else:
            adaptive_threshold = 45 # Fallback static threshold

        # Persistence Check
        if score > adaptive_threshold or behavior_status == "Abnormal":
            self.abnormal_frames += 1
        else:
            self.abnormal_frames = max(0, self.abnormal_frames - 2) # Fast cooldown

        # Final Category logic
        if self.abnormal_frames >= self.persistence_threshold:
            category = "Critical"
        elif score >= 35 or self.abnormal_frames >= (self.persistence_threshold // 2):
            category = "Warning"
        else:
            category = "Normal"

        return category, score, self.abnormal_frames >= self.persistence_threshold
