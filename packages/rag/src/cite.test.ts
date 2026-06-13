import { describe, it, expect } from "vitest";
import { CitationResolver, CitationNotFoundError } from "./cite.js";
import type { Chunk } from "./ingest/manifest.js";

const chunks: Chunk[] = [
  {
    id: "c-imci-cough-classify",
    content: "PNEUMONIA (yellow): chest indrawing OR fast breathing. Give oral amoxicillin for 5 days.",
    sourceId: "imci",
    sourceTitle: "WHO IMCI Chart Booklet (March 2014)",
    section: "Cough or difficult breathing — classify and treat",
    page: 6,
    type: "treatment",
  },
];

describe("CitationResolver", () => {
  const resolver = new CitationResolver(chunks);

  it("formats a verifiable label with source, page and section", () => {
    const c = resolver.resolve("c-imci-cough-classify");
    expect(c.label).toBe(
      "WHO IMCI Chart Booklet (March 2014) · p.6 · §Cough or difficult breathing — classify and treat",
    );
    expect(c.page).toBe(6);
  });

  it("includes a quote excerpt of the chunk content", () => {
    expect(resolver.resolve("c-imci-cough-classify").quote).toContain("PNEUMONIA");
  });

  it("throws CitationNotFoundError for an unknown id (never silent)", () => {
    expect(() => resolver.resolve("nope")).toThrow(CitationNotFoundError);
  });

  it("resolves from a RagHit", () => {
    const c = resolver.fromHit({
      id: "c-imci-cough-classify",
      content: "",
      score: 12,
      sourceId: "imci",
      section: "x",
      page: 6,
      type: "treatment",
    });
    expect(c.page).toBe(6);
  });
});
