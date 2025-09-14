from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from assembly import upload_to_assembly, start_transcription, poll_transcription
from analyze import calc_wpm, check_fillers, pace_feedback, calc_confidence
from gemini import gemini_output
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
async def analyzeAudio(
    audio_file: UploadFile = File(...),
    prompt: str = Form(...),
    rubric: str = Form(...),
    ):

    audio_file_path = f"temp/{audio_file.filename}"
    contents = await audio_file.read()

    with open(f"temp/{audio_file.filename}", 'wb') as f:
        f.write(contents)

    assembly_audio_url = upload_to_assembly(f"temp/{audio_file.filename}", assembly_api_key)
    transcription_id = start_transcription(assembly_audio_url, assembly_api_key)
    transcription = poll_transcription(transcription_id, assembly_api_key)

    gemini_response = gemini_output(audio_file_path, prompt, rubric)


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
