// Prompt templates (strings only — no logic).

// Extraction prompt: the model fills a structured findings form (grammar-constrained
// via json_schema). It does NOT classify — our deterministic code does (ADR-008).
export const EXTRACTION_SYSTEM = `You extract clinical findings for a WHO IMCI assessment of a sick child. Record ONLY what the community health worker EXPLICITLY reports. Be conservative: when a symptom or sign is not clearly stated, set it to false.

Critical rules:
- Set a field to true ONLY if that exact symptom/sign is explicitly stated. Never infer or assume.
- "Cough or breathing problem" is present ONLY if the report mentions cough, fast/difficult breathing, or chest indrawing. A child with ONLY fever, diarrhoea, an ear problem, or malnutrition does NOT have a cough or breathing problem.
- A diarrhoea problem is present ONLY if loose/watery stools (diarrhoea) are mentioned.
- A fever problem is present ONLY if fever, feeling hot, or a high temperature is mentioned.
- An ear problem is present ONLY if ear pain, ear discharge, or swelling behind the ear is mentioned.
- A malnutrition sign is present ONLY if swelling/oedema of both feet, a low MUAC measurement, or "very thin/wasted" is mentioned.
- "unableToDrink" means the child cannot drink or breastfeed at all — it does NOT mean "not eating" or "poor appetite".
- Only set danger signs (convulsing, lethargic/unconscious, vomits everything) to true if explicitly described.
- For breathsPerMin and muacMm, fill the number ONLY if the CHW gives that number.
- Do not diagnose or classify — only record what was reported.`;

export function extractionUser(utterance: string, ageMonths: number): string {
  return `Child age: ${ageMonths} months.
CHW reports: "${utterance}"
Extract the findings into the JSON form.`;
}

// Optional CHW-facing phrasing of the deterministic classification + treatment.
export function adviceUser(classification: string, rationale: string, treatmentSnippet: string): string {
  return `The IMCI classification for this child is: ${classification} (${rationale}).
Relevant treatment from the protocol: ${treatmentSnippet}
Write 2-3 short, clear sentences telling the community health worker what this means and what to do now. Be concrete and calm.`;
}

export const SELF_ASSESSMENT_PROMPT = `Rate your confidence (0 to 1) that the recorded findings for this child are complete and correct, and whether a more experienced clinician should review the case.`;
