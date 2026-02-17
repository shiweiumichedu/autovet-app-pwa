# AutoVet App PWA

Multi-tenant Progressive Web Application for inspection and vetting workflows.

## Tenants

| Path | Description |
|------|-------------|
| `autovet.app/` or `autovet.app/auto` | Automobile pre-purchase inspection |
| `autovet.app/garage` | Garage / mechanic shop inspection |
| `autovet.app/house` | House / property inspection |

## Tech Stack

React 18 + TypeScript + Vite + Tailwind CSS + Supabase

## Setup

```bash
npm install
cp .env.example .env   # Configure your Supabase credentials
npm run dev             # Start dev server on port 5173
```

## Database

Run `database/schema.sql` in your Supabase SQL editor to set up tables and functions.

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for full architecture documentation.
