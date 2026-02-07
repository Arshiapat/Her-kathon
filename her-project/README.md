# CrowdfundHer

A Kickstarter-like platform where users can invest in women-led businesses using blockchain (Ethereum).

## Features

- **Client-only frontend** — No backend required; connects directly to smart contract
- **Sample businesses** — 4 pre-configured campaigns to invest in
- **Blockchain investment** — Invest with ETH via MetaMask
- **Demo mode** — Simulator for testing without a wallet

## Tech Stack

- **Frontend**: React 18, Ethers.js
- **Smart Contract**: Solidity 0.8.28 (CrowdfundingPlatform)
- **Deployment**: Hardhat

## Quick Start

### Demo Mode (no wallet)

1. `cd frontend && npm install`
2. Ensure `.env` has `REACT_APP_SIMULATOR_MODE=true`
3. `npm start`
4. Select an account (Alice/Bob/Carol) and invest with virtual ETH

### Live Blockchain

1. **Deploy contract**:
   ```bash
   cd backend
   npm install
   npx hardhat run scripts/deploy.js
   ```
   Copy the printed contract address.

2. **Configure frontend**:
   - Create `frontend/.env` with:
     ```
     REACT_APP_CONTRACT_ADDRESS=<deployed_address>
     REACT_APP_SIMULATOR_MODE=false
     ```

3. **Start frontend**:
   ```bash
   cd frontend && npm start
   ```

4. Connect MetaMask and invest in campaigns.

## Sample Businesses

| Campaign | Goal | Description |
|----------|------|-------------|
| Luna's Artisan Bakery | 5 ETH | Organic sourdough & pastries |
| GreenTech Solutions | 10 ETH | Sustainable packaging |
| Artisan Crafts Co. | 3 ETH | Handcrafted jewelry marketplace |
| Her Health App | 8 ETH | Women's telehealth platform |

## Smart Contract

- `createCampaign(goalWei, durationSeconds)` — Create a campaign
- `invest(campaignId)` — Invest ETH (payable)
- `withdraw(campaignId)` — Creator withdraws when goal is reached
