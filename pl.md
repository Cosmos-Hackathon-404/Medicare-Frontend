# Medicare AI — Hackathon Build Plan (36 Hours)

> **An Intelligent AI Layer Between Doctor and Patient**

---

## 🎯 Refined Idea

Medicare AI is a web application that acts as an **intelligent bridge** between doctors and patients. It uses AI to automate clinical documentation, summarize medical reports, provide pre-diagnosis insights, and maintain a persistent memory of every patient-doctor interaction — eliminating the need for patients to repeat their history every time they see a new doctor.

### Core Value Proposition

| Problem | Solution |
|---|---|
| Doctors spend ~40% of time on documentation | AI auto-generates session summaries from recordings |
| Patients repeat history to every new doctor | Shareable AI-powered medical context (one-click share via Supermemory) |
| Medical reports are dense and hard to parse | Gemini 3 Flash analyzes images/PDFs and highlights critical findings |
| No continuity between visits | Supermemory maintains persistent patient memory across all sessions |

---

## 👥 User Roles & Flows

### Doctor Flow
1. **Sign up / Login** via Clerk (name, specialization, license #) — role stored in Clerk metadata
2. **Dashboard** — overview of today's appointments, recent sessions, pending reports
3. **Appointment Queue** — list of patients with upcoming appointments
4. **Session View** — start audio recording of diagnosis session → AI generates summary on stop
5. **Patient Reports** — view uploaded reports with AI summary + critical issue highlights (flagged in red)
6. **Patient History** — browse all previous sessions with a patient (AI summaries + key decisions, powered by Supermemory)
7. **Shared Context Inbox** — receive medical context shared by new patients from other doctors

### Patient Flow
1. **Sign up / Login** via Clerk (name, age, blood group, allergies, emergency contact)
2. **Dashboard** — upcoming appointments, recent AI summaries, health timeline
3. **Book Appointment** — search doctors by specialization, pick available slot
4. **Upload Reports** — upload medical reports (PDF/images) → get AI pre-diagnosis insights via Gemini 3 Flash
5. **Session History** — view all past sessions with AI-generated summaries
6. **Share Context** — select sessions/reports → Supermemory generates a shareable medical context package for a new doctor (one-click, no re-explanation needed)

---

## 🏗️ Architecture

### Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS v4, shadcn/ui (Nova) |
| Auth | Clerk (role-based: doctor/patient via publicMetadata, pre-built UI components) |
| Database | Convex (real-time, serverless, built-in file storage) |
| AI Model | Google Gemini `gemini-3-flash-preview` (text generation + image/PDF analysis) |
| AI Memory | Supermemory (persistent patient memory, semantic search, user profiles) |
| Audio | Browser MediaRecorder API → Gemini 3 Flash audio transcription |
| File Storage | Convex File Storage (for report PDFs/images, audio recordings) |
| Deployment | Vercel (frontend) + Convex Cloud (backend) |

### Why This Stack is Perfect for a 36h Hackathon

- **Clerk**: Zero auth code — pre-built `<SignIn/>`, `<SignUp/>` components, role management via metadata, middleware in 5 lines
- **Convex**: No SQL, no migrations, no ORM — define schema in TypeScript, get real-time subscriptions for free, built-in file storage
- **Supermemory**: No need to build memory/RAG from scratch — automatic knowledge extraction, semantic search, user profiles in one API call
- **Gemini 3 Flash Preview**: Multimodal (text + image + audio), fast, generous free tier

---

### Convex Schema

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Clerk handles auth — we store profile data here
  doctorProfiles: defineTable({
    clerkUserId: v.string(),
    name: v.string(),
    email: v.string(),
    specialization: v.string(),
    licenseNumber: v.string(),
    bio: v.optional(v.string()),
    availableSlots: v.optional(v.array(v.object({
      day: v.string(),       // "monday", "tuesday", etc.
      startTime: v.string(), // "09:00"
      endTime: v.string(),   // "17:00"
    }))),
  })
    .index("by_clerkUserId", ["clerkUserId"])
    .index("by_specialization", ["specialization"]),

  patientProfiles: defineTable({
    clerkUserId: v.string(),
    name: v.string(),
    email: v.string(),
    age: v.number(),
    bloodGroup: v.optional(v.string()),
    allergies: v.optional(v.string()),
    emergencyContact: v.optional(v.string()),
  })
    .index("by_clerkUserId", ["clerkUserId"]),

  appointments: defineTable({
    patientId: v.id("patientProfiles"),
    doctorId: v.id("doctorProfiles"),
    patientClerkId: v.string(),
    doctorClerkId: v.string(),
    dateTime: v.string(),     // ISO string
    status: v.string(),       // "scheduled" | "completed" | "cancelled"
    notes: v.optional(v.string()),
  })
    .index("by_doctorClerkId", ["doctorClerkId"])
    .index("by_patientClerkId", ["patientClerkId"])
    .index("by_status", ["status"]),

  sessions: defineTable({
    appointmentId: v.id("appointments"),
    patientClerkId: v.string(),
    doctorClerkId: v.string(),
    audioStorageId: v.optional(v.id("_storage")),
    transcript: v.optional(v.string()),
    aiSummary: v.optional(v.string()),
    keyDecisions: v.optional(v.array(v.string())),
    prescriptions: v.optional(v.string()),
    supermemoryDocId: v.optional(v.string()), // Supermemory document ID for this session
  })
    .index("by_appointmentId", ["appointmentId"])
    .index("by_patientClerkId", ["patientClerkId"])
    .index("by_doctorClerkId", ["doctorClerkId"]),

  reports: defineTable({
    patientClerkId: v.string(),
    doctorClerkId: v.optional(v.string()), // null if patient uploads before seeing doctor
    fileStorageId: v.id("_storage"),
    fileName: v.string(),
    fileType: v.string(),     // "pdf" | "image"
    aiSummary: v.optional(v.string()),
    criticalFlags: v.optional(v.array(v.object({
      issue: v.string(),
      severity: v.string(),   // "high" | "medium" | "low"
      details: v.string(),
    }))),
    supermemoryDocId: v.optional(v.string()),
  })
    .index("by_patientClerkId", ["patientClerkId"])
    .index("by_doctorClerkId", ["doctorClerkId"]),

  sharedContexts: defineTable({
    patientClerkId: v.string(),
    fromDoctorClerkId: v.string(),
    toDoctorClerkId: v.string(),
    sessionIds: v.array(v.id("sessions")),
    reportIds: v.array(v.id("reports")),
    aiConsolidatedSummary: v.optional(v.string()),
    status: v.string(),       // "pending" | "viewed"
  })
    .index("by_toDoctorClerkId", ["toDoctorClerkId"])
    .index("by_patientClerkId", ["patientClerkId"]),
});
```

---

### Supermemory Integration Strategy

**Data Model**: Individual patients — `containerTag: patientClerkId`

Each patient gets their own Supermemory container. All session summaries, report analyses, and doctor interactions are stored in that container. When any doctor needs context about a patient, Supermemory provides the full profile + relevant memories.

**Integration**: Direct SDK with User Profiles (Option A — one call with search)

```typescript
// lib/supermemory.ts
import Supermemory from "supermemory";

export const supermemory = new Supermemory();

// Configure settings (run once at app init)
export async function configureSupermemory() {
  await fetch("https://api.supermemory.ai/v3/settings", {
    method: "PATCH",
    headers: {
      "x-supermemory-api-key": process.env.SUPERMEMORY_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      shouldLLMFilter: true,
      filterPrompt: `This is Medicare AI, a medical platform connecting doctors and patients.
        containerTag is the patient's Clerk userId.
        We store: session summaries, medical report analyses, prescriptions, diagnoses,
        doctor visit history, critical health flags, and ongoing treatments.`,
    }),
  });
}

// Store a session summary in patient's memory
export async function storeSessionMemory(patientClerkId: string, content: string) {
  return await supermemory.add({
    content,
    containerTag: patientClerkId,
  });
}

// Store a report analysis in patient's memory
export async function storeReportMemory(patientClerkId: string, content: string) {
  return await supermemory.add({
    content,
    containerTag: patientClerkId,
  });
}

// Get patient profile + relevant memories for context-aware AI
export async function getPatientContext(patientClerkId: string, query?: string) {
  const { profile, searchResults } = await supermemory.profile({
    containerTag: patientClerkId,
    q: query, // searches memories relevant to the current query
  });

  return {
    staticFacts: profile.static,   // e.g., "Patient is 45, diabetic, allergic to penicillin"
    dynamicContext: profile.dynamic, // e.g., "Last visit was for chest pain on Feb 1"
    relevantMemories: searchResults?.results.map((r: any) => r.memory) ?? [],
  };
}

// Upload file directly to Supermemory for extraction
export async function uploadFileToMemory(patientClerkId: string, fileBlob: Blob) {
  const formData = new FormData();
  formData.append("file", fileBlob);
  formData.append("containerTag", patientClerkId);

  return await fetch("https://api.supermemory.ai/v3/documents/file", {
    method: "POST",
    headers: { "x-supermemory-api-key": process.env.SUPERMEMORY_API_KEY! },
    body: formData,
  });
}
```

**How Supermemory Powers Each Feature:**

| Feature | Supermemory Usage |
|---|---|
| Session Summary | After Gemini generates summary → `supermemory.add()` stores it in patient's container |
| Report Analysis | After Gemini analyzes report → stored as memory + file uploaded for OCR extraction |
| Patient History (Doctor View) | `supermemory.profile()` returns static facts + dynamic context about patient |
| AI Memory-Aware Summaries | Before generating any summary, fetch `profile()` → pass as context to Gemini |
| Share Context | `supermemory.profile({ containerTag: patientId })` → full patient profile sent to new doctor |
| Pre-Diagnosis | `supermemory.search()` finds relevant past conditions → enriches Gemini analysis |

---

## ⏱️ Realistic 36-Hour Schedule

> **Effective coding time: ~22 hours** (after ~6h sleep, ~4h meals, ~2h breaks, ~2h buffer for bugs/demos)

### Phase 1: Foundation (Hours 0–5) — ~4h coding

| Task | Time | Details |
|---|---|---|
| Convex setup + schema | 1h | `npx convex init`, define schema.ts, deploy |
| Clerk auth integration | 1h | Install `@clerk/nextjs`, add `<ClerkProvider>`, create sign-in/sign-up pages, set up middleware, configure roles in publicMetadata |
| Onboarding flow | 1h | After Clerk sign-up → role selection (doctor/patient) → profile form → save to Convex |
| Layout & navigation | 0.5h | Sidebar layout with role-based nav items using `useUser()` from Clerk |
| Landing page | 0.5h | Simple hero section with Clerk `<SignInButton>` / `<SignUpButton>` |

**Milestone: Users can register via Clerk, select role, fill profile, and see role-specific empty dashboards**

---

### Phase 2: Core Doctor Features (Hours 5–13) — ~6h coding

| Task | Time | Details |
|---|---|---|
| Doctor dashboard | 1h | Real-time appointment list via `useQuery()` from Convex, quick stats |
| Appointment list view | 1h | List of scheduled appointments with patient info (Convex real-time) |
| Session recording | 2h | MediaRecorder API → upload audio to Convex storage → send to Gemini 3 Flash for transcription |
| AI session summary | 1h | Fetch patient context from Supermemory → send transcript + context to Gemini → generate summary → store in Convex + Supermemory |
| Patient reports viewer | 1h | View uploaded reports with AI summary + critical flags highlighted |

**Milestone: Doctor can view appointments, record sessions, get AI summaries, view patient reports with AI insights**

---

### Phase 3: Core Patient Features (Hours 13–21) — ~6h coding

| Task | Time | Details |
|---|---|---|
| Patient dashboard | 1h | Upcoming appointments, recent summaries from Convex real-time queries |
| Book appointment | 1.5h | Doctor search by specialization (Convex query), slot selection, create appointment mutation |
| Upload reports | 1.5h | Upload to Convex storage → send to Gemini 3 Flash (image/PDF analysis) → AI summary + flags → store in Convex + Supermemory |
| Session history | 1h | Timeline view of past sessions, AI summaries pulled from Convex |
| Share context | 1h | Hit Supermemory `profile()` for patient → Gemini generates consolidated summary → create shared_context in Convex → target doctor gets it in real-time |

**Milestone: Patient can book appointments, upload reports with AI analysis, view session history, share context**

---

### Phase 4: AI Memory & Polish (Hours 21–29) — ~4h coding

| Task | Time | Details |
|---|---|---|
| Supermemory config + integration | 1h | Configure settings, wire up `storeSessionMemory()`, `storeReportMemory()`, `getPatientContext()` across all AI flows |
| Shared context inbox (doctor) | 1h | Doctor sees incoming shared contexts with Supermemory-powered consolidated summary (real-time via Convex) |
| UI/UX polish | 1h | Loading states, error handling, empty states, toast notifications |
| Critical flag highlighting | 1h | Red badges on critical report findings, severity indicators |

**Milestone: AI retains memory across sessions via Supermemory, doctors receive shared contexts, polished UI**

---

### Phase 5: Demo Prep (Hours 29–36) — ~2h coding, rest for prep

| Task | Time | Details |
|---|---|---|
| Seed demo data | 1h | Create demo Clerk accounts, sample reports, mock sessions with AI summaries in Convex |
| Bug fixes & edge cases | 1h | Final testing pass, fix breaking issues |
| Demo script | 1h | Write a 3-minute demo walkthrough script |
| Deploy | 0.5h | Vercel deploy (frontend) + Convex production deploy, env vars |
| Presentation prep | 1.5h | Slides (5 max), rehearse demo |
| Buffer | 2h | Unexpected issues, rest |

**Milestone: App is deployed, demo-ready, and presentation is rehearsed**

---

## 🔑 Key AI Features (Implementation Details)

### 1. Session Recording & Summary
```
Recording → Audio Blob → Convex Storage → Gemini 3 Flash (transcription) → 
Supermemory (fetch patient context) → Gemini 3 Flash (summary with context) →
Save to Convex + Supermemory
```

```typescript
// convex/actions/summarizeSession.ts (Convex action)
import { GoogleGenAI } from "@google/genai";
import Supermemory from "supermemory";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GEMINI_API_KEY });
const supermemory = new Supermemory({ apiKey: process.env.SUPERMEMORY_API_KEY });

// Step 1: Get patient's memory context
const { profile, searchResults } = await supermemory.profile({
  containerTag: patientClerkId,
  q: transcript, // search for relevant past context
});

// Step 2: Generate summary with memory context
const response = await ai.models.generateContent({
  model: "gemini-3-flash-preview",
  contents: `You are a medical AI assistant. Summarize this doctor-patient session.

PATIENT CONTEXT (from previous visits):
Static facts: ${profile.static.join("\n")}
Recent context: ${profile.dynamic.join("\n")}
Relevant memories: ${searchResults?.results.map((r) => r.memory).join("\n")}

CURRENT SESSION TRANSCRIPT:
${transcript}

Generate a structured JSON summary with:
- chief_complaint
- diagnosis
- prescriptions
- follow_up_actions
- key_decisions
- comparison_with_previous (if applicable)`,
});

// Step 3: Store in Supermemory for future context
await supermemory.add({
  content: `Session on ${new Date().toISOString()} with Dr. ${doctorName}:
    Summary: ${aiSummary}
    Prescriptions: ${prescriptions}
    Follow-up: ${followUp}`,
  containerTag: patientClerkId,
});
```

### 2. Report Analysis & Pre-Diagnosis (Gemini 3 Flash Vision)
```
Report Upload (PDF/Image) → Convex Storage → Gemini 3 Flash (multimodal analysis) →
Supermemory (store findings) → Display summary + critical flags
```

```typescript
// Gemini 3 Flash can directly analyze images/PDFs
const response = await ai.models.generateContent({
  model: "gemini-3-flash-preview",
  contents: [
    {
      role: "user",
      parts: [
        { text: `Analyze this medical report. Patient context:
          ${patientContext}
          
          Provide: plain_language_summary, critical_flags (array of {issue, severity, details}),
          recommendations, pre_diagnosis_insights` },
        { inlineData: { mimeType: fileType, data: base64FileData } },
      ],
    },
  ],
});
```

### 3. AI Memory Layer (Supermemory)
```
Any AI interaction → supermemory.profile(patientId, query) → context injected → 
Gemini generates memory-aware response → result stored back in Supermemory
```
- Supermemory automatically extracts and maintains facts about each patient
- `profile.static` = persistent facts: "Patient is 45, male, diabetic, allergic to penicillin"
- `profile.dynamic` = recent context: "Last visit was for recurring chest pain, prescribed beta blockers"
- No manual memory management needed — Supermemory handles knowledge extraction

### 4. Shareable Medical Context (Supermemory + Gemini)
```
Patient clicks "Share Context" → Supermemory profile(patientId) → 
Gemini consolidates into transfer summary → Saved to Convex shared_contexts →
New doctor gets real-time notification via Convex subscription
```

```typescript
// One-click share: Supermemory already has the full patient profile
const { profile, searchResults } = await supermemory.profile({
  containerTag: patientClerkId,
});

const consolidatedSummary = await ai.models.generateContent({
  model: "gemini-3-flash-preview",
  contents: `Create a comprehensive medical context transfer summary for a new doctor.

PATIENT PROFILE:
${profile.static.join("\n")}

RECENT HISTORY:
${profile.dynamic.join("\n")}

ALL RELEVANT RECORDS:
${searchResults?.results.map((r) => r.memory).join("\n\n")}

Format as: patient_overview, chronological_summary, active_conditions,
current_medications, allergies, critical_alerts, recommended_follow_ups`,
});
```

---

## 📄 Key Pages / Routes

```
/                              → Landing page
/sign-in                       → Clerk <SignIn /> component
/sign-up                       → Clerk <SignUp /> component
/onboarding                    → Role selection + profile form (post sign-up)

/doctor/dashboard              → Doctor dashboard (real-time via Convex)
/doctor/appointments           → Appointment list
/doctor/session/[appointmentId]→ Session view (recording + AI summary)
/doctor/patient/[patientId]    → Patient detail (history, reports, sessions via Supermemory)
/doctor/reports                → All patient reports with AI summaries
/doctor/shared-context         → Incoming shared contexts from patients

/patient/dashboard             → Patient dashboard
/patient/appointments          → My appointments + book new
/patient/book/[doctorId]       → Book appointment with specific doctor
/patient/reports               → My reports + upload new
/patient/sessions              → Session history with AI summaries
/patient/share                 → Share context with another doctor

/api/ai/summarize-session      → API route: transcription + summary
/api/ai/analyze-report         → API route: report analysis
/api/ai/share-context          → API route: generate consolidated context
```

---

## 🧩 MVP Scope (What to CUT if behind schedule)

### Must Have (P0) — Ship or fail
- [ ] Clerk auth with role-based login (doctor/patient)
- [ ] Convex schema + basic CRUD mutations/queries
- [ ] Doctor: View appointments, record session, get AI summary
- [ ] Patient: Book appointment, upload report with AI analysis
- [ ] Supermemory integration for patient memory
- [ ] Share context feature (simplified version)

### Should Have (P1) — Include if time permits
- [ ] Real audio transcription via Gemini (fallback: text input)
- [ ] Critical flag highlighting in reports with severity badges
- [ ] Doctor's shared context inbox (real-time via Convex)
- [ ] Polished dashboard with stats

### Nice to Have (P2) — Demo polish
- [ ] Real-time notifications (Convex subscriptions)
- [ ] Patient health timeline visualization
- [ ] PDF export of session summaries
- [ ] Doctor availability calendar

---

## 🏆 Hackathon Judging Differentiators

1. **Supermemory-Powered Patient Memory** — No other health app has persistent AI memory that automatically learns and retains patient facts across all interactions
2. **One-Click Context Share** — Supermemory profile generates instant medical context transfer, solving a real painful problem
3. **Gemini 3 Flash Multimodal** — Directly analyzes medical report images/PDFs without OCR pipeline
4. **Real-Time Everything** — Convex subscriptions mean doctors see new appointments, shared contexts, and reports instantly
5. **Production-Ready UX** — Clerk pre-built auth + shadcn/ui Nova theme = polished look with minimal effort

---

## ⚡ Quick Start Commands

```bash
# Install core deps
pnpm add convex @clerk/nextjs @google/genai supermemory

# Initialize Convex
pnpm convex init
pnpm convex deploy

# Set up environment variables (.env.local)
# NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
# NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
# CLERK_SECRET_KEY=sk_...
# GOOGLE_GEMINI_API_KEY=...
# SUPERMEMORY_API_KEY=sm_...

# Set Convex environment variables
pnpm convex env set GOOGLE_GEMINI_API_KEY "..."
pnpm convex env set SUPERMEMORY_API_KEY "sm_..."
pnpm convex env set CLERK_SECRET_KEY "sk_..."

# Run dev (both Next.js and Convex dev server)
pnpm dev        # Next.js
pnpm convex dev # Convex (separate terminal)
```

---

## 🔧 Clerk + Convex Integration Notes

```typescript
// middleware.ts — Clerk middleware for route protection
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  "/doctor(.*)",
  "/patient(.*)",
  "/onboarding(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) await auth.protect();
});

// Role management via Clerk publicMetadata
// After onboarding: clerkClient.users.updateUser(userId, {
//   publicMetadata: { role: "doctor" | "patient" }
// })

// Access role in components:
// const { user } = useUser();
// const role = user?.publicMetadata?.role;
```

---

## 💡 Tips for the Hackathon

1. **Start with Clerk + Convex** — both have excellent docs and 5-min setup; everything depends on them
2. **Use text input as fallback for recording** — audio transcription can be flaky; have a "type session notes" option
3. **Seed realistic data early** — judges need to see a populated app, not empty states
4. **Demo the Supermemory profile** — this is the "wow" moment; show how AI remembers everything about a patient across visits
5. **Deploy early, deploy often** — Convex auto-deploys; Vercel deploys on push
6. **Gemini 3 Flash Preview is fast and multimodal** — use it for everything: text, images, audio
7. **Don't build a real scheduling system** — simplified slot picker is fine for a hackathon
8. **Convex real-time is free demos magic** — open two browsers (doctor + patient) and show real-time updates
9. **Configure Supermemory settings FIRST** — the `filterPrompt` is critical for quality memory extraction
