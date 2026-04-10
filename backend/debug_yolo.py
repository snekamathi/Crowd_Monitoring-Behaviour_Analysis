import cv2
import os
import sys
from ultralytics import YOLO

# Add modules to path
sys.path.append(os.path.abspath(os.path.join(os.getcwd(), 'modules')))
from detection import CrowdDetector

def debug_detection(video_path):
    print(f"Opening video: {video_path}")
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print("Error: Could not open video.")
        return

    ret, frame = cap.read()
    if not ret:
        print("Error: Could not read frame.")
        return

    # Use yolov8n.pt as in app.py
    detector = CrowdDetector(model_path="yolov8n.pt", confidence=0.20, img_size=640)
    
    # Run track directly to see raw results
    results = detector.model.track(source=frame, conf=0.20, imgsz=640, persist=True, classes=[0], verbose=True)
    
    result = results[0]
    if result.boxes is not None:
        boxes = result.boxes.xyxy.cpu().numpy()
        confs = result.boxes.conf.cpu().numpy()
        print(f"Total detections (no heuristic): {len(boxes)}")
        for i, box in enumerate(boxes[:5]):
            x1, y1, x2, y2 = box
            bw, bh = x2 - x1, y2 - y1
            print(f"  Det {i}: box=[{int(x1)}, {int(y1)}, {int(x2)}, {int(y2)}], w={int(bw)}, h={int(bh)}, conf={confs[i]:.2f}")
    else:
        print("No boxes detected by YOLO.")

    cap.release()

if __name__ == "__main__":
    # Use the test video in the directory if it exists
    video_path = "test_vid.mp4"
    if os.path.exists(video_path):
        debug_detection(video_path)
    else:
        print(f"Video {video_path} not found.")
