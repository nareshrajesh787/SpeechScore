# System Architecture

## Overview

SpeechScore is a "Competitive Career Coach" web application designed to help users improve high-stakes public speaking through iteration. The architecture is built on a **stateless backend** (FastAPI) that orchestrates AI services (AssemblyAI, Gemini) and a **rich client** (React) that manages user state and persistence directly via Firebase. This design decouples compute-heavy analysis from state management, allowing for scalable, isolated speech processing.

## System Components

### Frontend
*   **Role**: Primary user interface for recording, dashboard management, and interactive feedback.
*   **Tech Stack**: React, Vite, Tailwind CSS. Hosted on **Vercel**.
*   **Notes**: The frontend communicates directly with Firestore for reading/writing project data (`users/{uid}/projects`). It only talks to the backend for compute-intensive tasks (analysis, coaching chat) and utilizes `Firebase Auth` SDK for session management.

### Backend
*   **Role**: Stateless compute engine for AI orchestration.
*   **Tech Stack**: Python, FastAPI. Hosted on **Railway**.
*   **Notes**: Does not store permanent user data. It receives audio/text, processes it via external APIs, and returns JSON results. It validates requests using Firebase Auth ID tokens.

### Auth & Data
*   **Role**: Identity provider and document database.
*   **Tech Stack**: Firebase Authentication (Google Sign-In) and Cloud Firestore.
*   **Notes**:
    *   **Auth**: Handled via client-side SDK. Tokens are passed to the backend in `Authorization` headers.
    *   **Data**: Firestore acts as the single source of truth for user projects, recordings, and feedback.

### AI Services
*   **AssemblyAI**: Handles speech-to-text (STT) and word-level timestamping for the "interactive transcript" feature.
*   **Google Gemini**: Large Language Model (LLM) used for qualitative analysis (clarity, pacing checks) and the conversational "Ask the Coach" feature.

## Request Flows

### 1. Analyze Recording Flow
1.  **Browser**: User records audio (MediaRecorder API) or uploads a file.
2.  **Browser → Backend**: Sends `POST /api/analyze` (FormData with audio file + auth token).
3.  **Backend → AssemblyAI**: Uploads audio -> Polls for transcript (with word timestamps).
4.  **Backend → Gemini**: Sends transcript + rubric prompt for qualitative analysis.
5.  **Backend**: Calculates local metrics (WPM, filler word density).
6.  **Backend → Browser**: Returns JSON response containing transcript, feedback, and metrics.
7.  **Browser → Firestore**: Saves result to `users/{uid}/projects/{pid}/recordings/{rid}`.

### 2. Ask the Coach Flow
1.  **Browser**: User types a question in the "Ask the Coach" chat UI.
2.  **Browser → Backend**: Sends `POST /api/coach/chat` (Question + Transcript context + Chat History).
3.  **Backend → Gemini**: Generates a response grounded in the specific speech's content.
4.  **Backend → Browser**: Returns the answer.
5.  **Browser**: Updates local chat state (chat history is currently ephemeral or stored in Firestore depending on implementation).

## Data Model

Data is structured hierarchically in **Cloud Firestore** to support the "Project" workflow:

`users/{uid}/projects/{projectId}/recordings/{recordingId}`

*   **Projects** (`.../projects/{projectId}`):
    *   Stores metadata: `title`, `scenario` (e.g., "Job Interview"), `createdAt`.
    *   Acts as a container for iterations of the same speech.
*   **Recordings** (`.../recordings/{recordingId}`):
    *   Stores the analysis result for a specific take: `transcript`, `metrics` (wpm, filler_count), `feedback` (strengths/weaknesses), `audioUrl` (pointer to Cloud Storage).
    *   Allows trending analysis by comparing `createdAt` timestamps.

## Non-Goals / Current Scope

*   **No Multi-Tenancy**: The system is designed for individual users, not teams or organizations (yet).
*   **No Real-Time Streaming**: Analysis happens *after* the recording is finished, not live while speaking.
*   **Ephemeral Chat**: "Ask the Coach" history is currently session-based or strictly scoped to the viewing of a single recording.

## Future Considerations

*   **Background Jobs**: Move long-running transcriptions to a background worker (e.g., Celery/Redis) to avoid HTTP timeouts on long speeches.
*   **Vector Search**: Store embeddings of past speeches to allow users to "search" their own history (e.g., "When did I talk about leadership?").
*   **Custom Models**: Fine-tuning a smaller LLM for specific debate formats (e.g., Policy vs. Lincoln-Douglas) for faster/cheaper feedback.
