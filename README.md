# Prediction Market Creator

An automated prediction market creator that generates crypto-related prediction markets based on real-time price data and deploys them to the blockchain.

## Overview

This application:
- Fetches real-time cryptocurrency prices (BTC, ETH, SOL, NEAR) from CoinGecko
- Uses OpenAI to generate relevant prediction markets based on current market conditions
- Automatically deploys these markets to a smart contract on the blockchain
- Maintains a limit of 5 active markets to prevent spam

## Features

- **Real-time Price Integration**: Fetches current crypto prices from CoinGecko API
- **AI-Generated Markets**: Uses GPT-4 to create relevant and timely prediction markets
- **Blockchain Integration**: Deploys markets directly to smart contracts using ethers.js
- **Rate Limiting**: Automatically checks and limits active markets to 5
- **TypeScript Support**: Fully typed for better development experience

## Prerequisites

- Node.js (v18 or higher)
- A blockchain wallet with private key
- OpenAI API key
- Access to a blockchain RPC endpoint

## Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd prediction-creator
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with the following variables:
```env
RPC_URL=your_blockchain_rpc_url
CONTRACT_ADDRESS=your_deployed_contract_address
PRIVATE_KEY=your_wallet_private_key
OPENAI_API_KEY=your_openai_api_key
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `RPC_URL` | Blockchain RPC endpoint URL | ✅ |
| `CONTRACT_ADDRESS` | Deployed prediction market contract address | ✅ |
| `PRIVATE_KEY` | Wallet private key for transaction signing | ✅ |
| `OPENAI_API_KEY` | OpenAI API key for market generation | ✅ |

## Smart Contract Requirements

Your deployed contract must implement these functions:
```solidity
function marketCounter() public view returns (uint256)
function markets(uint256) public view returns (tuple(uint256 id, string title, string description, uint256 resolveTimestamp, bool resolved))
function createMarket(string memory title, string memory description, uint256 resolveTimestamp) public returns (uint256)
```

## Usage

Run the application:
```bash
npx tsx index.ts
```

The application will:
1. Check current active markets on-chain
2. Skip execution if there are already 5+ active markets
3. Fetch current crypto prices for BTC, ETH, SOL, and NEAR
4. Generate 5 relevant prediction markets using AI
5. Deploy each market to the blockchain

## Security Considerations

⚠️ **Important Security Notes:**

- **Never commit your `.env` file** - Add it to `.gitignore`
- **Store private keys securely** - Consider using hardware wallets or secure key management
- **Use testnet first** - Test thoroughly before using mainnet
- **Monitor gas fees** - Market creation requires blockchain transactions

## Dependencies

- `ethers` - Blockchain interaction
- `node-fetch` - HTTP requests
- `dotenv` - Environment variable management
- `tsx` - TypeScript execution

## Supported Cryptocurrencies

- Bitcoin (BTC)
- Ethereum (ETH)
- Solana (SOL)
- NEAR Protocol (NEAR)

## Market Generation

Markets are generated with:
- **8-hour resolution time** - All markets resolve within 8 hours
- **Price-based predictions** - Markets focus on price movements and volatility
- **Clear questions** - AI ensures markets have unambiguous resolution criteria

## Example Generated Markets

- "Will BTC price increase from $107,056 in the next 8 hours?"
- "Will ETH reach or surpass $2,700 within 8 hours?"
- "Will SOL drop below $150 in the next 8 hours?"
- "Will NEAR Protocol price rise above $2.50 within 8 hours?"
- "Will BTC experience >2% price volatility in 8 hours?"

## Error Handling

The application includes comprehensive error handling for:
- API failures (CoinGecko, OpenAI)
- Blockchain connection issues
- Transaction failures
- JSON parsing errors

## Development

For development, you can modify:
- `COINS` array to add more cryptocurrencies
- `SYMBOLS` mapping for ticker symbols
- Market generation prompts in `generateMarkets()`
- Active market limits in `main()`
