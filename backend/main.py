from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from assembly import upload_to_assembly, start_transcription, poll_transcription
from analyze import calc_wpm, check_fillers, pace_feedback, calc_confidence
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

load_dotenv()
assembly_api_key = os.getenv("ASSEMBLYAI_API_KEY")

@app.post("/api/analyze")
async def analyzeAudio(file: UploadFile = File(...)):
    contents = await file.read()

    with open(f"temp/{file.filename}", 'wb') as f:
        f.write(contents)

    assembly_audio_url = upload_to_assembly(f"temp/{file.filename}", assembly_api_key)
    transcription_id = start_transcription(assembly_audio_url, assembly_api_key)
    transcription = poll_transcription(transcription_id, assembly_api_key)


    transcript = transcription['text']
    audio_duration = transcription['audio_duration']
    wpm = calc_wpm(transcription)
    filler_count = check_fillers(transcription)
    pace_feedback_result = pace_feedback(wpm)
    confidence = calc_confidence(transcription)

    return {
        "transcript": transcript,
        "audio_duration": audio_duration,
        "wpm": wpm,
        "filler_count": filler_count,
        "pace_feedback_result": pace_feedback_result,
        "confidence": confidence
    }
