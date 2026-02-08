import React, { useState } from 'react';

const SAFETY_ITEMS = [
  'Never share your seed phrase or private keys with anyone — no legitimate service will ever ask for them.',
  'Double-check URLs and contract addresses; phishing sites often mimic real ones.',
  "Be wary of 'too good to be true' returns and unsolicited DMs offering help or deals.",
  'Use hardware or trusted software wallets for larger amounts; avoid leaving large sums on exchanges long-term.',
  'If something feels off, slow down and verify through official channels before acting.',
];

const FLASH_CARDS = [
  { q: 'What should you never share with anyone?', a: 'Your seed phrase or private keys. No legitimate service will ever ask for them.' },
  { q: 'How can you spot a phishing site?', a: 'By checking URLs and contract addresses carefully — fake sites often look almost identical to real ones.' },
  { q: "What's a red flag for a crypto scam?", a: 'Promises that seem "too good to be true" or unsolicited DMs offering deals or help.' },
  { q: 'Where should you store larger amounts of crypto?', a: 'Use a hardware wallet or trusted software wallet. Avoid leaving large sums on exchanges long-term.' },
  { q: 'What should you do if something feels off?', a: 'Slow down and verify through official channels before taking any action.' },
];

function SafetyChecklist({ onBack }) {
  const [backHover, setBackHover] = useState(false);
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

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
    flashcardsTitle: {
      margin: '36px 0 16px',
      fontSize: '1.15rem',
      fontWeight: 600,
      color: '#4a4458',
    },
    cardWrapper: {
      perspective: 1000,
      display: 'flex',
      justifyContent: 'center',
    },
    card: {
      position: 'relative',
      width: '100%',
      maxWidth: 480,
      minHeight: 140,
      cursor: 'pointer',
      transformStyle: 'preserve-3d',
      transform: flipped ? 'scale(1)' : 'scale(0.88)',
      transformOrigin: 'center center',
      transition: 'transform 0.4s ease',
    },
    cardInner: {
      position: 'relative',
      width: '100%',
      minHeight: 140,
      transition: 'transform 0.5s ease',
      transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
      transformStyle: 'preserve-3d',
    },
    cardFace: {
      position: 'absolute',
      width: '100%',
      minHeight: 140,
      backfaceVisibility: 'hidden',
      WebkitBackfaceVisibility: 'hidden',
      background: 'rgba(255, 255, 255, 0.9)',
      border: '1px solid rgba(189, 147, 169, 0.3)',
      borderRadius: 16,
      boxShadow: '0 4px 20px rgba(181, 107, 158, 0.1)',
      padding: 24,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      boxSizing: 'border-box',
    },
    cardBack: {
      transform: 'rotateY(180deg)',
    },
    cardQuestion: {
      fontSize: '1rem',
      fontWeight: 600,
      color: '#6b6578',
      marginBottom: 8,
    },
    cardLabel: {
      fontSize: '0.8rem',
      color: '#b56b9e',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      marginBottom: 6,
    },
    cardAnswer: {
      fontSize: '0.95rem',
      color: '#4a4458',
      lineHeight: 1.5,
    },
    cardNav: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 16,
      gap: 12,
    },
    cardBtn: {
      padding: '10px 20px',
      fontSize: '0.9rem',
      background: 'rgba(181, 107, 158, 0.15)',
      border: '1px solid rgba(181, 107, 158, 0.35)',
      borderRadius: 10,
      color: '#8b4a6b',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    },
    cardCounter: {
      fontSize: '0.9rem',
      color: '#6b6578',
    },
  };

  const card = FLASH_CARDS[cardIndex];

  const goPrev = () => {
    setFlipped(false);
    setCardIndex((i) => (i === 0 ? FLASH_CARDS.length - 1 : i - 1));
  };

  const goNext = () => {
    setFlipped(false);
    setCardIndex((i) => (i === FLASH_CARDS.length - 1 ? 0 : i + 1));
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

        <h3 style={styles.flashcardsTitle}>Flash cards</h3>
        <p style={{ ...styles.intro, marginBottom: 12 }}>Tap a card to flip it. Test your knowledge.</p>
        <div style={styles.cardWrapper}>
          <div
            style={styles.card}
            onClick={() => setFlipped((f) => !f)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setFlipped((f) => !f)}
          >
            <div style={styles.cardInner}>
              <div style={styles.cardFace}>
                <span style={styles.cardLabel}>Question</span>
                <p style={styles.cardQuestion}>{card.q}</p>
                <p style={{ ...styles.cardAnswer, opacity: 0.7, fontSize: '0.85rem' }}>Tap to reveal answer</p>
              </div>
              <div style={{ ...styles.cardFace, ...styles.cardBack }}>
                <span style={styles.cardLabel}>Answer</span>
                <p style={styles.cardAnswer}>{card.a}</p>
              </div>
            </div>
          </div>
          <div style={styles.cardNav}>
            <button type="button" style={styles.cardBtn} onClick={(e) => { e.stopPropagation(); goPrev(); }}>
              ← Previous
            </button>
            <span style={styles.cardCounter}>{cardIndex + 1} / {FLASH_CARDS.length}</span>
            <button type="button" style={styles.cardBtn} onClick={(e) => { e.stopPropagation(); goNext(); }}>
              Next →
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default SafetyChecklist;
