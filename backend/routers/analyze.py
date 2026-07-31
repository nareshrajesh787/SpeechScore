from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, BackgroundTasks, status
from fastapi.responses import JSONResponse
from pathlib import Path
import os
import logging
from dotenv import load_dotenv

from assembly import transcribe_audio
from analyze import calc_wpm, check_fillers, pace_feedback, calc_confidence
from gemini import gemini_output
from firebase import get_current_user, db
from schemas import AnalyzeResponse, WordTiming, AnalyzeRequest, AIFeedback

load_dotenv()

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["analysis"])

assembly_api_key = os.getenv("ASSEMBLYAI_API_KEY")
if not assembly_api_key:
    print("Warning: ASSEMBLYAI_API_KEY not set")


def process_audio_task(request: AnalyzeRequest, uid: str):
    logger.info(f"Background task started. URL: {request.audio_url}, User: {uid}")
    
    try:
        if not assembly_api_key:
            logger.error("ASSEMBLYAI_API_KEY not configured")
            return
        
        logger.info(f"Starting transcription for {request.audio_url}")
        transcription = transcribe_audio(request.audio_url, assembly_api_key)
        transcript_text = transcription['text']

        logger.info("Transcription complete. Getting Gemini feedback.")
        gemini_response = gemini_output(transcript_text, request.prompt, request.rubric)

        audio_duration = transcription['audio_duration']
        wpm = calc_wpm(transcription)
        filler_count = check_fillers(transcription)
        pace_feedback_result = pace_feedback(wpm)
        confidence = calc_confidence(transcription) * 10
        strengths = gemini_response.strengths
        improvements = gemini_response.improvements
        rubric_scores_dict = {
            r.criterion: {"score": r.score, "max_score": r.max_score}
            for r in gemini_response.rubric_scores
        }
        rubric_total = gemini_response.rubric_total
        rubric_max = gemini_response.rubric_max

        words = None
        if 'words' in transcription and transcription['words']:
            words = [
                WordTiming(
                    text=word.get('text', ''),
                    start=word.get('start', 0),
                    end=word.get('end', 0),
                    confidence=word.get('confidence', 0.0)
                )
                for word in transcription['words']
            ]

        # Building this through AnalyzeResponse (rather than a hand-built dict)
        # means a missing/mistyped field fails here and routes to the except
        # block below, instead of silently writing a malformed Firestore doc.
        analyze_response = AnalyzeResponse(
            transcript=transcript_text,
            audio_duration=audio_duration,
            wpm=wpm,
            filler_count=filler_count,
            clarity_score=confidence,
            pace_feedback=pace_feedback_result,
            ai_feedback=AIFeedback(strengths=strengths, improvements=improvements),
            rubric_scores=rubric_scores_dict,
            rubric_total=rubric_total,
            rubric_max=rubric_max,
            words=words,
        )

        result = analyze_response.model_dump(mode="json")
        result["status"] = "completed"

        logger.info("Analysis complete successfully. Saving to Firestore.")

        # Determine Firestore path
        if request.project_id:
            doc_ref = db.collection('users').document(uid).collection('projects').document(request.project_id).collection('recordings').document(request.recording_id)
        else:
            doc_ref = db.collection('feedback').document(request.recording_id)

        # Merge result into the document, updating status to completed
        doc_ref.set(result, merge=True)

    except Exception as e:
        logger.error(f"Error processing audio in background task: {str(e)}", exc_info=True)
        # Update status to error
        try:
            if request.project_id:
                doc_ref = db.collection('users').document(uid).collection('projects').document(request.project_id).collection('recordings').document(request.recording_id)
            else:
                doc_ref = db.collection('feedback').document(request.recording_id)
            
            doc_ref.set({"status": "error", "error_message": str(e)}, merge=True)
        except Exception as inner_e:
            logger.error(f"Failed to update error status in Firestore: {str(inner_e)}")


@router.post("/analyze")
async def analyzeAudio(
    request: AnalyzeRequest,
    background_tasks: BackgroundTasks,
    user = Depends(get_current_user)
):
    """
    Queue audio file for analysis.
    Returns 202 Accepted.
    """
    uid = user.get('uid') if user else 'anonymous'
    logger.info(f"Analysis request queued. URL: {request.audio_url}, User: {uid}")

    background_tasks.add_task(process_audio_task, request, uid)

    return JSONResponse(
        status_code=status.HTTP_202_ACCEPTED,
        content={"status": "processing", "recording_id": request.recording_id}
    )

