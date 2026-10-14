import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { syncProductsWorkflow } from "@rokmohar/medusa-plugin-meilisearch/.medusa/server/src/workflows/sync-products";

export default async function reindexMeilisearch({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);

  logger.info("Starting MeiliSearch product reindex...");

  const {
    result: { products },
  } = await syncProductsWorkflow(container).run({ input: {} });

  logger.info(`Reindexed ${products.length} products into MeiliSearch`);
}
