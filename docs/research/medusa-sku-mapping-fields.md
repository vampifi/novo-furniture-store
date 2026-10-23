# Research: Medusa v2.8.8 variant model support for SKU ↔ Supplier-SKU ↔ Medusa-ID mapping

**Issue:** [#5](https://github.com/vampifi/novo-furniture-store/issues/5)
**Date:** 2026-10-23
**Scope:** installed `@medusajs/*@2.8.8` packages under `backend/node_modules`, plus official Medusa docs.

## Question

Does Medusa v2.8.8's `ProductVariant` model have a reusable field (e.g. `external_id`,
`metadata`) that round-trips cleanly through `importProductsWorkflow` and the Admin API, so the
Sync Engine can map `Catalog SKU ↔ Supplier SKU ↔ Medusa product/variant` and upsert instead of
duplicate-create on repeated syncs — or does this need a dedicated mapping store?

## Primary sources consulted

- `@medusajs/product@2.8.8` — `dist/models/product-variant.js`, `dist/models/product.js`,
  `dist/migrations/InitialSetup20240401153642.js`, `dist/migrations/Migration20241125090957.js`,
  `dist/services/product-module-service.js`
  (resolved under `backend/node_modules/.pnpm/@medusajs+product@2.8.8_.../node_modules/@medusajs/product`)
- `@medusajs/core-flows@2.8.8` — `dist/product/workflows/import-products.js`,
  `dist/product/steps/update-products.js`
- `@medusajs/utils@2.8.8` — `dist/product/csv-normalizer.js`
- `@medusajs/medusa@2.8.8` — `dist/api/admin/product-variants/validators.js`,
  `dist/api/admin/products/validators.js`
- Medusa docs: `docs.medusajs.com/resources/recipes/erp/odoo` (first-party ERP sync recipe),
  `docs.medusajs.com/resources/commerce-modules/product/extend` (extensibility guidance)

## Findings

### 1. `ProductVariant` has no `external_id` field

The full `ProductVariant` field list (`dist/models/product-variant.js`): `id, title, sku, barcode,
ean, upc, allow_backorder, manage_inventory, hs_code, origin_country, mid_code, material, weight,
length, height, width, metadata, variant_rank`, plus `product` (belongsTo) and `options`
(manyToMany). No `external_id`. Confirmed independently against the `CREATE TABLE
"product_variant"` DDL in `InitialSetup20240401153642.js:20`, which also omits `external_id`.

`external_id` **does** exist, but only on `Product` (`dist/models/product.js`,
`external_id: model.text().nullable()`; DDL in `InitialSetup20240401153642.js:15`) — one level up
from the variant, and with **no index of any kind** on it (Product's only indexes are on `handle`,
`type_id`, `collection_id`).

### 2. `sku` is unique at the DB level; `metadata` is not indexed

`product-variant.js` declares (and the migrations create) a **partial unique index**:

```sql
create unique index if not exists "IDX_product_variant_sku_unique"
  on "product_variant" (sku) where deleted_at is null;
```

(same pattern for `barcode`, `ean`, `upc`). So two *live* variants can never share a non-null
`sku` — but NULL skus are unconstrained, and there is no GIN or any other index on the `metadata`
jsonb column anywhere in the product module's migrations.

### 3. Medusa's own import/upsert machinery does not match by SKU

`CSVNormalizer` (`csv-normalizer.js` ~L295-315) routes a row to **update** only if the CSV has a
populated Medusa-internal `Product Id` column; otherwise it always routes to **create**, keyed by
`handle`. `sku` is copied through as plain data (`"variant sku": processAsString(...)`) but plays
no role in the create-vs-update decision. `update-products.js:37-51` hard-fails a batch update
that's missing `id`. Inside `ProductModuleService`, variant upserts use MikroORM's
`upsertWithReplace`, which matches by primary key `id` — never by `sku`.

**Conclusion: core Medusa has no SKU-based upsert path.** A caller must already know the internal
`id`, which is exactly the gap the ticket describes.

### 4. `metadata` round-trips, but isn't a queryable index

`metadata` survives create, the CSV importer (`"variant metadata"` column copied verbatim), and
the Admin API (`metadata: z.record(z.unknown()).nullish()` in product validators). However, the
Admin variant-list endpoint's own filter schema (`AdminGetProductVariantsParams`) has **no
`metadata` or `sku` filter at all** — filtering by SKU/metadata content is not a first-class query
path, and with no GIN index, any such lookup would be an unindexed scan.

### 5. Medusa's own first-party guidance

- The official Odoo ERP-sync recipe (`docs.medusajs.com/resources/recipes/erp/odoo`) — the
  closest official analog to this ticket — stores the external product ID in `Product.external_id`,
  and for variants (which have no such column) stores it in **`variant.metadata.external_id`**,
  then falls back to a manual SKU-string-equality match written in application code:
  `existingProduct.variants.find(v => v.sku === variant.code)?.id`.
- Medusa's general extensibility docs
  (`docs.medusajs.com/resources/commerce-modules/product/extend`) instead recommend **Module
  Links to a custom linked data model** when you need structured, queryable custom fields tied to
  core entities, rather than core columns or `metadata`.

## Answer

No single built-in field cleanly solves this. Concretely:

- `ProductVariant.external_id` **does not exist**.
- `Product.external_id` exists but is unindexed and lives one level above the variant.
- `ProductVariant.sku` **is** unique at the DB level (partial unique index, live rows only), and
  is the most natural home for the Catalog SKU — but Medusa provides no SKU-based upsert; the Sync
  Engine must do its own `sku → variant_id` lookup before calling the import/update workflow.
- `ProductVariant.metadata` round-trips reliably through create, the Admin API, and
  `importProductsWorkflow`'s CSV path, and is where Medusa's own Odoo recipe stores an external
  system's variant ID — so it's the right place for the **Supplier SKU** (there's no dedicated
  column for it). But it's an unindexed jsonb blob with no Admin list-filter support, so it cannot
  be efficiently queried at scale; it's fine as a read-after-write field keyed off a variant you
  already resolved by `id` or `sku`.

**Recommendation:** no dedicated custom module/table is *required* to make syncs idempotent —
`sku` (unique, indexed) is sufficient as the upsert key, with Supplier SKU stored alongside in
`variant.metadata.supplier_sku` for traceability (mirroring Medusa's own Odoo recipe). The Sync
Engine should resolve `sku → variant_id` itself (e.g. `GET /admin/products?variants[sku]=...` or
a maintained local cache) before create/update, since Medusa's core workflows will never do that
match for you. A Module-Link custom data model (Medusa's recommended pattern for structured,
indexed, queryable custom fields) would be the better long-term answer if/when the Sync Engine
needs to query the mapping at volume or needs more structure than a flat SKU + metadata blob — but
that is an upgrade, not a blocker, for the current ticket.

## Evidence index

| Claim | Source |
|---|---|
| ProductVariant field list | `@medusajs/product` `dist/models/product-variant.js` (full file) |
| No `external_id` on ProductVariant | same file; confirmed absent from `CREATE TABLE product_variant` in `InitialSetup20240401153642.js:20` |
| `external_id` on Product only, unindexed | `dist/models/product.js`; DDL `InitialSetup20240401153642.js:15` |
| Unique partial index on `sku` | `dist/models/product-variant.js:50-54`; SQL in `InitialSetup20240401153642.js:23` and `Migration20241125090957.js:34` |
| No GIN index on `metadata` | grep across all `@medusajs/product` migrations — zero `gin` matches |
| CSV import routes create/update by `Product Id`/`handle`, not `sku` | `@medusajs/utils` `dist/product/csv-normalizer.js` ~L160, ~L295-315 |
| Batch update requires `id` | `@medusajs/core-flows` `dist/product/steps/update-products.js:37-51` |
| Variant upsert matches by primary key via `upsertWithReplace` | `dist/services/product-module-service.js:170` |
| Admin variant list filter schema has no `sku`/`metadata` filter | `@medusajs/medusa` `dist/api/admin/product-variants/validators.js` |
| Odoo recipe: `Product.external_id` + `variant.metadata.external_id` + SKU fallback match | https://docs.medusajs.com/resources/recipes/erp/odoo |
| Module Links recommended for structured custom fields | https://docs.medusajs.com/resources/commerce-modules/product/extend |
