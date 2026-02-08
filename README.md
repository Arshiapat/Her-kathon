# Crypto Simulator

A browser-based crypto trading simulator built for women to learn and practice trading with simulated USD and live market prices. No wallet, MetaMask, or blockchain connection required—just open the app and start trading.

## Full Description

Crypto Simulator is a financial education tool that lets users practice buying and selling Bitcoin (BTC), Ethereum (ETH), Solana (SOL), and Dogecoin (DOGE) in a risk-free environment. Users start with a virtual USD balance (default $10,000), trade against **live market prices** fetched from the CoinGecko API, and build a portfolio that is saved locally in the browser. The app includes a safety checklist with flash cards, a crypto education chatbot, and a portfolio value chart that updates over time. It is designed to give women the tools to build financial confidence and independence through hands-on learning.

### Features

- **Virtual balance** — Start with $10,000 simulated USD (configurable on first load), stored in the browser.
- **Live market prices** — Real-time prices for BTC, ETH, SOL, and DOGE via the **CoinGecko API**, updating every 3 seconds.
- **Buy & sell** — Trade any supported coin with realistic gas/fee awareness (ETH gas, BTC tx fees, SOL and DOGE fees).
- **Portfolio** — View holdings, portfolio value, and a value-over-time chart that zooms to show changes clearly.
- **USD preview** — See the dollar equivalent of your trade amount as you type.
- **Safety checklist** — Five core safety tips plus interactive flash cards to reinforce good practices.
- **Crypto chatbot** — Ask questions about crypto basics; responses are powered by keyword matching and optional AI.
- **Transaction history** — View past buys and sells.
- **Persistence** — Balance, holdings, prices, and history persist in `localStorage`.

## Technologies Used

| Technology | Purpose |
|------------|---------|
| **React 18** | UI framework and component-based architecture |
| **Create React App** (`react-scripts` 5.0.1) | Build tooling, dev server, and bundling |
| **CoinGecko API** | Live cryptocurrency prices for BTC, ETH, SOL, and DOGE |
| **localStorage** | Persisting balance, holdings, prices, cost basis, equity history, and transaction history in the browser |
| **Google Fonts (DM Sans)** | Typography |
| **Vanilla JavaScript / CSS** | State management, styling, and SVG charts (no external UI libraries) |

### CoinGecko API

The app uses the [CoinGecko API](https://www.coingecko.com/en/api) (Simple Price endpoint) to fetch real-time USD prices:

```
GET https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,dogecoin&vs_currencies=usd
```

Prices are fetched on load and every 3 seconds. No API key is required for the free tier. If the API is unavailable, the app keeps the last known prices as a fallback.

## Quick Start

```bash
cd her-project/frontend
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000). Enter your starting balance on the intro screen, then start trading. Data is saved in the browser; refresh the page to keep your progress.

## Reset

To reset your balance and holdings, clear `localStorage` for this site (e.g. in DevTools → Application → Local Storage → delete keys starting with `crypto_sim_`), or use the **Start fresh** button in the app header.
