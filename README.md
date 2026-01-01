# SpeechScore

🌟 **AI-powered Speech Coach for Everyone**
**Practice, analyze, and improve your public speaking instantly in your browser.**

Live App: [https://speech-score.vercel.app/](https://speech-score.vercel.app/)

---

## What is SpeechScore?

SpeechScore is your personal speaking coach—powered by AI. Upload or record your speech, choose a prompt/rubric, and get instant feedback on clarity, pace, filler words, and delivery. With beautiful analytics and your own secure dashboard, you can track your progress, polish your communication skills, and boost your presentation confidence—anytime, anywhere.

### Who is it for?
- **Students & debate teams:** Practice for classroom talks, persuasive speeches, or debate rebuttals.
- **Professionals & job seekers:** Rehearse elevator pitches, interviews, sales, and conference talks.
- **Language learners:** Improve fluency, reduce filler words, and monitor clarity in your target language.
- **Content creators & podcasters:** Polish voiceovers, intros, and scripted content on the go.
- **Anyone:** Build confidence and get real feedback—no judgment, just growth.

---

## Features
- 🎙️ Record or upload your own audio right in your browser (secure, private)
- ⚡ Instant, AI-powered analysis & feedback based on your speech
- 📊 See strengths, improvement suggestions, WPM, rubric scores, clarity, filler count, and more
- 📅 Private dashboard: view and revisit all your past analyses
- 📝 Custom rubric support—define what "good" means for YOUR practice session
- 🔒 Google Sign-In: all your data is private and only accessible to you
- 💡 Simple, beautiful, modern UI designed to keep you motivated

---

## How It Works
1. **Sign in** with your Google account (no spam, private to you)
2. **Record** a new speech or upload an audio file (<20MB, MP3/WAV/AAC)
3. (Optional) **Set a prompt or custom rubric** for targeted feedback
4. **Get instant results:**
    - See your scores, words-per-minute, filler count, clarity, and actionable tips
    - Save or "Try Another" and repeat (it’s fun, really!)
5. **Visit your Dashboard** to track progress over time

---

## How does it work behind the scenes?
- **Frontend:** Modern React SPA using Vite, Tailwind CSS, and Firebase for instant login/data
- **Backend:** FastAPI (Python) deployed on Railway
    - Audio uploads
    - Uses AssemblyAI for automatic speech recognition (ASR)
    - Uses Google Gemini for AI-powered strengths, improvements, rubric scoring
- **Secure:** All scoring logic on the backend, authenticated with Firebase; your analyses live only in your Google account’s Firestore
- **No tracking, no ads, no nonsense.**

---

## 🚦 Technology Stack
- **Frontend:** React, Tailwind, Firebase Auth
- **Backend:** FastAPI, Python, AssemblyAI, Gemini (Google GenAI)
- **Deployment:** Vercel (frontend), Railway (backend)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Python 3.10+
- Firebase project (for authentication and database)
- AssemblyAI account (for speech recognition)
- Google Gemini API key (for AI analysis)

### Local Development Setup

#### Backend Setup

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create a virtual environment:**
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your API keys:
   - `ASSEMBLYAI_API_KEY`: Get from [AssemblyAI](https://www.assemblyai.com/app/account)
   - `GEMINI_API_KEY`: Get from [Google AI Studio](https://makersuite.google.com/app/apikey)
   - `FIREBASE_CREDENTIALS_JSON` or `FIREBASE_CREDENTIALS_FILE`: Firebase Admin SDK credentials
   - `ALLOWED_ORIGINS`: Comma-separated list of allowed CORS origins

5. **Run the backend server:**
   ```bash
   uvicorn main:app --reload
   ```
   The API will be available at `http://localhost:8000`

#### Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your Firebase configuration:
   - Get your Firebase config from [Firebase Console](https://console.firebase.google.com/)
   - Add all `VITE_FIREBASE_*` variables
   - Set `VITE_API_URL` to your backend URL (default: `http://localhost:8000`)

4. **Run the development server:**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173`

### Environment Variables

See `.env.example` files in both `frontend/` and `backend/` directories for required environment variables.

**Important Security Notes:**
- Never commit `.env` files or actual API keys to version control
- Use environment variables for all sensitive configuration
- In production, set environment variables through your hosting platform (Vercel, Railway, etc.)

---

## 📝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to contribute to this project.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
