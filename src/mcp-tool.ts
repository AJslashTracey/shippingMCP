import { Tool } from "langchain/tools";
import fetch from 'node-fetch';
// Import necessary OpenAI components and dotenv
import { ChatOpenAI } from "@langchain/openai";
import * as dotenv from "dotenv";
import { DynamicTool } from "langchain/tools";

dotenv.config(); // Ensure environment variables are loaded

// Function to extract cryptocurrency symbol from input
function extractCryptoSymbol(input: string): string | null {
  // Common cryptocurrency symbols and names
  const cryptoPatterns = [
    // ── Top‑tier majors ──
    { pattern: /\b(bitcoin|btc)\b/i, symbol: 'BTC' },
    { pattern: /\b(ethereum|eth)\b/i, symbol: 'ETH' },
    { pattern: /\b(tether|usdt)\b/i, symbol: 'USDT' },
    { pattern: /\b(ripple|xrp)\b/i, symbol: 'XRP' },
    { pattern: /\b(binance coin|bnb)\b/i, symbol: 'BNB' },
    { pattern: /\b(solana|sol)\b/i, symbol: 'SOL' },
    { pattern: /\b(usd coin|usdc)\b/i, symbol: 'USDC' },
    { pattern: /\b(dogecoin|doge)\b/i, symbol: 'DOGE' },
    { pattern: /\b(tron|trx)\b/i, symbol: 'TRX' },
    { pattern: /\b(cardano|ada)\b/i, symbol: 'ADA' },
  
    // ── Large‑cap layer‑1 / infrastructure ──
    { pattern: /\b(polkadot|dot)\b/i, symbol: 'DOT' },
    { pattern: /\b(toncoin|ton)\b/i, symbol: 'TON' },
    { pattern: /\b(chainlink|link)\b/i, symbol: 'LINK' },
    { pattern: /\b(avalanche|avax)\b/i, symbol: 'AVAX' },
    { pattern: /\b(polygon|matic|pol \(prev\. matic\))\b/i, symbol: 'MATIC' },
    { pattern: /\b(stellar|xlm)\b/i, symbol: 'XLM' },
    { pattern: /\b(shiba inu|shib)\b/i, symbol: 'SHIB' },
    { pattern: /\b(hedera|hbar)\b/i, symbol: 'HBAR' },
    { pattern: /\b(sui|sui)\b/i, symbol: 'SUI' },
    { pattern: /\b(bitcoin cash|bch)\b/i, symbol: 'BCH' },
    { pattern: /\b(litecoin|ltc)\b/i, symbol: 'LTC' },
    { pattern: /\b(stacks|stx)\b/i, symbol: 'STX' },
    { pattern: /\b(kaspa|kas)\b/i, symbol: 'KAS' },
    { pattern: /\b(algorand|algo)\b/i, symbol: 'ALGO' },
    { pattern: /\b(filecoin|fil)\b/i, symbol: 'FIL' },
    { pattern: /\b(vechain|vet)\b/i, symbol: 'VET' },
    { pattern: /\b(cosmos|atom)\b/i, symbol: 'ATOM' },
    { pattern: /\b(near protocol|near)\b/i, symbol: 'NEAR' },
    { pattern: /\b(elrond|egld|multiversx)\b/i, symbol: 'EGLD' },
    { pattern: /\b(aptos|apt)\b/i, symbol: 'APT' },
    { pattern: /\b(celestia|tia)\b/i, symbol: 'TIA' },
    { pattern: /\b(sei network|sei)\b/i, symbol: 'SEI' },
    { pattern: /\b(injective|inj)\b/i, symbol: 'INJ' },
    { pattern: /\b(quant|qnt)\b/i, symbol: 'QNT' },
    { pattern: /\b(immutable x|imx)\b/i, symbol: 'IMX' },
    { pattern: /\b(render|rndr)\b/i, symbol: 'RNDR' },
    { pattern: /\b(arweave|ar)\b/i, symbol: 'AR' },
    { pattern: /\b(optimism|op)\b/i, symbol: 'OP' },
    { pattern: /\b(arbitrum|arb)\b/i, symbol: 'ARB' },
    { pattern: /\b(mantle|mnt)\b/i, symbol: 'MNT' },
    { pattern: /\b(chiliz|chz)\b/i, symbol: 'CHZ' },
  
    // ── Stable‑ & wrapped‑assets ──
    { pattern: /\b(dai|dai)\b/i, symbol: 'DAI' },
    { pattern: /\b(first digital usd|fdusd)\b/i, symbol: 'FDUSD' },
    { pattern: /\b(trueusd|tusd)\b/i, symbol: 'TUSD' },
    { pattern: /\b(paypal usd|pyusd)\b/i, symbol: 'PYUSD' },
    { pattern: /\b(tether gold|xaut)\b/i, symbol: 'XAUT' },
    { pattern: /\b(pax gold|paxg)\b/i, symbol: 'PAXG' },
  
    // ── DeFi, exchanges & yield ──
    { pattern: /\b(uniswap|uni)\b/i, symbol: 'UNI' },
    { pattern: /\b(aave|aave)\b/i, symbol: 'AAVE' },
    { pattern: /\b(maker|mkr)\b/i, symbol: 'MKR' },
    { pattern: /\b(compound|comp)\b/i, symbol: 'COMP' },
    { pattern: /\b(curve dao|crv)\b/i, symbol: 'CRV' },
    { pattern: /\b(the graph|grt)\b/i, symbol: 'GRT' },
    { pattern: /\b(lido dao|ldo)\b/i, symbol: 'LDO' },
    { pattern: /\b(synthetix|snx)\b/i, symbol: 'SNX' },
    { pattern: /\b(dydx|dydx)\b/i, symbol: 'DYDX' },
    { pattern: /\b(pendle|pendle)\b/i, symbol: 'PENDLE' },
    { pattern: /\b(convex finance|cvx)\b/i, symbol: 'CVX' },
    { pattern: /\b(1inch|1inch)\b/i, symbol: '1INCH' },
    { pattern: /\b(gate ?token|gt)\b/i, symbol: 'GT' },
    { pattern: /\b(kucoin token|kcs)\b/i, symbol: 'KCS' },
    { pattern: /\b(bitget token|bgb)\b/i, symbol: 'BGB' },
    { pattern: /\b(jupiter|jup)\b/i, symbol: 'JUP' },
    { pattern: /\b(ondo|ondo)\b/i, symbol: 'ONDO' },
    { pattern: /\b(raydu?ium|ray)\b/i, symbol: 'RAY' },
    { pattern: /\b(decentraland|mana)\b/i, symbol: 'MANA' },
    { pattern: /\b(the sandbox|sand)\b/i, symbol: 'SAND' },
    { pattern: /\b(axie infinity|axs)\b/i, symbol: 'AXS' },
    { pattern: /\b(pancakeswap|cake)\b/i, symbol: 'CAKE' },
  
    // ── Privacy / speciality ──
    { pattern: /\b(monero|xmr)\b/i, symbol: 'XMR' },
    { pattern: /\b(zcash|zec)\b/i, symbol: 'ZEC' },
  
    // ── Meme / community ──
    { pattern: /\b(pepe)\b/i, symbol: 'PEPE' },
    { pattern: /\b(floki|floki)\b/i, symbol: 'FLOKI' },
  
    // ── Exchange coins & utility tokens ──
    { pattern: /\b(unus sed leo|leo)\b/i, symbol: 'LEO' },
    { pattern: /\b(okb|okb)\b/i, symbol: 'OKB' },
    { pattern: /\b(cronos|cro)\b/i, symbol: 'CRO' },
  
    // ── Web3 & data ──
    { pattern: /\b(bittensor|tao)\b/i, symbol: 'TAO' },
    { pattern: /\b(worldcoin|wld)\b/i, symbol: 'WLD' },
    { pattern: /\b(pyth network|pyth)\b/i, symbol: 'PYTH' },
    { pattern: /\b(ethereum name service|ens)\b/i, symbol: 'ENS' },
    { pattern: /\b(helium|hnt)\b/i, symbol: 'HNT' },
    { pattern: /\b(onyxcoin|xcn)\b/i, symbol: 'XCN' },
    { pattern: /\b(jasmycoin|jasmy)\b/i, symbol: 'JASMY' },
  
    // ── Misc. large‑caps ──
    { pattern: /\b(ethereum classic|etc)\b/i, symbol: 'ETC' },
    { pattern: /\b(flow|flow)\b/i, symbol: 'FLOW' },
    { pattern: /\b(core|core)\b/i, symbol: 'CORE' },
    { pattern: /\b(iota|iota)\b/i, symbol: 'IOTA' },
    { pattern: /\b(bittorrent|btt)\b/i, symbol: 'BTT' },
    { pattern: /\b(bitcoin sv|bsv)\b/i, symbol: 'BSV' },
    { pattern: /\b(kava|kava)\b/i, symbol: 'KAVA' },
    { pattern: /\b(apecoin|ape)\b/i, symbol: 'APE' },
    { pattern: /\b(arbitrum|arb)\b/i, symbol: 'ARB' },  // (duplicate guard OK if list order matters)
  
    // ── NFT / metaverse extras ──
    { pattern: /\b(theta network|theta)\b/i, symbol: 'THETA' },
    { pattern: /\b(filecoin|fil)\b/i, symbol: 'FIL' },
  
    // add any further mid‑caps you rely on below …
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

// Add this function near the top with other utility functions
function extractContractAddress(input: string): string | null {
  // Match Ethereum address format (0x followed by 40 hex characters)
  const addressMatch = input.match(/0x[a-fA-F0-9]{40}/);
  return addressMatch ? addressMatch[0] : null;
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
        modelName: "gpt-4o", // Using the more powerful model directly here
        maxTokens: 500, // Keep max tokens reasonable for a summary
        temperature: 0.5
    });
  }

  protected async _call(input: string): Promise<string> {
    try {
      // Simplified logging
      console.log(`Input received by McpTool: "${input}"`);

      // First, get the list of available tools from the MCP manifest
      const response = await fetch(this.mcpUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch MCP manifest: ${response.status} ${response.statusText}`);
      }

      const mcpManifest = await response.json();
      if (!mcpManifest || typeof mcpManifest !== 'object' || !Array.isArray((mcpManifest as any).tools)) {
        throw new Error('Invalid MCP manifest format');
      }
      const availableTools = (mcpManifest as { tools: any[] }).tools;

      // Check if the input suggests a social trend query
      const isSocialTrendQuery = input.toLowerCase().includes("trend") ||
                                 input.toLowerCase().includes("social") ||
                                 input.toLowerCase().includes("sentiment") ||
                                 input.toLowerCase().includes("market") ||
                                 input.toLowerCase().includes("price") ||
                                 input.toLowerCase().includes("sol") || // Quick check for common symbols
                                 input.toLowerCase().includes("solana");

      const isAlertsQuery = input.toLowerCase().includes("alert");

      // In the _call method, add this before the social trend check
      const contractAddress = extractContractAddress(input);
      const isProjectQuery = input.toLowerCase().includes("project") || 
                           input.toLowerCase().includes("summary") ||
                           contractAddress !== null;

      if (isProjectQuery && contractAddress) {
        console.log(`Detected project summary query for address: ${contractAddress}`);
        
        const apiUrl = new URL('https://api.qa.trendmoon.ai/social/project-summary');
        apiUrl.searchParams.append('contract_address', contractAddress);
        apiUrl.searchParams.append('force_regenerate', 'false');
        apiUrl.searchParams.append('days_ago', '7'); // Default to 7 days

        try {
          console.log(`Calling Trendmoon API for project summary: ${apiUrl.toString()}`);
          const projectResponse = await fetch(apiUrl.toString(), {
            method: 'GET',
            headers: {
              'accept': 'application/json',
              'Api-key': process.env.TRENDMOON_API_KEY || '',
            }
          });

          if (!projectResponse.ok) {
            throw new Error(`Project summary API request failed: ${projectResponse.status} ${projectResponse.statusText}`);
          }

          const projectData = await projectResponse.json();
          console.log("===== RAW PROJECT SUMMARY API RESPONSE =====");
          console.log(JSON.stringify(projectData, null, 2));
          console.log("==========================================\n");

          return JSON.stringify(projectData);
        } catch (error: any) {
          console.error(`Error fetching project summary: ${error.message}`);
          throw error;
        }
      }

      if (isAlertsQuery) {
        console.log("Detected alerts query. Fetching data from Trendmoon API directly.");
        
        const apiUrl = new URL('https://api.qa.trendmoon.ai/get_top_alerts_today');
        
        try {
          console.log(`Calling Trendmoon API for alerts: ${apiUrl.toString()}`);
          const alertsResponse = await fetch(apiUrl.toString(), {
            method: 'GET',
            headers: {
              'accept': 'application/json',
              'Api-key': process.env.TRENDMOON_API_KEY || '',
            }
          });

          if (!alertsResponse.ok) {
            throw new Error(`Alerts API request failed: ${alertsResponse.status} ${alertsResponse.statusText}`);
          }

          const alertsData = await alertsResponse.json();
          console.log("===== RAW ALERTS API RESPONSE =====");
          console.log(JSON.stringify(alertsData, null, 2));
          console.log("===================================\n");

          return JSON.stringify(alertsData);
        } catch (error: any) {
          console.error(`Error fetching alerts: ${error.message}`);
          throw error;
        }
      }

      const socialTrendToolInfo = availableTools.find((tool: any) => tool.name === "trendmoon_get_social_trend");
      const symbolFromInput = extractCryptoSymbol(input);

      // --- NEW LOGIC: Direct OpenAI call for social trends ---
      if (isSocialTrendQuery && socialTrendToolInfo && symbolFromInput) {
        console.log(`Detected social trend query for ${symbolFromInput}. Fetching data and calling OpenAI directly.`);

        const apiKey = process.env.TRENDMOON_API_KEY;
        if (!apiKey) {
          return "Error: TRENDMOON_API_KEY environment variable is not set.";
        }

        const apiUrl = new URL('https://api.qa.trendmoon.ai/social/trend');
        apiUrl.searchParams.append('symbol', symbolFromInput);

        // Extract and append date_interval or default
        let dateInterval = 20; // Default
        const dateIntervalMatch = input.match(/(\d+)\s*days?/i) || input.match(/interval\s+(\d+)/i);
         if (dateIntervalMatch) {
            const parsedInterval = parseInt(dateIntervalMatch[1]);
            if (!isNaN(parsedInterval) && parsedInterval > 0) {
                 dateInterval = parsedInterval;
            }
        }
        apiUrl.searchParams.append('date_interval', dateInterval.toString());
        apiUrl.searchParams.append('time_interval', '1d'); // Keep requesting daily data

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
          console.log("===== RAW TRENDMOON API RESPONSE =====");
          console.log(JSON.stringify(trendmoonData, null, 2)); // Log raw response
          console.log("=====================================\n");

          if (!trendmoonData) {
            throw new Error('Empty response from Trendmoon API');
          }

          // Summarize the trend data
          const trendSummary = summarizeTrend(trendmoonData);

          // Construct the prompt for direct OpenAI call
          const combinedPrompt = `
Original User Query: "${input}"

You have been provided with the following time-series data for ${trendSummary.symbol} from ${trendSummary.start} to ${trendSummary.end}:
${JSON.stringify(trendSummary, null, 2)}

**Your Task:**
Based *only* on the data provided above and the user's original query, generate a SINGLE, concise summary PARAGRAPH.

**Critically Important Output Instructions:**
1.  Analyze the data internally to understand the overall trends from the beginning to the end of the period. Note the starting and ending price if available.
2.  Focus SOLELY on synthesizing these trends into a short narrative paragraph. Describe the general price movement (e.g., overall increase/decrease, volatility from start to end) and the corresponding social sentiment trend (e.g., improving/declining, relationship to price). Address the specific focus mentioned in the user's original query if applicable (e.g., "focus on price movement").
3.  Your entire output MUST be JUST this single summary paragraph.
4.  **DO NOT** list, itemize, or reproduce ANY daily data points (prices, scores, mentions, dates) in your response. No headers, no bullet points, no lists. Just the narrative paragraph.

Example of CORRECT output structure:
"Over the observed period [mention start/end dates if possible], ${trendSummary.symbol} experienced [describe overall price trend - e.g., significant volatility, a net decrease/increase] starting around [start price, if available] and ending near [end price, if available]. Social sentiment [describe overall sentiment trend - e.g., generally mirrored the price movement, remained positive despite price drops, declined alongside price] suggesting [interpret the relationship - e.g., waning/growing community interest, detachment from price action]."

Generate the summary paragraph now:
`;

          console.log("\n===== COMBINED PROMPT FOR OPENAI =====");
          console.log(combinedPrompt);
          console.log("======================================\n");

          // Call OpenAI API directly
          console.log("Sending combined prompt to OpenAI...");
          const llmResponse = await this.llm.invoke(combinedPrompt);
          const summary = llmResponse.content;

          console.log("\n===== OPENAI RESPONSE (SUMMARY) =====");
          console.log(summary);
          console.log("=====================================\n");

          // Return the summary from OpenAI as the tool's result
          return typeof summary === 'string' ? summary : JSON.stringify(summary);

        } catch (apiError: any) {
           console.error(`Error during Trendmoon API call or OpenAI call: ${apiError.message || 'Unknown error'}`);
           return `Error during Trendmoon API call or OpenAI call: ${apiError.message || 'Unknown error'}`;
        }

      } else {
        // --- Default Logic: Handle other tools or fall back ---
        console.log("Input did not match social trend query criteria, or tool/symbol not found. Looking for other tools or returning manifest.");

        // (Keep the existing logic for handling other tools like alerts, messages, platforms, coins via mock server if needed)
        // Find the appropriate tool based on keywords if not social trend
        let toolToUse: any = null;
        let params: any = {};

        if (input.toLowerCase().includes("alert")) {
           toolToUse = availableTools.find((tool: any) => tool.name === "trendmoon_get_top_alerts_today");
           // params = {}; // No params needed usually for top alerts
        } else if (input.toLowerCase().includes("message") || input.toLowerCase().includes("metrics")) {
             toolToUse = availableTools.find((tool: any) => tool.name === "trendmoon_get_messages_metrics");
             // Extract params like group_username, dates etc. (existing logic can be adapted here)
        } else if (input.toLowerCase().includes("platform")) {
             toolToUse = availableTools.find((tool: any) => tool.name === "trendmoon_get_platforms");
        } else if (input.toLowerCase().includes("coin")) {
             toolToUse = availableTools.find((tool: any) => tool.name === "trendmoon_get_coins");
        }
        // ... add more keyword checks for other tools if necessary ...


        if (toolToUse) {
          console.log(`Using mock server for tool: ${toolToUse.name}`);
          // Execute request against the mock server endpoint
           return this.executeToolRequest(toolToUse, params); // Assumes params are correctly extracted above
        } else {
          // If no specific tool path matched, return the manifest or an error/clarification message
          console.log("No specific tool matched the input. Returning MCP manifest.");
          return JSON.stringify(mcpManifest); // Or return a message like "Please specify which tool you want to use."
        }
      }

    } catch (error: any) {
      console.error(`Unhandled error in McpTool._call: ${error.message || 'Unknown error'}`);
      return `Error: ${error.message || 'Unknown error'}. Please ensure the MCP server is running at ${this.mcpUrl}`;
    }
  }

  // Keep executeToolRequest for calls to the mock server for other tools
  private async executeToolRequest(tool: any, params: any): Promise<string> {
      console.log(`Calling Mock Server endpoint for tool: ${tool.name}`);
      const toolUrl = `${new URL(this.mcpUrl).origin}/tools/${tool.name}`;
      try {
           const toolResponse = await fetch(toolUrl, {
               method: 'POST',
               headers: {
                   'Content-Type': 'application/json',
                   'Accept': 'application/json'
               },
               body: JSON.stringify(params) // Send extracted params
           });
 
           if (!toolResponse.ok) {
               const errorText = await toolResponse.text();
               console.error(`Error executing tool via mock server: ${errorText}`);
               return `Error executing ${tool.name}: ${toolResponse.status} ${toolResponse.statusText}: ${errorText}`;
           }

           const toolResult = await toolResponse.json();

           console.log("===== TOOL RESULT FROM MOCK SERVER =====");
           console.log(JSON.stringify(toolResult, null, 2));
           console.log("========================================\n");

           return JSON.stringify(toolResult); // Return result from mock server
      } catch(error:any) {
           console.error(`Error calling mock server endpoint ${toolUrl}: ${error.message}`);
           return `Error calling mock server for ${tool.name}: ${error.message}`;
      }
  }
}

export async function createToolFromMCP(options: { mcpUrl: string }): Promise<Tool[]> {
  return [new McpTool(options.mcpUrl)];
} 