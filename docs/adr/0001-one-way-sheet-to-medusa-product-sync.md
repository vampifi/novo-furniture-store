# One-way Sheet-to-Medusa product sync, with the sheet as sole authority

The business owner wants to manage the product catalog at scale from a Google Sheet rather than the Medusa admin dashboard, fed by per-supplier adapters. Making this bidirectional would require real conflict resolution — whose edit wins when the same field changes in both places — which is a much harder and more fragile system than the actual requirement calls for.

We decided the sync is **one-way, sheet to Medusa, never the reverse**. The sheet is authoritative for every field Medusa's native product CSV import schema covers (including its existing custom-attribute extension); Medusa remains authoritative for everything else (stock/inventory, orders, customers, etc.), which this sync never touches in either direction. A direct edit to a sheet-owned field made in Medusa admin is silently overwritten on the next sync cycle — by convention the admin UI is treated as read-only for those fields.

Within a Supplier Tab, fields are split into **adapter-owned** (always overwritten from the supplier's raw data) and **business-owned** (set once on first creation, then left alone) rather than detecting per-row edits via diffing. This keeps the ownership boundary visible in the sheet's column headers instead of hidden in sync-engine logic, at the cost of needing that split decided per field up front.

## Considered Options

- **Bidirectional sync with conflict resolution** — rejected; the requirement doesn't need Medusa-side edits to flow back, and the conflict-resolution machinery isn't worth building for no real benefit.
- **Row-level dirty-diffing** (detect whether a human touched any cell in a row since the adapter last wrote it, skip the whole row if so) — rejected in favor of the column-level split for simplicity and visibility.
