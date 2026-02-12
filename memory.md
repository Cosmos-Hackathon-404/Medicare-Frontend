# Memory Layer — Medicare AI

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Supermemory — The Semantic Memory Engine](#supermemory--the-semantic-memory-engine)
  - [What is Supermemory?](#what-is-supermemory)
  - [Container Model](#container-model)
  - [Read Path — `supermemory.profile()`](#read-path--supermemoryprofile)
  - [Write Path — `supermemory.add()` & File Upload](#write-path--supermemoryadd--file-upload)
- [Convex — The Structured Data Layer](#convex--the-structured-data-layer)
  - [Key Tables Involved in Memory](#key-tables-involved-in-memory)
  - [Linking Supermemory to Convex Records](#linking-supermemory-to-convex-records)
- [Data Flows](#data-flows)
  - [1. Session Recording → Memory](#1-session-recording--memory)
  - [2. Report Upload → Memory](#2-report-upload--memory)
  - [3. Shared Context (Doctor-to-Doctor Transfer)](#3-shared-context-doctor-to-doctor-transfer)
  - [4. Wellness Plan Generation](#4-wellness-plan-generation)
  - [5. Drug Interaction Checking](#5-drug-interaction-checking)
  - [6. AI Chat](#6-ai-chat)
- [Prompt Engineering & Context Injection](#prompt-engineering--context-injection)
- [TypeScript Types](#typescript-types)
- [File Reference Map](#file-reference-map)
- [Diagrams](#diagrams)

---

## Overview

Medicare AI uses a **dual-storage memory architecture** to give its AI features deep, longitudinal understanding of each patient:

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Structured Data** | Convex (real-time DB) | Sessions, reports, vitals, appointments, alerts — queryable, relational, real-time |
| **Semantic Memory** | Supermemory | Auto-extracted knowledge graph, patient profiles, semantic search across all medical history |

Every AI operation in the app (session summaries, report analysis, wellness plans, drug checks, context sharing) follows the same pattern:

```
1. READ from Supermemory → get patient's full medical memory
2. COMBINE with Convex structured data → build rich context
3. SEND to Google Gemini → AI generates output
4. WRITE results to Convex → store structured output
5. WRITE results to Supermemory → enrich patient's memory for future operations
```

This creates a **compounding intelligence loop** — every interaction makes future AI outputs more accurate and personalized.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                        │
│                                                                  │
│   Patient Pages              Doctor Pages                        │
│   ┌──────────┐              ┌──────────────┐                     │
│   │ Sessions │              │ Session      │                     │
│   │ Reports  │              │ Recorder     │                     │
│   │ Share    │              │ Patient View │                     │
│   │ Wellness │              │ Shared Ctx   │                     │
│   │ AI Chat  │              │ Drug Check   │                     │
│   └────┬─────┘              └──────┬───────┘                     │
│        │                           │                             │
├────────┴───────────────────────────┴─────────────────────────────┤
│                        Convex Backend                            │
│                                                                  │
│   Queries              Mutations           Actions (Node.js)     │
│   ┌──────┐            ┌──────────┐        ┌──────────────────┐   │
│   │sessions│          │sessions  │        │summarizeSession  │   │
│   │reports │          │reports   │        │analyzeReport     │   │
│   │shared  │          │shared    │        │generateShared    │   │
│   │Context │          │Contexts  │        │Context           │   │
│   │vitals  │          │vitals    │        │generateWellness  │   │
│   │wellness│          │wellness  │        │Plan              │   │
│   │Plans   │          │Plans     │        │checkDrugInter.   │   │
│   └──┬─────┘          └────┬─────┘        │aiChat            │   │
│      │                     │              └──┬───────────────┘   │
│      │        Convex DB    │                 │                   │
│      └─────► ┌───────┐ ◄──┘                 │                   │
│              │Tables │                       │                   │
│              └───────┘                       │                   │
├──────────────────────────────────────────────┼───────────────────┤
│                                              │                   │
│              ┌───────────────────┐    ┌──────┴──────┐            │
│              │   Supermemory     │    │ Google      │            │
│              │   (Memory Layer)  │◄──►│ Gemini AI   │            │
│              │                   │    └─────────────┘            │
│              │  Patient Container│                               │
│              │  ┌─────────────┐  │                               │
│              │  │Static Facts │  │                               │
│              │  │Dynamic Ctx  │  │                               │
│              │  │Memories     │  │                               │
│              │  └─────────────┘  │                               │
│              └───────────────────┘                               │
└──────────────────────────────────────────────────────────────────┘
```

---

## Supermemory — The Semantic Memory Engine

### What is Supermemory?

[Supermemory](https://supermemory.ai) is an external semantic memory service. It ingests unstructured text and files, automatically extracts knowledge (facts, relationships, events), and builds a queryable profile per entity. The app uses it to maintain a **living medical knowledge graph** for each patient.

### Container Model

Each patient gets their own isolated **container** in Supermemory, identified by their Clerk user ID:

```typescript
containerTag: patientClerkId   // e.g., "user_2abc123..."
```

All medical data (session summaries, report analyses, raw files) is stored under this container. This ensures:
- **Isolation** — one patient's data never leaks into another's
- **Accumulation** — every interaction adds to the patient's memory
- **Retrievability** — any AI feature can query the patient's full history

### Read Path — `supermemory.profile()`

Before any AI operation, the app calls `supermemory.profile()` to retrieve the patient's accumulated medical knowledge:

```typescript
const profileResult = await supermemory.profile({
  containerTag: patientClerkId,
  q: "optional semantic search query",   // targets specific memories
});
```

This returns three layers of knowledge:

| Layer | Field | Description |
|-------|-------|-------------|
| **Static Facts** | `profile.static` | Permanent facts extracted over time (e.g., "Patient has Type 2 Diabetes", "Allergic to penicillin") |
| **Dynamic Context** | `profile.dynamic` | Recent/changing information (e.g., "Currently on Metformin 500mg", "Last BP reading: 140/90") |
| **Search Results** | `searchResults.results[].memory` | Semantically relevant memories matching the `q` parameter |

The `q` (query) parameter is tailored per use case:

| Action | Query (`q`) | Purpose |
|--------|-------------|---------|
| `summarizeSession` | The full transcript text | Find memories relevant to what was discussed |
| `generateWellnessPlan` | `"complete medical history, diagnoses, medications, lifestyle, diet, exercise, conditions, allergies"` | Pull everything for comprehensive planning |
| `checkDrugInteractions` | `"current medications prescriptions drugs"` | Target medication history specifically |
| `analyzeReport` | *(none)* | Get general profile facts only |
| `generateSharedContext` | *(none)* | Get full profile for transfer summary |

### Write Path — `supermemory.add()` & File Upload

After AI processing, results are written back to Supermemory in two ways:

#### 1. Text Memory — `supermemory.add()`

Used by `summarizeSession` and `analyzeReport`:

```typescript
const memoryResponse = await supermemory.add({
  content: formattedText,                    // structured summary text
  containerTags: [args.patientClerkId],      // patient container
  customId: `session_${sessionId}`,          // deduplication key
});
```

**Session memory content format:**
```
Medical Session Summary - {date}
Summary: {aiSummary}
Diagnosis: {diagnosis}
Prescriptions: {prescriptions}
Key Decisions: {keyDecisions}
Follow-up Actions: {followUpActions}
Comparison with Previous: {comparison}
```

**Report memory content format:**
```
Medical Report Analysis
Summary: {plainLanguageSummary}
Critical Findings: {criticalFlags}
Recommendations: {recommendations}
Pre-diagnosis Insights: {preDiagnosisInsights}
```

#### 2. Raw File Upload — Direct API

Used by `analyzeReport` for OCR extraction of PDF/image reports:

```typescript
const formData = new FormData();
formData.append("file", blob, fileName);
formData.append("containerTags", JSON.stringify([patientClerkId]));
formData.append("customId", `report_file_${reportId}`);

await fetch("https://api.supermemory.ai/v3/documents/file", {
  method: "POST",
  headers: { Authorization: `Bearer ${SUPERMEMORY_API_KEY}` },
  body: formData,
});
```

This allows Supermemory to extract and index text directly from medical documents (lab results, prescriptions, etc.) via its own OCR/parsing pipeline.

---

## Convex — The Structured Data Layer

### Key Tables Involved in Memory

| Table | Memory Role | Key Fields |
|-------|-------------|------------|
| `sessions` | Stores transcripts, AI summaries, prescriptions | `transcript`, `aiSummary`, `keyDecisions`, `prescriptions`, `supermemoryDocId` |
| `reports` | Stores file references, AI analysis, critical flags | `aiSummary`, `criticalFlags`, `recommendations`, `preDiagnosisInsights`, `supermemoryDocId` |
| `sharedContexts` | Doctor-to-doctor patient context transfers | `sessionIds`, `reportIds`, `aiConsolidatedSummary`, `status` |
| `vitals` | Patient-recorded health metrics | `type`, `value`, `unit`, `source` |
| `criticalAlerts` | AI-generated alerts from reports/sessions | `type`, `severity`, `status` |
| `wellnessPlans` | AI-generated personalized health plans | `nutrition`, `exercise`, `lifestyle`, `mentalWellness`, `dataSources` |
| `aiChatMessages` | Conversation history with AI | `role`, `content`, `conversationId` |
| `patientProfiles` | Static patient demographics | `age`, `bloodGroup`, `allergies` |

### Linking Supermemory to Convex Records

Both `sessions` and `reports` have a `supermemoryDocId` field that links the Convex record to its corresponding Supermemory document:

```typescript
// In sessions table
supermemoryDocId: v.optional(v.string()),  // Supermemory document ID

// In reports table
supermemoryDocId: v.optional(v.string()),  // Supermemory document ID
```

This creates a bidirectional link:
- **Convex → Supermemory**: The `supermemoryDocId` on each record points to the Supermemory document
- **Supermemory → Convex**: The `customId` format (`session_{id}`, `report_{id}`, `report_file_{id}`) maps back to Convex record IDs

---

## Data Flows

### 1. Session Recording → Memory

**Trigger:** Doctor records a session (audio) during/after an appointment.

**File:** `convex/actions/summarizeSession.ts`

```
Doctor Records Audio
        │
        ▼
Audio uploaded to Convex Storage
        │
        ▼
Gemini transcribes audio → transcript
        │
        ▼
Supermemory.profile(patientClerkId, q=transcript)
  → Returns: staticFacts, dynamicContext, relevantMemories
        │
        ▼
Build patientContextStr from memory
        │
        ▼
Gemini generates structured summary
  (SESSION_SUMMARY_PROMPT + patientContext + transcript)
  → Returns: chief_complaint, diagnosis, prescriptions,
             follow_up_actions, key_decisions, comparison_with_previous
        │
        ├──► Convex: Update session record with aiSummary, prescriptions, keyDecisions
        │
        └──► Supermemory.add(summary, containerTag=patientClerkId, customId=session_{id})
             → supermemoryDocId saved back to session record
```

**Key detail:** The transcript is used as the Supermemory search query (`q`), so the retrieved memories are semantically relevant to what was discussed in the session. This enables the `comparison_with_previous` field in the AI output.

### 2. Report Upload → Memory

**Trigger:** Patient uploads a medical report (PDF or image).

**File:** `convex/actions/analyzeReport.ts`

```
Patient Uploads Report (PDF/Image)
        │
        ▼
Files stored in Convex Storage
        │
        ▼
Supermemory.profile(patientClerkId)
  → Returns: staticFacts, dynamicContext (no search query)
        │
        ▼
Build patientContextStr from memory
        │
        ▼
Gemini multimodal analysis
  (REPORT_ANALYSIS_PROMPT + patientContext + image/PDF pages)
  → Returns: plain_language_summary, critical_flags[],
             recommendations[], pre_diagnosis_insights
        │
        ├──► Convex: Update report with aiSummary, criticalFlags, recommendations
        │
        ├──► Supermemory.add(analysis text, containerTag=patientClerkId)
        │
        ├──► Supermemory file upload (raw PDF/image for OCR extraction)
        │    → POST to api.supermemory.ai/v3/documents/file
        │
        └──► If critical flags with severity="high":
             → Auto-create CriticalAlert records for assigned doctors
```

**Key detail:** Reports trigger TWO Supermemory writes — the AI analysis summary AND the raw file for independent OCR extraction. This ensures Supermemory has both the AI interpretation and the original data.

### 3. Shared Context (Doctor-to-Doctor Transfer)

**Trigger:** Patient shares their medical history with a new doctor.

**Files:** 
- `app/patient/share/page.tsx` — Patient UI
- `convex/mutations/sharedContexts.ts` — Database operations
- `convex/actions/generateSharedContext.ts` — AI generation
- `app/doctor/shared-context/page.tsx` — Doctor inbox UI

```
Patient selects sessions + reports + target doctor
        │
        ▼
createAndGenerate mutation:
  → Insert sharedContexts record (status: "pending", processingStatus: "processing")
  → Schedule background action via ctx.scheduler.runAfter(0, ...)
        │
        ▼
generateSharedContext action:
  Supermemory.profile(patientClerkId)
    → Returns: staticFacts, dynamicContext, ALL searchResults
        │
        ▼
  Gemini generates consolidated transfer summary
    (SHARE_CONTEXT_PROMPT + staticFacts + dynamicContext + memories)
    → Returns: patient_overview, chronological_summary,
               active_conditions[], current_medications[],
               allergies[], critical_alerts[], recommended_follow_ups[]
        │
        ▼
  Convex: Update sharedContexts with aiConsolidatedSummary
  Set processingStatus: "completed"
        │
        ▼
Target doctor sees it in real-time inbox
  → Doctor views AI Summary + linked Sessions + linked Reports
  → Status changes to "viewed" on open
```

**Key detail:** The patient's UI defaults to sharing ALL sessions and reports (opt-out model, not opt-in). The AI summary is generated from Supermemory's accumulated knowledge — not just from the selected items — giving the receiving doctor the most complete picture possible.

### 4. Wellness Plan Generation

**Trigger:** Patient requests an AI-generated wellness plan.

**File:** `convex/actions/generateWellnessPlan.ts`

```
Patient requests wellness plan
        │
        ▼
Gather ALL data from Convex:
  → Patient profile (age, blood group, allergies)
  → All vitals records
  → All report summaries + critical flags
  → All session summaries + prescriptions
  → Active critical alerts
        │
        ▼
Supermemory.profile(patientClerkId,
  q="complete medical history, diagnoses, medications,
     lifestyle, diet, exercise, conditions, allergies")
  → Returns comprehensive patient memory
        │
        ▼
Build combined context:
  memoryContextStr = "Known Facts: {...}\nRecent Context: {...}\nRelevant Memories: {...}"
        │
        ▼
Gemini generates personalized wellness plan
  (WELLNESS_PLAN_PROMPT + patientProfile + memoryContext
   + vitalsData + reportsSummary + sessionsData + criticalAlerts)
  → Returns: nutrition{meals, macros, supplements...},
             exercise{routines...}, lifestyle{sleep, stress...},
             mentalWellness{...}, additionalNotes, reviewDate
        │
        ▼
Convex: Store wellness plan with dataSources tracking
```

**Key detail:** This is the most data-intensive memory read. It combines Convex structured data (vitals, reports, sessions, alerts) with Supermemory's semantic profile, using an exhaustive query string to pull maximum context. The plan is personalized to the patient's specific conditions, medications, and allergies.

### 5. Drug Interaction Checking

**Trigger:** Doctor reviews new prescriptions from a session.

**File:** `convex/actions/checkDrugInteractions.ts`

```
Doctor triggers drug interaction check
  (new prescriptions from session)
        │
        ▼
Supermemory.profile(patientClerkId,
  q="current medications prescriptions drugs")
  → Returns: medication history from all past sessions/reports
        │
        ▼
Gemini checks for:
  → Drug-drug interactions
  → Drug-allergy conflicts
  → Contraindications
  → Dosage concerns
        │
        ▼
Returns: DrugAlert[] with type, severity, medication, message, details
```

**Key detail:** This is a **read-only** memory operation — it queries Supermemory for the patient's medication history but doesn't write anything back. The targeted query `"current medications prescriptions drugs"` ensures only medication-relevant memories are retrieved.

### 6. AI Chat

**Trigger:** Patient or doctor uses the AI chat assistant.

**File:** `convex/actions/aiChat.ts`

```
User sends message in AI chat
        │
        ▼
Load from Convex only:
  → Patient profile
  → Selected reports (if any)
  → Chat history
        │
        ▼
Gemini generates response
  (NO Supermemory integration)
        │
        ▼
Store message in aiChatMessages
```

**Key detail:** The AI chat is the only AI feature that does **NOT** use Supermemory. It relies exclusively on Convex data. A `useMemory` toggle exists to control whether patient/report context from Convex is included in the prompt.

---

## Prompt Engineering & Context Injection

All AI prompts follow a consistent template pattern using `fillPrompt()`:

```typescript
// lib/prompts.ts
export function fillPrompt(
  template: string,
  variables: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replaceAll(`{${key}}`, value);
  }
  return result;
}
```

### Prompt Templates and Their Memory Inputs

| Prompt | Template Variable | Memory Source | Purpose |
|--------|-------------------|---------------|---------|
| `SESSION_SUMMARY_PROMPT` | `{patientContext}` | Supermemory profile | Compare with previous visits, contextualize diagnosis |
| `SESSION_SUMMARY_PROMPT` | `{transcript}` | Gemini transcription | The raw conversation to summarize |
| `REPORT_ANALYSIS_PROMPT` | `{patientContext}` | Supermemory profile | Contextualize findings against patient history |
| `SHARE_CONTEXT_PROMPT` | `{staticFacts}` | Supermemory `profile.static` | Permanent patient facts |
| `SHARE_CONTEXT_PROMPT` | `{dynamicContext}` | Supermemory `profile.dynamic` | Recent/changing information |
| `SHARE_CONTEXT_PROMPT` | `{memories}` | Supermemory `searchResults` | All relevant memories |
| `WELLNESS_PLAN_PROMPT` | `{memoryContext}` | Supermemory profile (all 3 layers) | Full medical history |
| `WELLNESS_PLAN_PROMPT` | `{patientProfile}` | Convex `patientProfiles` | Demographics, allergies |
| `WELLNESS_PLAN_PROMPT` | `{vitalsData}` | Convex `vitals` | Recent health measurements |
| `WELLNESS_PLAN_PROMPT` | `{reportsSummary}` | Convex `reports` | AI summaries of all reports |
| `WELLNESS_PLAN_PROMPT` | `{sessionsData}` | Convex `sessions` | All session summaries |
| `WELLNESS_PLAN_PROMPT` | `{criticalAlerts}` | Convex `criticalAlerts` | Active health warnings |

---

## TypeScript Types

Key memory-related interfaces defined in `types/index.ts`:

```typescript
// Supermemory Patient Context (profile response)
interface PatientContext {
  staticFacts: string[];       // Permanent extracted facts
  dynamicContext: string[];    // Recent/changing information
  relevantMemories: string[];  // Semantic search results
}

// Session with memory link
interface Session {
  // ...standard fields...
  supermemoryDocId?: string;   // Links to Supermemory document
}

// Report with memory link
interface Report {
  // ...standard fields...
  supermemoryDocId?: string;   // Links to Supermemory document
}

// Shared Context (doctor-to-doctor transfer)
interface SharedContext {
  patientClerkId: string;
  fromDoctorClerkId: string;
  toDoctorClerkId: string;
  sessionIds: Id<"sessions">[];
  reportIds: Id<"reports">[];
  aiConsolidatedSummary?: string;  // AI-generated transfer summary
  status: "pending" | "viewed";
}

// AI Output: Shared Context Summary
interface SharedContextSummary {
  patientOverview: string;
  chronologicalSummary: string;
  activeConditions: string[];
  currentMedications: string[];
  allergies: string[];
  criticalAlerts: string[];
  recommendedFollowUps: string[];
}
```

---

## File Reference Map

### Convex Actions (AI + Memory Operations)

| File | Memory Operation | Supermemory Read | Supermemory Write |
|------|------------------|------------------|-------------------|
| `convex/actions/summarizeSession.ts` | Session → Memory | `profile(containerTag, q=transcript)` | `add()` summary text |
| `convex/actions/analyzeReport.ts` | Report → Memory | `profile(containerTag)` | `add()` analysis + file upload |
| `convex/actions/generateSharedContext.ts` | Memory → Transfer | `profile(containerTag)` | — |
| `convex/actions/generateWellnessPlan.ts` | Memory → Plan | `profile(containerTag, q=broad)` | — |
| `convex/actions/checkDrugInteractions.ts` | Memory → Safety | `profile(containerTag, q=meds)` | — |
| `convex/actions/aiChat.ts` | Convex only | — | — |

### Convex Mutations (Data Writes)

| File | Relevant Mutations |
|------|-------------------|
| `convex/mutations/sessions.ts` | `create`, `updateAISummary`, `updateSupermemoryDocId` |
| `convex/mutations/reports.ts` | `create`, `updateAnalysis`, `updateSupermemoryDocId` |
| `convex/mutations/sharedContexts.ts` | `create`, `createAndGenerate`, `updateSummary`, `markViewed` |
| `convex/mutations/wellnessPlans.ts` | `create`, `update` |
| `convex/mutations/criticalAlerts.ts` | `create` (auto-triggered from report analysis) |

### Convex Queries (Data Reads)

| File | Relevant Queries |
|------|-----------------|
| `convex/queries/sessions.ts` | `getByPatient`, `getByDoctor`, `getByIds` |
| `convex/queries/reports.ts` | `getByPatient`, `getByDoctor`, `getByIds` |
| `convex/queries/sharedContexts.ts` | `getForDoctor`, `getByPatient` |
| `convex/queries/wellnessPlans.ts` | `getByPatient` |
| `convex/queries/vitals.ts` | `getByPatient` |

### Frontend Pages

| File | Memory Feature |
|------|---------------|
| `app/patient/share/page.tsx` | Share context UI — select sessions/reports, pick doctor |
| `app/doctor/shared-context/page.tsx` | Shared context inbox — view AI summary, sessions, reports |
| `app/doctor/session/` | Session recording + AI summary display |
| `app/patient/reports/` | Report upload + AI analysis display |
| `app/patient/wellness/` | Wellness plan display |
| `app/doctor/patient/` | Doctor's view of patient history |

### Prompts

| File | Templates |
|------|-----------|
| `lib/prompts.ts` | `SESSION_SUMMARY_PROMPT`, `REPORT_ANALYSIS_PROMPT`, `SHARE_CONTEXT_PROMPT`, `WELLNESS_PLAN_PROMPT`, `fillPrompt()` |

---

## Diagrams

### Memory Write Cycle

```
       ┌─────────────┐        ┌─────────────┐
       │   Session    │        │   Report     │
       │  Recording   │        │   Upload     │
       └──────┬───────┘        └──────┬───────┘
              │                       │
              ▼                       ▼
       ┌──────────────┐        ┌──────────────┐
       │  Gemini AI   │        │  Gemini AI   │
       │  Summarize   │        │  Analyze     │
       └──────┬───────┘        └──────┬───────┘
              │                       │
              ├────────┐    ┌─────────┤
              ▼        ▼    ▼         ▼
       ┌──────────┐  ┌────────────┐  ┌──────────────┐
       │ Convex   │  │ Supermemory│  │ Supermemory  │
       │ Record   │  │ .add()    │  │ File Upload  │
       │ Update   │  │ (text)    │  │ (OCR/raw)    │
       └──────────┘  └────────────┘  └──────────────┘
```

### Memory Read Cycle

```
  ┌──────────────────────────────────────────────────────┐
  │              AI Feature Triggered                     │
  │  (Session / Report / Wellness / Drug Check / Share)   │
  └───────────────────────┬──────────────────────────────┘
                          │
            ┌─────────────┴─────────────┐
            ▼                           ▼
    ┌───────────────┐          ┌─────────────────┐
    │  Supermemory  │          │  Convex Queries  │
    │  .profile()   │          │  (structured)    │
    │               │          │                  │
    │  static facts │          │  vitals          │
    │  dynamic ctx  │          │  reports         │
    │  memories     │          │  sessions        │
    └───────┬───────┘          │  alerts          │
            │                  │  profile         │
            │                  └────────┬─────────┘
            │                           │
            └─────────┬─────────────────┘
                      ▼
              ┌───────────────┐
              │  Prompt       │
              │  Construction │
              │  fillPrompt() │
              └───────┬───────┘
                      ▼
              ┌───────────────┐
              │  Google       │
              │  Gemini       │
              │  Generation   │
              └───────────────┘
```

### Compounding Intelligence Loop

```
  Session 1 ──► Memory Written ──► Session 2 has more context
                                        │
                                        ▼
  Report A  ──► Memory Written ──► Session 3 knows about Report A
                                        │
                                        ▼
  Session 3 ──► Memory Written ──► Wellness Plan uses ALL history
                                        │
                                        ▼
  Report B  ──► Memory Written ──► Drug Check knows all medications
                                        │
                                        ▼
  Share to Dr. B ─────────────────► Dr. B gets complete patient picture
```

Each interaction enriches the patient's Supermemory container, making every subsequent AI operation more informed and personalized. This is the core value of the memory layer — **AI that gets smarter about each patient over time**.
