import { describe, it, expect } from "vitest";
import { chunk } from "./chunker.js";

const META = { sourceId: "imci", sourceTitle: "WHO IMCI Chart Booklet (March 2014)" };

const SAMPLE = `## General danger signs
<!-- page: 5 | type: danger-signs -->
ASK: able to drink? vomits everything? convulsions?
A child with any general danger sign needs URGENT attention.

## Cough or difficult breathing — assess
<!-- page: 6 | type: protocol -->
Fast breathing: 2-12 months 50/min; 12 months-5 years 40/min.
`;

describe("chunk", () => {
  it("produces one chunk per section with full metadata", () => {
    const chunks = chunk(SAMPLE, META);
    expect(chunks).toHaveLength(2);
    expect(chunks[0]).toMatchObject({
      sourceId: "imci",
      section: "General danger signs",
      page: 5,
      type: "danger-signs",
    });
    expect(chunks[1]!.page).toBe(6);
    expect(chunks[1]!.type).toBe("protocol");
  });

  it("derives deterministic slugged ids from the section title", () => {
    const a = chunk(SAMPLE, META);
    const b = chunk(SAMPLE, META);
    expect(a[0]!.id).toBe("c-imci-general-danger-signs");
    expect(a.map((c) => c.id)).toEqual(b.map((c) => c.id));
  });

  it("keeps the section body intact (not split mid-content)", () => {
    const chunks = chunk(SAMPLE, META);
    expect(chunks[1]!.content).toContain("50/min");
    expect(chunks[1]!.content).toContain("40/min");
  });

  it("throws if a section is missing its metadata line", () => {
    expect(() => chunk(`## Orphan\nbody without meta`, META)).toThrow(/metadata/);
  });

  it("disambiguates duplicate section titles with a numeric suffix", () => {
    const dup = `## Fever
<!-- page: 8 | type: protocol -->
first
## Fever
<!-- page: 9 | type: treatment -->
second`;
    const chunks = chunk(dup, META);
    expect(chunks[0]!.id).toBe("c-imci-fever");
    expect(chunks[1]!.id).toBe("c-imci-fever-2");
  });

  it("rejects an unknown chunk type", () => {
    expect(() => chunk(`## X\n<!-- page: 1 | type: bogus -->\nbody`, META)).toThrow();
  });
});
