/**
 * Pure mapping from this ticket's CanonicalProduct rows (one per variant, spec §5) to the plain
 * object shapes createProductsWorkflow/updateProductsWorkflow expect. Kept as a standalone
 * function (rather than inlined in the workflow composer) so the option-synthesis logic below has
 * a single, readable home - `transform()` just calls straight through to it.
 */
import type { CanonicalProduct } from "../../types"

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
 * traceability (spec §5) and is also the only place idempotency-hash storage (spec §8) would
 * hook in, if/when that's built.
 */
function buildVariantMetadata(product: CanonicalProduct): Record<string, unknown> {
  return { supplier_sku: product.supplierSku }
}

const CURRENCY_CODE = "usd"

/** CanonicalProduct models "no value" as `null` (spec §5); Medusa's own DTOs model it as
 * `undefined`. This is the one place that boundary gets crossed. */
function nullToUndefined<T>(value: T | null): T | undefined {
  return value ?? undefined
}

export type NewProductVariantInput = {
  title: string
  sku: string
  options: VariantOptionSelection
  prices: { amount: number; currency_code: string }[]
  metadata: Record<string, unknown>
}

export type CreateProductInput = {
  title: string
  handle: string
  subtitle: string | undefined
  description: string | undefined
  status: CanonicalProduct["status"]
  discountable: boolean
  options: { title: string; values: string[] }[]
  variants: NewProductVariantInput[]
}

/** Representative product-level fields are read from `products[0]` - see ADR 0005 implementer notes:
 * reconciling disagreement across a product's sibling rows (spec §8) is explicitly out of scope
 * for this ticket (#14), which assumes its caller already resolved/validated that upstream. */
export function buildCreateProductInput(products: CanonicalProduct[]): CreateProductInput {
  const [representative] = products

  return {
    title: representative.productTitle,
    handle: representative.productHandle,
    subtitle: nullToUndefined(representative.subtitle),
    description: nullToUndefined(representative.description),
    status: representative.status,
    discountable: representative.discountable,
    options: buildProductOptions(products),
    variants: products.map((product) => ({
      title: product.productTitle,
      sku: product.sku,
      options: buildVariantOptionSelection(product),
      prices: [{ amount: product.retailPrice, currency_code: CURRENCY_CODE }],
      metadata: buildVariantMetadata(product),
    })),
  }
}

export type ExistingVariantInput = {
  id: string
  title: string
  sku: string
  prices: { amount: number; currency_code: string }[]
  metadata: Record<string, unknown>
}

export type UpdateProductInput = {
  id: string
  title: string
  subtitle: string | undefined
  description: string | undefined
  status: CanonicalProduct["status"]
  discountable: boolean
  variants: ExistingVariantInput[]
}

/**
 * `existingVariantsBySku` must cover every row in `products` (callers only take the update branch
 * once resolveExistingProductStep confirms every incoming SKU already has a variant id - adding a
 * new variant to an existing product via this same call is out of scope for this ticket).
 */
export function buildUpdateProductInput(
  productId: string,
  products: CanonicalProduct[],
  existingVariantsBySku: { variantId: string; sku: string }[]
): UpdateProductInput {
  const [representative] = products
  const variantIdBySku = new Map(existingVariantsBySku.map(({ sku, variantId }) => [sku, variantId]))

  return {
    id: productId,
    title: representative.productTitle,
    subtitle: nullToUndefined(representative.subtitle),
    description: nullToUndefined(representative.description),
    status: representative.status,
    discountable: representative.discountable,
    variants: products.map((product) => {
      const variantId = variantIdBySku.get(product.sku)
      if (!variantId) {
        throw new Error(`No existing variant id resolved for SKU "${product.sku}" during update`)
      }
      return {
        id: variantId,
        title: product.productTitle,
        sku: product.sku,
        prices: [{ amount: product.retailPrice, currency_code: CURRENCY_CODE }],
        metadata: buildVariantMetadata(product),
      }
    }),
  }
}
