import { fixtureSupplierAdapter } from "../__fixtures__/fixture-supplier-adapter"
import type { AdapterContext, RawRow } from "../types"

function fakeContext(): AdapterContext {
  return {
    uploadImage: jest.fn(async (sourceRef: string) => `https://cdn.example.com/${sourceRef}`),
  }
}

describe("fixtureSupplierAdapter", () => {
  it("produces {ok: true} with a Canonical Product for a valid row", async () => {
    const row: RawRow = {
      supplierSku: "ABC-123",
      title: "Oak Dining Table",
      price: 499.99,
    }

    const [result] = await fixtureSupplierAdapter([row], fakeContext())

    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        product: expect.objectContaining({
          supplierSku: "ABC-123",
          sku: "fix_abc-123",
          productTitle: "Oak Dining Table",
          retailPrice: 499.99,
          status: "draft",
        }),
      })
    )
  })

  it("produces {ok: false} anchored to the Supplier SKU for an invalid row that has one", async () => {
    const row: RawRow = {
      supplierSku: "ABC-123",
      title: "Oak Dining Table",
      price: -1, // implausible: price must be positive
    }

    const [result] = await fixtureSupplierAdapter([row], fakeContext())

    expect(result).toEqual({
      ok: false,
      anchor: "ABC-123",
      error: "Price must be a positive number",
    })
  })

  it("produces {ok: true} with the ADR-0004 incomplete-placeholder SKU for a row with no Supplier SKU", async () => {
    const row: RawRow = {
      supplierSku: null,
      title: "Unbranded Side Table",
      price: 89,
    }

    const [result] = await fixtureSupplierAdapter([row], fakeContext())

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.product.supplierSku).toBeNull()
      expect(result.product.sku).toBe("fix_")
    }
  })

  it("every row's result is independent, even across a mixed batch (spec §6 row/variant independence)", async () => {
    const rows: RawRow[] = [
      { supplierSku: "ABC-123", title: "Oak Dining Table", price: 499.99 },
      { supplierSku: "DEF-456", title: "", price: 199 }, // invalid: missing title
      { supplierSku: null, title: "Unbranded Side Table", price: 89 },
    ]

    const results = await fixtureSupplierAdapter(rows, fakeContext())

    expect(results).toHaveLength(3)
    expect(results[0].ok).toBe(true)
    expect(results[1]).toEqual({ ok: false, anchor: "DEF-456", error: "Title is required" })
    expect(results[2].ok).toBe(true)
  })

  it("uploads images via the injected AdapterContext rather than hardcoding storage (spec §6)", async () => {
    const context = fakeContext()
    const row: RawRow = {
      supplierSku: "ABC-123",
      title: "Oak Dining Table",
      price: 499.99,
      imageRef: "oak-table.jpg",
    }

    const [result] = await fixtureSupplierAdapter([row], context)

    expect(context.uploadImage).toHaveBeenCalledWith("oak-table.jpg")
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.product.imageUrls).toEqual(["https://cdn.example.com/oak-table.jpg"])
    }
  })
})
