/**
 * Applies a product's custom attribute values (spec §7: "create the category-level definition if
 * needed, then create/update the product-level value"), with compensation precise enough to
 * avoid a gotcha found during implementation research in the installed
 * @linearcommerce/product-custom-attributes@0.0.5 package:
 *
 *   createProductCustomAttributeWorkflow's own compensate function deletes ALL
 *   `product_custom_attribute` rows for a `product_id` - not just the one row it created
 *   (node_modules/@linearcommerce/product-custom-attributes/.medusa/server/src/workflows/steps/create-product-custom-attributes.js).
 *   If this step instead composed that workflow once per attribute via `.runAsStep()`, an earlier
 *   attribute's rollback (triggered by a *later* attribute failing in the same apply call) would
 *   also wipe out any OTHER attributes already sitting on that product from a previous,
 *   already-committed sync cycle - collateral damage far outside what this call touched.
 *
 * This step sidesteps the gotcha entirely by never calling that workflow (or its update/compiled
 * sibling). It talks to the product-custom-attributes module service directly and tracks exactly
 * which rows *it* created or modified in `applied`, so both the in-invoke rollback (on a later
 * attribute in the same call failing) and the step's own `compensate` (on a later *step* in the
 * workflow failing, e.g. nothing downstream today, but keeps this step composable) touch only
 * those rows - never a blanket `{ product_id }` delete.
 */
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { CanonicalCustomAttribute } from "../../types"

/** Registration key for @linearcommerce/product-custom-attributes' module service - the package
 * exports it as `PRODUCT_CUSTOM_ATTRIBUTES_MODULE` from its own (not cleanly importable from
 * application code - see implementation notes §2) `modules/product-custom-attributes/index.ts`. */
const PRODUCT_CUSTOM_ATTRIBUTES_MODULE = "product_custom_attributes"

export type ApplyCustomAttributesStepInput = {
  productId: string
  attributes: CanonicalCustomAttribute[]
}

export type ApplyCustomAttributesStepOutput = {
  appliedCount: number
}

type CreatedAttribute = { wasCreated: true; id: string }
type UpdatedAttribute = { wasCreated: false; id: string; previousValue: string; previousIsVisible: boolean }
type AppliedAttribute = CreatedAttribute | UpdatedAttribute

function wasNewlyCreated(entry: AppliedAttribute): entry is CreatedAttribute {
  return entry.wasCreated
}

interface ProductCustomAttributeModuleService {
  createCategoryCustomAttributes(data: { category_id: string; key: string; label: string }[]): Promise<{ id: string }[]>
  createProductCustomAttributes(
    data: { product_id: string; category_custom_attribute_id: string; value: string; is_visible: boolean }[]
  ): Promise<{ id: string }[]>
  updateProductCustomAttributes(data: { id: string; value: string; is_visible: boolean }[]): Promise<unknown>
  deleteProductCustomAttributes(ids: string[]): Promise<unknown>
}

async function resolveCategoryCustomAttributeId(
  query: ReturnType<typeof resolveQuery>,
  svc: ProductCustomAttributeModuleService,
  attribute: CanonicalCustomAttribute
): Promise<string> {
  if (!attribute.attributeCategoryId) {
    throw new Error(`Custom attribute "${attribute.attributeKey}" is missing its category id`)
  }

  const { data: existing } = await query.graph({
    entity: "category_custom_attribute",
    fields: ["id"],
    filters: { category_id: attribute.attributeCategoryId, key: attribute.attributeKey },
  })

  if (existing[0]) {
    return existing[0].id as string
  }

  const [created] = await svc.createCategoryCustomAttributes([
    { category_id: attribute.attributeCategoryId, key: attribute.attributeKey, label: attribute.attributeKey },
  ])
  return created.id
}

/** Scoped rollback: undoes only `applied` - never a `{ product_id }`-wide delete (see module doc). */
async function revertApplied(svc: ProductCustomAttributeModuleService, applied: AppliedAttribute[]): Promise<void> {
  const createdIds = applied.filter(wasNewlyCreated).map((entry) => entry.id)
  if (createdIds.length > 0) {
    await svc.deleteProductCustomAttributes(createdIds)
  }

  const updatedEntries = applied.filter((entry): entry is UpdatedAttribute => !wasNewlyCreated(entry))
  for (const entry of updatedEntries) {
    await svc.updateProductCustomAttributes([
      { id: entry.id, value: entry.previousValue, is_visible: entry.previousIsVisible },
    ])
  }
}

function resolveQuery(container: { resolve: (key: string) => any }) {
  return container.resolve(ContainerRegistrationKeys.QUERY)
}

export const applyCustomAttributesStep = createStep(
  "apply-custom-attributes",
  async (
    { productId, attributes }: ApplyCustomAttributesStepInput,
    { container }
  ): Promise<StepResponse<ApplyCustomAttributesStepOutput, AppliedAttribute[]>> => {
    const svc: ProductCustomAttributeModuleService = container.resolve(PRODUCT_CUSTOM_ATTRIBUTES_MODULE)
    const query = resolveQuery(container)

    const applied: AppliedAttribute[] = []

    try {
      for (const attribute of attributes) {
        if (!attribute.attributeKey) {
          throw new Error("Custom attribute is missing its key")
        }

        const categoryCustomAttributeId = await resolveCategoryCustomAttributeId(query, svc, attribute)

        const { data: existingProductAttributes } = await query.graph({
          entity: "product_custom_attributes",
          fields: ["id", "value", "is_visible"],
          filters: { product_id: productId, category_custom_attribute_id: categoryCustomAttributeId },
        })

        const existing = existingProductAttributes[0] as { id: string; value: string; is_visible: boolean } | undefined

        if (existing) {
          applied.push({
            wasCreated: false,
            id: existing.id,
            previousValue: existing.value,
            previousIsVisible: existing.is_visible,
          })
          await svc.updateProductCustomAttributes([
            { id: existing.id, value: attribute.attributeValue, is_visible: attribute.attributeVisible },
          ])
        } else {
          const [createdRow] = await svc.createProductCustomAttributes([
            {
              product_id: productId,
              category_custom_attribute_id: categoryCustomAttributeId,
              value: attribute.attributeValue,
              is_visible: attribute.attributeVisible,
            },
          ])
          applied.push({ wasCreated: true, id: createdRow.id })
        }
      }
    } catch (error) {
      // Undo exactly what THIS invocation applied so far, before re-throwing so the orchestrator
      // compensates the preceding product-creation/update step too.
      await revertApplied(svc, applied)
      throw error
    }

    return new StepResponse({ appliedCount: applied.length }, applied)
  },
  async (applied, { container }) => {
    if (!applied) {
      return
    }
    const svc: ProductCustomAttributeModuleService = container.resolve(PRODUCT_CUSTOM_ATTRIBUTES_MODULE)
    await revertApplied(svc, applied)
  }
)
