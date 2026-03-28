from collections.abc import AsyncGenerator
from datetime import datetime
from typing import List, Optional

from pgvector.sqlalchemy import Vector
from sqlalchemy import DateTime, Index, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

from app.config import settings

engine = create_async_engine(
    settings.database_url,
    echo=settings.debug,
    pool_size=5,
    max_overflow=10,
)

async_session = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass


class HalalKnowledge(Base):
    __tablename__ = "halal_knowledge"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    ingredient_name: Mapped[str] = mapped_column(String(255), nullable=False)
    aliases: Mapped[Optional[List[str]]] = mapped_column(ARRAY(String))
    e_number: Mapped[Optional[str]] = mapped_column(String(20))
    status: Mapped[str] = mapped_column(String(20), nullable=False)
    source: Mapped[Optional[str]] = mapped_column(String(100))
    ruling_hanafi: Mapped[Optional[str]] = mapped_column(Text)
    ruling_shafii: Mapped[Optional[str]] = mapped_column(Text)
    ruling_maliki: Mapped[Optional[str]] = mapped_column(Text)
    ruling_hanbali: Mapped[Optional[str]] = mapped_column(Text)
    explanation: Mapped[str] = mapped_column(Text, nullable=False)
    source_reference: Mapped[Optional[str]] = mapped_column(Text)
    embedding = mapped_column(Vector(384))
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now()
    )

    __table_args__ = (
        Index(
            "ix_halal_knowledge_embedding",
            "embedding",
            postgresql_using="hnsw",
            postgresql_with={"m": 16, "ef_construction": 64},
            postgresql_ops={"embedding": "vector_cosine_ops"},
        ),
    )


class ScanHistory(Base):
    __tablename__ = "scan_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    scan_type: Mapped[str] = mapped_column(String(20), nullable=False)
    input_summary: Mapped[str] = mapped_column(Text, nullable=False)
    result_json: Mapped[dict] = mapped_column(JSONB, nullable=False)
    madhab: Mapped[str] = mapped_column(String(20), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now()
    )


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
