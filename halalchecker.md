# HalalChecker AI — Complete Project Plan for Claude Code

> **Project:** AI-powered halal ingredient scanner with OCR, RAG, and LLM classification
> **Developer:** Ervender
> **Build Tool:** Claude Code
> **Date:** March 2026

---

## 1. Project Overview

### What It Does
A web application (PWA, mobile-ready) that lets users:
1. **Scan** an ingredient label via camera or upload a photo
2. **Extract** text using OCR (DeepSeek-OCR via Clarifai API)
3. **Classify** each ingredient as **Halal / Haram / Mushbooh (Doubtful)**
4. **Explain** the reasoning with sourced Islamic rulings
5. **Barcode lookup** as a secondary input (Open Food Facts API)
6. **Madhab selection** — Hanafi, Shafi'i, Maliki, Hanbali (different rulings on shellfish, alcohol carriers, etc.)

### Portfolio Value (Technologies Demonstrated)
- **OCR / Computer Vision** — DeepSeek-OCR via API
- **RAG Pipeline** — Embeddings + vector search + LLM reasoning
- **LLM Integration** — DeepSeek V3.2 API for classification + explanation
- **Full-Stack** — Next.js 16 frontend + FastAPI backend
- **Database** — PostgreSQL with pgvector
- **API Integration** — Open Food Facts, Clarifai (DeepSeek-OCR)
- **PWA / Mobile-first** — Camera API, offline capability

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js 16)                     │
│  Camera Capture → Image Upload → Barcode Scanner → Results  │
│  PWA Shell · Tailwind CSS · Scan History (localStorage)     │
└──────────────────────────┬──────────────────────────────────┘
                           │ REST API
┌──────────────────────────▼──────────────────────────────────┐
│                    BACKEND (FastAPI)                         │
│                                                             │
│  ┌─────────────┐   ┌──────────────┐   ┌───────────────┐   │
│  │ /api/scan    │   │ /api/barcode │   │ /api/history  │   │
│  │ (image→OCR→  │   │ (barcode→OFF │   │ (scan logs)   │   │
│  │  classify)   │   │  →classify)  │   │               │   │
│  └──────┬───────┘   └──────┬───────┘   └───────────────┘   │
│         │                  │                                 │
│  ┌──────▼──────────────────▼───────┐                        │
│  │     CLASSIFICATION PIPELINE     │                        │
│  │                                 │                        │
│  │  1. Parse ingredient list       │                        │
│  │  2. For each ingredient:        │                        │
│  │     → Embed (sentence-transformers)                      │
│  │     → Vector search (pgvector)  │                        │
│  │     → Retrieve halal rulings    │                        │
│  │  3. DeepSeek V3.2 LLM:         │                        │
│  │     → Classify with context     │                        │
│  │     → Generate explanation      │                        │
│  │     → Madhab-aware reasoning    │                        │
│  └─────────────────────────────────┘                        │
│                                                             │
│  External APIs:                                             │
│  • Clarifai (DeepSeek-OCR) — OCR extraction                │
│  • Open Food Facts — barcode → ingredients                  │
│  • DeepSeek V3.2 API — LLM classification                  │
│                                                             │
│  Database: PostgreSQL + pgvector                            │
│  • halal_knowledge (embeddings + rulings)                   │
│  • scan_history                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Critical Decision: DeepSeek-OCR Approach

### The Problem
DeepSeek-OCR is a 3B parameter model requiring a GPU (A100 recommended). You can't self-host it on Vercel/Railway.

### Recommended: Clarifai API (OpenAI-compatible endpoint)
- **No GPU needed** — hosted inference
- **OpenAI-compatible** — standard Python SDK
- **Free tier available** for development
- **How:** Send base64 image → receive extracted text

```python
# Example Clarifai call for DeepSeek-OCR
import openai

client = openai.OpenAI(
    base_url="https://api.clarifai.com/v2/users/deepseek-ai/apps/deepseek-ocr/models/deepseek-ocr/versions/xxx",
    api_key="YOUR_CLARIFAI_PAT"
)

response = client.chat.completions.create(
    model="deepseek-ocr",
    messages=[{
        "role": "user",
        "content": [
            {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{b64_image}"}},
            {"type": "text", "text": "OCR this image. Extract only the ingredient list."}
        ]
    }]
)
```

### Alternatives (if Clarifai free tier runs out)
| Option | Cost | Setup |
|--------|------|-------|
| **Clarifai API** (recommended) | Free tier, then pay-as-go | Easiest, OpenAI-compatible |
| **Google Vertex AI** | Free credits available | DeepSeek-OCR hosted on Model Garden |
| **Tesseract.js** (client-side fallback) | Free | Lower accuracy, but zero cost |
| **Google Cloud Vision API** | 1000 free/month | Very accurate for printed text |
| **Self-host on RunPod/Vast.ai** | ~$0.50/hr GPU | For portfolio flex, not prod |

### Tell Claude Code:
```
For OCR, use the Clarifai API to access DeepSeek-OCR model.
The endpoint is OpenAI-compatible. Send images as base64.
Fallback: Tesseract.js on client-side for offline mode.
Do NOT try to self-host DeepSeek-OCR — it requires a GPU.
```

---

## 4. LLM: DeepSeek V3.2 API

### Why DeepSeek
- **$0.28/M input tokens, $0.42/M output** (cache miss)
- **$0.028/M input** with cache hits (90% discount)
- **5M free tokens** on signup, no credit card needed
- **OpenAI-compatible API** — drop-in replacement
- **128K context window**

### API Setup
```python
import openai

client = openai.OpenAI(
    base_url="https://api.deepseek.com",
    api_key="YOUR_DEEPSEEK_API_KEY"
)

response = client.chat.completions.create(
    model="deepseek-chat",  # This is V3.2
    messages=[
        {"role": "system", "content": HALAL_SYSTEM_PROMPT},
        {"role": "user", "content": classification_prompt}
    ],
    temperature=0,
    response_format={"type": "json_object"}
)
```

### Tell Claude Code:
```
Use DeepSeek V3.2 API (model: "deepseek-chat") via OpenAI-compatible SDK.
Base URL: https://api.deepseek.com
Always use temperature=0 for deterministic classification.
Always request JSON output format for structured results.
Use system prompt caching — keep the halal knowledge context 
in the system prompt prefix to hit the 90% cache discount.
```

---

## 5. Data Sources & Knowledge Base

### Primary: Halal/Haram Ingredient Database (Build This)

Create a PostgreSQL table with pgvector embeddings:

```sql
CREATE TABLE halal_knowledge (
    id SERIAL PRIMARY KEY,
    ingredient_name TEXT NOT NULL,
    aliases TEXT[],              -- Alternative names
    e_number TEXT,               -- E471, E120, etc.
    status TEXT NOT NULL,        -- 'halal', 'haram', 'mushbooh'
    source TEXT,                 -- Animal, plant, synthetic, etc.
    ruling_hanafi TEXT,
    ruling_shafii TEXT,
    ruling_maliki TEXT,
    ruling_hanbali TEXT,
    explanation TEXT NOT NULL,
    source_reference TEXT,       -- Islamic scholarly source
    embedding vector(384),       -- sentence-transformers embedding
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Data to Seed (scrape/compile from these sources):

| Source | What It Has | URL |
|--------|------------|-----|
| **Kaggle: Food Ingredients with Halal Label** | Pre-labeled ingredient dataset | kaggle.com/datasets/irfanakbarihabibi/food-ingredients-dataset-with-halal-label |
| **JAKIM E-Number Guide** (Malaysia) | Official E-code halal/haram list | halal.gov.my |
| **MUIS E-Code Database** (Singapore) | E-number halal status | ecodehalalcheck.com |
| **ISA Halal Ingredient Guide** (USA) | Comprehensive halal/haram list with explanations | isahalal.com |
| **Halal Foundation Guide** | Detailed ingredients list aligned with Islamic texts | halalfoundation.org |
| **The Halal Life E-Numbers** | Always-haram E-numbers + doubtful ones | thehalallife.co.uk/e-numbers |
| **Open Food Facts** | 4M+ products with ingredients | world.openfoodfacts.org |

### Key Ingredients to Cover:

**Always Haram:**
- E120 (Cochineal/Carmine) — from crushed insects
- E441 (Gelatin) — from pig/non-halal animal bones
- E542 (Edible Bone Phosphate) — animal bone extract
- Lard — pig fat
- Ethanol / alcohol
- Pork and all derivatives
- Rennet — from non-halal slaughtered calf stomach

**Mushbooh (Doubtful — source-dependent):**
- E422 (Glycerol/Glycerin) — halal if plant-based, haram if from pork
- E470-E483 (Emulsifiers) — depends on animal vs plant source
- E471 (Mono/Diglycerides) — could be soy (halal) or animal fat (haram)
- "Natural flavors" — often contains alcohol carriers
- Whey — cheese by-product, depends on rennet source
- Enzymes — could be animal or microbial
- L-Cysteine — can be from human hair or duck feathers

### Tell Claude Code:
```
Create a seed script (Python) that builds the halal_knowledge table.
Include at minimum 200 ingredients covering:
- All common haram E-numbers (E120, E441, E542, etc.)
- All mushbooh E-numbers (E422, E470-E483, E471, etc.)
- Common haram ingredients (gelatin, lard, alcohol, pork derivatives)
- Common mushbooh ingredients (natural flavors, enzymes, whey, glycerin)
- Madhab-specific rulings where they differ
Generate embeddings using sentence-transformers (all-MiniLM-L6-v2).
Store in PostgreSQL with pgvector extension.
```

---

## 6. Open Food Facts API Integration

### Barcode Lookup
```
GET https://world.openfoodfacts.org/api/v2/product/{barcode}.json
    ?fields=product_name,ingredients_text,additives_tags,allergens_tags
```

- **Free, no auth required** (but use a custom User-Agent)
- **4M+ products** from 150 countries
- **Rate limit:** 2 req/min for facet queries, higher for product lookups
- Returns ingredients text, additives (E-numbers), allergens

### Python SDK Available:
```bash
pip install openfoodfacts
```

### Tell Claude Code:
```
Integrate Open Food Facts API for barcode scanning.
Use the REST API directly (not the Python SDK — it's simpler).
Endpoint: https://world.openfoodfacts.org/api/v2/product/{barcode}.json
Fields needed: product_name, ingredients_text, additives_tags, allergens_tags
Set User-Agent to "HalalScanAI/1.0 (contact@halalscan.ai)"
If product not found, fall back to OCR scan of ingredient label.
```

---

## 7. RAG Pipeline Detail

### Embedding Model
- **Model:** `all-MiniLM-L6-v2` (via sentence-transformers)
- **Dimension:** 384
- **Why:** Small, fast, good for ingredient matching
- **Runs on:** CPU (no GPU needed)

### Vector Search Flow
```python
# 1. User scans → OCR extracts: "sugar, gelatin, E471, natural flavors"
# 2. Parse into individual ingredients
ingredients = ["sugar", "gelatin", "E471", "natural flavors"]

# 3. For each ingredient, embed and search
for ingredient in ingredients:
    embedding = model.encode(ingredient)
    
    # pgvector similarity search
    results = db.execute("""
        SELECT ingredient_name, status, explanation, 
               ruling_hanafi, ruling_shafii
        FROM halal_knowledge
        ORDER BY embedding <=> %s::vector
        LIMIT 3
    """, [embedding.tolist()])
    
    # 4. Build context for LLM
    context += format_results(ingredient, results)

# 5. Send to DeepSeek with full context
response = classify_with_llm(ingredients, context, madhab="hanafi")
```

### LLM Classification Prompt
```python
SYSTEM_PROMPT = """You are a halal food ingredient classifier. 
You analyze ingredients and classify each as:
- HALAL: Clearly permissible
- HARAM: Clearly forbidden
- MUSHBOOH: Doubtful, source-dependent

Rules:
1. Use the provided knowledge base context for each ingredient.
2. If an ingredient matches a known haram item, classify as HARAM.
3. If source is ambiguous (could be plant or animal), classify as MUSHBOOH.
4. Consider the user's selected madhab (school of thought).
5. Always provide a brief explanation and source reference.
6. Return structured JSON.

Output format:
{
  "product_name": "string or null",
  "overall_status": "halal|haram|mushbooh",
  "ingredients": [
    {
      "name": "ingredient name",
      "status": "halal|haram|mushbooh",
      "confidence": 0.0-1.0,
      "explanation": "why this classification",
      "e_number": "if applicable",
      "source_reference": "Islamic ruling source"
    }
  ],
  "summary": "brief overall assessment",
  "recommendation": "what the user should do"
}
"""
```

### Tell Claude Code:
```
Build the RAG pipeline in FastAPI:
1. Use sentence-transformers (all-MiniLM-L6-v2) for embeddings
2. Store/search with pgvector in PostgreSQL
3. For each scanned ingredient:
   - Embed the ingredient name
   - Vector search top 3 matches from halal_knowledge
   - Build context string with retrieved rulings
4. Send full context + ingredients to DeepSeek V3.2
5. Parse JSON response and return structured results
6. Cache results for repeated ingredient lookups (Redis or in-memory)
```

---

## 8. Tech Stack Summary

| Layer | Technology | Why |
|-------|-----------|-----|
| **Frontend** | Next.js 16 (App Router) | Already know it, SSR + PWA |
| **Styling** | Tailwind CSS | Fast, mobile-first |
| **Camera** | HTML5 MediaDevices API | Native browser camera |
| **Barcode** | `@nicolo-ribaudo/zxing-js` or `html5-qrcode` | Client-side barcode reading |
| **Backend** | FastAPI (Python 3.12) | ML ecosystem, async, fast |
| **OCR** | Clarifai API (DeepSeek-OCR) | Hosted, no GPU needed |
| **LLM** | DeepSeek V3.2 API | Cheap ($0.28/M), OpenAI-compatible |
| **Embeddings** | sentence-transformers (all-MiniLM-L6-v2) | CPU, 384-dim, fast |
| **Vector DB** | PostgreSQL + pgvector | Free, no extra service |
| **Database** | PostgreSQL | Scan history, knowledge base |
| **Deployment** | Vercel (frontend) + Railway (backend + DB) | Free tiers, easy |

---

## 9. Project Structure

```
halalscan-ai/
├── frontend/                    # Next.js 16
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx             # Home — camera/upload/barcode
│   │   ├── results/
│   │   │   └── page.tsx         # Scan results display
│   │   ├── history/
│   │   │   └── page.tsx         # Past scans
│   │   └── settings/
│   │       └── page.tsx         # Madhab selection, preferences
│   ├── components/
│   │   ├── CameraCapture.tsx
│   │   ├── BarcodeScanner.tsx
│   │   ├── ImageUpload.tsx
│   │   ├── IngredientCard.tsx   # Per-ingredient result
│   │   ├── StatusBadge.tsx      # Halal/Haram/Mushbooh badge
│   │   └── ScanResult.tsx       # Full result layout
│   ├── lib/
│   │   ├── api.ts               # Backend API client
│   │   └── types.ts             # TypeScript interfaces
│   ├── public/
│   │   └── manifest.json        # PWA manifest
│   ├── next.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── backend/                     # FastAPI
│   ├── app/
│   │   ├── main.py              # FastAPI app + CORS
│   │   ├── routers/
│   │   │   ├── scan.py          # POST /api/scan (image → classify)
│   │   │   ├── barcode.py       # POST /api/barcode (barcode → classify)
│   │   │   └── history.py       # GET/POST /api/history
│   │   ├── services/
│   │   │   ├── ocr_service.py          # Clarifai DeepSeek-OCR
│   │   │   ├── ingredient_parser.py    # Parse OCR text → ingredient list
│   │   │   ├── rag_service.py          # Embedding + vector search
│   │   │   ├── llm_service.py          # DeepSeek V3.2 classification
│   │   │   ├── barcode_service.py      # Open Food Facts API
│   │   │   └── classification.py       # Orchestrates the full pipeline
│   │   ├── models/
│   │   │   ├── schemas.py       # Pydantic models
│   │   │   └── database.py      # SQLAlchemy + pgvector
│   │   ├── data/
│   │   │   └── seed_knowledge.py  # Seed halal ingredient DB
│   │   └── config.py            # Environment variables
│   ├── requirements.txt
│   ├── Dockerfile
│   └── alembic/                 # DB migrations
│
├── docker-compose.yml           # Local dev (backend + postgres)
├── README.md
└── .env.example
```

---

## 10. Build Order (for Claude Code)

### Phase 1: Backend Foundation (Day 1-2)
```
Priority: Get the classification pipeline working end-to-end

1. Set up FastAPI project with Docker + PostgreSQL + pgvector
2. Create database models (halal_knowledge, scan_history)
3. Build seed_knowledge.py — populate 200+ ingredients with:
   - E-numbers (haram: E120, E441, E542; mushbooh: E422, E470-483)
   - Common ingredients (gelatin, lard, alcohol, enzymes, whey)
   - Madhab-specific rulings
4. Generate embeddings with sentence-transformers, store in pgvector
5. Build rag_service.py — embed query → vector search → return matches
6. Build llm_service.py — DeepSeek V3.2 classification with JSON output
7. Build classification.py — orchestrate: parse ingredients → RAG → LLM
8. Test with hardcoded ingredient lists before connecting OCR
```

### Phase 2: OCR + Barcode Integration (Day 3-4)
```
1. Build ocr_service.py — Clarifai API integration for DeepSeek-OCR
2. Build ingredient_parser.py — extract clean ingredient list from OCR text
3. Build barcode_service.py — Open Food Facts API lookup
4. Wire up POST /api/scan endpoint (image → OCR → classify)
5. Wire up POST /api/barcode endpoint (barcode → OFF → classify)
6. Test with real product photos
```

### Phase 3: Frontend (Day 5-7)
```
1. Next.js 16 project with Tailwind CSS
2. CameraCapture component (MediaDevices API)
3. ImageUpload component (file picker)
4. BarcodeScanner component (html5-qrcode library)
5. Results page — ingredient cards with status badges
6. Settings page — madhab selection
7. History page — past scans from localStorage
8. PWA manifest + service worker for offline shell
```

### Phase 4: Polish & Deploy (Day 8-10)
```
1. Loading states, error handling, retry logic
2. Mobile responsive design (test on real phone)
3. Deploy frontend to Vercel
4. Deploy backend to Railway (with PostgreSQL add-on)
5. Environment variables + API keys
6. README with screenshots, architecture diagram, demo video
7. Add to portfolio at ervenderr.vercel.app
```

---

## 11. Key Instructions for Claude Code

Copy-paste this when starting with Claude Code:

```
## Project: HalalChecker AI

### Context
I'm building a halal ingredient scanner web app. Users scan food labels
with their camera, the app OCRs the text, then uses RAG + LLM to classify
each ingredient as Halal/Haram/Mushbooh with explanations.

### Tech Stack
- Frontend: Next.js 16 (App Router), Tailwind CSS, TypeScript
- Backend: FastAPI (Python 3.12)
- OCR: Clarifai API hosting DeepSeek-OCR (OpenAI-compatible endpoint)
- LLM: DeepSeek V3.2 API (model: "deepseek-chat", base_url: https://api.deepseek.com)
- Embeddings: sentence-transformers (all-MiniLM-L6-v2), 384 dimensions
- Vector DB: PostgreSQL + pgvector extension
- Barcode API: Open Food Facts (https://world.openfoodfacts.org/api/v2/product/{barcode}.json)
- Deploy: Vercel (frontend) + Railway (backend + DB)

### Architecture Rules
- Backend handles ALL AI/ML processing. Frontend is thin.
- OCR via Clarifai API — do NOT try to run DeepSeek-OCR locally.
- DeepSeek API is OpenAI-compatible — use the openai Python SDK.
- Always request JSON output from the LLM (response_format: json_object).
- Use temperature=0 for classification (deterministic).
- Keep the system prompt stable to maximize DeepSeek cache hits (90% discount).
- Use pgvector for RAG similarity search, not a separate vector DB.
- Frontend camera uses navigator.mediaDevices.getUserMedia().
- PWA-ready from the start (manifest.json, service worker).

### Data
- Seed the halal_knowledge table with 200+ ingredients.
- Cover all haram E-numbers: E120, E441, E542.
- Cover all mushbooh E-numbers: E422, E470-E483.
- Include madhab-specific rulings (Hanafi, Shafi'i, Maliki, Hanbali).
- Each ingredient has an embedding (384-dim) for vector search.

### API Keys (I'll provide these as env vars)
- DEEPSEEK_API_KEY — for LLM classification
- CLARIFAI_PAT — for DeepSeek-OCR
- DATABASE_URL — PostgreSQL connection string
```

---

## 12. Cost Estimate (Monthly, Production)

| Service | Cost |
|---------|------|
| DeepSeek V3.2 API (1000 scans/month) | ~$0.50 |
| Clarifai DeepSeek-OCR (1000 scans) | Free tier or ~$5 |
| Vercel (frontend hosting) | Free |
| Railway (backend + PostgreSQL) | $5/month |
| **Total** | **~$5-10/month** |

---

## 13. Demo Scenarios (for portfolio presentation)

1. **Scan a Gummy Bear package** → Detects gelatin (HARAM — pork-derived)
2. **Scan a chocolate bar** → Detects E471 (MUSHBOOH — source unknown)
3. **Barcode scan of Nutella** → Pulls from Open Food Facts, classifies
4. **Scan with Hanafi vs Shafi'i** → Shows different rulings on specific items
5. **Scan a clearly halal product** → All green, confidence scores

---

## 14. Future Enhancements (Mention in Portfolio)

- React Native / Expo mobile app
- Community-sourced corrections (users report wrong classifications)
- Offline mode with local model (ONNX-quantized classifier)
- Multi-language OCR (Arabic, Malay, Indonesian labels)
- Halal restaurant/store finder integration
- Browser extension for online grocery shopping