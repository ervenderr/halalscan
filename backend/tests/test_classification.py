"""Integration tests for the classification pipeline (LLM mocked)."""

import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.models.schemas import ClassificationResponse
from app.services.classification import classify_from_text


MOCK_LLM_RESPONSE = {
    "product_name": None,
    "overall_status": "haram",
    "ingredients": [
        {
            "name": "sugar",
            "status": "halal",
            "confidence": 0.99,
            "explanation": "Pure sugar is plant-derived and halal.",
            "e_number": None,
            "source_reference": "JAKIM Malaysia",
        },
        {
            "name": "gelatin",
            "status": "haram",
            "confidence": 0.95,
            "explanation": "Gelatin is typically derived from pork collagen.",
            "e_number": "E441",
            "source_reference": "JAKIM Malaysia E-Number Guide",
        },
        {
            "name": "water",
            "status": "halal",
            "confidence": 1.0,
            "explanation": "Water is inherently halal.",
            "e_number": None,
            "source_reference": "General Islamic consensus",
        },
    ],
    "summary": "This product contains gelatin which is typically haram.",
    "recommendation": "Avoid unless gelatin is certified halal.",
}


def _make_mock_llm_response():
    """Create a mock OpenAI chat completion response."""
    mock_message = MagicMock()
    mock_message.content = json.dumps(MOCK_LLM_RESPONSE)
    mock_choice = MagicMock()
    mock_choice.message = mock_message
    mock_response = MagicMock()
    mock_response.choices = [mock_choice]
    return mock_response


@pytest.mark.asyncio
async def test_classify_from_text_with_mocked_llm():
    mock_db = AsyncMock()
    mock_db.execute = AsyncMock(return_value=MagicMock(
        __iter__=lambda self: iter([])
    ))

    mock_embedding_model = MagicMock()
    mock_embedding_model.encode = MagicMock(
        return_value=MagicMock(tolist=lambda: [0.0] * 384)
    )

    mock_llm_client = AsyncMock()
    mock_llm_client.chat.completions.create = AsyncMock(
        return_value=_make_mock_llm_response()
    )

    with patch(
        "app.services.rag_service.build_context",
        new_callable=AsyncMock,
        return_value="Mocked context for testing",
    ):
        result = await classify_from_text(
            raw_text="sugar, gelatin, water",
            madhab="hanafi",
            db=mock_db,
            embedding_model=mock_embedding_model,
            llm_client=mock_llm_client,
        )

    assert isinstance(result, ClassificationResponse)
    assert result.overall_status == "haram"
    assert len(result.ingredients) == 3
    assert result.ingredients[1].name == "gelatin"
    assert result.ingredients[1].status == "haram"


@pytest.mark.asyncio
async def test_classify_empty_text():
    mock_db = AsyncMock()
    mock_embedding_model = MagicMock()
    mock_llm_client = AsyncMock()

    result = await classify_from_text(
        raw_text="",
        madhab="hanafi",
        db=mock_db,
        embedding_model=mock_embedding_model,
        llm_client=mock_llm_client,
    )

    assert isinstance(result, ClassificationResponse)
    assert result.ingredients == []
    assert "No ingredients" in result.summary
