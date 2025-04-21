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
const PORT = process.env.PORT || 8000;


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
      modelName: "gpt-4",
      temperature: 1

    });

    // Use environment variable, fallback for local dev
    const MCP_SERVER_URL = process.env.MCP_SERVER_URL || "http://localhost:3001/.well-known/ai-plugin.json";
    
    console.log("MCP_SERVER_URL:", MCP_SERVER_URL);
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
    

    // --- Refinement Step using Direct LLM Call ---

    // 1. Construct the explicit refinement prompt
    const refinementPrompt = `
Original User Query: "${prompt}"

Previously Generated Summary:
"${result.output}"

Task: Please refine the 'Previously Generated Summary' based *only* on the 'Original User Query' and the summary itself. Ensure the final output is a single, concise paragraph analyzing the trends as requested in the original query, strictly adhering to the narrative format without lists or bullet points. Do not add any introductory phrases like "Here's the refined summary:". Just provide the refined paragraph.
`;

   


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






