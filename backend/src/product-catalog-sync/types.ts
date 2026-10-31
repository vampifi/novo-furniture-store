/**
 * The Supplier Adapter contract (spec §6) and the canonical schema every Supplier Adapter
 * produces (spec §5). This module is the shared interface only - individual adapters (one per
 * real supplier) are future work; see docs/specs/product-catalog-sync-architecture.md.
 *
 * Deliberately framework-free: no Medusa or Google Sheets types anywhere in this file, so any
 * future adapter can be written and unit-tested with zero infrastructure.
 */

/** Medusa's own product status union (ProductStatus, @medusajs/types) - reused rather than
 * redefined, since a CanonicalProduct's `status` ultimately becomes a Medusa product's status. */
export type CanonicalProductStatus = "draft" | "proposed" | "published" | "rejected"

/** One slot of a paired, repeatable variant-option column group (spec §5, "Variant options"). */
export interface CanonicalVariantOption {
  /** Owned by: Adapter. Refreshed every sync. */
  supplierOptionName: string
  /** Owned by: Adapter. Refreshed every sync. */
  supplierOptionValue: string
  /** Owned by: Business. Seeded once from supplierOptionName, then frozen. */
  optionName: string
  /** Owned by: Business. Seeded once from supplierOptionValue, then frozen. */
  optionValue: string
}

/** One slot of a repeatable custom-attribute column group (spec §5, "Custom Attributes"). */
export interface CanonicalCustomAttribute {
  /** Owned by: Adapter. References an existing category-level Custom Attribute definition. */
  attributeKey: string
  /** Owned by: Adapter. Reference only. */
  attributeCategoryId: string
  /** Owned by: Adapter. Refreshed every sync. */
  supplierAttributeValue: string
  /** Owned by: Business. Seeded once from supplierAttributeValue, then frozen. */
  attributeValue: string
  /** Owned by: Business. Whether to show this spec to customers. */
  attributeVisible: boolean
}

/**
 * The common product representation every supplier's data is converted into (GLOSSARY.md:
 * "Canonical Product"). One row per *variant* (ADR 0003), matching spec §5 field-for-field.
 *
 * "Owned by" on each field follows the Adapter-Owned / Business-Owned split (GLOSSARY.md,
 * spec §3): Adapter-Owned fields are refreshed every sync cycle; Business-Owned fields are set
 * once by the Adapter at row creation (as a sensible seed default, per spec §6
 * "Statelessness"), then belong to the business owner from then on.
 */
export interface CanonicalProduct {
  // --- Product grouping ---
  /** Owned by: Business. Set once at creation, frozen after. */
  productHandle: string

  // --- Per-row (= per-variant) identity ---
  /**
   * Owned by: Business. The Medusa upsert key. Deterministic default
   * `<first 3 letters of supplier name>_<sanitized supplier sku>` (see validation.ts
   * buildDefaultSku), or the ADR-0004 incomplete placeholder when there is no Supplier SKU.
   */
  sku: string
  /**
   * Owned by: Adapter. Refreshed every sync; stored in `variant.metadata.supplier_sku` once
   * applied to Medusa. `null` when the supplier provides no code for this row (ADR 0004) - no
   * automatic identity matching is attempted in that case.
   */
  supplierSku: string | null

  // --- Presentational copy (paired) ---
  /** Owned by: Adapter. */
  supplierTitle: string
  /** Owned by: Business. Seeded once from supplierTitle, then frozen. */
  productTitle: string
  /** Owned by: Adapter. */
  supplierSubtitle: string | null
  /** Owned by: Business. Seeded once from supplierSubtitle, then frozen. */
  subtitle: string | null
  /** Owned by: Adapter. */
  supplierDescription: string | null
  /** Owned by: Business. Seeded once from supplierDescription, then frozen. */
  description: string | null

  // --- Pricing ---
  /** Owned by: Adapter. Sheet-only - never pushed to Medusa. */
  supplierCost: number | null
  /** Owned by: Business. The actual Medusa/storefront price. */
  retailPrice: number

  // --- Variant options (paired, one entry per option slot) ---
  variantOptions: CanonicalVariantOption[]

  // --- Images ---
  /** Owned by: Adapter, uploaded via AdapterContext.uploadImage. Product-level, repeatable. */
  imageUrls: string[]
  /** Owned by: Adapter, uploaded via AdapterContext.uploadImage. Falls back to imageUrls when empty. */
  variantImageUrls: string[]

  // --- Physical/compliance facts (single-column, Adapter-Owned) ---
  weight: number | null
  length: number | null
  width: number | null
  height: number | null
  hsCode: string | null
  originCountry: string | null
  midCode: string | null
  upc: string | null
  ean: string | null

  // --- Custom Attributes (one entry per attribute slot) ---
  customAttributes: CanonicalCustomAttribute[]

  // --- Merchandising decisions (single-column, Business-Owned, no supplier counterpart) ---
  /** Owned by: Business. Defaults to "draft" on row creation. */
  status: CanonicalProductStatus
  productTags: string[]
  productCategories: string[]
  collectionId: string | null
  typeId: string | null
  shippingProfileId: string | null
  salesChannel: string | null
  discountable: boolean
}

/** One raw record from Pack Extraction - format-agnostic by design (spec §6). */
export type RawRow = Record<string, string | number | null>

/** Capabilities injected into a Supplier Adapter so it never hardcodes storage (spec §6). */
export interface AdapterContext {
  /** Uploads `sourceRef` (whatever the raw row points at) and returns the final hosted URL. */
  uploadImage(sourceRef: string): Promise<string>
}

/**
 * The result of translating one raw row into a Canonical Product (spec §6). Every row's result
 * is fully independent, even siblings of the same product (spec §6, "Row/variant
 * independence").
 *
 * Deviation from the spec's literal code block: the failure branch here is named `anchor`
 * rather than `supplierSku`, because ADR 0004 / spec §6 ("Error anchoring") require this value
 * to sometimes hold a *batch-position* fallback instead of an actual Supplier SKU when none
 * exists - keeping the field named `supplierSku` while it sometimes holds non-SKU text would be
 * misleading. Behavior matches the spec exactly; only this one field name differs.
 */
export type AdapterRowResult =
  | { ok: true; product: CanonicalProduct }
  | { ok: false; anchor: string; error: string }

/** The per-supplier translator: structured rows -> Canonical Products (spec §6). */
export type SupplierAdapter = (rows: RawRow[], context: AdapterContext) => Promise<AdapterRowResult[]>
