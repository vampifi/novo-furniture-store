/**
 * Starts/stops an ephemeral local MeiliSearch container for integration tests that need to prove
 * real index propagation (issue #14 AC: "A successful run is confirmed to update the MeiliSearch
 * index"). Scoped to the test file that calls it via beforeAll/afterAll - not a jest globalSetup
 * - so plain unit test runs never pay the docker-startup cost.
 *
 * Each call gets its own randomly-named container on a Docker-assigned free host port (`-p
 * 0:7700`, port read back via `docker port`). This matters because multiple spec files
 * (apply-canonical-product.integration.spec.ts, apply-ready-rows.integration.spec.ts) call this
 * concurrently under Jest's default parallel workers - a shared hardcoded name/port previously
 * caused "container name already in use" races (see git history).
 *
 * The resolved host is written to `process.env.MEILISEARCH_HOST` before this function returns,
 * because medusa-config.js reads that env var -> `lib/constants.ts` once the Medusa app boots
 * (inside @medusajs/test-utils' `medusaIntegrationTestRunner`). That boot happens in a *nested*
 * `describe`'s `beforeAll`, which Jest always runs after the *outer* describe's `beforeAll` in the
 * same spec file - and every caller here registers this call in an outer `beforeAll`, before
 * invoking `medusaIntegrationTestRunner`. So by the time the app boots and medusa-config.js is
 * evaluated, this container's real address is already in `process.env`.
 * jest.integration.setup.js's static `MEILISEARCH_HOST` default exists only to satisfy code that
 * might read it earlier than that (there currently is none); this call's value always wins.
 */
import { execFile } from "node:child_process"
import { randomBytes } from "node:crypto"
import { promisify } from "node:util"

const execFileAsync = promisify(execFile)

export const MEILISEARCH_TEST_MASTER_KEY = "test-only-meilisearch-master-key"

const CONTAINER_IMAGE = "getmeili/meilisearch:v1.10"
const CONTAINER_PORT = 7700
const HEALTH_POLL_INTERVAL_MS = 200
const HEALTH_TIMEOUT_MS = 20_000
const INDEX_POLL_INTERVAL_MS = 100
const INDEX_POLL_TIMEOUT_MS = 10_000

/** A running, isolated MeiliSearch test instance - one per `startMeilisearchTestContainer()` call. */
export interface MeilisearchTestContainer {
  /** The dynamically-assigned address this instance is reachable on, e.g. "http://127.0.0.1:54321". */
  readonly host: string
  readonly masterKey: string
  /** Fetches a document straight from this instance's real MeiliSearch index. */
  fetchIndexedProductDocument(productId: string): Promise<unknown | null>
  /**
   * MeiliSearch's `addDocuments` call is itself async (it returns a task id immediately; indexing
   * happens slightly after) - polls rather than asserting on the very first read.
   */
  waitForIndexedProductDocument(productId: string): Promise<unknown>
  /** Stops and removes this instance's container. Safe to call even if startup failed partway. */
  stop(): Promise<void>
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function uniqueContainerName(): string {
  const workerId = process.env.JEST_WORKER_ID ?? "0"
  const suffix = randomBytes(4).toString("hex")
  return `product-catalog-sync-meilisearch-test-w${workerId}-${suffix}`
}

async function resolveAssignedHostPort(containerName: string): Promise<number> {
  const { stdout } = await execFileAsync("docker", ["port", containerName, `${CONTAINER_PORT}/tcp`])
  const firstBinding = stdout.trim().split("\n")[0] ?? ""
  const port = Number(firstBinding.split(":").pop())
  if (!Number.isInteger(port)) {
    throw new Error(`Could not parse assigned host port for container "${containerName}" from: "${stdout}"`)
  }
  return port
}

async function waitUntilHealthy(host: string): Promise<void> {
  const deadline = Date.now() + HEALTH_TIMEOUT_MS
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${host}/health`)
      if (response.ok) {
        return
      }
    } catch {
      // Not listening yet - keep polling.
    }
    await sleep(HEALTH_POLL_INTERVAL_MS)
  }
  throw new Error(`MeiliSearch test container did not become healthy within ${HEALTH_TIMEOUT_MS}ms`)
}

async function fetchIndexedProductDocument(host: string, productId: string): Promise<unknown | null> {
  const response = await fetch(`${host}/indexes/products/documents/${productId}`, {
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

async function waitForIndexedProductDocument(host: string, productId: string): Promise<unknown> {
  const deadline = Date.now() + INDEX_POLL_TIMEOUT_MS
  while (Date.now() < deadline) {
    const document = await fetchIndexedProductDocument(host, productId)
    if (document) {
      return document
    }
    await sleep(INDEX_POLL_INTERVAL_MS)
  }
  throw new Error(`Product ${productId} was not indexed in MeiliSearch within ${INDEX_POLL_TIMEOUT_MS}ms`)
}

/** Starts an isolated container instance. See module docs above for the env-var wiring this does. */
export async function startMeilisearchTestContainer(): Promise<MeilisearchTestContainer> {
  const containerName = uniqueContainerName()

  await execFileAsync("docker", [
    "run",
    "-d",
    "--name",
    containerName,
    "-p",
    `0:${CONTAINER_PORT}`,
    "-e",
    `MEILI_MASTER_KEY=${MEILISEARCH_TEST_MASTER_KEY}`,
    "-e",
    "MEILI_NO_ANALYTICS=true",
    CONTAINER_IMAGE,
  ])

  const stop = async (): Promise<void> => {
    await execFileAsync("docker", ["rm", "-f", containerName]).catch(() => undefined)
  }

  try {
    const port = await resolveAssignedHostPort(containerName)
    const host = `http://127.0.0.1:${port}`
    process.env.MEILISEARCH_HOST = host

    await waitUntilHealthy(host)

    return {
      host,
      masterKey: MEILISEARCH_TEST_MASTER_KEY,
      fetchIndexedProductDocument: (productId: string) => fetchIndexedProductDocument(host, productId),
      waitForIndexedProductDocument: (productId: string) => waitForIndexedProductDocument(host, productId),
      stop,
    }
  } catch (error) {
    await stop()
    throw error
  }
}
