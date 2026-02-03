import assemblyai as aai
import os
from dotenv import load_dotenv

load_dotenv()

aai.settings.api_key = os.getenv("ASSEMBLYAI_API_KEY")

def test_transcription():
    transcriber = aai.Transcriber()
    # Try WITHOUT word_timestamps arg, but keeping disfluencies
    config = aai.TranscriptionConfig(
        disfluencies=True,
        punctuate=True
    )
    
    # Use public sample
    audio_url = "https://storage.googleapis.com/aai-web-samples/5_common_sports_injuries.mp3"
    
    print("Transcribing...")
    transcript = transcriber.transcribe(audio_url, config)
    
    if transcript.error:
        print(f"Error: {transcript.error}")
        return

    print("Status:", transcript.status)
    print("Word count:", len(transcript.words))
    if len(transcript.words) > 0:
        w = transcript.words[0]
        print(f"First word: '{w.text}' Start: {w.start} End: {w.end}")
        
    # Check for 'um' if possible (might not be in this clean sample, but we just check if words exist)

if __name__ == "__main__":
    test_transcription()
