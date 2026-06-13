import { CATEGORIES, type Category } from "./findings.js";

// Deterministic safety net: detect unambiguous IMCI symptom categories directly
// from the CHW's words. ORed with the model's category selection so obvious signals
// (a counted breathing rate, "diarrhoea", "fever") are never missed by a small model.
const PATTERNS: Record<Category, RegExp> = {
  cough_or_breathing:
    /\b(cough|breath|breathing|respirat|chest indrawing|stridor|wheez)\w*|\d+\s*(breaths|\/?\s*min|per minute)/i,
  diarrhoea: /\b(diarrh\w*|loose stool|watery stool|stools?)\b/i,
  fever: /\b(fever|febrile|temperature|hot to touch|malaria)\b/i,
  ear_problem: /\b(ear pain|ear discharge|behind the ear|\bear\b)\w*/i,
  malnutrition: /\b(oedema|edema|muac|wasted|very thin|malnutr\w*)\b/i,
};

export function detectCategories(utterance: string): Category[] {
  return CATEGORIES.filter((c) => PATTERNS[c].test(utterance));
}
