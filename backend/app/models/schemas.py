from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, Field

Madhab = Literal["hanafi", "shafii", "maliki", "hanbali"]
Status = Literal["halal", "haram", "mushbooh"]


class IngredientResult(BaseModel):
    name: str
    status: Status
    confidence: float = Field(ge=0.0, le=1.0)
    explanation: str
    e_number: Optional[str] = None
    source_reference: Optional[str] = None
    madhab_note: Optional[str] = None


class ClassificationResponse(BaseModel):
    product_name: Optional[str] = None
    overall_status: Status
    ingredients: List[IngredientResult]
    summary: str
    recommendation: str


class ScanTextRequest(BaseModel):
    text: str = Field(min_length=1, description="Raw ingredient text to classify")
    madhab: Madhab = "hanafi"


class ScanImageRequest(BaseModel):
    image: str = Field(min_length=1, description="Base64-encoded image")
    madhab: Madhab = "hanafi"


class BarcodeRequest(BaseModel):
    barcode: str = Field(
        min_length=8, max_length=13, pattern=r"^\d{8,13}$",
        description="EAN-13 or UPC-A barcode",
    )
    madhab: Madhab = "hanafi"


class ScanHistoryItem(BaseModel):
    id: int
    scan_type: str
    input_summary: str
    result: ClassificationResponse
    madhab: Madhab
    created_at: datetime


class FeedbackRequest(BaseModel):
    ingredient_name: str = Field(min_length=1, max_length=255)
    feedback_type: Literal["wrong_status", "wrong_explanation", "other"]
    reported_status: Optional[Status] = None
    note: Optional[str] = Field(None, max_length=500)
    original_status: Status
    madhab: Madhab


class FeedbackResponse(BaseModel):
    success: bool
    message: str


class ErrorResponse(BaseModel):
    detail: str
