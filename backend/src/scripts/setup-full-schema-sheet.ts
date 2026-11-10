/**
 * Manual verification tooling for the product-catalog-sync spec (docs/specs/
 * product-catalog-sync-architecture.md) - NOT production code, no ticket owns this. Writes the
 * full canonical schema (header + sample rows) into a sandbox Google Sheet tab, for use with
 * verify-full-schema-cycle.ts. Run via `pnpm medusa exec ./src/scripts/setup-full-schema-sheet.ts`,
 * against a sandbox GOOGLE_SHEETS_SPREADSHEET_ID configured in .env (see #13/#12's checklists) -
 * never point this at a production sheet.
 */
import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { loadServiceAccountConfigFromEnv, createGoogleSheetsClient } from "../lib/google-sheets"
import { HEADER_ROW, LAST_COLUMN, sampleRow } from "./verify-full-schema-cycle"

const TAB_NAME = "Sheet1"
const CLEARED_ROWS = 30

const physicalFacts = {
  weight: "18", length: "80", width: "30", height: "180",
  hsCode: "940360", originCountry: "GB", midCode: "GBNOVO123",
}

const bookcase = {
  ...physicalFacts,
  productHandle: "walnut-bookcase",
  supplierTitle: "Walnut Bookcase",
  supplierSubtitle: "Solid timber shelving",
  supplierDescription: "A five-shelf bookcase.",
  supplierOption1Name: "Colour",
  supplierOption2Name: "Size",
  imageUrl1: "https://example.com/images/walnut-bookcase-front.jpg",
  imageUrl2: "https://example.com/images/walnut-bookcase-side.jpg",
  imageUrl3: "https://example.com/images/walnut-bookcase-detail.jpg",
  status: "draft",
  productTags: "storage, living-room",
  productCategories: "merch",
  salesChannel: "Default Sales Channel",
  discountable: "TRUE",
}

const sideTable = {
  productHandle: "side-table",
  supplierTitle: "Side Table",
  supplierOption1Name: "Size",
  status: "draft",
  discountable: "TRUE",
}

const buildSampleRows = (references: Record<string, string>) => [
  // Simple product, no options/attributes, no explicit sku/handle - the passthrough adapter
  // derives both.
  sampleRow({
    supplierSku: "sku-101", supplierTitle: "Oak Dining Table", supplierCost: "450.00", retailPrice: "899.99",
    status: "draft", discountable: "TRUE",
  }),
  // One option and a custom attribute, with business-owned sides blank so they seed.
  sampleRow({
    supplierSku: "sku-102", supplierTitle: "Velvet Sofa - Blue", supplierCost: "650.00", retailPrice: "1299.00",
    supplierOption1Name: "Colour", supplierOption1Value: "Blue",
    attribute1Key: "material", attribute1CategoryId: "furniture-attrs", supplierAttribute1Value: "Velvet", attribute1Visible: "TRUE",
    status: "draft", productTags: "sofas, living-room", discountable: "TRUE",
  }),
  // Deliberately invalid - no title anywhere, to confirm rejection against the full schema.
  sampleRow({ supplierSku: "sku-103", retailPrice: "199.99", status: "draft", discountable: "TRUE" }),
  // One product with three variants across two option slots and three product images.
  sampleRow({ ...bookcase, ...references, variantImageUrl: "https://example.com/images/walnut-small.jpg", upc: "012345678201", ean: "5012345678201", supplierSku: "sku-201", supplierCost: "150", retailPrice: "299.00", supplierOption1Value: "Walnut", supplierOption2Value: "Small" }),
  sampleRow({ ...bookcase, ...references, variantImageUrl: "https://example.com/images/walnut-large.jpg", upc: "012345678202", ean: "5012345678202", supplierSku: "sku-202", supplierCost: "200", retailPrice: "399.00", supplierOption1Value: "Walnut", supplierOption2Value: "Large" }),
  sampleRow({ ...bookcase, ...references, variantImageUrl: "https://example.com/images/oak-large.jpg", upc: "012345678203", ean: "5012345678203", supplierSku: "sku-203", supplierCost: "190", retailPrice: "379.00", supplierOption1Value: "Oak", supplierOption2Value: "Large" }),
  // Sibling disagreement: the last row's title dissents, so only it is flagged by name and the
  // whole product stays out of Medusa (spec §8 majority rule).
  sampleRow({ ...sideTable, supplierSku: "sku-301", supplierCost: "40", retailPrice: "89.00", supplierOption1Value: "Small" }),
  sampleRow({ ...sideTable, supplierSku: "sku-302", supplierCost: "50", retailPrice: "99.00", supplierOption1Value: "Medium" }),
  sampleRow({ ...sideTable, supplierSku: "sku-303", supplierCost: "60", retailPrice: "109.00", supplierOption1Value: "Large", productTitle: "Side Table XL" }),
]

export default async function setupFullSchemaSheet({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const productModule = container.resolve(Modules.PRODUCT)
  const sheets = createGoogleSheetsClient(loadServiceAccountConfigFromEnv())

  // The sample rows reference real Medusa records, so "every column populated" can actually sync.
  const collection =
    (await productModule.listProductCollections({ title: "Sheet Test Collection" }))[0] ??
    (await productModule.createProductCollections([{ title: "Sheet Test Collection" }]))[0]
  const type =
    (await productModule.listProductTypes({ value: "Sheet Test Type" }))[0] ??
    (await productModule.createProductTypes([{ value: "Sheet Test Type" }]))[0]
  const { data: shippingProfiles } = await query.graph({ entity: "shipping_profile", fields: ["id"] })
  const SAMPLE_ROWS = buildSampleRows({
    collectionId: collection.id,
    typeId: type.id,
    shippingProfileId: shippingProfiles[0].id,
  })

  // Clear earlier test data first, then write the full layout fresh.
  await sheets.batchWrite([
    {
      range: `${TAB_NAME}!A1:${LAST_COLUMN}${CLEARED_ROWS}`,
      values: Array.from({ length: CLEARED_ROWS }, () => Array(HEADER_ROW.length).fill("")),
    },
  ])

  const lastRow = SAMPLE_ROWS.length + 1
  await sheets.batchWrite([{ range: `${TAB_NAME}!A1:${LAST_COLUMN}${lastRow}`, values: [HEADER_ROW, ...SAMPLE_ROWS] }])

  logger.info(`Wrote full-schema header + ${SAMPLE_ROWS.length} sample rows to ${TAB_NAME}!A1:${LAST_COLUMN}${lastRow}`)
}
