# Supplier Tab rows are one row per variant, not one row per product

A product with multiple variants (e.g. a sofa in three fabrics) needs to fit into a flat spreadsheet tab somehow. The two natural options are one row per product with repeated "Variant N" column groups, or one row per variant with a shared product-level grouping key across rows.

We chose **one row per variant**, grouped by a shared Product Handle — the same convention Medusa's own native product CSV import already uses. Each row carries its own SKU, price, options, and images; several rows sharing a Handle are understood as variants of one product.

Mirroring Medusa's own layout means the canonical schema stays aligned with the format it ultimately feeds into, rather than inventing a flattening convention (repeated column groups per row) that would need to be un-flattened again before reaching Medusa. It also means a product's variant count is unbounded without a schema change — a repeated-column-group design would need to pick a maximum up front.
