import React, { useState, useRef, useEffect } from 'react';

// ─── Crypto education: collect ALL matching topic responses, then combine ─────
const LANDING = "I'm here to help you learn about crypto. Type a topic or question above to get started.";

const FALLBACK_NO_MATCH =
  "I'm specialized in crypto basics: Bitcoin, Ethereum, wallets, DeFi, staking, NFTs, blockchain, and safety. Try asking something like 'What is Bitcoin?', 'How do wallets work?', or 'What is DeFi?' — or ask in your own words and I'll do my best to help.";

/** Shown when the AI detects the query is not about crypto at all. */
const OFF_TOPIC_RESPONSE =
  "I'm here to help with crypto basics only. Ask me about Bitcoin, Ethereum, wallets, DeFi, staking, NFTs, or how to get started!";

const OFF_TOPIC_SENTINEL = '[NOT_CRYPTO]';

/** Returns an array of response strings for every topic that matches the query. */
function getKeywordResponses(input) {
  const q = (input || '').toLowerCase().trim();
  if (!q) return ["Ask me anything about crypto! For example: What is Bitcoin? How do wallets work? What is DeFi?"];

  const out = [];

  // Short replies (yes/no/ok etc.) — treat as "no topic", give a statement so they don't hit AI off-topic
  const shortAffirmative = /^(yes|yeah|yep|yup|no|nope|ok|okay|sure|maybe)$/i.test(q);
  if (shortAffirmative) {
    return ["Type a crypto topic or question and I'll explain — for example 'What is Bitcoin?' or 'How do wallets work?'"];
  }

  // Bitcoin
  if (q.includes('bitcoin') || q.includes('btc')) {
    if (q.includes('invest') || q.includes('buy') || q.includes('safe')) {
      out.push("Bitcoin is volatile: prices can swing a lot. Many investors use dollar-cost averaging (DCA) — investing a fixed amount regularly — to reduce timing risk. Only invest what you can afford to lose, and consider it a long-term hold. Never invest based on hype or FOMO.");
    } else if (q.includes('what is') || q.includes('explain') || q.includes('how does')) {
      out.push("Bitcoin (BTC) is the first cryptocurrency, created in 2009 by Satoshi Nakamoto. It's decentralized digital money that runs on a public ledger called the blockchain. No bank or government controls it — a network of computers validates transactions. People use it as a store of value (like digital gold) and for payments. You can buy fractions of a Bitcoin; you don't need to buy a whole one.");
    } else {
      out.push("Bitcoin is the first and largest cryptocurrency by market cap. It's decentralized, limited to 21 million coins, and secured by proof-of-work mining. You can ask about how it works or how to invest.");
    }
  }

  // Ethereum (optionally gas + one main description)
  if (q.includes('ethereum') || q.includes('eth ') || q === 'eth') {
    if (q.includes('gas')) {
      out.push("Gas on Ethereum is the fee you pay to run a transaction or smart contract. It's paid in ETH. When the network is busy, gas prices go up. Wallets usually let you choose speed (slow/medium/fast) by adjusting the gas price.");
    }
    if (q.includes('what is') || q.includes('explain') || q.includes('smart contract')) {
      out.push("Ethereum is a blockchain platform that runs smart contracts — code that executes automatically when conditions are met. It powers decentralized apps (dApps), DeFi (lending, trading), NFTs, and more. Unlike Bitcoin (mainly for money), Ethereum is like a global computer. Its native token is ETH, used to pay for transactions (gas) and to stake. It's the second-largest crypto by market cap and is moving to proof-of-stake for lower energy use.");
    } else {
      out.push("Ethereum is the second-largest crypto by market cap and the leading platform for smart contracts and dApps. It's moving to proof-of-stake (Ethereum 2.0) for lower energy use and faster transactions.");
    }
  }

  // Wallets
  if (q.includes('wallet') || q.includes('metamask') || q.includes('where to store')) {
    out.push("A crypto wallet holds your private keys — the credentials that control your coins. Types: (1) Software wallets (e.g. MetaMask, Trust Wallet) — app or browser extension, you control the keys. (2) Hardware wallets (e.g. Ledger, Trezor) — physical device, very secure for large amounts. (3) Exchange wallets — the exchange holds keys for you; convenient but less control. Rule of thumb: not your keys, not your coins. For small amounts, a good software wallet is fine; for larger sums, consider a hardware wallet.");
  }

  // DeFi (can add multiple if both staking and yield mentioned)
  if (q.includes('defi') || q.includes('decentralized finance')) {
    out.push("DeFi (decentralized finance) is financial services (lending, borrowing, trading) built on blockchains with smart contracts — no banks in the middle. You connect a wallet (e.g. MetaMask) and interact with apps like Uniswap or Aave. Benefits: permissionless, transparent. Risks: smart contract risk, volatility, and complexity. Do your research before using DeFi.");
  }
  if (q.includes('staking')) {
    out.push("Staking means locking your crypto to help secure a proof-of-stake blockchain (e.g. Ethereum, Solana). In return you earn rewards (more of that crypto). It's like earning interest, but with smart-contract and market risk. Only stake what you understand and can afford to lock up.");
  }
  if (q.includes('yield') && !out.some((t) => t.includes('earning more tokens'))) {
    out.push("Yield in crypto usually means earning more tokens by lending, staking, or providing liquidity in DeFi protocols. APY can be high but so is risk: smart contract bugs, impermanent loss, and token price drops. Start with well-audited protocols and small amounts.");
  }

  // Blockchain basics
  if (q.includes('blockchain') || q.includes('how does crypto work')) {
    out.push("A blockchain is a shared digital ledger. Transactions are grouped into blocks, and each block is linked to the previous one (hence 'chain'). Many computers (nodes) keep a copy and agree on new blocks, so no single party can change history. Crypto uses this for transparency and security. Bitcoin and Ethereum are two different blockchains with different rules and purposes.");
  }

  // NFTs
  if (q.includes('nft') || q.includes('non-fungible')) {
    out.push("NFTs (non-fungible tokens) are unique digital items recorded on a blockchain — often art, collectibles, or in-game assets. 'Non-fungible' means one isn't interchangeable with another (unlike 1 BTC = 1 BTC). Ownership is proven by the blockchain; the file (image, etc.) may be stored elsewhere. NFT markets can be very speculative; treat them as high-risk if you're investing.");
  }

  // Solana
  if (q.includes('solana') || q.includes('sol ')) {
    out.push("Solana is a fast, low-fee blockchain designed for scale. It can process thousands of transactions per second and supports DeFi, NFTs, and gaming. It uses proof-of-stake and a mechanism called proof-of-history. It's younger than Bitcoin and Ethereum, so the ecosystem and token (SOL) can be more volatile. Do your own research before investing.");
  }

  // Dogecoin / meme coins
  if (q.includes('doge') || q.includes('meme coin') || q.includes('shiba')) {
    out.push("Dogecoin (DOGE) started as a meme in 2013 but became a real cryptocurrency with a large community. Meme coins are often driven by social media and sentiment rather than fundamentals. They can be very volatile. Only invest what you're comfortable losing, and avoid buying just because of hype or FOMO.");
  }

  // Security / scams
  if (q.includes('scam') || q.includes('safe') || q.includes('security') || q.includes('phishing')) {
    out.push("Stay safe: (1) Never share your seed phrase or private keys with anyone — no legit service will ask. (2) Double-check URLs and contract addresses; phishing sites mimic real ones. (3) Be wary of 'too good to be true' returns and DMs offering help. (4) Use hardware or trusted software wallets; avoid leaving large amounts on exchanges long-term. (5) If something feels off, slow down and verify.");
  }

  // Buying / getting started
  if (q.includes('how to buy') || q.includes('get started') || q.includes('beginner') || q.includes('start')) {
    out.push("To get started: (1) Choose a reputable exchange (e.g. Coinbase, Kraken) or a wallet that supports buying. (2) Complete verification (KYC) if required. (3) Start with a small amount and use dollar-cost averaging if you're investing. (4) Move crypto to your own wallet if you're holding long-term — not your keys, not your coins. This simulator is a great place to practice before using real money.");
  }

  // Volatility / risk
  if (q.includes('volatile') || q.includes('risk') || q.includes('crash')) {
    out.push("Crypto is highly volatile: prices can swing 10–20% or more in a short time. That can mean big gains or big losses. Never invest money you need for bills or emergencies. Diversify, do your research, and avoid borrowing to buy crypto. This simulator lets you practice with fake money so you can learn without real risk.");
  }

  // General crypto
  if (q.includes('what is crypto') || q.includes('what is cryptocurrency')) {
    out.push("Cryptocurrency is digital money that uses cryptography and runs on blockchains. Unlike traditional currency, it's usually decentralized (no central bank). Bitcoin was the first; now there are thousands. People use it for payments, investing, DeFi, and more. Each project has different goals — some are money, some are platforms for apps.");
  }

  // Greetings & thanks (don't duplicate with topic blocks)
  if (out.length === 0) {
    if (q.includes('hello') || q.includes('hi ') || q.includes('hey')) {
      return ["Hi! I'm here to help you learn about crypto. You can ask about Bitcoin, Ethereum, wallets, DeFi, staking, NFTs, security, or how to get started. What would you like to know?"];
    }
    if (q.includes('thank')) {
      return ["You're welcome! Ask anytime if you have more questions about crypto."];
    }
  }

  return out;
}

/** Combine multiple responses into one string (no duplicates, clean spacing). */
function combineResponses(responses) {
  if (!responses || responses.length === 0) return null;
  const seen = new Set();
  const unique = responses.filter((r) => {
    if (seen.has(r)) return false;
    seen.add(r);
    return true;
  });
  return unique.join('\n\n');
}

// ─── AI fallback when no keyword matches (optional API key) ──────────────────
const OPENAI_KEY = typeof process !== 'undefined' && process.env && process.env.REACT_APP_OPENAI_API_KEY;

async function fetchCryptoAI(userMessage) {
  if (!OPENAI_KEY || !userMessage.trim()) return null;
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 400,
        messages: [
          {
            role: 'system',
            content: `You are a friendly crypto education assistant for beginners. Answer concisely and clearly in plain language. Focus on: what things are, how they work, and practical tips (e.g. security, not your keys not your coins). Keep answers to 2-4 short paragraphs. Do not give financial advice or price predictions.

If the user's question is not at all about cryptocurrency, blockchain, or related topics (e.g. investing in crypto, wallets, DeFi, NFTs, tokens), you must respond with exactly and only this line, with no other text: ${OFF_TOPIC_SENTINEL}`,
          },
          { role: 'user', content: userMessage.trim() },
        ],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    if (typeof text !== 'string') return null;
    const trimmed = text.trim();
    if (trimmed === OFF_TOPIC_SENTINEL || trimmed.startsWith(OFF_TOPIC_SENTINEL)) return OFF_TOPIC_RESPONSE;
    return trimmed;
  } catch {
    return null;
  }
}

// ─── Component ──────────────────────────────────────────────────────────────
const styles = {
  wrap: {
    position: 'fixed',
    bottom: 24,
    right: 24,
    zIndex: 9999,
    fontFamily: '"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  window: {
    width: 380,
    maxWidth: 'calc(100vw - 48px)',
    height: 480,
    maxHeight: 'calc(100vh - 120px)',
    background: 'linear-gradient(160deg, rgba(254,247,245,0.98) 0%, rgba(250,245,248,0.98) 50%, rgba(245,240,250,0.98) 100%)',
    border: '1px solid rgba(189, 147, 169, 0.3)',
    borderRadius: 20,
    boxShadow: '0 8px 40px rgba(181, 107, 158, 0.15)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    padding: '14px 18px',
    borderBottom: '1px solid rgba(189, 147, 169, 0.2)',
    background: 'rgba(255, 255, 255, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    margin: 0,
    fontSize: '1rem',
    fontWeight: 600,
    background: 'linear-gradient(135deg, #c77b8a 0%, #b56b9e 40%, #8b7ab8 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  closeBtn: {
    padding: '6px 12px',
    fontSize: '0.85rem',
    background: 'rgba(245, 240, 250, 0.9)',
    border: '1px solid rgba(189, 147, 169, 0.3)',
    borderRadius: 10,
    color: '#6b6578',
    cursor: 'pointer',
  },
  messages: {
    flex: 1,
    overflow: 'auto',
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  msgBubble: {
    maxWidth: '88%',
    padding: '12px 16px',
    borderRadius: 16,
    fontSize: '0.9rem',
    lineHeight: 1.5,
    wordBreak: 'break-word',
  },
  botBubble: {
    alignSelf: 'flex-start',
    background: 'rgba(255, 255, 255, 0.9)',
    border: '1px solid rgba(189, 147, 169, 0.25)',
    color: '#4a4458',
    borderTopLeftRadius: 4,
  },
  userBubble: {
    alignSelf: 'flex-end',
    background: 'linear-gradient(135deg, rgba(181, 107, 158, 0.2) 0%, rgba(139, 122, 184, 0.15) 100%)',
    border: '1px solid rgba(181, 107, 158, 0.35)',
    color: '#3d3a4a',
    borderTopRightRadius: 4,
  },
  form: {
    padding: 12,
    borderTop: '1px solid rgba(189, 147, 169, 0.2)',
    background: 'rgba(255, 255, 255, 0.5)',
    display: 'flex',
    gap: 8,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    padding: '12px 16px',
    fontSize: '0.95rem',
    background: 'rgba(255, 255, 255, 0.95)',
    border: '1px solid rgba(189, 147, 169, 0.3)',
    borderRadius: 14,
    color: '#3d3a4a',
    outline: 'none',
    boxSizing: 'border-box',
  },
  sendBtn: {
    padding: '12px 18px',
    fontSize: '0.9rem',
    fontWeight: 600,
    color: '#fff',
    background: 'linear-gradient(135deg, #b56b9e 0%, #9a5a8a 100%)',
    border: 'none',
    borderRadius: 14,
    cursor: 'pointer',
    boxShadow: '0 2px 12px rgba(181, 107, 158, 0.3)',
  },
  toggleBtn: {
    width: 56,
    height: 56,
    borderRadius: '50%',
    border: 'none',
    background: 'linear-gradient(135deg, #b56b9e 0%, #9a5a8a 100%)',
    color: '#fff',
    fontSize: '1.5rem',
    cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(181, 107, 158, 0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};

function CryptoChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: 'bot', text: LANDING }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesScrollRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text }]);
    setIsLoading(true);

    const keywordResponses = getKeywordResponses(text);
    const combined = combineResponses(keywordResponses);

    if (combined && combined.length > 0) {
      setMessages((prev) => [...prev, { role: 'bot', text: combined }]);
      setIsLoading(false);
      return;
    }

    const aiReply = await fetchCryptoAI(text);
    setMessages((prev) => [
      ...prev,
      { role: 'bot', text: aiReply && aiReply.length > 0 ? aiReply : FALLBACK_NO_MATCH },
    ]);
    setIsLoading(false);
  };

  if (!open) {
    return (
      <div style={styles.wrap}>
        <button
          type="button"
          style={styles.toggleBtn}
          onClick={() => setOpen(true)}
          aria-label="Open crypto education chat"
        >
          💬
        </button>
      </div>
    );
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.window}>
        <div style={styles.header}>
          <h2 style={styles.headerTitle}>Crypto basics</h2>
          <button type="button" style={styles.closeBtn} onClick={() => setOpen(false)}>
            Close
          </button>
        </div>
        <div ref={messagesScrollRef} style={styles.messages}>
          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                ...styles.msgBubble,
                ...(m.role === 'bot' ? styles.botBubble : styles.userBubble),
              }}
            >
              {m.text}
            </div>
          ))}
          {isLoading && (
            <div style={{ ...styles.msgBubble, ...styles.botBubble }} aria-busy="true">
              Thinking…
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <form style={styles.form} onSubmit={handleSend}>
          <input
            type="text"
            style={styles.input}
            placeholder="Ask about Bitcoin, wallets, DeFi..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            aria-label="Message"
            disabled={isLoading}
          />
          <button type="submit" style={styles.sendBtn} disabled={isLoading}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

export default CryptoChatbot;
