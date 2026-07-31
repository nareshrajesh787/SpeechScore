from fastapi import APIRouter, HTTPException, Depends
from schemas import CoachRequest, CoachResponse
from gemini import chat_with_coach
from firebase import get_current_user

router = APIRouter(
    prefix="/api/coach",
    tags=["coach"],
    responses={404: {"description": "Not found"}},
)

@router.post("/chat", response_model=CoachResponse)
async def chat(request: CoachRequest, user = Depends(get_current_user)):
    """
    Chat with the AI Speech Coach.
    """
    try:
        response_text = chat_with_coach(request)
        return CoachResponse(response=response_text)
    except Exception as e:
        # In case something goes wrong in the router logic itself
        raise HTTPException(status_code=500, detail=str(e))
