import pytest
import os
import sys
from unittest.mock import MagicMock, patch

os.environ["GEMINI_API_KEY"] = "test-key"
os.environ["ASSEMBLYAI_API_KEY"] = "test-key"
os.environ["FIREBASE_CREDENTIALS_JSON"] = '{"valid": "json"}'

import firebase_admin
firebase_admin.credentials = MagicMock()
firebase_admin.initialize_app = MagicMock()
firebase_admin.firestore = MagicMock()
firebase_admin.auth = MagicMock()

from httpx import AsyncClient, ASGITransport

from main import app
from schemas import AnalyzeRequest, AnalyzeResponse
from routers.analyze import process_audio_task

@pytest.mark.asyncio
async def test_health_check():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy", "service": "SpeechScore API"}

@pytest.mark.asyncio
async def test_analyze_unauthorized():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/analyze", json={
            "audio_url": "http://example.com/audio.mp3",
            "prompt": "Test prompt",
            "rubric": "Test rubric"
        })
    # Should fail because there is no Authorization header
    assert response.status_code == 422 # missing header validation in FastAPI depends


@pytest.mark.asyncio
async def test_coach_chat_unauthorized():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/coach/chat", json={
            "transcript": "Test transcript",
            "user_question": "How can I improve?"
        })
    # Should fail because there is no Authorization header
    assert response.status_code == 422 # missing header validation in FastAPI depends


def _make_fake_gemini_response():
    class RubricItem:
        def __init__(self, criterion, score, max_score):
            self.criterion = criterion
            self.score = score
            self.max_score = max_score

    response = MagicMock()
    response.strengths = ["Clear structure and logical flow"]
    response.improvements = ["Slow down during key points"]
    response.rubric_scores = [RubricItem("Clarity", 8.0, 10.0)]
    response.rubric_total = 8.0
    response.rubric_max = 10.0
    return response


def test_process_audio_task_writes_schema_valid_result():
    """
    Regression guard for the AnalyzeResponse contract: process_audio_task must
    build its Firestore payload through the Pydantic model, not a hand-rolled
    dict that can silently drift from what the frontend expects.
    """
    request = AnalyzeRequest(
        audio_url="http://example.com/audio.mp3",
        prompt="Test prompt",
        rubric="Test rubric",
        recording_id="rec123",
        project_id=None,
    )

    fake_transcription = {
        "text": "This is a test transcript.",
        "audio_duration": 10.0,
        "words": [
            {"text": "This", "start": 0, "end": 100, "confidence": 0.99},
            {"text": "is", "start": 100, "end": 200, "confidence": 0.98},
        ],
        "status": "completed",
    }

    mock_doc_ref = MagicMock()

    with patch("routers.analyze.transcribe_audio", return_value=fake_transcription), \
         patch("routers.analyze.gemini_output", return_value=_make_fake_gemini_response()), \
         patch("routers.analyze.db") as mock_db:
        mock_db.collection.return_value.document.return_value = mock_doc_ref

        process_audio_task(request, uid="test-uid")

    mock_doc_ref.set.assert_called_once()
    args, kwargs = mock_doc_ref.set.call_args
    payload = args[0]

    assert kwargs.get("merge") is True
    assert payload["status"] == "completed"

    # "status" is transport metadata, deliberately kept outside AnalyzeResponse.
    # Everything else must round-trip through the real schema.
    content = {k: v for k, v in payload.items() if k != "status"}
    AnalyzeResponse.model_validate(content)
