"""
CrowdSense AI — ByteTrack-Inspired Multi-Object Tracker
Prevents double-counting by assigning persistent IDs to each detected person
across frames using Kalman filtering and IOU-based Hungarian matching.
"""

import numpy as np
from collections import OrderedDict

try:
    from filterpy.kalman import KalmanFilter
    _FILTERPY_OK = True
except ImportError:
    _FILTERPY_OK = False

try:
    from scipy.optimize import linear_sum_assignment
    _SCIPY_OK = True
except ImportError:
    _SCIPY_OK = False


# -------------------------------------------------------------------- #
#  Single Track                                                        #
# -------------------------------------------------------------------- #

class _Track:
    """Represents a single tracked object with Kalman state."""

    _next_id = 1

    def __init__(self, bbox, confidence):
        self.id = _Track._next_id
        _Track._next_id += 1
        self.confidence = confidence
        self.hits = 1
        self.age = 0
        self.time_since_update = 0

        if _FILTERPY_OK:
            self.kf = self._create_kf(bbox)
        else:
            self.kf = None
            self.bbox = np.array(bbox, dtype=float)

    # ---- Kalman helpers ---- #

    @staticmethod
    def _create_kf(bbox):
        """7-state Kalman filter: [cx, cy, s, r, dx, dy, ds]."""
        kf = KalmanFilter(dim_x=7, dim_z=4)
        kf.F = np.eye(7)
        kf.F[0, 4] = 1
        kf.F[1, 5] = 1
        kf.F[2, 6] = 1
        kf.H = np.zeros((4, 7))
        kf.H[:4, :4] = np.eye(4)
        kf.R *= 10.0
        kf.P[4:, 4:] *= 1000.0
        kf.P *= 10.0
        kf.Q[4:, 4:] *= 0.01
        kf.Q[-1, -1] *= 0.01

        x1, y1, x2, y2 = bbox
        cx = (x1 + x2) / 2.0
        cy = (y1 + y2) / 2.0
        s = (x2 - x1) * (y2 - y1)
        r = (x2 - x1) / max(y2 - y1, 1)
        kf.x[:4] = np.array([[cx], [cy], [s], [r]])
        return kf

    def predict(self):
        if self.kf:
            if self.kf.x[2] + self.kf.x[6] <= 0:
                self.kf.x[6] = 0
            self.kf.predict()
            self.age += 1
            self.time_since_update += 1
            return self._state_to_bbox()
        else:
            self.age += 1
            self.time_since_update += 1
            return self.bbox

    def update(self, bbox, confidence):
        self.confidence = confidence
        self.hits += 1
        self.time_since_update = 0
        if self.kf:
            x1, y1, x2, y2 = bbox
            cx = (x1 + x2) / 2.0
            cy = (y1 + y2) / 2.0
            s = (x2 - x1) * (y2 - y1)
            r = (x2 - x1) / max(y2 - y1, 1)
            self.kf.update(np.array([[cx], [cy], [s], [r]]))
        else:
            self.bbox = np.array(bbox, dtype=float)

    def _state_to_bbox(self):
        cx, cy, s, r = self.kf.x[:4].flatten()
        w = np.sqrt(max(s * r, 1))
        h = max(s / max(w, 1), 1)
        return np.array([cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2])


# -------------------------------------------------------------------- #
#  ByteTrack-Inspired Tracker                                          #
# -------------------------------------------------------------------- #

class ByteTracker:
    """
    Two-stage IOU association tracker inspired by ByteTrack.

    Stage 1: Match high-confidence detections (>= high_thresh) to existing
             tracks using the Hungarian algorithm on IOU cost matrix.
    Stage 2: Match remaining low-confidence detections to unmatched tracks.
    """

    def __init__(
        self,
        max_lost: int = 30,
        iou_threshold: float = 0.3,
        high_thresh: float = 0.5,
        low_thresh: float = 0.1,
        min_hits: int = 3,
    ):
        """
        Args:
            max_lost:      Remove track after this many frames without match.
            iou_threshold: Minimum IOU for a valid match.
            high_thresh:   Confidence split for two-stage association.
            low_thresh:    Minimum confidence to consider at all.
            min_hits:      Track must be matched this many times before
                           being reported as a confirmed track.
        """
        self.max_lost = max_lost
        self.iou_threshold = iou_threshold
        self.high_thresh = high_thresh
        self.low_thresh = low_thresh
        self.min_hits = min_hits

        self.tracks: list[_Track] = []
        self.total_unique_ids = 0

    # ---------------------------------------------------------------- #
    #  Public API                                                      #
    # ---------------------------------------------------------------- #

    def update(self, detections):
        """
        Update tracker with new detections.

        Args:
            detections: list of (x1, y1, x2, y2, confidence).

        Returns:
            active_tracks: list of (track_id, x1, y1, x2, y2) for
                           confirmed tracks only.
            unique_count:  Number of currently active confirmed tracks.
        """
        # Predict all existing tracks forward
        for track in self.tracks:
            track.predict()

        if not detections:
            self._cleanup()
            return self._confirmed_tracks()

        dets = np.array(detections)
        bboxes = dets[:, :4]
        confs = dets[:, 4]

        # Split detections into high and low confidence
        high_mask = confs >= self.high_thresh
        low_mask = (confs < self.high_thresh) & (confs >= self.low_thresh)

        high_dets = bboxes[high_mask]
        high_confs = confs[high_mask]
        low_dets = bboxes[low_mask]
        low_confs = confs[low_mask]

        # ----- Stage 1: Match high-conf detections to tracks ----- #
        matched_t, matched_d, unmatched_tracks, unmatched_dets = (
            self._associate(self.tracks, high_dets, self.iou_threshold)
        )

        for t_idx, d_idx in zip(matched_t, matched_d):
            self.tracks[t_idx].update(high_dets[d_idx], high_confs[d_idx])

        # ----- Stage 2: Match low-conf detections to remaining tracks ----- #
        remaining_tracks = [self.tracks[i] for i in unmatched_tracks]
        if len(remaining_tracks) > 0 and len(low_dets) > 0:
            mt2, md2, still_unmatched, _ = self._associate(
                remaining_tracks, low_dets, self.iou_threshold
            )
            for t_idx, d_idx in zip(mt2, md2):
                remaining_tracks[t_idx].update(low_dets[d_idx], low_confs[d_idx])
            unmatched_tracks = [
                unmatched_tracks[i] for i in still_unmatched
            ]

        # ----- Create new tracks from unmatched high-conf detections ----- #
        for d_idx in unmatched_dets:
            new_track = _Track(high_dets[d_idx], high_confs[d_idx])
            self.tracks.append(new_track)
            self.total_unique_ids += 1

        self._cleanup()
        return self._confirmed_tracks()

    def reset(self):
        """Reset all tracks (e.g. between video uploads)."""
        self.tracks.clear()
        self.total_unique_ids = 0
        _Track._next_id = 1

    # ---------------------------------------------------------------- #
    #  Internal helpers                                                #
    # ---------------------------------------------------------------- #

    def _confirmed_tracks(self):
        active = []
        for t in self.tracks:
            if t.hits >= self.min_hits or t.time_since_update == 0:
                bbox = t.predict() if t.kf else t.bbox
                x1, y1, x2, y2 = bbox.astype(int)
                active.append((t.id, x1, y1, x2, y2))
        return active, len(active)

    def _cleanup(self):
        self.tracks = [
            t for t in self.tracks if t.time_since_update <= self.max_lost
        ]

    @staticmethod
    def _iou_batch(bb_a, bb_b):
        """Vectorised IOU between two sets of boxes."""
        if len(bb_a) == 0 or len(bb_b) == 0:
            return np.empty((len(bb_a), len(bb_b)))

        bb_a = np.asarray(bb_a, dtype=float)
        bb_b = np.asarray(bb_b, dtype=float)

        x1 = np.maximum(bb_a[:, 0:1], bb_b[:, 0])
        y1 = np.maximum(bb_a[:, 1:2], bb_b[:, 1])
        x2 = np.minimum(bb_a[:, 2:3], bb_b[:, 2])
        y2 = np.minimum(bb_a[:, 3:4], bb_b[:, 3])

        inter = np.maximum(0, x2 - x1) * np.maximum(0, y2 - y1)

        area_a = (bb_a[:, 2] - bb_a[:, 0]) * (bb_a[:, 3] - bb_a[:, 1])
        area_b = (bb_b[:, 2] - bb_b[:, 0]) * (bb_b[:, 3] - bb_b[:, 1])

        union = area_a[:, None] + area_b[None, :] - inter
        return inter / np.maximum(union, 1e-6)

    def _associate(self, tracks, dets, iou_thresh):
        if len(tracks) == 0:
            return [], [], [], list(range(len(dets)))
        if len(dets) == 0:
            return [], [], list(range(len(tracks))), []

        pred_bboxes = []
        for t in tracks:
            bbox = t._state_to_bbox() if t.kf else t.bbox
            pred_bboxes.append(bbox)
        pred_bboxes = np.array(pred_bboxes)

        iou_matrix = self._iou_batch(pred_bboxes, dets)
        cost_matrix = 1.0 - iou_matrix

        if _SCIPY_OK:
            row_idx, col_idx = linear_sum_assignment(cost_matrix)
        else:
            # Greedy fallback
            row_idx, col_idx = self._greedy_assign(cost_matrix)

        matched_t, matched_d = [], []
        unmatched_t = list(range(len(tracks)))
        unmatched_d = list(range(len(dets)))

        for r, c in zip(row_idx, col_idx):
            if iou_matrix[r, c] >= iou_thresh:
                matched_t.append(r)
                matched_d.append(c)
                if r in unmatched_t:
                    unmatched_t.remove(r)
                if c in unmatched_d:
                    unmatched_d.remove(c)

        return matched_t, matched_d, unmatched_t, unmatched_d

    @staticmethod
    def _greedy_assign(cost):
        rows, cols = [], []
        used_r, used_c = set(), set()
        flat = np.argsort(cost, axis=None)
        for idx in flat:
            r, c = divmod(idx, cost.shape[1])
            if r not in used_r and c not in used_c:
                rows.append(r)
                cols.append(c)
                used_r.add(r)
                used_c.add(c)
        return rows, cols
