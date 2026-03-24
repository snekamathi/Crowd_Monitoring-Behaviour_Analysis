import cv2
import numpy as np
from collections import deque

try:
    from ultralytics import YOLO
    _YOLO_AVAILABLE = True
except ImportError:
    _YOLO_AVAILABLE = False


class CrowdDetector:
    """YOLOv8 Person Detector with ID-based Smoothing and Unique Tracking."""

    _PERSON_CLASS = 0

    def __init__(
        self,
        model_path: str = "yolov8m.pt",
        confidence: float = 0.25,
        iou_threshold: float = 0.45,
        img_size: int = 640,
    ):
        self.confidence = confidence
        self.iou_threshold = iou_threshold
        self.img_size = img_size
        # Dynamically set display name (e.g. YOLOv8l or YOLOv8m)
        self.model_name = model_path.split("/")[-1].split("\\")[-1].replace(".pt", "").capitalize()
        if "yolov8" in self.model_name.lower():
            # Standardize naming to "YOLOv8(ModelSize)"
            core = "YOLOv8"
            size = self.model_name.lower().split("yolov8")[-1]
            self.model_name = f"{core}{size}" if size else core
        
        # Track history for smoothing (ID -> deque of boxes)
        self.track_history = {} # {id: [[x1,y1,x2,y2], ...]}
        self.max_history = 10    # Increased frames for smoother averaging
        
        # Track when IDs were last seen to avoid immediate purging
        self.lost_counts = {}   # {id: count_of_lost_frames}
        self.max_lost = 30      # Keep history for 30 frames (helps with occlusions)
        
        # Session-wide tracking (Only count IDs that persist for at least 5 frames)
        self.all_time_ids = set()
        self.confirmed_ids = set() # IDs that have met the persistence threshold
        
        # Advanced Feature Extraction Stats
        self.zone_counts = {}   # {zone_idx: count}
        self.prev_centers = {}  # {id: (cx, cy)}
        self.speeds = {}        # {id: current_speed}
        
        # Trend Analysis for Spike Detection
        self.count_history = deque(maxlen=150) # ~5-10 seconds of counts
        self.spike_detected = False
        self.last_count = 0    # To store count for dynamic confidence thresholding
        self.trend = "Stable"  # Store calculated trend
        
        # Individual Behavior Tracking
        self.behavior_history = {} # {id: {"start_time": t, "start_pos": (x,y), "behavior": "Normal"}}
        self.fps_estimate = 15 # Used for time-based loitering
        self.id_frames_seen = {} # {id: num_frames}
        
        if _YOLO_AVAILABLE:
            self.model = YOLO(model_path)
            print(f"Initialization: {self.model_name} tracking mode active "
                  f"[conf={self.confidence}, iou={self.iou_threshold}]")
        else:
            self.model = None

    def reload_model(self, new_model_path: str):
        """Hot-swap the YOLO model weights without restarting the system."""
        if _YOLO_AVAILABLE:
            try:
                self.model = YOLO(new_model_path)
                self.model_name = new_model_path.split("/")[-1].split("\\")[-1].replace(".pt", "").capitalize()
                print(f"[RELOAD] Model successfully updated to: {new_model_path}")
                return True
            except Exception as e:
                print(f"[RELOAD] Failed to load {new_model_path}: {e}")
                raise e
        return False

    def reset(self):
        """Reset tracking state for new sessions or videos."""
        self.track_history.clear()
        self.lost_counts.clear()
        self.all_time_ids.clear()
        self.prev_centers.clear()
        self.speeds.clear()
        self.count_history.clear()
        self.behavior_history.clear()
        self.id_frames_seen.clear()
        self.spike_detected = False

    def track_frame(self, frame: np.ndarray, conf: float | None = None, track: bool = True):
        """
        Detect and track using model.track with smoothing.
        If track=False, use model.predict (best for sampled frames/uploads).
        Returns: annotated_frame, current_people_in_frame, total_unique_session, detections
        """
        c = conf if conf is not None else self.confidence
        
        if self.model is None:
            return frame, 0, 0, []

        if track:
            results = self.model.track(
                source=frame,
                conf=c,
                iou=self.iou_threshold,
                persist=True,
                classes=[self._PERSON_CLASS],
                imgsz=self.img_size,
                verbose=False
            )
        else:
            results = self.model.predict(
                source=frame,
                conf=c,
                iou=self.iou_threshold,
                classes=[self._PERSON_CLASS],
                imgsz=self.img_size,
                verbose=False
            )

        result = results[0]
        detections = []
        current_ids = set()

        if result.boxes is not None:
            boxes = result.boxes.xyxy.cpu().numpy()
            track_ids = result.boxes.id.cpu().numpy().astype(int) if result.boxes.id is not None else [None] * len(boxes)
            confs = result.boxes.conf.cpu().numpy()
            clss = result.boxes.cls.cpu().numpy().astype(int)

            for i, track_id in enumerate(track_ids):
                if clss[i] != self._PERSON_CLASS:
                    continue # Strictly Human Only
                
                # --- DATA VALIDATION HEURISTIC ---
                # Filter out extremely small noise
                box = boxes[i]
                x1, y1, x2, y2 = box
                bw, bh = x2 - x1, y2 - y1
                
                if bh < 8 or bw < 3:
                    continue # Reduced thresholds to pick up distant people in dense crowds
                
                conf_val = float(confs[i])
                
                if track_id is not None and int(track_id) > 0:
                    current_ids.add(track_id)
                    self.all_time_ids.add(track_id)
                    
                    # --- APPLY SMOOTHING ---
                    if track_id not in self.track_history:
                        self.track_history[track_id] = deque(maxlen=self.max_history)
                        # New ID tracking
                        if track_id not in self.lost_counts:
                            self.lost_counts[track_id] = 0
                    
                    self.track_history[track_id].append(box)
                    
                    # Average the box coordinates
                    avg_box = np.mean(self.track_history[track_id], axis=0).astype(int)
                    x1, y1, x2, y2 = avg_box
                    
                    # --- BEHAVIOR CLASSIFICATION (Requirement 1, 2, 3) ---
                    self.id_frames_seen[track_id] = self.id_frames_seen.get(track_id, 0) + 1
                    
                    # 1. Calculate Speed & Running
                    cx, cy = (x1 + x2) // 2, (y1 + y2) // 2
                    speed = 0
                    if track_id in self.prev_centers:
                        pcx, pcy = self.prev_centers[track_id]
                        speed = np.sqrt((cx - pcx)**2 + (cy - pcy)**2)
                        self.speeds[track_id] = speed
                    
                    # 2. Loitering Detection (Requirement 3: 15 seconds)
                    if track_id not in self.behavior_history:
                        self.behavior_history[track_id] = {"start_pos": (cx, cy), "frames": 0}
                    
                    self.behavior_history[track_id]["frames"] += 1
                    dist_from_start = np.sqrt((cx - self.behavior_history[track_id]["start_pos"][0])**2 + 
                                            (cy - self.behavior_history[track_id]["start_pos"][1])**2)
                    
                    # If moved significantly, reset loiter anchor
                    if dist_from_start > 50:
                        self.behavior_history[track_id] = {"start_pos": (cx, cy), "frames": 0}

                    # Determine individual label
                    behavior_label = "Normal"
                    if speed > 8.0: # Threshold for 'Running'
                        behavior_label = "Running"
                    elif self.behavior_history[track_id]["frames"] > (self.fps_estimate * 15): # 15 seconds
                        behavior_label = "Loitering"

                    label = f"ID:{track_id} {behavior_label}"
                else:
                    x1, y1, x2, y2 = int(x1), int(y1), int(x2), int(y2)
                    label = "Person"

                detections.append((x1, y1, x2, y2, conf_val))

                # Draw Bounding Box
                color = self._confidence_colour(conf_val)
                cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                
                cv2.putText(frame, label, (x1, y1 - 10), 
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

                # --- ADVANCED FEATURE: SPEED CALCULATION (Only if tracked) ---
                if track_id is not None:
                    cx, cy = (x1 + x2) // 2, (y1 + y2) // 2
                    if track_id in self.prev_centers:
                        pcx, pcy = self.prev_centers[track_id]
                        dist = np.sqrt((cx - pcx)**2 + (cy - pcy)**2)
                        self.speeds[track_id] = dist
                    self.prev_centers[track_id] = (cx, cy)

        # --- ADVANCED FEATURE: ZONE DENSITY & SPIKES ---
        h, w = frame.shape[:2]
        
        # Dynamic adjustment removed to prevent 'sticking' at high confidence
        pass

        self._calculate_zones(detections, w, h)
        self._detect_spikes()

        # --- CLEANUP LOST IDS ---
        # Only purge history if an ID hasn't been seen for max_lost frames
        all_tracked_ids = list(self.track_history.keys())
        for tid in all_tracked_ids:
            if tid not in current_ids:
                self.lost_counts[tid] = self.lost_counts.get(tid, 0) + 1
                if self.lost_counts[tid] > self.max_lost:
                    del self.track_history[tid]
                    del self.lost_counts[tid]
            else:
                self.lost_counts[tid] = 0 # Reset if seen again

        # Cleanup speed/center history
        dead_ids = [tid for tid in self.prev_centers if tid not in current_ids]
        for tid in dead_ids:
            if tid in self.lost_counts and self.lost_counts[tid] > self.max_lost:
                del self.prev_centers[tid]
                if tid in self.speeds: del self.speeds[tid]

        # --- CONFIRM PERSISTENT IDS ---
        for tid in current_ids:
            # If an ID is seen for more than 5 hits, confirm it for the unique count
            # This filters out flickering noise from the 'Total Unique' value
            if tid in self.track_history and len(self.track_history[tid]) >= 5:
                self.confirmed_ids.add(tid)

        # Cleanup behavior history
        for tid in list(self.behavior_history.keys()):
            if tid not in current_ids:
                if tid in self.lost_counts and self.lost_counts[tid] > self.max_lost:
                    del self.behavior_history[tid]
                    if tid in self.id_frames_seen: del self.id_frames_seen[tid]

        frame_count = len(detections)
        unique_count = len(self.confirmed_ids)

        return frame, frame_count, unique_count, detections

    def process_frame(self, frame: np.ndarray, conf: float | None = None, track: bool = True):
        """Unified analysis pipeline wrapper. Use track=False for non-contiguous frames."""
        f, count, unique, det = self.track_frame(frame, conf, track)

        # Disable smoothing if we are in high-precision mode or sampled mode
        # By default, use raw count for better accuracy in sparse sampling
        smoothed_count = count

        # ---- TREND ANALYSIS ----
        trend = self.get_trend()

        # ---- MINIMAL HUD OVERLAY ----
        h, w = f.shape[:2]
        overlay = f.copy()
        cv2.rectangle(overlay, (0, 0), (280, 100), (0, 0, 0), -1)
        cv2.addWeighted(overlay, 0.4, f, 0.6, 0, f)

        font = cv2.FONT_HERSHEY_SIMPLEX
        cv2.putText(f, f"CORE: {self.model_name}", (10, 20), font, 0.45, (200, 200, 200), 1)
        cv2.putText(f, f"COUNT: {smoothed_count}", (10, 48), font, 0.75, (0, 255, 0), 2)
        cv2.putText(f, f"TREND: {trend}", (10, 72), font, 0.5, (255, 255, 255), 1)
        cv2.putText(f, f"UNIQUE: {unique}", (10, 92), font, 0.45, (0, 165, 255), 1)

        # Draw quadrant grid lines (subtle)
        cv2.line(f, (w // 2, 0), (w // 2, h), (40, 40, 40), 1)
        cv2.line(f, (0, h // 2), (w, h // 2), (40, 40, 40), 1)

        return f, smoothed_count, unique, det

    def get_trend(self):
        """Analyze rate of change over the last 15 frames."""
        if len(self.count_history) < 15:
            return "Stable"
        
        recent = list(self.count_history)[-7:]
        older = list(self.count_history)[-15:-7]
        
        diff = np.mean(recent) - np.mean(older)
        if diff > 1.5: return "Increasing"
        if diff < -1.5: return "Decreasing"
        return "Stable"


    def _calculate_zones(self, detections, w, h):
        """Divide frame into 4 quadrants (Zones)."""
        zones = [0, 0, 0, 0] # TL, TR, BL, BR
        for (x1, y1, x2, y2, _) in detections:
            cx, cy = (x1 + x2) // 2, (y1 + y2) // 2
            idx = 0
            if cx > w // 2: idx += 1
            if cy > h // 2: idx += 2
            zones[idx] += 1
        self.zone_counts = {f"Z{i+1}": zones[i] for i in range(4)}

    def _detect_spikes(self):
        """Detect sudden increase in crowd count (Requirement 4A: >3 people)."""
        if len(self.count_history) < 20: 
            self.spike_detected = False
            return
        recent = list(self.count_history)[-5:] 
        older = list(self.count_history)[-25:-5] 
        avg_old = np.mean(older) if older else 0
        avg_new = np.mean(recent)
        # REQUIREMENT 4A: Increase > 3 people
        if avg_new > (avg_old + 3):
            self.spike_detected = True
        else:
            self.spike_detected = False

    # ------------------------------------------------------------------ #
    #  Helpers                                                            #
    # ------------------------------------------------------------------ #

    @staticmethod
    def _confidence_colour(conf: float):
        """Green for high confidence, yellow for medium, red for low."""
        if conf >= 0.6:
            return (0, 255, 0)
        elif conf >= 0.4:
            return (0, 255, 255)
        return (0, 0, 255)
