// ===== Session Summary Prompt =====
export const SESSION_SUMMARY_PROMPT = `You are a medical AI assistant for Medicare AI.
Analyze this doctor-patient session transcript and generate a structured summary.

PATIENT CONTEXT (from Supermemory):
{patientContext}

TRANSCRIPT:
{transcript}

Respond ONLY with valid JSON (no markdown, no code blocks):
{
  "chief_complaint": "Main reason for the visit in one sentence",
  "diagnosis": "Medical diagnosis or assessment based on the session",
  "prescriptions": [
    {
      "medication": "Name of medication",
      "dosage": "Dosage amount (e.g., 500mg)",
      "frequency": "How often to take (e.g., twice daily)",
      "duration": "How long to take (e.g., 7 days)",
      "instructions": "Special instructions (e.g., take with food)"
    }
  ],
  "follow_up_actions": ["..."],
  "key_decisions": ["..."],
  "comparison_with_previous": "..."
}

PRESCRIPTIONS GUIDELINES:
- Generate appropriate prescriptions based on the diagnosis and symptoms discussed
- Include common medications that would typically be prescribed for the condition
- If no medications are needed, return an empty prescriptions array
- Always include dosage, frequency, duration, and any special instructions
- These are AI suggestions - the doctor will review and modify as needed

If no relevant patient context exists, set comparison_with_previous to null.`;

// ===== Report Analysis Prompt =====
export const REPORT_ANALYSIS_PROMPT = `You are a medical AI assistant. Analyze this medical report.

IMPORTANT: This report may consist of MULTIPLE pages/images. If multiple images are attached, treat them ALL as pages of the SAME medical report. Analyze them HOLISTICALLY — cross-reference values, findings, and context across all pages to produce a single comprehensive analysis. Do NOT analyze each page in isolation.

PATIENT CONTEXT:
{patientContext}

Analyze the attached medical report (all pages) and respond ONLY with valid JSON (no markdown, no code blocks):
{
  "plain_language_summary": "A clear, patient-friendly explanation of the report findings",
  "critical_flags": [
    {
      "issue": "Name of the concerning finding",
      "severity": "high|medium|low",
      "details": "Detailed explanation of why this is concerning"
    }
  ],
  "recommendations": ["List of recommended actions or follow-ups"],
  "pre_diagnosis_insights": "Preliminary diagnostic considerations based on findings"
}

If no critical issues are found, return an empty array for critical_flags.`;

// ===== Share Context Prompt =====
export const SHARE_CONTEXT_PROMPT = `Create a comprehensive medical context transfer summary for a new doctor.
This summary should give the receiving doctor a complete picture of the patient's medical history.

PATIENT PROFILE:
{staticFacts}

RECENT HISTORY:
{dynamicContext}

RELEVANT RECORDS:
{memories}

Respond ONLY with valid JSON (no markdown, no code blocks):
{
  "patient_overview": "Brief demographic and medical overview",
  "chronological_summary": "Timeline of major medical events and visits",
  "active_conditions": ["List of current/ongoing conditions"],
  "current_medications": ["List of current prescriptions and dosages"],
  "allergies": ["Known allergies"],
  "critical_alerts": ["Important warnings for the new doctor"],
  "recommended_follow_ups": ["Suggested next steps"]
}`;

// ===== Helper to fill prompt templates =====
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

// ===== Wellness Plan Generation Prompt =====
export const WELLNESS_PLAN_PROMPT = `You are a world-class medical wellness AI for Medicare AI.
You have comprehensive knowledge of this patient from their complete medical history, reports, session transcripts, vitals, prescriptions, and memory profile.

Generate a deeply PERSONALIZED wellness plan tailored to this specific patient's conditions, medications, age, body metrics, and medical history.

PATIENT PROFILE:
{patientProfile}

PATIENT MEMORY CONTEXT (from Supermemory — includes all past visits, diagnoses, medications, lifestyle notes):
{memoryContext}

RECENT VITALS DATA:
{vitalsData}

MEDICAL REPORTS SUMMARY:
{reportsSummary}

SESSION HISTORY (diagnoses, prescriptions, key decisions):
{sessionsData}

ACTIVE CRITICAL ALERTS:
{criticalAlerts}

Generate a comprehensive, personalized wellness plan. Be SPECIFIC — use actual numbers, actual food names, actual exercises. Tailor everything to the patient's conditions, allergies, medications, and health data.

Respond ONLY with valid JSON (no markdown, no code blocks):
{
  "nutrition": {
    "dailyCalorieTarget": "e.g. 1800-2000 kcal",
    "macroSplit": {
      "protein": "e.g. 30%",
      "carbs": "e.g. 45%",
      "fats": "e.g. 25%"
    },
    "meals": [
      {
        "name": "Breakfast",
        "time": "7:00 - 8:00 AM",
        "items": ["Oatmeal with berries and walnuts", "Green tea", "1 boiled egg"],
        "notes": "High fiber to help manage blood sugar"
      },
      {
        "name": "Mid-Morning Snack",
        "time": "10:00 AM",
        "items": ["Apple slices with almond butter"],
        "notes": "Keeps energy stable between meals"
      },
      {
        "name": "Lunch",
        "time": "12:30 - 1:30 PM",
        "items": ["Grilled chicken salad with olive oil dressing", "Brown rice", "Steamed vegetables"],
        "notes": ""
      },
      {
        "name": "Afternoon Snack",
        "time": "4:00 PM",
        "items": ["Greek yogurt with mixed nuts"],
        "notes": ""
      },
      {
        "name": "Dinner",
        "time": "7:00 - 8:00 PM",
        "items": ["Baked salmon", "Quinoa", "Sautéed spinach"],
        "notes": "Omega-3 rich for heart health"
      }
    ],
    "foodsToInclude": ["Leafy greens", "Fatty fish", "Whole grains", "Berries"],
    "foodsToAvoid": ["Processed sugar", "High-sodium foods", "Trans fats"],
    "hydration": "8-10 glasses (2-2.5L) of water daily. Avoid sugary drinks.",
    "supplements": ["Vitamin D3 - 1000 IU daily", "Omega-3 Fish Oil - 1000mg daily"]
  },
  "exercise": {
    "weeklyGoal": "150 minutes of moderate activity per week",
    "restrictions": ["Avoid heavy lifting if blood pressure is elevated"],
    "routines": [
      {
        "day": "Monday",
        "type": "Cardio",
        "duration": "30 minutes",
        "exercises": ["Brisk walking", "Light jogging intervals"],
        "intensity": "Moderate",
        "notes": "Monitor heart rate, stay below 140 bpm"
      },
      {
        "day": "Wednesday",
        "type": "Strength & Flexibility",
        "duration": "35 minutes",
        "exercises": ["Bodyweight squats x15", "Wall push-ups x12", "Yoga stretches"],
        "intensity": "Low-Moderate",
        "notes": ""
      },
      {
        "day": "Friday",
        "type": "Cardio + Core",
        "duration": "30 minutes",
        "exercises": ["Swimming or cycling", "Plank holds 30s x3"],
        "intensity": "Moderate",
        "notes": ""
      },
      {
        "day": "Saturday",
        "type": "Active Recovery",
        "duration": "20 minutes",
        "exercises": ["Gentle yoga", "Stretching routine", "Short walk"],
        "intensity": "Low",
        "notes": "Focus on flexibility and relaxation"
      }
    ]
  },
  "lifestyle": {
    "sleepRecommendation": "7-8 hours per night, consistent schedule",
    "sleepTips": ["No screens 1 hour before bed", "Keep bedroom cool (65-68°F)", "Avoid caffeine after 2 PM"],
    "stressManagement": ["10-minute daily meditation", "Deep breathing exercises", "Journaling before bed"],
    "habits": ["Take medications on schedule", "Track vitals weekly", "Walk 10 minutes after each meal"]
  },
  "mentalWellness": {
    "recommendations": ["Practice mindfulness 10 min/day", "Maintain social connections"],
    "activities": ["Nature walks", "Reading", "Hobby engagement", "Gratitude journaling"],
    "warningSignsToWatch": ["Persistent low mood for >2 weeks", "Sleep disturbances", "Loss of appetite"]
  },
  "additionalNotes": "This plan accounts for your current medications. Adjust exercise intensity if you feel dizzy. Review this plan with your doctor at your next visit.",
  "reviewDate": "Review in 4 weeks or after any medication changes",
  "aiConfidence": "high"
}

IMPORTANT:
- If the patient has allergies, NEVER include those foods
- If the patient is on blood thinners, avoid high vitamin K foods
- If the patient has diabetes, focus on glycemic control
- If the patient has cardiovascular issues, emphasize heart-healthy foods and appropriate exercise limits
- If the patient has joint/orthopedic issues, recommend low-impact exercises
- If data is limited, provide general healthy guidelines and note low confidence
- Always set reviewDate based on the patient's condition severity`;
