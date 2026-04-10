import os
import threading
print("Imports starting...")
from database import db, init_db, save_alert
print("Database modules imported.")
from flask import Flask, Response, jsonify
from flask_cors import CORS
print("Flask and CORS imported.")
import cv2
print("OpenCV imported.")

# Import system modules
from modules.detection import CrowdDetector
from modules.density import DensityEstimator
from modules.behavior import BehaviorAnalyzer
from modules.risk import RiskAssessor
from modules.alert import AlertSystem
from modules.tracker import ByteTracker

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Allow uploads up to 500MB
app.config['MAX_CONTENT_LENGTH'] = 500 * 1024 * 1024

# Globals (initialized later)
detector = None
density_estimator = None
analyzer = None
assessor = None
alert_system = None
tracker = None

global_stats = {
    "count": 0,
    "unique_count": 0,
    "model_used": "YOLOv8l",
    "confidence_used": 0.25,
    "density": "Low",
    "behavior": "Normal",
    "risk": "Normal",
    "risk_score": 0.0,
}

def init_all_modules():
    global detector, density_estimator, analyzer, assessor, alert_system, tracker
    print("Initializing High-Accuracy AI Pipeline (YOLOv8l)...")
    detector = CrowdDetector(
        model_path="yolov8l.pt",
        confidence=0.25,
        iou_threshold=0.45,
        img_size=1280
    )
    density_estimator = DensityEstimator(low_threshold=50, high_threshold=150)
    analyzer = BehaviorAnalyzer()
    assessor = RiskAssessor()
    alert_system = AlertSystem(enable_sms=True, enable_email=True)
    # Native track used, but tracker object kept if needed for legacy logic
    tracker = ByteTracker(
        max_lost=30,
        iou_threshold=0.3,
        high_thresh=0.5,
        low_thresh=0.1,
        min_hits=3
    )
    print("Production AI Modules fully loaded.")

def generate_frames():
    """ Video streaming generator function """
    # Placeholder for video capture, 0 is webcam, or replace with CCTV RTSP URL
    camera = cv2.VideoCapture(0)
    
    # If webcam isn't available, we will try to create a dummy stream 
    if not camera.isOpened():
        print("Warning: Camera 0 could not be opened. Simulated stream will be used.")
        return
        
    while True:
        success, frame = camera.read()
        if not success:
            break
            
        clean_frame = frame.copy()
        
        # 1. Detection & Tracking (YOLOv8l - Native)
        processed_frame, current_frame_count, unique_people_count, detections = detector.process_frame(frame)
        
        # 2. Density Estimation
        density_level, density_value = density_estimator.estimate(unique_people_count)

        # 3. Behavior Analysis
        behavior_status, behavior_conf = analyzer.analyze_sequence(clean_frame)
        
        # 4. Risk Assessment
        risk_level, risk_score = assessor.evaluate_risk(density_level, behavior_status)
        
        # Update global stats for dashboard API
        global_stats.update({
            "count": current_frame_count,
            "unique_count": unique_people_count,
            "confidence_used": detector.confidence,
            "model_used": "YOLOv8l",
            "density": density_level,
            "behavior": behavior_status,
            "risk": risk_level,
            "risk_score": risk_score
        })
        
        # 5. Alert System triggers and logging
        if risk_level in ["Warning", "Critical"]:
            # Trigger alert but we should debounce this in production so we don't spam
            # alert_system.trigger_alert(risk_level, f"{density_level} Density with {behavior_status} Behavior", crowd_count)
            # Log to MySQL/SQLite
            with app.app_context():
                 # Adding pseudo debounce by random chance just for testing layout without filling DB immediately
                 pass
                 # save_alert(crowd_count, density_level, behavior_status, risk_level)
            
        # Encode Frame to JPEG
        ret, buffer = cv2.imencode('.jpg', processed_frame)
        if not ret:
            continue
        frame_bytes = buffer.tobytes()
        
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

@app.route('/api/video_feed')
def video_feed():
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/api/stats', methods=['GET'])
def get_stats():
    return jsonify(global_stats)

@app.route('/api/history', methods=['GET'])
def get_history():
    from database import AlertLog
    with app.app_context():
        logs = AlertLog.query.order_by(AlertLog.timestamp.desc()).limit(50).all()
        data = [{
            "id": log.id,
            "timestamp": log.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
            "count": log.crowd_count,
            "density": log.density_level,
            "behavior": log.behavior_status,
            "risk": log.risk_level,
            "location": log.location,
            "status": log.action_status
        } for log in logs]
        return jsonify(data)

from flask import request
from werkzeug.utils import secure_filename
import time

UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static', 'uploads')
PROCESSED_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static', 'processed')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(PROCESSED_FOLDER, exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['PROCESSED_FOLDER'] = PROCESSED_FOLDER

@app.route('/api/upload', methods=['POST'])
def upload_video():
    print("\n[API] /api/upload hit")
    if 'video' not in request.files:
        return jsonify({"error": "No video file provided"}), 400
        
    file = request.files['video']
    if file.filename == '':
        return jsonify({"error": "Empty filename"}), 400
        
    filename = secure_filename(file.filename)
    timestamp = int(time.time())
    unique_filename = f"{timestamp}_{filename}"
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
    
    file.save(filepath)
    print(f"File saved to {filepath}")
    
    # Run analysis
    cap = cv2.VideoCapture(filepath)
    if not cap.isOpened():
        return jsonify({"error": "Could not open video file"}), 400
        
    # Get video properties
    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    
    # We output as WebM for browser compatibility
    processed_filename = f"processed_{timestamp}.webm"
    processed_filepath = os.path.join(app.config['PROCESSED_FOLDER'], processed_filename)
    
    # Downscale for performance (faster encoding)
    target_width, target_height = 640, 360
    
    # VP80 codec for webm
    fourcc = cv2.VideoWriter_fourcc(*'VP80')
    out = cv2.VideoWriter(processed_filepath, fourcc, fps, (target_width, target_height))
    
    max_count = 0
    densities = []
    behaviors = []
    risks = []
    
    frame_count = 0
    
    # Process frames (Optimized: Max 300 frames, no skipping for accuracy & playback speed)
    while cap.isOpened() and frame_count < 300:
        ret, frame = cap.read()
        if not ret:
            break
            
        clean_frame = frame.copy()
        # 1. Detection & Tracking (native YOLOv8 track)
        processed_frame, crowd_count, unique_count, detections = detector.process_frame(frame, conf=0.15)
        
        # Resize to target resolution for faster WebM finalization
        processed_frame = cv2.resize(processed_frame, (target_width, target_height))
        
        out.write(processed_frame)
        
        # Track statistics
        max_count = max(max_count, unique_count)
        densities.append(density_estimator.estimate(unique_count))
        
        # Maintain Sliding Window LSTM Sequence
        b_status, b_conf = analyzer.analyze_sequence(clean_frame)
        behaviors.append(b_status)
            
        frame_count += 1
        
    cap.release()
    out.release()
    
    # Aggregate results for the final report
    final_density = max(set(densities), key=densities.count) if densities else "Low"
    final_behavior = "Abnormal" if "Abnormal" in behaviors else "Normal"
    final_risk, final_risk_score = assessor.evaluate_risk(final_density, final_behavior)
    
    # Save the upload analysis result to database logs
    with app.app_context():
        save_alert(max_count, final_density, final_behavior, final_risk)
    
    return jsonify({
        "success": True,
        "processed_video_url": f"http://localhost:5000/static/processed/{processed_filename}",
        "people_count": max_count,
        "density_level": final_density,
        "behavior_status": final_behavior,
        "risk_level": final_risk
    })

# Add route to serve static files from the backend (for the processed video)
from flask import send_from_directory

@app.route('/static/processed/<filename>')
def serve_processed_video(filename):
    return send_from_directory(app.config['PROCESSED_FOLDER'], filename)

if __name__ == '__main__':
    print("\n[START] CrowdSense AI Backend Bootstrap...")
    
    # 1. Database set up
    with app.app_context():
        init_db(app)
    
    # 2. AI Model set up
    init_all_modules()
    
    print("Serving dashboard API at http://0.0.0.0:5000")
    app.run(host='0.0.0.0', port=5000, debug=True, threaded=True)
