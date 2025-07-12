import re

def calc_wpm(transcription: dict) -> int:
    words = transcription['words']
    duration_secs = transcription['audio_duration']

    wpm = round(len(words)/(duration_secs / 60), 0)
    return wpm

def check_fillers(transcription: dict) -> dict:
    fillers = {"um", "uh", "like", "you know", "so", "actually", "basically", "i mean", "sort of", "kind of"}
    filler_count = {}
    lwords = [re.sub(r'[^a-zA-Z]', '', w['text'].lower()) for w in transcription['words']]

    for i in range(len(lwords)):
        single = lwords[i]

        if single in fillers:
            filler_count[single] = filler_count.get(single, 0) + 1

        pair = f"{single} {lwords[i+1]}" if (i+1) < len(lwords) else None
        if pair in fillers:
            filler_count[pair] = filler_count.get(pair, 0) + 1

    return filler_count

def pace_feedback(wpm: int) -> str:
    if wpm < 90:
        return "Your pace is too slow. Try to speed up your speaking."
    elif wpm > 150:
        return "Your pace is too fast. Try to slow down your speaking."
    else:
        return "Your pace is just right. Keep it up!"

def calc_confidence(transcription: dict) -> float:
    words = transcription['words']
    total_confidence = sum(words['confidence'] for words in transcription['words']) / len(words)
    return round(total_confidence, 2)
