import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import WomenSavingsPool from './abis/WomenSavingsPool.json';

const contractAddress = "YOUR_DEPLOYED_CONTRACT_ADDRESS";

function App() {
  const [message, setMessage] = useState('Loading backend...');
  const [poolBalance, setPoolBalance] = useState('0');
  const [contract, setContract] = useState(null);
  const [signer, setSigner] = useState(null);

  // Connect to backend
  useEffect(() => {
    fetch('http://localhost:8000/api/health')
      .then(res => res.json())
      .then(data => setMessage(data.message))
      .catch(() => setMessage('Backend not connected'));
  }, []);

  // Connect to Ethereum and contract
  useEffect(() => {
    async function initContract() {
      if (!window.ethereum) {
        console.error('MetaMask not found');
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, WomenSavingsPool.abi, signer);

      setContract(contract);
      setSigner(signer);

      try {
        const balance = await contract.getPoolBalance();
        setPoolBalance(ethers.formatEther(balance));
      } catch (err) {
        console.error(err);
      }
    }
    initContract();
  }, []);

  // Join pool function
  const joinPool = async () => {
    if (!contract) return;
    try {
      const tx = await contract.joinPool({ value: ethers.parseEther("0.05") });
      await tx.wait();
      const balance = await contract.getPoolBalance();
      setPoolBalance(ethers.formatEther(balance));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '50px auto', padding: '20px', fontFamily: 'system-ui' }}>
      <h1 style={{ color: '#3776ab' }}>Women Savings Pool</h1>

      <div style={{ background: '#f0f0f0', padding: '20px', borderRadius: '8px', marginTop: '20px' }}>
        <strong>Backend Status:</strong> {message}
      </div>

      <div style={{ marginTop: '20px', background: '#e0ffe0', padding: '20px', borderRadius: '8px' }}>
        <p><strong>Pool Balance:</strong> {poolBalance} ETH</p>
        <button onClick={joinPool} style={{ padding: '10px 20px', marginTop: '10px' }}>
          Join Pool with 0.05 ETH
        </button>
      </div>

      <div style={{ marginTop: '30px', color: '#666' }}>
        <p>Frontend: React running on port 3000</p>
        <p>Backend: Python + Flask running on port 8000</p>
        <p>Database: PostgreSQL connected</p>
      </div>
    </div>
  );
}

export default App;
