import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import type { IProductModuleService } from "@medusajs/framework/types"
import { startMeilisearchTestContainer, waitForIndexedProductDocument } from "../../test-support/meilisearch-test-container"
import { buildCanonicalProduct, buildCustomAttribute, nextTestSku } from "../../test-support/canonical-product-fixture"
import { applyCanonicalProductWorkflow } from "../apply-canonical-product"

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
  let stopMeilisearch: () => Promise<void>

  beforeAll(async () => {
    stopMeilisearch = await startMeilisearchTestContainer()
  })

  afterAll(async () => {
    await stopMeilisearch()
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

          const indexedDocument = (await waitForIndexedProductDocument(result.productId)) as {
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
