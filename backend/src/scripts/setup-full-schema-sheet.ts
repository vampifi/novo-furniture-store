/**
 * Manual verification tooling for the product-catalog-sync spec (docs/specs/
 * product-catalog-sync-architecture.md) - NOT production code, no ticket owns this. Writes the
 * full canonical schema (header + sample rows) into a sandbox Google Sheet tab, for use with
 * verify-full-schema-cycle.ts. Run via `npx medusa exec ./src/scripts/setup-full-schema-sheet.ts`,
 * against a sandbox GOOGLE_SHEETS_SPREADSHEET_ID configured in .env (see #13/#12's checklists) -
 * never point this at a production sheet.
 */
import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { loadServiceAccountConfigFromEnv, createGoogleSheetsClient } from "../lib/google-sheets"
import { HEADER_ROW } from "./verify-full-schema-cycle"

const TAB_NAME = "Sheet1"

export default async function setupFullSchemaSheet({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const sheets = createGoogleSheetsClient(loadServiceAccountConfigFromEnv())

  // Clear the old 4-column test data first, then write the full 40-column layout fresh.
  await sheets.batchWrite([{ range: `${TAB_NAME}!A1:AO20`, values: Array.from({ length: 20 }, () => Array(41).fill("")) }])

  const emptyCols = () => Array(41 - HEADER_ROW.length).fill("")

  await sheets.batchWrite([
    {
      range: `${TAB_NAME}!A1:AO4`,
      values: [
        HEADER_ROW,
        // Row 2: simple product, no options/attributes, no explicit sku/handle - let the
        // passthrough adapter derive both.
        [
          "", "", "sku-101", // handle, sku, supplierSku
          "Oak Dining Table", "", "", "", "", "", // supplierTitle, productTitle, subtitle pair, description pair
          "450.00", "899.99", // supplierCost, retailPrice
          "", "", "", "", // option 1 pair
          "", "", // images
          "", "", "", "", "", "", "", "", "", // physical facts
          "", "", "", "", "", // attribute 1
          "draft", "", "", "", "", "", "", "TRUE", // status, tags, categories, collection, type, shipping, sales channel, discountable
        ],
        // Row 3: variant with an option and a custom attribute, to exercise those code paths.
        [
          "", "", "sku-102",
          "Velvet Sofa - Blue", "", "", "", "", "",
          "650.00", "1299.00",
          "Colour", "Blue", "", "", // option 1 pair - business-owned side left blank, should seed from supplier side
          "", "",
          "", "", "", "", "", "", "", "", "",
          "material", "furniture-attrs", "Velvet", "", "TRUE", // attribute 1 - business value left blank, should seed
          "draft", "sofas, living-room", "", "", "", "", "", "TRUE",
        ],
        // Row 4: deliberately invalid - no title anywhere, to confirm rejection still works
        // against the full schema, not just the 4-field fixture shape.
        [
          "", "", "sku-103",
          "", "", "", "", "", "",
          "", "199.99",
          "", "", "", "",
          "", "",
          "", "", "", "", "", "", "", "", "",
          "", "", "", "", "",
          "draft", "", "", "", "", "", "", "TRUE",
        ],
      ],
    },
  ])

  logger.info(`Wrote full-schema header + 3 sample rows to ${TAB_NAME}!A1:AO4`)
}
