# HalalChecker AI — Project Documentation

> **Project:** AI-powered halal ingredient scanner with OCR, RAG, and LLM classification
> **Developer:** Ervender
> **Date:** March 2026

---

## 1. Project Overview

### What It Does
A progressive web app (PWA, mobile-first) that lets users:
1. **Scan** an ingredient label via camera or upload a photo
2. **Extract** text using client-side OCR (Tesseract.js)
3. **Classify** each ingredient as **Halal / Haram / Mushbooh (Doubtful)**
4. **Explain** the reasoning with sourced Islamic rulings
5. **Barcode lookup** via Open Food Facts API (4M+ products)
6. **Madhab selection** — Hanafi, Shafi'i, Maliki, Hanbali (different rulings on seafood, vinegar, rennet, etc.)

### Technologies Demonstrated
- **OCR / Computer Vision** — Tesseract.js client-side text extraction
- **RAG Pipeline** — Batch embeddings + pgvector cosine search + LLM reasoning
- **LLM Integration** — DeepSeek API for classification with anti-hallucination validation
- **Full-Stack** — Next.js 16 frontend + FastAPI backend
- **Database** — PostgreSQL with pgvector (HNSW index, 3,317 ingredients)
- **API Integration** — Open Food Facts barcode lookup
- **PWA / Mobile-first** — Camera API, dark mode, offline shell

---

## 2. Architecture

```
┌──────────────────────────────────────────────────────┐
│              FRONTEND (Next.js 16 + PWA)              │
│  Camera → Tesseract.js OCR → Barcode → Text Search   │
│  Tailwind CSS 4 · Dark Mode · localStorage History    │
└────────────────────┬─────────────────────────────────┘
                     │ REST API
┌────────────────────▼─────────────────────────────────┐
│              BACKEND (FastAPI)                         │
│                                                       │
│  POST /api/scan/text    (ingredients → classify)      │
│  POST /api/barcode      (Open Food Facts → classify)  │
│  GET  /api/health       (status check)                │
│                                                       │
│  ┌───────────────────────────────────┐                │
│  │     CLASSIFICATION PIPELINE       │                │
│  │  1. Parse ingredients (+ parens)  │                │
│  │  2. Batch embed (MiniLM-L6-v2)   │                │
│  │  3. pgvector cosine search        │                │
│  │  4. Direct match (>0.70 sim)?     │                │
│  │     → Instant DB response         │                │
│  │     OR                            │                │
│  │  5. DeepSeek LLM + RAG context    │                │
│  │     → Post-validated JSON         │                │
│  └───────────────────────────────────┘                │
│                                                       │
│  Database: PostgreSQL + pgvector (HNSW index)         │
│  • 3,317 ingredients with embeddings + rulings        │
│  • Madhab-specific rulings (4 schools)                │
│  • In-memory LRU cache (200 entries)                  │
│                                                       │
│  External APIs:                                       │
│  • Open Food Facts — barcode → ingredients            │
│  • DeepSeek API — LLM classification                  │
└───────────────────────────────────────────────────────┘
```

---

## 3. OCR Approach

### Implementation: Tesseract.js (Client-Side)
- Runs entirely in the browser — no server GPU needed
- Confidence threshold: 50% — below this, text is still sent but flagged as partial
- If no text extracted at all, user is prompted to retake photo or type manually

### Why Not Server-Side Vision
DeepSeek's chat model does not support `image_url` content — it's text-only. The original plan to use DeepSeek vision as an OCR fallback was replaced with a best-effort OCR approach:
- High confidence OCR → classify directly
- Low confidence OCR → still classify (best-effort), notify user text was partially readable
- No text at all → clear error with guidance to retake or use Search tab

---

## 4. LLM: DeepSeek API

### Configuration
- **Model:** `deepseek-chat` (V3.2)
- **Base URL:** `https://api.deepseek.com`
- **Temperature:** 0 (deterministic)
- **Response format:** `json_object` (structured output)
- **SDK:** OpenAI-compatible Python SDK

### Anti-Hallucination Measures
1. **Strict system prompt** — rules 6-8 explicitly forbid inventing ingredients
2. **Numbered ingredient list** — LLM receives ingredients as numbered list with count
3. **Post-validation filter** — after LLM responds, every ingredient name is cross-checked against the input list; hallucinated ingredients are stripped
4. **Recalculated overall_status** — if ingredients were stripped, status is recomputed

### Cost
- ~$0.50/month for 1,000 scans
- System prompt caching gives ~90% input token discount on repeated calls

---

## 5. Knowledge Base

### PostgreSQL + pgvector
- **3,317 ingredients** seeded from `ingredients.json`
- **Embeddings:** all-MiniLM-L6-v2 (384-dim, CPU-friendly)
- **Index:** HNSW (m=16, ef_construction=64, cosine distance)
- **Madhab rulings:** 4 separate columns (ruling_hanafi, ruling_shafii, ruling_maliki, ruling_hanbali)

### Coverage
- All common haram E-numbers (E120, E441, E542, etc.)
- All mushbooh E-numbers (E422, E470-E483, etc.)
- Common haram ingredients (gelatin, lard, alcohol, pork derivatives)
- Common mushbooh ingredients (natural flavors, enzymes, whey, glycerin)
- Madhab-specific differences (seafood, vinegar, rennet, carmine, vanilla extract)

### Direct Match Optimization
- **Threshold:** 0.70 cosine similarity (raised from 0.55 to reduce false matches)
- If ALL ingredients match DB entries above threshold → skip LLM entirely (~100ms response)
- Otherwise → build RAG context from top matches → send to LLM (~5-8s response)

---

## 6. Classification Pipeline

```
Input: raw ingredient text + madhab
  │
  ├─ 1. PARSE
  │    regex cleanup → split on commas/semicolons
  │    extract parenthetical sub-ingredients
  │    deduplicate
  │
  ├─ 2. CACHE CHECK
  │    MD5(sorted ingredients + madhab) → LRU cache (200 entries)
  │    HIT → return cached result
  │
  ├─ 3. BATCH EMBED + SEARCH
  │    single batch encode (sentence-transformers)
  │    sequential pgvector cosine searches (session-safe)
  │    top 3 matches per ingredient
  │
  ├─ 4. DIRECT MATCH? (all similarities > 0.70)
  │    YES → build response from DB rulings, cache, return
  │    NO  → continue to step 5
  │
  ├─ 5. LLM CLASSIFICATION
  │    build RAG context from matches
  │    send to DeepSeek with system prompt + ingredients + context
  │    parse JSON response
  │    POST-VALIDATE: strip hallucinated ingredients
  │    recalculate overall_status if needed
  │    cache result
  │
  └─ Return: ClassificationResponse
       { product_name, overall_status, ingredients[], summary, recommendation }
```

---

## 7. Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript |
| **Styling** | Tailwind CSS 4, CSS custom properties, dark mode |
| **Camera** | HTML5 MediaDevices API |
| **OCR** | Tesseract.js 7 (client-side) |
| **Barcode** | html5-qrcode (client-side) |
| **Backend** | FastAPI, Python 3.11+ |
| **LLM** | DeepSeek API (OpenAI-compatible SDK) |
| **Embeddings** | sentence-transformers (all-MiniLM-L6-v2, 384-dim) |
| **Vector DB** | PostgreSQL + pgvector (HNSW index) |
| **Barcode Data** | Open Food Facts API |
| **Rate Limiting** | slowapi (20/min text, 10/min barcode) |
| **Deployment** | Vercel (frontend) + Railway (backend + DB) |

---

## 8. Project Structure

```
halalscan/
├── frontend/                        # Next.js 16 PWA
│   ├── app/
│   │   ├── layout.tsx               # Root layout, theme, metadata
│   │   ├── globals.css              # Design tokens, dark mode, animations
│   │   ├── page.tsx                 # Home — camera/upload/barcode/search
│   │   ├── history/page.tsx         # Scan history (grouped by date)
│   │   └── settings/page.tsx        # Madhab + theme selection
│   ├── components/
│   │   ├── BottomNav.tsx            # Frosted glass navigation
│   │   ├── CameraCapture.tsx        # Camera with capture overlay
│   │   ├── ImageUpload.tsx          # Drag & drop upload
│   │   ├── BarcodeScanner.tsx       # Camera + manual barcode entry
│   │   ├── IngredientSearch.tsx     # Text input + quick-check chips
│   │   ├── ScanResult.tsx           # Status-themed result display
│   │   ├── IngredientCard.tsx       # Expandable card with confidence bar
│   │   ├── StatusBadge.tsx          # Halal/Haram/Mushbooh with icons
│   │   ├── LoadingSpinner.tsx       # Scanning animation + skeleton
│   │   └── ThemeInit.tsx            # Dark mode initialization
│   ├── lib/
│   │   ├── api.ts                   # Backend API client
│   │   ├── ocr.ts                   # Tesseract.js wrapper
│   │   ├── storage.ts              # localStorage (settings, history, theme)
│   │   └── types.ts                 # TypeScript interfaces
│   └── public/
│       ├── halalchecker-log.png     # App logo
│       └── manifest.json            # PWA manifest
│
├── backend/                         # FastAPI
│   ├── app/
│   │   ├── main.py                  # FastAPI app, CORS, middleware
│   │   ├── config.py                # Environment settings
│   │   ├── routers/
│   │   │   ├── scan.py              # POST /api/scan/text
│   │   │   ├── barcode.py           # POST /api/barcode
│   │   │   └── history.py           # Scan history endpoints
│   │   ├── services/
│   │   │   ├── classification.py    # Pipeline orchestrator + cache + direct match
│   │   │   ├── ingredient_parser.py # Text → ingredient list (+ parenthetical)
│   │   │   ├── rag_service.py       # Batch embed + pgvector search + context
│   │   │   ├── llm_service.py       # DeepSeek classification + validation
│   │   │   └── barcode_service.py   # Open Food Facts API
│   │   ├── models/
│   │   │   ├── schemas.py           # Pydantic models
│   │   │   └── database.py          # SQLAlchemy + pgvector + session
│   │   └── data/
│   │       ├── ingredients.json     # 3,317 ingredient entries
│   │       └── seed_knowledge.py    # DB seeder with embeddings
│   ├── alembic/                     # DB migrations
│   ├── requirements.txt
│   ├── Dockerfile
│   └── railway.toml
│
├── docs/
│   └── screenshot-mobile.png        # Mobile UI screenshot
├── docker-compose.yml               # Local dev (backend + postgres)
├── README.md
├── halalchecker.md                  # This file
└── .env.example
```

---

## 9. Frontend Design System

### Design Tokens (CSS Custom Properties)
- **Light mode:** Soft green-tinted backgrounds (`#f0f4f0`), green borders (`#c8d8c8`)
- **Dark mode:** Deep forest green palette (`#0c1a0c`, `#142214`)
- **Status colors:** Green (halal), Red (haram), Amber (mushbooh)
- **Shadows:** 6 levels from `--shadow-sm` to `--shadow-xl` + `--shadow-glow-green`

### UI Components
- **Glass-morph cards** — backdrop-blur + semi-transparent backgrounds
- **Gradient buttons** — green gradient with glow shadow
- **Sliding pill tabs** — animated indicator for tab/segment controls
- **Status-themed results** — entire result page adapts color to halal/haram/mushbooh
- **Confidence bars** — animated fill per ingredient
- **Expandable cards** — CSS grid transition with rotating chevron
- **Staggered fade-in** — list items animate in sequence (50ms stagger)

### Accessibility
- `aria-expanded`, `aria-selected`, `aria-current`, `aria-label` throughout
- `role="tablist"` / `role="tab"` on navigation
- Keyboard navigation (Enter/Space on expandable cards)
- `:focus-visible` green outline
- `prefers-reduced-motion: reduce` disables all animations

---

## 10. Barcode Fallback UX

When a barcode scan finds a product but no ingredient data:
1. Auto-switch to the **Ingredients tab**
2. Show an **amber banner** with the product name
3. Prompt user to photograph the ingredient list on the package
4. Zero extra taps needed — user is already on the right screen

---

## 11. Cost Estimate (Monthly, Production)

| Service | Cost |
|---------|------|
| DeepSeek API (~1,000 scans/month) | ~$0.50 |
| Vercel (frontend hosting) | Free |
| Railway (backend + PostgreSQL) | ~$5/month |
| **Total** | **~$5.50/month** |

---

## 12. Demo Scenarios

1. **Scan a Gummy Bear package** → Detects gelatin (HARAM — pork-derived)
2. **Scan a chocolate bar** → Detects E471 (MUSHBOOH — source unknown)
3. **Barcode scan of Nutella** → Pulls from Open Food Facts, classifies
4. **Switch Hanafi → Shafi'i** → Shows different rulings on shrimp, vinegar
5. **Scan a clearly halal product** → All green with confidence bars
6. **Toggle dark mode** → Entire UI adapts with forest-green dark palette

---

## 13. Future Enhancements

- React Native / Expo mobile app
- Community-sourced corrections (users report wrong classifications)
- Offline mode with local model (ONNX-quantized classifier)
- Multi-language OCR (Arabic, Malay, Indonesian labels)
- Halal restaurant/store finder integration
- Browser extension for online grocery shopping
