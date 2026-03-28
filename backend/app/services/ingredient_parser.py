"""Parse raw text into a clean list of individual ingredients."""

import re
from typing import List


def parse_ingredients(raw_text: str) -> List[str]:
    if not raw_text or not raw_text.strip():
        return []

    text = raw_text.strip()

    # Remove common prefixes
    text = re.sub(
        r"^(ingredients?\s*:?\s*)", "", text, flags=re.IGNORECASE
    )

    # Remove percentage values like "10%", "(5%)", etc.
    text = re.sub(r"\(?\d+(\.\d+)?%\)?", "", text)

    # Normalize separators: semicolons and " and " to commas
    text = text.replace(";", ",")
    text = re.sub(r"\band\b", ",", text, flags=re.IGNORECASE)

    # Split on commas
    raw_parts = text.split(",")

    ingredients = []
    for part in raw_parts:
        cleaned = _clean_ingredient(part)
        if cleaned:
            ingredients.append(cleaned)

    return ingredients


def _clean_ingredient(text: str) -> str:
    # Strip whitespace and common wrappers
    text = text.strip().strip(".")

    # Remove leading numbers/bullets like "1.", "- ", "• "
    text = re.sub(r"^[\d\-•·]\s*\.?\s*", "", text)

    # Collapse multiple spaces
    text = re.sub(r"\s+", " ", text)

    # Remove very short fragments (likely OCR noise)
    if len(text) < 2:
        return ""

    # Remove entries that are just numbers
    if re.match(r"^\d+$", text):
        return ""

    return text.strip()


def extract_parenthetical_ingredients(text: str) -> List[str]:
    """Extract sub-ingredients from parenthetical groups.

    Example: "chocolate (cocoa, sugar, lecithin)" -> ["cocoa", "sugar", "lecithin"]
    """
    results = []
    groups = re.findall(r"\(([^)]+)\)", text)
    for group in groups:
        sub_ingredients = parse_ingredients(group)
        results.extend(sub_ingredients)
    return results
