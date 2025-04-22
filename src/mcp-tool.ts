import { Tool } from "langchain/tools";
import fetch from 'node-fetch';
// Import necessary OpenAI components and dotenv
import { ChatOpenAI } from "@langchain/openai";
import * as dotenv from "dotenv";

dotenv.config(); // Ensure environment variables are loaded

// Function to extract cryptocurrency symbol from input
function extractCryptoSymbol(input: string): string | null {
  // Common cryptocurrency symbols and names
  const cryptoPatterns = [
    { pattern: /\b(bitcoin|btc)\b/i, symbol: 'BTC' },
    { pattern: /\b(ethereum|eth)\b/i, symbol: 'ETH' },
    { pattern: /\b(solana|sol)\b/i, symbol: 'SOL' },
    { pattern: /\b(binance coin|bnb)\b/i, symbol: 'BNB' },
    { pattern: /\b(cardano|ada)\b/i, symbol: 'ADA' },
    { pattern: /\b(ripple|xrp)\b/i, symbol: 'XRP' },
    { pattern: /\b(dogecoin|doge)\b/i, symbol: 'DOGE' },
    { pattern: /\b(polkadot|dot)\b/i, symbol: 'DOT' },
    { pattern: /\b(shiba inu|shib)\b/i, symbol: 'SHIB' },
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
        modelName: "gpt-4o", // Using the more powerful model directly here
        maxTokens: 500, // Keep max tokens reasonable for a summary
        temperature: 0.5
    });
  }

  protected async _call(input: string): Promise<string> {
    try {
      console.log(`Input received by McpTool: "${input}"`);

      // First get the manifest
      const response = await fetch(this.mcpUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error fetching MCP manifest: ${errorText}`);
        return `Error: Server returned ${response.status} ${response.statusText}: ${errorText}`;
      }

      const mcpManifest = await response.json();
      const availableTools = mcpManifest.tools;

      // Check if this is an alerts request
      const isAlertsRequest = input.toLowerCase().includes("alert") || 
                             input.toLowerCase().includes("alerts") ||
                             input.toLowerCase().includes("crypto alerts");

      // Always handle alerts via direct API, regardless of manifest
      if (isAlertsRequest) {
        console.log("Detected alerts request, using direct API call...");
        const apiKey = process.env.TRENDMOON_API_KEY;
        if (!apiKey) {
          console.log("TRENDMOON_API_KEY not found in environment variables");
          return "Error: TRENDMOON_API_KEY environment variable is not set.";
        }

        console.log("TRENDMOON_API_KEY found, proceeding with direct API call");
        try {
          const apiUrl = new URL('https://api.qa.trendmoon.ai/get_top_alerts_today');
          console.log("Calling Trendmoon API directly:", apiUrl.toString());
          
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
          console.log("===== RAW TRENDMOON ALERTS RESPONSE =====");
          console.log(JSON.stringify(alertsData, null, 2));
          console.log("=========================================");
          
          return JSON.stringify(alertsData);
        } catch (apiError: any) {
          console.error(`Error calling Trendmoon Alerts API:`, apiError);
          return `Error calling Trendmoon Alerts API: ${apiError.message || 'Unknown error'}`;
        }
      }

      // Check if the input suggests a social trend query
      const isSocialTrendQuery = input.toLowerCase().includes("trend") ||
                                 input.toLowerCase().includes("social") ||
                                 input.toLowerCase().includes("sentiment") ||
                                 input.toLowerCase().includes("market") ||
                                 input.toLowerCase().includes("price") ||
                                 input.toLowerCase().includes("sol") || // Quick check for common symbols
                                 input.toLowerCase().includes("solana");

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

          let dataArray = Array.isArray(trendmoonData) ? trendmoonData :
                         (trendmoonData.data && Array.isArray(trendmoonData.data) ? trendmoonData.data : null);

          if (!dataArray || dataArray.length === 0) {
            console.error("Unexpected or empty API response format. Cannot generate summary.");
            // Attempt to return raw data if structure is unknown but not empty
            return trendmoonData ? JSON.stringify(trendmoonData) : "Error: Received empty or invalid data from Trendmoon API.";
          }

          // Filter data (ensure properties exist, provide defaults/null if necessary)
           const filteredData = dataArray.map((dp: { date?: string; price?: number; market_cap?: number; sentiment_score?: number; social_mentions?: number; [key: string]: any }) => ({
                date: dp.date || "N/A",
                price: dp.price, // Keep price (will be null/undefined if not provided)
                market_cap: dp.market_cap, // Keep market_cap (will be null/undefined if not provided)
                sentiment_score: dp.sentiment_score, // Keep sentiment
                social_mentions: dp.social_mentions // Keep mentions
           // Filter out other fields for the LLM prompt
           })).filter((dp: { date: string; price?: number; market_cap?: number; sentiment_score?: number; social_mentions?: number }) => dp.date !== "N/A"); // Remove entries without a date; Add type here

            if (filteredData.length === 0) {
                 return "Error: No valid data points found after filtering Trendmoon API response.";
            }


          // Construct the prompt for direct OpenAI call
          const combinedPrompt = `
Original User Query: "${input}"

You have been provided with the following time-series data for ${symbolFromInput} from ${filteredData[filteredData.length - 1]?.date || 'start'} to ${filteredData[0]?.date || 'end'}:
${JSON.stringify(filteredData, null, 2)}

**Your Task:**
Based *only* on the data provided above and the user's original query, generate a SINGLE, concise summary PARAGRAPH.

**Critically Important Output Instructions:**
1.  Analyze the data internally to understand the overall trends from the beginning to the end of the period. Note the starting and ending price if available.
2.  Focus SOLELY on synthesizing these trends into a short narrative paragraph. Describe the general price movement (e.g., overall increase/decrease, volatility from start to end) and the corresponding social sentiment trend (e.g., improving/declining, relationship to price). Address the specific focus mentioned in the user's original query if applicable (e.g., "focus on price movement").
3.  Your entire output MUST be JUST this single summary paragraph.
4.  **DO NOT** list, itemize, or reproduce ANY daily data points (prices, scores, mentions, dates) in your response. No headers, no bullet points, no lists. Just the narrative paragraph.

Example of CORRECT output structure:
"Over the observed period [mention start/end dates if possible], ${symbolFromInput} experienced [describe overall price trend - e.g., significant volatility, a net decrease/increase] starting around [start price, if available] and ending near [end price, if available]. Social sentiment [describe overall sentiment trend - e.g., generally mirrored the price movement, remained positive despite price drops, declined alongside price] suggesting [interpret the relationship - e.g., waning/growing community interest, detachment from price action]."

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

        // Find the appropriate tool based on keywords if not alerts or social trend
        let toolToUse: any = null;
        let params: any = {};

        // Skip alerts tool - we handle it separately above
        if (input.toLowerCase().includes("message") || input.toLowerCase().includes("metrics")) {
             toolToUse = availableTools.find((tool: any) => 
               tool.name === "trendmoon_get_messages_metrics" && 
               tool.name !== "trendmoon_get_top_alerts_today"
             );
        } else if (input.toLowerCase().includes("platform")) {
             toolToUse = availableTools.find((tool: any) => 
               tool.name === "trendmoon_get_platforms" && 
               tool.name !== "trendmoon_get_top_alerts_today"
             );
        } else if (input.toLowerCase().includes("coin")) {
             toolToUse = availableTools.find((tool: any) => 
               tool.name === "trendmoon_get_coins" && 
               tool.name !== "trendmoon_get_top_alerts_today"
             );
        }

        if (toolToUse) {
          console.log(`Using mock server for tool: ${toolToUse.name}`);
          return this.executeToolRequest(toolToUse, params);
        } else {
          console.log("No specific tool matched the input. Returning MCP manifest.");
          return JSON.stringify(mcpManifest);
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