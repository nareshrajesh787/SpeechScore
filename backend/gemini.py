from google import genai
from pydantic import BaseModel
from schemas import CoachRequest
from dotenv import load_dotenv
import os

load_dotenv()
gemini_api_key = os.getenv("GEMINI_API_KEY")

client = genai.Client(api_key = gemini_api_key)



def gemini_output(transcript_text: str, u_prompt: str, rubric: str):
    class RubricItem(BaseModel):
        criterion: str
        score: float
        max_score: float

    class response_format(BaseModel):
        strengths: list[str]
        improvements: list[str]
        rubric_scores: list[RubricItem]
        rubric_total: float
        rubric_max: float

    # Prompt for Gemini
    g_prompt = f"""
    You are an assistant that evaluates student presentations.
    
    Transcript:
    {transcript_text}

    Task/Prompt:
    {u_prompt}

    Rubric:
    {rubric}

    Instructions:
    1. Evaluate the provided transcript against the rubric.
    2. Assign a numeric score for each rubric criterion.
       - If the rubric specifies maximums, RESPECT THEM and extract the `max_score`.
       - If no maximums are given, assume equal weighting out of 100 total (e.g. 5 criteria = 20 max each).
    3. Provide specific strengths and areas for improvement as concise bullet-style items.
       Example:
       - Clear structure and logical flow
       - Slow down during important points

    Return the results strictly in the structured schema provided.
    """

    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=[g_prompt],
        config={
        "response_mime_type": "application/json",
        "response_schema": response_format,
        },
    )

    return response.parsed


def chat_with_coach(request: CoachRequest) -> str:
    """
    Sends a chat request to the Gemini "Coach" personality.
    """
    try:
        # Construct the system instruction / context
        system_instruction = f"""
        You are an expert speech coach.
        You are analyzing the following student speech:
        TRANSCRIPT:
        {request.transcript}

        RUBRIC FEEDBACK:
        {request.rubric_feedback or "No specific rubric feedback provided."}

        Answer the student's question concisely and constructively. 
        Reference specific parts of the transcript (e.g., intro, conclusion, key timestamps) when helpful. 
        Focus on practical, actionable suggestions they can apply in their next draft.
        """

        # Format chat history for Gemini
        # We'll use the chat capability or just append to prompt. 
        # For simplicity and statelessness in this v1, 
        # we will construct a list of contents including history.
        
        contents = []
        
        # Add a system-like context as the first user part or rely on the system_instruction 
        # (Gemini 1.5/2.0 supports system instructions more formally, but here we can prepend to the first user message 
        # or use the 'system_instruction' parameter if the SDK supports it nicely. 
        # Given the "generate_content" usage above, let's try to stick to a simple prompt structure 
        # or a proper chat history list if using a chat-tuned model).
        
        # Let's use a "ChatSession" style but manually constructed for one-shot REST if needed, 
        # OR just map everything to "user"/"model" turns.
        
        # We will prepend the system instruction to the conversation.
        # However, to be robust, let's treat the system instruction as a setup.
        
        # Note: 'role' in Gemini API is usually 'user' or 'model'.
        history_gemini = []
        for msg in request.chat_history:
            role = "user" if msg.role == "user" else "model"
            history_gemini.append({"role": role, "parts": [{"text": msg.content}]})
            
        # Add the current user question
        current_turn = {"role": "user", "parts": [{"text": f"{system_instruction}\n\nSTUDENT QUESTION: {request.user_question}"}]}
        
        # Combine history + current
        # If history is long, we might need to truncate, but for now we assume it's manageable.
        # If history exists, we should probably ONLY put the system prompt in the *first* message 
        # or strictly as a system instruction if we were creating a chat object.
        # To keep it simple and stateless: we'll put the system context in the current specific prompt 
        # or prepend it.
        
        # Better approach for stateless "history":
        full_contents = history_gemini + [current_turn]

        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=full_contents,
        )
        
        return response.text

    except Exception as e:
        print(f"Gemini Coach Error: {e}")
        return "I'm having a bit of trouble connecting to the coach right now. Please try again in a moment."

