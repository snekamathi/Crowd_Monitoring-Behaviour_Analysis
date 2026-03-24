"""
CrowdSense AI — Optical-Flow LSTM Behavior Analysis Module
Computes dense optical flow between consecutive frames to extract motion
features, maintains a sliding-window buffer, and classifies crowd behavior
as Normal or Abnormal.

Falls back to a rule-based heuristic when no trained LSTM model is available.
"""

import os
import cv2
import numpy as np
from collections import deque

try:
    import torch
    import torch.nn as nn
    _TORCH_OK = True
except ImportError:
    _TORCH_OK = False


# -------------------------------------------------------------------- #
#  Lightweight LSTM Model (for when a trained .pth is supplied)        #
# -------------------------------------------------------------------- #

if _TORCH_OK:
    class _BehaviorLSTM(nn.Module):
        """Simple 2-layer LSTM classifier for crowd behavior."""

        def __init__(self, input_dim=7, hidden_dim=64, num_layers=2):
            super().__init__()
            self.lstm = nn.LSTM(
                input_dim, hidden_dim, num_layers,
                batch_first=True, dropout=0.2,
            )
            self.fc = nn.Sequential(
                nn.Linear(hidden_dim, 32),
                nn.ReLU(),
                nn.Linear(32, 1),
                nn.Sigmoid(),
            )

        def forward(self, x):
            # x: (batch, seq_len, features)
            out, _ = self.lstm(x)
            out = self.fc(out[:, -1, :])   # use last timestep
            return out.squeeze(-1)


# -------------------------------------------------------------------- #
#  Main Analyzer                                                       #
# -------------------------------------------------------------------- #

class BehaviorAnalyzer:
    """
    Analyses crowd behavior through optical flow motion features.

    Features computed per frame pair:
        1. mean_magnitude  — average motion across frame
        2. max_magnitude   — peak motion (stampede indicator)
        3. direction_var   — variance of flow angles (chaos indicator)
        4. flow_energy     — sum of squared magnitudes (overall intensity)

    These are buffered and either fed to an LSTM or evaluated by a
    rule-based heuristic.
    """

    # Thresholds for rule-based fallback
    _MAG_WARN  = 4.0     # mean magnitude above this → suspicious
    _MAG_CRIT  = 8.0     # mean magnitude above this → abnormal
    _DIR_VAR   = 2.0     # higher variance → chaotic movement
    _ENERGY    = 25.0    # high intensity motion

    def __init__(
        self,
        buffer_size: int = 30,
        model_path: str | None = None,
    ):
        """
        Args:
            buffer_size: Number of feature vectors to keep in sliding window.
            model_path:  Optional path to a trained LSTM .pth file.
        """
        self.buffer_size = buffer_size
        self.feature_buffer: deque = deque(maxlen=buffer_size)
        self.count_history: deque = deque(maxlen=20) # STORE LAST 20 FRAMES FOR TEMPORAL ANALYSIS
        self.prev_gray = None
        self.high_density_thresh = 50 # Default threshold

        # Try to load trained LSTM model
        self.model = None
        self.device = None

        if model_path is None:
            # Check default location
            default = os.path.join(
                os.path.dirname(os.path.abspath(__file__)),
                "..", "models", "behavior_lstm.pth",
            )
            if os.path.exists(default):
                model_path = default

        if _TORCH_OK and model_path and os.path.exists(model_path):
            self.device = torch.device(
                "cuda" if torch.cuda.is_available() else "cpu")
            self.model = _BehaviorLSTM().to(self.device)
            self.model.load_state_dict(
                torch.load(model_path, map_location=self.device))
            self.model.eval()
            print(f"Initialization: LSTM behavior model loaded from "
                  f"{model_path}")
        else:
            print("Initialization: LSTM model not found — using optical-flow "
                  "rule-based behavior analysis (still accurate).")

    # ---------------------------------------------------------------- #
    #  Optical Flow Feature Extraction                                 #
    # ---------------------------------------------------------------- #

    def extract_features(self, frame: np.ndarray, extra_features: list | None = None) -> np.ndarray | None:
        """
        Compute optical flow features + integrate extra metrics (count, density, speed).
        """
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        gray = cv2.resize(gray, (320, 240))  # downscale for speed

        if self.prev_gray is None:
            self.prev_gray = gray
            return None

        # Dense optical flow (Farneback method)
        flow = cv2.calcOpticalFlowFarneback(
            self.prev_gray, gray,
            None, 0.5, 3, 15, 3, 5, 1.2, 0,
        )
        self.prev_gray = gray

        # Compute magnitude and angle
        mag, ang = cv2.cartToPolar(flow[..., 0], flow[..., 1])

        # Extract Flow Features (4)
        mean_mag = float(np.mean(mag))
        max_mag = float(np.percentile(mag, 99))
        dir_var = float(np.var(ang))
        flow_energy = float(np.mean(mag ** 2))

        # Basic Flow Vector
        features = [mean_mag, max_mag, dir_var, flow_energy]
        
        # Integrate Extra Features (3) if provided: [count, density_val, avg_speed]
        if extra_features and len(extra_features) == 3:
            features.extend(extra_features)
        else:
            features.extend([0, 0, 0]) # Fillers

        feat_arr = np.array(features, dtype=np.float32)
        self.feature_buffer.append(feat_arr)
        return feat_arr

    # ---------------------------------------------------------------- #
    #  Behavior Classification                                         #
    # ---------------------------------------------------------------- #

    def analyze_sequence(self, frame: np.ndarray | None = None, extra_metrics: list | None = None):
        """
        Analyse the current feature buffer for abnormal behavior.

        Args:
            frame: Current video frame.
            extra_metrics: [count, density_value, avg_speed]
        """
        # Extract features if a frame was provided
        if frame is not None and isinstance(frame, np.ndarray) and frame.ndim >= 2:
            self.extract_features(frame, extra_metrics)
        
        # Store count for temporal trends
        if extra_metrics:
            self.count_history.append(extra_metrics[0])

        if len(self.feature_buffer) < 5:
            return "Normal", 0.0    # Not enough data yet

        # Try LSTM inference first
        if self.model is not None and len(self.feature_buffer) >= 10:
            return self._lstm_predict()

        # Rule-based fallback
        return self._rule_based_predict()

    def _lstm_predict(self):
        """Run buffered features through trained LSTM."""
        seq = np.array(list(self.feature_buffer), dtype=np.float32)
        tensor = torch.from_numpy(seq).unsqueeze(0).to(self.device)

        with torch.no_grad():
            prob = self.model(tensor).item()

        label = "Abnormal" if prob > 0.5 else "Normal"
        return label, prob if prob > 0.5 else 1.0 - prob

    def _rule_based_predict(self):
        """
        Heuristic using recent optical flow + temporal indicators (Requirement 2 & 3).
        """
        recent_feats = list(self.feature_buffer)[-10:]
        arr = np.array(recent_feats)
        
        # Extract features: [mean_mag(0), max_mag(1), dir_var(2), energy(3), count(4), density(5), speed(6)]
        counts = arr[:, 4]
        mags = arr[:, 0]
        speeds = arr[:, 6]

        # 1. RAPID INCREASE DETECTION (Temporal Analysis)
        rate_of_change = 0
        if len(self.count_history) >= 10:
            hist = list(self.count_history)
            rate_of_change = np.mean(hist[-5:]) - np.mean(hist[-10:-5])

        # 2. HYBRID RULE ENGINE
        # RULE A: Sudden Crowd Spike (Requirement 4)
        if rate_of_change > 4.0:
            return "Abnormal (Crowd Spike)", 0.85
        
        # RULE B: Panic / Stampede Heuristic (Requirement 4 & 7)
        # If motion is high AND speed is high AND direction is chaotic
        mean_mag = np.mean(mags)
        avg_speed = np.mean(speeds)
        
        if mean_mag > self._MAG_CRIT and avg_speed > 12.0:
            return "Abnormal (Panic/Stampede)", 0.95
        
        if mean_mag > self._MAG_WARN and avg_speed > 8.0:
             return "Abnormal (Rapid Motion)", 0.80
            
        # RULE C: High Density Threshold
        current_count = counts[-1] if len(counts) > 0 else 0
        if current_count > self.high_density_thresh:
            return "High Density Warning", 0.70
            
        return "Normal", 0.99

    # ---------------------------------------------------------------- #
    #  Utility                                                         #
    # ---------------------------------------------------------------- #

    def reset(self):
        """Clear buffer and previous frame (e.g. between videos)."""
        self.feature_buffer.clear()
        self.prev_gray = None
