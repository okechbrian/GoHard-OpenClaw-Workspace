# Pwata Creatives — Accounting System

A free, mobile-first accounting system for Pwata Creatives (digital designs & branding, Uganda).

## Features
- 📊 **Dashboard** — revenue, expenses, profit at a glance
- 💰 **Sales Tracking** — log transactions (Cash, MTN MoMo, Airtel Money)
- 📉 **Expense Tracking** — categorize and monitor costs
- 👥 **Customer Database** — track clients and order history
- 🧾 **Invoice Generator** — create professional invoices
- 📈 **Reports** — profit/loss, payment breakdowns, top customers
- 📱 **PWA** — installs on phone home screen, works offline
- 👫 **Multi-user** — GoHard + wife

## Tech Stack
- **Frontend:** Next.js 16 + React 19 + Tailwind CSS
- **Database:** SQLite (via better-sqlite3)
- **ORM:** Drizzle
- **Deployment:** PWA (Progressive Web App)

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Project Structure
```
pwata-accounting/
├── src/
│   ├── app/
│   │   ├── page.tsx          # Dashboard
│   │   ├── sales/page.tsx    # Sales tracking
│   │   ├── expenses/page.tsx # Expense tracking
│   │   ├── customers/page.tsx # Customer database
│   │   ├── invoices/page.tsx # Invoice management
│   │   ├── reports/page.tsx  # P&L reports
│   │   └── api/              # REST API routes
│   ├── lib/
│   │   ├── db.ts             # Database setup & schema
│   │   └── utils.ts          # Helpers (formatting, IDs)
│   └── components/           # Reusable UI components
├── data/pwata.db             # SQLite database
├── public/manifest.json      # PWA manifest
└── drizzle/                  # DB migrations
```

## API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/sales | List all sales |
| POST | /api/sales | Create sale |
| GET | /api/expenses | List all expenses |
| POST | /api/expenses | Create expense |
| GET | /api/customers | List customers |
| POST | /api/customers | Create customer |
| GET | /api/invoices | List invoices |
| POST | /api/invoices | Create invoice |
| GET | /api/reports | Profit & loss report |

## License
Private — Pwata Creatives
