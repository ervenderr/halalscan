"""RAG service: embedding generation + pgvector similarity search."""

import asyncio
from typing import TYPE_CHECKING, Dict, List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database import HalalKnowledge

if TYPE_CHECKING:
    from sentence_transformers import SentenceTransformer


# ---------------------------------------------------------------------------
# Embedding helpers
# ---------------------------------------------------------------------------

async def embed_text(model: "SentenceTransformer", text: str) -> List[float]:
    embedding = await asyncio.to_thread(model.encode, text)
    return embedding.tolist()


async def embed_batch(
    model: "SentenceTransformer", texts: List[str]
) -> List[List[float]]:
    """Embed all texts in a single batch call — much faster than one-by-one."""
    embeddings = await asyncio.to_thread(model.encode, texts)
    return [e.tolist() for e in embeddings]


# ---------------------------------------------------------------------------
# Vector search
# ---------------------------------------------------------------------------

async def _search_by_vector(
    db: AsyncSession,
    query_embedding: List[float],
    top_k: int = 3,
) -> List[Dict]:
    query = (
        select(
            HalalKnowledge.ingredient_name,
            HalalKnowledge.status,
            HalalKnowledge.e_number,
            HalalKnowledge.source,
            HalalKnowledge.explanation,
            HalalKnowledge.ruling_hanafi,
            HalalKnowledge.ruling_shafii,
            HalalKnowledge.ruling_maliki,
            HalalKnowledge.ruling_hanbali,
            HalalKnowledge.source_reference,
            HalalKnowledge.embedding.cosine_distance(query_embedding).label(
                "distance"
            ),
        )
        .order_by("distance")
        .limit(top_k)
    )

    result = await db.execute(query)
    return [
        {
            "ingredient_name": row.ingredient_name,
            "status": row.status,
            "e_number": row.e_number,
            "source": row.source,
            "explanation": row.explanation,
            "ruling_hanafi": row.ruling_hanafi,
            "ruling_shafii": row.ruling_shafii,
            "ruling_maliki": row.ruling_maliki,
            "ruling_hanbali": row.ruling_hanbali,
            "source_reference": row.source_reference,
            "similarity": round(1 - row.distance, 4),
        }
        for row in result
    ]


async def search_ingredient(
    db: AsyncSession,
    model: "SentenceTransformer",
    ingredient: str,
    top_k: int = 3,
) -> List[Dict]:
    query_embedding = await embed_text(model, ingredient)
    return await _search_by_vector(db, query_embedding, top_k)


async def search_ingredients_batch(
    db: AsyncSession,
    model: "SentenceTransformer",
    ingredients: List[str],
    top_k: int = 3,
) -> Dict[str, List[Dict]]:
    """Search all ingredients in parallel with a single batch embedding call."""
    if not ingredients:
        return {}

    # 1. Batch embed all ingredients at once
    embeddings = await embed_batch(model, ingredients)

    # 2. Run all DB searches in parallel
    async def _search_one(ingredient: str, embedding: List[float]) -> tuple:
        matches = await _search_by_vector(db, embedding, top_k)
        return (ingredient, matches)

    tasks = [
        _search_one(ing, emb)
        for ing, emb in zip(ingredients, embeddings)
    ]
    results = await asyncio.gather(*tasks)

    return dict(results)


# ---------------------------------------------------------------------------
# Context building
# ---------------------------------------------------------------------------

def _get_madhab_ruling(match: dict, madhab: str) -> Optional[str]:
    return match.get(f"ruling_{madhab}")


def build_context_from_matches(
    ingredient_matches: Dict[str, List[Dict]],
    madhab: str,
) -> str:
    """Build LLM context string from pre-fetched search results."""
    context_parts = []

    for ingredient, matches in ingredient_matches.items():
        if not matches:
            context_parts.append(
                f"Ingredient: {ingredient}\n"
                f"  No matching records found in knowledge base.\n"
            )
            continue

        top_match = matches[0]
        ruling = _get_madhab_ruling(top_match, madhab) or "No specific ruling found"

        context_parts.append(
            f"Ingredient: {ingredient}\n"
            f"  Best match: {top_match['ingredient_name']} "
            f"(similarity: {top_match['similarity']})\n"
            f"  Known status: {top_match['status']}\n"
            f"  E-number: {top_match['e_number'] or 'N/A'}\n"
            f"  Source: {top_match['source'] or 'Unknown'}\n"
            f"  Explanation: {top_match['explanation']}\n"
            f"  {madhab.capitalize()} ruling: {ruling}\n"
            f"  Reference: {top_match['source_reference'] or 'N/A'}\n"
        )

        for extra in matches[1:]:
            if extra["similarity"] > 0.7:
                extra_ruling = _get_madhab_ruling(extra, madhab) or "N/A"
                context_parts.append(
                    f"  Also related: {extra['ingredient_name']} "
                    f"({extra['status']}, similarity: {extra['similarity']})\n"
                    f"    {madhab.capitalize()} ruling: {extra_ruling}\n"
                )

    return "\n".join(context_parts)


async def build_context(
    db: AsyncSession,
    model: "SentenceTransformer",
    ingredients: List[str],
    madhab: str,
) -> str:
    """Build context using batch search (backward-compatible wrapper)."""
    matches = await search_ingredients_batch(db, model, ingredients)
    return build_context_from_matches(matches, madhab)
