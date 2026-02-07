import { ethers } from 'ethers';
import WomenSavingsPool from '../abis/WomenSavingsPool.json';

const contractAddress = "YOUR_DEPLOYED_CONTRACT_ADDRESS";

export const getContract = async () => {
  if (!window.ethereum) throw new Error("MetaMask not found");
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  return new ethers.Contract(contractAddress, WomenSavingsPool.abi, signer);
};
