import assemblyai as aai
import os

def transcribe_audio(file_path: str, api_key: str) -> dict:
    """
    Transcribes audio using AssemblyAI SDK with word timestamps and disfluencies enabled.
    Returns a unified dictionary compatible with existing analyze.py logic.
    """
    aai.settings.api_key = api_key
    
    transcriber = aai.Transcriber()
    
    # Configure strict parameters for V2 requirements
    config = aai.TranscriptionConfig(
        disfluencies=True,  # Include "um", "uh"
        punctuate=True
    )
    
    # Transcribe (uploads automatically if file path given)
    transcript = transcriber.transcribe(file_path, config)
    
    if transcript.error:
        raise Exception(f"Transcription failed: {transcript.error}")
        
    # Map SDK object to dictionary structure expected by analyzers
    return {
        "text": transcript.text,
        "audio_duration": transcript.audio_duration,
        "words": [
            {
                "text": w.text,
                "start": w.start,
                "end": w.end,
                "confidence": w.confidence
            } for w in transcript.words
        ],
        "status": transcript.status
    }
