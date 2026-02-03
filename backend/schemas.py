from pydantic import BaseModel
from typing import Dict, List, Optional, Literal


class WordTiming(BaseModel):
    """Word-level timestamp from AssemblyAI."""
    text: str
    start: float  # Start time in milliseconds
    end: float    # End time in milliseconds
    confidence: float


class AnalyzeRequest(BaseModel):
    """Request schema for audio analysis endpoint."""
    prompt: str
    rubric: str


class AIFeedback(BaseModel):
    """AI-generated feedback structure."""
    strengths: List[str]
    improvements: List[str]


class AnalyzeResponse(BaseModel):
    """Response schema for audio analysis endpoint."""
    transcript: str
    audio_duration: float
    wpm: int
    filler_count: Dict[str, int]
    clarity_score: float
    pace_feedback: str
    ai_feedback: AIFeedback
    rubric_scores: Dict[str, float]
    rubric_total: float
    rubric_max: float
    words: Optional[List[WordTiming]] = None  # Word-level timestamps for interactive transcript


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class CoachRequest(BaseModel):
    transcript: str
    rubric_feedback: Optional[str] = None
    chat_history: List[ChatMessage] = []
    user_question: str


class CoachResponse(BaseModel):
    response: str