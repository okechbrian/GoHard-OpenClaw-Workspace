# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## Dev Tools

- **Go:** 1.26.1 at `C:\Program Files\Go` ✅
- **Python:** 3.14.2 ✅
- **Node.js:** v25.8.0 ✅
- **ADB:** Available ✅ (at `Sdk\platform-tools`)
- **Android SDK:** `C:\Users\y\AppData\Local\Android\Sdk` (build-tools 34, 35, 36)
- **ANDROID_HOME:** Set (User level) ✅
- **Android Studio IDE:** Not installed (SDK only — use VS Code or install Studio)
- **Git:** Available ✅
- **Gradle:** Not installed (V2RayNG uses Gradle wrapper `./gradlew`)

## Network

- **Internet:** Direct access (no proxy)
- **ClawHub installer:** `scripts/clawhub-installer.ps1` — downloads skills via curl
  - Usage: `.\scripts/clawhub-installer.ps1 -Slugs @("skill-slug")`

## Model Routing Guide (When to Use What)

| Task Type | Model | Command | Why |
|---|---|---|---|
| Daily chat, simple Q&A | `openrouter/xiaomi/mimo-v2-pro` | default | Free, fast enough |
| Coding (Android, Python, Go) | `zai/glm-5` | `/model GLM` | Best free coder |
| Complex reasoning/analysis | `ollama/deepseek-v3.1:671b-cloud` | `/model ollama/deepseek-v3.1:671b-cloud` | Strongest free reasoning |
| Cron jobs | `openrouter/xiaomi/mimo-v2-flash:free` | set in cron payload | Fastest free model |
| Sub-agents (coding) | `zai/glm-5` | set in spawn | Great for code generation |
| Quick lookups | `openrouter/google/gemma-3-27b-it:free` | `/model openrouter/google/gemma-3-27b-it:free` | Fast free model |

**Tip:** Use `/model GLM` to switch before coding sessions, `/model` to switch back.

## Installed Skills (2026-03-22)

| Skill | Source | Purpose |
|-------|--------|---------|
| `summarize` | ClawHub | Summarize URLs, PDFs, audio, docs |
| `agent-browser-clawdbot` | ClawHub | Headless browser automation |
| `github-cli` | ClawHub | GitHub CLI reference |
| `gog` | ClawHub | Google Workspace (Gmail, Calendar, Drive) |
| `n8n` | ClawHub | n8n workflow automation |
| `xiucheng-self-improving-agent` | ClawHub | Self-improvement from corrections |
| `mcporter` | ClawHub | MCP server integration |
| `ontology` | ClawHub | Knowledge graph & structured memory |
| `power-monitor` | Local | UEDCL power outage alerts |
| `social-media-scheduler` | ClawHub | Social media content planning & calendars |
| `stripe-api` | ClawHub | Stripe payments via Maton (requires MATON_API_KEY) |
| `weather` | Local | Weather checks |
| `healthcheck` | Local | Security audit |
| `skill-creator` | Local | Create/edit skills |
| `goplaces` | Config | API key configured |
| `nano-banana-pro` | Config | API key configured |

---

## Monetization System (2026-03-22)

**Location:** `scripts/monetization/`
- `channel_config.json` — Channel config, pricing, affiliate partners
- `content_templates.md` — Free vs Premium content templates
- `monetization_manager.py` — Core manager (referrals, affiliates, reports)
- `templates.py` — All message templates (welcome, reports, compensation)
- `referrals.json` — Referral tracking
- `QUICKSTART.md` — Step-by-step setup guide

**Channels:**
- Free: `@poweralerts` (chat_id: -1003411154118)
- Premium: `@poweralerts_premium` (to be created)

**Pricing:**
- Monthly: 5,000 UGX (~$1.3) / 50 Telegram Stars
- Quarterly: 12,000 UGX (20% off) / 120 Telegram Stars
- Yearly: 40,000 UGX (33% off) / 400 Telegram Stars

**Payment Methods:**
- Telegram Stars: Built-in, works now
- Flutterwave: MTN MoMo, Airtel Money (needs API keys)

**Payment Scripts:**
- `telegram_stars.py` — Send invoices via Telegram Stars
- `flutterwave_integration.py` — Flutterwave mobile money integration
- `flutterwave_config.json` — API keys config (needs your keys)
- `incident_reporter.py` — Outage reporting with GPS/GIS mapping
- `data/incident_reports.json` — All incident reports
- `data/outage_heatmap.html` — Visual heatmap

---

Add whatever helps you do your job. This is your cheat sheet.
