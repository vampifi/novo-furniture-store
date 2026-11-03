# Defer extraction-confidence flagging until a non-deterministic Supplier Pack needs onboarding

Supplier Packs must pass through a Pack Extraction stage to become the structured rows a Supplier Adapter consumes. Extraction done via OCR or an LLM is inherently unreliable — it can misread a value with full grammatical confidence — which would normally argue for a field-level "needs review" flag that Extraction sets and the Adapter and Sync Engine propagate through to the business owner.

The two suppliers currently being planned for both have Supplier Packs in deterministically parsable formats (no OCR/AI required), so there is no real confidence signal to propagate yet. We decided **not** to design or build the confidence/needs-review flagging mechanism as part of this effort. The canonical schema and Supplier Adapter interface assume plain, trusted field values rather than a value-plus-confidence wrapper. This is deferred until a supplier whose Supplier Pack genuinely needs OCR/AI-based extraction needs onboarding — at that point, revisit the canonical schema and adapter contract to add the flag as an additive change, not a breaking one.

This doesn't remove validation from scope: adapter-level plausibility checks on values (e.g. a price can't be zero or negative) and Sync-Engine-level anomaly detection on suspicious changes between cycles are unaffected by this deferral and remain part of the canonical schema (#6) and Sync Engine (#9) design.

## Considered Options

- **Design the confidence/needs-review flag now**, speculatively, so the contract never needs to change later — rejected: we have no real data yet on what confidence signals an eventual OCR/AI extractor would actually produce, and building for it now is guessing at a shape we'd likely get wrong.
