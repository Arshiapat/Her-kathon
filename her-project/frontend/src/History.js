import React, { useState } from 'react';

function formatUsd(n) {
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${n.toFixed(2)}`;
  return `$${n.toFixed(4)}`;
}

function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function History({ priceHistory, coins, onBack }) {
  const [backHover, setBackHover] = useState(false);
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
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 16,
    },
    title: {
      margin: 0,
      fontSize: '1.5rem',
      fontWeight: 700,
      background: 'linear-gradient(135deg, #c77b8a 0%, #b56b9e 40%, #8b7ab8 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
    },
    backBtn: {
      padding: '10px 20px',
      fontSize: '0.9rem',
      background: 'transparent',
      border: '1px solid rgba(181, 107, 158, 0.4)',
      borderRadius: 10,
      color: '#8b4a6b',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    },
    main: {
      maxWidth: '900px',
      margin: '0 auto',
      padding: '36px 20px',
    },
    table: {
      width: '100%',
      background: 'rgba(255, 255, 255, 0.85)',
      border: '1px solid rgba(189, 147, 169, 0.25)',
      borderRadius: 18,
      overflow: 'hidden',
      boxShadow: '0 2px 16px rgba(181, 107, 158, 0.06)',
    },
    th: {
      padding: '14px 16px',
      textAlign: 'left',
      fontSize: '0.85rem',
      fontWeight: 600,
      color: '#4a4458',
      background: 'rgba(245, 240, 250, 0.8)',
      borderBottom: '1px solid rgba(189, 147, 169, 0.2)',
    },
    td: {
      padding: '12px 16px',
      fontSize: '0.9rem',
      color: '#4a4458',
      borderBottom: '1px solid rgba(189, 147, 169, 0.12)',
    },
    empty: {
      padding: 48,
      textAlign: 'center',
      color: '#6b6578',
      fontSize: '1rem',
    },
  };

  const reversedHistory = [...(priceHistory || [])].reverse();

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <h1 style={styles.title}>Price History</h1>
          <button
          type="button"
          style={{
            ...styles.backBtn,
            ...(backHover ? { background: 'linear-gradient(135deg, #b56b9e 0%, #9a5a8a 100%)', borderColor: '#9a5a8a', color: '#fff' } : {}),
          }}
          onClick={onBack}
          onMouseEnter={() => setBackHover(true)}
          onMouseLeave={() => setBackHover(false)}
        >
          ← Back to trading
        </button>
        </div>
      </header>
      <main style={styles.main}>
        <div style={styles.table}>
          {reversedHistory.length === 0 ? (
            <div style={styles.empty}>No price history yet. Start trading to see price changes over time.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={styles.th}>Time</th>
                  {coins.map((c) => (
                    <th key={c.id} style={styles.th}>{c.emoji} {c.symbol}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reversedHistory.map((row, i) => (
                  <tr key={row.t || i}>
                    <td style={styles.td}>{formatTime(row.t)}</td>
                    {coins.map((c) => (
                      <td key={c.id} style={styles.td}>{formatUsd(row[c.id] ?? 0)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}

export default History;
