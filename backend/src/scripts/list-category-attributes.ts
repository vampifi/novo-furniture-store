import { ExecArgs } from "@medusajs/framework/types"

export default async function listCategoryAttributes({ container, args }: ExecArgs) {
  const logger = container.resolve("logger")
  const query = container.resolve("query")

  const categoryId = args?.category || args?.id

  if (!categoryId) {
    logger.error("Provide --category <category_id>")
    return
  }

  const { data } = await query.graph({
    entity: "category_custom_attribute",
    fields: ["id", "key", "label", "category_id"],
    filters: {
      category_id: categoryId,
    },
  })

  logger.info(`Category ${categoryId} attributes:`)
  logger.info(JSON.stringify(data, null, 2))
}
