import { classifyCough } from "./triage-classify.js";
import { MUAC, CITATIONS } from "./clinical-constants.js";
import type { Findings } from "./findings.js";

export interface CaseClassification {
  classification: string;
  severity: "pink" | "yellow" | "green";
  citationId: string;
  rationale: string;
}

// Deterministic IMCI classifier over extracted findings (ADR-008: rules over vibes).
// Assesses each symptom path and returns the highest-priority active classification,
// matching how IMCI prioritises severe (pink) conditions for urgent referral.

function diarrhoea(f: Findings): CaseClassification | null {
  if (!f.hasDiarrhoea && !f.skinPinchVerySlow && !f.skinPinchSlow && !f.sunkenEyes) return null;
  const severe = [f.lethargicOrUnconscious, f.sunkenEyes, f.drinkingPoorly, f.skinPinchVerySlow].filter(Boolean).length;
  const some = [f.restlessIrritable, f.sunkenEyes, f.drinkingEagerlyThirsty, f.skinPinchSlow].filter(Boolean).length;
  if (severe >= 2 || f.skinPinchVerySlow) {
    return { classification: "SEVERE DEHYDRATION", severity: "pink", citationId: CITATIONS.diarrhoea, rationale: "Two or more severe dehydration signs." };
  }
  if (some >= 2 || f.skinPinchSlow) {
    return { classification: "SOME DEHYDRATION", severity: "yellow", citationId: CITATIONS.diarrhoea, rationale: "Two or more some-dehydration signs." };
  }
  return { classification: "NO DEHYDRATION", severity: "green", citationId: CITATIONS.diarrhoea, rationale: "Not enough signs for some/severe dehydration." };
}

function fever(f: Findings): CaseClassification | null {
  if (!f.hasFever && !f.stiffNeck && !f.malariaTestPositive) return null;
  if (f.stiffNeck) {
    return { classification: "VERY SEVERE FEBRILE DISEASE", severity: "pink", citationId: CITATIONS.fever, rationale: "Stiff neck with fever." };
  }
  if (f.malariaTestPositive) {
    return { classification: "MALARIA", severity: "yellow", citationId: CITATIONS.fever, rationale: "Positive malaria test in a febrile child." };
  }
  return null; // fever without danger/malaria — let cough/other paths drive, or fever (no malaria)
}

function ear(f: Findings): CaseClassification | null {
  if (!f.hasEarProblem && !f.earPainOrDischarge && !f.swellingBehindEar) return null;
  if (f.swellingBehindEar) {
    return { classification: "MASTOIDITIS", severity: "pink", citationId: CITATIONS.ear, rationale: "Tender swelling behind the ear." };
  }
  return { classification: "ACUTE EAR INFECTION", severity: "yellow", citationId: CITATIONS.ear, rationale: "Ear pain or discharge under 14 days." };
}

function malnutrition(f: Findings): CaseClassification | null {
  if (!f.bilateralOedema && f.muacMm === undefined) return null;
  if (f.bilateralOedema || (f.muacMm !== undefined && f.muacMm < MUAC.SEVERE_MM)) {
    return { classification: "SEVERE ACUTE MALNUTRITION", severity: "pink", citationId: CITATIONS.malnutrition, rationale: "Bilateral oedema or MUAC < 115 mm." };
  }
  if (f.muacMm !== undefined && f.muacMm >= MUAC.MODERATE_MIN_MM && f.muacMm < MUAC.MODERATE_MAX_MM) {
    return { classification: "MODERATE ACUTE MALNUTRITION", severity: "yellow", citationId: CITATIONS.malnutrition, rationale: "MUAC 115 up to 125 mm." };
  }
  return null;
}

function cough(f: Findings, ageMonths: number): CaseClassification | null {
  const hasBreathing =
    f.hasCough || f.breathsPerMin !== undefined || f.chestIndrawing || f.stridorInCalmChild;
  if (!hasBreathing) return null;
  const r = classifyCough({
    ageMonths,
    ...(f.breathsPerMin !== undefined ? { breathsPerMin: f.breathsPerMin } : {}),
    ...(f.chestIndrawing !== undefined ? { chestIndrawing: f.chestIndrawing } : {}),
    ...(f.stridorInCalmChild !== undefined ? { stridorInCalmChild: f.stridorInCalmChild } : {}),
  });
  return { classification: r.classification, severity: r.severity, citationId: r.citationId, rationale: r.rationale };
}

const SEVERITY_RANK = { pink: 0, yellow: 1, green: 2 } as const;

export function classifyCase(f: Findings, ageMonths: number): CaseClassification {
  // General danger signs override everything (IMCI p.5).
  const danger =
    f.unableToDrink || f.vomitsEverything || f.convulsingNow || f.convulsionsHistory || f.lethargicOrUnconscious;

  const candidates: CaseClassification[] = [];
  const c = cough(f, ageMonths);
  if (c) candidates.push(c);
  const d = diarrhoea(f);
  if (d) candidates.push(d);
  const fe = fever(f);
  if (fe) candidates.push(fe);
  const e = ear(f);
  if (e) candidates.push(e);
  const m = malnutrition(f);
  if (m) candidates.push(m);

  if (danger) {
    // Danger sign + cough = severe pneumonia. Otherwise, if a symptom path already
    // yields a specific severe (pink) classification (e.g. SEVERE DEHYDRATION, where
    // lethargy is itself a dehydration sign), prefer that. Else: very severe disease.
    if (c) {
      return { classification: "SEVERE PNEUMONIA OR VERY SEVERE DISEASE", severity: "pink", citationId: CITATIONS.coughTreat, rationale: "General danger sign with cough/breathing problem." };
    }
    const pink = candidates.find((x) => x.severity === "pink");
    if (pink) return pink;
    return { classification: "VERY SEVERE DISEASE", severity: "pink", citationId: CITATIONS.dangerSigns, rationale: "General danger sign present." };
  }

  if (candidates.length === 0) {
    return { classification: "NO CLASSIFICATION", severity: "green", citationId: CITATIONS.dangerSigns, rationale: "No assessable IMCI findings reported." };
  }
  candidates.sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);
  return candidates[0]!;
}
