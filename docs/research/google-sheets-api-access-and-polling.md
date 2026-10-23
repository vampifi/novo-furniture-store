# Google Sheets API: unattended server access + polling interval for the sheet-to-Medusa sync

Research for: `docs/adr/0001-one-way-sheet-to-medusa-product-sync.md` and the dependent validation/status write-back ticket (#10).

## Recommendation (read this first)

**Auth pattern:** use a plain **Google Cloud service account** whose email is shared directly on the spreadsheet with Editor access (Option A). This needs **no Google Workspace account, no admin, and no domain-wide delegation** — Google's own docs state explicitly that if your app "only needs to read or write specific files (such as a Google Sheet ...), you don't need to assign administrative roles or configure domain-wide delegation. Instead, you can directly share individual files with the service account's email address" (see Auth section below). Domain-wide delegation (Option B) and user-OAuth-with-stored-refresh-token are both unnecessary complexity for this use case and should be rejected.

**Polling interval:** do **not** poll per-tab (one `values.get`/`values.update` per Supplier Tab). Instead do exactly **one `spreadsheets.values.batchGet` call for all tabs' read ranges and one `spreadsheets.values.batchUpdate` call for all tabs' status/error write-backs per cycle** — each batch call, no matter how many ranges/sheets it covers, counts as a single request against quota. With that batching, a full poll cycle costs **2 requests total regardless of tab count** (1 read + 1 write), versus `2 × N` requests/cycle in the naive per-tab design. Against the documented quota of 60 requests/minute/user/project (per operation type), a 30–60 second polling interval is comfortably safe for the batched design even at 20+ tabs (using ≤2 requests/min, ~3% of quota), whereas the naive per-tab design would need an interval of roughly `N` seconds minimum (with no safety margin) and would hit quota exhaustion risk at low tab counts if polled faster than once a minute. Recommend the repo standardize on **batched requests with a 30–60s poll interval and exponential backoff on 429s**.

---

## 1. Quota numbers (source-cited)

| Metric | Value | Source |
|---|---|---|
| Sheets API read requests — per minute, per project | 300 | [developers.google.com/workspace/sheets/api/limits](https://developers.google.com/workspace/sheets/api/limits) |
| Sheets API read requests — per minute, per user per project | 60 | [developers.google.com/workspace/sheets/api/limits](https://developers.google.com/workspace/sheets/api/limits) |
| Sheets API write requests — per minute, per project | 300 | [developers.google.com/workspace/sheets/api/limits](https://developers.google.com/workspace/sheets/api/limits) |
| Sheets API write requests — per minute, per user per project | 60 | [developers.google.com/workspace/sheets/api/limits](https://developers.google.com/workspace/sheets/api/limits) |
| Read vs. write quota tracking | **Tracked separately** — the limits page lists "Read requests" and "Write requests" as distinct metrics, each with its own per-project and per-user-per-project ceiling | [developers.google.com/workspace/sheets/api/limits](https://developers.google.com/workspace/sheets/api/limits) |
| Definition of "read request" | "calls to any method that retrieves data from a spreadsheet, such as `get` or `search`" | [developers.google.com/workspace/sheets/api/limits](https://developers.google.com/workspace/sheets/api/limits) |
| Definition of "write request" | "calls to any method that changes a spreadsheet, such as `update`, `clear`, or `copyTo`" | [developers.google.com/workspace/sheets/api/limits](https://developers.google.com/workspace/sheets/api/limits) |
| Batch request counting | "Each batch request, including all subrequests, is counted as one API request toward your usage limit." — i.e. `values.batchGet` / `values.batchUpdate` cost **1 request** no matter how many ranges/subrequests they contain | [developers.google.com/workspace/sheets/api/limits](https://developers.google.com/workspace/sheets/api/limits) and [developers.google.com/workspace/sheets/api/guides/batch](https://developers.google.com/workspace/sheets/api/guides/batch) |
| Max ranges per `batchGet`/subrequests per `batchUpdate` | No explicit numeric cap documented on the reference page itself (only the per-minute request quotas above act as the practical ceiling) | [developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values/batchGet](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values/batchGet) |
| Pricing for exceeding quota | "All standard use of the Google Sheets API is available at no additional cost. Exceeding the quota request limits is planned to incur charges to your Google Cloud billing account later in 2026." | [developers.google.com/workspace/sheets/api/limits](https://developers.google.com/workspace/sheets/api/limits) |
| Page "last updated" stamp | 2026-09-03 UTC (so this is current as of the time of this research, 2026-10-23) | [developers.google.com/workspace/sheets/api/limits](https://developers.google.com/workspace/sheets/api/limits) |
| Drive API quota (only relevant if you use Drive API for file discovery / change-detection, not for normal Sheets reads/writes) | 1,000,000 quota units/min per project; 325,000 quota units/min per user per project. Different operations cost different unit amounts (e.g. a `get` costs 5 units, a `list` costs 100 units). This is a wholly separate quota pool from the Sheets API quota above. | [developers.google.com/drive/api/guides/limits](https://developers.google.com/drive/api/guides/limits) |

**Note on currency/ambiguity:** these per-minute numbers (300/project, 60/user/project, for both read and write) are what the *current* official page states, and the page itself carries a 2026-09-03 last-updated stamp. Google has changed Sheets API quotas before (older blog posts/community threads reference different historical figures), so if this file is read long after the "last updated" date above, re-check `developers.google.com/workspace/sheets/api/limits` before relying on these numbers for capacity planning.

---

## 2. Auth pattern: options and recommendation

### Option A — Service account, spreadsheet shared directly with the service account email (recommended)

- **What it requires:** create a GCP project + service account (via the Cloud Console or `gcloud`), download/configure its credentials (JSON key or Application Default Credentials), then share the target Google Sheet with the service account's `...@<project>.iam.gserviceaccount.com` email exactly like sharing with any other collaborator (Viewer for read-only, Editor for read+write).
- **Does it require Google Workspace?** No. Per Google's own guide: *"If your app only needs to read or write specific files (such as a Google Sheet or a Google Drive folder), you don't need to assign administrative roles or configure domain-wide delegation. Instead, you can directly share individual files with the service account's email address using the standard UI."* — [developers.google.com/workspace/guides/create-credentials](https://developers.google.com/workspace/guides/create-credentials). This is the standard Google Drive sharing mechanism (any Google account, consumer or Workspace, can share a file with any other Google account, including a service account's); the docs don't call out a consumer-vs-Workspace distinction for this path because sharing-based access doesn't depend on the sheet owner having a Workspace account at all.
- **No human/interactive consent needed at run time** — the service account authenticates via a signed JWT exchanged for an access token, with "no user consent necessary" for server-to-server calls ([developers.google.com/identity/protocols/oauth2](https://developers.google.com/identity/protocols/oauth2)).
- **This is the fit for this repo's cron/worker-driven sync** since there's exactly one target spreadsheet (owned by the business owner) that needs to be shared once with the service account, no org-wide impersonation of arbitrary users is needed.

### Option B — Service account + Google Workspace domain-wide delegation

- **What it requires:** a Google Workspace organization, a Workspace **Super Admin** to open the Admin console and explicitly authorize the service account's client ID for the needed OAuth scopes org-wide, after which the service account can impersonate any user in that Workspace domain without each user individually sharing a file.
- Per Google's docs: *"To call APIs on behalf of users in a Google Workspace organization, grant your service account domain-wide delegation of authority in the Google Admin console using a Super Admin account."* — [developers.google.com/workspace/guides/create-credentials](https://developers.google.com/workspace/guides/create-credentials). And: *"Using a Google Workspace account, a Workspace administrator of the organization can authorize an application to access Workspace user data on behalf of users in the Google Workspace domain."* — [developers.google.com/identity/protocols/oauth2/service-account](https://developers.google.com/identity/protocols/oauth2/service-account).
- **This is overkill for the task at hand** — it's designed for apps that must act as *many different* Workspace users without each one sharing files individually (e.g. a Gmail-migration tool acting as every employee). This repo only has one spreadsheet to reach, so Option A's direct-share is strictly simpler and has no admin/Workspace dependency at all.

### Option C — OAuth2 with a stored refresh token for a human's Google account

- Technically possible (desktop/web OAuth flow run once interactively to mint a refresh token, then stored and used headlessly thereafter), but **not recommended for unattended server workloads**:
  - It's tied to a specific human's account/consent; if that person leaves, is offboarded, or revokes access, the sync breaks.
  - Google explicitly documents that for apps with an OAuth consent screen in **"Testing" publishing status**, refresh tokens **expire after 7 days** unless the only scopes requested are name/email/profile — so an un-published/unverified OAuth client used this way will silently stop working weekly: *"A Google Cloud Platform project with an OAuth consent screen configured for an external user type and a publishing status of 'Testing' is issued a refresh token expiring in 7 days..."* — [developers.google.com/identity/protocols/oauth2](https://developers.google.com/identity/protocols/oauth2).
  - Google's own service-account docs frame this flow as needing "end-user involvement," whereas service accounts are explicitly for cases where "your application needs to prove its own identity to the API, but no user consent is necessary" — [developers.google.com/identity/protocols/oauth2](https://developers.google.com/identity/protocols/oauth2).

### Verdict

Use **Option A**. It is exactly what Google's own guidance recommends for "access data owned by your app, specific shared documents (such as Google Sheets) ... " without domain-wide delegation ([developers.google.com/workspace/guides/create-credentials](https://developers.google.com/workspace/guides/create-credentials)), requires no Workspace subscription/admin, and has no token-expiry foot-guns like the OAuth-refresh-token option.

Required scope: `https://www.googleapis.com/auth/spreadsheets` (read+write) rather than the `.readonly` variant, since ticket #10 requires writing status/error values back into cells — [developers.google.com/workspace/sheets/api/scopes](https://developers.google.com/workspace/sheets/api/scopes).

---

## 3. Polling interval math: naive per-tab vs. batched

Assume `N` Supplier Tabs (5–20 per the issue's stated range), one read pass (poll for new/changed rows) and one write pass (status/error write-back) per cycle, using a single service-account identity — so the binding constraint is the **per-user-per-project** limit of 60 read requests/min and 60 write requests/min (tracked independently; see table above). The per-*project* ceiling of 300/min only matters if multiple identities hit the same project concurrently, which isn't the case here with one sync worker.

### Naive design: one API call per tab per operation

- Requests per cycle: `N` reads (one `values.get` per tab) + `N` writes (one `values.update` per tab) = **2N requests/cycle**.
- To stay within the 60/min-per-operation ceiling with zero safety margin: a cycle run every `I` seconds produces `N × (60/I)` read requests/minute, so solving `N × 60/I ≤ 60` gives **`I ≥ N` seconds** as the bare mathematical floor — e.g. for N=20 tabs, cycles can't run faster than every 20 seconds even in the ideal case.
- In practice this floor is unsafe to run at, because:
  - The `2N` calls for a cycle fire in a tight burst at cycle start, not smoothly spread across the minute — a burst of 20+ near-simultaneous calls can trip the per-minute window even if the *average* rate is under quota (Google doesn't document burst smoothing, only a flat per-minute refill).
  - Any retry-on-429 (see backoff note below) adds more requests inside the same window, eating further into the already-exhausted budget.
  - A safe rule of thumb is to leave 2–3x headroom, i.e. target `I ≥ 2N–3N` seconds, and never go below a 60-second cycle regardless of `N`, since the quota window itself is one minute.
- **Concrete example:** at a 60-second polling interval, the naive design can support at most `N ≈ 60` tabs before mathematically exhausting the per-minute quota with *zero* margin, or realistically only **~20–30 tabs** once a 2–3x safety margin for bursts/retries is applied.

### Batched design: one `values.batchGet` + one `values.batchUpdate` per cycle

- Requests per cycle: **1 read + 1 write, independent of N** (a single `batchGet` listing all N tabs' read ranges, a single `batchUpdate` carrying all N tabs' write-back `updateCells`/`updateValues` subrequests) — confirmed by Google's explicit statement that "each batch request, including all subrequests, is counted as one API request toward your usage limit" ([developers.google.com/workspace/sheets/api/limits](https://developers.google.com/workspace/sheets/api/limits), [guides/batch](https://developers.google.com/workspace/sheets/api/guides/batch)).
- At a 10-second polling interval that's 6 reads/min + 6 writes/min — **10% of the 60/min quota**, with 20 tabs or 200 tabs making no difference to the request count (only to payload size, which has no documented range-count cap on `batchGet`/`batchUpdate` themselves — see table above).
- At a 60-second polling interval that's 1 read/min + 1 write/min — **~1.7% of quota**, leaving enormous headroom for retries/backoff.

### Quantified naive-vs-batched comparison

| Polling interval | Naive design: max tabs supportable (no margin / with 2–3x margin) | Batched design: max tabs supportable |
|---|---|---|
| 60s | 60 tabs (no margin) / ~20–30 tabs (safe) | effectively unbounded by quota (limited only by payload size / business needs) |
| 10s | 10 tabs (no margin) / ~3–5 tabs (safe) | effectively unbounded by quota |
| 5s | 5 tabs (no margin) / ~2 tabs (safe) | effectively unbounded by quota |

For this repo's stated range of 5–20 Supplier Tabs, the naive per-tab design is already marginal-to-unsafe at a 60-second cadence and gets worse the faster you poll; the batched design removes tab count from the equation entirely and the real constraint becomes "how often does the business actually need fresh data," not quota.

### Practical constraints beyond raw quota math

- **Exponential backoff is Google's explicit, required mitigation for 429s**, not an optional nicety: *"your code catches the exception and uses a truncated exponential backoff to make sure your devices don't generate excessive load,"* with the formula `wait = min(((2^n) + random_number_milliseconds), maximum_backoff)` and a typical `maximum_backoff` of 32–64 seconds — [developers.google.com/workspace/sheets/api/limits](https://developers.google.com/workspace/sheets/api/limits). The sync engine should implement this regardless of which design is chosen, as a safety net rather than a primary strategy.
- Google's documentation does **not** state an explicit minimum recommended polling interval for Sheets — the only official guidance is reactive (back off on 429), not proactive (don't poll faster than X). The interval numbers above are this research's own derivation from the quota figures, not a Google-stated rule.
- Getting tab/sheet metadata (sheet titles, sheetId values) is itself a Sheets API *read* request via `spreadsheets.get` — it is **not** a Drive API call, so it also consumes the 60/min read quota and should be folded into the same `batchGet`-style read pass rather than issued as a separate per-cycle call.
- If an even cheaper "did anything change" pre-check is wanted, the Drive API's `files.get` (field: `modifiedTime`) or `changes.watch` push notifications sit in a **separate, much larger quota pool** (1,000,000 units/min/project, 325,000/min/user/project — [developers.google.com/drive/api/guides/limits](https://developers.google.com/drive/api/guides/limits)) and could gate whether a full Sheets `batchGet` pass runs at all on a given cycle, further reducing Sheets API load. This is an optional future optimization, not required for the quota math above to hold.

---

## Sources

All URLs below were actually fetched/read during this research (2026-10-23):

- https://developers.google.com/workspace/sheets/api/limits
- https://developers.google.com/workspace/sheets/api/guides/batch
- https://developers.google.com/workspace/sheets/api/guides/authorizing
- https://developers.google.com/workspace/guides/create-credentials
- https://developers.google.com/identity/protocols/oauth2/service-account
- https://developers.google.com/identity/protocols/oauth2
- https://developers.google.com/sheets/api/quickstart/nodejs
- https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values/batchGet
- https://developers.google.com/drive/api/guides/limits
- https://developers.google.com/workspace/sheets/api/scopes (confirmed via search result excerpt of official content)
