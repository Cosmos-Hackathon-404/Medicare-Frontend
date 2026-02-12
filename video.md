# Online Video Appointment Feature — Implementation Guide

## Overview

The Online Video Appointment feature enables patients to book **video consultations** with doctors, replacing or augmenting the existing in-person (offline) appointment flow. Patients get the **same features** as offline appointments — session recording, AI transcription & summary, shared reports, drug interaction checking, prescriptions — all accessible during and after the video call.

---

## Architecture

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   Patient     │────▶│  Convex Backend   │◀────│     Doctor       │
│  (Next.js)    │     │  (Mutations/      │     │   (Next.js)      │
│               │     │   Queries)        │     │                  │
│  - Book appt  │     │                   │     │  - View appts    │
│  - Join call  │     │  videoRooms       │     │  - Join call     │
│  - Pre-check  │     │  videoRoomSignals │     │  - Record session│
│  - View       │     │  appointments     │     │  - AI summary    │
│    sessions   │     │  sessions         │     │                  │
└──────┬───────┘     └──────────────────┘     └──────┬───────────┘
       │                                              │
       │         WebRTC Peer-to-Peer                  │
       └──────────────────────────────────────────────┘
```

### Tech Stack

| Layer        | Technology                                      |
| ------------ | ----------------------------------------------- |
| Frontend     | Next.js 16, React 19, TypeScript, Tailwind CSS  |
| UI Library   | shadcn/ui (Radix UI primitives)                 |
| Backend      | Convex (real-time serverless database)           |
| Video        | WebRTC (browser-native, peer-to-peer)            |
| Signaling    | Convex real-time queries (replaces WebSocket)    |
| Auth         | Clerk                                           |
| AI           | Google Gemini (transcription + summarization)    |
| Memory       | Supermemory (patient context)                   |
| STUN Servers | Google public STUN servers                      |

---

## Database Schema Changes

### Modified Table: `appointments`

Added a `type` field to distinguish between offline and online appointments:

```typescript
appointments: defineTable({
  // ... existing fields ...
  type: v.optional(v.string()), // "offline" | "online" — defaults to "offline"
  // ... existing fields ...
})
```

**Backward compatible** — existing appointments without `type` are treated as `"offline"`.

### New Table: `videoRooms`

Tracks video call rooms tied to online appointments:

```typescript
videoRooms: defineTable({
  appointmentId: v.id("appointments"),
  roomId: v.string(),           // Unique room identifier
  doctorClerkId: v.string(),
  patientClerkId: v.string(),
  status: v.string(),           // "waiting" | "active" | "ended"
  doctorJoinedAt: v.optional(v.string()),
  patientJoinedAt: v.optional(v.string()),
  endedAt: v.optional(v.string()),
  duration: v.optional(v.number()), // Duration in seconds
})
  .index("by_appointmentId", ["appointmentId"])
  .index("by_roomId", ["roomId"])
  .index("by_doctorClerkId", ["doctorClerkId"])
  .index("by_patientClerkId", ["patientClerkId"])
```

### New Table: `videoRoomSignals`

WebRTC signaling data exchanged between peers via Convex real-time queries:

```typescript
videoRoomSignals: defineTable({
  roomId: v.string(),
  senderClerkId: v.string(),
  signal: v.string(),           // JSON stringified WebRTC signaling data
  createdAt: v.number(),
})
  .index("by_roomId", ["roomId"])
  .index("by_senderClerkId", ["senderClerkId"])
```

### Updated Type: `Appointment`

```typescript
export type AppointmentType = "offline" | "online";

export interface Appointment {
  // ... existing fields ...
  type?: AppointmentType;
}
```

### New Type: `VideoRoom`

```typescript
export type VideoRoomStatus = "waiting" | "active" | "ended";

export interface VideoRoom {
  _id: Id<"videoRooms">;
  _creationTime: number;
  appointmentId: Id<"appointments">;
  roomId: string;
  doctorClerkId: string;
  patientClerkId: string;
  status: VideoRoomStatus;
  doctorJoinedAt?: string;
  patientJoinedAt?: string;
  endedAt?: string;
  duration?: number;
}
```

---

## Backend (Convex) Implementation

### Mutations

#### `mutations/appointments.ts` — Updated

- **`create`**: Now accepts optional `type` field. When `type === "online"`, automatically creates a `videoRoom` record with status `"waiting"`.
- **`updateStatus`**: When cancelling, also ends any associated video room.  
- **`cancel`**: Also ends any associated video room.

#### `mutations/videoRooms.ts` — New

| Mutation        | Description                                                                                  |
| --------------- | -------------------------------------------------------------------------------------------- |
| `joinRoom`      | Records when a participant joins. Sets room to `"active"` when both doctor + patient join.    |
| `endRoom`       | Ends the video room, calculates call duration, sets status to `"ended"`.                     |
| `updateSignal`  | Stores WebRTC signaling data (offers, answers, ICE candidates) for real-time exchange.       |
| `clearSignals`  | Cleans up signaling data after call ends.                                                    |

### Queries

#### `queries/videoRooms.ts` — New

| Query                 | Description                                                           |
| --------------------- | --------------------------------------------------------------------- |
| `getByAppointment`    | Get video room for a specific appointment.                            |
| `getByRoomId`         | Get video room by its unique room ID.                                 |
| `getSignals`          | Get WebRTC signals for a room, excluding the requesting user's own.   |
| `getActiveForDoctor`  | Get all non-ended video rooms for a doctor.                           |
| `getActiveForPatient` | Get all non-ended video rooms for a patient.                          |

---

## Frontend Implementation

### New Components

#### `components/shared/video-call.tsx`

Three exported components:

##### 1. `<VideoCall />` — Main video call interface

```typescript
interface VideoCallProps {
  appointmentId: string;
  role: "doctor" | "patient";
  peerName: string;
  onCallEnd?: (duration: number) => void;
}
```

**Features:**
- WebRTC peer-to-peer video and audio
- Camera toggle (on/off)
- Microphone toggle (mute/unmute)
- Screen sharing
- Fullscreen mode
- Call duration timer
- Connection status indicators
- Picture-in-picture local preview
- Graceful fallback to audio-only if camera unavailable
- Auto-cleanup on unmount

**WebRTC Flow:**
1. Both users get local media (camera + mic)
2. Doctor creates an offer, sends via Convex signaling
3. Patient receives offer, creates answer, sends back
4. ICE candidates exchanged via Convex real-time queries
5. Direct P2P connection established
6. On end, tracks stopped, room marked as ended

##### 2. `<PreCallCheck />` — Equipment verification

```typescript
interface PreCallCheckProps {
  onReady: () => void;
  onCancel: () => void;
}
```

**Features:**
- Camera preview
- Microphone permission check
- Speaker availability check
- Visual status indicators (Ready / Not Available)
- Join/Cancel actions

##### 3. `<CallStatusBadge />` — Status indicator for appointment lists

Shows real-time call status: **Live** (green, pulsing), **Waiting**, or **Ended**.

---

### New Pages

#### Patient Video Call: `/patient/appointments/[appointmentId]/video`

**File:** `app/patient/appointments/[appointmentId]/video/page.tsx`

**Flow:**
1. Validates appointment is online type
2. Shows pre-call equipment check
3. On "Join Call" → enters video call with doctor
4. On call end → shows call summary with:
   - Call duration
   - Links to appointments and sessions pages

#### Doctor Video Call: `/doctor/appointments/[appointmentId]/video`

**File:** `app/doctor/appointments/[appointmentId]/video/page.tsx`

**Flow:**
1. Validates appointment is online type
2. Shows pre-call equipment check with patient info
3. On "Join Call" → enters video call with patient  
4. On call end → shows **post-call session page** with:
   - Call completion card with duration
   - **Session Recorder** — Record dictation/notes about the consultation  
   - Patient information card
   - Shared reports viewer
   - Link to full session page (transcript, AI summary, drug interactions)

> **Key: After the video call ends, the doctor gets the exact same session recording + AI processing workflow as offline appointments.**

---

### Modified Pages

#### Booking Page: `/patient/book/[doctorId]`

**Changes:**
- New **Appointment Type** selector card with two options:
  - **In-Person Visit** (Building2 icon) — offline appointment
  - **Video Consultation** (Video icon) — online appointment
- Info banner when "online" selected explaining video room creation
- Confirmation button shows appointment type badge
- `createAppointment` mutation now passes `type` field

#### Patient Appointments: `/patient/appointments`

**Changes:**
- Video badge shown on online appointments (blue "Video" badge)
- **"Join Call"** button appears for scheduled online appointments
- Links to `/patient/appointments/[id]/video`

#### Doctor Appointments: `/doctor/appointments`

**Changes:**
- Video badge in status column for online appointments
- **"Join Call"** button in actions column for scheduled online appointments
- Both desktop table rows and mobile cards updated
- Links to `/doctor/appointments/[id]/video`

#### Doctor Session Page: `/doctor/session/[appointmentId]`

**Changes:**
- Shows "Video Call" badge when appointment type is online
- All existing features (transcript, AI summary, drug checker) work identically

---

## Complete User Flow

### Patient Books Online Appointment

```
1. Patient → /patient/book → Browse doctors
2. Patient → /patient/book/[doctorId] → Select "Video Consultation" type
3. Patient picks date/time slot, adds notes, shares reports
4. Patient clicks "Confirm Booking"
   ├── appointments.create mutation runs with type: "online"
   ├── Appointment record created (status: "scheduled", type: "online")
   └── VideoRoom record auto-created (status: "waiting")
5. Patient redirected to /patient/appointments
```

### Doctor + Patient Join Video Call

```
1. Doctor sees appointment with "Video" badge + "Join Call" button
2. Doctor clicks "Join Call" → /doctor/appointments/[id]/video
3. Doctor runs pre-call equipment check → camera + mic verified
4. Doctor clicks "Join Call" → enters VideoCall component
   ├── Local media stream initialized
   ├── joinRoom mutation called (doctorJoinedAt set)
   └── WebRTC offer created and sent via signaling

5. Patient clicks "Join Call" → /patient/appointments/[id]/video
6. Patient runs pre-call equipment check → camera + mic verified
7. Patient clicks "Join Call" → enters VideoCall component
   ├── Local media stream initialized
   ├── joinRoom mutation called (patientJoinedAt set, status → "active")
   ├── Receives doctor's offer via getSignals query
   ├── Creates answer, sends back via signaling
   └── P2P connection established

8. Both see each other's video with full controls:
   - Mute/unmute microphone
   - Toggle camera on/off
   - Share screen (shows reports, images)
   - Fullscreen mode
   - Call duration timer
   - Connection status
```

### After Video Call

```
1. Either party clicks "End Call"
   ├── endRoom mutation called
   ├── Duration calculated
   ├── Video room status → "ended"
   └── Signaling data cleared

2. Doctor sees post-call session page:
   ├── Call completion card with duration
   ├── Session Recorder for dictation
   │   └── Records observations → uploads audio
   │       └── createAndProcess mutation
   │           ├── Audio uploaded to Convex storage
   │           ├── summarizeSession action scheduled
   │           │   ├── Gemini transcribes audio
   │           │   ├── Supermemory patient context fetched
   │           │   ├── Gemini generates AI summary
   │           │   ├── Prescriptions extracted
   │           │   ├── Key decisions extracted
   │           │   └── Stored in Supermemory
   │           └── Appointment auto-marked "completed"
   ├── Shared reports viewer
   ├── Patient info link
   └── Link to full session page

3. Patient sees call summary:
   ├── Duration display
   ├── Link to appointments
   └── Link to sessions (to view AI summary when ready)
```

### Viewing Sessions (Same as Offline)

```
Doctor → /doctor/session/[appointmentId]:
  - Audio player for recorded dictation
  - Editable AI transcript
  - Editable AI summary (chiefComplaint, diagnosis, prescriptions, etc.)
  - Drug interaction checker
  - Shared reports viewer
  - Patient profile link

Patient → /patient/sessions:
  - Session history with AI summaries
  - Doctor name, specialization
  - Date/time of session
  - Expandable AI summary cards
```

---

## Feature Parity: Online vs Offline

| Feature                    | Offline | Online |
| -------------------------- | ------- | ------ |
| Book appointment           | ✅       | ✅      |
| Choose date/time           | ✅       | ✅      |
| Add appointment notes      | ✅       | ✅      |
| Share reports at booking   | ✅       | ✅      |
| Cancel appointment         | ✅       | ✅      |
| Doctor-patient messaging   | ✅       | ✅      |
| Video call                 | ❌       | ✅      |
| Screen sharing             | ❌       | ✅      |
| Pre-call equipment check   | ❌       | ✅      |
| Session audio recording    | ✅       | ✅      |
| AI transcription (Gemini)  | ✅       | ✅      |
| AI summary generation      | ✅       | ✅      |
| Prescription extraction    | ✅       | ✅      |
| Key decisions extraction   | ✅       | ✅      |
| Editable transcript        | ✅       | ✅      |
| Editable AI summary        | ✅       | ✅      |
| Drug interaction checker   | ✅       | ✅      |
| Patient profile access     | ✅       | ✅      |
| Shared reports viewer      | ✅       | ✅      |
| Patient context (Supermemory) | ✅    | ✅      |
| View past sessions         | ✅       | ✅      |
| Session in patient history | ✅       | ✅      |
| Critical alerts            | ✅       | ✅      |
| Wellness plans             | ✅       | ✅      |

---

## File Structure

```
New Files:
├── components/shared/video-call.tsx         # VideoCall, PreCallCheck, CallStatusBadge
├── convex/mutations/videoRooms.ts           # joinRoom, endRoom, updateSignal, clearSignals
├── convex/queries/videoRooms.ts             # getByAppointment, getByRoomId, getSignals, etc.
├── app/patient/appointments/[appointmentId]/video/page.tsx  # Patient video call page
├── app/doctor/appointments/[appointmentId]/video/page.tsx   # Doctor video call page
└── video.md                                 # This documentation

Modified Files:
├── convex/schema.ts                         # Added videoRooms, videoRoomSignals tables + appointment type
├── convex/mutations/appointments.ts         # Updated create (type field), cancel (end video room)
├── types/index.ts                           # Added AppointmentType, VideoRoom, VideoRoomStatus
├── app/patient/book/[doctorId]/page.tsx     # Appointment type selector in booking
├── app/patient/appointments/page.tsx        # Video badge, Join Call button
├── app/doctor/appointments/page.tsx         # Video badge, Join Call button (table + mobile)
└── app/doctor/session/[appointmentId]/page.tsx  # Video Call badge indicator
```

---

## WebRTC Signaling via Convex

Instead of a traditional WebSocket signaling server, we leverage **Convex's real-time subscription queries** for WebRTC signaling:

```
Doctor                    Convex                    Patient
  │                         │                         │
  │── updateSignal(offer) ─▶│                         │
  │                         │── getSignals() push ──▶ │
  │                         │                         │
  │                         │◀── updateSignal(answer)──│
  │◀── getSignals() push ──│                         │
  │                         │                         │
  │── updateSignal(ICE) ──▶│                         │
  │                         │── getSignals() push ──▶ │
  │                         │                         │
  │◀── getSignals() push ──│◀── updateSignal(ICE) ──│
  │                         │                         │
  │◀════════ P2P Connection Established ════════════▶│
```

**Advantages:**
- No additional WebSocket server needed
- Leverages Convex's existing real-time infrastructure
- Signals automatically cleaned up after call
- Works with existing authentication (Clerk)

---

## Security Considerations

1. **Authentication**: All mutations/queries require authenticated Clerk users
2. **Authorization**: Video rooms are tied to specific appointments with known doctor + patient IDs
3. **P2P Privacy**: Video/audio data flows directly between peers (not through server)
4. **Signal Cleanup**: Signaling data is deleted after calls end
5. **Room Lifecycle**: Rooms automatically marked "ended" when appointments are cancelled
6. **STUN Only**: Uses Google's public STUN servers for NAT traversal (no TURN server = no media relay through third-party)

---

## Future Improvements

- [ ] Add TURN server for users behind symmetric NATs
- [ ] In-call chat sidebar
- [ ] Call recording (record video stream, not just audio dictation)
- [ ] Virtual waiting room with queue position
- [ ] Multi-party calls (e.g., specialist consultations)
- [ ] Call quality indicators (bitrate, packet loss)
- [ ] Reconnection handling for dropped connections
- [ ] Push notifications when peer joins the call
- [ ] Calendar integration (Google Calendar, Outlook)
- [ ] Appointment reminders (email/SMS)
