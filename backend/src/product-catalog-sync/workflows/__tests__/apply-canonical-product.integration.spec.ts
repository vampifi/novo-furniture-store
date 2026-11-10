import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import type { IProductModuleService } from "@medusajs/framework/types"
import { startMeilisearchTestContainer } from "../../test-support/meilisearch-test-container"
import type { MeilisearchTestContainer } from "../../test-support/meilisearch-test-container"
import {
  buildCanonicalProduct,
  buildCustomAttribute,
  buildVariantOption,
  nextTestSku,
} from "../../test-support/canonical-product-fixture"
import { hashCanonicalProduct } from "../../row-reconciliation"
import type { CanonicalProduct } from "../../types"
import { applyCanonicalProductWorkflow } from "../apply-canonical-product"
import { createMedusaReferenceChecker } from "../../trigger-infra/medusa-reference-checker"

jest.setTimeout(120000)

/**
 * Jest's `expect(promise).rejects.toThrow()` is unreliable here - confirmed (by awaiting the
 * workflow run directly and inspecting the outcome) that the promise genuinely rejects with the
 * expected Error, yet `.rejects` sometimes reports "did not throw" anyway. Likely a Promise-realm
 * mismatch from running Jest under `--experimental-vm-modules` (required for
 * @medusajs/test-utils' own dynamic imports - see jest.integration.setup.js). Awaiting manually
 * and asserting on settlement sidesteps the matcher entirely.
 */
async function expectWorkflowRunToReject(runPromise: Promise<unknown>): Promise<void> {
  const settled = await runPromise.then(
    () => ({ rejected: false }),
    () => ({ rejected: true })
  )
  expect(settled.rejected).toBe(true)
}

describe("applyCanonicalProductWorkflow", () => {
  let meilisearch: MeilisearchTestContainer

  beforeAll(async () => {
    meilisearch = await startMeilisearchTestContainer()
  })

  afterAll(async () => {
    await meilisearch.stop()
  })

  medusaIntegrationTestRunner({
    moduleName: "apply-canonical-product",
    testSuite: ({ getContainer }) => {
      describe("create path", () => {
        it("creates a new Medusa product and variant when no existing SKU matches", async () => {
          const container = getContainer()
          const sku = nextTestSku()
          const canonicalProduct = buildCanonicalProduct({
            sku,
            productTitle: "Oak Dining Table",
            retailPrice: 499,
          })

          const { result } = await applyCanonicalProductWorkflow(container).run({
            input: { products: [canonicalProduct] },
          })

          const productModuleService: IProductModuleService = container.resolve(Modules.PRODUCT)
          const product = await productModuleService.retrieveProduct(result.productId, {
            relations: ["variants"],
          })

          expect(product.title).toBe("Oak Dining Table")
          expect(product.variants).toHaveLength(1)
          expect(product.variants?.[0]?.sku).toBe(sku)
        })
      })

      describe("update path", () => {
        it("updates the existing Medusa product in place when its SKU already matches a variant", async () => {
          const container = getContainer()
          const sku = nextTestSku()

          const { result: firstRun } = await applyCanonicalProductWorkflow(container).run({
            input: { products: [buildCanonicalProduct({ sku, productTitle: "Oak Dining Table", retailPrice: 499 })] },
          })

          const { result: secondRun } = await applyCanonicalProductWorkflow(container).run({
            input: {
              products: [buildCanonicalProduct({ sku, productTitle: "Oak Dining Table (Refurbished)", retailPrice: 349 })],
            },
          })

          expect(secondRun.productId).toBe(firstRun.productId)

          const productModuleService: IProductModuleService = container.resolve(Modules.PRODUCT)
          const allProducts = await productModuleService.listProducts({}, { relations: ["variants"] })

          expect(allProducts).toHaveLength(1)
          expect(allProducts[0].title).toBe("Oak Dining Table (Refurbished)")
          expect(allProducts[0].variants).toHaveLength(1)
          expect(allProducts[0].variants?.[0]?.sku).toBe(sku)
        })

        it("leaves variants it wasn't given in place, with their prices and options (issue #22)", async () => {
          const container = getContainer()
          const productHandle = "walnut-bookcase"
          const [skuA, skuB, skuC] = [nextTestSku(), nextTestSku(), nextTestSku()]
          const variant = (sku: string, size: string, retailPrice: number) =>
            buildCanonicalProduct({
              sku,
              productHandle,
              retailPrice,
              variantOptions: [buildVariantOption({ optionName: "Size", optionValue: size })],
            })

          await applyCanonicalProductWorkflow(container).run({
            input: { products: [variant(skuA, "S", 299), variant(skuB, "M", 399), variant(skuC, "L", 379)] },
          })

          await applyCanonicalProductWorkflow(container).run({ input: { products: [variant(skuB, "M", 449)] } })

          const query = container.resolve(ContainerRegistrationKeys.QUERY)
          const { data: variants } = await query.graph({
            entity: "product_variant",
            fields: ["sku", "prices.amount", "options.value"],
          })
          const summary = variants
            .map((v) => ({
              sku: v.sku,
              prices: (v.prices ?? []).map((price) => price?.amount),
              options: (v.options ?? []).map((option) => option?.value),
            }))
            .sort((a, b) => [skuA, skuB, skuC].indexOf(a.sku as string) - [skuA, skuB, skuC].indexOf(b.sku as string))

          expect(summary).toEqual([
            { sku: skuA, prices: [299], options: ["S"] },
            { sku: skuB, prices: [449], options: ["M"] },
            { sku: skuC, prices: [379], options: ["L"] },
          ])
        })
      })

      describe("adding a variant to an existing product (issue #23)", () => {
        const sizeVariant = (sku: string, size: string, retailPrice: number) =>
          buildCanonicalProduct({
            sku,
            productHandle: "oak-wardrobe",
            retailPrice,
            variantOptions: [buildVariantOption({ optionName: "Size", optionValue: size })],
          })

        const summarizeVariants = async (container: ReturnType<typeof getContainer>) => {
          const query = container.resolve(ContainerRegistrationKeys.QUERY)
          const { data: variants } = await query.graph({
            entity: "product_variant",
            fields: ["sku", "product_id", "prices.amount", "options.value", "inventory_items.inventory_item_id"],
          })
          return variants
            .map((v) => ({
              size: v.options?.[0]?.value,
              price: v.prices?.[0]?.amount,
              hasInventoryItem: (v.inventory_items?.length ?? 0) > 0,
              productId: v.product_id,
            }))
            .sort((a, b) => (a.price as number) - (b.price as number))
        }

        it("adds a new variant with a new option value alongside the rows it arrived with", async () => {
          const container = getContainer()
          const [small, medium, large] = [nextTestSku(), nextTestSku(), nextTestSku()]

          const { result } = await applyCanonicalProductWorkflow(container).run({
            input: { products: [sizeVariant(small, "S", 100), sizeVariant(medium, "M", 200)] },
          })
          await applyCanonicalProductWorkflow(container).run({
            input: { products: [sizeVariant(small, "S", 100), sizeVariant(medium, "M", 200), sizeVariant(large, "L", 300)] },
          })

          expect(await summarizeVariants(container)).toEqual([
            { size: "S", price: 100, hasInventoryItem: true, productId: result.productId },
            { size: "M", price: 200, hasInventoryItem: true, productId: result.productId },
            { size: "L", price: 300, hasInventoryItem: true, productId: result.productId },
          ])
        })

        it("finds the product by handle when the new row is the only one it's given", async () => {
          const container = getContainer()
          const [small, large] = [nextTestSku(), nextTestSku()]

          const { result } = await applyCanonicalProductWorkflow(container).run({
            input: { products: [sizeVariant(small, "S", 100)] },
          })
          await applyCanonicalProductWorkflow(container).run({ input: { products: [sizeVariant(large, "L", 300)] } })

          expect(await summarizeVariants(container)).toEqual([
            { size: "S", price: 100, hasInventoryItem: true, productId: result.productId },
            { size: "L", price: 300, hasInventoryItem: true, productId: result.productId },
          ])
        })
      })

      describe("images (issue #24)", () => {
        const productImageUrls = async (container: ReturnType<typeof getContainer>, productId: string) => {
          const query = container.resolve(ContainerRegistrationKeys.QUERY)
          const { data } = await query.graph({ entity: "product", fields: ["images.url", "images.rank"], filters: { id: productId } })
          return [...(data[0].images ?? [])].sort((a, b) => (a?.rank ?? 0) - (b?.rank ?? 0)).map((image) => image?.url)
        }

        it("applies product images in sheet order, and reflects a later reorder and removal", async () => {
          const container = getContainer()
          const sku = nextTestSku()
          const [front, side, detail] = ["front", "side", "detail"].map((name) => `https://example.com/${name}.jpg`)

          const { result } = await applyCanonicalProductWorkflow(container).run({
            input: { products: [buildCanonicalProduct({ sku, imageUrls: [front, side, detail] })] },
          })
          expect(await productImageUrls(container, result.productId)).toEqual([front, side, detail])

          await applyCanonicalProductWorkflow(container).run({
            input: { products: [buildCanonicalProduct({ sku, imageUrls: [detail, front] })] },
          })
          expect(await productImageUrls(container, result.productId)).toEqual([detail, front])
        })

        it("keeps each variant's own image in its metadata", async () => {
          const container = getContainer()
          const [a, b] = [nextTestSku(), nextTestSku()]
          const row = (sku: string, size: string, url: string) =>
            buildCanonicalProduct({
              sku,
              productHandle: "two-images",
              variantImageUrls: [url],
              variantOptions: [buildVariantOption({ optionValue: size })],
            })

          await applyCanonicalProductWorkflow(container).run({
            input: { products: [row(a, "S", "https://example.com/s.jpg"), row(b, "L", "https://example.com/l.jpg")] },
          })

          const query = container.resolve(ContainerRegistrationKeys.QUERY)
          const { data } = await query.graph({ entity: "product_variant", fields: ["sku", "metadata"], filters: { sku: [a, b] } })
          const urlsBySku = Object.fromEntries(data.map((v) => [v.sku, (v.metadata as Record<string, unknown>).variant_image_urls]))
          expect(urlsBySku).toEqual({ [a]: ["https://example.com/s.jpg"], [b]: ["https://example.com/l.jpg"] })
        })
      })

      describe("weight and dimensions (issue #26)", () => {
        it("gives each variant its own values, and applies later changes and blanks", async () => {
          const container = getContainer()
          const [a, b] = [nextTestSku(), nextTestSku()]
          const row = (sku: string, size: string, facts: Partial<CanonicalProduct>) =>
            buildCanonicalProduct({ sku, productHandle: "measured", variantOptions: [buildVariantOption({ optionValue: size })], ...facts })

          await applyCanonicalProductWorkflow(container).run({
            input: {
              products: [
                row(a, "S", { weight: 12, length: 80, width: 30, height: 100 }),
                row(b, "L", { weight: 20, length: 90, width: 40, height: 180 }),
              ],
            },
          })
          await applyCanonicalProductWorkflow(container).run({
            input: {
              products: [
                row(a, "S", { weight: 15, length: 80, width: 30, height: null }),
                row(b, "L", { weight: 20, length: 90, width: 40, height: 180 }),
              ],
            },
          })

          const query = container.resolve(ContainerRegistrationKeys.QUERY)
          const { data } = await query.graph({
            entity: "product_variant",
            fields: ["sku", "weight", "length", "width", "height"],
            filters: { sku: [a, b] },
          })
          expect(Object.fromEntries(data.map(({ sku, ...facts }) => [sku, facts]))).toEqual({
            [a]: expect.objectContaining({ weight: 15, length: 80, width: 30, height: null }),
            [b]: expect.objectContaining({ weight: 20, length: 90, width: 40, height: 180 }),
          })
        })
      })

      describe("tags and categories (issue #25)", () => {
        const productLinks = async (container: ReturnType<typeof getContainer>, productId: string) => {
          const query = container.resolve(ContainerRegistrationKeys.QUERY)
          const { data } = await query.graph({
            entity: "product",
            fields: ["tags.value", "categories.handle"],
            filters: { id: productId },
          })
          return {
            tags: (data[0].tags ?? []).map((tag) => tag?.value).sort(),
            categories: (data[0].categories ?? []).map((category) => category?.handle).sort(),
          }
        }

        it("creates missing tags, reuses existing ones, and reflects a removal", async () => {
          const container = getContainer()
          const [skuA, skuB] = [nextTestSku(), nextTestSku()]

          const { result } = await applyCanonicalProductWorkflow(container).run({
            input: { products: [buildCanonicalProduct({ sku: skuA, productTags: ["oak", "storage"] })] },
          })
          await applyCanonicalProductWorkflow(container).run({
            input: { products: [buildCanonicalProduct({ sku: skuB, productTags: ["oak"] })] },
          })
          expect((await productLinks(container, result.productId)).tags).toEqual(["oak", "storage"])

          const productModuleService: IProductModuleService = container.resolve(Modules.PRODUCT)
          expect(await productModuleService.listProductTags({ value: ["oak"] })).toHaveLength(1)

          await applyCanonicalProductWorkflow(container).run({
            input: { products: [buildCanonicalProduct({ sku: skuA, productTags: ["storage"] })] },
          })
          expect((await productLinks(container, result.productId)).tags).toEqual(["storage"])
        })

        it("assigns existing categories by handle, and reflects a removal", async () => {
          const container = getContainer()
          const sku = nextTestSku()
          const productModuleService: IProductModuleService = container.resolve(Modules.PRODUCT)
          await productModuleService.createProductCategories([
            { name: "Sofas", handle: "sofas", is_active: true },
            { name: "Living Room", handle: "living-room", is_active: true },
          ])

          const { result } = await applyCanonicalProductWorkflow(container).run({
            input: { products: [buildCanonicalProduct({ sku, productCategories: ["sofas", "living-room"] })] },
          })
          expect((await productLinks(container, result.productId)).categories).toEqual(["living-room", "sofas"])

          await applyCanonicalProductWorkflow(container).run({
            input: { products: [buildCanonicalProduct({ sku, productCategories: ["sofas"] })] },
          })
          expect((await productLinks(container, result.productId)).categories).toEqual(["sofas"])
        })

        it("reports categories that don't exist, per product", async () => {
          const container = getContainer()
          const productModuleService: IProductModuleService = container.resolve(Modules.PRODUCT)
          await productModuleService.createProductCategories([{ name: "Sofas", handle: "sofas", is_active: true }])
          const findUnresolvedReferences = createMedusaReferenceChecker(container)

          const unresolved = await findUnresolvedReferences([
            buildCanonicalProduct({ productHandle: "known", productCategories: ["sofas"] }),
            buildCanonicalProduct({ productHandle: "unknown", productCategories: ["sofas", "beds"] }),
          ])

          expect(Array.from(unresolved.entries())).toEqual([["unknown", ['Category "beds" doesn\'t exist in Medusa']]])
        })
      })

      describe("remaining canonical columns (issue #27)", () => {
        const createReferences = async (container: ReturnType<typeof getContainer>) => {
          const productModule: IProductModuleService = container.resolve(Modules.PRODUCT)
          const [collection] = await productModule.createProductCollections([{ title: "Autumn" }])
          const [type] = await productModule.createProductTypes([{ value: "Bookcase" }])
          const shippingProfile = await container
            .resolve(Modules.FULFILLMENT)
            .createShippingProfiles({ name: "Bulky", type: "default" })
          const salesChannel = await container.resolve(Modules.SALES_CHANNEL).createSalesChannels({ name: "Web" })
          return { collection, type, shippingProfile, salesChannel }
        }

        it("applies compliance codes to each variant", async () => {
          const container = getContainer()
          const sku = nextTestSku()

          await applyCanonicalProductWorkflow(container).run({
            input: {
              products: [
                buildCanonicalProduct({ sku, hsCode: "940360", originCountry: "GB", midCode: "MID1", upc: "012345678905", ean: "5012345678900" }),
              ],
            },
          })

          const query = container.resolve(ContainerRegistrationKeys.QUERY)
          const { data } = await query.graph({
            entity: "product_variant",
            fields: ["hs_code", "origin_country", "mid_code", "upc", "ean"],
            filters: { sku },
          })
          expect(data[0]).toEqual(
            expect.objectContaining({ hs_code: "940360", origin_country: "GB", mid_code: "MID1", upc: "012345678905", ean: "5012345678900" })
          )
        })

        it("applies collection, type, shipping profile and sales channel to the product", async () => {
          const container = getContainer()
          const { collection, type, shippingProfile, salesChannel } = await createReferences(container)

          const { result } = await applyCanonicalProductWorkflow(container).run({
            input: {
              products: [
                buildCanonicalProduct({
                  collectionId: collection.id,
                  typeId: type.id,
                  shippingProfileId: shippingProfile.id,
                  salesChannel: "Web",
                }),
              ],
            },
          })

          const query = container.resolve(ContainerRegistrationKeys.QUERY)
          const { data } = await query.graph({
            entity: "product",
            fields: ["collection_id", "type_id", "shipping_profile.id", "sales_channels.id"],
            filters: { id: result.productId },
          })
          expect(data[0].collection_id).toBe(collection.id)
          expect(data[0].type_id).toBe(type.id)
          expect((data[0] as unknown as { shipping_profile: { id: string } }).shipping_profile.id).toBe(shippingProfile.id)
          expect((data[0].sales_channels ?? []).map((channel) => channel?.id)).toEqual([salesChannel.id])
        })

        it("reports collections, types, shipping profiles and sales channels that don't exist", async () => {
          const container = getContainer()
          const { collection, type, shippingProfile } = await createReferences(container)
          const findUnresolvedReferences = createMedusaReferenceChecker(container)

          const unresolved = await findUnresolvedReferences([
            buildCanonicalProduct({
              productHandle: "all-known",
              collectionId: collection.id,
              typeId: type.id,
              shippingProfileId: shippingProfile.id,
              salesChannel: "Web",
            }),
            buildCanonicalProduct({
              productHandle: "all-unknown",
              collectionId: "pcol_missing",
              typeId: "ptyp_missing",
              shippingProfileId: "sp_missing",
              salesChannel: "Nope",
            }),
          ])

          expect(Array.from(unresolved.entries())).toEqual([
            [
              "all-unknown",
              [
                'Collection "pcol_missing" doesn\'t exist in Medusa',
                'Type "ptyp_missing" doesn\'t exist in Medusa',
                'Shipping Profile "sp_missing" doesn\'t exist in Medusa',
                'Sales Channel "Nope" doesn\'t exist in Medusa',
              ],
            ],
          ])
        })
      })

      describe("custom attributes", () => {
        it("creates the category definition and product-level value for a new attribute", async () => {
          const container = getContainer()
          const sku = nextTestSku()
          const categoryId = "cat_test_material"

          const { result } = await applyCanonicalProductWorkflow(container).run({
            input: {
              products: [
                buildCanonicalProduct({
                  sku,
                  customAttributes: [
                    buildCustomAttribute({
                      attributeKey: "material",
                      attributeCategoryId: categoryId,
                      attributeValue: "Oak",
                      attributeVisible: true,
                    }),
                  ],
                }),
              ],
            },
          })

          const query = container.resolve(ContainerRegistrationKeys.QUERY)
          const { data: categoryAttributes } = await query.graph({
            entity: "category_custom_attribute",
            fields: ["id", "key", "category_id"],
            filters: { category_id: categoryId, key: "material" },
          })
          expect(categoryAttributes).toHaveLength(1)

          const { data: productAttributes } = await query.graph({
            entity: "product_custom_attributes",
            fields: ["id", "value", "is_visible", "product_id"],
            filters: { product_id: result.productId },
          })
          expect(productAttributes).toHaveLength(1)
          expect(productAttributes[0].value).toBe("Oak")
          expect(productAttributes[0].is_visible).toBe(true)
        })
      })

      describe("rollback", () => {
        it("rolls back the newly-created product when a custom-attribute step fails", async () => {
          const container = getContainer()
          const sku = nextTestSku()
          const canonicalProduct = buildCanonicalProduct({
            sku,
            customAttributes: [buildCustomAttribute({ attributeKey: "" })], // deliberately invalid
          })

          await expectWorkflowRunToReject(
            applyCanonicalProductWorkflow(container).run({ input: { products: [canonicalProduct] } })
          )

          const query = container.resolve(ContainerRegistrationKeys.QUERY)
          const { data: variants } = await query.graph({
            entity: "product_variant",
            fields: ["id"],
            filters: { sku },
          })
          expect(variants).toHaveLength(0)

          const { data: products } = await query.graph({
            entity: "product",
            fields: ["id"],
            filters: { handle: canonicalProduct.productHandle },
          })
          expect(products).toHaveLength(0)
        })

        it(
          "undoes only the attribute it created on this call, leaving an unrelated pre-existing " +
            "attribute (from an earlier, already-committed sync cycle) untouched - the exact " +
            "scenario the upstream package's product_id-wide compensation would get wrong",
          async () => {
            const container = getContainer()
            const sku = nextTestSku()
            const query = container.resolve(ContainerRegistrationKeys.QUERY)

            // Cycle 1: establishes a pre-existing attribute ("material") that must survive
            // whatever happens on a later, unrelated sync cycle for the same product.
            const { result: firstRun } = await applyCanonicalProductWorkflow(container).run({
              input: {
                products: [
                  buildCanonicalProduct({
                    sku,
                    productTitle: "Oak Dining Table",
                    customAttributes: [
                      buildCustomAttribute({
                        attributeKey: "material",
                        attributeCategoryId: "cat_test_material",
                        attributeValue: "Oak",
                      }),
                    ],
                  }),
                ],
              },
            })

            const { data: materialBefore } = await query.graph({
              entity: "product_custom_attributes",
              fields: ["id", "value"],
              filters: { product_id: firstRun.productId },
            })
            expect(materialBefore).toHaveLength(1)
            const materialAttributeId = materialBefore[0].id

            // Cycle 2: same product, a NEW valid attribute ("finish") that succeeds, followed by
            // a deliberately-invalid one - this is the multi-attribute case where an earlier
            // attribute in *this* call succeeds before a later one fails.
            await expectWorkflowRunToReject(
              applyCanonicalProductWorkflow(container).run({
                input: {
                  products: [
                    buildCanonicalProduct({
                      sku,
                      productTitle: "Updated Title That Should Be Rolled Back",
                      customAttributes: [
                        buildCustomAttribute({
                          attributeKey: "finish",
                          attributeCategoryId: "cat_test_finish",
                          attributeValue: "Matte",
                        }),
                        buildCustomAttribute({ attributeKey: "" }), // deliberately invalid
                      ],
                    }),
                  ],
                },
              })
            )

            // The whole second-cycle workflow rolled back: title reverts (updateProductsWorkflow's
            // own compensation)...
            const productModuleService: IProductModuleService = container.resolve(Modules.PRODUCT)
            const product = await productModuleService.retrieveProduct(firstRun.productId)
            expect(product.title).toBe("Oak Dining Table")

            // ...the newly-created "finish" attribute from *this* call is gone...
            const { data: finishCategoryAttributes } = await query.graph({
              entity: "category_custom_attribute",
              fields: ["id"],
              filters: { category_id: "cat_test_finish", key: "finish" },
            })
            const finishCategoryAttributeId = finishCategoryAttributes[0]?.id
            const { data: finishProductAttributes } = await query.graph({
              entity: "product_custom_attributes",
              fields: ["id"],
              filters: { product_id: firstRun.productId, category_custom_attribute_id: finishCategoryAttributeId },
            })
            expect(finishProductAttributes).toHaveLength(0)

            // ...but the pre-existing "material" attribute from cycle 1 is completely untouched -
            // this is the assertion that would fail if this workflow instead composed the
            // upstream createProductCustomAttributeWorkflow directly (its compensation deletes
            // every product_custom_attribute row for the product_id, not just the one it made).
            const { data: materialAfter } = await query.graph({
              entity: "product_custom_attributes",
              fields: ["id", "value"],
              filters: { id: materialAttributeId },
            })
            expect(materialAfter).toHaveLength(1)
            expect(materialAfter[0].value).toBe("Oak")
          }
        )
      })

      describe("ADR 0004 placeholder-SKU guard", () => {
        it(
          "rejects a placeholder-SKU product even when the workflow is called directly, bypassing the " +
            "two callers (row-reconciliation.ts, apply-ready-rows.ts) that normally filter it out first",
          async () => {
            const container = getContainer()
            const handle = `needs-a-sku-${nextTestSku()}`
            const placeholderProduct = buildCanonicalProduct({
              productHandle: handle,
              sku: "acm_",
              supplierSku: null,
            })

            await expectWorkflowRunToReject(
              applyCanonicalProductWorkflow(container).run({ input: { products: [placeholderProduct] } })
            )

            const query = container.resolve(ContainerRegistrationKeys.QUERY)
            const { data: products } = await query.graph({
              entity: "product",
              fields: ["id"],
              filters: { handle },
            })
            expect(products).toHaveLength(0)
          }
        )
      })

      describe("variant.metadata hash persistence (spec §8 step 9)", () => {
        it(
          "persists the Adapter-Owned-fields sync hash to variant.metadata on a real create, " +
            "readable back via a real Medusa query - not just present in a hand-built test fixture",
          async () => {
            const container = getContainer()
            const sku = nextTestSku()
            const canonicalProduct = buildCanonicalProduct({ sku, supplierSku: "SUP-HASH-1" })

            await applyCanonicalProductWorkflow(container).run({
              input: { products: [canonicalProduct] },
            })

            const query = container.resolve(ContainerRegistrationKeys.QUERY)
            const { data: variants } = await query.graph({
              entity: "product_variant",
              fields: ["id", "sku", "metadata"],
              filters: { sku },
            })

            expect(variants).toHaveLength(1)
            expect(variants[0].metadata?.sync_hash).toBe(hashCanonicalProduct(canonicalProduct))
          }
        )
      })

      describe("MeiliSearch propagation", () => {
        it("indexes a successfully-applied, published product in the real MeiliSearch instance", async () => {
          const container = getContainer()
          const sku = nextTestSku()

          const { result } = await applyCanonicalProductWorkflow(container).run({
            input: {
              products: [
                buildCanonicalProduct({
                  sku,
                  productTitle: "Searchable Oak Dining Table",
                  status: "published", // the plugin's upsert step only indexes published products
                }),
              ],
            },
          })

          const indexedDocument = (await meilisearch.waitForIndexedProductDocument(result.productId)) as {
            id: string
            title: string
          }

          expect(indexedDocument.id).toBe(result.productId)
          expect(indexedDocument.title).toBe("Searchable Oak Dining Table")
        })
      })
    },
  })
})
