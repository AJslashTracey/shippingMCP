import { Tool } from "langchain/tools";
import fetch from 'node-fetch';
// Import necessary OpenAI components and dotenv
import { ChatOpenAI } from "@langchain/openai";
import * as dotenv from "dotenv";
import { DynamicTool } from "langchain/tools";

dotenv.config(); // Ensure environment variables are loaded

// Function to verify API key
async function verifyApiKey(apiKey: string): Promise<boolean> {
  try {
    // Simple verification request to check if API key is valid
    const response = await fetch('https://api.trendmoon.ai/health', {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'Api-Key': apiKey,
      }
    });
    return response.ok;
  } catch (error) {
    console.error('API Key verification failed:', error);
    return false;
  }
}

// Function to extract cryptocurrency symbol from input
function extractCryptoSymbol(input: string): string | null {
  const cryptoPatterns = [
    // Major Cryptocurrencies
    { pattern: /\b(bitcoin|btc)\b/i, symbol: 'BTC' },
    { pattern: /\b(ethereum|eth)\b/i, symbol: 'ETH' },
    { pattern: /\b(binance coin|bnb)\b/i, symbol: 'BNB' },
    { pattern: /\b(solana|sol)\b/i, symbol: 'SOL' },
    { pattern: /\b(cardano|ada)\b/i, symbol: 'ADA' },
    { pattern: /\b(ripple|xrp)\b/i, symbol: 'XRP' },
    { pattern: /\b(polkadot|dot)\b/i, symbol: 'DOT' },
    { pattern: /\b(dogecoin|doge)\b/i, symbol: 'DOGE' },
    { pattern: /\b(chainlink|link)\b/i, symbol: 'LINK' },
    { pattern: /\b(polygon|matic)\b/i, symbol: 'MATIC' },
    { pattern: /\b(avalanche|avax)\b/i, symbol: 'AVAX' },
    { pattern: /\b(shiba inu|shib)\b/i, symbol: 'SHIB' },

    // DeFi Tokens
    { pattern: /\b(uniswap|uni)\b/i, symbol: 'UNI' },
    { pattern: /\b(aave)\b/i, symbol: 'AAVE' },
    { pattern: /\b(maker|mkr)\b/i, symbol: 'MKR' },
    { pattern: /\b(compound|comp)\b/i, symbol: 'COMP' },
    { pattern: /\b(sushi|sushiswap)\b/i, symbol: 'SUSHI' },
    { pattern: /\b(pancakeswap|cake)\b/i, symbol: 'CAKE' },
    { pattern: /\b(curve dao|crv)\b/i, symbol: 'CRV' },
    { pattern: /\b(yearn|yfi)\b/i, symbol: 'YFI' },

    // Layer 1s & Layer 2s
    { pattern: /\b(arbitrum|arb)\b/i, symbol: 'ARB' },
    { pattern: /\b(optimism|op)\b/i, symbol: 'OP' },
    { pattern: /\b(near protocol|near)\b/i, symbol: 'NEAR' },
    { pattern: /\b(fantom|ftm)\b/i, symbol: 'FTM' },
    { pattern: /\b(cosmos|atom)\b/i, symbol: 'ATOM' },
    { pattern: /\b(algorand|algo)\b/i, symbol: 'ALGO' },
    { pattern: /\b(tezos|xtz)\b/i, symbol: 'XTZ' },
    { pattern: /\b(hedera|hbar)\b/i, symbol: 'HBAR' },

    // Stablecoins
    { pattern: /\b(tether|usdt)\b/i, symbol: 'USDT' },
    { pattern: /\b(usd coin|usdc)\b/i, symbol: 'USDC' },
    { pattern: /\b(dai)\b/i, symbol: 'DAI' },
    { pattern: /\b(frax)\b/i, symbol: 'FRAX' },

    // Gaming & Metaverse
    { pattern: /\b(decentraland|mana)\b/i, symbol: 'MANA' },
    { pattern: /\b(the sandbox|sand)\b/i, symbol: 'SAND' },
    { pattern: /\b(axie infinity|axs)\b/i, symbol: 'AXS' },
    { pattern: /\b(gala)\b/i, symbol: 'GALA' },
    { pattern: /\b(enjin|enj)\b/i, symbol: 'ENJ' },

    // Other Notable Projects
    { pattern: /\b(filecoin|fil)\b/i, symbol: 'FIL' },
    { pattern: /\b(theta)\b/i, symbol: 'THETA' },
    { pattern: /\b(vechain|vet)\b/i, symbol: 'VET' },
    { pattern: /\b(stellar|xlm)\b/i, symbol: 'XLM' },
    { pattern: /\b(monero|xmr)\b/i, symbol: 'XMR' },
    { pattern: /\b(litecoin|ltc)\b/i, symbol: 'LTC' },
    { pattern: /\b(internet computer|icp)\b/i, symbol: 'ICP' },
    { pattern: /\b(render|rndr)\b/i, symbol: 'RNDR' },
    { pattern: /\b(immutable|imx)\b/i, symbol: 'IMX' },
    { pattern: /\b(fetch\.ai|fet)\b/i, symbol: 'FET' },
    { pattern: /\b(injective|inj)\b/i, symbol: 'INJ' },
    { pattern: /\b(sui)\b/i, symbol: 'SUI' },
    { pattern: /\b(celestia|tia)\b/i, symbol: 'TIA' },
    { pattern: /\b(sei)\b/i, symbol: 'SEI' }
  ];
  
  // First check exact matches from the list above
  for (const crypto of cryptoPatterns) {
    if (crypto.pattern.test(input)) {
      return crypto.symbol;
    }
  }
  
  // Then check for patterns like "XRP trend" or "trend for XRP"
  const trendForMatch = input.match(/trend for\s+([a-z0-9]{2,10})/i);
  if (trendForMatch) {
    return trendForMatch[1].toUpperCase();
  }
  
  const symbolTrendMatch = input.match(/([a-z0-9]{2,10})\s+trend/i);
  if (symbolTrendMatch) {
    return symbolTrendMatch[1].toUpperCase();
  }
  
  return null;
}

export class McpTool extends Tool {
  name = "mcp";
  description = "A tool for interacting with MCP servers";
  private llm: ChatOpenAI;

  constructor(private mcpUrl: string) {
    super();
    this.llm = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: "gpt-4",
      maxTokens: 500,
      temperature: 0.5
    });
  }

  protected async _call(input: string): Promise<string> {
    try {
      console.log(`Input received by McpTool: "${input}"`);

      const apiKey = process.env.TRENDMOON_API_KEY;
      if (!apiKey) {
        throw new Error("TRENDMOON_API_KEY environment variable is not set");
      }
      
      // Verify API key
      const isApiKeyValid = await verifyApiKey(apiKey);
      if (!isApiKeyValid) {
        throw new Error("Invalid Trendmoon API key or service unavailable");
      }

      // Check if this is an alerts request
      const isAlertsRequest = input.toLowerCase().includes("alert") || 
                           input.toLowerCase().includes("alerts") ||
                           input.toLowerCase().includes("crypto alerts");

      if (isAlertsRequest) {
        const apiUrl = 'https://api.trendmoon.ai/get_top_alerts_today';
        console.log("Calling Trendmoon Alerts API:", apiUrl);
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'accept': 'application/json',
            'Api-Key': apiKey,
          }
        });

        if (!response.ok) {
          const errorBody = await response.text().catch(() => 'Could not read error body');
          throw new Error(`API request failed: ${response.status} ${response.statusText}. Body: ${errorBody}`);
        }

        const data = await response.json();
        console.log("Trendmoon API response:", JSON.stringify(data).substring(0, 300) + "...");
        return JSON.stringify(data);
      }

      // Handle social trend queries
      const isSocialTrendQuery = input.toLowerCase().includes("trend") ||
                              input.toLowerCase().includes("social") ||
                              input.toLowerCase().includes("sentiment") ||
                              input.toLowerCase().includes("market") ||
                              input.toLowerCase().includes("price") ||
                              input.toLowerCase().includes("analys") ||
                              input.toLowerCase().includes("study");

      const symbolFromInput = extractCryptoSymbol(input);

      if (isSocialTrendQuery && symbolFromInput) {
        const apiUrl = new URL('https://api.trendmoon.ai/social/trend');
        apiUrl.searchParams.append('symbol', symbolFromInput);
        apiUrl.searchParams.append('date_interval', '20');  // Default to 20 days
        apiUrl.searchParams.append('time_interval', '1d');  // Daily intervals

        console.log(`Calling Trendmoon Social Trend API: ${apiUrl.toString()}`);

        const response = await fetch(apiUrl.toString(), {
          method: 'GET',
          headers: {
            'accept': 'application/json',
            'Api-Key': apiKey,
          }
        });

        if (!response.ok) {
          const errorBody = await response.text().catch(() => 'Could not read error body');
          throw new Error(`API request failed: ${response.status} ${response.statusText}. Body: ${errorBody}`);
        }

        const data = await response.json();
        console.log("Trendmoon Social API response:", JSON.stringify(data).substring(0, 300) + "...");
        return JSON.stringify(data);
      }

      return "Please specify either an alerts request or a social trend query with a valid cryptocurrency symbol.";

    } catch (error: any) {
      console.error(`Error calling Trendmoon API:`, error);
      console.error(`API Key present: ${!!process.env.TRENDMOON_API_KEY}`);
      console.error(`API Key (masked): ${process.env.TRENDMOON_API_KEY ? process.env.TRENDMOON_API_KEY.substring(0, 3) + '...' : 'not set'}`);
      throw error;
    }
  }
}

export async function createToolFromMCP(options: { mcpUrl: string }): Promise<Tool[]> {
  return [new McpTool(options.mcpUrl)];
} 