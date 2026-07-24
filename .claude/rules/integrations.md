# Integrations (MCPs and APIs)

| Integration | Type | Purpose |
|---|---|---|
| **Google Calendar** | MCP | Create/read/update events |
| **Gmail** | MCP | Read, draft and send emails |
| **Linear** | MCP | Development issues and projects |
| **GitHub** | MCP + CLI (gh) | PRs, issues, releases (Evolution repos) |
| **Canva** | MCP | Create and edit designs and presentations |
| **Notion** | MCP | Knowledge base |
| **Telegram** | MCP (vault) | Notifications only. Bot token/chat_id live in the `evonexus-vault` Railway service (sealed vars, private networking) — never in `config/.env`. Agents call the `vault` MCP server's `telegram_notify(text)` tool; Python code (routines, ADWs) calls `POST http://evonexus-vault.railway.internal:8080/notify`. See `ADWs/runner.py:send_telegram()`. Sends only to the one pinned operator chat — no per-call recipient override. |
| **Meta Ads** | MCP (vault) | Read-only insights for the "Moderninha Móveis" ad account. Token is a Meta Business Manager System User token, scope `ads_read` only (no campaign creation/editing). `vault` MCP tool: `meta_ads_insights(data_inicio?, data_fim?)`. |
| **Mercado Pago** | MCP (vault) | Transaction statement (received + sent payments) for 2 accounts, "SHS" and "SP". Vault holds each account's OAuth Client ID/Secret and exchanges them for a `scope=read` access token per call (never the static full-access token from the MP dashboard) — a `read`-scoped token can only do `GET`. `vault` MCP tool: `mp_extrato(conta, data_inicio?, data_fim?)`, via `GET /v1/payments/search` (paginated automatically). |
| **Computer Use** | MCP | Desktop control (screenshots, clicks, typing) |
| **Discord** | API | Community — channels, messages, moderation |
| **WhatsApp** | API (Evolution) | Groups, messages, stats |
| **Fathom** | API | Meetings, transcripts, action items |
| **Todoist** | CLI | Task management (Evolution project) |
| **Stripe** | API | Charges, subscriptions, MRR |
| **Omie** | API | ERP — clients, invoices (NF-e), financials |
| **Bling** | API (OAuth2 auto-refresh) | Brazilian ERP — products, orders, NF-e, contacts, stock. Run `make bling-auth` once to connect |
| **Asaas** | API | Brazilian payments — Pix, boleto, credit card, subscriptions, marketplace split |
| **Unique Morpheus** | MCP (vault) | Moderninha's ERP — caixa, vendas, compras, estoque, metas por vendedor. Login/senha live only in `evonexus-vault` (sealed vars), never in `config/.env`. 6 read-only tools via the `vault` MCP server (`erp_caixa`, `erp_vendas`, `erp_compras_sugestao`, `erp_estoque_parado`, `erp_compras`, `erp_metas_vendedor`). Full details: [docs/integrations/unique-morpheus.md](../../docs/integrations/unique-morpheus.md) |
| **DataCrazy** | MCP (vault) | Moderninha's CRM de atendimento (WhatsApp/Instagram) — leads, conversas, negócios (deals), atendentes. Bearer token lives only in `evonexus-vault` (sealed vars), never in `config/.env`. 4 read-only tools via the `vault` MCP server (`datacrazy_leads`, `datacrazy_conversas`, `datacrazy_negocios`, `datacrazy_atendentes`) — `datacrazy_conversas` already works around a known API bug (broken date filter). Full details: [docs/integrations/datacrazy.md](../../docs/integrations/datacrazy.md) |
| **YouTube** | API (OAuth) | Channel analytics |
| **Instagram** | API (OAuth) | Profile analytics |
| **LinkedIn** | API (OAuth) | Profile/org analytics |
| **Licensing** | API | Open source telemetry (instances, geo, versions) |
| **Figma** | MCP | Design files and prototypes |
| **HubSpot** | MCP | CRM and marketing automation |
| **DocuSign** | MCP | E-signatures and contract management |
| **Amplitude** | MCP | Product analytics |
| **Intercom** | MCP | Customer support platform |

## GitHub Repositories

| Repo | Description |
|------|-----------|
| `EvolutionAPI/evolution-api` | Main API (open source) |
| `EvolutionAPI/evo-ai` | CRM + AI agents |
| `EvolutionAPI/evolution-go` | Evolution Go (EvoGo) |
| `EvolutionAPI/evo-crm-community` | CRM Community edition |
| `EvolutionAPI/EVO-METHOD` | Evo Methodology |

## Servers and Infrastructure

| Command | What it does |
|---------|-----------|
| `make scheduler` | Start the routine scheduler (all automated routines) |
| `make telegram` | Start Telegram bot in background (screen) |
| `make social-auth` | Open social media OAuth login (localhost:8765) |
| `make dashboard` | Generate consolidated 360 dashboard |
| `make daily` | Combo: sync meetings + review todoist |
| `make metrics` | Show accumulated metrics per routine (tokens + cost) |
| `make logs` | Show latest routine logs |
| `make help` | List all available commands |

## HTML Templates

All in `.claude/templates/html/`, Evolution dark theme (green `#00FFA7`, Inter font).
17 templates available — see `ROUTINES.md` for full template-to-routine mapping.
