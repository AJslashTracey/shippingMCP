import { ChatOpenAI } from "@langchain/openai";
import { createToolFromMCP } from "./mcp-tool.js";
import { initializeAgentExecutorWithOptions } from "langchain/agents";
import * as dotenv from "dotenv";
import express, { Request, response, Response } from "express";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";

dotenv.config();

const app = express();
const systemMessage = new SystemMessage(`
Your ONLY task is to generate a single, concise summary paragraph that tells the most important market story.

Analyze the provided social trend data internally, focusing on these key aspects:
1. TEMPORAL PATTERNS: How metrics have changed over the time period (not just current values)
2. CORRELATION INSIGHTS: Relationships between price movements and social metrics
3. SENTIMENT SHIFTS: Changes in community sentiment and what they indicate
4. DIVERGENCES: When social metrics and price move in opposite directions
5. ANOMALIES: Unusual spikes or drops in any metrics and their potential significance

Your entire response MUST consist of ONLY the final summary paragraph, synthesizing the key trends into a narrative. ABSOLUTELY NO lists, bullet points, or itemized data.

Interpret the Galaxy Score (aggregate of social engagement, sentiment, and influence) as an overall indicator of social strength.

Important context: 
- Rising social mentions during price drops often indicate market concern
- Increasing sentiment during consolidation often precedes price movement
- Social dominance above 0.1% indicates significant market attention
- Sentiment scores above 60 generally reflect positive community outlook
- Sustained increases in Galaxy Score often correlate with upcoming price action

Remember, your value is NOT in reporting numbers but in extracting the meaningful story that connects these metrics


`);
  
let prompt = "";

// Use the PORT environment variable provided by Railway, defaulting to 5500 for local dev
const PORT = process.env.PORT || 5500;


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


console.log("MCP_SERVER_URL", process.env.MCP_SERVER_URL);


app.get("/:promt", async (req: Request, res: Response) => {
  prompt = req.params.promt;
  console.log("Got prompt");
  try {
    const llm = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: "gpt-4o",
      temperature: 1

    });

    // Use environment variable, fallback for local dev
    const MCP_SERVER_URL = process.env.MCP_SERVER_URL || "http://localhost:3000/.well-known/ai-plugin.json";
    
    console.log("Attempting to create tool with MCP URL:", MCP_SERVER_URL);
    const tools = await createToolFromMCP({
      mcpUrl: MCP_SERVER_URL,
    });

    const executor = await initializeAgentExecutorWithOptions(tools, llm, {
      agentType: "openai-functions",
      agentArgs: {
        systemMessage: systemMessage
      }
    });

    const result = await executor.call({
      input: prompt,
    });
    
    console.log("First Result",result);
    
   
    // 3. Use the refined output in the final response
    res.json({
      query: prompt,
      llmResponse: result, // Use the refined output
    });

    // --- End Refinement Step ---

  } catch (error: any) {
    res.status(500).json({
      error: error.message
    });
  }
});

function analyzeTimeWindows(data, windowSizes = ['1d', '7d', '30d']) {
  return windowSizes.map(window => {
    const windowData = sliceDataByWindow(data, window);
    return {
      window,
      stats: processTimeseriesData(windowData),
      patterns: identifyPatterns(windowData, window),
      significance: assessTimeframeSignificance(windowData)
    };
  });
}

function processTimeseriesData(data) {
  // Sort data chronologically
  const sortedData = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
  
  // Calculate key statistics
  const stats = {
    timeRange: {
      start: sortedData[0]?.date,
      end: sortedData[sortedData.length - 1]?.date,
      duration: sortedData.length
    },
    metrics: {}
  };

  // For each numeric metric
  Object.entries(sortedData[0] || {})
    .filter(([_, value]) => typeof value === 'number')
    .forEach(([metric]) => {
      const values = sortedData.map(d => d[metric]);
      
      // Calculate statistical measures
      stats.metrics[metric] = {
        min: Math.min(...values),
        max: Math.max(...values),
        avg: values.reduce((a, b) => a + b) / values.length,
        trend: calculateTrend(values),
        volatility: calculateVolatility(values)
      };
    });

  return stats;
}

 




