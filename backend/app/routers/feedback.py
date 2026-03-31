"""Feedback endpoint: users report incorrect ingredient classifications."""

from fastapi import APIRouter, Depends, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database import IngredientFeedback, get_db
from app.models.schemas import FeedbackRequest, FeedbackResponse

router = APIRouter(tags=["feedback"])
limiter = Limiter(key_func=get_remote_address)


@router.post("/feedback", response_model=FeedbackResponse)
@limiter.limit("10/minute")
async def submit_feedback(
    request: Request,
    body: FeedbackRequest,
    db: AsyncSession = Depends(get_db),
) -> FeedbackResponse:
    feedback = IngredientFeedback(
        ingredient_name=body.ingredient_name,
        feedback_type=body.feedback_type,
        reported_status=body.reported_status,
        note=body.note,
        original_status=body.original_status,
        madhab=body.madhab,
    )
    db.add(feedback)
    await db.commit()
    return FeedbackResponse(success=True, message="Thank you for your feedback!")
