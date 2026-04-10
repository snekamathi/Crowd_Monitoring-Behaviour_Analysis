# CrowdSense AI: Crowd Monitoring & Behavior Analysis

CrowdSense AI is a state-of-the-art surveillance platform utilizing Deep Learning (YOLOv8 & Optical Flow) to monitor crowd density, count unique individuals, and detect abnormal behaviors (panic, running, loitering) in real-time.

## 🚀 Getting Started

To run this project locally from a fresh clone, follow these steps:

### 1. Prerequisites
- **Node.js** (v18+)
- **Python** (v3.9+)
- **Git**

---

### 2. Setup the AI Backend (Python)
The AI backend handles real-time video processing and behavior classification.

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Virtual Environment:
   ```bash
   python -m venv venv
   # Windows:
   .\venv\Scripts\activate
   # Mac/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. **Download AI Models**:
   Since `.pt` files are excluded from Git, you need to provide the YOLOv8 weights:
   - Place `yolov8n.pt` and `yolov8l.pt` inside the `/backend` folder.
   - You can download them from the [Ultralytics GitHub](https://github.com/ultralytics/ultralytics).
5. Start the server:
   ```bash
   python app.py
   ```
   *The AI pipeline will start on port **5001**.*

---

### 3. Setup the Notification Gateway (Node.js)
This service manages SMS (via Twilio) and Email notifications.

1. Navigate to the gateway directory:
   ```bash
   cd backend_node
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment:
   - Create a `.env` file based on the provided credentials (Twilio SID, Auth Token, Email PASS).
4. Start the gateway:
   ```bash
   node server.js
   ```
   *The gateway will start on port **5000**.*

---

### 4. Setup the Dashboard (Next.js)
The premium UI provides real-time analytics and system control.

1. Navigate to the frontend directory:
   ```bash
   cd crowd_monitoring
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   *Open [http://localhost:3000](http://localhost:3000) to view the dashboard.*

---

## 🛠 Features
- **Live AI HUD**: Real-time bounding boxes and HUD overlays.
- **Behavior Detection**: Automatic alerts for "Rapid Motion" or "Panic" behaviors.
- **Incident History**: Persistent logging of all detected alerts with CSV export.
- **Scalable Pipeline**: Supports both local Webcams and RTSP/CCTV streams.

## ⚖️ License
Distributed under the ISC License. See `LICENSE` for more information.
