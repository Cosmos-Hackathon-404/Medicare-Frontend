# Building Your Own Memory Layer — Architecture Blueprint

> A comprehensive guide to replacing Supermemory with a self-built semantic memory system for the Medicare AI application.

## Table of Contents

- [Why Build Your Own?](#why-build-your-own)
- [What You're Replacing](#what-youre-replacing)
- [High-Level Architecture](#high-level-architecture)
- [Technology Stack Choices](#technology-stack-choices)
- [Core Components](#core-components)
  - [1. Vector Store (Semantic Search)](#1-vector-store-semantic-search)
  - [2. Knowledge Extractor (Fact Extraction Pipeline)](#2-knowledge-extractor-fact-extraction-pipeline)
  - [3. Patient Profile Manager](#3-patient-profile-manager)
  - [4. Memory CRUD Service](#4-memory-crud-service)
  - [5. Document Ingestion Pipeline (OCR + Chunking)](#5-document-ingestion-pipeline-ocr--chunking)
- [Database Schema Design](#database-schema-design)
  - [Option A — Postgres + pgvector](#option-a--postgres--pgvector)
  - [Option B — Convex + External Vector DB](#option-b--convex--external-vector-db)
- [API Design — Drop-In Replacement](#api-design--drop-in-replacement)
- [Implementation Plan](#implementation-plan)
  - [Phase 1: Memory Store + Embeddings](#phase-1-memory-store--embeddings)
  - [Phase 2: Knowledge Extraction Pipeline](#phase-2-knowledge-extraction-pipeline)
  - [Phase 3: Patient Profile Builder](#phase-3-patient-profile-builder)
  - [Phase 4: Document Ingestion](#phase-4-document-ingestion)
  - [Phase 5: Integration + Migration](#phase-5-integration--migration)
- [Embedding Strategy](#embedding-strategy)
- [Chunking Strategy](#chunking-strategy)
- [Retrieval Strategy (RAG)](#retrieval-strategy-rag)
- [Profile Building Algorithm](#profile-building-algorithm)
- [Infrastructure Options](#infrastructure-options)
  - [Minimal (Free/Cheap)](#minimal-freecheap)
  - [Production-Ready](#production-ready)
  - [Enterprise / Self-Hosted](#enterprise--self-hosted)
- [Code Architecture](#code-architecture)
- [Integration Points — Replacing Supermemory Calls](#integration-points--replacing-supermemory-calls)
- [Performance Considerations](#performance-considerations)
- [Security & Compliance (HIPAA)](#security--compliance-hipaa)
- [Cost Analysis](#cost-analysis)
- [Appendix: Full Schema SQL](#appendix-full-schema-sql)

---

## Why Build Your Own?

| Concern | Supermemory (Current) | Self-Built |
|---------|----------------------|------------|
| **Data Sovereignty** | Patient data leaves your infra, stored on 3rd-party servers | Full control — stays in your DB |
| **HIPAA Compliance** | Dependent on vendor's compliance status | You control the entire chain |
| **Cost at Scale** | Per-API-call pricing, grows linearly | Fixed infra cost, sublinear growth |
| **Customization** | Black-box extraction logic | Tune extraction prompts, embedding models, retrieval weights |
| **Latency** | Network round-trip to external API | Co-located with your backend — sub-50ms retrieval |
| **Vendor Lock-in** | Tied to Supermemory's API/pricing/availability | No dependency on any single vendor |
| **Offline/Edge** | Requires internet | Can run fully self-hosted |

---

## What You're Replacing

The current app uses exactly **3 Supermemory operations** that you need to replicate:

### 1. `supermemory.profile({ containerTag, q? })`
**Purpose:** Read a patient's accumulated medical knowledge.

**Returns:**
```typescript
{
  profile: {
    static: string[],     // Permanent facts ("Has Type 2 Diabetes")
    dynamic: string[],    // Recent context ("Currently on Metformin 500mg")
  },
  searchResults: {
    results: [{ memory: string }]   // Semantically similar memories
  }
}
```

### 2. `supermemory.add({ content, containerTags, customId })`
**Purpose:** Store a new memory (e.g., session summary, report analysis) in a patient's container.

**Returns:** `{ id: string }` — the memory document ID.

### 3. `POST /v3/documents/file` (REST)
**Purpose:** Upload raw PDF/image for OCR extraction and indexing.

**Accepts:** `multipart/form-data` with `file`, `containerTags`, `customId`.

---

## High-Level Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                          Convex Actions                                │
│   summarizeSession │ analyzeReport │ generateSharedContext │ etc.      │
│                                                                        │
│   Instead of:  supermemory.profile() / supermemory.add()               │
│   Now calls:   memoryService.getProfile() / memoryService.addMemory() │
└───────────────────────────────┬────────────────────────────────────────┘
                                │
                    ┌───────────┴───────────┐
                    ▼                       ▼
          ┌──────────────────┐    ┌──────────────────┐
          │  Memory Service  │    │  Document        │
          │  (API Layer)     │    │  Ingestion        │
          │                  │    │  Pipeline         │
          │  • getProfile()  │    │                   │
          │  • addMemory()   │    │  • OCR Extract    │
          │  • search()      │    │  • Chunk          │
          └────────┬─────────┘    │  • Embed + Store  │
                   │              └────────┬──────────┘
          ┌────────┴──────────────────────┴────────┐
          ▼                                        ▼
┌──────────────────┐                    ┌──────────────────────┐
│  Knowledge       │                    │  Embedding           │
│  Extractor       │                    │  Service             │
│                  │                    │                      │
│  LLM-based      │                    │  text → vector       │
│  fact extraction │                    │  (1536-dim or 768)   │
│  from raw text   │                    │                      │
└────────┬─────────┘                    └──────────┬───────────┘
         │                                         │
         ▼                                         ▼
┌──────────────────────────────────────────────────────────────┐
│                        Data Layer                            │
│                                                              │
│  ┌─────────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │  Patient Facts   │  │  Memory      │  │  Vector        │  │
│  │  Table           │  │  Documents   │  │  Index         │  │
│  │                  │  │  Table       │  │                │  │
│  │  static_facts[]  │  │  content     │  │  embedding[]   │  │
│  │  dynamic_facts[] │  │  metadata    │  │  doc_id (FK)   │  │
│  │  patientId (PK)  │  │  customId    │  │                │  │
│  │  updated_at      │  │  patientId   │  │  ANN search    │  │
│  └─────────────────┘  └──────────────┘  └────────────────┘  │
│                                                              │
│  Option A: Postgres + pgvector (single DB)                   │
│  Option B: Convex tables + Pinecone/Qdrant (separate)        │
└──────────────────────────────────────────────────────────────┘
```

---

## Technology Stack Choices

### Embedding Models

| Model | Dimensions | Cost | Quality | Latency | Recommendation |
|-------|-----------|------|---------|---------|----------------|
| **OpenAI `text-embedding-3-small`** | 1536 | $0.02/1M tokens | Very Good | ~100ms | Best balance for production |
| **OpenAI `text-embedding-3-large`** | 3072 | $0.13/1M tokens | Excellent | ~150ms | If quality is paramount |
| **Google `text-embedding-004`** | 768 | Free tier available | Good | ~80ms | Free, already using Google |
| **Cohere `embed-v4.0`** | 1024 | $0.10/1M tokens | Excellent | ~100ms | Great for medical text |
| **`all-MiniLM-L6-v2`** (self-hosted) | 384 | Free (compute only) | Decent | ~10ms | Full privacy, needs GPU |
| **`nomic-embed-text`** (Ollama) | 768 | Free (local) | Good | ~20ms | Self-hosted, no API calls |

**Recommended:** `text-embedding-3-small` for production, `nomic-embed-text` via Ollama for self-hosted.

### Vector Databases

| Database | Type | Cost | Scaling | Integration | Recommendation |
|----------|------|------|---------|-------------|----------------|
| **pgvector** (Postgres extension) | SQL + Vector | Free (self-host) or $15+/mo (Supabase/Neon) | Vertical | Single DB for everything | Best for simplicity, start here |
| **Pinecone** | Managed vector DB | Free tier (1 index), then $70/mo | Horizontal | Separate service | Best managed option |
| **Qdrant** | Vector DB | Free (self-host) or cloud plans | Horizontal | Docker-friendly | Best self-hosted vector DB |
| **Chroma** | Embedded vector DB | Free | Single-node | In-process Python | Prototyping only |
| **Weaviate** | Vector DB + RAG | Free (self-host) | Horizontal | Full-featured | Over-engineered for this use |
| **Convex** (no native vectors) | Document DB | Already paying | N/A | Need external vectors | Awkward for vectors |

**Recommended:** Postgres + pgvector (single database) for simplicity, or Qdrant (Docker) for dedicated vector workload.

### OCR / Document Extraction

| Service | Cost | Quality | Self-Hosted? |
|---------|------|---------|-------------|
| **Google Document AI** | $1.50/1K pages | Excellent (medical) | No |
| **Tesseract** | Free | Good (needs tuning) | Yes |
| **Gemini Vision** (already have) | Per-token pricing | Excellent | No |
| **AWS Textract** | $1.50/1K pages | Excellent | No |
| **PaddleOCR** | Free | Very Good | Yes |

**Recommended:** You already use Gemini multimodal for report analysis — reuse the extracted text from that step. No separate OCR needed.

### Fact Extraction LLM

| Option | Cost | Quality | Notes |
|--------|------|---------|-------|
| **Google Gemini** (already have) | Per-token | Excellent | Reuse existing API key |
| **GPT-4o-mini** | $0.15/1M input | Very Good | Cheap, fast |
| **Llama 3.1 8B** (self-hosted) | Free (compute) | Good | Needs GPU |
| **Claude Haiku** | $0.25/1M input | Excellent | Best reasoning |

**Recommended:** Google Gemini (already in the stack, no new dependency).

---

## Core Components

### 1. Vector Store (Semantic Search)

The vector store replaces `supermemory.searchResults`. It stores embeddings of every memory chunk and enables Approximate Nearest Neighbor (ANN) search.

**Responsibilities:**
- Store text chunks with their vector embeddings
- Perform similarity search given a query vector
- Filter results by `patientId` (container isolation)
- Return top-K most relevant memories

**Interface:**
```typescript
interface VectorStore {
  // Store a new embedding
  upsert(params: {
    id: string;
    vector: number[];
    metadata: {
      patientId: string;
      sourceType: "session" | "report" | "report_file";
      sourceId: string;
      chunkIndex: number;
      content: string;       // original text, stored alongside vector
    };
  }): Promise<void>;

  // Similarity search within a patient's container
  search(params: {
    vector: number[];        // query embedding
    patientId: string;       // filter to this patient only
    topK?: number;           // default 10
    minScore?: number;       // similarity threshold
  }): Promise<Array<{
    id: string;
    score: number;
    content: string;
    metadata: Record<string, unknown>;
  }>>;

  // Delete all vectors for a source document
  deleteBySourceId(sourceId: string): Promise<void>;
}
```

### 2. Knowledge Extractor (Fact Extraction Pipeline)

Replaces Supermemory's auto-extraction of `profile.static` and `profile.dynamic`. Uses an LLM to extract structured facts from raw text.

**Responsibilities:**
- Take raw text (session summary, report analysis) as input
- Use LLM to extract facts in two categories:
  - **Static facts** — permanent truths (diagnoses, allergies, blood type)
  - **Dynamic facts** — current state (medications, recent symptoms, vitals)
- Deduplicate against existing facts
- Update the patient's fact profile

**Extraction Prompt:**
```
You are a medical knowledge extractor. Given the following medical text,
extract facts about the patient into two categories:

STATIC FACTS — permanent or long-term truths:
- Diagnosed conditions (e.g., "Type 2 Diabetes", "Hypertension")
- Allergies (e.g., "Allergic to penicillin")
- Surgical history (e.g., "Appendectomy in 2019")
- Blood type, chronic conditions, family history

DYNAMIC FACTS — current or changing state:
- Current medications with dosages (e.g., "Metformin 500mg twice daily")
- Recent symptoms (e.g., "Experiencing frequent headaches since Jan 2026")
- Current vital trends (e.g., "Blood pressure trending high, last: 145/95")
- Recent lab results (e.g., "HbA1c: 7.2% as of Feb 2026")

Rules:
- Each fact should be ONE clear sentence
- Include dates/timeframes when available
- If a dynamic fact SUPERSEDES an existing one, mark for replacement
- Do NOT include speculative or uncertain information

INPUT TEXT:
{text}

EXISTING STATIC FACTS:
{existingStaticFacts}

EXISTING DYNAMIC FACTS:
{existingDynamicFacts}

Respond ONLY with valid JSON:
{
  "new_static_facts": ["fact1", "fact2"],
  "new_dynamic_facts": ["fact1", "fact2"],
  "superseded_dynamic_facts": [
    { "old": "existing fact text", "new": "replacement fact text" }
  ]
}
```

### 3. Patient Profile Manager

Replaces the `supermemory.profile()` return shape. Manages the patient's accumulated knowledge profile.

**Responsibilities:**
- Store and retrieve static/dynamic facts per patient
- Merge new facts with existing ones (deduplication + superseding)
- Combine facts with vector search results into a unified profile response
- Handle the `getProfile()` call that all AI actions depend on

**Interface:**
```typescript
interface PatientProfileManager {
  // Full replacement for supermemory.profile()
  getProfile(params: {
    patientId: string;
    q?: string;               // optional semantic search query
    topK?: number;            // how many memories to return (default 10)
  }): Promise<{
    profile: {
      static: string[];       // permanent facts
      dynamic: string[];      // current state facts
    };
    searchResults: {
      results: Array<{ memory: string }>;
    };
  }>;

  // Update facts after knowledge extraction
  updateFacts(params: {
    patientId: string;
    newStaticFacts: string[];
    newDynamicFacts: string[];
    supersededDynamicFacts: Array<{ old: string; new: string }>;
  }): Promise<void>;

  // Get raw facts (for admin/debug)
  getRawFacts(patientId: string): Promise<{
    static: string[];
    dynamic: string[];
    lastUpdated: string;
  }>;
}
```

### 4. Memory CRUD Service

Replaces `supermemory.add()`. Manages the full lifecycle of memory documents.

**Responsibilities:**
- Accept raw text content + metadata
- Generate embeddings
- Chunk long documents
- Store in vector DB
- Trigger knowledge extraction
- Return a document ID
- Handle updates (via `customId` deduplication)

**Interface:**
```typescript
interface MemoryService {
  // Full replacement for supermemory.add()
  addMemory(params: {
    content: string;
    patientId: string;         // replaces containerTags
    customId: string;          // e.g., "session_abc123"
    sourceType: "session" | "report" | "report_file";
    extractFacts?: boolean;    // default true - run knowledge extraction
  }): Promise<{ id: string }>;

  // Full replacement for supermemory.profile()
  getProfile(params: {
    patientId: string;
    q?: string;
  }): Promise<ProfileResult>;

  // Full replacement for file upload
  addDocument(params: {
    fileBuffer: Buffer;
    fileName: string;
    mimeType: string;
    patientId: string;
    customId: string;
  }): Promise<{ id: string }>;

  // Delete a memory (for data deletion requests)
  deleteMemory(customId: string): Promise<void>;

  // Delete all memories for a patient (GDPR/right to be forgotten)
  deletePatientMemories(patientId: string): Promise<void>;
}
```

### 5. Document Ingestion Pipeline (OCR + Chunking)

Replaces the raw file upload to Supermemory's `/v3/documents/file` endpoint.

**Responsibilities:**
- Accept raw PDF/image files
- Extract text (reuse Gemini multimodal output or run OCR)
- Chunk extracted text into embeddable segments
- Generate embeddings for each chunk
- Store chunks in vector DB
- Optionally trigger fact extraction on the extracted text

**Pipeline:**
```
Raw File (PDF/Image)
        │
        ▼
  ┌─────────────┐
  │ Text Extract │  ← Gemini Vision (already done in analyzeReport)
  │              │     OR Tesseract/PaddleOCR for raw files
  └──────┬──────┘
         │
         ▼
  ┌─────────────┐
  │   Chunker    │  ← Split into 500-token chunks with 50-token overlap
  └──────┬──────┘
         │
         ▼
  ┌─────────────┐
  │  Embedder    │  ← text-embedding-3-small / nomic-embed-text
  └──────┬──────┘
         │
         ▼
  ┌─────────────┐
  │ Vector Store │  ← Upsert chunks with patient container metadata
  └──────┬──────┘
         │
         ▼
  ┌─────────────┐
  │  Knowledge   │  ← Extract facts from full text
  │  Extractor   │
  └─────────────┘
```

---

## Database Schema Design

### Option A — Postgres + pgvector

Single database for everything. Best for simplicity and data co-location.

```sql
-- Enable vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- Table 1: Patient Fact Profiles
-- Replaces supermemory profile.static / profile.dynamic
-- ============================================
CREATE TABLE patient_facts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id      TEXT NOT NULL,              -- Clerk user ID
    fact_type       TEXT NOT NULL CHECK (fact_type IN ('static', 'dynamic')),
    content         TEXT NOT NULL,              -- the fact text
    source_id       TEXT,                       -- which session/report generated this
    source_type     TEXT,                       -- 'session', 'report', 'manual'
    confidence      REAL DEFAULT 1.0,           -- extraction confidence score
    superseded_by   UUID REFERENCES patient_facts(id),
    is_active       BOOLEAN DEFAULT TRUE,       -- false when superseded
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_patient_fact UNIQUE (patient_id, fact_type, content)
);

CREATE INDEX idx_patient_facts_patient ON patient_facts(patient_id, fact_type, is_active);

-- ============================================
-- Table 2: Memory Documents
-- Replaces supermemory.add() storage
-- ============================================
CREATE TABLE memory_documents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    custom_id       TEXT UNIQUE NOT NULL,       -- e.g., "session_abc123"
    patient_id      TEXT NOT NULL,              -- container isolation
    source_type     TEXT NOT NULL,              -- 'session', 'report', 'report_file'
    content         TEXT NOT NULL,              -- full original text
    chunk_count     INT DEFAULT 0,             -- how many chunks were created
    facts_extracted BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_memory_docs_patient ON memory_documents(patient_id);
CREATE INDEX idx_memory_docs_custom ON memory_documents(custom_id);

-- ============================================
-- Table 3: Memory Chunks (with vectors)
-- Powers semantic search (replaces searchResults)
-- ============================================
CREATE TABLE memory_chunks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id     UUID NOT NULL REFERENCES memory_documents(id) ON DELETE CASCADE,
    patient_id      TEXT NOT NULL,              -- denormalized for fast filtering
    chunk_index     INT NOT NULL,
    content         TEXT NOT NULL,              -- the chunk text
    token_count     INT,
    embedding       vector(1536) NOT NULL,      -- adjust dim for your model
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- HNSW index for fast ANN search, filtered by patient
CREATE INDEX idx_chunks_embedding ON memory_chunks
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

CREATE INDEX idx_chunks_patient ON memory_chunks(patient_id);

-- ============================================
-- Table 4: Extraction Jobs (async processing)
-- ============================================
CREATE TABLE extraction_jobs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id     UUID NOT NULL REFERENCES memory_documents(id),
    patient_id      TEXT NOT NULL,
    status          TEXT DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed')),
    error_message   TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    completed_at    TIMESTAMPTZ
);
```

**Semantic search query (replaces `supermemory.profile().searchResults`):**
```sql
SELECT mc.content AS memory, 1 - (mc.embedding <=> $1) AS score
FROM memory_chunks mc
WHERE mc.patient_id = $2
ORDER BY mc.embedding <=> $1
LIMIT $3;

-- $1 = query embedding vector
-- $2 = patient clerk ID
-- $3 = topK (default 10)
```

### Option B — Convex + External Vector DB

Keep Convex as primary, use Pinecone/Qdrant for vectors only.

**Convex tables (add to existing `schema.ts`):**
```typescript
// Add to convex/schema.ts:

patientFacts: defineTable({
  patientClerkId: v.string(),
  factType: v.union(v.literal("static"), v.literal("dynamic")),
  content: v.string(),
  sourceId: v.optional(v.string()),
  sourceType: v.optional(v.string()),
  isActive: v.boolean(),
  supersededBy: v.optional(v.id("patientFacts")),
})
  .index("by_patient_active", ["patientClerkId", "factType", "isActive"])
  .index("by_sourceId", ["sourceId"]),

memoryDocuments: defineTable({
  customId: v.string(),
  patientClerkId: v.string(),
  sourceType: v.string(),
  content: v.string(),
  chunkCount: v.number(),
  factsExtracted: v.boolean(),
})
  .index("by_customId", ["customId"])
  .index("by_patientClerkId", ["patientClerkId"]),
```

**Pinecone/Qdrant stores only vectors + metadata (no raw text needed, stored in Convex).**

---

## API Design — Drop-In Replacement

The goal is to create a service with the **exact same interface** so that changes to the Convex actions are minimal.

### Current Code (Supermemory):
```typescript
import Supermemory from "supermemory";
const supermemory = new Supermemory({ apiKey: process.env.SUPERMEMORY_API_KEY! });

// READ
const profileResult = await supermemory.profile({
  containerTag: args.patientClerkId,
  q: transcript,
});

// WRITE
const memResult = await supermemory.add({
  content: summaryText,
  containerTags: [args.patientClerkId],
  customId: `session_${sessionId}`,
});
```

### Replacement Code (Self-Built):
```typescript
import { MemoryService } from "../lib/memory";
const memory = new MemoryService({
  embeddingApiKey: process.env.OPENAI_API_KEY!,       // or GOOGLE_API_KEY
  databaseUrl: process.env.DATABASE_URL!,              // Postgres connection
  llmApiKey: process.env.GOOGLE_GEMINI_API_KEY!,       // for fact extraction
});

// READ — identical return shape
const profileResult = await memory.getProfile({
  patientId: args.patientClerkId,
  q: transcript,
});

// WRITE — identical return shape
const memResult = await memory.addMemory({
  content: summaryText,
  patientId: args.patientClerkId,
  customId: `session_${sessionId}`,
  sourceType: "session",
});
```

**The return shapes are identical, so no changes needed in the action handler logic.**

---

## Implementation Plan

### Phase 1: Memory Store + Embeddings
**Duration:** 2-3 days | **Replaces:** `supermemory.add()` + `searchResults`

```
Tasks:
├── Set up Postgres + pgvector (or Qdrant Docker)
├── Create embedding service wrapper
│   ├── OpenAI text-embedding-3-small
│   └── OR Google text-embedding-004
│   └── OR local nomic-embed-text via Ollama
├── Implement chunking logic
│   ├── Recursive text splitter (500 tokens, 50 overlap)
│   └── Metadata attachment (patientId, sourceType, sourceId)
├── Implement VectorStore interface
│   ├── upsert() — store embeddings
│   ├── search() — cosine similarity with patient filter
│   └── deleteBySourceId() — cleanup
├── Implement MemoryService.addMemory()
│   ├── Accept content + metadata
│   ├── Chunk → Embed → Store
│   └── Return { id }
└── Implement MemoryService.getProfile() — search part only
    ├── Embed query
    ├── Search vector store filtered by patientId
    └── Return { searchResults: { results: [{ memory }] } }
```

**Validation:** Run `addMemory()` with a session summary, then `getProfile()` with a related query. Verify relevant memories are returned.

### Phase 2: Knowledge Extraction Pipeline
**Duration:** 2-3 days | **Replaces:** `profile.static` + `profile.dynamic`

```
Tasks:
├── Create fact extraction prompt (see Section: Knowledge Extractor)
├── Implement KnowledgeExtractor
│   ├── Send text + existing facts to Gemini
│   ├── Parse JSON response
│   └── Handle superseded facts
├── Create patient_facts table/collection
├── Implement PatientProfileManager
│   ├── updateFacts() — merge new facts, handle superseding
│   ├── getProfile() — retrieve active static + dynamic facts
│   └── deduplication logic
├── Wire extraction into addMemory() pipeline
│   ├── After storing chunks, trigger fact extraction
│   └── Option: sync (inline) or async (background job)
└── Update MemoryService.getProfile() to include profile.static/dynamic
```

**Validation:** Add several session summaries, verify facts accumulate correctly. Add a new session that changes a medication — verify old fact is superseded.

### Phase 3: Patient Profile Builder
**Duration:** 1-2 days | **Brings it all together**

```
Tasks:
├── Implement complete getProfile() combining:
│   ├── Static facts from patient_facts table
│   ├── Dynamic facts from patient_facts table
│   └── Semantic search results from vector store
├── Add profile caching (optional, invalidate on new memory)
├── Add fallback handling (empty profile for new patients)
└── Match exact Supermemory return shape for drop-in replacement
```

### Phase 4: Document Ingestion
**Duration:** 1-2 days | **Replaces:** File upload to Supermemory

```
Tasks:
├── Implement MemoryService.addDocument()
│   ├── Accept file buffer + metadata
│   ├── Text extraction strategy:
│   │   ├── Option A: Reuse Gemini's analysis text (already extracted)
│   │   └── Option B: Run Tesseract/PaddleOCR on raw file
│   ├── Chunk extracted text
│   ├── Embed + store in vector DB
│   └── Trigger fact extraction
└── Wire into analyzeReport action
    └── Replace the fetch() to api.supermemory.ai/v3/documents/file
```

**Optimization:** Since `analyzeReport` already sends the file to Gemini and gets a text analysis back, you can skip separate OCR entirely. Just use the Gemini analysis text as the document content to embed. This saves cost and complexity.

### Phase 5: Integration + Migration
**Duration:** 2-3 days | **Swap in the new system**

```
Tasks:
├── Create adapter class matching Supermemory interface
├── Update all 5 Convex actions to use new MemoryService:
│   ├── summarizeSession.ts
│   ├── analyzeReport.ts
│   ├── generateSharedContext.ts
│   ├── generateWellnessPlan.ts
│   └── checkDrugInteractions.ts
├── Migration script for existing data:
│   ├── Read all sessions with aiSummary from Convex
│   ├── Run through addMemory() pipeline
│   ├── Read all reports with aiSummary from Convex
│   ├── Run through addMemory() pipeline
│   └── Facts will auto-extract during migration
├── Remove Supermemory dependency
│   ├── npm uninstall supermemory
│   └── Remove SUPERMEMORY_API_KEY from env
└── End-to-end testing
    ├── Upload a report → verify facts extracted
    ├── Record a session → verify memory stored
    ├── Share context → verify profile used
    ├── Generate wellness plan → verify memory-enriched
    └── Check drug interactions → verify medication history
```

---

## Embedding Strategy

### Text Preprocessing

Before embedding, preprocess medical text for better retrieval:

```typescript
function preprocessForEmbedding(text: string, sourceType: string): string {
  // Add source context prefix for better retrieval
  const prefix = {
    session: "Medical consultation session summary: ",
    report: "Medical report analysis: ",
    report_file: "Medical document content: ",
  }[sourceType] || "";

  return prefix + text
    .replace(/\s+/g, " ")          // normalize whitespace
    .replace(/[^\w\s.,;:!?()-]/g, "") // remove special chars
    .trim();
}
```

### Embedding Caching

Cache embeddings for identical content to avoid redundant API calls:

```typescript
// Hash content → check cache → embed only if miss
const contentHash = crypto.createHash("sha256").update(content).digest("hex");
const cached = await cache.get(`emb:${contentHash}`);
if (cached) return cached;

const embedding = await embedder.embed(content);
await cache.set(`emb:${contentHash}`, embedding, { ttl: 86400 * 30 }); // 30 days
```

---

## Chunking Strategy

Medical text requires careful chunking to preserve clinical meaning:

```typescript
interface ChunkOptions {
  maxTokens: number;       // 500 tokens ≈ 375 words
  overlapTokens: number;   // 50 tokens overlap between chunks
  separators: string[];    // split boundaries
}

const MEDICAL_CHUNK_OPTIONS: ChunkOptions = {
  maxTokens: 500,
  overlapTokens: 50,
  separators: [
    "\n## ",             // markdown headers (report sections)
    "\n### ",
    "\nDiagnosis:",      // medical section boundaries
    "\nPrescriptions:",
    "\nKey Decisions:",
    "\nFollow-up:",
    "\nCritical Findings:",
    "\nRecommendations:",
    "\n\n",              // paragraph breaks
    "\n",                // line breaks
    ". ",                // sentence breaks (last resort)
  ],
};
```

**Why these separators?** Session summaries and report analyses have natural section boundaries. Splitting at section headers keeps related medical information together in the same chunk, improving retrieval relevance.

---

## Retrieval Strategy (RAG)

### Basic Retrieval (Phase 1)

```typescript
async function retrieve(patientId: string, query: string, topK = 10) {
  const queryEmbedding = await embedder.embed(query);
  return vectorStore.search({
    vector: queryEmbedding,
    patientId,
    topK,
    minScore: 0.7,    // cosine similarity threshold
  });
}
```

### Enhanced Retrieval (Phase 3+)

For better results, combine multiple retrieval strategies:

```typescript
async function enhancedRetrieve(patientId: string, query: string) {
  // 1. Semantic search — find memories similar to query
  const semanticResults = await vectorSearch(patientId, query, topK: 8);

  // 2. Recency boost — recent memories are more relevant
  const recentResults = await getRecentMemories(patientId, limit: 3);

  // 3. Source diversity — ensure results from different sessions/reports
  const diverseResults = deduplicateBySource(
    [...semanticResults, ...recentResults]
  );

  // 4. Re-rank (optional) — use LLM to re-rank for relevance
  // const reranked = await rerank(query, diverseResults);

  return diverseResults.slice(0, 10);
}
```

### Hybrid Search (Advanced)

Combine vector similarity with keyword search for medical terms:

```sql
-- Postgres: combine full-text search with vector similarity
SELECT
    mc.content,
    (0.7 * (1 - (mc.embedding <=> $1))) +      -- semantic similarity (70% weight)
    (0.3 * ts_rank(to_tsvector(mc.content), plainto_tsquery($2)))  -- keyword match (30%)
    AS combined_score
FROM memory_chunks mc
WHERE mc.patient_id = $3
  AND (
    (mc.embedding <=> $1) < 0.3                  -- vector similarity threshold
    OR to_tsvector(mc.content) @@ plainto_tsquery($2)  -- OR keyword match
  )
ORDER BY combined_score DESC
LIMIT $4;
```

This is especially useful for medical terminology (e.g., "HbA1c", "metformin") that may not embed well but is critical to find via exact keyword match.

---

## Profile Building Algorithm

The profile builder runs after every `addMemory()` call:

```
New Memory Added
       │
       ▼
  ┌──────────────────────────┐
  │ Load existing facts      │
  │ for this patient         │
  │                          │
  │ static_facts[]:          │
  │   "Type 2 Diabetes"     │
  │   "Allergic to Penicillin"│
  │                          │
  │ dynamic_facts[]:         │
  │   "Metformin 500mg 2x"  │
  │   "BP: 140/90"          │
  └────────────┬─────────────┘
               │
               ▼
  ┌──────────────────────────┐
  │ LLM Fact Extraction      │
  │                          │
  │ Input:                   │
  │   - new memory text      │
  │   - existing facts       │
  │                          │
  │ Output:                  │
  │   new_static: [...]      │
  │   new_dynamic: [...]     │
  │   superseded: [          │
  │     {old: "Metformin     │
  │      500mg 2x",          │
  │      new: "Metformin     │
  │      1000mg 2x"}         │
  │   ]                      │
  └────────────┬─────────────┘
               │
               ▼
  ┌──────────────────────────┐
  │ Merge Facts              │
  │                          │
  │ 1. Add new_static to     │
  │    static_facts (dedup)  │
  │ 2. Add new_dynamic to    │
  │    dynamic_facts         │
  │ 3. For each superseded:  │
  │    - Mark old as inactive│
  │    - Link old → new      │
  │ 4. Save to DB            │
  └──────────────────────────┘
```

**Deduplication logic:**
```typescript
function isDuplicateFact(existing: string, candidate: string): boolean {
  // Exact match
  if (existing.toLowerCase() === candidate.toLowerCase()) return true;

  // Semantic similarity (using embeddings)
  const similarity = cosineSimilarity(
    embed(existing),
    embed(candidate)
  );
  return similarity > 0.92;  // very high threshold for facts
}
```

---

## Infrastructure Options

### Minimal (Free/Cheap)
**Monthly cost: $0–15 | Best for: development, solo projects**

```
┌─────────────────────────────────┐
│  Convex (existing, free tier)   │  ← app data
├─────────────────────────────────┤
│  Neon Postgres (free tier)      │  ← pgvector, 512MB storage
│  OR SQLite + sqlite-vss (local) │
├─────────────────────────────────┤
│  Ollama (local)                 │  ← nomic-embed-text (free)
│  OR Google text-embedding-004   │  ← free tier
├─────────────────────────────────┤
│  Gemini Flash (existing)        │  ← fact extraction
└─────────────────────────────────┘
```

### Production-Ready
**Monthly cost: $30–100 | Best for: small-medium scale**

```
┌─────────────────────────────────┐
│  Convex (existing)              │  ← app data
├─────────────────────────────────┤
│  Supabase Postgres ($25/mo)     │  ← pgvector, 8GB, backups
│  OR Railway Postgres ($5+/mo)   │
├─────────────────────────────────┤
│  OpenAI Embeddings ($0.02/1M)   │  ← text-embedding-3-small
├─────────────────────────────────┤
│  Gemini Flash (existing)        │  ← fact extraction
├─────────────────────────────────┤
│  Redis/Upstash (optional)       │  ← embedding cache
└─────────────────────────────────┘
```

### Enterprise / Self-Hosted
**Monthly cost: $200+ (infra) | Best for: HIPAA, full control**

```
┌─────────────────────────────────┐
│  Convex (existing)              │  ← app data
├─────────────────────────────────┤
│  Self-hosted Postgres + pgvector│  ← on your VPS/AWS/GCP
│  OR Qdrant (Docker container)   │
├─────────────────────────────────┤
│  Self-hosted embedding model    │  ← sentence-transformers on GPU
│  OR nomic-embed-text via Ollama │  ← CPU-friendly
├─────────────────────────────────┤
│  Self-hosted LLM (Llama 3.1)   │  ← fact extraction (optional)
│  OR Gemini API (for quality)    │
├─────────────────────────────────┤
│  MinIO (S3-compatible)          │  ← document storage
└─────────────────────────────────┘
```

---

## Code Architecture

### File Structure

```
lib/
  memory/
    index.ts                 # MemoryService — main entry point
    embedder.ts              # Embedding model wrapper
    chunker.ts               # Text chunking logic
    vector-store.ts          # VectorStore interface + implementations
    vector-store-pgvector.ts # Postgres pgvector implementation
    vector-store-qdrant.ts   # Qdrant implementation (alternative)
    knowledge-extractor.ts   # LLM-based fact extraction
    profile-manager.ts       # Patient profile CRUD
    document-ingester.ts     # File → text → chunks pipeline
    types.ts                 # Shared types
    prompts.ts               # Extraction prompt templates
```

### Class Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      MemoryService                          │
│─────────────────────────────────────────────────────────────│
│ - embedder: Embedder                                        │
│ - vectorStore: VectorStore                                  │
│ - extractor: KnowledgeExtractor                             │
│ - profileManager: PatientProfileManager                     │
│ - ingester: DocumentIngester                                │
│─────────────────────────────────────────────────────────────│
│ + getProfile(patientId, q?): ProfileResult                  │
│ + addMemory(content, patientId, customId, sourceType): {id} │
│ + addDocument(file, patientId, customId): {id}              │
│ + deleteMemory(customId): void                              │
│ + deletePatientMemories(patientId): void                    │
└───────────┬─────────────────────────────────────────────────┘
            │ depends on
    ┌───────┴───────────────────────────────┐
    │                                       │
    ▼                                       ▼
┌──────────────┐ ┌──────────────┐ ┌─────────────────────┐
│   Embedder   │ │ VectorStore  │ │ KnowledgeExtractor  │
│──────────────│ │──────────────│ │─────────────────────│
│ + embed()    │ │ + upsert()   │ │ + extract()         │
│ + embedBatch │ │ + search()   │ │                     │
└──────────────┘ │ + delete()   │ └─────────────────────┘
                 └──────────────┘
                 ▲            ▲
        ┌────────┘            └────────┐
        │                              │
┌───────────────┐          ┌───────────────┐
│ PgVectorStore │          │  QdrantStore  │
│ (Postgres)    │          │  (Qdrant)     │
└───────────────┘          └───────────────┘
```

### Key Implementation — `MemoryService.getProfile()`

```typescript
async getProfile(params: {
  patientId: string;
  q?: string;
  topK?: number;
}): Promise<ProfileResult> {
  const { patientId, q, topK = 10 } = params;

  // 1. Get patient facts (replaces profile.static / profile.dynamic)
  const facts = await this.profileManager.getRawFacts(patientId);

  // 2. Semantic search if query provided (replaces searchResults)
  let searchResults: { results: { memory: string }[] } = { results: [] };

  if (q) {
    const queryEmbedding = await this.embedder.embed(q);
    const results = await this.vectorStore.search({
      vector: queryEmbedding,
      patientId,
      topK,
      minScore: 0.65,
    });

    searchResults = {
      results: results.map(r => ({ memory: r.content })),
    };
  }

  // 3. Return in exact Supermemory shape
  return {
    profile: {
      static: facts.static.length > 0 ? facts.static : undefined,
      dynamic: facts.dynamic.length > 0 ? facts.dynamic : undefined,
    },
    searchResults: searchResults.results.length > 0 ? searchResults : undefined,
  };
}
```

### Key Implementation — `MemoryService.addMemory()`

```typescript
async addMemory(params: {
  content: string;
  patientId: string;
  customId: string;
  sourceType: "session" | "report" | "report_file";
  extractFacts?: boolean;
}): Promise<{ id: string }> {
  const { content, patientId, customId, sourceType, extractFacts = true } = params;

  // 1. Upsert memory document (dedup by customId)
  const docId = await this.db.upsertMemoryDocument({
    customId,
    patientId,
    sourceType,
    content,
  });

  // 2. Delete existing chunks for this document (idempotent)
  await this.vectorStore.deleteBySourceId(customId);

  // 3. Chunk the content
  const chunks = this.chunker.chunk(content, {
    maxTokens: 500,
    overlapTokens: 50,
    sourceType,
  });

  // 4. Generate embeddings for all chunks (batched)
  const embeddings = await this.embedder.embedBatch(
    chunks.map(c => c.text)
  );

  // 5. Store chunks with embeddings in vector store
  await Promise.all(
    chunks.map((chunk, i) =>
      this.vectorStore.upsert({
        id: `${customId}_chunk_${i}`,
        vector: embeddings[i],
        metadata: {
          patientId,
          sourceType,
          sourceId: customId,
          chunkIndex: i,
          content: chunk.text,
        },
      })
    )
  );

  // 6. Extract and store facts (async or sync)
  if (extractFacts) {
    const existingFacts = await this.profileManager.getRawFacts(patientId);
    const extracted = await this.extractor.extract({
      text: content,
      existingStaticFacts: existingFacts.static,
      existingDynamicFacts: existingFacts.dynamic,
    });

    await this.profileManager.updateFacts({
      patientId,
      newStaticFacts: extracted.newStaticFacts,
      newDynamicFacts: extracted.newDynamicFacts,
      supersededDynamicFacts: extracted.supersededDynamicFacts,
    });
  }

  // 7. Update document metadata
  await this.db.updateMemoryDocument(docId, {
    chunkCount: chunks.length,
    factsExtracted: extractFacts,
  });

  return { id: docId };
}
```

---

## Integration Points — Replacing Supermemory Calls

### Changes per action file:

| File | Lines Changed | What Changes |
|------|--------------|--------------|
| `convex/actions/summarizeSession.ts` | ~10 lines | Import, instantiate, `.profile()` → `.getProfile()`, `.add()` → `.addMemory()` |
| `convex/actions/analyzeReport.ts` | ~15 lines | Same + replace `fetch()` file upload with `.addDocument()` or just reuse analysis text |
| `convex/actions/generateSharedContext.ts` | ~8 lines | Import, instantiate, `.profile()` → `.getProfile()` |
| `convex/actions/generateWellnessPlan.ts` | ~8 lines | Same |
| `convex/actions/checkDrugInteractions.ts` | ~8 lines | Same |

### Before → After per file:

```typescript
// ─── BEFORE (Supermemory) ───────────────────────────────────────
import Supermemory from "supermemory";
const supermemory = new Supermemory({ apiKey: process.env.SUPERMEMORY_API_KEY! });

const profileResult = await supermemory.profile({
  containerTag: args.patientClerkId,
  q: searchQuery,
});

const memResult = await supermemory.add({
  content: summaryText,
  containerTags: [args.patientClerkId],
  customId: `session_${sessionId}`,
});

// ─── AFTER (Self-Built) ─────────────────────────────────────────
import { MemoryService } from "../../lib/memory";
const memory = new MemoryService({
  databaseUrl: process.env.MEMORY_DATABASE_URL!,
  embeddingApiKey: process.env.OPENAI_API_KEY!,
  llmApiKey: process.env.GOOGLE_GEMINI_API_KEY!,
});

const profileResult = await memory.getProfile({
  patientId: args.patientClerkId,
  q: searchQuery,
});

const memResult = await memory.addMemory({
  content: summaryText,
  patientId: args.patientClerkId,
  customId: `session_${sessionId}`,
  sourceType: "session",
});
```

**The destructuring of `profileResult` in each action remains 100% unchanged.**

---

## Performance Considerations

### Latency Budget

| Operation | Supermemory (current) | Self-Built Target |
|-----------|----------------------|-------------------|
| `getProfile()` (no query) | ~200-400ms (network) | ~10-30ms (DB query) |
| `getProfile()` (with query) | ~300-600ms (network + search) | ~50-150ms (embed + ANN search) |
| `addMemory()` (full pipeline) | ~500-1000ms | ~200-500ms (embed + store + extract) |
| `addDocument()` (file) | ~1-3s | ~500ms-2s (depends on OCR) |

### Optimization Techniques

1. **Batch embed calls** — embed all chunks in a single API call instead of one-by-one
2. **Async fact extraction** — don't block `addMemory()` on fact extraction; schedule it as a Convex background job
3. **Profile caching** — cache `getProfile()` results in memory (invalidate when new memories added)
4. **Connection pooling** — reuse Postgres connections across Convex action invocations
5. **Embedding cache** — hash content, cache embedding vectors, skip re-embedding identical text
6. **HNSW index tuning** — adjust `m` and `ef_construction` parameters based on dataset size

### Scaling Thresholds

| Metric | pgvector (single Postgres) | Qdrant (dedicated) | Pinecone (managed) |
|--------|---------------------------|---------------------|---------------------|
| Total vectors | < 5M | < 100M | Unlimited |
| Queries/sec | ~100-500 | ~1000-5000 | ~1000+ |
| Index build time | Grows with data | Fast rebuilds | Managed |
| Storage | ~1GB per 1M vectors (1536d) | Similar | Managed |

For a medical app with ~1000 patients, each having ~50 sessions and ~20 reports, you're looking at roughly:
- 1000 patients × 70 documents × 5 chunks = **350,000 vectors**
- Well within pgvector's comfort zone

---

## Security & Compliance (HIPAA)

### Data at Rest

```
┌─────────────────────────────────────────────┐
│ Encryption at Rest                          │
│                                             │
│ Postgres:                                   │
│   - Enable TDE (Transparent Data Encrypt.)  │
│   - Or use encrypted EBS volume (AWS)       │
│   - Supabase: encrypted by default          │
│                                             │
│ Vectors contain MEDICAL CONTENT:            │
│   - chunk content is stored in metadata     │
│   - treat vector DB as PHI storage          │
│   - same encryption requirements as app DB  │
└─────────────────────────────────────────────┘
```

### Data in Transit
- All DB connections via TLS/SSL
- Internal service communication over HTTPS
- Embedding API calls (OpenAI/Google) go over HTTPS

### Access Control
```typescript
// CRITICAL: Every vector store query MUST filter by patientId
// Never allow cross-patient memory access

search({ vector, patientId }) {
  // ✅ ALWAYS filter by patientId
  WHERE patient_id = $patientId

  // ❌ NEVER allow unfiltered search
  // WHERE 1=1  ← SECURITY VULNERABILITY
}
```

### Audit Trail
```sql
CREATE TABLE memory_audit_log (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action      TEXT NOT NULL,    -- 'read', 'write', 'delete'
    patient_id  TEXT NOT NULL,
    actor_id    TEXT NOT NULL,    -- who performed the action
    details     JSONB,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### Data Deletion (Right to Erasure)
```typescript
// Must support complete patient data deletion
async deletePatientMemories(patientId: string): Promise<void> {
  // 1. Delete all vectors for this patient
  await this.vectorStore.deleteByPatientId(patientId);

  // 2. Delete all memory documents
  await this.db.deleteMemoryDocumentsByPatient(patientId);

  // 3. Delete all extracted facts
  await this.profileManager.deleteAllFacts(patientId);

  // 4. Log deletion for audit
  await this.auditLog.log('delete_all', patientId, 'system');
}
```

---

## Cost Analysis

### Per-Patient Monthly Cost (Estimated)

Assuming an active patient has ~5 sessions/month + ~3 reports/month:

| Component | Supermemory | Self-Built (Production) |
|-----------|------------|------------------------|
| Memory reads (profile()) | ~40 calls × $? | ~40 embeds × $0.000002 = **$0.00008** |
| Memory writes (add()) | ~8 calls × $? | ~8 docs × 5 chunks × $0.000002 = **$0.00008** |
| Fact extraction LLM | Included | ~8 calls × ~500 tokens × $0.0000075 = **$0.00003** |
| Vector storage | Included | ~40 vectors × negligible = **~$0** |
| DB hosting | N/A | Amortized = **~$0.03** |
| **Total per patient/month** | **?? (opaque pricing)** | **~$0.03** |

### Fixed Monthly Costs

| Component | Minimal | Production | Enterprise |
|-----------|---------|------------|------------|
| Postgres + pgvector | $0 (Neon free) | $25 (Supabase) | $100+ (self-hosted) |
| Embedding model | $0 (Ollama local) | ~$5 (OpenAI) | $0 (self-hosted) |
| Fact extraction LLM | Existing Gemini | Existing Gemini | $50+ (self-hosted) |
| **Total/month** | **$0** | **~$30** | **~$150+** |

---

## Appendix: Full Schema SQL

Complete ready-to-run SQL for Postgres + pgvector:

```sql
-- ============================================================
-- Medicare AI — Self-Built Memory Layer
-- Database: Postgres 15+ with pgvector extension
-- ============================================================

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Patient Facts (replaces Supermemory profile.static/dynamic)
CREATE TABLE patient_facts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id      TEXT NOT NULL,
    fact_type       TEXT NOT NULL CHECK (fact_type IN ('static', 'dynamic')),
    content         TEXT NOT NULL,
    source_id       TEXT,
    source_type     TEXT CHECK (source_type IN ('session', 'report', 'report_file', 'manual')),
    confidence      REAL DEFAULT 1.0,
    superseded_by   UUID REFERENCES patient_facts(id),
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pf_patient_active ON patient_facts(patient_id, fact_type) WHERE is_active = TRUE;
CREATE INDEX idx_pf_source ON patient_facts(source_id);

-- 3. Memory Documents (replaces Supermemory document storage)
CREATE TABLE memory_documents (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    custom_id       TEXT UNIQUE NOT NULL,
    patient_id      TEXT NOT NULL,
    source_type     TEXT NOT NULL CHECK (source_type IN ('session', 'report', 'report_file')),
    content         TEXT NOT NULL,
    chunk_count     INT DEFAULT 0,
    facts_extracted BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_md_patient ON memory_documents(patient_id);
CREATE INDEX idx_md_custom ON memory_documents(custom_id);

-- 4. Memory Chunks with Vectors (replaces Supermemory search)
CREATE TABLE memory_chunks (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id     UUID NOT NULL REFERENCES memory_documents(id) ON DELETE CASCADE,
    patient_id      TEXT NOT NULL,
    chunk_index     INT NOT NULL,
    content         TEXT NOT NULL,
    token_count     INT,
    embedding       vector(1536) NOT NULL,    -- adjust for your model
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (document_id, chunk_index)
);

-- HNSW index for approximate nearest neighbor search
CREATE INDEX idx_mc_embedding ON memory_chunks
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

CREATE INDEX idx_mc_patient ON memory_chunks(patient_id);
CREATE INDEX idx_mc_document ON memory_chunks(document_id);

-- 5. Extraction Jobs (async fact extraction tracking)
CREATE TABLE extraction_jobs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id     UUID NOT NULL REFERENCES memory_documents(id) ON DELETE CASCADE,
    patient_id      TEXT NOT NULL,
    status          TEXT DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed')),
    error_message   TEXT,
    facts_added     INT DEFAULT 0,
    facts_updated   INT DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    completed_at    TIMESTAMPTZ
);

CREATE INDEX idx_ej_status ON extraction_jobs(status) WHERE status = 'pending';

-- 6. Audit Log (HIPAA compliance)
CREATE TABLE memory_audit_log (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action          TEXT NOT NULL CHECK (action IN ('read','write','delete','extract')),
    patient_id      TEXT NOT NULL,
    actor_id        TEXT NOT NULL,
    document_id     UUID,
    details         JSONB,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_mal_patient ON memory_audit_log(patient_id);
CREATE INDEX idx_mal_created ON memory_audit_log(created_at);

-- 7. Semantic search function
CREATE OR REPLACE FUNCTION search_patient_memories(
    query_embedding vector(1536),
    p_patient_id    TEXT,
    p_top_k         INT DEFAULT 10,
    p_min_score     REAL DEFAULT 0.65
)
RETURNS TABLE (
    chunk_id    UUID,
    content     TEXT,
    score       REAL,
    source_type TEXT,
    source_id   TEXT,
    created_at  TIMESTAMPTZ
)
LANGUAGE SQL STABLE
AS $$
    SELECT
        mc.id AS chunk_id,
        mc.content,
        (1 - (mc.embedding <=> query_embedding))::REAL AS score,
        md.source_type,
        md.custom_id AS source_id,
        mc.created_at
    FROM memory_chunks mc
    JOIN memory_documents md ON mc.document_id = md.id
    WHERE mc.patient_id = p_patient_id
      AND (1 - (mc.embedding <=> query_embedding)) >= p_min_score
    ORDER BY mc.embedding <=> query_embedding
    LIMIT p_top_k;
$$;

-- 8. Patient profile function
CREATE OR REPLACE FUNCTION get_patient_profile(p_patient_id TEXT)
RETURNS TABLE (
    fact_type TEXT,
    facts     TEXT[]
)
LANGUAGE SQL STABLE
AS $$
    SELECT
        pf.fact_type,
        array_agg(pf.content ORDER BY pf.created_at) AS facts
    FROM patient_facts pf
    WHERE pf.patient_id = p_patient_id
      AND pf.is_active = TRUE
    GROUP BY pf.fact_type;
$$;
```

---

## Summary

Building your own memory layer replaces a single third-party dependency (Supermemory) with five self-managed components:

| # | Component | Replaces | Complexity |
|---|-----------|----------|-----------|
| 1 | Vector Store + Embeddings | `searchResults` from `profile()` | Medium |
| 2 | Knowledge Extractor | `profile.static` + `profile.dynamic` auto-extraction | Medium |
| 3 | Patient Profile Manager | `profile()` aggregation | Low |
| 4 | Memory CRUD | `add()` call | Low |
| 5 | Document Ingestion | File upload endpoint | Low (reuse Gemini) |

**Total estimated effort:** 8-13 days for a single developer.

**Recommended starting stack:** Postgres + pgvector + OpenAI `text-embedding-3-small` + Gemini (existing) for fact extraction. This gives you a production-ready system with a single database, no new vendor dependencies, full data control, and costs under $30/month.
