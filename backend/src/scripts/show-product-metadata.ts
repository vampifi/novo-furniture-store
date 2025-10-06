import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import type { IProductModuleService } from "@medusajs/framework/types"

export default async function showProductMetadata({ container, args }: ExecArgs) {
  const logger = container.resolve("logger")
  const productService: IProductModuleService = container.resolve(Modules.PRODUCT)

  const rawArgs = Array.isArray(args) ? args : []
  const cliArgs = process.argv.slice(2)
  const delimiterIndex = cliArgs.indexOf("--")
  const effectiveArgs = delimiterIndex >= 0 ? cliArgs.slice(delimiterIndex + 1) : cliArgs

  const lookupArg = (name: string) => {
    const index = rawArgs.findIndex((arg: any) => arg === name)
    if (index >= 0) {
      return rawArgs[index + 1]
    }

    const flag = `--${name}`
    const idx = effectiveArgs.findIndex((arg) => arg === flag)
    if (idx >= 0) {
      return effectiveArgs[idx + 1]
    }

    const eqArg = effectiveArgs.find((arg) => arg.startsWith(`${flag}=`))
    if (eqArg) {
      return eqArg.split("=")[1]
    }

    return undefined
  }

  const productId = lookupArg("product") || lookupArg("id")
  const handle = lookupArg("handle")

  if (!productId && !handle) {
    logger.error("Provide --product <id> or --handle <handle>")
    return
  }

  const product = productId
    ? await productService.retrieveProduct(productId, {
        relations: ["categories"],
        select: ["id", "title", "handle", "metadata"],
      })
    : (await productService.listProducts(
        { handle },
        {
          relations: ["categories"],
          select: ["id", "title", "handle", "metadata"],
        }
      ))[0]

  if (!product) {
    logger.error("Product not found")
    return
  }

  logger.info(`Product ${product.id} (${product.handle}) metadata:`)
  logger.info(JSON.stringify(product.metadata, null, 2))
  const categories = (product.categories || [])
    .map((c: any) => {
      const name = c.name ? ` (${c.name})` : ""
      return `${c.id}${name}`
    })
    .join(", ")

  logger.info(`Categories: ${categories || "-"}`)
}
