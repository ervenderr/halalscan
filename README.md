# HalalChecker AI

AI-powered halal ingredient scanner with OCR, RAG, and LLM classification.

Scan food ingredient lists, look up products by barcode, or search individual ingredients — get instant halal/haram/mushbooh classification with madhab-aware rulings.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│              FRONTEND (Next.js 16)                   │
│  Camera → Tesseract.js OCR → Barcode → Search       │
│  PWA Shell · Tailwind CSS · localStorage History     │
└────────────────────┬────────────────────────────────┘
                     │ REST API
┌────────────────────▼────────────────────────────────┐
│              BACKEND (FastAPI)                        │
│                                                      │
│  POST /api/scan/text    (ingredients → classify)     │
│  POST /api/scan/image   (DeepSeek vision fallback)   │
│  POST /api/barcode      (Open Food Facts → classify) │
│                                                      │
│  ┌──────────────────────────────────┐                │
│  │     CLASSIFICATION PIPELINE      │                │
│  │  1. Parse ingredient list        │                │
│  │  2. Batch embed (MiniLM-L6-v2)  │                │
│  │  3. Parallel pgvector search     │                │
│  │  4. Direct match (>0.55 sim)?    │                │
│  │     → Instant response (~100ms)  │                │
│  │     OR                           │                │
│  │  5. DeepSeek V3.2 LLM classify  │                │
│  │     → Full response (~5-8s)      │                │
│  └──────────────────────────────────┘                │
│                                                      │
│  Database: PostgreSQL + pgvector                     │
│  • 255 ingredients with embeddings + rulings         │
│  • Madhab-specific rulings (4 schools)               │
└──────────────────────────────────────────────────────┘
```

## Features

- **Ingredient scanning** — Camera capture or image upload with Tesseract.js OCR
- **Barcode lookup** — Scan or enter barcodes, pulls data from Open Food Facts (4M+ products)
- **Ingredient search** — Type any ingredient for instant classification
- **Madhab-aware** — Hanafi, Shafi'i, Maliki, Hanbali (different rulings on seafood, vinegar, etc.)
- **RAG pipeline** — 255 seeded ingredients with vector similarity search
- **Fast responses** — Direct DB match for known ingredients (~100ms), LLM fallback for unknown
- **Response caching** — Repeat queries return in ~9ms
- **PWA ready** — Installable on mobile, works offline (shell)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, Tailwind CSS, TypeScript |
| OCR | Tesseract.js (client-side) + DeepSeek V3.2 vision (fallback) |
| Backend | FastAPI, Python 3.12 |
| LLM | DeepSeek V3.2 API (OpenAI-compatible) |
| Embeddings | sentence-transformers (all-MiniLM-L6-v2, 384-dim) |
| Vector DB | PostgreSQL + pgvector |
| Barcode | Open Food Facts API |
| Deploy | Vercel (frontend) + Railway (backend + DB) |

## Local Development

### Prerequisites

- Python 3.9+
- Node.js 18+
- Docker (for PostgreSQL)

### Setup

```bash
# 1. Clone
git clone https://github.com/ervenderr/halalchecker.git
cd halalchecker

# 2. Environment variables
cp .env.example .env
# Edit .env and add your DEEPSEEK_API_KEY

# 3. Start PostgreSQL
docker compose up db -d

# 4. Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
python -m app.data.seed_knowledge
uvicorn app.main:app --reload

# 5. Frontend (new terminal)
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 (or the port shown by Next.js).

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/scan/text` | Classify ingredients from text |
| POST | `/api/scan/image` | Classify from image (DeepSeek vision) |
| POST | `/api/barcode` | Look up barcode and classify |
| GET | `/api/health` | Health check |

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DEEPSEEK_API_KEY` | Yes | DeepSeek API key |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `CORS_ORIGINS` | No | Allowed origins (JSON array) |
| `EMBEDDING_MODEL_NAME` | No | Default: `all-MiniLM-L6-v2` |
| `DEBUG` | No | Default: `false` |

## Deployment

### Backend (Railway)

1. Create a Railway project with PostgreSQL add-on
2. Connect your GitHub repo, set root directory to `backend`
3. Add env vars: `DEEPSEEK_API_KEY`, `CORS_ORIGINS` (your Vercel domain)
4. Railway auto-detects the Dockerfile and `railway.toml`

### Frontend (Vercel)

1. Import your GitHub repo on Vercel
2. Set root directory to `frontend`
3. Add env var: `NEXT_PUBLIC_API_URL` = your Railway backend URL
4. Deploy

## Cost (Production)

| Service | Cost |
|---------|------|
| DeepSeek V3.2 API (1000 scans/month) | ~$0.50 |
| Vercel (frontend) | Free |
| Railway (backend + PostgreSQL) | ~$5/month |
| **Total** | **~$5.50/month** |
