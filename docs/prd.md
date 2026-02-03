# SpeechScore - Product Requirements Document (PRD)

## 1. Product Summary
SpeechScore is an AI-powered communication coach that transforms public speaking practice from a passive "grading" experience into an active, iterative training loop. Unlike simple voice recorders or static file analyzers, SpeechScore helps high-stakes speakers (students, interviewees) record, analyze, listen to specific errors, and re-record until they meet their goals.

**Core Value Proposition:** "Don't just get a grade. Get better. Record, review, and iterate until you're ready for the stage."

## 2. Target Audience
* **Primary:** Competitive Students (High School/College). Participants in FBLA, Forensics, Debate, and Model UN who need to perfect specific speeches against strict rubrics.
* **Secondary:** Job Seekers. Candidates practicing standard interview questions (e.g., "Tell me about yourself") who need to eliminate filler words and improve structure (STAR method).

## 3. Current Tech Stack & Architecture
* **Frontend:**
    * **Framework:** React (Vite).
    * **Styling:** Tailwind CSS.
    * **State/Auth:** Firebase Client SDK.
    * **Hosting:** Vercel/Netlify (Implicit in Vite setup).
* **Backend:**
    * **Framework:** FastAPI (Python).
    * **Role:** Stateless compute engine. Handles orchestration of AI services and local metric calculations (WPM).
* **Data & Auth:**
    * **Auth:** Firebase Authentication (Google Sign-In).
    * **Database:** Cloud Firestore (Directly accessed by Frontend for persistence).
* **AI Services:**
    * **Transcription:** AssemblyAI (Audio-to-Text).
    * **Intelligence:** Google Gemini (Qualitative feedback, rubric scoring).

**Architecture Flow (Current):**
1.  **Client (React):** Authenticates via Firebase Auth -> Uploads Audio File to Backend.
2.  **Backend (FastAPI):** Receives file -> Uploads to AssemblyAI -> Polls for Transcript -> Sends Transcript to Gemini -> Calculates WPM locally -> Returns JSON to Client.
3.  **Client (React):** Renders results -> Saves JSON to Firestore (`feedback` collection).

## 4. Goal Tech Stack & Architecture (V2.0)
The V2.0 architecture shifts from a simple "analyzer" to a structured "workspace" supporting projects and iterations.

* **Frontend Structure:**
    * **Dashboard View:** Lists User's Projects.
    * **Project View:** Lists Drafts/Recordings within a Project.
    * **Analysis View:** Deep dive into a specific recording (Audio Player + Transcript).
* **Backend Structure:**
    * **Refactored FastAPI:** Split monolithic `main.py` into modular routers:
        * `routers/auth.py` (Token verification).
        * `routers/projects.py` (Project management logic).
        * `routers/analysis.py` (The core AssemblyAI/Gemini logic).
    * **Standardization:** Pydantic models for all API Request/Response schemas.
* **Data Model (Firestore):**
    * **Hierarchy:** `users/{uid}/projects/{projectId}/recordings/{recordingId}`
    * **Logic:** Backend remains stateless; state is managed in Firestore. Frontend reads directly for UI; Backend writes analysis results to Firestore (optional) or returns to Frontend to save.

**Architecture Flow (V2.0):**
* **Analyze Recording:** Browser (Recorder) -> Backend (`/api/analysis`) -> AssemblyAI (JSON with timestamps) -> Gemini -> Response -> Frontend saves to `.../recordings/{id}`.
* **List Projects/Drafts:** Browser -> Firestore Query (`users/{uid}/projects`) -> UI Render.

## 5. Core User Journeys (V2.0)

### The "Project Loop" (Primary Workflow)
1.  **Project Creation:** User creates a Project workspace (e.g., "FBLA State Finals" or "Tech Sales Interview").
2.  **Draft 1 (The Baseline):** User records audio directly in the browser (or uploads a file).
3.  **Deep Analysis:**
    * User sees WPM, Clarity Score, and Filler Count.
    * **Interactive Review:** User clicks a red "um" in the transcript to hear the audio context immediately.
4.  **Iteration (Draft 2+):** User records a new take, trying to apply the feedback (e.g., "Slow down in the intro").
5.  **Comparison:** User views a trend chart showing improvement (e.g., "Draft 3 was 15% clearer than Draft 1").

## 6. Feature Roadmap

### Current Baseline (v1.0 - Prototype)
* **Core:** Google Auth, File Upload (MP3/WAV), AssemblyAI Transcription, Gemini Qualitative Feedback.
* **Feedback:** Static text report (Strengths/Weaknesses), WPM calculation, simple filler word highlighting.

### v1.1 (Polish & Foundation - Track A)
* **Architecture:** Modular backend routing (splitting `main.py`), standardized Pydantic schemas.
* **UI/UX:** Component library (reusable Cards/Buttons), Skeleton loading states to reduce perceived latency.
* **Reliability:** Robust error handling for API failures.

### V2.0 (The Competitive Career Coach - Track B)
* **Studio Mode:** In-browser audio recording (MediaRecorder API) with pause/resume and visual waveform.
* **Interactive Transcript:** "Click-to-play" word-level timestamps (requires granular AssemblyAI data).
* **Project Hierarchy:** Firestore structure update to support `User -> Project -> Drafts`.
* **Iteration History:** Dashboard view showing all drafts for a single speech side-by-side.
* **Drill Down:** Ability to filter analysis by specific categories (e.g., "Show me only pace warnings").

## 7. Success Criteria

### UX & Product
* **Latency:** Analysis "Time to First Byte" < 3 seconds; Full Report < 15 seconds for a 2-minute speech.
* **Retention:** >40% of users record a "Draft 2" within the same session.
* **Usability:** "Click-to-play" sync accuracy within +/- 0.5 seconds of the audio word.

### Technical
* **Scalability:** Backend statelessness maintained; all state lives in Firestore.
* **Safety:** No sensitive audio stored permanently on backend disk (temp only, then AssemblyAI/Cloud Storage).