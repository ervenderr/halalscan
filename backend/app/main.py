"""HalalChecker API — FastAPI application entry point."""

import logging
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from openai import AsyncOpenAI
from sentence_transformers import SentenceTransformer
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.config import settings
from app.routers import barcode, history, scan

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Loading embedding model: %s", settings.embedding_model_name)
    app.state.embedding_model = SentenceTransformer(settings.embedding_model_name)
    logger.info("Embedding model loaded.")

    app.state.llm_client = AsyncOpenAI(
        base_url=settings.deepseek_base_url,
        api_key=settings.deepseek_api_key,
    )
    logger.info("DeepSeek LLM client initialized.")

    yield

    await app.state.llm_client.close()
    del app.state.embedding_model
    logger.info("Resources cleaned up.")


app = FastAPI(
    title="HalalChecker API",
    description="AI-powered halal ingredient classification",
    version="1.0.0",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    duration = round((time.time() - start) * 1000)
    logger.info(
        "%s %s %d %dms",
        request.method,
        request.url.path,
        response.status_code,
        duration,
    )
    return response


# CORS must be the LAST middleware added so it wraps everything (including error responses).
# FastAPI middleware runs in reverse order — last added = outermost = first to process.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(scan.router, prefix="/api")
app.include_router(barcode.router, prefix="/api")
app.include_router(history.router, prefix="/api")


@app.get("/api/health")
async def health_check():
    return {
        "status": "ok",
        "embedding_model": settings.embedding_model_name,
        "llm_model": settings.deepseek_model,
    }
