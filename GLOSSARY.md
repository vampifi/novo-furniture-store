# Novo Furniture Store

A furniture e-commerce business built on Medusa, with a Next.js storefront. This glossary records domain vocabulary as it's settled, context by context; it is not a spec or an implementation guide.

## Language

### Supplier Catalog Sync

**Canonical Product**:
The common product representation every supplier's data is converted into, independent of any one supplier's original format. A Canonical Product becomes a Medusa product once the Sync Engine applies it; until then it exists only as a row in a Supplier Tab.
_Avoid_: Normalized product, unified product

**Supplier Pack**:
The file bundle a supplier sends the business owner directly — a PDF, an Excel/CSV, a ZIP of images plus a spec sheet, whatever that supplier uses — entirely outside any system we control. Formats and quality vary by supplier; some are deterministically parsable, some aren't.
_Avoid_: Webpack (collides with the unrelated JS build tool), product pack

**Pack Extraction**:
The stage that turns one supplier's Supplier Pack into the structured rows a Supplier Adapter consumes. For a Supplier Pack that's already a clean, deterministically parsable file, this stage is trivial — effectively just reading the file. For a Supplier Pack that needs OCR or AI-based extraction to become structured, designing that extraction (and the field-level confidence signal it would need) is deferred — see ADR 0002.
_Avoid_: Extraction layer, ingestion

**Supplier Adapter**:
The per-supplier translator that converts the structured rows produced by that supplier's Pack Extraction into Canonical Products. One adapter per supplier.
_Avoid_: Parser, importer, connector

**Supplier Tab**:
A tab in the sheet holding one supplier's products, already expressed as Canonical Products — not the supplier's original format. Each supplier has exactly one; there is no single tab combining all suppliers, so the set of Supplier Tabs collectively is the whole catalog.
_Avoid_: Master tab, raw tab

**Adapter-Owned Field**:
A Canonical Product field the Supplier Adapter populates and refreshes on every sync cycle. A business owner's edit to one of these is overwritten the next time the adapter runs.
_Avoid_: System field, synced field

**Business-Owned Field**:
A Canonical Product field the Supplier Adapter sets only when the row is first created. After that it belongs to the business owner and the adapter never overwrites it again, however the underlying supplier data changes.
_Avoid_: Editable field, manual field

**SKU**:
The stable identifier the business owner assigns to a product in the catalog. The Sync Engine uses it to match a Canonical Product to its Medusa product/variant across sync cycles.
_Avoid_: Catalog SKU, business SKU, product code

**Supplier SKU**:
The identifier a supplier uses for a product in its own system. Distinct from SKU — it's what a Supplier Adapter uses to recognize the same product across sync cycles before that product has a SKU of its own.
_Avoid_: Supplier code, vendor SKU

**Sync Engine**:
The backend component that reads Canonical Products from the Supplier Tabs on a schedule and applies the resulting changes to Medusa. How it applies them is a separate, still-open decision.
_Avoid_: Sync job, sync service

**Custom Attribute** _(established elsewhere in the codebase; recorded here, not redefined)_:
A category-scoped, extensible product property (e.g. "Material" for a furniture category) with two parts: a **Category Custom Attribute**, the definition (key, label, category it belongs to), and a **Product Custom Attribute**, one product's value against that definition.
_Avoid_: Metadata field, extra field
