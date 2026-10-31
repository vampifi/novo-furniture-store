/**
 * A throwaway, test-only Supplier Adapter - NOT a real supplier integration. It exists purely
 * to prove the SupplierAdapter contract (types.ts) and shared validation helpers
 * (validation.ts) actually compose into working adapter behavior, per issue #11's acceptance
 * criteria: a valid row -> {ok: true}, an invalid row with a Supplier SKU -> {ok: false}
 * anchored to it, and a row with no Supplier SKU -> {ok: true} with the ADR-0004 placeholder
 * SKU.
 *
 * Expected raw row shape (arbitrary, invented for this fixture only):
 *   { supplierSku?: string | null, title?: string, price?: number, imageRef?: string }
 */
import { anchorForRow, buildDefaultSku, isNonEmptyString, isPositiveNumber, slugify } from "../validation"
import type { AdapterContext, AdapterRowResult, CanonicalProduct, RawRow, SupplierAdapter } from "../types"

const SUPPLIER_NAME = "Fixture Supplier"

function readSupplierSku(row: RawRow): string | null {
  return isNonEmptyString(row.supplierSku) ? row.supplierSku.trim() : null
}

function readTitle(row: RawRow): string | null {
  return isNonEmptyString(row.title) ? row.title : null
}

function readPrice(row: RawRow): number | null {
  return isPositiveNumber(row.price) ? row.price : null
}

async function toAdapterRowResult(
  row: RawRow,
  batchPosition: number,
  context: AdapterContext
): Promise<AdapterRowResult> {
  const supplierSku = readSupplierSku(row)
  const title = readTitle(row)
  const price = readPrice(row)

  if (title === null) {
    return { ok: false, anchor: anchorForRow({ supplierSku, batchPosition }), error: "Title is required" }
  }
  if (price === null) {
    return {
      ok: false,
      anchor: anchorForRow({ supplierSku, batchPosition }),
      error: "Price must be a positive number",
    }
  }

  const imageUrls = isNonEmptyString(row.imageRef) ? [await context.uploadImage(row.imageRef)] : []

  const product: CanonicalProduct = {
    productHandle: slugify(title),
    sku: buildDefaultSku(SUPPLIER_NAME, supplierSku),
    supplierSku,
    supplierTitle: title,
    productTitle: title,
    supplierSubtitle: null,
    subtitle: null,
    supplierDescription: null,
    description: null,
    supplierCost: null,
    retailPrice: price,
    variantOptions: [],
    imageUrls,
    variantImageUrls: [],
    weight: null,
    length: null,
    width: null,
    height: null,
    hsCode: null,
    originCountry: null,
    midCode: null,
    upc: null,
    ean: null,
    customAttributes: [],
    status: "draft",
    productTags: [],
    productCategories: [],
    collectionId: null,
    typeId: null,
    shippingProfileId: null,
    salesChannel: null,
    discountable: true,
  }

  return { ok: true, product }
}

export const fixtureSupplierAdapter: SupplierAdapter = async (rows, context) => {
  return Promise.all(rows.map((row, batchPosition) => toAdapterRowResult(row, batchPosition, context)))
}
