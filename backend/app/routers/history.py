"""Scan history endpoints."""

from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database import ScanHistory, get_db
from app.models.schemas import ClassificationResponse, Madhab, ScanHistoryItem

router = APIRouter(tags=["history"])


@router.get("/history", response_model=List[ScanHistoryItem])
async def list_history(
    limit: int = 20,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
) -> List[ScanHistoryItem]:
    query = (
        select(ScanHistory)
        .order_by(ScanHistory.created_at.desc())
        .limit(min(limit, 100))
        .offset(offset)
    )
    result = await db.execute(query)
    rows = result.scalars().all()

    return [
        ScanHistoryItem(
            id=row.id,
            scan_type=row.scan_type,
            input_summary=row.input_summary,
            result=ClassificationResponse(**row.result_json),
            madhab=row.madhab,
            created_at=row.created_at,
        )
        for row in rows
    ]


@router.post("/history", response_model=ScanHistoryItem)
async def save_history(
    scan_type: str,
    input_summary: str,
    result: ClassificationResponse,
    madhab: Madhab = "hanafi",
    db: AsyncSession = Depends(get_db),
) -> ScanHistoryItem:
    record = ScanHistory(
        scan_type=scan_type,
        input_summary=input_summary,
        result_json=result.model_dump(),
        madhab=madhab,
    )
    db.add(record)
    await db.flush()
    await db.refresh(record)

    return ScanHistoryItem(
        id=record.id,
        scan_type=record.scan_type,
        input_summary=record.input_summary,
        result=result,
        madhab=record.madhab,
        created_at=record.created_at,
    )
