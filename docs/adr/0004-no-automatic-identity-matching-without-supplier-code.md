# No automatic identity matching when a Supplier Pack provides no product code

Some suppliers provide no code of any kind per product — sometimes only a title, an image, and a color, with other details (price, material, dimensions) left for the business owner to gather separately or invent outright. Without a code, there's no reliable way for software to know whether an incoming row is a new product or an edit to one already synced.

We decided **not** to attempt automatic matching for these rows — no content fingerprinting on title, no row-order assumptions. The Supplier Adapter extracts whatever fields are present, leaves the rest blank, and seeds the `SKU` field with an incomplete placeholder (`<first 3 letters of supplier name>_`, nothing after it) rather than a fully-derived value. Matching such a row to an existing product, if it is one, is left entirely to the business owner, who completes the SKU by hand. The Sync Engine never pushes a row to Medusa while its SKU still matches this incomplete-placeholder pattern, so nothing goes live before the business owner has actually looked at it. A validation failure on such a row, lacking any stable identity, anchors to its position within the current parse batch rather than a cross-cycle identifier.

## Considered Options

- **Content fingerprinting** (matching on a normalized combination of title/color/etc.) — rejected; guessing wrong creates either a duplicate product or a silent overwrite of the wrong one, both worse than asking a human, and this tier of supplier already requires manual data-gathering for other fields, so manual identity reconciliation isn't adding a new burden.
