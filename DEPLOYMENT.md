# CrowdSense AI - Deployment Guide

This project is a multi-service stack containing a Next.js frontend, a Python AI backend, and a Node.js notification gateway.

## 1. Backend Services (Railway / Render / AWS)

You should deploy both the `/backend` and `/backend_node` directories as separate services.

### AI Backend (Python)
- **Root Directory**: `/backend`
- **Build Type**: Dockerfile (automatically detected)
- **Env Variables**:
  - `PORT`: 5001
  - `JWT_SECRET_KEY`: (Your secret)

### Notification Gateway (Node.js)
- **Root Directory**: `/backend_node`
- **Build Type**: Dockerfile (automatically detected)
- **Env Variables**:
  - `PORT`: 5000
  - `TWILIO_SID`: (Your SID)
  - `TWILIO_AUTH`: (Your Token)
  - `TWILIO_PHONE`: (Your Twilio Number)
  - `EMAIL_USER`: (Your Sender Email)
  - `EMAIL_PASS`: (Your App Password)

## 2. Frontend (Vercel / Netlify)

Deploy the `/crowd_monitoring` directory.

- **Root Directory**: `/crowd_monitoring`
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Env Variables**:
  - `NEXT_PUBLIC_API_URL`: The URL of your deployed Python Backend.
  - `NEXT_PUBLIC_ALERTS_API_URL`: The URL of your deployed Node Gateway.

## 3. Important AI Considerations

- **Models**: The `.pt` (PyTorch) model files are excluded from Git to keep the repository small. You MUST ensure `yolov8n.pt` and `yolov8l.pt` are present in the `/backend` directory during build, or modify the code to pull them from a URL/Bucket.
- **Hardware**: For real-time processing, the backend should be deployed on a service with at least 2GB RAM and multiple CPU cores.

---
*Created by Antigravity*
