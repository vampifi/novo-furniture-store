/**
 * Starts/stops an ephemeral local MeiliSearch container for integration tests that need to prove
 * real index propagation (issue #14 AC: "A successful run is confirmed to update the MeiliSearch
 * index"). Scoped to the test file that calls it via beforeAll/afterAll - not a jest globalSetup
 * - so plain unit test runs never pay the docker-startup cost.
 *
 * Host/port/master-key must match jest.integration.setup.js's MEILISEARCH_HOST/MEILISEARCH_ADMIN_KEY,
 * since medusa-config.js reads those once at app-boot time, before this container exists.
 */
import { execFile } from "node:child_process"
import { promisify } from "node:util"

const execFileAsync = promisify(execFile)

export const MEILISEARCH_TEST_PORT = 7700
export const MEILISEARCH_TEST_MASTER_KEY = "test-only-meilisearch-master-key"
export const MEILISEARCH_TEST_HOST = `http://127.0.0.1:${MEILISEARCH_TEST_PORT}`

const CONTAINER_NAME = "product-catalog-sync-meilisearch-test"
const IMAGE = "getmeili/meilisearch:v1.10"
const HEALTH_POLL_INTERVAL_MS = 200
const HEALTH_TIMEOUT_MS = 20_000

async function waitUntilHealthy(): Promise<void> {
  const deadline = Date.now() + HEALTH_TIMEOUT_MS
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${MEILISEARCH_TEST_HOST}/health`)
      if (response.ok) {
        return
      }
    } catch {
      // Not listening yet - keep polling.
    }
    await new Promise((resolve) => setTimeout(resolve, HEALTH_POLL_INTERVAL_MS))
  }
  throw new Error(`MeiliSearch test container did not become healthy within ${HEALTH_TIMEOUT_MS}ms`)
}

/** Starts the container (removing any stale one from a previous crashed run first). Idempotent. */
export async function startMeilisearchTestContainer(): Promise<() => Promise<void>> {
  await execFileAsync("docker", ["rm", "-f", CONTAINER_NAME]).catch(() => undefined)

  await execFileAsync("docker", [
    "run",
    "-d",
    "--name",
    CONTAINER_NAME,
    "-p",
    `${MEILISEARCH_TEST_PORT}:7700`,
    "-e",
    `MEILI_MASTER_KEY=${MEILISEARCH_TEST_MASTER_KEY}`,
    "-e",
    "MEILI_NO_ANALYTICS=true",
    IMAGE,
  ])

  await waitUntilHealthy()

  return async () => {
    await execFileAsync("docker", ["rm", "-f", CONTAINER_NAME]).catch(() => undefined)
  }
}

/** Fetches a document straight from the real MeiliSearch index - the seam issue #14 asks us to prove. */
export async function fetchIndexedProductDocument(productId: string): Promise<unknown | null> {
  const response = await fetch(`${MEILISEARCH_TEST_HOST}/indexes/products/documents/${productId}`, {
    headers: { Authorization: `Bearer ${MEILISEARCH_TEST_MASTER_KEY}` },
  })
  if (response.status === 404) {
    return null
  }
  if (!response.ok) {
    throw new Error(`Unexpected MeiliSearch response ${response.status}: ${await response.text()}`)
  }
  return response.json()
}

const INDEX_POLL_INTERVAL_MS = 100
const INDEX_POLL_TIMEOUT_MS = 10_000

/**
 * MeiliSearch's `addDocuments` call is itself async (it returns a task id immediately; indexing
 * happens slightly after) - polls rather than asserting on the very first read.
 */
export async function waitForIndexedProductDocument(productId: string): Promise<unknown> {
  const deadline = Date.now() + INDEX_POLL_TIMEOUT_MS
  while (Date.now() < deadline) {
    const document = await fetchIndexedProductDocument(productId)
    if (document) {
      return document
    }
    await new Promise((resolve) => setTimeout(resolve, INDEX_POLL_INTERVAL_MS))
  }
  throw new Error(`Product ${productId} was not indexed in MeiliSearch within ${INDEX_POLL_TIMEOUT_MS}ms`)
}
