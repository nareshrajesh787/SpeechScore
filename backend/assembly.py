import requests, time

def upload_to_assembly(file_path: str, api_key: str) -> str:

    upload_url = "https://api.assemblyai.com/v2/upload"

    with open(file_path, 'rb') as f:
        response = requests.post(upload_url, headers={"authorization": api_key}, data=f)

    return response.json()['upload_url']

def start_transcription(assembly_audio_url: str, api_key: str) -> str:
    transcription_url = "https://api.assemblyai.com/v2/transcript"

    data = {"audio_url": assembly_audio_url}
    response = requests.post(transcription_url, headers={"authorization": api_key, "content-type": "application/json"}, json=data)

    return response.json()['id']

def poll_transcription(transcription_id: str, api_key: str) -> dict:

    polling_url = f"https://api.assemblyai.com/v2/transcript/{transcription_id}"

    while True:
        response = requests.get(polling_url, headers={"authorization": api_key})
        data = response.json()
        status = data['status']
        if status == 'completed':
            return data
        elif status == 'error':
            raise Exception("Transcription failed" + data.get('error', 'Unknown error'))
        else:
            time.sleep(3)
