import { AMOX_BANDS, CITATIONS } from "./clinical-constants.js";

export interface DoseResult {
  mg: number | null;
  needsReview: boolean;
  citationId: string;
  note: string;
}

// Amoxicillin dose by weight band (IMCI p.6 dosing). Refuses (needsReview) when the
// weight is outside the charted bands rather than guessing — a deliberate safety choice.
export function amoxicillinDose(weightKg: number): DoseResult {
  const band = AMOX_BANDS.find((b) => weightKg >= b.minKg && weightKg < b.maxKg);
  if (!band) {
    return {
      mg: null,
      needsReview: true,
      citationId: CITATIONS.amoxDosing,
      note: `Weight ${weightKg} kg is outside the charted amoxicillin bands (4–19 kg); refer to the national formulary.`,
    };
  }
  return {
    mg: band.mg,
    needsReview: false,
    citationId: CITATIONS.amoxDosing,
    note: `Give ${band.mg} mg per dose twice daily for 5 days (weight ${weightKg} kg, band ${band.minKg}–${band.maxKg} kg).`,
  };
}
