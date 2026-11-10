/**
 * Environment defaults for Medusa integration tests (@medusajs/test-utils'
 * medusaIntegrationTestRunner - see backend/src/product-catalog-sync/workflows/__tests__).
 *
 * Why this has to be a Jest `setupFiles` entry rather than a `.env.test` file loaded by this
 * repo's own `lib/constants.ts`: @medusajs/test-utils reads DB_HOST/DB_USERNAME/DB_PASSWORD off
 * `process.env` at *module import time* (see its `database.js`), which happens as soon as a spec
 * file does `import { medusaIntegrationTestRunner } from "@medusajs/test-utils"` - before
 * `medusa-config.js` (and this repo's `lib/constants.ts`, which calls Medusa's own `loadEnv()`)
 * ever gets a chance to run. Jest's `setupFiles` run before a test file's own imports, which is
 * early enough. Plain unit test files are unaffected - these are only consumed by the Medusa app
 * bootstrap, nothing here changes unit-test behavior.
 *
 * All values are test-only placeholders, safe to commit - never point this at a real database,
 * Meilisearch instance, or secret. `??=` leaves room for CI to override any of these later.
 */

process.env.NODE_ENV ??= "test"

// Postgres - matches this sandbox's local `postgres:17` container (POSTGRES_USER/PASSWORD=postgres).
process.env.DATABASE_URL ??= "postgres://postgres:postgres@localhost:5432/postgres"
process.env.DB_HOST ??= "localhost"
process.env.DB_USERNAME ??= "postgres"
process.env.DB_PASSWORD ??= "postgres"

// medusa-config.js -> lib/constants.ts requires these to be set (assertValue throws otherwise).
process.env.JWT_SECRET ??= "test-only-jwt-secret"
process.env.COOKIE_SECRET ??= "test-only-cookie-secret"

// Deliberately unset: REDIS_URL. Without it, medusa-config.js skips the Redis event-bus/workflow
// -engine modules and the framework falls back to its built-in in-memory implementations, which
// is what we want for fast, hermetic rollback/compensation tests (no Redis dependency).

// Meilisearch - enables @rokmohar/medusa-plugin-meilisearch's product subscribers (the mechanism
// issue #14's acceptance criteria asks us to prove) against an ephemeral local container that the
// integration test file itself starts/stops (see meilisearch-test-container.ts). Fixed host/port
// so medusa-config.js (evaluated once, at app-boot time, before any per-test container exists)
// always resolves to where that container will be listening.
process.env.MEILISEARCH_HOST ??= "http://127.0.0.1:7700"
process.env.MEILISEARCH_ADMIN_KEY ??= "test-only-meilisearch-master-key"
process.env.MEILISEARCH_PRODUCTS_ENABLED ??= "true"
