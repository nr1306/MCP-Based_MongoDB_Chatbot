// import fetch from "node-fetch";

// global.fetch = fetch;

import readlineSync from "readline-sync";
import { config } from "dotenv";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { GoogleGenAI } from "@google/genai";

// Load environment variables
config();

// Initialize the Google Generative AI with your API key
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error(
    "Error: Gemini API key not found. Please add it to your .env file."
  );
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

let tools = [];
let chatHistory = [];

const mcpClient = new Client({
  name: "mongodb-gemini-chatbot",
  version: "1.0.0",
});

// Try to connect to MCP server with better error handling
mcpClient
  .connect(new SSEClientTransport(new URL("http://localhost:3001/sse")))
  .then(async () => {
    console.log("Connected to MCP server");

    const toolsList = await mcpClient.listTools();
    tools = toolsList.tools.map((tool) => {
      const cleanProperties = {};
      for (const [key, value] of Object.entries(
        tool.inputSchema.properties || {}
      )) {
        cleanProperties[key] = {
          description: value.description || "",
          type: value.type || "string",
        };
        if (value.properties) {
          const nestedProperties = {};
          for (const [nestedKey, nestedValue] of Object.entries(
            value.properties
          )) {
            nestedProperties[nestedKey] = {
              description: nestedValue.description || "",
              type: nestedValue.type || "string",
            };
          }
          cleanProperties[key].properties = nestedProperties;
        }
        if (value.items) {
          cleanProperties[key].items = {
            type: value.items.type || "string",
          };
        }
      }

      return {
        name: tool.name,
        description: tool.description,
        parameters: {
          type: tool.inputSchema.type,
          properties: cleanProperties,
          required: tool.inputSchema.required || [],
        },
      };
    });

    console.log("Available tools:", tools.map((tool) => tool.name).join(", "));
    startChat().catch((error) => {
      console.error("Fatal error:", error);
      process.exit(1);
    });
  })
  .catch((error) => {
    console.error("Error connecting to MCP server:", error.message);
    process.exit(1);
  });

// Configure the model - using the current model name format

// Function to send message to Gemini API and get response
async function askGemini() {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: chatHistory,
      config: {
        tools: [
          {
            functionDeclarations: tools,
          },
        ],
      },
    });
    const functionCall = response.candidates[0].content.parts[0].functionCall;

    if (functionCall) {
      // console.log('Function call detected:', functionCall.name, functionCall.args);
      const toolResponse = await mcpClient.callTool({
        name: functionCall.name,
        arguments: functionCall.args,
      });
      // console.log('Tool response:', toolResponse.content[0].text);

      if (toolResponse.content[1]) {
        // console.log('Tool response:', toolResponse.content[1].text);
        return toolResponse.content[1].text;
      }

      return toolResponse.content[0].text;
    }

    return response.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error("Error communicating with Gemini API:", error);
    return "Sorry, I encountered an error while processing your request.";
  }
}

// Main chat loop
async function startChat() {
  console.log("\n===================================");
  console.log("🤖 Terminal Chatbot with Gemini AI");
  console.log("===================================");
  console.log('Type "exit" or "quit" to end the conversation.\n');

  while (true) {
    const userInput = readlineSync.question("\nYou: ");

    // Add user input to chat history
    chatHistory.push({ role: "user", parts: [{ text: userInput }] });

    // Check if user wants to exit
    if (["exit", "quit"].includes(userInput.toLowerCase())) {
      console.log("\nGoodbye! 👋");
      break;
    }

    console.log("\nAI is thinking...");

    // Get AI response
    const aiResponse = await askGemini();

    // Add AI response to chat history
    chatHistory.push({ role: "model", parts: [{ text: aiResponse }] });

    // Display AI response
    console.log("\nAI:", aiResponse);
  }
}
// Chat will start after MCP connection is establishedrocess.exit(1);
