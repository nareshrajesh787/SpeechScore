from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from pathlib import Path
import os
from dotenv import load_dotenv

from assembly import transcribe_audio
from analyze import calc_wpm, check_fillers, pace_feedback, calc_confidence
from gemini import gemini_output
from firebase import get_current_user
from schemas import AnalyzeResponse, WordTiming

load_dotenv()

router = APIRouter(prefix="/api", tags=["analysis"])

assembly_api_key = os.getenv("ASSEMBLYAI_API_KEY")
if not assembly_api_key:
    print("Warning: ASSEMBLYAI_API_KEY not set")

# Ensure temp directory exists
temp_dir = Path("temp")
temp_dir.mkdir(exist_ok=True)

# Maximum file size: 20MB
MAX_FILE_SIZE = 20 * 1024 * 1024


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyzeAudio(
    audio_file: UploadFile = File(...),
    prompt: str = Form(...),
    rubric: str = Form(...),
    user = Depends(get_current_user)
):
    """
    Analyze audio file and return comprehensive speech analysis results.
    
    - **audio_file**: Audio file to analyze (MP3, WAV, etc.)
    - **prompt**: Task/prompt for the analysis
    - **rubric**: Rubric criteria for evaluation
    - **user**: Authenticated user (from Firebase token)
    
    Returns analysis including transcript, WPM, filler words, clarity score,
    pace feedback, AI feedback, and rubric scores.
    """
    import time
    import logging

    logger = logging.getLogger(__name__)

    logger.info(f"Analysis request received. File: {audio_file.filename if audio_file else 'None'}, User: {user.get('uid') if user else 'None'}")
    
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
        if not assembly_api_key:
            logger.error("ASSEMBLYAI_API_KEY not configured")
            raise HTTPException(status_code=500, detail="Server configuration error")
        
        # SDK handles upload and polling
        logger.info(f"Starting transcription for {audio_file.filename}")
        transcription = transcribe_audio(str(audio_file_path), assembly_api_key)
        transcript_text = transcription['text']

        logger.info("Transcription complete. Getting Gemini feedback.")
        gemini_response = gemini_output(transcript_text, prompt, rubric)


        audio_duration = transcription['audio_duration']
        wpm = calc_wpm(transcription)
        filler_count = check_fillers(transcription)
        pace_feedback_result = pace_feedback(wpm)
        confidence = calc_confidence(transcription) * 10
        strengths = gemini_response.strengths
        improvements = gemini_response.improvements
        rubric_scores = [r.dict() for r in gemini_response.rubric_scores]
        # rubric_scores is list of dicts: {'criterion': '...', 'score': X, 'max_score': Y}
        # We need Dict[str, RubricScore] -> {'Criterion': {'score': X, 'max_score': Y}}
        rubric_scores_dict = {
            r['criterion']: {'score': r['score'], 'max_score': r['max_score']}
            for r in rubric_scores
        }
        rubric_total = gemini_response.rubric_total
        rubric_max = gemini_response.rubric_max

        # Extract word timestamps from AssemblyAI response
        words = None
        if 'words' in transcription and transcription['words']:
            words = [
                WordTiming(
                    text=word.get('text', ''),
                    start=word.get('start', 0),  # AssemblyAI returns in milliseconds
                    end=word.get('end', 0),
                    confidence=word.get('confidence', 0.0)
                )
                for word in transcription['words']
            ]

        result = AnalyzeResponse(
            transcript=transcript_text,
            audio_duration=audio_duration,
            wpm=wpm,
            filler_count=filler_count,
            clarity_score=confidence,
            pace_feedback=pace_feedback_result,
            ai_feedback={
                "strengths": strengths,
                "improvements": improvements,
            },
            rubric_scores=rubric_scores_dict,
            rubric_total=rubric_total,
            rubric_max=rubric_max,
            words=words,
        )

        logger.info("Analysis complete successfully.")
        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing audio: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="An error occurred while analyzing the speech."
        )
    finally:
        # Clean up temp file
        if audio_file_path and audio_file_path.exists():
            try:
                audio_file_path.unlink()
            except Exception:
                pass  # Ignore cleanup errors
