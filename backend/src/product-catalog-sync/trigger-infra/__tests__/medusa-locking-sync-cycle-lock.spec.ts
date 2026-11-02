import type { ILockingModule, MedusaContainer } from "@medusajs/framework/types"
import { createMedusaSyncCycleLock } from "../medusa-locking-sync-cycle-lock"

function fakeContainer(lockingModule: Partial<ILockingModule>): MedusaContainer {
  return { resolve: jest.fn().mockReturnValue(lockingModule) } as unknown as MedusaContainer
}

describe("createMedusaSyncCycleLock", () => {
  it("resolves true when the underlying Locking module acquires the key without queuing", async () => {
    const acquire = jest.fn().mockResolvedValue(undefined)
    const container = fakeContainer({ acquire })

    const lock = createMedusaSyncCycleLock(container)
    const acquired = await lock.acquire("SupplierA")

    expect(acquired).toBe(true)
    expect(acquire).toHaveBeenCalledTimes(1)
    const [key, args] = acquire.mock.calls[0]
    expect(key).toBe("product-catalog-sync:SupplierA")
    // Must never request `awaitQueue` - that's precisely the "skip, don't queue" contract this
    // wrapper exists to guarantee (Medusa's own ILockingModule.acquire() has no awaitQueue option
    // at this level, but the providers underneath already default to non-queuing; this asserts
    // this wrapper doesn't opt back into queuing via any other means, e.g. by not passing any
    // extra args object at all).
    expect(args).toBeUndefined()
  })

  it("resolves false - never throws, never queues - when the underlying module's acquire rejects because the key is already held", async () => {
    const acquire = jest.fn().mockRejectedValue(new Error('Failed to acquire lock for key "product-catalog-sync:SupplierA"'))
    const container = fakeContainer({ acquire })

    const lock = createMedusaSyncCycleLock(container)
    const acquired = await lock.acquire("SupplierA")

    expect(acquired).toBe(false)
  })

  it("releases the same namespaced key it acquired", async () => {
    const release = jest.fn().mockResolvedValue(true)
    const container = fakeContainer({ release })

    const lock = createMedusaSyncCycleLock(container)
    await lock.release("SupplierA")

    expect(release).toHaveBeenCalledWith("product-catalog-sync:SupplierA")
  })

  it("namespaces different tab names to different lock keys", async () => {
    const acquire = jest.fn().mockResolvedValue(undefined)
    const container = fakeContainer({ acquire })
    const lock = createMedusaSyncCycleLock(container)

    await lock.acquire("SupplierA")
    await lock.acquire("SupplierB")

    expect(acquire.mock.calls[0][0]).toBe("product-catalog-sync:SupplierA")
    expect(acquire.mock.calls[1][0]).toBe("product-catalog-sync:SupplierB")
  })
})
