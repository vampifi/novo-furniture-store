# Research: `importProductsWorkflow` unattended-confirm, partial-row-failure, and event-emission behavior

**Source of truth:** installed Medusa v2.8.8 code under
`backend/node_modules/.pnpm/@medusajs+core-flows@2.8.8_*/node_modules/@medusajs/core-flows`,
`backend/node_modules/.pnpm/@medusajs+utils@2.8.8_*/node_modules/@medusajs/utils`, and
`backend/node_modules/.pnpm/@medusajs+medusa@2.8.8_*/node_modules/@medusajs/medusa` (the actual
HTTP route handlers). No docs/memory used for the conclusions below — every claim is backed by a
file path and excerpt from the installed package.

GitHub issue: https://github.com/vampifi/novo-furniture-store/issues/2

---

## Q1 — Can `POST /admin/products/imports/:transaction_id/confirm` be called immediately/unattended? Is there a preview/diff being discarded?

**Yes, it can be called immediately and programmatically, with no server-side check that a human
reviewed anything.** The "confirm" route does nothing except tell the Workflow Engine that the
`wait-confirmation-product-import` step succeeded:

`@medusajs/medusa/dist/api/admin/products/imports/[transaction_id]/confirm/route.js`:
```js
const POST = async (req, res) => {
    const workflowEngineService = req.scope.resolve(utils_1.Modules.WORKFLOW_ENGINE);
    const transactionId = req.params.transaction_id;
    await workflowEngineService.setStepSuccess({
        idempotencyKey: {
            action: utils_1.TransactionHandlerType.INVOKE,
            transactionId,
            stepId: core_flows_1.waitConfirmationProductImportStepId,
            workflowId: core_flows_1.importProductsAsChunksWorkflowId,
        },
        stepResponse: new workflows_sdk_1.StepResponse(true),
    });
    res.status(202).json({});
};
```

This is backed by `waitConfirmationProductImportStep`
(`@medusajs/core-flows/dist/product/steps/wait-confirmation-product-import.js`), which is a bare
async step with a 1-hour timeout and an empty body — it is purely a synchronization point in the
Workflow Engine's saga, not a gate that validates reviewer identity, elapsed time, or any session
state:
```js
exports.waitConfirmationProductImportStep = (0, workflows_sdk_1.createStep)({
    name: exports.waitConfirmationProductImportStepId,
    async: true,
    timeout: 60 * 60 * 1,
}, async () => { });
```

There is nothing in the route or the step that inspects *who* calls confirm or *when* — an
unattended script that calls `POST /admin/products/imports` and immediately follows with
`POST /admin/products/imports/:transaction_id/confirm` using the returned `transaction_id` will
work exactly like a human clicking "confirm" in the admin UI.

**What gets returned before confirm, and what would be discarded by auto-confirming:** the only
payload available before confirmation is a coarse count, not a per-row diff. The initial import
route returns:

`@medusajs/medusa/dist/api/admin/products/imports/route.js`:
```js
const POST = async (req, res) => {
    const { result, transaction } = await (0, core_flows_1.importProductsAsChunksWorkflow)(req.scope).run({...});
    res.status(202).json({ transaction_id: transaction.transactionId, summary: result });
};
```

`result` (aliased `summary`) is produced by `normalizeCsvToChunksStep` /
`normalizeCsvStep`, and is just `{ toCreate: <count>, toUpdate: <count> }` — aggregate counts of
products that will be created vs. updated, with **no field-level diff, no per-row payload, and no
list of which products/handles/SKUs are affected**:

`@medusajs/core-flows/dist/product/steps/normalize-products-to-chunks.js`:
```js
const summary = chunks.reduce((result, chunk) => {
    result.toCreate = result.toCreate + chunk.toCreate;
    result.toUpdate = result.toUpdate + chunk.toUpdate;
    return result;
}, { toCreate: 0, toUpdate: 0 });
```

There is no GET endpoint under `/admin/products/import(s)` that exposes a preview/diff —
`backend/node_modules/.../@medusajs/medusa/dist/api/admin/products/imports/` only contains the
start route and the `[transaction_id]/confirm` route (no GET, no diff route). So an unattended
caller auto-confirming loses nothing more than two integers (create/update counts) — there was
never a row-level diff to discard in the first place.

---

## Q2 — Does one malformed/invalid CSV row fail the whole batch, or is it isolated while valid rows still apply?

**The whole batch fails — there is no per-row isolation.** Validation happens entirely during
CSV normalization, which runs as a single synchronous step *before* the wait-for-confirmation
step is even reached (i.e., before the transaction is confirmable). Two layers both throw hard on
the first bad row and stop processing immediately:

1. **`CSVNormalizer`** (`@medusajs/utils/dist/product/csv-normalizer.js`) processes rows with a
   plain `forEach` that throws a `MedusaError` as soon as it hits a problem (unknown column,
   missing id/handle, non-numeric price, missing option value, etc.) — there is no try/catch per
   row, so the exception propagates out of `.proccess()` and aborts the whole normalization:
   ```js
   proccess(resumingFromIndex = 0) {
       __classPrivateFieldGet(this, _CSVNormalizer_rows, "f").forEach((row, index) =>
           __classPrivateFieldGet(this, _CSVNormalizer_instances, "m", _CSVNormalizer_processRow)
               .call(this, row, resumingFromIndex + index + 1));
       ...
   }
   ```
   Example of a hard-throw validator used inside row processing:
   ```js
   function createError(rowNumber, message) {
       return new common_1.MedusaError(common_1.MedusaError.Types.INVALID_DATA, `Row ${rowNumber}: ${message}`);
   }
   ```

2. **Zod schema validation** in the normalize steps uses `.parse()` (not `.safeParse()`), which
   throws a `ZodError` on the first invalid object instead of collecting errors:
   `@medusajs/core-flows/dist/product/steps/normalize-products.js` and
   `normalize-products-to-chunks.js` both do:
   ```js
   result.push(utils_1.productValidators.CreateProduct.parse(products.toCreate[toCreateHandle]));
   ...
   result.push(utils_1.productValidators.UpdateProduct.parse(products.toUpdate[toUpdateId]));
   ```

Because this all happens inside `normalizeCsvStep` / `normalizeCsvToChunksStep` — the very first
step of `importProductsWorkflow` / `importProductsAsChunksWorkflow`, executed synchronously
during the initial `POST /admin/products/imports` call, before `waitConfirmationProductImportStep`
— a single malformed row causes the **entire initiating request to fail** (the workflow never
reaches "awaiting confirmation"; there is no partial transaction to confirm, and no valid rows
from that same CSV are applied). This is the opposite of row-level isolation: it is fail-fast,
all-or-nothing, at the parse/normalize stage.

One partial-failure nuance exists only *after* confirmation, at the chunk level (not row level),
for the chunked workflow: `processImportChunksStep`
(`@medusajs/core-flows/dist/product/steps/process-import-chunks.js`) iterates pre-validated,
already-written chunk files (each up to ~1000 rows) and runs `batchProductsWorkflow` per chunk in
a plain `for` loop with no per-chunk try/catch:
```js
for (let chunk of input.chunks) {
    const contents = await file.getAsBuffer(chunk.id);
    let products = JSON.parse(contents.toString("utf-8"));
    await (0, batch_products_1.batchProductsWorkflow)(container).run({ input: products });
    products = undefined;
}
```
If chunk N's `batchProductsWorkflow` run throws, chunks `1..N-1` have already been committed (so
earlier chunks' products are created/updated), but chunk N and any later chunks are not processed,
and the error propagates after the `finally` cleans up chunk files. This is chunk-level, not
row-level, partial application — it only matters for files large enough to span multiple
1000-row chunks, and it cannot happen at all for genuinely malformed CSV data, because malformed
rows are rejected during normalization (step 1 above), long before chunks are written or
`processImportChunksStep` runs.

---

## Q3 — Does `importProductsWorkflow` reuse `createProductsWorkflow`/`updateProductsWorkflow`, and does it emit `product.created`/`product.updated` so the MeiliSearch and custom-attribute-import subscribers still fire?

**Yes — the import workflows delegate to the exact same create/update sub-workflows used by the
regular product APIs, and those sub-workflows emit the standard `product.created` /
`product.updated` events via `emitEventStep`.**

Call chain (verified in installed code):

`import-products-as-chunks.js` (the workflow actually used by the current
`POST /admin/products/imports` route) → `processImportChunksStep` → `batchProductsWorkflow`
(same for the legacy `import-products.js` → `batchProductsWorkflow.runAsStep`).

`@medusajs/core-flows/dist/product/workflows/batch-products.js`:
```js
const conditionallyCreateProducts = (input) => (0, workflows_sdk_1.when)({ input }, ({ input }) => !!input.create?.length)
    .then(() => create_products_1.createProductsWorkflow.runAsStep({ input: { products: input.create } }));
const conditionallyUpdateProducts = (input) => (0, workflows_sdk_1.when)({ input }, ({ input }) => !!input.update?.length)
    .then(() => update_products_1.updateProductsWorkflow.runAsStep({ input: { products: input.update } }));
```

`batchProductsWorkflow` is the identical workflow backing the "Manage Products" admin batch API —
it is not a parallel/duplicate code path for imports.

Inside those sub-workflows, event emission is unconditional (not imports-specific, not skippable):

`@medusajs/core-flows/dist/product/workflows/create-products.js` (around the response transform):
```js
(0, common_1.emitEventStep)({
    eventName: utils_1.ProductWorkflowEvents.CREATED,
    data: productIdEvents,
});
```

`@medusajs/core-flows/dist/product/workflows/update-products.js`:
```js
(0, common_1.emitEventStep)({
    eventName: utils_1.ProductWorkflowEvents.UPDATED,
    data: productIdEvents,
})
```

`ProductWorkflowEvents` resolves to the plain string event names (`@medusajs/utils/dist/core-flows/events.js`):
```js
exports.ProductWorkflowEvents = {
    UPDATED: "product.updated",
    ...
    CREATED: "product.created",
    ...
};
```

Both event names match exactly what this repo's own subscribers and the MeiliSearch plugin
subscribe to:

- `backend/src/subscribers/product-created-import-custom-attributes.ts:7` → `event: "product.created"`
- `backend/src/subscribers/product-updated-import-custom-attributes.ts:7` → `event: "product.updated"`
- `@rokmohar/medusa-plugin-meilisearch/.medusa/server/src/subscribers/meilisearch-product-created.js:17` → `event: 'product.created'`
- `@rokmohar/medusa-plugin-meilisearch/.medusa/server/src/subscribers/meilisearch-product-updated.js:17` → `event: 'product.updated'`

**Conclusion:** products created/updated via the CSV import pipeline go through the same
`createProductsWorkflow`/`updateProductsWorkflow` steps as any other product create/update, so
`product.created`/`product.updated` events fire identically, and both the MeiliSearch sync
subscribers and this repo's custom-attribute-import subscribers will run for imported products —
no special-casing or event suppression exists for the import path.

---

## Summary table

| Question | Answer |
|---|---|
| Can confirm be called unattended, right after start? | Yes — `confirm` only calls `workflowEngineService.setStepSuccess(...)` on an empty step with no reviewer/identity/time check. Only a `{toCreate, toUpdate}` count summary exists to "discard" — there is no row-level diff endpoint. |
| Does one bad CSV row fail the whole batch? | Yes, fail-fast, pre-confirmation. `CSVNormalizer` (forEach, no try/catch) and `productValidators.*.parse()` (zod `.parse`, not `.safeParse`) both throw on the first bad row during normalization, which runs as the first synchronous step of the workflow, before confirmation is even possible. No valid rows from that same request are applied. (Only exception: for multi-chunk files, already-committed earlier chunks stay committed if a *later* chunk's `batchProductsWorkflow` run fails post-confirmation — chunk-level, not row-level, and irrelevant to malformed-data failures since those are caught before chunking.) |
| Does import reuse create/update workflows and emit `product.created`/`product.updated`? | Yes. `batchProductsWorkflow` (used by both `import-products.js` and `import-products-as-chunks.js`) runs `createProductsWorkflow`/`updateProductsWorkflow` as sub-steps, which unconditionally `emitEventStep` the exact event names (`product.created`/`product.updated`) that this repo's custom-attribute-import subscribers and the MeiliSearch plugin's subscribers listen for. |
