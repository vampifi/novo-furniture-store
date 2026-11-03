import { triggerSyncCycle } from "../sync-cycle-trigger"
import type { SyncCycleLock } from "../sync-cycle-trigger"
import type { SupplierTabDefinition } from "../sync-cycle"

/**
 * An in-memory `SyncCycleLock` fake, keyed exactly like the real implementation (one lock per
 * tab name). `acquire` resolves `false` - never queues - when the key is already held, mirroring
 * the real Medusa-Locking-module-backed lock's "skip, don't queue" contract (spec §8).
 */
function fakeLock(): SyncCycleLock {
  const held = new Set<string>()
  return {
    async acquire(tabName) {
      if (held.has(tabName)) {
        return false
      }
      held.add(tabName)
      return true
    },
    async release(tabName) {
      held.delete(tabName)
    },
  }
}

function makeTab(overrides: Partial<SupplierTabDefinition> = {}): SupplierTabDefinition {
  return {
    name: "SupplierA",
    adapter: async () => [],
    context: { uploadImage: jest.fn() },
    io: { readCurrentRows: jest.fn().mockResolvedValue({ existingRows: [], rawRows: [] }), writeBack: jest.fn() },
    ...overrides,
  }
}

describe("triggerSyncCycle", () => {
  it("runs the cycle for every registered tab when scoped to all", async () => {
    const tabA = makeTab({ name: "SupplierA" })
    const tabB = makeTab({ name: "SupplierB" })

    const results = await triggerSyncCycle(
      { tabs: "all" },
      { supplierTabs: [tabA, tabB], lock: fakeLock(), applyCanonicalProduct: jest.fn() }
    )

    expect(results).toEqual([
      { tabName: "SupplierA", outcome: "completed", result: expect.objectContaining({ tabName: "SupplierA" }) },
      { tabName: "SupplierB", outcome: "completed", result: expect.objectContaining({ tabName: "SupplierB" }) },
    ])
    expect(tabA.io.readCurrentRows).toHaveBeenCalledTimes(1)
    expect(tabB.io.readCurrentRows).toHaveBeenCalledTimes(1)
  })

  it("runs the cycle for only the named tab when scoped to one supplier", async () => {
    const tabA = makeTab({ name: "SupplierA" })
    const tabB = makeTab({ name: "SupplierB" })

    const results = await triggerSyncCycle(
      { tabs: "one", tabName: "SupplierB" },
      { supplierTabs: [tabA, tabB], lock: fakeLock(), applyCanonicalProduct: jest.fn() }
    )

    expect(results).toEqual([{ tabName: "SupplierB", outcome: "completed", result: expect.anything() }])
    expect(tabA.io.readCurrentRows).not.toHaveBeenCalled()
    expect(tabB.io.readCurrentRows).toHaveBeenCalledTimes(1)
  })

  it("reports an unknown-tab outcome, running nothing, when scoped to a tab name that isn't registered", async () => {
    const tabA = makeTab({ name: "SupplierA" })

    const results = await triggerSyncCycle(
      { tabs: "one", tabName: "DoesNotExist" },
      { supplierTabs: [tabA], lock: fakeLock(), applyCanonicalProduct: jest.fn() }
    )

    expect(results).toEqual([{ tabName: "DoesNotExist", outcome: "unknown-tab" }])
    expect(tabA.io.readCurrentRows).not.toHaveBeenCalled()
  })

  it("skips an overlapping trigger for the same tab instead of queuing it - the core acceptance criterion of issue #19", async () => {
    // Deterministic proof of the "skip, not queue" contract: a manually-controlled promise stands
    // in for a slow cycle still in flight, instead of real timers/sleeps - the second trigger call
    // is issued while the first's readCurrentRows call is deliberately still pending, so this test
    // can never flake on real-world scheduling.
    let resolveFirstRead!: (value: { existingRows: []; rawRows: [] }) => void
    const firstReadPromise = new Promise<{ existingRows: []; rawRows: [] }>((resolve) => {
      resolveFirstRead = resolve
    })
    const readCurrentRows = jest.fn().mockReturnValueOnce(firstReadPromise).mockResolvedValue({ existingRows: [], rawRows: [] })
    const tab = makeTab({
      name: "SupplierA",
      io: { readCurrentRows, writeBack: jest.fn() },
    })
    const lock = fakeLock()
    const deps = { supplierTabs: [tab], lock, applyCanonicalProduct: jest.fn() }

    // First trigger: starts the cycle, which immediately blocks on readCurrentRows (not resolved
    // yet) - the lock is held for the entire duration of this in-flight promise.
    const firstTriggerPromise = triggerSyncCycle({ tabs: "all" }, deps)

    // Second trigger: fired while the first is still mid-cycle. Must be skipped, not queued -
    // it resolves immediately rather than waiting for the first to finish.
    const secondResult = await triggerSyncCycle({ tabs: "all" }, deps)
    expect(secondResult).toEqual([{ tabName: "SupplierA", outcome: "skipped-overlap" }])

    // Only now let the first cycle actually complete.
    resolveFirstRead({ existingRows: [], rawRows: [] })
    const firstResult = await firstTriggerPromise
    expect(firstResult).toEqual([{ tabName: "SupplierA", outcome: "completed", result: expect.anything() }])

    // Lock released after the first cycle finishes - a third trigger now succeeds rather than
    // being skipped, proving the lock isn't held forever / leaked.
    const thirdResult = await triggerSyncCycle({ tabs: "all" }, deps)
    expect(thirdResult).toEqual([{ tabName: "SupplierA", outcome: "completed", result: expect.anything() }])
  })

  it("releases the lock even when the cycle throws, so a failed cycle doesn't permanently block future triggers", async () => {
    const failure = new Error("Sheets API unavailable")
    const tab = makeTab({
      name: "SupplierA",
      io: { readCurrentRows: jest.fn().mockRejectedValue(failure), writeBack: jest.fn() },
    })
    const lock = fakeLock()
    const deps = { supplierTabs: [tab], lock, applyCanonicalProduct: jest.fn() }

    const firstResult = await triggerSyncCycle({ tabs: "all" }, deps)
    expect(firstResult).toEqual([{ tabName: "SupplierA", outcome: "failed", error: failure }])

    const secondResult = await triggerSyncCycle({ tabs: "all" }, deps)
    expect(secondResult).toEqual([{ tabName: "SupplierA", outcome: "failed", error: failure }])
  })

  it("isolates one tab's overlap-skip from another tab's own cycle in the same 'all' sweep", async () => {
    const tabA = makeTab({ name: "SupplierA" })
    const tabB = makeTab({ name: "SupplierB" })
    const lock = fakeLock()
    // Pre-hold SupplierA's lock only, as if a prior cycle for that tab alone were still running.
    await lock.acquire("SupplierA")

    const results = await triggerSyncCycle(
      { tabs: "all" },
      { supplierTabs: [tabA, tabB], lock, applyCanonicalProduct: jest.fn() }
    )

    expect(results).toEqual([
      { tabName: "SupplierA", outcome: "skipped-overlap" },
      { tabName: "SupplierB", outcome: "completed", result: expect.anything() },
    ])
  })
})
