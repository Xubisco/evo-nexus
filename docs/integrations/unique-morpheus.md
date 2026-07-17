# ERP Unique Morpheus Integration

Unique Morpheus (`uniquesistemas.com.br/op/dashboardop`) is the ERP for
Moderninha's furniture retail operation — cash flow, sales, purchases,
stock, and vendor targets across 5 stores (Camaragibe, Beberibe, Caixa
D'Água, Online, Depósito).

Unlike every other integration in this doc set, Unique Morpheus is **not**
wrapped by a local `int-*` skill. It is exposed exclusively through
**`evonexus-vault`**, a separate Railway service — see
[../../evonexus-vault](https://github.com/Xubisco/evonexus-vault) (sibling
repo) for the source. Agents call it as an MCP server named `vault`
(registered in [`.mcp.json`](../../.mcp.json)), never through `.env`.

## Why the vault, not a skill like Bling/Omie

The other ERPs in this doc set (Bling, Omie) authenticate with API keys or
OAuth tokens meant to be handled by scripts. Unique Morpheus authenticates
with a **plain username/password** against a classic PHP session login —
there is no token to rotate, only a real password. Any agent (or human)
typing that password on a command line to test the integration would be a
standing credential-exposure risk, especially given EvoNexus agents read
arbitrary content (email, web pages) that could contain prompt injection.

`evonexus-vault` holds `ERP_LOGIN`/`ERP_PASSWORD` as Railway **sealed
variables** — irreversibly hidden from the UI, the CLI, and every agent,
including the ones that call the tools below. Agents get *data*, never the
credential.

## Available tools (via the `vault` MCP server)

All read-only, all validated against production data on 2026-07-17.

| Tool | Endpoint | Params | Returns |
|---|---|---|---|
| `erp_caixa(data_inicio?, data_fim?)` | `api_caixa.php` | `dtini`, `dtfim` (default: today), `idempresa=0` | Cash flow: sales by payment method, suprimento/sangria movements, per-store open/closed status |
| `erp_vendas(data_inicio?, data_fim?)` | `apivendas.php` | `dtini`, `dtfim` (default: today) | Sales: revenue/orders/margin by store |
| `erp_compras_sugestao()` | `api_compras_sugestao.php` | none | Stockout risk per product — `STATUS_SEMAFORO` (RUPTURA/BAIXO/OK), `CURVA_ABC`, suggested purchase qty/value |
| `erp_estoque_parado()` | `apiestoqueparado.php` | none | Stale stock — `DIAS_PARADO` per product, hardcoded to items ≥181 days parked |
| `erp_compras(data_inicio?, data_fim?)` | `api_compras.php` | `dtini`, `dtfim` (default: today → effectively current month) | Purchases this month vs. suppliers, order-level detail |
| `erp_metas_vendedor()` | `api_vendedor_meta.php` | none | Per-salesperson target vs. actual (`PERCENTUAL_ATINGIDO`) |

Call them through the `vault` MCP server from any agent session (any agent
whose persona includes MCP tool access — see "Known limitation" below), or
ask an agent to invoke them.

## Login mechanism (for anyone extending this)

```
POST https://uniquesistemas.com.br/op/dashboardop/auth.php
  usuario=<ERP_LOGIN>
  senha=<ERP_PASSWORD>
```

On success the server sets a session cookie (name not hardcoded — the
vault's client keeps the **entire cookie jar** it receives, not a single
named cookie) that must be replayed on every subsequent `api_*.php`
request. The vault re-logs in automatically if a call returns non-JSON
(session expired).

**Two real bugs found and fixed while building this** (both in
`evonexus-vault`'s git history, commits `edde165` and `74423a4`):
1. The login field is `usuario`, not `login` — confirmed by inspecting the
   public login form's DOM at `/op/dashboardop/login.php` (no credentials
   needed for that check, just the static form markup).
2. The session cookie's name was assumed to be `PHPSESSID` (classic PHP
   convention) — wrong assumption. Fixed by capturing the full `httpx`
   client cookie jar instead of one hardcoded name.

## Adding a new endpoint

All 6 tools share one helper, `_erp_get(endpoint, params)`, in
`evonexus-vault/server.py`. To add another `api_*.php` endpoint: add a new
`@mcp.tool` function that calls `_erp_get("api_whatever.php", {...})` and
returns its result — login/session/retry is already handled. Deploy by
pushing to `Xubisco/evonexus-vault` (auto-deploys on Railway).

## Historical note (why this took longer than expected)

Before this vault, **nobody in the EvoNexus workspace had ever actually
tested this API live**. Two agent memories (`flux-finance`'s
`unique-morpheus-api-status.md`, and a reference to a
`.claude/skills/custom-int-unique-morpheus/SKILL.md`) claimed the
endpoints were "tested live in production" — both were false; the SKILL.md
file never existed anywhere on the filesystem, and the actual prior work
(`workspace/finance/[C]custo-fixo-por-loja-unique-morpheus-v3.md`) used
manually-exported CSVs precisely because no one could safely type the real
password anywhere to test the API. If you find another memory claiming
this integration was validated before 2026-07-17, it's the same stale
reference propagating — correct it rather than trusting it.

## Data quirks discovered during validation (2026-07-17)

Useful context for interpreting the numbers, not integration bugs:

- **Pedidos vs. vendas line count**: `erp_vendas` counts *pedidos* (orders);
  `erp_caixa`'s `vendas_detalhe` counts *payment lines*. One order paid
  partly by PENDÊNCIA and partly by PIX shows as 1 pedido but 2 lines —
  reconciles correctly if you're aware of the split.
- **`sangrias` array in `erp_caixa`** mixes both cash movement types via
  `TIPOMOV`: `0` = suprimento (opening float), `1` = sangria (withdrawal),
  despite the array's name suggesting only withdrawals.
- **DEPÓSITO store showing 0% margin**: faturamento equals custo — looks
  like an internal transfer/no-markup entry, not a data error. Worth
  confirming with finance if it recurs.
- **3 salespeople have no target configured** (`erp_metas_vendedor` returns
  `null` for their meta fields) — Leticia Cristina, Thais Leticia, Aline
  Renata. Not a bug; the ERP simply has no goal set for them yet.

## Known limitation: not every agent can call these tools

MCP tool access is scoped per agent persona. `@oracle-onboarding` (Read/
Write/Edit/Glob/Grep/Bash/Skill/Agent only) cannot call `vault` tools
directly. `@flux-finance` and `@clawdia-assistant` can. If an agent says it
doesn't have `erp_*` tools, that's expected scoping, not a vault outage —
switch to an agent with MCP access (start a **new** terminal session with
that agent directly; delegating via the in-session "Teammate" mechanism to
another agent has been unreliable in this workspace — see the vault repo's
git history for context if this changes).
