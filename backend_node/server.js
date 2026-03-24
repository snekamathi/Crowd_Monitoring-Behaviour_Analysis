const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const twilio = require('twilio');
const nodemailer = require('nodemailer');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// Requirement 1: CORS and JSON
app.use(cors());
app.use(express.json());

// In-memory store
let alerts = [];
const ALERT_COOLDOWN = 60 * 1000;

// Logging
app.use((req, res, next) => {
    if (req.method !== 'GET') {
        console.log(`[NODE] ${new Date().toLocaleTimeString()} • ${req.method} ${req.url} • Body:`, req.body);
    }
    next();
});

// --- Initialize Clients with Guards ---
let twilioClient;
try {
    if (process.env.TWILIO_SID && process.env.TWILIO_AUTH) {
        twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH);
    }
} catch (e) { console.warn("Twilio suppressed:", e.message); }

let transporter;
try {
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
    }
} catch (e) { console.warn("Mailer suppressed:", e.message); }

// --- Legacy Endpoints (SMS/Email) ---
app.post('/api/send-sms', async (req, res) => {
    try {
        const { to, location, risk, timestamp } = req.body || {};
        console.log(`[NODE] SMS request for ${location} to ${to}`);

        await twilioClient.messages.create({
            body: `🚨 CROWDSENSE ALERT: ${risk || 'Incident'} detected at ${location || 'Zone'}. Time: ${timestamp || new Date().toLocaleString()}`,
            from: process.env.TWILIO_PHONE,
            to: to
        });

        res.json({ status: "Success", message: "SMS Sent Successfully" });
    } catch (e) {
        console.error("[NODE] SMS Error:", e.message);
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/send-email', async (req, res) => {
    try {
        const { to, location, risk, timestamp, count } = req.body || {};
        console.log(`[NODE] Email request for ${location} to ${to}`);

        await transporter.sendMail({
            from: `"CrowdSense AI" <${process.env.EMAIL_USER}>`,
            to: to,
            subject: `🚨 CRITICAL ALERT: ${location} - Crowd Monitoring System`,
            html: `
                <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #dc2626;">Crowd Monitoring Alert</h2>
                    <p><strong>Location:</strong> ${location || 'Main Zone'}</p>
                    <p><strong>Risk Level:</strong> ${risk || 'High'}</p>
                    <p><strong>Crowd Count:</strong> ${count || 'Unknown'}</p>
                    <p><strong>Timestamp:</strong> ${timestamp || new Date().toLocaleString()}</p>
                    <hr />
                    <p style="font-size: 12px; color: #666;">This is an automated security notification from CrowdSense AI.</p>
                </div>
            `
        });

        res.json({ status: "Success", message: "Email Sent Successfully" });
    } catch (e) {
        console.error("[NODE] Email Error:", e.message);
        res.status(500).json({ error: e.message });
    }
});

// --- Centralized Alerts (Standardized) ---
app.get('/api/alerts', (req, res) => {
    const list = [...alerts].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    res.json(list);
});

app.post('/api/alerts', (req, res) => {
    try {
        const { location, count, behavior, risk, timestamp, status } = req.body || {};
        if (!location) {
            return res.status(400).json({ error: "Location required" });
        }

        const now = Date.now();
        const duplicate = alerts.find(a =>
            a.location === location &&
            a.status !== 'Resolved' &&
            (now - new Date(a.timestamp).getTime()) < ALERT_COOLDOWN
        );

        if (duplicate) {
            return res.json({ status: "Duplicate", alert: duplicate });
        }

        const newAlert = {
            id: `ALT-${Date.now()}`,
            location: location || "Zone A",
            count: count || 0,
            behavior: behavior || "Unknown",
            risk: risk || "Warning",
            timestamp: timestamp || new Date().toISOString(),
            status: status || "New"
        };

        alerts.push(newAlert);
        console.log("[NODE] 🚨 ALERT CREATED:", newAlert.id, newAlert.location);
        res.json({ status: "Success", alert: newAlert });
    } catch (err) {
        console.error("[NODE] POST ERROR:", err.message);
        res.status(500).json({ error: err.message });
    }
});

app.patch('/api/alerts/:id', (req, res) => {
    const { id } = req.params;
    const { status } = req.body || {};
    const alert = alerts.find(a => a.id === id);
    if (!alert) return res.status(404).json({ error: "Missing" });
    alert.status = status;
    res.json({ status: "Updated", alert });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ [NODE-SERVER] Centralized Monitoring Hub running on Port ${PORT}`);
});
