# Flex Rent — Demo App

A Flex-style rent splitting demo for local testing and client presentations. No external API keys required.

## Quick start (local)

```bash
cd c:\flex
npm install
npm run dev
```

Then open:

| App | URL |
|-----|-----|
| **Tenant / Landlord UI** | http://localhost:5173 |
| **API** | http://localhost:3001 |
| **API health** | http://localhost:3001/api/health |

The web dev server also binds to your LAN IP (via `--host`), so you can demo on a phone or client laptop on the same Wi‑Fi using the **Network** URL printed in the terminal (e.g. `http://192.168.x.x:5173`).

## Deploy to Railway

The app deploys as a **single service**: the API builds the React UI and serves everything on one port (Railway's `PORT`).

### Option A — Deploy from GitHub

1. Push this project to a GitHub repo.
2. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**.
3. Select the repo. Railway reads `railway.toml` and runs:
   - **Build:** `npm ci && npm run build`
   - **Start:** `npm run start`
4. Open **Settings → Networking → Generate Domain** to get a public URL (e.g. `https://flex-rent.up.railway.app`).
5. Visit your domain — the UI and API are both served from that URL.

### Option B — Deploy from CLI

```bash
cd c:\flex
npm i -g @railway/cli
railway login
railway init
railway up
railway domain
```

### Persist demo data (optional)

By default, demo data lives on the container filesystem and resets on redeploy. To keep `store.json` across deploys:

1. In Railway → your service → **Volumes** → **Add Volume**
2. Mount path: `/data`
3. Add variable: `DATA_DIR` = `/data`
4. Redeploy

### Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | Auto-set by Railway | HTTP port (do not override) |
| `NODE_ENV` | Auto-set to `production` | Enables static file serving |
| `DATA_DIR` | Optional | Directory for `store.json` (use with a volume) |

### Health check

Railway uses `/api/health` as the health check endpoint.

## Demo accounts

On the login screen, pick a role to sign in instantly (no password):

| Role | Email | What you can demo |
|------|-------|-------------------|
| **Tenant** | jane@demo.com | Split rent into 2 payments, pay installments, view schedule |
| **Landlord** | owner@sunset.com | See guaranteed on-time payouts and enrolled tenants |
| **Admin** | admin@flex.local | Platform overview, users, and payment activity |

Data persists in `apps/api/data/store.json` (or `DATA_DIR` on Railway) between restarts.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start API + web with hot reload |
| `npm run build` | Build the web app for production |
| `npm run start` | Run production server (API + built UI on one port) |

## Showing the client

1. Run `npm run dev` locally, or share your Railway URL.
2. Walk through **Tenant** flow first: dashboard → schedule 2nd payment → make a payment.
3. Switch to **Landlord** to show full rent paid on the due date.
4. Open **Admin** for platform-level metrics.

To reset demo data, delete `store.json` (or use Admin → Reset demo data) and restart.

## Project structure

```
flex/
  apps/
    api/    Express API with mock payments & JSON persistence
    web/    React + Vite + Tailwind UI
  railway.toml
  nixpacks.toml
```
