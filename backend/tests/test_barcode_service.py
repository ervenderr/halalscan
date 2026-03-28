"""Tests for barcode_service (Open Food Facts API)."""

from unittest.mock import AsyncMock, patch

import httpx
import pytest

from app.services.barcode_service import lookup_barcode


@pytest.mark.asyncio
async def test_lookup_valid_barcode():
    mock_response = httpx.Response(
        status_code=200,
        json={
            "status": 1,
            "product": {
                "product_name": "Nutella",
                "ingredients_text": "Sugar, Palm Oil, Hazelnuts, Cocoa, Skim Milk",
                "additives_tags": ["en:e322"],
                "allergens_tags": ["en:milk", "en:nuts"],
            },
        },
    )

    with patch("app.services.barcode_service.httpx.AsyncClient") as mock_client_cls:
        mock_client = AsyncMock()
        mock_client.get = AsyncMock(return_value=mock_response)
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=None)
        mock_client_cls.return_value = mock_client

        result = await lookup_barcode("3017620422003")

    assert result is not None
    assert result["product_name"] == "Nutella"
    assert "Sugar" in result["ingredients_text"]


@pytest.mark.asyncio
async def test_lookup_not_found():
    mock_response = httpx.Response(
        status_code=200,
        json={"status": 0, "status_verbose": "product not found"},
    )

    with patch("app.services.barcode_service.httpx.AsyncClient") as mock_client_cls:
        mock_client = AsyncMock()
        mock_client.get = AsyncMock(return_value=mock_response)
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=None)
        mock_client_cls.return_value = mock_client

        result = await lookup_barcode("0000000000000")

    assert result is None


@pytest.mark.asyncio
async def test_lookup_network_error():
    with patch("app.services.barcode_service.httpx.AsyncClient") as mock_client_cls:
        mock_client = AsyncMock()
        mock_client.get = AsyncMock(
            side_effect=httpx.RequestError("Connection failed")
        )
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=None)
        mock_client_cls.return_value = mock_client

        result = await lookup_barcode("3017620422003")

    assert result is None
