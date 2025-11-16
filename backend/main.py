from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from assembly import upload_to_assembly, start_transcription, poll_transcription
from analyze import calc_wpm, check_fillers, pace_feedback, calc_confidence
from gemini import gemini_output
from firebase import get_current_user
import os
from pathlib import Path

load_dotenv()

app = FastAPI(
    title="SpeechScore API",
    description="AI-powered speech analysis API",
    version="1.0.0"
)

# CORS configuration - supports both development and production
allowed_origins_str = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
# Split by comma and strip whitespace from each origin
allowed_origins = [origin.strip() for origin in allowed_origins_str.split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

assembly_api_key = os.getenv("ASSEMBLYAI_API_KEY")

# Ensure temp directory exists
temp_dir = Path("temp")
temp_dir.mkdir(exist_ok=True)

# Health check endpoint
@app.get("/health")
@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "SpeechScore API"}

# Maximum file size: 20MB
MAX_FILE_SIZE = 20 * 1024 * 1024

@app.post("/api/analyze")
async def analyzeAudio(
    audio_file: UploadFile = File(...),
    prompt: str = Form(...),
    rubric: str = Form(...),
    user = Depends(get_current_user)
    ):

    audio_file_path = None
    try:
        # Validate file size
        contents = await audio_file.read()
        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"File too large. Maximum size is {MAX_FILE_SIZE / (1024*1024):.0f}MB"
            )

        # Validate file type
        if not audio_file.content_type or not audio_file.content_type.startswith('audio/'):
            raise HTTPException(
                status_code=400,
                detail="Invalid file type. Only audio files are allowed."
            )

        # Save file
        audio_file_path = temp_dir / audio_file.filename
        with open(audio_file_path, 'wb') as f:
            f.write(contents)

        # Process audio
        assembly_audio_url = upload_to_assembly(str(audio_file_path), assembly_api_key)
        transcription_id = start_transcription(assembly_audio_url, assembly_api_key)
        transcription = poll_transcription(transcription_id, assembly_api_key)

        gemini_response = gemini_output(str(audio_file_path), prompt, rubric)

        transcript = transcription['text']
        audio_duration = transcription['audio_duration']
        wpm = calc_wpm(transcription)
        filler_count = check_fillers(transcription)
        pace_feedback_result = pace_feedback(wpm)
        confidence = calc_confidence(transcription) * 10
        strengths = gemini_response.strengths
        improvements = gemini_response.improvements
        rubric_scores = [r.dict() for r in gemini_response.rubric_scores]
        rubric_scores_dict = {r['criterion']: r['score'] for r in rubric_scores}
        rubric_total = gemini_response.rubric_total
        rubric_max = gemini_response.rubric_max

        result = {
            "transcript": transcript,
            "audio_duration": audio_duration,
            "wpm": wpm,
            "filler_count": filler_count,
            "clarity_score": confidence,
            "pace_feedback": pace_feedback_result,
            "ai_feedback": {
                "strengths": strengths,
                "improvements": improvements,
            },
            "rubric_scores": rubric_scores_dict,
            "rubric_total": rubric_total,
            "rubric_max": rubric_max,
        }

        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing audio: {str(e)}"
        )
    finally:
        # Clean up temp file
        if audio_file_path and audio_file_path.exists():
            try:
                audio_file_path.unlink()
            except Exception:
                pass  # Ignore cleanup errors
