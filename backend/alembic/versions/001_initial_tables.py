"""Create halal_knowledge and scan_history tables

Revision ID: 001
Revises:
Create Date: 2026-03-28

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from pgvector.sqlalchemy import Vector

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")

    op.create_table(
        "halal_knowledge",
        sa.Column("id", sa.Integer(), autoincrement=True, primary_key=True),
        sa.Column("ingredient_name", sa.String(255), nullable=False),
        sa.Column("aliases", sa.ARRAY(sa.String())),
        sa.Column("e_number", sa.String(20)),
        sa.Column("status", sa.String(20), nullable=False),
        sa.Column("source", sa.String(100)),
        sa.Column("ruling_hanafi", sa.Text()),
        sa.Column("ruling_shafii", sa.Text()),
        sa.Column("ruling_maliki", sa.Text()),
        sa.Column("ruling_hanbali", sa.Text()),
        sa.Column("explanation", sa.Text(), nullable=False),
        sa.Column("source_reference", sa.Text()),
        sa.Column("embedding", Vector(384)),
        sa.Column(
            "created_at",
            sa.DateTime(),
            server_default=sa.func.now(),
        ),
    )

    op.create_index(
        "ix_halal_knowledge_embedding",
        "halal_knowledge",
        ["embedding"],
        postgresql_using="hnsw",
        postgresql_with={"m": 16, "ef_construction": 64},
        postgresql_ops={"embedding": "vector_cosine_ops"},
    )

    op.create_table(
        "scan_history",
        sa.Column("id", sa.Integer(), autoincrement=True, primary_key=True),
        sa.Column("scan_type", sa.String(20), nullable=False),
        sa.Column("input_summary", sa.Text(), nullable=False),
        sa.Column("result_json", sa.dialects.postgresql.JSONB(), nullable=False),
        sa.Column("madhab", sa.String(20), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(),
            server_default=sa.func.now(),
        ),
    )


def downgrade() -> None:
    op.drop_table("scan_history")
    op.drop_index("ix_halal_knowledge_embedding", table_name="halal_knowledge")
    op.drop_table("halal_knowledge")
    op.execute("DROP EXTENSION IF EXISTS vector")
