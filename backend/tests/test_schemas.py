"""Tests for Pydantic schemas."""

import pytest
from pydantic import ValidationError

from app.models.schemas import (
    BarcodeRequest,
    ClassificationResponse,
    IngredientResult,
    ScanTextRequest,
)


class TestIngredientResult:
    def test_valid_halal(self):
        result = IngredientResult(
            name="sugar",
            status="halal",
            confidence=0.99,
            explanation="Pure sugar is halal.",
        )
        assert result.status == "halal"

    def test_invalid_status(self):
        with pytest.raises(ValidationError):
            IngredientResult(
                name="test",
                status="unknown",
                confidence=0.5,
                explanation="Test",
            )

    def test_confidence_out_of_range(self):
        with pytest.raises(ValidationError):
            IngredientResult(
                name="test",
                status="halal",
                confidence=1.5,
                explanation="Test",
            )


class TestScanTextRequest:
    def test_valid_request(self):
        req = ScanTextRequest(text="sugar, salt", madhab="hanafi")
        assert req.madhab == "hanafi"

    def test_default_madhab(self):
        req = ScanTextRequest(text="sugar")
        assert req.madhab == "hanafi"

    def test_empty_text_rejected(self):
        with pytest.raises(ValidationError):
            ScanTextRequest(text="")


class TestBarcodeRequest:
    def test_valid_ean13(self):
        req = BarcodeRequest(barcode="3017620422003")
        assert req.barcode == "3017620422003"

    def test_invalid_barcode_letters(self):
        with pytest.raises(ValidationError):
            BarcodeRequest(barcode="abc12345678")

    def test_barcode_too_short(self):
        with pytest.raises(ValidationError):
            BarcodeRequest(barcode="1234")


class TestClassificationResponse:
    def test_valid_response(self):
        resp = ClassificationResponse(
            overall_status="haram",
            ingredients=[
                IngredientResult(
                    name="gelatin",
                    status="haram",
                    confidence=0.95,
                    explanation="Pork-derived",
                )
            ],
            summary="Contains haram gelatin.",
            recommendation="Avoid.",
        )
        assert resp.overall_status == "haram"
        assert len(resp.ingredients) == 1
