import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { getContract, getContractReadOnly } from './utils/ethers';

// Block explorer base URLs by chainId
const EXPLORER_BY_CHAIN = {
  1: 'https://etherscan.io',
  5: 'https://goerli.etherscan.io',
  11155111: 'https://sepolia.etherscan.io',
  137: 'https://polygonscan.com',
  42161: 'https://arbiscan.io',
  10: 'https://optimistic.etherscan.io',
  56: 'https://bscscan.com',
  80001: 'https://mumbai.polygonscan.com',
};

function getExplorerTxUrl(chainId, txHash) {
  const base = EXPLORER_BY_CHAIN[Number(chainId)] || 'https://etherscan.io';
  return `${base}/tx/${txHash}`;
}

// Sample business metadata (client-side, maps to campaign IDs 0–3)
const SAMPLE_BUSINESSES = [
  {
    id: 0,
    title: "Luna's Artisan Bakery",
    tagline: 'Organic sourdough & pastries for your neighborhood',
    description: 'A woman-owned bakery bringing traditional European baking techniques to your community. We use locally-sourced organic flour and operate a zero-waste kitchen.',
    category: 'Food & Beverage',
    goal: '5',
    image: '🥐',
  },
  {
    id: 1,
    title: 'GreenTech Solutions',
    tagline: 'Sustainable packaging for a plastic-free future',
    description: 'Revolutionary biodegradable packaging alternatives. Our plant-based materials replace single-use plastics without compromising durability or cost.',
    category: 'Sustainability',
    goal: '10',
    image: '🌱',
  },
  {
    id: 2,
    title: 'Artisan Crafts Co.',
    tagline: 'Handcrafted jewelry by women artisans',
    description: 'Curated marketplace connecting talented women artisans with customers worldwide. Each piece tells a story and supports livelihoods in underserved communities.',
    category: 'Creative',
    goal: '3',
    image: '💎',
  },
  {
    id: 3,
    title: 'Her Health App',
    tagline: 'Healthcare access for women, by women',
    description: 'Telehealth platform designed specifically for women\'s health needs. Affordable consultations, period tracking, and mental wellness support in one app.',
    category: 'Health Tech',
    goal: '8',
    image: '💜',
  },
];

function App() {
  const [account, setAccount] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [txPending, setTxPending] = useState(false);
  const [investModal, setInvestModal] = useState(null); // { campaignId, business }
  const [investAmount, setInvestAmount] = useState('');
  const [lastTxReceipt, setLastTxReceipt] = useState(null); // { txHash, chainId, campaignName, amount }

  const fetchCampaigns = useCallback(async () => {
    try {
      const contract = await getContractReadOnly();
      const count = Number(await contract.campaignCount());
      const list = [];
      for (let i = 0; i < count; i++) {
        const [creator, goal, raised, deadline, funded, withdrawn] = await contract.getCampaign(i);
        list.push({ creator, goal, raised, deadline, funded, withdrawn });
      }
      setCampaigns(list);
    } catch (err) {
      if (err.message?.includes('MetaMask not found')) {
        setError('Please install MetaMask to use this app.');
      } else if (err.message?.includes('YOUR_DEPLOYED_CONTRACT_ADDRESS')) {
        setError('Contract not configured. Set REACT_APP_CONTRACT_ADDRESS in .env and deploy the contract.');
      } else if (err.code === 'BAD_DATA' || err.message?.includes('could not decode result')) {
        setError(
          'Wrong contract at this address. Set REACT_APP_CONTRACT_ADDRESS to your CrowdfundingPlatform address. ' +
          'Run: cd backend && npx hardhat run scripts/deploy.js and use the printed address.'
        );
      } else {
        setError(err.message || 'Failed to load campaigns.');
      }
    } finally {
      setLoading(false);
    }
  }, [account]);

  const connectWallet = async () => {
    try {
      setError(null);
      setConnecting(true);
      if (!window.ethereum) {
        throw new Error(
          'MetaMask is not installed. Install it from https://metamask.io/download/ and refresh the page.'
        );
      }
      // This triggers MetaMask to open and ask the user to connect/approve
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      if (accounts?.length) {
        setAccount(accounts[0]);
      }
    } catch (err) {
      if (err.code === 4001) {
        setError('Connection rejected. You can try again by clicking Connect Wallet.');
      } else {
        setError(err.message || 'Failed to connect wallet.');
      }
    } finally {
      setConnecting(false);
    }
  };

  const openInvestModal = (campaignId, business) => {
    setInvestModal({ campaignId, business });
    setInvestAmount('');
    setError(null);
  };

  const dismissTxReceipt = () => setLastTxReceipt(null);

  const invest = async () => {
    if (!investModal || !account) return;
    const { campaignId, business } = investModal;
    const amount = investAmount.trim();
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount.');
      return;
    }

    setTxPending(true);
    setError(null);
    setLastTxReceipt(null);
    try {
      const contract = await getContract();
      const tx = await contract.invest(campaignId, { value: ethers.parseEther(amount) });
      const receipt = await tx.wait();
      const provider = contract.runner?.provider;
      const chainId = provider ? Number((await provider.getNetwork()).chainId) : 1;
      setLastTxReceipt({
        txHash: receipt.hash,
        chainId,
        campaignName: business.title,
        amount,
      });
      await fetchCampaigns();
      setInvestModal(null);
    } catch (err) {
      setError(err.shortMessage || err.message || 'Failed to invest.');
    } finally {
      setTxPending(false);
    }
  };

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        setAccount(accounts[0] || null);
      });
    }
  }, []);

  useEffect(() => {
    if (account) {
      setLoading(true);
      fetchCampaigns();
    } else {
      setCampaigns([]);
      setLoading(false);
    }
  }, [account, fetchCampaigns]);

  const formatEth = (val) => (val != null ? (typeof val === 'string' ? val : ethers.formatEther(val)) : '0');
  const formatAddress = (addr) => (addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '—');

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <h1 style={styles.logo}>CrowdfundHer</h1>
          <p style={styles.tagline}>Invest in women-led businesses on the blockchain</p>
          <div style={styles.walletRow}>
            {account ? (
              <div style={styles.account}>
                <span style={styles.connected}>Connected: {formatAddress(account)}</span>
              </div>
            ) : (
              <button
                style={{ ...styles.connectBtn, ...(connecting ? styles.connectBtnDisabled : {}) }}
                onClick={connectWallet}
                disabled={connecting}
                title="Connect with MetaMask"
              >
                {connecting ? 'Connecting...' : 'Connect Wallet'}
              </button>
            )}
          </div>
        </div>
      </header>

      {error && (
        <div style={styles.error} role="alert">
          {error}
        </div>
      )}

      {lastTxReceipt && (
        <div style={styles.receiptBanner}>
          <div style={styles.receiptContent}>
            <span style={styles.receiptIcon}>✓</span>
            <span>
              Invested {lastTxReceipt.amount} ETH in {lastTxReceipt.campaignName}.{' '}
              <a
                href={getExplorerTxUrl(lastTxReceipt.chainId, lastTxReceipt.txHash)}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.receiptLink}
              >
                View receipt on blockchain ↗
              </a>
            </span>
          </div>
          <button style={styles.receiptDismiss} onClick={dismissTxReceipt} aria-label="Dismiss">
            ×
          </button>
        </div>
      )}

      {!account && (
        <div style={styles.hero}>
          <h2 style={styles.heroTitle}>Discover & Invest in Women-Led Businesses</h2>
          <p style={styles.heroText}>
            Connect your wallet (MetaMask) to browse campaigns and invest with crypto.
          </p>
        </div>
      )}

      {account && loading && (
        <div style={styles.loading}>Loading campaigns...</div>
      )}

      {account && !loading && campaigns.length > 0 && (
        <main style={styles.main}>
          <h2 style={styles.sectionTitle}>Active Campaigns</h2>
          <div style={styles.grid}>
            {SAMPLE_BUSINESSES.map((business) => {
              const campaign = campaigns[business.id];
              if (!campaign) return null;
              const goal = formatEth(campaign.goal);
              const raised = formatEth(campaign.raised);
              const pct = parseFloat(goal) > 0 ? Math.min(100, (parseFloat(raised) / parseFloat(goal)) * 100) : 0;
              const ended = campaign.funded || Date.now() / 1000 > Number(campaign.deadline);
              const canInvest = !ended && !campaign.funded;

              return (
                <article key={business.id} style={styles.card}>
                  <div style={styles.cardImage}>{business.image}</div>
                  <span style={styles.category}>{business.category}</span>
                  <h3 style={styles.cardTitle}>{business.title}</h3>
                  <p style={styles.cardTagline}>{business.tagline}</p>
                  <div style={styles.progressBar}>
                    <div style={{ ...styles.progressFill, width: `${pct}%` }} />
                  </div>
                  <div style={styles.stats}>
                    <span><strong>{raised} ETH</strong> raised</span>
                    <span>of {goal} ETH</span>
                  </div>
                  {campaign.funded && <span style={styles.badgeFunded}>Funded! ✓</span>}
                  {canInvest && (
                    <button
                      style={styles.investBtn}
                      onClick={() => openInvestModal(business.id, business)}
                    >
                      Invest
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        </main>
      )}

      {investModal && (
        <div style={styles.modalOverlay} onClick={() => !txPending && setInvestModal(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>Invest in {investModal.business.title}</h3>
            <p style={styles.modalTagline}>{investModal.business.tagline}</p>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Amount (ETH)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.1"
                value={investAmount}
                onChange={(e) => setInvestAmount(e.target.value)}
                style={styles.input}
              />
            </div>
            <div style={styles.modalActions}>
              <button style={styles.cancelBtn} onClick={() => setInvestModal(null)} disabled={txPending}>
                Cancel
              </button>
              <button style={styles.confirmBtn} onClick={invest} disabled={txPending}>
                {txPending ? 'Processing...' : 'Invest'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(165deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)',
    color: '#e2e8f0',
    fontFamily: '"DM Sans", "Segoe UI", system-ui, sans-serif',
  },
  header: {
    padding: '24px 20px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
  },
  headerInner: {
    maxWidth: '1100px',
    margin: '0 auto',
    textAlign: 'center',
  },
  logo: {
    fontSize: '1.75rem',
    fontWeight: 700,
    margin: 0,
    background: 'linear-gradient(135deg, #a78bfa 0%, #ec4899 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  tagline: {
    color: '#94a3b8',
    fontSize: '0.95rem',
    margin: '4px 0 16px',
  },
  walletRow: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '12px',
  },
  account: {
    fontSize: '0.9rem',
    color: '#94a3b8',
  },
  connected: {
    padding: '8px 16px',
    background: 'rgba(34,197,94,0.15)',
    borderRadius: '8px',
    color: '#4ade80',
  },
  connectBtn: {
    padding: '12px 28px',
    fontSize: '1rem',
    fontWeight: 600,
    color: '#fff',
    background: 'linear-gradient(135deg, #7c3aed 0%, #db2777 100%)',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
  },
  connectBtnDisabled: {
    opacity: 0.7,
    cursor: 'not-allowed',
  },
  error: {
    background: 'rgba(239,68,68,0.2)',
    color: '#fca5a5',
    padding: '12px 20px',
    margin: '0 20px 20px',
    borderRadius: '10px',
    maxWidth: '600px',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  receiptBanner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    background: 'rgba(34,197,94,0.15)',
    border: '1px solid rgba(34,197,94,0.3)',
    color: '#4ade80',
    padding: '12px 20px',
    margin: '0 20px 20px',
    borderRadius: '10px',
    maxWidth: '600px',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  receiptContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flex: 1,
  },
  receiptIcon: {
    fontSize: '1.25rem',
    fontWeight: 700,
  },
  receiptLink: {
    color: '#6ee7b7',
    fontWeight: 600,
    textDecoration: 'underline',
  },
  receiptDismiss: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    fontSize: '1.5rem',
    cursor: 'pointer',
    padding: '0 4px',
    lineHeight: 1,
  },
  hero: {
    textAlign: 'center',
    padding: '80px 24px',
  },
  heroTitle: {
    fontSize: '1.75rem',
    fontWeight: 600,
    margin: '0 0 16px',
    color: '#f1f5f9',
  },
  heroText: {
    color: '#94a3b8',
    fontSize: '1.1rem',
    maxWidth: '480px',
    margin: '0 auto',
  },
  loading: {
    textAlign: 'center',
    color: '#94a3b8',
    padding: '60px',
  },
  main: {
    maxWidth: '1100px',
    margin: '0 auto',
    padding: '32px 20px',
  },
  sectionTitle: {
    fontSize: '1.5rem',
    fontWeight: 600,
    margin: '0 0 24px',
    color: '#f1f5f9',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '24px',
  },
  card: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '16px',
    padding: '24px',
    position: 'relative',
  },
  cardImage: {
    fontSize: '3rem',
    marginBottom: '12px',
  },
  category: {
    fontSize: '0.75rem',
    color: '#a78bfa',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    fontWeight: 600,
  },
  cardTitle: {
    fontSize: '1.25rem',
    fontWeight: 600,
    margin: '8px 0 4px',
    color: '#f1f5f9',
  },
  cardTagline: {
    fontSize: '0.9rem',
    color: '#94a3b8',
    margin: '0 0 16px',
    lineHeight: 1.5,
  },
  progressBar: {
    height: '6px',
    background: 'rgba(255,255,255,0.1)',
    borderRadius: '3px',
    overflow: 'hidden',
    marginBottom: '8px',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #7c3aed, #db2777)',
    borderRadius: '3px',
    transition: 'width 0.3s ease',
  },
  stats: {
    fontSize: '0.9rem',
    color: '#94a3b8',
    marginBottom: '16px',
    display: 'flex',
    justifyContent: 'space-between',
  },
  badgeFunded: {
    display: 'inline-block',
    background: 'rgba(34,197,94,0.2)',
    color: '#4ade80',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '0.85rem',
    fontWeight: 600,
    marginBottom: '12px',
  },
  investBtn: {
    width: '100%',
    padding: '12px',
    fontSize: '1rem',
    fontWeight: 600,
    color: '#fff',
    background: 'linear-gradient(135deg, #7c3aed 0%, #db2777 100%)',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    background: '#1e293b',
    borderRadius: '16px',
    padding: '28px',
    maxWidth: '400px',
    width: '90%',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  modalTitle: {
    fontSize: '1.25rem',
    fontWeight: 600,
    margin: '0 0 4px',
    color: '#f1f5f9',
  },
  modalTagline: {
    fontSize: '0.9rem',
    color: '#94a3b8',
    margin: '0 0 20px',
  },
  inputGroup: {
    marginBottom: '12px',
  },
  label: {
    display: 'block',
    fontSize: '0.9rem',
    color: '#94a3b8',
    marginBottom: '6px',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    fontSize: '1rem',
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '8px',
    color: '#f1f5f9',
    boxSizing: 'border-box',
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
  },
  cancelBtn: {
    padding: '10px 20px',
    fontSize: '0.95rem',
    color: '#94a3b8',
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  confirmBtn: {
    padding: '10px 24px',
    fontSize: '0.95rem',
    fontWeight: 600,
    color: '#fff',
    background: 'linear-gradient(135deg, #7c3aed 0%, #db2777 100%)',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
};

export default App;
