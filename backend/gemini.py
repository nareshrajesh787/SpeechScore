from google import genai
from pydantic import BaseModel
from dotenv import load_dotenv
import os

load_dotenv()
gemini_api_key = os.getenv("GEMINI_API_KEY")

client = genai.Client(api_key = gemini_api_key)



def gemini_output(audio_file_path: str, u_prompt: str, rubric: str):
    class RubricItem(BaseModel):
        criterion: str
        score: float

    class response_format(BaseModel):
        transcription: str
        strengths: list[str]
        improvements: list[str]
        rubric_scores: list[RubricItem]
        rubric_total: float
        rubric_max: float

    audio = client.files.upload(file=audio_file_path)

    # Prompt for Gemini
    g_prompt = f"""
    You are an assistant that evaluates student presentations.

    Task/Prompt:
    {u_prompt}

    Rubric:
    {rubric}

    Instructions:
    1. Transcribe the provided audio.
    2. Evaluate the speech against the rubric.
    3. Assign a numeric score for each rubric criterion.
       - If the rubric specifies maximums, respect them.
       - If no maximums are given, assume equal weighting out of 100 total.
    4. Provide specific strengths and areas for improvement as concise bullet-style items.
       Example:
       - Clear structure and logical flow
       - Slow down during important points

    Return the results strictly in the structured schema provided.
    """

    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=[g_prompt, audio],
        config={
        "response_mime_type": "application/json",
        "response_schema": response_format,
        },
    )

    return response.parsed
