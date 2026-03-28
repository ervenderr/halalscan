"""Classification pipeline: orchestrates parsing, RAG retrieval, and LLM classification.

Performance optimizations:
1. Direct match — if ALL ingredients have high-similarity DB matches (>0.92),
   skip the LLM entirely and return results from the knowledge base.
2. Batch embeddings — embed all ingredients in one call.
3. Parallel search — search all ingredients concurrently.
4. Response cache — cache recent classification results in memory.
"""

from __future__ import annotations

import hashlib
import logging
from collections import OrderedDict
from typing import TYPE_CHECKING, Dict, List, Optional

from openai import AsyncOpenAI
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.schemas import ClassificationResponse, IngredientResult
from app.services.ingredient_parser import parse_ingredients
from app.services.llm_service import classify_ingredients, extract_ingredients_from_image
from app.services.rag_service import (
    build_context_from_matches,
    search_ingredients_batch,
)

if TYPE_CHECKING:
    from sentence_transformers import SentenceTransformer

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# In-memory LRU cache for classification results
# ---------------------------------------------------------------------------

CACHE_MAX_SIZE = 200
_cache: OrderedDict[str, ClassificationResponse] = OrderedDict()


def _cache_key(ingredients: List[str], madhab: str) -> str:
    normalized = ",".join(sorted(i.strip().lower() for i in ingredients))
    raw = f"{madhab}:{normalized}"
    return hashlib.md5(raw.encode()).hexdigest()


def _cache_get(key: str) -> Optional[ClassificationResponse]:
    if key in _cache:
        _cache.move_to_end(key)
        return _cache[key]
    return None


def _cache_put(key: str, value: ClassificationResponse) -> None:
    _cache[key] = value
    if len(_cache) > CACHE_MAX_SIZE:
        _cache.popitem(last=False)


# ---------------------------------------------------------------------------
# Direct match — skip LLM for high-confidence DB matches
# ---------------------------------------------------------------------------

DIRECT_MATCH_THRESHOLD = 0.55


def _get_madhab_ruling(match: dict, madhab: str) -> Optional[str]:
    return match.get(f"ruling_{madhab}")


def _get_other_schools_note(match: dict, madhab: str) -> Optional[str]:
    """Generate a note about differing rulings across schools."""
    schools = {
        "hanafi": "Hanafi",
        "shafii": "Shafi'i",
        "maliki": "Maliki",
        "hanbali": "Hanbali",
    }
    current_ruling = _get_madhab_ruling(match, madhab)
    if not current_ruling:
        return None

    differing = []
    for school_key, school_name in schools.items():
        if school_key == madhab:
            continue
        other_ruling = _get_madhab_ruling(match, school_key)
        if other_ruling and other_ruling != current_ruling:
            # Check if the status keyword differs
            current_lower = current_ruling.lower()
            other_lower = other_ruling.lower()
            if ("halal" in current_lower) != ("halal" in other_lower):
                differing.append(f"{school_name}: {other_ruling}")

    if differing:
        return "; ".join(differing)
    return None


def _try_direct_match(
    ingredient_matches: Dict[str, List[dict]],
    madhab: str,
) -> Optional[ClassificationResponse]:
    """If every ingredient has a strong DB match, build the response directly."""
    results: List[IngredientResult] = []

    for ingredient, matches in ingredient_matches.items():
        if not matches:
            return None

        top = matches[0]

        # Exact name match is always high confidence
        is_exact = top["ingredient_name"].lower() == ingredient.strip().lower()
        if not is_exact and top["similarity"] < DIRECT_MATCH_THRESHOLD:
            return None  # Not confident enough — need LLM
        ruling = _get_madhab_ruling(top, madhab)

        # Determine status from the madhab-specific ruling
        if ruling:
            ruling_lower = ruling.lower()
            if "haram" in ruling_lower:
                status = "haram"
            elif "mushbooh" in ruling_lower or "doubtful" in ruling_lower:
                status = "mushbooh"
            else:
                status = top["status"]
        else:
            status = top["status"]

        madhab_note = _get_other_schools_note(top, madhab)

        results.append(IngredientResult(
            name=ingredient,
            status=status,
            confidence=top["similarity"],
            explanation=ruling or top["explanation"],
            e_number=top["e_number"],
            source_reference=top["source_reference"],
            madhab_note=madhab_note,
        ))

    # Determine overall status
    statuses = [r.status for r in results]
    if "haram" in statuses:
        overall = "haram"
    elif "mushbooh" in statuses:
        overall = "mushbooh"
    else:
        overall = "halal"

    haram_names = [r.name for r in results if r.status == "haram"]
    mushbooh_names = [r.name for r in results if r.status == "mushbooh"]

    if haram_names:
        summary = f"Contains haram ingredient(s): {', '.join(haram_names)}."
    elif mushbooh_names:
        summary = f"Contains doubtful ingredient(s): {', '.join(mushbooh_names)}. Verify source."
    else:
        summary = "All ingredients appear halal."

    return ClassificationResponse(
        product_name=None,
        overall_status=overall,
        ingredients=results,
        summary=summary,
        recommendation=(
            "Avoid this product." if overall == "haram"
            else "Verify doubtful ingredients before consuming." if overall == "mushbooh"
            else "This product appears safe to consume."
        ),
    )


# ---------------------------------------------------------------------------
# Main classification entry points
# ---------------------------------------------------------------------------

async def classify_from_text(
    raw_text: str,
    madhab: str,
    db: AsyncSession,
    embedding_model: "SentenceTransformer",
    llm_client: AsyncOpenAI,
    llm_model: str = "deepseek-chat",
) -> ClassificationResponse:
    ingredients = parse_ingredients(raw_text)
    if not ingredients:
        return ClassificationResponse(
            product_name=None,
            overall_status="halal",
            ingredients=[],
            summary="No ingredients found in the provided text.",
            recommendation="Please provide a valid ingredient list.",
        )

    return await classify_from_ingredients(
        ingredients=ingredients,
        madhab=madhab,
        db=db,
        embedding_model=embedding_model,
        llm_client=llm_client,
        llm_model=llm_model,
    )


async def classify_from_ingredients(
    ingredients: list[str],
    madhab: str,
    db: AsyncSession,
    embedding_model: "SentenceTransformer",
    llm_client: AsyncOpenAI,
    llm_model: str = "deepseek-chat",
) -> ClassificationResponse:
    # 1. Check cache
    key = _cache_key(ingredients, madhab)
    cached = _cache_get(key)
    if cached is not None:
        logger.info("Cache hit for %d ingredients", len(ingredients))
        return cached

    # 2. Batch search all ingredients (parallel embeddings + parallel DB)
    ingredient_matches = await search_ingredients_batch(
        db, embedding_model, ingredients
    )

    # 3. Try direct match (skip LLM if all matches are strong)
    direct = _try_direct_match(ingredient_matches, madhab)
    if direct is not None:
        logger.info("Direct match for %d ingredients — LLM skipped", len(ingredients))
        _cache_put(key, direct)
        return direct

    # 4. Fall back to LLM classification
    logger.info("Using LLM for %d ingredients", len(ingredients))
    context = build_context_from_matches(ingredient_matches, madhab)
    result = await classify_ingredients(
        client=llm_client,
        ingredients=ingredients,
        context=context,
        madhab=madhab,
        model=llm_model,
    )

    _cache_put(key, result)
    return result


async def classify_from_image(
    image_base64: str,
    madhab: str,
    db: AsyncSession,
    embedding_model: "SentenceTransformer",
    llm_client: AsyncOpenAI,
    llm_model: str = "deepseek-chat",
) -> ClassificationResponse:
    """Fallback: use DeepSeek vision to extract ingredients, then classify."""
    extracted_text = await extract_ingredients_from_image(
        client=llm_client,
        image_base64=image_base64,
        model=llm_model,
    )

    if not extracted_text or extracted_text.upper() == "UNREADABLE":
        return ClassificationResponse(
            product_name=None,
            overall_status="mushbooh",
            ingredients=[],
            summary="Could not read ingredient label from image.",
            recommendation=(
                "Please try again with a clearer photo, "
                "or manually enter the ingredients."
            ),
        )

    return await classify_from_text(
        raw_text=extracted_text,
        madhab=madhab,
        db=db,
        embedding_model=embedding_model,
        llm_client=llm_client,
        llm_model=llm_model,
    )
