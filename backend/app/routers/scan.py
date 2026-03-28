"""Scan endpoints: classify ingredients from text or image."""

from fastapi import APIRouter, Depends, HTTPException, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.database import get_db
from app.models.schemas import (
    ClassificationResponse,
    ScanImageRequest,
    ScanTextRequest,
)
from app.services.classification import classify_from_image, classify_from_text

router = APIRouter(tags=["scan"])
limiter = Limiter(key_func=get_remote_address)


@router.post("/scan/text", response_model=ClassificationResponse)
@limiter.limit("20/minute")
async def scan_text(
    request: Request,
    body: ScanTextRequest,
    db: AsyncSession = Depends(get_db),
) -> ClassificationResponse:
    try:
        return await classify_from_text(
            raw_text=body.text,
            madhab=body.madhab,
            db=db,
            embedding_model=request.app.state.embedding_model,
            llm_client=request.app.state.llm_client,
            llm_model=settings.deepseek_model,
        )
    except ValueError as e:
        raise HTTPException(status_code=502, detail=str(e)) from e


@router.post("/scan/image", response_model=ClassificationResponse)
@limiter.limit("10/minute")
async def scan_image(
    request: Request,
    body: ScanImageRequest,
    db: AsyncSession = Depends(get_db),
) -> ClassificationResponse:
    if len(body.image) > 14_000_000:
        raise HTTPException(
            status_code=413, detail="Image too large. Maximum size is 10MB."
        )

    try:
        return await classify_from_image(
            image_base64=body.image,
            madhab=body.madhab,
            db=db,
            embedding_model=request.app.state.embedding_model,
            llm_client=request.app.state.llm_client,
            llm_model=settings.deepseek_model,
        )
    except ValueError as e:
        raise HTTPException(status_code=502, detail=str(e)) from e
