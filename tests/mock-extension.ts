import WebSocket from "ws";

const WS_URL = "ws://localhost:18080";

async function connect() {
  console.log("[Mock Ext] Connecting to", WS_URL);
  
  const ws = new WebSocket(WS_URL);

  ws.on("open", () => {
    console.log("[Mock Ext] Connected!");
  });

  ws.on("message", (data) => {
    const msg = JSON.parse(data.toString());
    console.log("[Mock Ext] Received:", msg);
    
    // Handle requests
    if (msg.method === "navigate") {
      console.log(`[Mock Ext] Navigating to ${msg.params.url}`);
      ws.send(JSON.stringify({
        id: msg.id,
        result: { success: true }
      }));
    } else if (msg.method === "get_content") {
        console.log(`[Mock Ext] Getting content`);
        ws.send(JSON.stringify({
            id: msg.id,
            result: "<html><body><h1>Mock Page Content</h1></body></html>"
        }));
    } else {
        // Generic success
        ws.send(JSON.stringify({
            id: msg.id,
            result: { success: true }
        }));
    }
  });

  ws.on("error", (err) => {
    // console.error("[Mock Ext] Connection error (retrying...):", err.message);
    setTimeout(connect, 100);
  });

  ws.on("close", () => {
    console.log("[Mock Ext] Disconnected");
    setTimeout(connect, 100);
  });
}

connect();
