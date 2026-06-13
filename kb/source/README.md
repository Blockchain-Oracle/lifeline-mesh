# KB source provenance

Source documents for the Lifeline Mesh knowledge base. PDFs are **gitignored** (large, redistributable only by their own terms); the curated markdown and built chunks ARE committed for reproducibility.

| id | document | licence | download |
|----|----------|---------|----------|
| imci | WHO IMCI Chart Booklet (March 2014), ISBN 978 92 4 150682 3 | © WHO 2014 — non-commercial research/demonstration use | https://cdn.who.int/media/docs/default-source/mca-documents/child/imci-integrated-management-of-childhood-illness/imci-in-service-training/imci-chart-booklet.pdf |

## Rebuild the KB

```bash
# 1. Fetch the source PDF (not committed)
curl -sL -o kb/source/imci-chartbook.pdf "https://cdn.who.int/media/docs/default-source/mca-documents/child/imci-integrated-management-of-childhood-illness/imci-in-service-training/imci-chart-booklet.pdf?sfvrsn=f63af425_1"

# 2. (optional) Re-extract page-marked text — requires poppler `pdftotext`
node scripts/ingest.mjs imci

# 3. Build committed chunks + manifest from the curated markdown
pnpm build && node scripts/build-kb.mjs
```

`kb/source/imci-curated.md` is hand-curated from the real PDF (ADR-005): protocol tables in the chart booklet flatten badly under automated extraction, so the clinically-load-bearing sections are curated by hand with their **real PDF page numbers** preserved for citations. Page numbers were verified against the downloaded PDF on 2026-06-13.
