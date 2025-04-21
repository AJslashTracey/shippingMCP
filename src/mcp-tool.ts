import { DynamicTool } from "langchain/tools";
import fetch from "node-fetch";

interface CreateToolFromMCPOptions {
  mcpUrl: string;
}

interface MCPTool {
  /**
   * The name of the tool/endpoint
   * @example "trendmoon_get_social_trend"
   * @example "trendmoon_get_top_alerts_today"
   */
  name: string;
  /**
   * Detailed description of the tool's functionality, including:
   * - What the endpoint does
   * - What data it returns
   * - How to interpret the results
   * - Any important notes about usage
   * @example "Get comprehensive social trend data for a cryptocurrency symbol..."
   * @example {
   *   "Get Top Alerts Today": {
   *     "endpoint": "GET https://api.trendmoon.ai/get_top_alerts_today",
   *     "description": "Fetches today's most significant cryptocurrency market alerts with comprehensive metrics",
   *     "response_format": [
   *       {
   *         "category": "DeFi",
   *         "symbol": "TOKEN",
   *         "name": "Token Name",
   *         "score": "<float>",
   *         "technical_indicator_score": "<float>",
   *         "social_indicator_score": "<float>",
   *         "1_day_trend": "<integer>",
   *         "day_perc_diff": "<float>",
   *         "social_mentions": "<integer>",
   *         "mentions_ma": "<float>",
   *         "mentions_upper_band": "<float>",
   *         "price_momentum": "<float>",
   *         "price_pct_change": "<float>",
   *         "volume_pct_change": "<float>",
   *         "volume_ratio_20": "<float>",
   *         "total_volume": "<float>",
   *         "market_cap": "<float>",
   *         "fully_diluted_valuation": "<float>"
   *       }
   *     ],
   *     "response_fields": {
   *       "category": "The category to which the token belongs (e.g., DeFi, NFTs, Layer 1, etc.)",
   *       "symbol": "Ticker symbol of the token",
   *       "name": "Full name of the token",
   *       "score": "Overall score based on multiple factors including technical and social indicators",
   *       "technical_indicator_score": "Score from technical indicators (MACD, moving averages, price momentum)",
   *       "social_indicator_score": "Score from social metrics (mentions, dominance, social momentum)",
   *       "1_day_trend": "Relative trend ranking over the past 24 hours",
   *       "day_perc_diff": "Percentage change in price over the last 24 hours",
   *       "social_mentions": "Number of social media mentions in the given timeframe",
   *       "mentions_ma": "Moving average of social mentions over a predefined period",
   *       "mentions_upper_band": "Upper Bollinger Band for social mentions, indicating extreme interest",
   *       "price_momentum": "Momentum score as rate of price change over lookback period",
   *       "price_pct_change": "Percentage change in price over given period",
   *       "volume_pct_change": "Percentage change in trading volume over given period",
   *       "volume_ratio_20": "Ratio of current volume to 20-day moving average",
   *       "total_volume": "Total trading volume over selected timeframe",
   *       "market_cap": "Market capitalization of the token",
   *       "fully_diluted_valuation": "Fully diluted valuation based on max token supply"
   *     }
   *   }
   * }
   */
  description: string;
  /**
   * OpenAPI/Swagger style parameter definitions for the endpoint
   * @example {
   *   type: "object",
   *   properties: {
   *     symbol: { type: "string", description: "Cryptocurrency symbol" }
   *   },
   *   required: ["symbol"]
   * }
   */
  parameters: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
}

interface MCPResponse {
  name: string;
  version: string;
  tools: MCPTool[];
}

export async function createToolFromMCP({ mcpUrl }: CreateToolFromMCPOptions) {
  try {
    console.log(`Fetching MCP configuration from ${mcpUrl}...`);
    const response = await fetch(mcpUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const responseText = await response.text();
    console.log('Raw response:', responseText);
    
    const pluginJson = JSON.parse(responseText) as MCPResponse;
    console.log('Parsed response:', pluginJson);

    if (!pluginJson.tools || !Array.isArray(pluginJson.tools)) {
      throw new Error(`Invalid MCP response format: missing tools array. Received: ${JSON.stringify(pluginJson)}`);
    }

    const tools = pluginJson.tools.map((tool: MCPTool) => {
      console.log(`Creating tool: ${tool.name}`);
      return new DynamicTool({
        name: tool.name,
        description: tool.description,
        func: async (input: string) => {
          try {
            // For now, just return a mock response
            // In a real implementation, this would make an actual API call
            return JSON.stringify({
              status: "success",
              message: `Mock response for ${tool.name} with input: ${input}`,
              timestamp: new Date().toISOString()
            });
          } catch (error) {
            console.error(`Error in tool ${tool.name}:`, error);
            return `Error calling ${tool.name}: ${error}`;
          }
        },
      });
    });

    console.log(`Successfully created ${tools.length} tools`);
    return tools;
  } catch (error) {
    console.error("Error creating tools from MCP:", error);
    throw error;
  }
}
