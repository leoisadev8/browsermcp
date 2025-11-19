import { defineBackground } from 'wxt/sandbox';

export default defineBackground(() => {
  console.log('Universal Browser MCP Background Initialized');

  let socket: WebSocket | null = null;
  let reconnectInterval: Timer | null = null;
  const WS_URL = 'ws://localhost:18080';

  function connect() {
    if (socket) return;

    console.log('Connecting to MCP Server...');
    socket = new WebSocket(WS_URL);

    socket.onopen = () => {
      console.log('Connected to MCP Server');
      if (reconnectInterval) {
        clearInterval(reconnectInterval);
        reconnectInterval = null;
      }
      // Send initial handshake or status?
    };

    socket.onmessage = async (event) => {
      try {
        const message = JSON.parse(event.data as string);
        handleMessage(message);
      } catch (error) {
        console.error('Failed to parse message:', error);
      }
    };

    socket.onclose = () => {
      console.log('Disconnected from MCP Server');
      socket = null;
      // Try to reconnect
      if (!reconnectInterval) {
        reconnectInterval = setInterval(connect, 5000);
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      socket?.close();
    };
  }

  async function handleMessage(message: any) {
    const { id, method, params } = message;
    let result;
    let error;

    try {
      switch (method) {
        case 'navigate':
          await navigate(params.url);
          result = { success: true };
          break;
        case 'get_content':
          result = await getContent();
          break;
        case 'click':
          await clickElement(params.selector);
          result = { success: true };
          break;
        case 'type':
          await typeText(params.selector, params.text);
          result = { success: true };
          break;
        case 'scroll':
          await scrollPage(params.direction, params.amount);
          result = { success: true };
          break;
        case 'screenshot':
          result = await takeScreenshot();
          break;
        case 'evaluate':
            result = await evaluateScript(params.script);
            break;
        case 'get_console_logs':
            result = ["Console logs not implemented in extension yet"]; // TODO
            break;
        default:
          error = `Unknown method: ${method}`;
      }
    } catch (e: any) {
      error = e.message || String(e);
    }

    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ id, result, error }));
    }
  }

  // --- Action Implementations ---

  async function getActiveTabId() {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    if (tabs.length === 0) throw new Error("No active tab");
    return tabs[0].id!;
  }

  async function navigate(url: string) {
    const tabId = await getActiveTabId();
    await browser.tabs.update(tabId, { url });
    // Wait for load?
    return new Promise<void>((resolve) => {
        const listener = (updatedTabId: number, changeInfo: any) => {
            if (updatedTabId === tabId && changeInfo.status === 'complete') {
                browser.tabs.onUpdated.removeListener(listener);
                resolve();
            }
        };
        browser.tabs.onUpdated.addListener(listener);
        // Timeout fallback
        setTimeout(() => {
             browser.tabs.onUpdated.removeListener(listener);
             resolve(); 
        }, 10000);
    });
  }

  async function getContent() {
    const tabId = await getActiveTabId();
    const results = await browser.scripting.executeScript({
      target: { tabId },
      func: () => document.documentElement.outerHTML,
    });
    return results[0].result;
  }

  async function clickElement(selector: string) {
    const tabId = await getActiveTabId();
    await browser.scripting.executeScript({
      target: { tabId },
      func: (sel) => {
        const el = document.querySelector(sel) as HTMLElement;
        if (el) el.click();
        else throw new Error(`Element not found: ${sel}`);
      },
      args: [selector],
    });
  }

  async function typeText(selector: string, text: string) {
    const tabId = await getActiveTabId();
    await browser.scripting.executeScript({
      target: { tabId },
      func: (sel, txt) => {
        const el = document.querySelector(sel) as HTMLInputElement;
        if (el) {
            el.focus();
            el.value = txt;
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
        } else throw new Error(`Element not found: ${sel}`);
      },
      args: [selector, text],
    });
  }

  async function scrollPage(direction: string, amount: number = 500) {
    const tabId = await getActiveTabId();
    await browser.scripting.executeScript({
      target: { tabId },
      func: (dir, amt) => {
        if (dir === 'up') window.scrollBy(0, -amt);
        else if (dir === 'down') window.scrollBy(0, amt);
        else if (dir === 'top') window.scrollTo(0, 0);
        else if (dir === 'bottom') window.scrollTo(0, document.body.scrollHeight);
      },
      args: [direction, amount],
    });
  }

  async function takeScreenshot() {
    // browser.tabs.captureVisibleTab defaults to active tab in current window
    return await browser.tabs.captureVisibleTab(undefined, { format: 'png' });
  }

  async function evaluateScript(script: string) {
      const tabId = await getActiveTabId();
      const results = await browser.scripting.executeScript({
          target: { tabId },
          func: (code) => {
              // Use new Function to evaluate in the page context? 
              // executeScript runs in isolated world. 
              // To run in main world we need 'world: "MAIN"'.
              // But 'world' option might not be in types yet? It is in MV3.
              // Let's try standard isolated eval first.
              try {
                  // eslint-disable-next-line no-new-func
                  return new Function(`return (${code})`)();
              } catch(e) {
                  return String(e);
              }
          },
          args: [script]
      });
      return results[0].result;
  }

  // Start connection
  connect();
});
