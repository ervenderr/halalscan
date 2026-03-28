"""Barcode endpoint: look up product and classify ingredients."""

from fastapi import APIRouter, Depends, HTTPException, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.database import get_db
from app.models.schemas import BarcodeRequest, ClassificationResponse
from app.services.barcode_service import lookup_barcode
from app.services.classification import classify_from_text

router = APIRouter(tags=["barcode"])
limiter = Limiter(key_func=get_remote_address)


@router.post("/barcode", response_model=ClassificationResponse)
@limiter.limit("10/minute")
async def scan_barcode(
    request: Request,
    body: BarcodeRequest,
    db: AsyncSession = Depends(get_db),
) -> ClassificationResponse:
    product = await lookup_barcode(body.barcode)

    if product is None:
        raise HTTPException(
            status_code=404,
            detail=(
                f"Product not found for barcode {body.barcode}. "
                "Try scanning the ingredient label instead."
            ),
        )

    ingredients_text = product.get("ingredients_text")
    if not ingredients_text:
        raise HTTPException(
            status_code=404,
            detail=(
                f"Product '{product.get('product_name', 'Unknown')}' found, "
                "but no ingredient data available. Try scanning the label."
            ),
        )

    try:
        result = await classify_from_text(
            raw_text=ingredients_text,
            madhab=body.madhab,
            db=db,
            embedding_model=request.app.state.embedding_model,
            llm_client=request.app.state.llm_client,
            llm_model=settings.deepseek_model,
        )
        # Attach product name from Open Food Facts
        return result.model_copy(
            update={"product_name": product.get("product_name")}
        )
    except ValueError as e:
        raise HTTPException(status_code=502, detail=str(e)) from e
