# SpeechScore

**AI practice studio for high-stakes speaking: record, analyze, and iterate on speeches with targeted feedback and coaching.**

## Overview

SpeechScore (V2.0) transforms public speaking practice from a passive "grading" experience into an active, iterative training loop—a "Competitive Career Coach" in your browser. Designed for high-stakes speakers like debate students and job seekers, it organizes practice into **Projects** where you can record drafts, receive immediate feedback on pacing and clarity, and even chat with an AI coach grounded in your specific speech to improve over time.

## Features

*   **Projects & Scenarios**: Organize your practice by goal (e.g., "FBLA State Finals", "Tech Sales Pitch", or "Job Interview").
*   **Recording & Analysis**: Record directly in the browser or upload files. Powered by AssemblyAI for precise transcription and Gemini for qualitative insights.
*   **Interactive Transcript**: Click any word or "filler" detected in the transcript to instantly play that section of the audio.
*   **Ask the Coach**: Chat with an AI coach that understands the context of your specific speech to get tailored advice (e.g., "How can I make my opening hook stronger?").
*   **Progress Over Drafts**: Track how your pacing, clarity, and filler word usage improve from Draft 1 to Draft 5.

## Architecture & Tech Stack

*   **Frontend**: React + Vite + Tailwind CSS (Deployed on Vercel).
*   **Backend**: FastAPI with modular routers (Deployed on Railway).
*   **Auth & Data**: Firebase Authentication + Cloud Firestore.
    *   Data Hierarchy: `users/{uid}/projects/{projectId}/recordings/{recordingId}`.
*   **AI Services**:
    *   **AssemblyAI**: Speech-to-text and timestamping.
    *   **Google Gemini**: Qualitative analysis and coaching chat.

### Key Data Flows
*   **Analyze Recording**: Browser → FastAPI (`/api/analysis`) → AssemblyAI → Gemini → Client.
*   **Ask the Coach**: Browser → FastAPI (`/api/coach`) → Gemini (with transcript context) → Client.

## Getting Started (Local Development)

Follow these steps to run SpeechScore locally. For full operational details, see `docs/operations.md`.

### Prerequisites
*   Node.js (v18+)
*   Python (v3.10+)
*   Firebase Project (Auth & Firestore enabled)

### 1. Clone & Install
```bash
git clone https://github.com/your-username/SpeechScore.git
cd SpeechScore

# Frontend
cd frontend
npm install

# Backend
cd ../backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure Environment
Create `.env` files in both `frontend/` and `backend/` folders. **Do not commit these files.**

**Backend (.env):**
*   `GEMINI_API_KEY`
*   `ASSEMBLYAI_API_KEY`
*   `FIREBASE_CREDENTIALS_FILE` (Path to your service account JSON)
*   `ALLOWED_ORIGINS` (e.g., `http://localhost:5173`)

**Frontend (.env):**
*   `VITE_API_URL` (Set to `http://localhost:8000`)
*   `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, etc.

### 3. Run Locally

**Backend:**
```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm run dev
```

## Deployment

*   **Frontend (Vercel)**: Connect your GitHub repo. Set `VITE_API_URL` to your production backend URL.
*   **Backend (Railway)**: Connect your GitHub repo. Set `GEMINI_API_KEY`, `ASSEMBLYAI_API_KEY`, and `FIREBASE_CREDENTIALS_JSON`.

For a detailed deployment checklist, see [docs/operations.md](docs/operations.md).

## Documentation

*   [docs/prd.md](docs/prd.md) – Product Requirements & Roadmap.
*   [docs/architecture.md](docs/architecture.md) – System Architecture & Data Flows.
*   [docs/design-language.md](docs/design-language.md) – Design System & Visual Identity.
*   [docs/operations.md](docs/operations.md) – Operations, Environment Vars & Deployment Manual.
