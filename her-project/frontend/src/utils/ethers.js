import { ethers } from 'ethers';
import CrowdfundingPlatformAbi from '../abis/CrowdfundingPlatform.json';

const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS || 'YOUR_DEPLOYED_CONTRACT_ADDRESS';

export const getContract = async () => {
  if (!window.ethereum) throw new Error('MetaMask not found. Please install MetaMask.');
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  return new ethers.Contract(CONTRACT_ADDRESS, CrowdfundingPlatformAbi.abi, signer);
};

export const getContractReadOnly = async () => {
  if (!window.ethereum) throw new Error('MetaMask not found.');
  const provider = new ethers.BrowserProvider(window.ethereum);
  return new ethers.Contract(CONTRACT_ADDRESS, CrowdfundingPlatformAbi.abi, provider);
};
