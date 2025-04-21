import { DynamicTool } from "langchain/tools";
import fetch from "node-fetch";

interface CreateToolFromMCPOptions {
  mcpUrl: string;
}

interface MCPTool {
  name: string;
  description: string;
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
