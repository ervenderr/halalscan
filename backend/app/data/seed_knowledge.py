"""Seed the halal_knowledge table with ingredient data and embeddings."""

import asyncio
import json
from pathlib import Path

from typing import List, Optional

from sentence_transformers import SentenceTransformer
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from app.config import settings


DATA_FILE = Path(__file__).parent / "ingredients.json"
BATCH_SIZE = 50


def load_ingredients() -> List[dict]:
    with open(DATA_FILE) as f:
        return json.load(f)


def generate_embeddings(
    model: SentenceTransformer, ingredients: List[dict]
) -> List[List[float]]:
    texts = []
    for ing in ingredients:
        parts = [ing["ingredient_name"]]
        aliases = ing.get("aliases") or []
        if aliases:
            parts.extend(aliases[:3])
        if ing.get("e_number"):
            parts.append(ing["e_number"])
        texts.append(" ".join(parts))
    embeddings = model.encode(texts, show_progress_bar=True, batch_size=32)
    return [emb.tolist() for emb in embeddings]


async def seed_database(database_url: Optional[str] = None) -> None:
    url = database_url or settings.database_url
    engine = create_async_engine(url, echo=False)
    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    ingredients = load_ingredients()
    print(f"Loaded {len(ingredients)} ingredients from {DATA_FILE}")

    print(f"Loading embedding model: {settings.embedding_model_name}")
    model = SentenceTransformer(settings.embedding_model_name)

    print("Generating embeddings...")
    embeddings = generate_embeddings(model, ingredients)

    async with session_factory() as session:
        # Check if table already has data
        result = await session.execute(
            text("SELECT COUNT(*) FROM halal_knowledge")
        )
        count = result.scalar()
        if count and count > 0:
            print(f"Table already has {count} rows. Clearing existing data...")
            await session.execute(text("DELETE FROM halal_knowledge"))
            await session.commit()

        print(f"Inserting {len(ingredients)} ingredients in batches of {BATCH_SIZE}...")
        for i in range(0, len(ingredients), BATCH_SIZE):
            batch = ingredients[i : i + BATCH_SIZE]
            batch_embeddings = embeddings[i : i + BATCH_SIZE]

            for ingredient, embedding in zip(batch, batch_embeddings):
                await session.execute(
                    text("""
                        INSERT INTO halal_knowledge
                        (ingredient_name, aliases, e_number, status, source,
                         ruling_hanafi, ruling_shafii, ruling_maliki, ruling_hanbali,
                         explanation, source_reference, embedding)
                        VALUES
                        (:ingredient_name, :aliases, :e_number, :status, :source,
                         :ruling_hanafi, :ruling_shafii, :ruling_maliki, :ruling_hanbali,
                         :explanation, :source_reference, :embedding)
                    """),
                    {
                        "ingredient_name": ingredient["ingredient_name"],
                        "aliases": ingredient.get("aliases"),
                        "e_number": ingredient.get("e_number"),
                        "status": ingredient["status"],
                        "source": ingredient.get("source"),
                        "ruling_hanafi": ingredient.get("ruling_hanafi"),
                        "ruling_shafii": ingredient.get("ruling_shafii"),
                        "ruling_maliki": ingredient.get("ruling_maliki"),
                        "ruling_hanbali": ingredient.get("ruling_hanbali"),
                        "explanation": ingredient["explanation"],
                        "source_reference": ingredient.get("source_reference"),
                        "embedding": str(embedding),
                    },
                )

            await session.commit()
            print(f"  Inserted batch {i // BATCH_SIZE + 1}/{(len(ingredients) + BATCH_SIZE - 1) // BATCH_SIZE}")

    await engine.dispose()
    print(f"Seeding complete. {len(ingredients)} ingredients inserted.")


if __name__ == "__main__":
    asyncio.run(seed_database())
