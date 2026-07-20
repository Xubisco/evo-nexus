# Meta Ads & Mercado Pago (via evonexus-vault)

Both integrations follow the same pattern as [Unique Morpheus](unique-morpheus.md):
credentials live only in **`evonexus-vault`** (separate Railway service,
sealed variables, private networking), never in `config/.env`. Agents call
narrow, read-only tools on the `vault` MCP server. Source:
[Xubisco/evonexus-vault](https://github.com/Xubisco/evonexus-vault) (sibling repo).

## Meta Ads

Insights for the "Moderninha Móveis" ad account (`act_330519214301228`).

**Auth model:** a Meta Business Manager **System User** token (not a
personal login token — doesn't expire when someone's session does),
scoped to permission **`ads_read`** only. The system user was granted
"Ver desempenho" (view performance) access to a single ad account —
explicitly *not* "Gerenciar campanhas" (which would allow creating/editing
ads) and *not* all business assets. A second ad account ("003 - Lives")
was deliberately left unconfigured — add it later if/when actually needed,
same reasoning as everywhere else in this vault: grant only what's used.

**Tool:** `meta_ads_insights(data_inicio?, data_fim?)` — `GET
/act_{id}/insights` on the Graph API (`spend`, `impressions`, `clicks`,
`ctr`, `cpc`, `cpm`, `reach`, `frequency`, `actions` breakdown). Dates
`AAAA-MM-DD`, defaults to today.

**Setup reference** (if regenerating the token): Meta for Developers app
→ case "API de Marketing" (no App Review needed for reading your own ad
account) → Business Manager → System Users → assign the ad account with
"Ver desempenho" only → generate token with just `ads_read` checked →
System User also needs a role ("Desenvolver app" is enough) on the app
itself before it can generate a token at all.

**Known maintenance point:** `META_API_VERSION` (default `v21.0` in the
vault) — Graph API versions are deprecated roughly 2 years after release;
bump this if `meta_ads_insights` starts failing.

## Mercado Pago

Transaction statement for **2 accounts**: "SHS" and "SP" (own company
names). Read-only was a hard requirement here — worth understanding how
that's actually enforced, since Mercado Pago's OAuth `read`/`write` split
is coarser than Meta's (no permission tiers, just "GET-only" vs. "any
method").

**Auth model:** the vault holds each account's **Client ID/Secret** (an
OAuth application's credentials — *not* the static Access Token shown
directly on the Mercado Pago dashboard, which carries full read+write
with no way to restrict it after issuance). On every call, the vault
exchanges Client ID/Secret for a fresh token via `POST
https://api.mercadopago.com/oauth/token` with `grant_type=client_credentials`
and `scope=read` — this token is *cryptographically restricted to GET
requests*, confirmed against Mercado Pago's own docs. It genuinely cannot
create a payment or move money, unlike a scope=write token (which, per
Mercado Pago's API model, likely could call `POST /v1/payments` — the API
doesn't expose a finer-grained "reports only" scope). Because we only
ever need `read`, that whole risk class doesn't apply here.

**Tool:** `mp_extrato(conta, data_inicio?, data_fim?)` — `conta` is `"SHS"`
or `"SP"`. Uses `GET /v1/payments/search` (synchronous — no async report
generation, which was the initial concern raised before building this:
Mercado Pago's newer "Account Money" report flow requires a
config → generate → poll → download cycle unsuitable for daily checks).
`payments/search` covers **both** money received (`collector.id`) and
money sent (`payer.id`) through Mercado Pago's own rails.

**Not covered:** traditional accounts-payable/receivable (scheduled
invoices, aging) — that's a distinct concept from "transactions that
already happened," and lives in the ERP Unique's `api_financeiro*.php`
endpoints instead (mapped but not yet implemented as vault tools — see
`unique-morpheus.md`).

**Pagination:** Mercado Pago's `payments/search` paginates by default
(~30 results/page). The vault loops through pages automatically
(`limit=100` per page, up to 20 pages / 2000 records) — a query result
includes `total` (how many exist) and `truncated` (true only if the
2000-record cap was hit). Discovered live: a first pass without
pagination silently returned only 30 of 323 real transactions.
