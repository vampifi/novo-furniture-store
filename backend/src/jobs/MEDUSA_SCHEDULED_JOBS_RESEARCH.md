# Research: Is `src/jobs` adequate for the Sync Engine's poll-every-few-minutes job?

**Date:** 2026-10-23
**Scope:** Medusa v2.8.8, as actually installed in this repo's `backend/node_modules`.
**Issue:** GitHub #3 — "Research: Medusa v2 native scheduled-job primitives (src/jobs) adequacy for the Sync Engine."

## Summary verdict

`src/jobs` is a thin wrapper that turns your handler into a one-step **scheduled workflow**, executed by whichever `WORKFLOW_ENGINE` module is configured — in this repo that's `@medusajs/workflow-engine-redis`, which schedules via **BullMQ repeatable jobs in Redis**, not an in-process cron library. It supports both cron-expression and millisecond-interval scheduling, so a "poll every N minutes" job is syntactically trivial to express. However, in v2.8.8 the Redis engine has **no implemented overlap guard** (a fresh, unrelated transaction ID is minted on every tick) and **no automatic retry** on handler failure (`DEFAULT_RETRIES = 0`), despite the public type (`SchedulerOptions.concurrency`) documenting "by default concurrent executions are not allowed" — that guard is a TODO in the source, not a working feature. For a Sync Engine that must poll a Google Sheet every few minutes and write to Medusa, **`src/jobs` is adequate as the triggering mechanism** (it's simpler and more "native" than external cron + an admin route) **provided the job body implements its own idempotency/overlap guard** — this is a correctness gap you must close yourself, not a reason to abandon the primitive.

---

## (1) Scheduling granularity

**Claim:** Both cron-expression strings and numeric millisecond intervals are supported; there is no Medusa-enforced minimum interval.

Evidence:

- Repo's own convention doc, `backend/src/jobs/README.md` (lines 27-31), documents only the cron-string form:
  ```
  - `schedule`: a [cron expression](https://crontab.guru/).
  - `numberOfExecutions`: an optional integer...
  ```
  This is the *documented* convention but not the full capability of the underlying type.

- The loader's type definition, `backend/node_modules/@medusajs/framework/dist/jobs/job-loader.d.ts:6-7`:
  ```ts
  schedule: string | SchedulerOptions;
  numberOfExecutions?: SchedulerOptions["numberOfExecutions"];
  ```

- `SchedulerOptions` itself, in `backend/node_modules/.pnpm/@medusajs+orchestration@2.8.8_.../node_modules/@medusajs/orchestration/dist/transaction/types.d.ts:122-140`:
  ```ts
  export type SchedulerOptions = {
    concurrency?: "allow" | "forbid";   // documented default: "forbid"
    numberOfExecutions?: number;
  } & ({
    cron: string;
  } | {
    interval: number;   // interval in ms
  });
  ```
  So a job file can export `config.schedule = { interval: 5 * 60 * 1000 }` (every 5 minutes) instead of a cron string — this is a real, typed, supported option, just not mentioned in the repo's README template.

- The loader (`backend/node_modules/@medusajs/framework/dist/jobs/job-loader.js:56-64`) normalizes whatever you export into a workflow-level `schedule`:
  ```js
  const workflowConfig = {
      name: workflowName,
      schedule: isObject(config.schedule)
          ? config.schedule
          : { cron: config.schedule, numberOfExecutions: config.numberOfExecutions },
  };
  ```

- For the Redis engine actually configured in this repo, the interval is handed straight to BullMQ's repeat options — `backend/node_modules/@medusajs/workflow-engine-redis/dist/utils/workflow-orchestrator-storage.js:357-370`:
  ```js
  async schedule(jobDefinition, schedulerOptions) {
      ...
      if ("cron" in schedulerOptions) {
          repeatOptions.pattern = schedulerOptions.cron;
      } else {
          repeatOptions.every = schedulerOptions.interval;
      }
      await this.jobQueue?.add(JobType.SCHEDULE, { jobId, schedulerOptions }, { repeat: repeatOptions, ... });
  }
  ```
  `repeatOptions.every` is passed straight into BullMQ's `Queue.add({ repeat: { every } })`. There is no Medusa-side minimum-interval check in this function — any positive millisecond value is accepted (BullMQ itself has no hard floor either; sub-second values are impractical but not blocked by this code path).

- Validation is minimal — `backend/node_modules/@medusajs/medusa/dist` job validation (mirrored in `job-loader.js:26-36`) only requires `config.schedule` and `config.name` to be truthy; it does not parse/validate the cron string or interval value at load time.

**Conclusion:** cron strings and millisecond intervals are both first-class; "poll every 5 minutes" can be written as `schedule: "*/5 * * * *"` or `schedule: { interval: 300_000 }`. No enforced minimum.

---

## (2) Reliability / observability

**Logging — start/registration/failure, yes; explicit "completed" log, no (beyond debug-level queue logs).**

- Registration: `job-loader.js:15` — `logger.debug(\`Registering job from ${path}.\`)`, and `:74` — `logger.debug(\`Jobs registered.\`)`.
- Failure inside the handler is caught and logged at **error** level, then rethrown, in `job-loader.js:45-54`:
  ```js
  const step = createStep(`${config.name}-as-step`, async (_, stepContext) => {
      const { container } = stepContext;
      try {
          const res = await handler(container);
          return new StepResponse(res, res);
      } catch (error) {
          logger.error(`Scheduled job ${config.name} failed with error: ${error.message}`);
          throw error;
      }
  });
  ```
- The Redis engine's tick execution logs at debug level before running and warns if the job definition vanished — `workflow-orchestrator-storage.js:94-95` and `:160`:
  ```js
  this.logger_.debug(`executing scheduled job ${job.data.jobId} from queue ${this.jobQueueName} with the following options: ${JSON.stringify(job.data.schedulerOptions)}`);
  ...
  this.logger_?.warn(`Tried to execute a scheduled workflow with ID ${jobId} that does not exist, removing it from the scheduler.`);
  ```
- There is no dedicated "job X completed successfully" log line — success is implicit (no log emitted on the happy path beyond the pre-execution debug line).

**Retry — none by default.**

- `TransactionOrchestrator.DEFAULT_RETRIES = 0` — `backend/node_modules/.pnpm/@medusajs+orchestration@2.8.8_.../node_modules/@medusajs/orchestration/dist/transaction/transaction-orchestrator.js:1149`.
- Step failure handling uses `step.definition.maxRetries` with that `0` default — same file, line 791: `TransactionOrchestrator.setStepFailure(transaction, step, error, isPermanent ? 0 : step.definition.maxRetries)`, and the comparison at line 434: `if (step.failures > maxRetries || hasTimedOut) { ... }`.
- The job-loader's generated step (`job-loader.js:45`) calls `createStep(name, handlerFn)` with **no step-config object**, so `stepConfig.maxRetries` is never set and the `0` default applies. **A throw in your job handler fails the step permanently on the first attempt; Medusa does not retry it.** (You can opt into retries only by writing your own workflow/step with an explicit `maxRetries` — the auto-generated `src/jobs` step does not expose this.)

**Overlap prevention — documented as default-on, but not implemented in the Redis engine path used here.**

- The type comment claims a safe default — `orchestration/dist/transaction/types.d.ts:122-127`:
  ```ts
  concurrency?: "allow" | "forbid";
  // By default concurrent executions are not allowed.
  ```
- But the Redis engine's actual tick handler ignores `schedulerOptions.concurrency` entirely and starts a **brand-new transaction ID every time** — `workflow-orchestrator.js:85-90` (in `@medusajs/workflow-engine-redis/dist/services/workflow-orchestrator.js`):
  ```js
  async run(workflowIdOrWorkflow, options) {
      ...
      context.transactionId = transactionId ?? ulid();
  ```
  and the scheduled-tick call site, `workflow-orchestrator-storage.js:150-155`:
  ```js
  async executeScheduledJob(jobId, schedulerOptions) {
      try {
          // TODO: In the case of concurrency being forbidden, we want to generate a predictable
          // transaction ID and rely on the idempotency of the transaction to ensure that the
          // transaction is only executed once.
          await this.workflowOrchestratorService_.run(jobId, { logOnError: true });
      }
  ```
  The `TODO` is the smoking gun: `schedulerOptions` (which would carry `concurrency: "forbid"`) is accepted as a parameter but **never read** in this function body — no predictable/idempotent transaction key is generated, so nothing stops a second tick from starting a fully independent, concurrent transaction while the first is still running. **If your Google Sheet poll takes longer than the configured interval (e.g., sheet API is slow, or interval is set too aggressively), you can get two overlapping syncs running at once with no built-in guard.**
- (For contrast, the *in-memory* engine — not the one configured in this repo — does self-regulate: it only re-arms its `setTimeout` for the next run after the current `workflowOrchestratorService_.run()` call resolves, per `backend/node_modules/.pnpm/@medusajs+workflow-engine-inmemory@2.8.8_.../node_modules/@medusajs/workflow-engine-inmemory/dist/utils/workflow-orchestrator-storage.js:305-320`, with the comment at line 311: `// Only schedule the next job execution after the current one completes successfully`. This repo does not use that engine in practice — see (3) — so this protection does not apply here.)

---

## (3) Dependency on Redis / workflow engine vs. pure in-process cron

**Claim:** The scheduled-job primitive is *not* a standalone in-process cron scheduler. It is implemented as a one-step workflow with a `schedule` property, and the actual timer/trigger mechanism is delegated entirely to whichever `WORKFLOW_ENGINE` module is active. Which module is active changes the underlying mechanism completely:

- `backend/node_modules/@medusajs/framework/dist/jobs/job-loader.js:43-67` (`register()`) does not start any timer itself — it calls `createWorkflow(workflowConfig, ...)` where `workflowConfig.schedule` is just metadata attached to the workflow definition. The actual scheduling is picked up later by the workflow engine's own `schedule()` storage method.

- **This repo's configuration** (`backend/medusa-config.js:98-115`) only registers `@medusajs/event-bus-redis` and `@medusajs/workflow-engine-redis` when `REDIS_URL` is truthy:
  ```js
  ...(REDIS_URL
    ? [
        { key: Modules.EVENT_BUS, resolve: '@medusajs/event-bus-redis', options: { redisUrl: REDIS_URL } },
        { key: Modules.WORKFLOW_ENGINE, resolve: '@medusajs/workflow-engine-redis', options: { redis: { url: REDIS_URL } } },
      ]
    : []),
  ```
  `REDIS_URL` is sourced in `backend/src/lib/constants.ts:45` from `REDIS_URL ?? REDIS_PRIVATE_URL ?? REDIS_PUBLIC_URL` — on Railway (this project's deploy target) a Redis addon is expected to be attached, so in the deployed environment the Redis engine is what's active.

- With the Redis engine active, scheduling is implemented via **BullMQ** (`bullmq` npm package — confirmed by `const { Queue, Worker } = require("bullmq")` at `backend/node_modules/@medusajs/workflow-engine-redis/dist/utils/workflow-orchestrator-storage.js:17`), using a dedicated Redis-backed queue (`this.jobQueue`) and a BullMQ `Worker` that only spins up `if (isWorkerMode)` (`workflow-orchestrator-storage.js:92-99`). This absolutely requires a running, reachable Redis instance — if Redis is down, no scheduled job executes, and if `MEDUSA_WORKER_MODE=server` on a given process (`isWorkerMode = moduleDeclaration.worker_mode !== "server"`, in `backend/node_modules/.pnpm/@medusajs+workflow-engine-redis@2.8.8_.../node_modules/@medusajs/workflow-engine-redis/dist/loaders/redis.js:41`), that specific process never creates the job-consuming `Worker` and will not execute jobs even though it still registers the queue entries. This repo's `WORKER_MODE` (`backend/src/lib/constants.ts:117-118`) defaults to `'shared'`, which does satisfy `!== 'server'`, so the single deployed process does execute jobs by default — but this is a config-dependent fact worth flagging if the deployment is later split into separate server/worker processes.

- **If `REDIS_URL` is unset**, this repo's config registers *no* `WORKFLOW_ENGINE` module at all, so Medusa falls back to its own default resolution. The fallback target is `@medusajs/workflow-engine-inmemory` (confirmed present only inside the pnpm store, not hoisted to the top-level `node_modules/@medusajs/`, at `backend/node_modules/.pnpm/@medusajs+workflow-engine-inmemory@2.8.8_.../`, and referenced by `backend/node_modules/@medusajs/medusa/dist/modules/workflow-engine-inmemory.js:21-24`). That package uses `cron-parser` (an npm dependency confirmed in its `package.json`) plus plain Node `setTimeout`/`setInterval` — a genuinely in-process, Redis-independent scheduler. **But this is not the path taken in this repo's actual (Redis-configured) deployment.**

**Conclusion:** the primitive is a thin facade over the pluggable workflow engine. In this repo, as actually configured, it is **BullMQ/Redis-backed, single-process-per-worker**, not a pure in-process cron mechanism — it depends on Redis being up, and (as shown in (2)) does not yet implement the overlap/concurrency guard its own type system advertises.

---

## (4) Verdict: is `src/jobs` adequate for the Sync Engine?

**Yes, as the trigger mechanism — with two things the job body must handle itself.**

Why it's adequate:
- It requires zero extra infrastructure beyond what's already running: Redis is already configured for the event bus and workflow engine (`medusa-config.js:98-115`), so `src/jobs` rides on infra this app already depends on. An external cron hitting an admin API route would need its own scheduler (e.g. Railway cron, GitHub Actions, a third-party cron SaaS) *plus* an authenticated HTTP endpoint, plus its own retry/alerting — strictly more moving parts for the same outcome.
- Minute-granularity polling is natively supported (`{ interval: ms }` or a `*/5 * * * *` cron string — see (1)); there's no built-in floor that would block a 1-5 minute cadence.
- It already runs inside the same Node process/container as the rest of the backend, so it shares the container's secrets, DB connection pool, and container's `MedusaContainer` for resolving services — simpler than an external caller authenticating against an admin route.

What it does **not** give you for free, and that the Sync Engine implementation must supply itself:
1. **No overlap guard** (see (2)/(3)): if a Google Sheets fetch+diff+write cycle ever runs longer than the polling interval (rate limiting, a large sheet, a slow Medusa write), a second overlapping run can start on the next tick with a disjoint transaction ID. The job handler should implement its own guard — e.g., a short-lived advisory lock/flag (Redis `SET NX` with a TTL, or a `last_synced_at`/`sync_in_progress` row in Postgres) checked at the top of the handler, independent of anything Medusa provides.
2. **No retry on failure** (`DEFAULT_RETRIES = 0`, see (2)): a transient Google Sheets API hiccup or a transient DB blip fails the entire sync for that tick with no automatic retry; it just waits for the next scheduled tick. If sub-interval retry/backoff is needed, implement it inside the handler (e.g. a small retry loop around the Sheets fetch) rather than relying on the workflow engine.
3. **Single point of execution per active worker process** — fine for a single backend instance (this repo's current Railway setup), but if the backend is later horizontally scaled with multiple `worker`/`shared`-mode instances, BullMQ's queue consumption model means only one worker picks up each tick (no duplicate ticks), but you should still confirm this at scale-out time rather than assume it; it is not something `src/jobs` itself guarantees in isolation of the underlying queue's job-claiming semantics.
4. **No dedicated "sync succeeded" observability** beyond `logger.error` on throw and debug-level queue logs (see (2)) — the Sync Engine should emit its own structured success/failure/row-count logs (and consider writing sync status to a table) rather than relying on Medusa's job logging for operational visibility.

### Recommendation

Build the Sync Engine as a normal `src/jobs/sync-google-sheet.ts` file (cron or `{ interval }` schedule, per (1)), but treat the handler body as responsible for:
- An explicit idempotency/overlap guard at the top of the handler (cheapest: a Postgres row or Redis key recording `sync_in_progress` + `started_at`, with a stale-lock timeout so a crashed run doesn't permanently wedge future runs).
- Its own try/catch with structured logging of outcome (rows processed, rows failed, duration) — do not rely on the implicit `logger.error` rethrow in `job-loader.js:52` as your only observability.
- Optional: a small manual retry/backoff loop around the Google Sheets API call for transient failures, since Medusa's step-level retry is `0` by default and the auto-generated job step does not expose a way to override it.

There is no evidence in the installed v2.8.8 source that an external-cron-hitting-an-admin-route or a wholly separate worker process is *necessary* — `src/jobs` is the native, lower-friction option and sits on infrastructure (Redis) already present in this app. The separate-worker-process pattern (`MEDUSA_WORKER_MODE=worker`) is a scaling knob Medusa itself provides for when the server process needs to be isolated from job execution load — it is not a prerequisite for `src/jobs` to work correctly at the current single-instance scale.
