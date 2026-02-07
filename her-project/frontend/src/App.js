import React, { useState, useEffect, useCallback } from 'react';

const COINS = [
  { id: 'btc', name: 'Bitcoin', symbol: 'BTC', emoji: '₿' },
  { id: 'eth', name: 'Ethereum', symbol: 'ETH', emoji: 'Ξ' },
  { id: 'sol', name: 'Solana', symbol: 'SOL', emoji: '◎' },
  { id: 'doge', name: 'Dogecoin', symbol: 'DOGE', emoji: 'Ð' },
];

const INITIAL_USD = 10000;
const STORAGE_KEYS = { balance: 'crypto_sim_usd', holdings: 'crypto_sim_holdings', prices: 'crypto_sim_prices' };

// Simulated base prices (USD) – will drift randomly
const BASE_PRICES = { btc: 43200, eth: 2280, sol: 98, doge: 0.082 };

function randomWalk(prev, volatility = 0.002) {
  const change = (Math.random() - 0.5) * 2 * volatility * prev;
  return Math.max(prev * 0.5, prev + change);
}

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

function formatUsd(n) {
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${n.toFixed(2)}`;
  return `$${n.toFixed(4)}`;
}

function formatCrypto(n) {
  if (n >= 1) return n.toFixed(4);
  return n.toFixed(6);
}

function App() {
  const [usdBalance, setUsdBalance] = useState(() => loadNumber(STORAGE_KEYS.balance, INITIAL_USD));
  const [holdings, setHoldings] = useState(loadHoldings);
  const [prices, setPrices] = useState(loadPrices);
  const [selectedCoin, setSelectedCoin] = useState('btc');
  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState('buy'); // 'buy' | 'sell'
  const [message, setMessage] = useState(null);

  const tickPrices = useCallback(() => {
    setPrices((prev) => {
      const next = {
        btc: randomWalk(prev.btc),
        eth: randomWalk(prev.eth),
        sol: randomWalk(prev.sol),
        doge: randomWalk(prev.doge),
      };
      savePrices(next);
      return next;
    });
  }, []);

  useEffect(() => {
    const id = setInterval(tickPrices, 3000);
    return () => clearInterval(id);
  }, [tickPrices]);

  useEffect(() => {
    saveBalance(usdBalance);
  }, [usdBalance]);
  useEffect(() => {
    saveHoldings(holdings);
  }, [holdings]);

  const portfolioValue = COINS.reduce((sum, c) => sum + (holdings[c.id] || 0) * (prices[c.id] || 0), 0);
  const totalEquity = usdBalance + portfolioValue;

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
      setMessage(`Bought ${formatCrypto(val)} ${coin.symbol} for ${formatUsd(cost)}`);
    } else {
      const have = holdings[selectedCoin] || 0;
      if (val > have) {
        setMessage(`You only have ${formatCrypto(have)} ${coin.symbol}.`);
        return;
      }
      const proceeds = val * price;
      setUsdBalance((b) => b + proceeds);
      setHoldings((h) => ({ ...h, [selectedCoin]: (h[selectedCoin] || 0) - val }));
      setMessage(`Sold ${formatCrypto(val)} ${coin.symbol} for ${formatUsd(proceeds)}`);
    }
    setAmount('');
    setTimeout(() => setMessage(null), 4000);
  };

  const coin = COINS.find((c) => c.id === selectedCoin);
  const price = prices[selectedCoin] || 0;
  const holding = holdings[selectedCoin] || 0;
  const holdingValue = holding * price;

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <h1 style={styles.logo}>Crypto Simulator</h1>
          <p style={styles.tagline}>Practice trading with simulated USD and live-updating prices</p>
          <div style={styles.statsRow}>
            <span style={styles.stat}>USD: {formatUsd(usdBalance)}</span>
            <span style={styles.stat}>Portfolio: {formatUsd(portfolioValue)}</span>
            <span style={styles.statStrong}>Total: {formatUsd(totalEquity)}</span>
          </div>
        </div>
      </header>

      {message && (
        <div style={styles.message} role="alert">
          {message}
        </div>
      )}

      <main style={styles.main}>
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
              <input
                type="number"
                step="0.0001"
                min="0"
                placeholder={mode === 'buy' ? '0.01' : formatCrypto(holding)}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={styles.input}
              />
            </div>
            <button style={styles.tradeButton} onClick={handleTrade}>
              {mode === 'buy' ? 'Buy' : 'Sell'} {coin?.symbol}
            </button>
          </div>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Live Prices</h2>
          <div style={styles.grid}>
            {COINS.map((c) => (
              <div key={c.id} style={styles.coinCard}>
                <span style={styles.coinEmoji}>{c.emoji}</span>
                <span style={styles.coinSymbol}>{c.symbol}</span>
                <span style={styles.coinName}>{c.name}</span>
                <span style={styles.coinPrice}>{formatUsd(prices[c.id] || 0)}</span>
                {(holdings[c.id] || 0) > 0 && (
                  <span style={styles.holding}>
                    You own {formatCrypto(holdings[c.id])} ({formatUsd((holdings[c.id] || 0) * (prices[c.id] || 0))})
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Portfolio</h2>
          <div style={styles.portfolioTable}>
            {COINS.filter((c) => (holdings[c.id] || 0) > 0).length === 0 ? (
              <p style={styles.empty}>No holdings yet. Buy some crypto above.</p>
            ) : (
              COINS.filter((c) => (holdings[c.id] || 0) > 0).map((c) => {
                const qty = holdings[c.id] || 0;
                const value = qty * (prices[c.id] || 0);
                return (
                  <div key={c.id} style={styles.portfolioRow}>
                    <span style={styles.coinEmoji}>{c.emoji}</span>
                    <span>{c.symbol}</span>
                    <span>{formatCrypto(qty)}</span>
                    <span>{formatUsd(prices[c.id] || 0)}</span>
                    <span style={styles.value}>{formatUsd(value)}</span>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(165deg, #0a0a0f 0%, #12121a 50%, #0d1117 100%)',
    color: '#e6edf3',
    fontFamily: '"JetBrains Mono", "SF Mono", Monaco, Consolas, sans-serif',
  },
  header: {
    padding: '24px 20px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  headerInner: {
    maxWidth: '900px',
    margin: '0 auto',
    textAlign: 'center',
  },
  logo: {
    fontSize: '1.75rem',
    fontWeight: 700,
    margin: 0,
    background: 'linear-gradient(135deg, #58a6ff 0%, #a371f7 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  tagline: {
    color: '#8b949e',
    fontSize: '0.95rem',
    margin: '4px 0 16px',
  },
  statsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: '16px',
    alignItems: 'center',
  },
  stat: {
    color: '#8b949e',
    fontSize: '0.9rem',
  },
  statStrong: {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#58a6ff',
  },
  message: {
    background: 'rgba(35,134,54,0.2)',
    color: '#3fb950',
    padding: '12px 20px',
    margin: '0 20px 20px',
    borderRadius: '8px',
    maxWidth: '600px',
    marginLeft: 'auto',
    marginRight: 'auto',
    textAlign: 'center',
  },
  main: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '32px 20px',
  },
  section: {
    marginBottom: '40px',
  },
  sectionTitle: {
    fontSize: '1.25rem',
    fontWeight: 600,
    margin: '0 0 16px',
    color: '#e6edf3',
  },
  tradeCard: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px',
    padding: '24px',
  },
  toggleRow: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px',
  },
  toggleBtn: {
    padding: '8px 20px',
    fontSize: '0.95rem',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: '#8b949e',
    cursor: 'pointer',
  },
  toggleActive: {
    background: 'rgba(88,166,255,0.2)',
    borderColor: '#58a6ff',
    color: '#58a6ff',
  },
  selectRow: { marginBottom: '8px' },
  label: {
    display: 'block',
    fontSize: '0.85rem',
    color: '#8b949e',
    marginBottom: '4px',
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '1rem',
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '8px',
    color: '#e6edf3',
  },
  priceRow: {
    fontSize: '0.9rem',
    color: '#8b949e',
    marginBottom: '16px',
  },
  inputGroup: { marginBottom: '16px' },
  input: {
    width: '100%',
    padding: '12px 16px',
    fontSize: '1rem',
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '8px',
    color: '#e6edf3',
    boxSizing: 'border-box',
  },
  tradeButton: {
    width: '100%',
    padding: '12px',
    fontSize: '1rem',
    fontWeight: 600,
    color: '#fff',
    background: 'linear-gradient(135deg, #238636 0%, #2ea043 100%)',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '16px',
  },
  coinCard: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  coinEmoji: { fontSize: '1.5rem' },
  coinSymbol: { fontWeight: 600, color: '#e6edf3' },
  coinName: { fontSize: '0.8rem', color: '#8b949e' },
  coinPrice: { fontSize: '1rem', color: '#58a6ff', fontWeight: 600 },
  holding: { fontSize: '0.75rem', color: '#3fb950', marginTop: '4px' },
  portfolioTable: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px',
    padding: '16px',
  },
  portfolioRow: {
    display: 'grid',
    gridTemplateColumns: '32px 60px 1fr 1fr 1fr',
    gap: '12px',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  value: { color: '#3fb950', fontWeight: 600 },
  empty: { color: '#8b949e', margin: 0, padding: '24px' },
};

export default App;
