import http from 'http';
import dayjs from 'dayjs';

const PORT = process.env.PORT || 8080;

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

const mockToolResponses = {
  trendmoon_get_social_trend: (params) => {
    const { symbol } = params;
    if (!symbol) {
      throw new Error("Symbol is required");
    }

    // Generate 15 days of mock data
    const data = [];
    for (let i = 0; i < 15; i++) {
      const date = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
      data.push({
        date,
        social_mentions: Math.floor(Math.random() * 1000) + 100,
        social_dominance: (Math.random() * 0.2).toFixed(4),
        sentiment_score: (80 + Math.random() * 10).toFixed(2),
        galaxy_score: (60 + Math.random() * 20).toFixed(2),
        price: (100 + Math.random() * 50).toFixed(2),
        market_cap: (50000000000 + Math.random() * 10000000000).toFixed(0),
        total_volume: (2000000000 + Math.random() * 1000000000).toFixed(0),
        hour_social_perc_diff: (Math.random() * 20 - 10).toFixed(2),
        day_social_perc_diff: (Math.random() * 40 - 20).toFixed(2)
      });
    }

    return data;
  },
  // Add mock handlers here for other tools if they are defined and needed for testing:
  // trendmoon_get_messages_metrics: (params) => { ... },
  // trendmoon_get_platforms: (params) => { ... },
  // trendmoon_get_coins: (params) => { ... },
};

const server = http.createServer((req, res) => {
   console.log(`Received request: ${req.method} ${req.url}`);
   
   // Set CORS headers
   res.setHeader('Access-Control-Allow-Origin', '*');
   res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
   res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Api-key'); // Added Api-key
   
   // Handle preflight requests
   if (req.method === 'OPTIONS') {
     res.writeHead(204);
     res.end();
     return;
   }
   
   // Handle GET requests to the AI plugin endpoint
   if (req.method === 'GET' && (req.url === '/' || req.url === '/.well-known/ai-plugin.json')) {
     res.writeHead(200, { 'Content-Type': 'application/json' });
     res.end(JSON.stringify(mockResponse));
     return;
   }
   
   // Handle POST requests to tool endpoints
   if (req.method === 'POST' && req.url.startsWith('/tools/')) {
     const toolName = req.url.split('/tools/')[1];
     
     // Collect the request body for POST requests
     let body = '';
     req.on('data', chunk => {
       body += chunk.toString();
     });
     
     req.on('end', () => {
       let params = {};
       try {
         // Only parse if body is not empty
         if (body) {
             params = JSON.parse(body);
         }
       } catch (e) {
         console.error("Failed to parse request body:", body, e);
         // Don't necessarily fail, params will be {}
       }
       
       const toolHandler = mockToolResponses[toolName];
       
       if (toolHandler && typeof toolHandler === 'function') {
         try {
           const toolResult = toolHandler(params);
           res.writeHead(200, { 'Content-Type': 'application/json' });
           
           // Log the mock tool response
           console.log(`\n===== MOCK RESPONSE FOR ${toolName} =====`);
           console.log(JSON.stringify(toolResult, null, 2));
           console.log("=======================================\n");
           
           res.end(JSON.stringify(toolResult));
         } catch (handlerError) {
             console.error(`Error executing mock handler for ${toolName}:`, handlerError);
             res.writeHead(500, { 'Content-Type': 'text/plain' });
             res.end(`Internal server error executing tool handler for ${toolName}`);
         }
       } else {
         console.error(`Mock handler for tool ${toolName} not found or not a function.`);
         res.writeHead(404, { 'Content-Type': 'text/plain' });
         res.end(`Tool ${toolName} not found`);
       }
     });
     return;
   }
    





   // Handle all other requests
   res.writeHead(404, { 'Content-Type': 'text/plain' });
   res.end('Not Found'); // Corrected response
 }); // Removed the bad template literal
 
 server.listen(PORT, () => {
   console.log(`Mock MCP server running at http://localhost:${PORT}/.well-known/ai-plugin.json`);
 });