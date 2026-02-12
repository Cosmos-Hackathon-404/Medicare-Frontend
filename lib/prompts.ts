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

PATIENT CONTEXT:
{patientContext}

Analyze the attached medical report and respond ONLY with valid JSON (no markdown, no code blocks):
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
