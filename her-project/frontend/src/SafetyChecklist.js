import React, { useState } from 'react';

const SAFETY_ITEMS = [
  'Never share your seed phrase or private keys with anyone — no legitimate service will ever ask for them.',
  'Double-check URLs and contract addresses; phishing sites often mimic real ones.',
  "Be wary of 'too good to be true' returns and unsolicited DMs offering help or deals.",
  'Use hardware or trusted software wallets for larger amounts; avoid leaving large sums on exchanges long-term.',
  'If something feels off, slow down and verify through official channels before acting.',
];

function SafetyChecklist({ onBack }) {
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
    intro: {
      color: '#6b6578',
      fontSize: '0.95rem',
      marginBottom: 24,
      lineHeight: 1.5,
    },
    list: {
      background: 'rgba(255, 255, 255, 0.85)',
      border: '1px solid rgba(189, 147, 169, 0.25)',
      borderRadius: 18,
      boxShadow: '0 2px 16px rgba(181, 107, 158, 0.06)',
      padding: '20px 20px 20px 40px',
      listStyleType: 'disc',
      listStylePosition: 'outside',
    },
    listItem: {
      fontSize: '0.95rem',
      color: '#4a4458',
      lineHeight: 1.6,
      marginBottom: 12,
      paddingLeft: 4,
    },
    listItemLast: {
      marginBottom: 0,
    },
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <h1 style={styles.title}>Safety checklist</h1>
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
        <p style={styles.intro}>
          Keep these in mind when you use crypto — on this simulator and in the real world.
        </p>
        <ul style={styles.list}>
          {SAFETY_ITEMS.map((text, i) => (
            <li
              key={i}
              style={{ ...styles.listItem, ...(i === SAFETY_ITEMS.length - 1 ? styles.listItemLast : {}) }}
            >
              {text}
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}

export default SafetyChecklist;
