"""Barcode lookup via Open Food Facts API."""

from __future__ import annotations

import logging
from typing import Optional

import httpx

logger = logging.getLogger(__name__)

BASE_URL = "https://world.openfoodfacts.org/api/v2/product"
USER_AGENT = "HalalCheckerAI/1.0 (https://github.com/ervenderr/halalchecker)"
TIMEOUT = 10.0


async def lookup_barcode(barcode: str) -> dict | None:
    url = (
        f"{BASE_URL}/{barcode}.json"
        f"?fields=product_name,ingredients_text,additives_tags,allergens_tags"
    )

    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        try:
            response = await client.get(
                url, headers={"User-Agent": USER_AGENT}
            )
            response.raise_for_status()
        except httpx.HTTPStatusError as e:
            logger.warning("Open Food Facts HTTP error for %s: %s", barcode, e)
            return None
        except httpx.RequestError as e:
            logger.error("Open Food Facts request failed for %s: %s", barcode, e)
            return None

    data = response.json()

    if data.get("status") != 1:
        logger.info("Product not found for barcode: %s", barcode)
        return None

    product = data.get("product", {})
    return {
        "product_name": product.get("product_name"),
        "ingredients_text": product.get("ingredients_text"),
        "additives_tags": product.get("additives_tags", []),
        "allergens_tags": product.get("allergens_tags", []),
    }
