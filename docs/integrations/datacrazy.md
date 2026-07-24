# DataCrazy Integration

DataCrazy (`api.g1.datacrazy.io`) is the CRM Moderninha uses for online
attendance — WhatsApp and Instagram conversations, leads, and deals (negócios)
handled by the online sales team (Jéssica, Joyce, Letícia Souza).

Like Unique Morpheus and Meta Ads, DataCrazy is exposed exclusively through
**`evonexus-vault`** — see [../../evonexus-vault](https://github.com/Xubisco/evonexus-vault)
(sibling repo). Agents call it as an MCP server named `vault` (registered in
[`.mcp.json`](../../.mcp.json)), never through `.env`.

## Why the vault

Unlike ERP Unique Morpheus (session login) or Mercado Pago (OAuth exchange),
DataCrazy uses a simple static Bearer token — no session, no expiry to manage.
Migrated to the vault on 2026-07-24 anyway, for the same reason as every other
integration here: the token lived directly in `config/.env` before, inherited
by every routine/heartbeat process regardless of whether it actually needed
DataCrazy access. The vault isolates it the same way as the others.

## Available tools (via the `vault` MCP server)

| Tool | Endpoint | Params | Returns |
|---|---|---|---|
| `datacrazy_leads(data_inicio, data_fim)` | `GET /leads` | `data_inicio`/`data_fim` required, `AAAA-MM-DD` | Leads created in the date range. Paginated automatically (up to 3000/call). |
| `datacrazy_conversas(data_inicio, data_fim)` | `GET /conversations` | Same, required | Conversations in the range — **see quirk below**, this tool applies a workaround internally. |
| `datacrazy_negocios(data_inicio, data_fim, attendant_id?)` | `GET /businesses` | Dates required, `attendant_id` optional (CRM `id`, not Firebase `userId`) | Deals (negócios) created in the range, with `total` (value) and `status`. |
| `datacrazy_atendentes()` | `GET /attendants/crm` | none | Current attendant list — each has a CRM `id` (use in `datacrazy_negocios`) and a Firebase `userId`. |

All read-only.

## Known API quirks (discovered live, baked into the vault where possible)

### `/conversations` ignores its own date filter — `datacrazy_conversas` works around it

`filter[createdAtGreaterOrEqual]`/`filter[createdAtLessOrEqual]` are silently
ignored by this endpoint (confirmed by comparison: the same filter type works
correctly on `/businesses`). `datacrazy_conversas` pages from most-recent to
oldest (the API's default order) and stops once a full page is older than the
requested `data_inicio`, then filters and deduplicates the results itself —
callers don't need to know this happened, but the response's `truncated`
field indicates whether the safety page cap (30 pages / 3000 records) was
hit before a natural stop.

Pagination also duplicated records in live testing (`skip`-based, root cause
not confirmed) — `datacrazy_conversas` deduplicates by `id` before returning.
Treat conversation counts as best-effort, not a guaranteed exact count.

### `/leads` — `filter[attendant]` is broken, but date filters work

Tested with a nonexistent attendant ID vs. a real one: identical result both
times (silently ignored). The `attendant` field on a lead object is `null`
in ~100% of a 700-lead sample. **Don't** try to segment `datacrazy_leads` by
attendant — it isn't exposed as a parameter for this reason. Date filters on
this endpoint are reliable (confirmed generating coherent monthly buckets).

### `/businesses` — `filter[attendants]` + date filters both work, use `id` not `userId`

Each attendant has two different identifiers from `datacrazy_atendentes`: a
CRM `id` (used by `datacrazy_negocios`'s `attendant_id` param) and a Firebase
`userId` (not used by any vault tool here, but present in the raw response in
case a future tool needs it). Passing the wrong one silently returns the
account's unfiltered total instead of an error — same "wrong ID type, not a
broken filter" failure mode across DataCrazy's various endpoints.

### 94%+ of deals have no attendant assigned

Confirmed repeatedly (2026-07-09, 2026-07-22) — most `businesses` records
have `attendantId = null`. When reporting "negócios por vendedora," always
report the unassigned percentage alongside the per-attendant breakdown, don't
silently drop it. Also compare in VALUE not just COUNT — a batch of
unassigned deals can be worth R$0 (still in pipeline, unpriced) while
assigned deals hold all the real value, which reads very differently than
"97% unassigned" suggests on its own.

### Rate limit (429) can look like "0 results" to a naive consumer

If a caller doesn't check `status_code == 200` before reading `data`, a 429
response body gets treated as an empty page and pagination stops early —
silently undercounting. `datacrazy_leads`/`datacrazy_negocios`/`datacrazy_conversas`
all check status explicitly.

### Data history starts April 2026

Nothing before that is a search failure — the tool wasn't in use yet.

## Full investigation history

See the workspace memory `moderninha-datacrazy-notes.md` (type: reference) for
the complete, chronological account of how each of these was discovered —
this doc is the distilled "how to use it correctly" version.
