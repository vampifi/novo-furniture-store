# Product Catalog Sync: Google Sheet → Medusa — Architecture Spec

**Status**: Architecture decided, ready for implementation planning.
**Source of record**: [wayfinder map #1](https://github.com/vampifi/novo-furniture-store/issues/1) and its nine resolved tickets; `GLOSSARY.md`; `docs/adr/0001`–`0005`. This document consolidates those decisions into one reference — the issues and ADRs remain the detailed record of *why*.

## 1. Problem

The business owner currently manages the product catalog by hand, directly in the Medusa admin dashboard, reading supplier-provided files ("Supplier Packs" — PDFs, spreadsheets, ZIPs of images, whatever a given supplier sends) and manually transcribing data product by product. This doesn't scale across multiple suppliers, each with their own inconsistent format.

## 2. Destination

A **one-way** sync: a Google Sheet becomes the business owner's working surface for managing the catalog, and changes flow Sheet → Medusa automatically. Medusa remains the sole source of truth for everything the Sheet doesn't cover (stock/inventory, orders, customers, promotions).

### In scope
- The canonical schema every Supplier Tab uses (§5)
- The common Supplier Adapter interface — the contract individual adapters implement (§6)
- The Sync Engine — how it applies changes to Medusa, triggers, idempotency, validation feedback (§7–9)
- Explicit MeiliSearch search-index propagation

### Out of scope
- **Building individual per-supplier adapters.** Only the shared interface they implement is designed here; each adapter is built later, one at a time, as a real supplier's format is seen.
- **Stock/inventory, in either direction.** Medusa remains sole source of truth, untouched by this sync.
- **Designing the Pack Extraction stage** (file ingestion mechanics, where Supplier Packs land, OCR/AI-based extraction) — see ADR 0002. A different problem domain, deserving its own future effort. For the two currently-planned suppliers, extraction is trivial (deterministically parsable files).
- **Field-level extraction-confidence / "needs review" flagging** — deferred until a supplier whose Pack needs OCR/AI extraction is onboarded (ADR 0002).
- **Cross-cycle magnitude-of-change anomaly detection** (e.g. price-swing thresholds) — considered, explicitly dropped as unneeded complexity (§8).

## 3. Domain vocabulary

Full definitions in `GLOSSARY.md`. Summary:

| Term | Meaning |
|---|---|
| **Supplier Pack** | The file bundle a supplier sends the business owner directly — outside any system we control. |
| **Pack Extraction** | The (mostly deferred) stage turning a Supplier Pack into structured rows. Trivial today — the two current suppliers send deterministically parsable files. |
| **Supplier Adapter** | The per-supplier translator: structured rows → Canonical Products. One per supplier; only the shared interface is in scope here. |
| **Canonical Product** | The common product representation every supplier's data is converted into. |
| **Supplier Tab** | A Sheet tab holding one supplier's products, already in canonical columns. One per supplier; no combined master tab. |
| **Adapter-Owned Field** | Refreshed every sync from supplier data; overwrites any business edit. |
| **Business-Owned Field** | Set once by the Adapter at row creation, then frozen — the business owner's to edit, never auto-overwritten again. |
| **SKU** | Business-assigned, stable catalog identifier. The Medusa upsert key. |
| **Supplier SKU** | The supplier's own product code. Used to recognize the same product across sync cycles, independent of any SKU rename. |
| **Sync Engine** | Reads Supplier Tabs on a schedule (or on demand) and applies changes to Medusa. |
| **Custom Attribute** | Pre-existing in this codebase: a category-scoped property definition (e.g. "Material" for Sofas) plus a per-product value. |

## 4. Pipeline

```
Supplier Pack (file bundle, outside our systems)
        │
        ▼
Pack Extraction  (deferred/trivial — ADR 0002)
        │
        ▼
Structured rows (plain records)
        │
        ▼
Supplier Adapter  (§6 — the interface; individual adapters are future work)
        │
        ▼
Canonical Product  (rows written into a Supplier Tab, with Sync Status write-back — §9)
        │
        ▼
Sync Engine  (§7–8 — reads the Sheet, applies to Medusa)
        │
        ▼
Medusa  (products, variants, prices — MeiliSearch index updates automatically)
```

## 5. Canonical Schema

One row per **variant** (not per product), mirroring Medusa's own CSV import convention (ADR 0003). Variants of the same product share a `Product Handle`.

**Recurring pattern**: any supplier-sourced, customer-facing field is a *paired column* — `Supplier X` (Adapter-Owned, always refreshed) plus `X` (Business-Owned, seeded once from `Supplier X`, then frozen for the business owner to edit). This lets the business owner rename/rewrite anything customer-facing without it being silently overwritten on the next sync.

### Product grouping
| Column | Ownership |
|---|---|
| Product Handle | Set once at creation, frozen after |

### Per-row (= per-variant) identity
| Column | Ownership | Notes |
|---|---|---|
| SKU | Business-Owned | Deterministic default `<first 3 letters of supplier name>_<sanitized supplier SKU>`. Medusa upsert key. When no Supplier SKU exists, defaults to an **incomplete placeholder** — `<first 3 letters of supplier name>_`, nothing after it — which the business owner must complete; the Sync Engine never pushes a row to Medusa while its SKU still matches this pattern (ADR 0004). |
| Supplier SKU | Adapter-Owned | Refreshed every sync; stored in `variant.metadata.supplier_sku`. May be absent (ADR 0004) — no automatic identity matching is attempted in that case. |

### Presentational copy (paired)
| Supplier-provided (Adapter-Owned) | Business version (Business-Owned) |
|---|---|
| Supplier Title | Product Title |
| Supplier Subtitle | Subtitle |
| Supplier Description | Description |

### Pricing
| Column | Ownership |
|---|---|
| Supplier Cost | Adapter-Owned, sheet-only — never pushed to Medusa |
| Retail Price | Business-Owned — the actual Medusa/storefront price |

### Variant options (paired, per option slot N)
| Supplier-provided (Adapter-Owned) | Business version (Business-Owned) |
|---|---|
| Supplier Option N Name | Option N Name |
| Supplier Option N Value | Option N Value |

### Images
| Column | Ownership |
|---|---|
| Image N URL (product-level, repeatable) | Adapter-Owned, adapter-uploaded into existing object storage |
| Variant Image N URL (optional, falls back to product images) | Adapter-Owned, adapter-uploaded |

### Physical/compliance facts (single-column, Adapter-Owned — not presentational, no pairing)
Weight, Length, Width, Height, HS Code, Origin Country, MID Code, UPC, EAN

### Custom Attributes (generalized beyond Material)
| Column | Ownership | Notes |
|---|---|---|
| Attribute N Key | Adapter-Owned | References an existing category-level definition (e.g. "Material") — a reference, not presentational text |
| Attribute N Category Id | Adapter-Owned | Reference only |
| Supplier Attribute N Value | Adapter-Owned | |
| Attribute N Value | Business-Owned | Business override |
| Attribute N Visible | Business-Owned | Whether to show this spec to customers |

### Merchandising decisions (single-column, Business-Owned, no supplier counterpart)
Status (defaults `Draft` on creation), Product Tag N, Product Category N, Collection Id, Type Id, Shipping Profile Id, Sales Channel, Discountable

**Important caveat**: Title, Subtitle, Description, Status, Tags, Categories, Collection Id, Type Id, Shipping Profile Id, Sales Channel, and Discountable are all *product*-level in Medusa's real data model (one value per product), even though the schema repeats them on every variant row. See §8 for how disagreement across a product's sibling rows is handled.

### Kept but hideable
All native Medusa CSV columns stay available even if unused on day one — the business owner can hide unused columns in the Sheet UI rather than the schema omitting them.

### Explicitly not in the Sheet
`Manage Inventory`, `Allow Backorder` (Medusa-admin-only), and anything stock/inventory-related.

## 6. Supplier Adapter Interface

```typescript
type RawRow = Record<string, string | number | null>

interface AdapterContext {
  uploadImage(sourceRef: string): Promise<string>  // returns the final hosted URL
}

type AdapterRowResult =
  | { ok: true; product: CanonicalProduct }
  | { ok: false; supplierSku: string; error: string }

type SupplierAdapter = (rows: RawRow[], context: AdapterContext) => Promise<AdapterRowResult[]>
```

- **Input**: plain records, one per raw row from Pack Extraction — format-agnostic by design.
- **Output**: flat, one row per variant, matching §5's schema exactly — one `AdapterRowResult` per input row.
- **Row/variant independence**: every row's result is fully independent, even siblings of the same product — a product with 3 variants where 1 fails still syncs the other 2.
- **Error anchoring**: failures carry the Supplier SKU, or batch position when none exists (ADR 0004) — never a cross-cycle row index, which isn't guaranteed stable.
- **Statelessness**: the Adapter never checks whether a row already exists in the Sheet. It always produces its full best-guess row, including sensible Business-Owned seed defaults (generated SKU, `Status: Draft`, `Product Title` seeded from `Supplier Title`). The Sync Engine decides whether to use those seeds (new row) or preserve existing Sheet values (existing row).
- **Image upload**: injected via `context.uploadImage` — never hardcoded per adapter, so storage is swappable and adapters are fake-able in tests.
- **Async**, end to end — follows from image upload being I/O-bound.
- **Validation**: shared plausibility-check helpers (price can't be zero/negative, required fields non-empty, etc.) every adapter calls into, rather than per-adapter reimplementation.
- **No automatic identity matching** when Supplier SKU is missing (ADR 0004) — no content fingerprinting, no row-order guessing. The Adapter extracts whatever is present and leaves the rest for the business owner to complete by hand.

## 7. Apply Mechanism

Medusa ships a native product CSV import workflow, but research found it's **fail-fast with no row-level isolation** — one malformed row aborts the entire batch before confirmation (see ADR 0005). That's incompatible with the row/variant independence this spec requires, so the Sync Engine does **not** generate CSV and drive that workflow.

Instead: a **custom Medusa workflow** composes the official `createProductsWorkflow`/`updateProductsWorkflow` as a step (via `.runAsStep()` — the same pattern Medusa's own `batchProductsWorkflow` uses), followed by steps that apply custom attribute values directly.

- **Grouping**: rows grouped by `Handle`, one call per product, including only the Adapter's already-validated ("ok") variants.
- **Create vs. update**: resolved via SKU lookup against Medusa's current data.
- **Custom attributes**: applied via direct steps in the same composed workflow (create the category-level definition if needed, then create/update the product-level value) — bypassing the existing CSV-path monkey-patch's cache/metadata workaround entirely, which exists only to survive that path's async event timing.
- **Transactional behavior**: if a custom-attribute step fails after the product workflow succeeds, the orchestrator automatically rolls back the whole composed workflow using the product workflow's own built-in compensation (e.g. `deleteProducts`) — only the new custom-attribute steps need hand-written compensation.
- **Failure granularity**: a product-level failure (e.g. a DB error) is scoped to that product only; other products and suppliers in the same cycle proceed independently.
- **MeiliSearch**: automatic, no extra step — the same official workflows emit the same `product.created`/`product.updated` events either path would use.

## 8. Sync Engine Design

### Trigger & concurrency
Scheduled polling (Medusa `src/jobs`, every 30–60s — adequate per research, though it provides no retries or overlap prevention on its own) and a manual "sync now" request (scopable to one Supplier Tab or all of them) enter the same underlying sync-cycle function. A lock (a Redis flag, already configured) prevents overlap — a trigger firing mid-cycle is simply skipped, not queued. The concrete manual-trigger UI surface (likely Sheets-native) is left to implementation.

### Two distinct matching problems
- **Adapter output ↔ existing Sheet row**: matched via **Supplier SKU** (stable, never business-edited) — decides whether to use the Adapter's fresh seed defaults (new row) or preserve existing Business-Owned values (existing row, merging only Adapter-Owned fields).
- **Sheet row ↔ Medusa variant**: matched via **SKU** itself (the real Medusa upsert key) — this is Sheet-to-Medusa, not Adapter-to-Sheet, so the (possibly business-renamed) SKU is correct here.

### Idempotency
A hash of each row's Adapter-Owned field values is stored in `variant.metadata`, alongside `supplier_sku`. An unchanged hash skips the row entirely — no Sheet write, no Medusa call.

### Product-level field consistency (new finding during design)
Several canonical-schema columns are product-level in Medusa (one slot per product) despite being repeated per variant row in the Sheet. If a product's sibling rows disagree on a Business-Owned product-level field, **no default is picked** — the product simply doesn't sync until the business owner resolves it. Resolution uses majority rule: if most siblings agree, only the dissenting row(s) are flagged by name; a genuine tie flags every row of that product with a caveat that it may not apply to every variant.

### Validation — deliberately simple
Adapter-level plausibility checks (§6) plus the product-level consistency check above. **No cross-cycle magnitude-of-change anomaly detection** — considered, explicitly dropped as unneeded complexity.

### Cross-cutting policy
Any unresolved flagged issue is never silently cleared. In practice this means: the issue stays visibly uncleared (not necessarily rewritten every cycle — see §9's reconciliation with idempotency). No automatic defaults are ever picked to resolve an ambiguity anywhere in this system — everything ambiguous is flagged for the business owner, never guessed.

### End-to-end flow per cycle (one Supplier Tab)
1. Acquire lock (skip if already held).
2. Batch-read the tab's current rows.
3. Run Pack Extraction → raw rows → that supplier's Adapter → `AdapterRowResult[]`.
4. For each `ok` result: match via Supplier SKU to decide new-seed vs. merge-preserving-Business-Owned; skip if hash unchanged.
5. For each `error` result: mark/refresh its status (§9).
6. Batch-write the tab.
7. Group ready rows by Handle; check product-level field consistency (flag and exclude disagreeing products).
8. For each consistent product with no placeholder SKUs: resolve SKU → Medusa variant, invoke the composed workflow (§7).
9. On success, update `variant.metadata` (`supplier_sku`, sync hash).
10. Release lock.

## 9. Validation & Write-back

One unified `Sync Status` column per row:

| Value | Meaning |
|---|---|
| `✓ Synced` | Row applied successfully |
| `✗ <error text, verbatim from AdapterRowResult.error>` | Adapter-level validation failure |
| `⚠ Needs SKU` | Incomplete-placeholder SKU (ADR 0004) |
| `⚠ <field> doesn't match this product's other N variants` | Product-level disagreement, dissenting row (majority rule) |
| `⚠ This product's variants disagree on <field> — check all rows, may not apply to every variant` | Product-level disagreement, no clear majority |

Plus a **`Last Synced At`** timestamp, updated whenever a row successfully syncs.

**Reconciling re-flag-every-cycle with idempotency**: "never silently cleared" doesn't require literally rewriting identical text every cycle. A row with an unchanged hash reproduces identical Adapter output (it's a pure function), so its error is already sitting visibly uncleared from the previous cycle — skipping the rewrite doesn't violate the policy. The product-level consistency check is unaffected by row hashing; it's a cross-row check on current merged state, always run fresh.

**One status per row, never stacked**: by construction of the pipeline, a row with an Adapter-level failure never reaches the product-consistency-check stage, so exactly one status applies at a time.

## 10. Architectural Decisions

| ADR | Decision |
|---|---|
| [0001](../adr/0001-one-way-sheet-to-medusa-product-sync.md) | One-way sync; Sheet authoritative for Medusa-CSV-schema fields; column-level Adapter/Business ownership split |
| [0002](../adr/0002-defer-extraction-confidence-flagging.md) | No value-plus-confidence wrapper; extraction-confidence flagging deferred until a non-deterministic supplier is onboarded |
| [0003](../adr/0003-supplier-tab-row-per-variant.md) | One row per variant, mirroring Medusa's own CSV convention |
| [0004](../adr/0004-no-automatic-identity-matching-without-supplier-code.md) | No automatic identity matching when a supplier provides no code; incomplete-placeholder SKU, business owner reconciles by hand |
| [0005](../adr/0005-sync-engine-applies-via-composed-workflow.md) | Direct composed-workflow calls, not CSV re-import |

## 11. Future Work

- Designing the Pack Extraction stage proper (file ingestion mechanics, where Supplier Packs land, OCR/AI-based extraction for non-deterministic suppliers) — its own future wayfinder effort.
- Field-level extraction-confidence flagging, once that extraction stage exists.
- Building each individual Supplier Adapter, one at a time, against this interface (§6).
- A concrete example Supplier Tab (headers + sample rows) to sanity-check this schema before implementation begins.
- Deciding how this spec itself gets reviewed/signed off before handoff.
