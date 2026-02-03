# Operations & Deployment

This document outlines the operational details, environment configuration, and deployment strategy for SpeechScore.

## 1. System Overview

### Frontend (Vercel)
*   **Framework**: React + Vite (SPA)
*   **Entry Point**: `src/main.jsx`
*   **Output**: `dist/`
*   **Configuration**: `vite.config.js`, `vercel.json` (routing)

### Backend (Railway)
*   **Framework**: FastAPI (Python)
*   **Entry Point**: `main.py`
*   **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
*   **Configuration**: `railway.json`, `requirements.txt`

## 2. Environment Configuration

### Frontend Variables
These must be set in Vercel or `.env` for local development.

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend URL (e.g., `https://backend.app` or `http://localhost:8000`) |
| `VITE_FIREBASE_API_KEY` | Firebase Public API Key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase App ID |

> **Note**: `VITE_` variables are exposed to the browser. This is safe for standard Firebase client config.

### Backend Variables
These must be set in Railway or `.env` for local development.

| Variable | Description |
|----------|-------------|
| `ALLOWED_ORIGINS` | Comma-separated CORS origins (e.g., `https://myapp.vercel.app,http://localhost:5173`) |
| `GEMINI_API_KEY` | Google Gemini AI Key |
| `ASSEMBLYAI_API_KEY` | AssemblyAI Key |
| `FIREBASE_CREDENTIALS_JSON` | **Production**: JSON string of Service Account |
| `FIREBASE_CREDENTIALS_FILE` | **Local**: Path to Service Account JSON (e.g., `firebase-creds.json`) |

#### Setting up Backend Credentials
1.  **Local Dev**: Point `FIREBASE_CREDENTIALS_FILE` to your downloaded JSON key.
2.  **Production (Railway)**: Flatten the JSON key into a single string line and set it as `FIREBASE_CREDENTIALS_JSON`.
    *   Helper script: `python backend/convert_firebase_creds.py path/to/key.json`

## 3. Production Checklist

### Security & Config
- [ ] **Secrets**: Ensure `GEMINI_API_KEY` and `ASSEMBLYAI_API_KEY` are set. The server will fail to start if missing.
- [ ] **CORS**: Add the production Vercel domain to `ALLOWED_ORIGINS` in Railway.
- [ ] **Logging**: The application logs to stdout/stderr. Do not look for local log files.

### Deploying
1.  **Backend**: Push to Railway.
    *   Verify health check: `https://<your-railway-url>/api/health`
    *   Verify Swagger docs: `https://<your-railway-url>/docs`
2.  **Frontend**: Push to Vercel.
    *   Ensure `VITE_API_URL` matches the Railway URL.
    *   Verify deep links work (handled by `vercel.json`).

## 4. Canonical Documentation
*   `README.md`: Project entry point.
*   `docs/prd.md`: Product roadmap and requirements.
*   `docs/design-language.md`: UI/UX standards.
*   `docs/operations.md`: This file.
