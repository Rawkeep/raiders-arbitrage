# ⚡ FlipFlow Pro

## Quick Deploy

### Railway (empfohlen)
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/Rawkeep/FlipFlow-AI-Creator)

### Docker
```bash
docker build -t flipflow .
docker run -p 3002:3001 --env-file .env flipflow
```

### Coolify (Self-Hosted)
Siehe [Deployment-Guide](https://github.com/Rawkeep/deployment)

---

**Multi-Plattform Arbitrage Engine** — Finde unterbewertete Listings, kaufe günstig, verkaufe mit Gewinn.

## Features

- **eBay API** — Offizielle Browse API, Suche + Marktpreisbewertung
- **Etsy API** — Offizielle Open API v3
- **Chrome Extension** — Erfasst Listings von Kleinanzeigen, Vinted & FB Marketplace
- **CSV Import** — Beliebige Listings per CSV importieren
- **KI-Scoring** — Automatische Bewertung nach Marge, Zustand, Verkäufertyp
- **Cross-Plattform Arbitrage** — Beste Verkaufsplattform inkl. Gebühren berechnet
- **HITL Review** — Human-in-the-Loop Entscheidungsprozess
- **Token-Zugang** — Admins erstellen Tokens, User geben sie auf der Landing Page ein
- **IndexedDB + localStorage** — Duale Persistenz, offline-fähig
- **Daten Export/Import** — JSON Backup & Wiederherstellung
- **PWA-fähig** — Installierbar auf Mobile via "Add to Homescreen"

## Architektur

```
Frontend (React + Vite)
  │
  ├── /api/search    → eBay Browse API + Etsy Open API
  ├── /api/prices    → eBay Marktpreise
  ├── /api/import    → CSV / JSON / Extension Import
  │
Backend (Express / Node.js)

Chrome Extension → Kleinanzeigen / Vinted / FB Marketplace
  └── Liest DOM → sendet an /api/import
```

## Schnellstart

```bash
# 1. Dependencies installieren
npm install

# 2. API Keys konfigurieren
cp .env.example .env
# → .env bearbeiten und Keys eintragen

# 3. Starten (Frontend + Backend parallel)
npm run dev
```

Die App öffnet sich auf `http://localhost:3000`.
Ohne API Keys läuft sie im **Demo-Modus** mit generierten Daten.

## API Keys einrichten

### eBay (kostenlos)

1. → https://developer.ebay.com → Account erstellen
2. "Application Keys" → Production Keys generieren
3. `EBAY_APP_ID` und `EBAY_CERT_ID` in `.env` eintragen
4. Optional: `EBAY_MARKETPLACE` ändern (Default: `EBAY_DE`)

Verfügbare Märkte: `EBAY_DE`, `EBAY_US`, `EBAY_GB`, `EBAY_FR`, `EBAY_IT`, `EBAY_ES`, `EBAY_AU`, `EBAY_AT`, `EBAY_CH`, `EBAY_NL`, `EBAY_BE`

### Etsy (kostenlos)

1. → https://www.etsy.com/developers → App erstellen
2. API Key kopieren
3. `ETSY_API_KEY` in `.env` eintragen

## Chrome Extension installieren

Für Kleinanzeigen, Vinted und FB Marketplace:

1. Chrome öffnen → `chrome://extensions`
2. **Developer Mode** aktivieren (oben rechts)
3. **"Load unpacked"** → `extension/` Ordner auswählen
4. Auf Kleinanzeigen/Vinted/FB gehen → ⚡ Button unten rechts klicken
5. Im Extension-Popup: **"Listings erfassen"** → **"An FlipFlow senden"**

## CSV Import

Listings per CSV importieren (Semikolon-getrennt):

```csv
title;price;platform;condition;url;location;seller;vb
iPhone 14 Pro 128GB;450;kleinanzeigen;wie-neu;https://...;Berlin;max_m;ja
LEGO Star Wars UCS;280;kleinanzeigen;neu;https://...;Hamburg;lego_fan;nein
```

Über das ☰ Menü im Header → **"CSV Listings importieren"**.

## Token-System

### Als Admin

1. Landing Page → **"Admin Login"**
2. Master-Passwort eingeben (Default: `flipflow2024`, änderbar in `.env`)
3. Tokens erstellen → an User verteilen
4. Tokens können deaktiviert, reaktiviert oder gelöscht werden

### Als User

1. Landing Page → **"Token eingeben"**
2. Token im Format `FF-XXXX-XXXX-XXXX` eingeben
3. Zugang zur App

## Scripts

| Script | Beschreibung |
|---|---|
| `npm run dev` | Frontend + Backend parallel starten |
| `npm run dev:frontend` | Nur Vite Dev Server |
| `npm run dev:server` | Nur Express Backend |
| `npm run build` | Production Build (Frontend) |
| `npm run server` | Nur Backend starten |
| `npm run start` | Production: Preview + Backend |

## Deployment

### Vercel (Frontend only)

```bash
npx vercel
```

Backend separat auf Railway, Render, Fly.io etc. deployen und `VITE_API_URL` setzen.

### Docker (Full Stack — empfohlen)

```bash
docker compose up -d
```

Läuft auf Port `8080`. Frontend + API in einem Container.

### Netlify (Frontend only)

```bash
npx netlify deploy --prod --dir=dist
```

### Manuell

```bash
npm run build
node server/index.js
```

Server liefert Frontend + API auf einem Port aus.

## Projektstruktur

```
├── index.html                 HTML Entry mit SEO, OG Tags, PWA
├── package.json               Dependencies & Scripts
├── vite.config.js             Vite + API Proxy Config
├── .env.example               API Keys Template
├── .gitignore
│
├── src/
│   ├── main.jsx               App Router (Landing ↔ Admin ↔ App)
│   ├── App.jsx                Haupt-App (alle Stages)
│   ├── Landing.jsx            Landing Page + Token/Admin Modals
│   ├── TokenAdmin.jsx         Token Management Panel
│   ├── ErrorBoundary.jsx      Production Crash Handler
│   ├── api.js                 API Client (Frontend → Backend)
│   ├── auth.js                Token Auth System
│   ├── db.js                  IndexedDB + localStorage Dual-Layer
│   └── usePersistedState.js   React Hook für persistierten State
│
├── server/
│   ├── index.js               Express Server + Static Serving
│   ├── routes/
│   │   ├── search.js          Multi-Platform Search Endpoint
│   │   ├── prices.js          Marktpreis-Abfrage
│   │   └── import.js          CSV / JSON / Extension Import
│   └── services/
│       ├── ebay.js            eBay Browse API + OAuth
│       ├── etsy.js            Etsy Open API v3
│       └── scoring.js         KI-Scoring Engine
│
├── extension/
│   ├── manifest.json          Chrome Extension Manifest v3
│   ├── content.js             DOM Parser (Kleinanzeigen/Vinted/FB)
│   ├── content.css            Capture Button Styling
│   ├── popup.html             Extension Popup UI
│   └── popup.js               Popup Logic
│
├── public/
│   ├── favicon.svg            App Icon
│   ├── manifest.json          PWA Manifest
│   └── og-image.svg           Social Share Bild
│
├── Dockerfile                 Multi-Stage Docker Build
├── docker-compose.yml         One-Command Deploy
├── nginx.conf                 Nginx Config (wenn ohne Node)
├── vercel.json                Vercel Deploy Config
└── netlify.toml               Netlify Deploy Config
```

## Umgebungsvariablen

| Variable | Beschreibung | Default |
|---|---|---|
| `EBAY_APP_ID` | eBay Application ID | — |
| `EBAY_CERT_ID` | eBay Cert ID | — |
| `EBAY_MARKETPLACE` | eBay Markt | `EBAY_DE` |
| `ETSY_API_KEY` | Etsy API Key | — |
| `PORT` | Server Port | `3001` |
| `NODE_ENV` | Environment | `development` |
| `MASTER_PASSWORD` | Admin Master-Passwort | `flipflow2024` |

## Lizenz

Proprietär. Alle Rechte vorbehalten.
