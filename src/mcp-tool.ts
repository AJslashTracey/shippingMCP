import { Tool } from "langchain/tools";
import fetch from 'node-fetch';
// Import necessary OpenAI components and dotenv
import { ChatOpenAI } from "@langchain/openai";
import * as dotenv from "dotenv";

dotenv.config(); // Ensure environment variables are loaded

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
  // Add an OpenAI client instance to the tool
  private llm: ChatOpenAI;

  constructor(private mcpUrl: string) {
    super();
    // Initialize the LLM client within the tool
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

      // Check if this is an alerts request
      const isAlertsRequest = input.toLowerCase().includes("alert") || 
                             input.toLowerCase().includes("alerts") ||
                             input.toLowerCase().includes("crypto alerts");

      if (isAlertsRequest) {
        console.log("Detected alerts request, using API call...");
        const apiKey = process.env.TRENDMOON_API_KEY;
        if (!apiKey) {
          console.log("TRENDMOON_API_KEY not found in environment variables");
          return "Error: TRENDMOON_API_KEY environment variable is not set.";
        }

        try {
          const apiUrl = new URL('https://api.qa.trendmoon.ai/get_top_alerts_today');
          console.log("Calling Trendmoon API:", apiUrl.toString());
          
          const alertsResponse = await fetch(apiUrl.toString(), {
            method: 'GET',
            headers: {
              'accept': 'application/json',
              'Api-key': apiKey,
            }
          });

          if (!alertsResponse.ok) {
            const errorText = await alertsResponse.text();
            console.error(`Error fetching alerts from Trendmoon API: ${alertsResponse.status} ${alertsResponse.statusText} - ${errorText}`);
            return `Error from Trendmoon API: ${alertsResponse.status} ${alertsResponse.statusText}`;
          }

          const alertsData = await alertsResponse.json();
          return JSON.stringify(alertsData);
        } catch (apiError: any) {
          console.error(`Error calling Trendmoon Alerts API:`, apiError);
          return `Error calling Trendmoon Alerts API: ${apiError.message || 'Unknown error'}`;
        }
      }

      // Handle social trend queries
      const isSocialTrendQuery = input.toLowerCase().includes("trend") ||
                                input.toLowerCase().includes("social") ||
                                input.toLowerCase().includes("sentiment") ||
                                input.toLowerCase().includes("market") ||
                                input.toLowerCase().includes("price") ||
                                input.toLowerCase().includes("sol") ||
                                input.toLowerCase().includes("solana") ||
                                input.toLowerCase().includes("analys") ||  // Will match 'analysis', 'analyses', 'analyze'
                                input.toLowerCase().includes("study");     // Additional term for analysis

      const symbolFromInput = extractCryptoSymbol(input);

      if (isSocialTrendQuery && symbolFromInput) {
        console.log(`Detected social trend query for ${symbolFromInput}`);

        const apiKey = process.env.TRENDMOON_API_KEY;
        if (!apiKey) {
          return "Error: TRENDMOON_API_KEY environment variable is not set.";
        }

        const apiUrl = new URL('https://api.qa.trendmoon.ai/social/trend');
        apiUrl.searchParams.append('symbol', symbolFromInput);

        let dateInterval = 20;
        const dateIntervalMatch = input.match(/(\d+)\s*days?/i) || input.match(/interval\s+(\d+)/i);
        if (dateIntervalMatch) {
          const parsedInterval = parseInt(dateIntervalMatch[1]);
          if (!isNaN(parsedInterval) && parsedInterval > 0) {
            dateInterval = parsedInterval;
          }
        }
        apiUrl.searchParams.append('date_interval', dateInterval.toString());
        apiUrl.searchParams.append('time_interval', '1d');

        console.log(`Calling Trendmoon API: ${apiUrl.toString()}`);

        try {
          const trendmoonResponse = await fetch(apiUrl.toString(), {
            method: 'GET',
            headers: {
              'accept': 'application/json',
              'Api-key': apiKey,
            }
          });

          if (!trendmoonResponse.ok) {
            const errorText = await trendmoonResponse.text();
            console.error(`Error fetching from Trendmoon API: ${trendmoonResponse.status} ${trendmoonResponse.statusText} - ${errorText}`);
            return `Error from Trendmoon API: ${trendmoonResponse.status} ${trendmoonResponse.statusText}`;
          }

          const trendmoonData = await trendmoonResponse.json();
          return JSON.stringify(trendmoonData);
        } catch (error: any) {
          console.error(`Error calling Trendmoon API:`, error);
          return `Error: ${error.message || 'Unknown error'}`;
        }
      }

      return "Please specify either an alerts request or a social trend query with a valid cryptocurrency symbol.";

    } catch (error: any) {
      console.error(`Unhandled error in McpTool._call: ${error.message || 'Unknown error'}`);
      return `Error: ${error.message || 'Unknown error'}`;
    }
  }
}

export async function createToolFromMCP(options: { mcpUrl: string }): Promise<Tool[]> {
  return [new McpTool(options.mcpUrl)];
} 