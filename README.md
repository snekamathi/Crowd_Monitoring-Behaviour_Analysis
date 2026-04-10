# AI-Based Crowd Monitoring and Disaster Alert System

This is a complete web application utilizing Deep Learning (YOLOv8 & LSTM via CCNet/CBNet architecture) to monitor surveillance footage for crowd counting, density estimation, and high-risk behavior analysis. 

## Project Architecture
- **Frontend**: Next.js (React) + Tailwind CSS + Recharts + Framer Motion
- **Backend**: Python 3.9+ Flask API
- **Models**: Architecture placeholders for YOLOv8 (Crowd Detection) and LSTM (Behavior Analysis)
- **Database**: SQLite/MySQL via SQLAlchemy

## Prerequisites
- Node.js (v18+)
- Python (3.9+)

## How to Run

### 1. Start the Frontend
Open a new terminal, navigate into the `<project_root>/crowd_monitoring` directory:
```bash
cd crowd_monitoring
npm install
npm run dev
```
The stunning UI Dashboard will stream live at `http://localhost:3000`.

### 2. Start the Backend API
Open another terminal, navigate to `<project_root>/backend`:
```bash
cd backend
python -m venv venv
# Activate virtual environment
# On Windows: .\venv\Scripts\activate
# On Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
python app.py
```
This will initialize the AI pipeline and start streaming processed frames at `http://localhost:5000/api/video_feed`.

### Application Features
- **Live Surveillance Pipeline**: Fetches webcam/RTSP feeds & draws simulated YOLOv8 bonding boxes in realtime.
- **AI Analytics Engine**:
  - `detection.py`: Simulates YOLOv8 predicting person coordinates.
  - `density.py`: Categorizes crowd levels.
  - `behavior.py`: Simulates LSTM CBNet predictions against sequences for abnormal behavior.
  - `risk.py`: Provides actionable Warning/Critical assessments.
- **Alert History Database**: Persistent logs stored in SQLite/MySQL.
- **End User Platform**: Premium dark-mode UI with admin access, historical charts tracking, footage uploading, and live real-time visual statuses.
