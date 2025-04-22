import http from 'http';
import dayjs from 'dayjs';

const PORT = process.env.PORT || 3000;  // Use Railway's PORT env var, fallback to 3000 for local dev

// Mock response data 
const mockResponse = {
  name: "Mock MCP Server",
  version: "1.0.0",
  tools: [
    {
      name: "trendmoon_get_social_trend",
      description: "Get comprehensive social trend data for a cryptocurrency symbol. The data includes:\n" +
        "1. Social Metrics: mentions count, social dominance %, engagement levels\n" +
        "2. Price Data: current price, price changes, market cap\n" +
        "3. Sentiment Indicators: sentiment score (0-100), galaxy score\n" +
        "4. Volume Analysis: trading volume, volume changes\n\n" +
        "Use this to analyze:\n" +
        "- Trend direction: Are social metrics increasing/decreasing?\n" +
        "- Correlation: How do social metrics align with price/volume?\n" +
        "- Sentiment shifts: Has the community sentiment changed?\n" +
        "- Volume confirmation: Do volume changes support the trend?",
      parameters: {
        type: "object",
        properties: {
          symbol: {
            type: "string",
            description: "The cryptocurrency symbol to fetch trend data for (e.g., BTC, ETH, SOL)"
          },
          date_interval: {
            type: "number",
            description: "Number of days of historical data to analyze (default: 15)"
          },
          time_interval: {
            type: "string",
            description: "Time interval for data points (e.g., 1d for daily data)"
          }
        },
        required: ["symbol"]
      }
    },
    {
      name: "trendmoon_get_top_alerts_today",
      description: "Fetches today's most significant cryptocurrency market alerts from Trendmoon. Alerts include:\n" +
        "1. Unusual Social Activity: Sudden spikes in mentions or engagement\n" +
        "2. Sentiment Shifts: Major changes in community sentiment\n" +
        "3. Volume Anomalies: Unusual trading volume patterns\n" +
        "4. Price Movements: Significant price changes\n\n" +
        "Use this to identify:\n" +
        "- Emerging trends before they become obvious\n" +
        "- Potential market opportunities\n" +
        "- Risk factors and warning signs\n" +
        "- Market sentiment shifts",
      parameters: {
        type: "object",
        properties: {},
        required: [] // No parameters needed
      }
    }
  ]
};

const server = http.createServer((req, res) => {
   console.log(`Received request: ${req.method} ${req.url}`);
   
   // Set CORS headers
   res.setHeader('Access-Control-Allow-Origin', '*');
   res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
   res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Api-key');
   
   // Handle preflight requests
   if (req.method === 'OPTIONS') {
     res.writeHead(204);
     res.end();
     return;
   }
   
   // Handle GET requests to both root and AI plugin endpoint
   if (req.method === 'GET' && (req.url === '/' || req.url === '/.well-known/ai-plugin.json')) {
     res.writeHead(200, { 'Content-Type': 'application/json' });
     res.end(JSON.stringify(mockResponse));
     return;
   }
   
   // All other requests should go to the real API
   res.writeHead(404, { 'Content-Type': 'text/plain' });
   res.end('Not Found - Please use the real Trendmoon API endpoint');
});

server.listen(PORT, () => {
  console.log(`Mock MCP server running at http://localhost:${PORT}/.well-known/ai-plugin.json`);
});