import fetch from 'node-fetch';
import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

// === CONFIG ===
const COINGECKO_API = 'https://api.coingecko.com/api/v3/simple/price';
const COINS = ['bitcoin', 'ethereum', 'solana', 'near'];
const SYMBOLS = { bitcoin: 'BTC', ethereum: 'ETH', solana: 'SOL', near: 'NEAR' };

// RPC + Contract details
const RPC_URL = process.env.RPC_URL;
const MARKET_CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const MARKET_CONTRACT_ABI = [
    "function marketCounter() public view returns (uint256)",
    "function markets(uint256) public view returns (tuple(uint256 id, string title, string description, uint256 resolveTimestamp, bool resolved))",
    "function createMarket(string memory title, string memory description, uint256 resolveTimestamp) public returns (uint256)"
];

const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY!, provider);
const marketContract = new ethers.Contract(MARKET_CONTRACT_ADDRESS!, MARKET_CONTRACT_ABI, provider);
const marketContractWithSigner = new ethers.Contract(MARKET_CONTRACT_ADDRESS!, MARKET_CONTRACT_ABI, wallet);

async function getActiveMarketsCount() {
    const totalMarkets = await marketContract.marketCounter();
    let activeCount = 0;

    const total = Number(totalMarkets);
    const recentWindow = Math.min(total, 20);

    for (let i = total - recentWindow; i < total; i++) {
        const market = await marketContract.markets(i);
        if (!market.resolved) {
            activeCount++;
        }
    }

    return activeCount;
}

async function createMarket(title: string, description: string, resolveAt: Date) {
    console.log('Creating market:');
    console.log('Title:', title);
    console.log('Description:', description);
    console.log('Resolve At:', resolveAt);
    
    try {
        const resolveTimestamp = Math.floor(resolveAt.getTime() / 1000);
        const tx = await marketContractWithSigner.createMarket(title, description, resolveTimestamp);
        console.log('Transaction sent:', tx.hash);
        
        const receipt = await tx.wait();
        console.log('Market created successfully! Block:', receipt.blockNumber);
        return receipt;
    } catch (error) {
        console.error('Failed to create market:', error);
        throw error;
    }
}

async function fetchPrices() {
    const url = `${COINGECKO_API}?ids=${COINS.join(',')}&vs_currencies=usd`;
    const res = await fetch(url);
    const data = await res.json() as Record<string, Record<string, number>>;

    const prices: Record<string, number> = {};
    for (const coin of COINS) {
        prices[SYMBOLS[coin]] = data[coin].usd;
    }
    return prices;
}

async function generateMarkets(prices: Record<string, number>) {
    const prompt = `
Current crypto prices:
${Object.entries(prices).map(([k, v]) => `${k}: $${v}`).join('\n')}

Please create 5 prediction markets related to BTC, ETH, SOL, or NEAR, that can resolve within the next 8 hours.
Each market should have:
- Title
- Short description
- Clear question formulation.

Respond strictly in JSON array format:
[
  { "title": "...", "description": "...", "resolve_in_hours": 8 },
  ...
]
`;

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'gpt-4o',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7
        })
    });

    const json = await openaiRes.json() as { choices: { message: { content: string } }[] };
    let text = json.choices[0].message.content as string;

    // Remove markdown code fences if present
    if (text.includes('```json')) {
        text = text.replace(/```json\s*/, '').replace(/\s*```$/, '');
    } else if (text.includes('```')) {
        text = text.replace(/```\s*/, '').replace(/\s*```$/, '');
    }

    let markets;
    try {
        markets = JSON.parse(text.trim());
    } catch (e) {
        console.error('Failed to parse OpenAI response:', text);
        return [];
    }

    return markets;
}

async function main() {
    const activeMarkets = await getActiveMarketsCount();
    console.log(`Active on-chain markets: ${activeMarkets}`);
    if (activeMarkets >= 5) {
        console.log('Too many active markets. Skipping...');
        return;
    }

    const prices = await fetchPrices();
    console.log('Fetched prices:', prices);

    const markets = await generateMarkets(prices);
    console.log('Generated markets:', markets);

    for (const market of markets) {
        const resolveAt = new Date(Date.now() + market.resolve_in_hours * 60 * 60 * 1000);
        await createMarket(market.title, market.description, resolveAt);
    }
}

main().catch(console.error);
