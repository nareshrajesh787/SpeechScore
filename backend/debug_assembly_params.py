import requests
import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("ASSEMBLYAI_API_KEY")
transcription_url = "https://api.assemblyai.com/v2/transcript"
# Use a public accessible audio for testing to avoid upload step issues, 
# or use a previously uploaded URL if we had one. 
# We'll use a standard test sample from AssemblyAI docs.
test_audio_url = "https://storage.googleapis.com/aai-web-samples/5_common_sports_injuries.mp3"

def test_params(name, params):
    print(f"\nTesting {name}...")
    headers = {"authorization": api_key}
    data = {"audio_url": test_audio_url}
    data.update(params)
    
    response = requests.post(transcription_url, headers=headers, json=data)
    
    if response.status_code == 200:
        print("-> SUCCESS")
        return True
    else:
        print(f"-> FAILED: {response.status_code}")
        print(f"-> Response: {response.text}")
        return False

if __name__ == "__main__":
    if not api_key:
        print("Error: ASSEMBLYAI_API_KEY not found in env")
        exit(1)

    # 1. Baseline
    test_params("Baseline (audio_url only)", {})

    # 2. word_timestamps
    test_params("With word_timestamps", {"word_timestamps": True})

    # 3. disfluencies
    test_params("With disfluencies", {"disfluencies": True})
    
    # 4. punctuate
    test_params("With punctuate", {"punctuate": True})

    # 5. Combined
    test_params("Combined (All)", {
        "word_timestamps": True,
        "disfluencies": True,
        "punctuate": True
    })
