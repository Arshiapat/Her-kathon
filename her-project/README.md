# Crypto Simulator

A browser-based crypto trading simulator. Practice buying and selling with **simulated USD** and **simulated live-updating prices**—no wallet or blockchain required.

## Features

- **Virtual balance** — Start with $10,000 USD (stored in your browser).
- **Live prices** — Simulated prices for BTC, ETH, SOL, and DOGE that update every few seconds.
- **Buy & sell** — Trade any supported coin; balances and portfolio persist in `localStorage`.
- **Portfolio** — See your holdings and total equity at a glance.

## Tech

- **Frontend:** React 18, no backend.

## Quick start

```bash
cd her-project/frontend
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000). Trade with the simulated balance; refresh the page to keep your progress (data is saved in the browser).

## Reset

To reset your balance and holdings, clear `localStorage` for this site (e.g. in DevTools → Application → Local Storage → clear keys starting with `crypto_sim_`).
