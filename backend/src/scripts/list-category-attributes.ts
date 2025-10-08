import { ExecArgs } from "@medusajs/framework/types"

export default async function listCategoryAttributes({ container, args }: ExecArgs) {
  const logger = container.resolve("logger")
  const query = container.resolve("query")

  const rawArgs = Array.isArray(args) ? args : []
  const cliArgs = process.argv.slice(2)
  const delimiterIndex = cliArgs.indexOf("--")
  const effectiveArgs = delimiterIndex >= 0 ? cliArgs.slice(delimiterIndex + 1) : cliArgs

  const lookupArg = (name: string) => {
    const flag = `--${name}`
    const flagIdx = rawArgs.findIndex((arg: any) => arg === flag || arg === name)
    if (flagIdx >= 0) {
      const candidate = rawArgs[flagIdx + 1]
      if (candidate && !candidate.startsWith("--")) {
        return candidate
      }
    }

    const idx = effectiveArgs.findIndex((arg) => arg === flag)
    if (idx >= 0) {
      const candidate = effectiveArgs[idx + 1]
      if (candidate && !candidate.startsWith("--")) {
        return candidate
      }
    }

    const eqArg = effectiveArgs.find((arg) => arg.startsWith(`${flag}=`))
    if (eqArg) {
      return eqArg.split("=")[1]
    }

    return undefined
  }

  const categoryId = lookupArg("category") || lookupArg("id")

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
