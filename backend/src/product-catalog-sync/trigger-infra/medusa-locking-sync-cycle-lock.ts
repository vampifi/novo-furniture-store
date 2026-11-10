/**
 * The real `SyncCycleLock` (sync-cycle-trigger.ts), backed by Medusa's own Locking module (issue
 * #19; spec §8: "a Redis flag, already configured").
 *
 * `acquire()` never queues - Medusa's `ILockingModule.acquire()` delegates to whichever provider
 * is configured, and both the in-memory and `locking-redis` providers already default
 * `awaitQueue` to `false`, rejecting immediately if the key is held rather than waiting for it to
 * free up. This wrapper just turns that rejection into a plain `false` return (the
 * `SyncCycleLock` contract), instead of a thrown error callers would otherwise have to catch
 * themselves.
 *
 * Requires `Modules.LOCKING` to be registered against `@medusajs/locking-redis` (see
 * medusa-config.js's `REDIS_URL`-gated module list) so the lock is shared across every server
 * instance/process, not just in-process - Medusa's own default Locking module (no explicit
 * provider configured) is in-memory only, which would NOT prevent overlap across multiple
 * instances or worker processes.
 */
import { Modules } from "@medusajs/framework/utils"
import type { ILockingModule, MedusaContainer } from "@medusajs/framework/types"
import type { SyncCycleLock } from "../sync-cycle-trigger"

const LOCK_KEY_PREFIX = "product-catalog-sync:"

function lockKeyFor(tabName: string): string {
  return `${LOCK_KEY_PREFIX}${tabName}`
}

export function createMedusaSyncCycleLock(container: MedusaContainer): SyncCycleLock {
  const lockingModule: ILockingModule = container.resolve(Modules.LOCKING)

  return {
    async acquire(tabName) {
      try {
        await lockingModule.acquire(lockKeyFor(tabName))
        return true
      } catch {
        // The key is already held (or acquisition otherwise failed) - treat it the same way
        // either way: skip this trigger rather than queue or propagate an error.
        return false
      }
    },
    async release(tabName) {
      await lockingModule.release(lockKeyFor(tabName))
    },
  }
}
