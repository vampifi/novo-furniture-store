/**
 * Pure mapping from this ticket's CanonicalProduct rows (one per variant, spec §5) to the plain
 * object shapes createProductsWorkflow/updateProductsWorkflow expect. Kept as a standalone
 * function (rather than inlined in the workflow composer) so the option-synthesis logic below has
 * a single, readable home - `transform()` just calls straight through to it.
 */
import { hashCanonicalProduct, isIncompletePlaceholderSku } from "../../row-reconciliation"
import type { CanonicalProduct } from "../../types"
import type { ProductLinkIds } from "../steps/resolve-product-links"
import type { ExistingProductOption } from "../steps/resolve-existing-product"

const DEFAULT_OPTION_TITLE = "Default option"
const DEFAULT_OPTION_VALUE = "Default option"

type VariantOptionSelection = Record<string, string>

/**
 * One product-level option slot (`{ title, values }`) per distinct Business-Owned option name
 * across every variant row, with every row contributing its value for that slot. Falls back to
 * Medusa's own single-variant convention (research notes §4: "every product needs at least one
 * option, even single-variant products") when no row has any variant options at all.
 */
function buildProductOptions(products: CanonicalProduct[]): { title: string; values: string[] }[] {
  const valuesByOptionName = new Map<string, Set<string>>()

  for (const product of products) {
    for (const option of product.variantOptions) {
      const values = valuesByOptionName.get(option.optionName) ?? new Set<string>()
      values.add(option.optionValue)
      valuesByOptionName.set(option.optionName, values)
    }
  }

  if (valuesByOptionName.size === 0) {
    return [{ title: DEFAULT_OPTION_TITLE, values: [DEFAULT_OPTION_VALUE] }]
  }

  return Array.from(valuesByOptionName.entries()).map(([title, values]) => ({
    title,
    values: Array.from(values),
  }))
}

/** This row's own selection for each product-level option slot, keyed by option title. */
function buildVariantOptionSelection(product: CanonicalProduct): VariantOptionSelection {
  if (product.variantOptions.length === 0) {
    return { [DEFAULT_OPTION_TITLE]: DEFAULT_OPTION_VALUE }
  }
  return Object.fromEntries(product.variantOptions.map((option) => [option.optionName, option.optionValue]))
}

/**
 * Metadata every variant gets, regardless of create/update - carries the Supplier SKU for
 * traceability and the whole-row idempotency hash (spec §5, §8 step 9: "On success, update
 * variant.metadata (supplier_sku, sync hash)"; ADR 0006). `hashCanonicalProduct` is recomputed
 * here rather than threaded through as a separate input: it's a pure function of `product`'s own
 * fields, and this `product` is the exact same (already-merged) row that row-reconciliation.ts
 * hashed earlier in the same cycle, so the value is identical - recomputing avoids widening this
 * function's (and therefore the whole workflow input's) signature just to pass a value that's
 * already derivable from what's already here.
 */
function buildVariantMetadata(product: CanonicalProduct): Record<string, unknown> {
  return {
    supplier_sku: product.supplierSku,
    sync_hash: hashCanonicalProduct(product),
    // Medusa 2.8 has no per-variant image relation, so these are kept for the storefront to read.
    ...(product.variantImageUrls.length > 0 ? { variant_image_urls: product.variantImageUrls } : {}),
  }
}

/**
 * ADR-0004 guard at the workflow's actual Medusa-input boundary. row-reconciliation.ts and
 * apply-ready-rows.ts both already filter placeholder-SKU rows before a product ever reaches
 * applyCanonicalProductWorkflow - but nothing inside the workflow itself enforced the invariant,
 * so calling the workflow directly (as its own integration test does) bypassed both filters
 * entirely. This is the one place both the create and update paths unconditionally pass through
 * before anything is sent to Medusa, so it's the seam that holds regardless of caller.
 */
function assertNoPlaceholderSkus(products: CanonicalProduct[]): void {
  const placeholderSkus = products.filter((product) => isIncompletePlaceholderSku(product.sku)).map((product) => product.sku)
  if (placeholderSkus.length > 0) {
    throw new Error(
      "applyCanonicalProductWorkflow: refusing to push row(s) whose SKU is still the ADR-0004 incomplete " +
        `placeholder to Medusa: ${placeholderSkus.join(", ")}`
    )
  }
}

const CURRENCY_CODE = "usd"

/** Always sent, even when empty: the Sheet decides the product's images, so a removal must land. */
function buildImages(product: CanonicalProduct): { url: string }[] {
  return product.imageUrls.map((url) => ({ url }))
}

/** CanonicalProduct models "no value" as `null` (spec §5); Medusa's own DTOs model it as
 * `undefined`. This is the one place that boundary gets crossed. */
function nullToUndefined<T>(value: T | null): T | undefined {
  return value ?? undefined
}

/** Per-variant facts. `null` is sent as-is so that blanking a Sheet cell clears the value. */
function buildVariantFacts(product: CanonicalProduct) {
  return {
    weight: product.weight,
    length: product.length,
    width: product.width,
    height: product.height,
    hs_code: product.hsCode,
    origin_country: product.originCountry,
    mid_code: product.midCode,
    upc: product.upc,
    ean: product.ean,
  }
}

export type NewProductVariantInput = ReturnType<typeof buildVariantFacts> & {
  title: string
  sku: string
  options: VariantOptionSelection
  prices: { amount: number; currency_code: string }[]
  metadata: Record<string, unknown>
}

/** Blank collection and type clear the link. A blank shipping profile leaves the current one. */
function buildProductReferences(product: CanonicalProduct) {
  return {
    collection_id: product.collectionId,
    type_id: product.typeId,
    shipping_profile_id: nullToUndefined(product.shippingProfileId),
  }
}

export type CreateProductInput = ProductLinkIds & ReturnType<typeof buildProductReferences> & {
  title: string
  handle: string
  subtitle: string | undefined
  description: string | undefined
  status: CanonicalProduct["status"]
  discountable: boolean
  images: { url: string }[]
  options: { title: string; values: string[] }[]
  variants: NewProductVariantInput[]
}

/** Representative product-level fields are read from `products[0]` - see ADR 0005 implementer notes:
 * reconciling disagreement across a product's sibling rows (spec §8) is explicitly out of scope
 * for this ticket (#14), which assumes its caller already resolved/validated that upstream. */
export function buildCreateProductInput(products: CanonicalProduct[], links: ProductLinkIds): CreateProductInput {
  assertNoPlaceholderSkus(products)
  const [representative] = products

  return {
    ...links,
    ...buildProductReferences(representative),
    title: representative.productTitle,
    handle: representative.productHandle,
    subtitle: nullToUndefined(representative.subtitle),
    description: nullToUndefined(representative.description),
    status: representative.status,
    discountable: representative.discountable,
    images: buildImages(representative),
    options: buildProductOptions(products),
    variants: products.map((product) => ({
      ...buildVariantFacts(product),
      title: product.productTitle,
      sku: product.sku,
      options: buildVariantOptionSelection(product),
      prices: [{ amount: product.retailPrice, currency_code: CURRENCY_CODE }],
      metadata: buildVariantMetadata(product),
    })),
  }
}

export type ExistingVariantInput = ReturnType<typeof buildVariantFacts> & {
  id: string
  title: string
  sku: string
  options: VariantOptionSelection
  prices: { amount: number; currency_code: string }[]
  metadata: Record<string, unknown>
}

export type UpdateProductInput = ProductLinkIds & ReturnType<typeof buildProductReferences> & {
  id: string
  title: string
  subtitle: string | undefined
  description: string | undefined
  status: CanonicalProduct["status"]
  discountable: boolean
  images: { url: string }[]
  /** Only sent when the Sheet's options differ from the product's - see buildOptionsUpdate. */
  options: { id?: string; title: string; values: string[] }[] | undefined
  variants: (ExistingVariantInput | { id: string })[]
}

/**
 * The product's complete option set as the Sheet now describes it, or `undefined` when it already
 * matches. Medusa replaces the product's options with this list (issue #28): options the Sheet
 * still names keep their id and gain any new values, options it newly names are created, and
 * options it no longer names are removed. Existing values are never dropped from a kept option,
 * since a variant outside the Sheet may still select one.
 */
function buildOptionsUpdate(
  products: CanonicalProduct[],
  existingOptions: ExistingProductOption[]
): UpdateProductInput["options"] {
  const desired = buildProductOptions(products).map(({ title, values }) => {
    const existing = existingOptions.find((option) => option.title === title)
    return existing
      ? { id: existing.id, title, values: Array.from(new Set([...existing.values, ...values])) }
      : { title, values }
  })
  const unchanged =
    desired.length === existingOptions.length &&
    desired.every((option) => {
      const existing = existingOptions.find(({ id }) => id === option.id)
      return existing !== undefined && existing.values.length === option.values.length
    })
  return unchanged ? undefined : desired
}

/**
 * Rows whose SKU isn't in `existingVariantsBySku` are left out here: they're new variants, created
 * separately from buildNewVariantsInput once this update has added their option values.
 *
 * `otherVariantIds` are listed by id alone so Medusa keeps them unchanged: its product update
 * treats `variants` as the complete set and deletes anything missing, and the sync never deletes
 * a variant (issue #22).
 */
export function buildUpdateProductInput(
  productId: string,
  products: CanonicalProduct[],
  existingVariantsBySku: { variantId: string; sku: string }[],
  otherVariantIds: string[],
  existingOptions: ExistingProductOption[],
  links: ProductLinkIds
): UpdateProductInput {
  assertNoPlaceholderSkus(products)
  const [representative] = products
  const variantIdBySku = new Map(existingVariantsBySku.map(({ sku, variantId }) => [sku, variantId]))

  return {
    ...links,
    ...buildProductReferences(representative),
    id: productId,
    title: representative.productTitle,
    subtitle: nullToUndefined(representative.subtitle),
    description: nullToUndefined(representative.description),
    status: representative.status,
    discountable: representative.discountable,
    images: buildImages(representative),
    options: buildOptionsUpdate(products, existingOptions),
    // The id-only siblings go first: Medusa 2.8's duplicate-option-combination check
    // (checkIfVariantsHaveUniqueOptionsCombinations) crashes when a variant with options is
    // compared against a later one without any, but skips cleanly when the one without comes first.
    variants: [
      ...otherVariantIds.map((id) => ({ id })),
      ...products.flatMap((product) => {
        const variantId = variantIdBySku.get(product.sku)
        return variantId
          ? [
              {
                ...buildVariantFacts(product),
                id: variantId,
                title: product.productTitle,
                sku: product.sku,
                options: buildVariantOptionSelection(product),
                prices: [{ amount: product.retailPrice, currency_code: CURRENCY_CODE }],
                metadata: buildVariantMetadata(product),
              },
            ]
          : []
      }),
    ],
  }
}

export type NewVariantForExistingProductInput = NewProductVariantInput & { product_id: string }

/** The rows whose SKU has no variant yet on this existing product (issue #23). */
export function buildNewVariantsInput(
  productId: string,
  products: CanonicalProduct[],
  existingVariantsBySku: { variantId: string; sku: string }[]
): NewVariantForExistingProductInput[] {
  assertNoPlaceholderSkus(products)
  const existingSkus = new Set(existingVariantsBySku.map(({ sku }) => sku))

  return products
    .filter((product) => !existingSkus.has(product.sku))
    .map((product) => ({
      ...buildVariantFacts(product),
      product_id: productId,
      title: product.productTitle,
      sku: product.sku,
      options: buildVariantOptionSelection(product),
      prices: [{ amount: product.retailPrice, currency_code: CURRENCY_CODE }],
      metadata: buildVariantMetadata(product),
    }))
}
