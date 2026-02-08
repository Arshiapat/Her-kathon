import React, { useState, useEffect, useCallback } from 'react';
import CryptoChatbot from './CryptoChatbot';
import History from './History';
import SafetyChecklist from './SafetyChecklist';
import fulllogo from './images/fulllogo.png';

const COINS = [
  {
    id: 'btc',
    name: 'Bitcoin',
    symbol: 'BTC',
    emoji: '₿',
    description: 'The first cryptocurrency, created in 2009. Bitcoin is decentralized digital money that operates without a central bank. It\'s often called "digital gold" and is used for store of value and payments.',
    howToInvest: 'Start small — you can buy fractions of a Bitcoin. Consider dollar-cost averaging (investing a fixed amount regularly) to reduce timing risk.',
  },
  {
    id: 'eth',
    name: 'Ethereum',
    symbol: 'ETH',
    emoji: 'Ξ',
    description: 'A blockchain platform that runs smart contracts and powers decentralized apps (dApps). Ethereum enables NFTs, DeFi, and many other innovations beyond simple payments.',
    howToInvest: 'Research the ecosystem first. Ethereum\'s value is tied to its network usage and developer activity. Many investors hold both Bitcoin and Ethereum for diversification.',
  },
  {
    id: 'sol',
    name: 'Solana',
    symbol: 'SOL',
    emoji: '◎',
    description: 'A fast, low-cost blockchain designed for scalability. Solana can process thousands of transactions per second and supports DeFi, NFTs, and gaming applications.',
    howToInvest: 'Solana is riskier than Bitcoin or Ethereum due to its younger ecosystem. Consider it a higher-growth, higher-volatility option and size your position accordingly.',
  },
  {
    id: 'doge',
    name: 'Dogecoin',
    symbol: 'DOGE',
    emoji: 'Ð',
    description: 'Originally created as a meme coin in 2013, Dogecoin has gained mainstream adoption. It uses a simpler technology than Bitcoin and has lower transaction fees.',
    howToInvest: 'Treat Dogecoin as speculative — it\'s heavily influenced by social media and celebrity endorsements. Only invest what you\'re comfortable losing, and avoid FOMO.',
  },
];

const QUOTES = [
  { author: 'Carrie Schwab‑Pomerantz', text: 'For women, financial independence isn\'t optional; it\'s a necessity for real security and choice.' },
  { author: 'Linda Davis Taylor', text: 'Teach a girl how money works and she can reshape her future—and the world.' },
  { author: 'Tiffany Welka', text: 'Invest with intent, not impulse; every decision should move you toward your real goals.' },
  { author: 'Doris P. Meister', text: 'Take measured risk—courage plus discipline is how women build lasting wealth and confidence.' },
  { author: 'Meltem Demirors', text: 'These numbers show a huge opportunity for women, if we build inclusive crypto communities together.' },
  { author: 'Meltem Demirors', text: 'Being surrounded by brilliant women in bitcoin proves we belong in every part of this industry.' },
  { author: 'Meltem Demirors', text: 'We need leaders in crypto who actively build a richer, more diverse community of stakeholders.' },
  { author: 'Linda Davis Taylor', text: 'Wealth without knowledge is wasted; financial education turns money into real options and freedom.' },
  { author: 'Carrie Schwab‑Pomerantz', text: 'Financial independence is essential for women; it protects you, your family, and your future.' },
  { author: 'Tiffany Welka', text: 'Invest with intent: align every investment with your values, timeline, and personal vision.' },
];

const DEFAULT_INITIAL_USD = 10000;
const STORAGE_KEYS = {
  balance: 'crypto_sim_usd',
  holdings: 'crypto_sim_holdings',
  prices: 'crypto_sim_prices',
  costBasis: 'crypto_sim_cost_basis',
  equityHistory: 'crypto_sim_equity_history',
  priceHistory: 'crypto_sim_price_history',
  transactionHistory: 'crypto_sim_transaction_history',
  introComplete: 'crypto_sim_intro_complete',
  initialUsd: 'crypto_sim_initial_usd',
};

function isIntroComplete() {
  try {
    const v = localStorage.getItem(STORAGE_KEYS.introComplete);
    if (v === 'true') return true;
    if (localStorage.getItem(STORAGE_KEYS.balance) != null) {
      localStorage.setItem(STORAGE_KEYS.introComplete, 'true');
      const bal = parseFloat(localStorage.getItem(STORAGE_KEYS.balance));
      if (Number.isFinite(bal)) localStorage.setItem(STORAGE_KEYS.initialUsd, String(bal));
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

function loadInitialUsd() {
  try {
    const v = localStorage.getItem(STORAGE_KEYS.initialUsd);
    return v != null && Number.isFinite(parseFloat(v)) ? parseFloat(v) : DEFAULT_INITIAL_USD;
  } catch {
    return DEFAULT_INITIAL_USD;
  }
}

function clearAllUserData() {
  try {
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
    window.location.reload();
  } catch (_) {}
}

// Fallback prices (USD) – used when market API is unavailable
const BASE_PRICES = { btc: 43200, eth: 2280, sol: 98, doge: 0.082 };

const COINGECKO_IDS = { btc: 'bitcoin', eth: 'ethereum', sol: 'solana', doge: 'dogecoin' };

async function fetchLivePrices() {
  try {
    const ids = Object.values(COINGECKO_IDS).join(',');
    const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`);
    if (!res.ok) return null;
    const data = await res.json();
    const next = {};
    for (const [key, id] of Object.entries(COINGECKO_IDS)) {
      const usd = data[id]?.usd;
      if (typeof usd === 'number' && usd > 0) next[key] = usd;
    }
    return Object.keys(next).length === 4 ? next : null;
  } catch {
    return null;
  }
}

// Gas fee in ETH – converted to USD using current ETH price when selling
const GAS_FEE_ETH = { low: 0.001, medium: 0.003, high: 0.008 };

// Bitcoin transaction fee: size (bytes) × fee rate (sat/byte) → satoshis. 1 BTC = 100,000,000 satoshis.
const BTC_TX_SIZE_BYTES = 250;
const BTC_FEE_RATE_SAT_PER_BYTE = { low: 15, medium: 50, high: 150 };
function btcFeeBtc(tier) {
  const rate = BTC_FEE_RATE_SAT_PER_BYTE[tier] ?? BTC_FEE_RATE_SAT_PER_BYTE.medium;
  return (BTC_TX_SIZE_BYTES * rate) / 100_000_000;
}

// Solana transaction fee – fixed ~0.000005 SOL per transaction
const SOL_FEE_SOL = 0.000005;

// Dogecoin transaction fee – average on-chain fees ~$0.0014–$0.08; fixed 0.05 DOGE
const DOGE_FEE_DOGE = 0.05;

function loadNumber(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v != null ? parseFloat(v) : fallback;
  } catch {
    return fallback;
  }
}

function loadHoldings() {
  try {
    const v = localStorage.getItem(STORAGE_KEYS.holdings);
    if (!v) return { btc: 0, eth: 0, sol: 0, doge: 0 };
    const o = JSON.parse(v);
    return { btc: 0, eth: 0, sol: 0, doge: 0, ...o };
  } catch {
    return { btc: 0, eth: 0, sol: 0, doge: 0 };
  }
}

function loadPrices() {
  try {
    const v = localStorage.getItem(STORAGE_KEYS.prices);
    if (!v) return { ...BASE_PRICES };
    const o = JSON.parse(v);
    return { ...BASE_PRICES, ...o };
  } catch {
    return { ...BASE_PRICES };
  }
}

function saveBalance(b) {
  try {
    localStorage.setItem(STORAGE_KEYS.balance, String(b));
  } catch (_) {}
}
function saveHoldings(h) {
  try {
    localStorage.setItem(STORAGE_KEYS.holdings, JSON.stringify(h));
  } catch (_) {}
}
function savePrices(p) {
  try {
    localStorage.setItem(STORAGE_KEYS.prices, JSON.stringify(p));
  } catch (_) {}
}

const EMPTY_COST_BASIS = { btc: { totalCost: 0, totalQty: 0 }, eth: { totalCost: 0, totalQty: 0 }, sol: { totalCost: 0, totalQty: 0 }, doge: { totalCost: 0, totalQty: 0 } };
function loadCostBasis() {
  try {
    const v = localStorage.getItem(STORAGE_KEYS.costBasis);
    if (!v) return { ...EMPTY_COST_BASIS };
    const o = JSON.parse(v);
    return { ...EMPTY_COST_BASIS, ...o };
  } catch {
    return { ...EMPTY_COST_BASIS };
  }
}
function saveCostBasis(cb) {
  try {
    localStorage.setItem(STORAGE_KEYS.costBasis, JSON.stringify(cb));
  } catch (_) {}
}

const MAX_HISTORY_POINTS = 120;
function loadEquityHistory() {
  try {
    const v = localStorage.getItem(STORAGE_KEYS.equityHistory);
    if (!v) return [];
    return JSON.parse(v);
  } catch {
    return [];
  }
}
function saveEquityHistory(h) {
  try {
    const trimmed = h.slice(-MAX_HISTORY_POINTS);
    localStorage.setItem(STORAGE_KEYS.equityHistory, JSON.stringify(trimmed));
  } catch (_) {}
}

function loadPriceHistory() {
  try {
    const v = localStorage.getItem(STORAGE_KEYS.priceHistory);
    if (!v) return [];
    return JSON.parse(v);
  } catch {
    return [];
  }
}
function savePriceHistory(h) {
  try {
    const trimmed = h.slice(-MAX_HISTORY_POINTS);
    localStorage.setItem(STORAGE_KEYS.priceHistory, JSON.stringify(trimmed));
  } catch (_) {}
}

const MAX_TRANSACTIONS = 200;
function loadTransactionHistory() {
  try {
    const v = localStorage.getItem(STORAGE_KEYS.transactionHistory);
    if (!v) return [];
    return JSON.parse(v);
  } catch {
    return [];
  }
}
function saveTransactionHistory(t) {
  try {
    const trimmed = t.slice(-MAX_TRANSACTIONS);
    localStorage.setItem(STORAGE_KEYS.transactionHistory, JSON.stringify(trimmed));
  } catch (_) {}
}

function formatUsd(n) {
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${n.toFixed(2)}`;
  return `$${n.toFixed(4)}`;
}

function formatCrypto(n) {
  if (n >= 1) return n.toFixed(4);
  return n.toFixed(6);
}

function ProfitChart({ data, initialUsd }) {
  if (!data || data.length < 2) return null;
  const w = 800;
  const h = 220;
  const pad = { top: 16, right: 16, bottom: 24, left: 56 };
  const minT = Math.min(...data.map((d) => d.t));
  const maxT = Math.max(...data.map((d) => d.t));
  const dataMinV = Math.min(...data.map((d) => d.v));
  const dataMaxV = Math.max(...data.map((d) => d.v));
  const dataRange = dataMaxV - dataMinV || initialUsd * 0.02;
  const padding = Math.max(dataRange * 0.15, initialUsd * 0.005);
  const minV = dataMinV - padding;
  const maxV = dataMaxV + padding;
  const rangeT = maxT - minT || 1;
  const rangeV = maxV - minV || 1;
  const x = (t) => pad.left + ((t - minT) / rangeT) * (w - pad.left - pad.right);
  const y = (v) => pad.top + (1 - (v - minV) / rangeV) * (h - pad.top - pad.bottom);
  const pathD = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(d.t)} ${y(d.v)}`).join(' ');
  const baselineY = y(initialUsd);
  return (
    <div style={chartStyles.wrapper}>
      <svg viewBox={`0 0 ${w} ${h}`} style={chartStyles.svg}>
        <line x1={pad.left} y1={baselineY} x2={w - pad.right} y2={baselineY} stroke="rgba(181,107,158,0.4)" strokeDasharray="4 4" strokeWidth={1} />
        <path d={pathD} fill="none" stroke="#b56b9e" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

const chartStyles = {
  wrapper: { background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(189,147,169,0.25)', borderRadius: 18, padding: 20, overflow: 'hidden' },
  svg: { width: '100%', height: 220, display: 'block' },
};

const QUOTE_SLOT_HEIGHT = 110;

function RotatingQuote() {
  const [quoteIndex, setQuoteIndex] = useState(() => Math.floor(Math.random() * QUOTES.length));

  useEffect(() => {
    const id = setInterval(() => {
      setQuoteIndex((prev) => {
        let next = Math.floor(Math.random() * QUOTES.length);
        while (next === prev && QUOTES.length > 1) next = Math.floor(Math.random() * QUOTES.length);
        return next;
      });
    }, 10000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={quoteStyles.viewport}>
      <div
        style={{
          ...quoteStyles.reel,
          transform: `translateY(-${quoteIndex * QUOTE_SLOT_HEIGHT}px)`,
          transition: 'transform 0.7s cubic-bezier(0.25, 0.1, 0.25, 1)',
        }}
      >
        {QUOTES.map((q, i) => (
          <div key={i} style={quoteStyles.slot}>
            <p style={quoteStyles.quote}>
              <span>"{q.text}"</span>
              <cite style={quoteStyles.author}>— {q.author}</cite>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

const quoteStyles = {
  viewport: {
    height: QUOTE_SLOT_HEIGHT,
    overflow: 'hidden',
    marginBottom: 20,
  },
  reel: {
    display: 'flex',
    flexDirection: 'column',
  },
  slot: {
    height: QUOTE_SLOT_HEIGHT,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    flexShrink: 0,
  },
  quote: {
    margin: 0,
    fontSize: '1rem',
    color: '#4a4458',
    lineHeight: 1.45,
    fontStyle: 'italic',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
  },
  author: {
    display: 'inline',
    marginLeft: 6,
    fontSize: '0.95rem',
    color: '#6b6578',
    fontStyle: 'normal',
  },
};

function IntroPage({ onComplete }) {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const val = parseFloat(amount.replace(/[,$]/g, ''));
    if (!Number.isFinite(val) || val <= 0) {
      setError('Please enter a valid amount.');
      return;
    }
    if (val > 1000000000) {
      setError('Let\'s keep it under $1 billion for this simulation.');
      return;
    }
    setError(null);
    try {
      localStorage.setItem(STORAGE_KEYS.balance, String(val));
      localStorage.setItem(STORAGE_KEYS.initialUsd, String(val));
      localStorage.setItem(STORAGE_KEYS.introComplete, 'true');
    } catch (_) {}
    onComplete(val);
  };

  return (
    <div style={introStyles.container}>
      <div style={introStyles.card}>
        <h1 style={{ margin: 0, textAlign: 'center' }}>
          <img src={fulllogo} alt="Crypto Simulator" style={{ height: '5.00rem', width: 'auto', display: 'block', margin: '0 auto' }} />
        </h1>
        <p style={introStyles.subtitle}>Learn at your own pace with simulated USD and live prices on the blockchain, giving women the tools to build financial confidence and independence.</p>
        <form onSubmit={handleSubmit} style={introStyles.form}>
          <label style={introStyles.label}>How much would you like to invest?</label>
          <div style={introStyles.inputRow}>
            <span style={introStyles.dollar}>$</span>
            <input
              type="text"
              inputMode="decimal"
              placeholder="10,000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={introStyles.input}
              autoFocus
            />
          </div>
          {error && <p style={introStyles.error}>{error}</p>}
          <button type="submit" style={introStyles.button}>Start trading</button>
        </form>
      </div>
    </div>
  );
}

const introStyles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(160deg, #fef7f5 0%, #faf5f8 35%, #f5f0fa 70%, #f0f4f8 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    fontFamily: '"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  card: {
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: 48,
    maxWidth: 420,
    width: '100%',
    border: '1px solid rgba(189, 147, 169, 0.25)',
    boxShadow: '0 8px 40px rgba(181, 107, 158, 0.12)',
  },
  title: {
    margin: 0,
    fontSize: '1.75rem',
    fontWeight: 700,
    background: 'linear-gradient(135deg, #c77b8a 0%, #b56b9e 40%, #8b7ab8 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    textAlign: 'center',
  },
  subtitle: {
    color: '#6b6578',
    fontSize: '0.95rem',
    textAlign: 'center',
    margin: '8px 0 32px',
    lineHeight: 1.5,
  },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  label: { fontSize: '0.95rem', color: '#4a4458', fontWeight: 500 },
  inputRow: {
    display: 'flex',
    alignItems: 'center',
    border: '1px solid rgba(189, 147, 169, 0.35)',
    borderRadius: 14,
    paddingLeft: 16,
    background: 'rgba(255,255,255,0.9)',
  },
  dollar: { fontSize: '1.25rem', color: '#6b6578', fontWeight: 500 },
  input: {
    flex: 1,
    padding: '16px 16px 16px 8px',
    fontSize: '1.25rem',
    border: 'none',
    background: 'transparent',
    color: '#3d3a4a',
    outline: 'none',
  },
  error: { margin: 0, fontSize: '0.9rem', color: '#c45c5c' },
  button: {
    padding: 16,
    fontSize: '1rem',
    fontWeight: 600,
    color: '#fff',
    background: 'linear-gradient(135deg, #b56b9e 0%, #9a5a8a 100%)',
    border: 'none',
    borderRadius: 14,
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(181, 107, 158, 0.35)',
    marginTop: 8,
  },
};

function App() {
  const [introComplete, setIntroComplete] = useState(isIntroComplete);
  const [usdBalance, setUsdBalance] = useState(() => loadNumber(STORAGE_KEYS.balance, DEFAULT_INITIAL_USD));
  const initialUsd = loadInitialUsd();
  const [holdings, setHoldings] = useState(loadHoldings);
  const [prices, setPrices] = useState(loadPrices);
  const [selectedCoin, setSelectedCoin] = useState('btc');
  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState('buy'); // 'buy' | 'sell'
  const [gasTier, setGasTier] = useState('medium'); // 'low' | 'medium' | 'high'
  const [btcFeeTier, setBtcFeeTier] = useState('medium'); // 'low' | 'medium' | 'high'
  const [message, setMessage] = useState(null);
  const [hoveredCoin, setHoveredCoin] = useState(null);
  const [startFreshHover, setStartFreshHover] = useState(false);
  const [historyHover, setHistoryHover] = useState(false);
  const [safetyHover, setSafetyHover] = useState(false);
  const [costBasis, setCostBasis] = useState(loadCostBasis);
  const [equityHistory, setEquityHistory] = useState(loadEquityHistory);
  const [priceHistory, setPriceHistory] = useState(loadPriceHistory);
  const [transactionHistory, setTransactionHistory] = useState(loadTransactionHistory);
  const [activeView, setActiveView] = useState('main');

  const portfolioValue = COINS.reduce((sum, c) => sum + (holdings[c.id] || 0) * (prices[c.id] || 0), 0);
  const totalEquity = usdBalance + portfolioValue;

  const recordEquityPoint = useCallback((equity) => {
    setEquityHistory((prev) => {
      const next = [...prev, { t: Date.now(), v: equity }];
      saveEquityHistory(next);
      return next;
    });
  }, []);

  const tickPrices = useCallback(async () => {
    const next = await fetchLivePrices();
    if (next) {
      setPrices((prev) => {
        const merged = { ...prev, ...next };
        savePrices(merged);
        return merged;
      });
    }
  }, []);

  useEffect(() => {
    if (!introComplete) return;
    tickPrices();
    const id = setInterval(tickPrices, 3000);
    return () => clearInterval(id);
  }, [introComplete, tickPrices]);

  useEffect(() => {
    if (!introComplete) return;
    if (equityHistory.length === 0) {
      const now = Date.now();
      const seed = [
        { t: now - 60000, v: initialUsd },
        { t: now, v: totalEquity },
      ];
      setEquityHistory(seed);
      saveEquityHistory(seed);
    }
  }, [introComplete]);

  useEffect(() => {
    if (!introComplete) return;
    const id = setInterval(() => recordEquityPoint(totalEquity), 1000);
    return () => clearInterval(id);
  }, [introComplete, totalEquity, recordEquityPoint]);

  useEffect(() => {
    if (!introComplete) return;
    saveBalance(usdBalance);
  }, [introComplete, usdBalance]);
  useEffect(() => {
    if (!introComplete) return;
    saveHoldings(holdings);
  }, [introComplete, holdings]);
  useEffect(() => {
    if (!introComplete) return;
    saveCostBasis(costBasis);
  }, [introComplete, costBasis]);

  const handleTrade = () => {
    const val = parseFloat(amount);
    if (!Number.isFinite(val) || val <= 0) {
      setMessage('Enter a valid amount.');
      return;
    }
    const coin = COINS.find((c) => c.id === selectedCoin);
    const price = prices[selectedCoin] || 0;
    if (mode === 'buy') {
      const cost = val * price;
      if (cost > usdBalance) {
        setMessage('Insufficient USD balance.');
        return;
      }
      setUsdBalance((b) => b - cost);
      setHoldings((h) => ({ ...h, [selectedCoin]: (h[selectedCoin] || 0) + val }));
      setCostBasis((cb) => {
        const cur = cb[selectedCoin];
        const prevCost = (cur && typeof cur.totalCost === 'number') ? cur.totalCost : 0;
        const prevQty = (cur && typeof cur.totalQty === 'number') ? cur.totalQty : 0;
        return {
          ...cb,
          [selectedCoin]: { totalCost: prevCost + cost, totalQty: prevQty + val },
        };
      });
      setTransactionHistory((prev) => {
        const next = [...prev, { t: Date.now(), type: 'buy', coin: selectedCoin, amount: val, price, usd: cost }];
        saveTransactionHistory(next);
        return next;
      });
      setMessage(`Bought ${formatCrypto(val)} ${coin.symbol} for ${formatUsd(cost)}`);
    } else {
      const have = holdings[selectedCoin] || 0;
      if (val > have) {
        setMessage(`You only have ${formatCrypto(have)} ${coin.symbol}.`);
        return;
      }
      const proceeds = val * price;
      let feeUsd = 0;
      if (selectedCoin === 'eth') {
        feeUsd = (GAS_FEE_ETH[gasTier] ?? GAS_FEE_ETH.medium) * (prices.eth || 0);
      } else if (selectedCoin === 'btc') {
        feeUsd = btcFeeBtc(btcFeeTier) * (prices.btc || 0);
      } else if (selectedCoin === 'sol') {
        feeUsd = SOL_FEE_SOL * (prices.sol || 0);
      } else if (selectedCoin === 'doge') {
        feeUsd = DOGE_FEE_DOGE * (prices.doge || 0);
      }
      const netProceeds = proceeds - feeUsd;
      setUsdBalance((b) => b + netProceeds);
      setHoldings((h) => ({ ...h, [selectedCoin]: (h[selectedCoin] || 0) - val }));
      setCostBasis((cb) => {
        const cur = cb[selectedCoin];
        const prevCost = (cur && typeof cur.totalCost === 'number') ? cur.totalCost : 0;
        const prevQty = (cur && typeof cur.totalQty === 'number') ? cur.totalQty : 0;
        if (prevQty <= 0) return cb;
        const ratio = val / prevQty;
        return {
          ...cb,
          [selectedCoin]: {
            totalCost: prevCost * (1 - ratio),
            totalQty: prevQty - val,
          },
        };
      });
      setTransactionHistory((prev) => {
        const next = [...prev, { t: Date.now(), type: 'sell', coin: selectedCoin, amount: val, price, usd: netProceeds }];
        saveTransactionHistory(next);
        return next;
      });
      setMessage(selectedCoin === 'eth'
        ? `Sold ${formatCrypto(val)} ${coin.symbol} for ${formatUsd(netProceeds)} (gas: ${formatCrypto(GAS_FEE_ETH[gasTier] ?? GAS_FEE_ETH.medium)} ETH / ${formatUsd(feeUsd)})`
        : selectedCoin === 'btc'
          ? `Sold ${formatCrypto(val)} ${coin.symbol} for ${formatUsd(netProceeds)} (tx fee: ${formatCrypto(btcFeeBtc(btcFeeTier))} BTC / ${formatUsd(feeUsd)})`
          : selectedCoin === 'sol'
            ? `Sold ${formatCrypto(val)} ${coin.symbol} for ${formatUsd(netProceeds)} (tx fee: ${formatCrypto(SOL_FEE_SOL)} SOL / ${formatUsd(feeUsd)})`
            : selectedCoin === 'doge'
              ? `Sold ${formatCrypto(val)} ${coin.symbol} for ${formatUsd(netProceeds)} (tx fee: ${formatCrypto(DOGE_FEE_DOGE)} DOGE / ${formatUsd(feeUsd)})`
              : `Sold ${formatCrypto(val)} ${coin.symbol} for ${formatUsd(netProceeds)}`);
    }
    setAmount('');
    setTimeout(() => setMessage(null), 4000);
  };

  const coin = COINS.find((c) => c.id === selectedCoin);
  const price = prices[selectedCoin] || 0;
  const holding = holdings[selectedCoin] || 0;
  const holdingValue = holding * price;

  const profitVsInitial = totalEquity - initialUsd;

  const chartData = equityHistory.length >= 2 ? equityHistory : [];

  if (!introComplete) {
    return (
      <>
        <IntroPage onComplete={() => { setUsdBalance(loadNumber(STORAGE_KEYS.balance, DEFAULT_INITIAL_USD)); setIntroComplete(true); }} />
        <CryptoChatbot />
      </>
    );
  }

  if (activeView === 'history') {
    return (
      <History
        transactions={transactionHistory}
        coins={COINS}
        onBack={() => setActiveView('main')}
      />
    );
  }

  if (activeView === 'safety') {
    return <SafetyChecklist onBack={() => setActiveView('main')} />;
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <h1 style={{ margin: 0, textAlign: 'center' }}>
            <img src={fulllogo} alt="Crypto Simulator" style={{ height: '5.55rem', width: 'auto', display: 'block', margin: '0 auto' }} />
          </h1>
          <p style={styles.tagline}>Learn at your own pace with simulated USD and live prices on the blockchain, giving women the tools to build financial confidence and independence.</p>
          <div style={styles.statsRow}>
            <span style={styles.stat}>USD: {formatUsd(usdBalance)}</span>
            <span style={styles.stat}>Portfolio: {formatUsd(portfolioValue)}</span>
            <span style={styles.statStrong}>Total: {formatUsd(totalEquity)}</span>
          </div>
          <div style={styles.headerButtons}>
            <button
              type="button"
              style={{ ...styles.historyBtn, ...(historyHover ? styles.headerBtnHover : {}) }}
              onClick={() => setActiveView('history')}
              onMouseEnter={() => setHistoryHover(true)}
              onMouseLeave={() => setHistoryHover(false)}
            >
              History
            </button>
            <button
              type="button"
              style={{ ...styles.historyBtn, ...(safetyHover ? styles.headerBtnHover : {}) }}
              onClick={() => setActiveView('safety')}
              onMouseEnter={() => setSafetyHover(true)}
              onMouseLeave={() => setSafetyHover(false)}
            >
              Safety
            </button>
            <button
              type="button"
              style={{ ...styles.startFreshBtn, ...(startFreshHover ? styles.headerBtnHover : {}) }}
              onClick={clearAllUserData}
              onMouseEnter={() => setStartFreshHover(true)}
              onMouseLeave={() => setStartFreshHover(false)}
            >
              Start fresh
            </button>
          </div>
        </div>
      </header>

      <main style={styles.main}>
        <RotatingQuote />
        {message && (
          <div style={styles.message} role="alert">
            {message}
          </div>
        )}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Trade</h2>
          <div style={styles.tradeCard}>
            <div style={styles.toggleRow}>
              <button
                style={{ ...styles.toggleBtn, ...(mode === 'buy' ? styles.toggleActive : {}) }}
                onClick={() => setMode('buy')}
              >
                Buy
              </button>
              <button
                style={{ ...styles.toggleBtn, ...(mode === 'sell' ? styles.toggleActive : {}) }}
                onClick={() => setMode('sell')}
              >
                Sell
              </button>
            </div>
            <div style={styles.selectRow}>
              <label style={styles.label}>Coin</label>
              <select
                value={selectedCoin}
                onChange={(e) => setSelectedCoin(e.target.value)}
                style={styles.select}
              >
                {COINS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.emoji} {c.symbol} — {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div style={styles.priceRow}>
              Price: <strong>{formatUsd(price)}</strong> {holding > 0 && ` · You have ${formatCrypto(holding)} ${coin?.symbol} (${formatUsd(holdingValue)})`}
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Amount ({coin?.symbol})</label>
              <div style={styles.amountInputRow}>
                <input
                  type="number"
                  step="0.0001"
                  min="0"
                  placeholder={mode === 'buy' ? '0.01' : formatCrypto(holding)}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  style={{ ...styles.input, flex: 1, minWidth: 0 }}
                />
                {amount.trim() !== '' && (() => {
                  const val = parseFloat(amount);
                  if (Number.isFinite(val) && val > 0 && price > 0) {
                    return (
                      <span style={styles.amountUsdPreview}>
                        ≈ {formatUsd(val * price)}
                      </span>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
            {mode === 'sell' && selectedCoin === 'eth' && (
              <div style={styles.gasFeeRow}>
                <label style={styles.label}>Gas fee</label>
                <div style={styles.gasSliderRow}>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="1"
                    value={gasTier === 'low' ? 0 : gasTier === 'medium' ? 1 : 2}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10);
                      setGasTier(v === 0 ? 'low' : v === 1 ? 'medium' : 'high');
                    }}
                    style={styles.gasSlider}
                  />
                  <div style={styles.gasLabels}>
                    <span>Low (0.001 ETH)</span>
                    <span>Medium (0.003 ETH)</span>
                    <span>Fast (0.008 ETH)</span>
                  </div>
                </div>
                <p style={styles.gasFeePreview}>
                  ≈ {formatUsd((GAS_FEE_ETH[gasTier] ?? GAS_FEE_ETH.medium) * (prices.eth || 0))} at current ETH price
                </p>
              </div>
            )}
            {mode === 'sell' && selectedCoin === 'btc' && (
              <div style={styles.gasFeeRow}>
                <label style={styles.label}>Transaction fee</label>
                <div style={styles.gasSliderRow}>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="1"
                    value={btcFeeTier === 'low' ? 0 : btcFeeTier === 'medium' ? 1 : 2}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10);
                      setBtcFeeTier(v === 0 ? 'low' : v === 1 ? 'medium' : 'high');
                    }}
                    style={styles.gasSlider}
                  />
                  <div style={styles.gasLabels}>
                    <span>Low (15 sat/byte)</span>
                    <span>Medium (50 sat/byte)</span>
                    <span>Fast (150 sat/byte)</span>
                  </div>
                </div>
                <p style={styles.gasFeePreview}>
                  ≈ {formatCrypto(btcFeeBtc(btcFeeTier))} BTC ({formatUsd(btcFeeBtc(btcFeeTier) * (prices.btc || 0))}) at current BTC price
                </p>
              </div>
            )}
            {mode === 'sell' && selectedCoin === 'sol' && (
              <p style={styles.feeBlurb}>
                Transaction fee: {formatCrypto(SOL_FEE_SOL)} SOL ({formatUsd(SOL_FEE_SOL * (prices.sol || 0))}) will be deducted from your sale.
              </p>
            )}
            {mode === 'sell' && selectedCoin === 'doge' && (
              <p style={styles.feeBlurb}>
                Transaction fee: {formatCrypto(DOGE_FEE_DOGE)} DOGE ({formatUsd(DOGE_FEE_DOGE * (prices.doge || 0))}) will be deducted from your sale.
              </p>
            )}
            <button style={styles.tradeButton} onClick={handleTrade}>
              {mode === 'buy' ? 'Buy' : 'Sell'} {coin?.symbol}
            </button>
          </div>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Portfolio</h2>
          <div style={styles.portfolioTable}>
            {COINS.filter((c) => (holdings[c.id] || 0) > 0).length === 0 ? (
              <p style={styles.empty}>No holdings yet. Make your first trade above to get started.</p>
            ) : (
              <>
                <div style={styles.portfolioHeader}>
                  <span></span><span>Coin</span><span>Qty</span><span>Price</span><span>Value</span><span>Buy price · Change</span>
                </div>
                {COINS.filter((c) => (holdings[c.id] || 0) > 0).map((c) => {
                const qty = holdings[c.id] || 0;
                const currentPrice = prices[c.id] || 0;
                const value = qty * currentPrice;
                const cb = costBasis[c.id];
                const totalCost = (cb && typeof cb.totalCost === 'number') ? cb.totalCost : 0;
                const totalQty = (cb && typeof cb.totalQty === 'number') ? cb.totalQty : 0;
                const avgCost = totalQty > 0 ? totalCost / totalQty : 0;
                const priceDiff = avgCost > 0 ? ((currentPrice - avgCost) / avgCost) * 100 : 0;
                return (
                  <div key={c.id} style={styles.portfolioRow}>
                    <span style={styles.coinEmoji}>{c.emoji}</span>
                    <span>{c.symbol}</span>
                    <span>{formatCrypto(qty)}</span>
                    <span>{formatUsd(currentPrice)}</span>
                    <span style={styles.value}>{formatUsd(value)}</span>
                    <span style={priceDiff >= 0 ? styles.priceUp : styles.priceDown}>
                      {avgCost > 0 ? (
                        <>Buy: {formatUsd(avgCost)} · {priceDiff >= 0 ? '+' : ''}{priceDiff.toFixed(1)}%</>
                      ) : (
                        '—'
                      )}
                    </span>
                  </div>
                );
              })}
              </>
            )}
          </div>
        </section>

        {chartData.length >= 2 && (
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Portfolio Value Over Time</h2>
            <p style={styles.profitSummary}>
              {profitVsInitial >= 0 ? (
                <span style={styles.profitPositive}>+{formatUsd(profitVsInitial)}</span>
              ) : (
                <span style={styles.profitNegative}>{formatUsd(profitVsInitial)}</span>
              )}
              {' '}vs. starting {formatUsd(initialUsd)}
            </p>
            <ProfitChart data={chartData} initialUsd={initialUsd} />
          </section>
        )}

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Live Prices</h2>
          <p style={styles.hoverHint}>Hover over a coin to learn more about it</p>
          <div style={styles.grid}>
            {COINS.map((c) => (
              <div
                key={c.id}
                style={{ ...styles.coinCard, ...(hoveredCoin === c.id ? styles.coinCardHovered : {}) }}
                onMouseEnter={() => setHoveredCoin(c.id)}
                onMouseLeave={() => setHoveredCoin(null)}
              >
                <span style={styles.coinEmoji}>{c.emoji}</span>
                <span style={styles.coinSymbol}>{c.symbol}</span>
                <span style={styles.coinName}>{c.name}</span>
                <span style={styles.coinPrice}>{formatUsd(prices[c.id] || 0)}</span>
                {(holdings[c.id] || 0) > 0 && (
                  <span style={styles.holding}>
                    You own {formatCrypto(holdings[c.id])} ({formatUsd((holdings[c.id] || 0) * (prices[c.id] || 0))})
                  </span>
                )}
                {hoveredCoin === c.id && (
                  <div style={styles.coinTooltip}>
                    <p style={styles.tooltipDescription}>{c.description}</p>
                    <p style={styles.tooltipHowTo}><strong>How to invest:</strong> {c.howToInvest}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>
      <CryptoChatbot />
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(160deg, #fef7f5 0%, #faf5f8 35%, #f5f0fa 70%, #f0f4f8 100%)',
    color: '#3d3a4a',
    fontFamily: '"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  header: {
    padding: '28px 20px',
    borderBottom: '1px solid rgba(189, 147, 169, 0.2)',
  },
  headerInner: {
    maxWidth: '900px',
    margin: '0 auto',
    textAlign: 'center',
  },
  logo: {
    fontSize: '1.85rem',
    fontWeight: 700,
    margin: 0,
    background: 'linear-gradient(135deg, #c77b8a 0%, #b56b9e 40%, #8b7ab8 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  tagline: {
    color: '#6b6578',
    fontSize: '0.95rem',
    margin: '8px 0 18px',
    lineHeight: 1.5,
  },
  statsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: '20px',
    alignItems: 'center',
  },
  stat: {
    color: '#6b6578',
    fontSize: '0.9rem',
  },
  statStrong: {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#b56b9e',
  },
  headerButtons: {
    marginTop: 16,
    display: 'flex',
    gap: 12,
    justifyContent: 'center',
  },
  historyBtn: {
    padding: '8px 16px',
    fontSize: '0.85rem',
    background: 'transparent',
    border: '1px solid rgba(181, 107, 158, 0.4)',
    borderRadius: 8,
    color: '#8b4a6b',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  startFreshBtn: {
    padding: '8px 16px',
    fontSize: '0.85rem',
    background: 'transparent',
    border: '1px solid rgba(181, 107, 158, 0.4)',
    borderRadius: 8,
    color: '#8b4a6b',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  headerBtnHover: {
    background: 'linear-gradient(135deg, #b56b9e 0%, #9a5a8a 100%)',
    borderColor: '#9a5a8a',
    color: '#fff',
  },
  message: {
    background: 'rgba(139, 165, 136, 0.2)',
    color: '#4a7c59',
    padding: '14px 20px',
    margin: '0 20px 20px',
    borderRadius: '14px',
    maxWidth: '600px',
    marginLeft: 'auto',
    marginRight: 'auto',
    textAlign: 'center',
    border: '1px solid rgba(139, 165, 136, 0.3)',
  },
  main: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '36px 20px',
  },
  section: {
    marginBottom: '44px',
  },
  sectionTitle: {
    fontSize: '1.2rem',
    fontWeight: 600,
    margin: '0 0 16px',
    color: '#4a4458',
    letterSpacing: '-0.02em',
  },
  tradeCard: {
    background: 'rgba(255, 255, 255, 0.85)',
    border: '1px solid rgba(189, 147, 169, 0.25)',
    borderRadius: '20px',
    padding: '28px',
    boxShadow: '0 4px 24px rgba(181, 107, 158, 0.08)',
  },
  toggleRow: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
  },
  toggleBtn: {
    padding: '10px 24px',
    fontSize: '0.95rem',
    background: 'rgba(245, 240, 250, 0.8)',
    border: '1px solid rgba(189, 147, 169, 0.3)',
    borderRadius: '12px',
    color: '#6b6578',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  toggleActive: {
    background: 'linear-gradient(135deg, rgba(199, 123, 138, 0.15) 0%, rgba(181, 107, 158, 0.2) 100%)',
    borderColor: '#b56b9e',
    color: '#8b4a6b',
  },
  selectRow: { marginBottom: '10px' },
  label: {
    display: 'block',
    fontSize: '0.875rem',
    color: '#5a5568',
    marginBottom: '6px',
  },
  select: {
    width: '100%',
    padding: '12px 14px',
    fontSize: '1rem',
    background: 'rgba(255, 255, 255, 0.9)',
    border: '1px solid rgba(189, 147, 169, 0.3)',
    borderRadius: '12px',
    color: '#3d3a4a',
    boxSizing: 'border-box',
  },
  priceRow: {
    fontSize: '0.9rem',
    color: '#6b6578',
    marginBottom: '18px',
  },
  inputGroup: { marginBottom: '18px' },
  amountInputRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  amountUsdPreview: {
    fontSize: '0.95rem',
    color: '#6b6578',
    whiteSpace: 'nowrap',
  },
  gasFeeRow: {
    marginBottom: '18px',
  },
  gasSliderRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  gasSlider: {
    width: '100%',
    accentColor: '#b56b9e',
  },
  gasLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.75rem',
    color: '#6b6578',
  },
  gasFeePreview: {
    margin: '8px 0 0',
    fontSize: '0.85rem',
    color: '#6b6578',
  },
  feeBlurb: {
    margin: '0 0 14px',
    fontSize: '0.9rem',
    color: '#6b6578',
    lineHeight: 1.4,
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    fontSize: '1rem',
    background: 'rgba(255, 255, 255, 0.9)',
    border: '1px solid rgba(189, 147, 169, 0.3)',
    borderRadius: '12px',
    color: '#3d3a4a',
    boxSizing: 'border-box',
  },
  tradeButton: {
    width: '100%',
    padding: '14px',
    fontSize: '1rem',
    fontWeight: 600,
    color: '#fff',
    background: 'linear-gradient(135deg, #b56b9e 0%, #9a5a8a 100%)',
    border: 'none',
    borderRadius: '14px',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(181, 107, 158, 0.35)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '18px',
  },
  hoverHint: {
    fontSize: '0.85rem',
    color: '#6b6578',
    margin: '-8px 0 16px',
  },
  coinCard: {
    position: 'relative',
    background: 'rgba(255, 255, 255, 0.85)',
    border: '1px solid rgba(189, 147, 169, 0.25)',
    borderRadius: '18px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    boxShadow: '0 2px 16px rgba(181, 107, 158, 0.06)',
    transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
    cursor: 'default',
  },
  coinCardHovered: {
    boxShadow: '0 8px 32px rgba(181, 107, 158, 0.15)',
    borderColor: 'rgba(181, 107, 158, 0.4)',
  },
  coinTooltip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(255, 255, 255, 0.98)',
    borderRadius: '18px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    boxShadow: '0 8px 32px rgba(181, 107, 158, 0.2)',
    overflow: 'auto',
    zIndex: 1,
  },
  tooltipDescription: {
    margin: 0,
    fontSize: '0.875rem',
    color: '#4a4458',
    lineHeight: 1.55,
  },
  tooltipHowTo: {
    margin: 0,
    fontSize: '0.8rem',
    color: '#6b6578',
    lineHeight: 1.5,
  },
  coinEmoji: { fontSize: '1.6rem' },
  coinSymbol: { fontWeight: 600, color: '#4a4458' },
  coinName: { fontSize: '0.8rem', color: '#6b6578' },
  coinPrice: { fontSize: '1rem', color: '#b56b9e', fontWeight: 600 },
  holding: { fontSize: '0.75rem', color: '#4a7c59', marginTop: '6px' },
  portfolioTable: {
    background: 'rgba(255, 255, 255, 0.85)',
    border: '1px solid rgba(189, 147, 169, 0.25)',
    borderRadius: '18px',
    padding: '20px',
    boxShadow: '0 2px 16px rgba(181, 107, 158, 0.06)',
  },
  portfolioHeader: {
    display: 'grid',
    gridTemplateColumns: '32px 50px 1fr 1fr 1fr 1fr',
    gap: '12px',
    alignItems: 'center',
    padding: '0 0 10px',
    borderBottom: '1px solid rgba(189, 147, 169, 0.2)',
    fontSize: '0.8rem',
    color: '#6b6578',
    fontWeight: 600,
  },
  portfolioRow: {
    display: 'grid',
    gridTemplateColumns: '32px 50px 1fr 1fr 1fr 1fr',
    gap: '12px',
    alignItems: 'center',
    padding: '14px 0',
    borderBottom: '1px solid rgba(189, 147, 169, 0.12)',
  },
  value: { color: '#4a7c59', fontWeight: 600 },
  priceUp: { fontSize: '0.85rem', color: '#4a7c59' },
  priceDown: { fontSize: '0.85rem', color: '#c45c5c' },
  profitSummary: { margin: '-8px 0 16px', fontSize: '0.95rem', color: '#6b6578' },
  profitPositive: { color: '#4a7c59', fontWeight: 600 },
  profitNegative: { color: '#c45c5c', fontWeight: 600 },
  empty: { color: '#6b6578', margin: 0, padding: '28px', textAlign: 'center' },
};

export default App;
