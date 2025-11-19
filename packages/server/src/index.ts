#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { WebSocketServer, WebSocket } from "ws";
import TurndownService from "turndown";

const turndownService = new TurndownService();

// --- WebSocket Server for Extension Communication ---
const WS_PORT = 18080;
const wss = new WebSocketServer({ port: WS_PORT });

let activeConnection: WebSocket | null = null;
let messageIdCounter = 0;
const pendingRequests = new Map<number, { resolve: (data: any) => void; reject: (err: any) => void }>();

console.error(`[MCP Server] WebSocket server started on port ${WS_PORT}`);

wss.on("connection", (ws) => {
  console.error("[MCP Server] Extension connected");
  activeConnection = ws;

  ws.on("message", (data) => {
    try {
      const response = JSON.parse(data.toString());
      if (response.id !== undefined && pendingRequests.has(response.id)) {
        const { resolve, reject } = pendingRequests.get(response.id)!;
        pendingRequests.delete(response.id);
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response.result);
        }
      }
    } catch (err) {
      console.error("[MCP Server] Error parsing message:", err);
    }
  });

  ws.on("close", () => {
    console.error("[MCP Server] Extension disconnected");
    if (activeConnection === ws) {
      activeConnection = null;
    }
  });
});

async function sendToExtension(method: string, params: any): Promise<any> {
  // Wait for connection if not active
  if (!activeConnection) {
    console.error("[MCP Server] Waiting for extension connection...");
    await new Promise<void>((resolve) => {
      const checkInterval = setInterval(() => {
        if (activeConnection) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
      // Timeout for connection wait (e.g. 10s)
      setTimeout(() => {
          clearInterval(checkInterval);
          // Don't reject here, let the next check fail if still null, or handle it.
          // But we need to stop waiting.
          resolve(); 
      }, 15000);
    });
  }

  if (!activeConnection) {
    throw new Error("No browser extension connected. Please open the Browser MCP extension and click Connect.");
  }

  const id = ++messageIdCounter;
  return new Promise((resolve, reject) => {
    pendingRequests.set(id, { resolve, reject });
    activeConnection!.send(JSON.stringify({ id, method, params }));
    
    // Timeout after 30 seconds
    setTimeout(() => {
      if (pendingRequests.has(id)) {
        pendingRequests.delete(id);
        reject(new Error("Request to browser extension timed out"));
      }
    }, 30000);
  });
}

// --- MCP Server Setup ---

const server = new Server(
  {
    name: "browser-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "navigate",
        description: "Navigate to a URL",
        inputSchema: {
          type: "object",
          properties: {
            url: { type: "string" },
          },
          required: ["url"],
        },
      },
      {
        name: "get_content",
        description: "Get page content",
        inputSchema: {
          type: "object",
          properties: {
            format: { type: "string", enum: ["markdown", "html", "text"], default: "markdown" },
          },
        },
      },
      {
        name: "click",
        description: "Click an element",
        inputSchema: {
          type: "object",
          properties: {
            selector: { type: "string" },
          },
          required: ["selector"],
        },
      },
      {
        name: "type",
        description: "Type text into an element",
        inputSchema: {
          type: "object",
          properties: {
            selector: { type: "string" },
            text: { type: "string" },
          },
          required: ["selector", "text"],
        },
      },
      {
        name: "scroll",
        description: "Scroll the page",
        inputSchema: {
          type: "object",
          properties: {
            direction: { type: "string", enum: ["up", "down", "top", "bottom"], default: "down" },
            amount: { type: "number" },
          },
        },
      },
      {
        name: "screenshot",
        description: "Take a screenshot",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "evaluate",
        description: "Evaluate JavaScript",
        inputSchema: {
          type: "object",
          properties: {
            script: { type: "string" },
          },
          required: ["script"],
        },
      },
      {
        name: "get_console_logs",
        description: "Get console logs",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  if (name === "navigate") {
    const { url } = args as any;
    await sendToExtension("navigate", { url });
    return { content: [{ type: "text", text: `Navigated to ${url}` }] };
  }
  
  if (name === "get_content") {
    const { format } = args as any || { format: "markdown" };
    const html = await sendToExtension("get_content", {});
    
    if (format === "html") return { content: [{ type: "text", text: html }] };
    if (format === "text") return { content: [{ type: "text", text: "Text mode not implemented" }] }; // Simple fallback
    
    const markdown = turndownService.turndown(html);
    return { content: [{ type: "text", text: markdown }] };
  }

  if (name === "click") {
    const { selector } = args as any;
    await sendToExtension("click", { selector });
    return { content: [{ type: "text", text: `Clicked ${selector}` }] };
  }

  if (name === "type") {
    const { selector, text } = args as any;
    await sendToExtension("type", { selector, text });
    return { content: [{ type: "text", text: `Typed "${text}"` }] };
  }

  if (name === "scroll") {
    const { direction, amount } = args as any;
    await sendToExtension("scroll", { direction, amount });
    return { content: [{ type: "text", text: `Scrolled ${direction}` }] };
  }

  if (name === "screenshot") {
    const base64 = await sendToExtension("screenshot", {});
    return { content: [{ type: "image", data: base64, mimeType: "image/png" }] };
  }

  if (name === "evaluate") {
    const { script } = args as any;
    const result = await sendToExtension("evaluate", { script });
    return { content: [{ type: "text", text: String(result) }] };
  }
  
  if (name === "get_console_logs") {
    const logs = await sendToExtension("get_console_logs", {});
    return { content: [{ type: "text", text: JSON.stringify(logs) }] };
  }

  throw new Error(`Unknown tool: ${name}`);
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[MCP Server] MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
