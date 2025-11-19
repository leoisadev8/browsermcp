# Browser MCP

Connect your AI agent (Claude, Cursor) to your **real** web browser.

[**📥 Install Extension**](https://github.com/leoisadev8/browsermcp/releases/latest/download/extension.zip) | [**📦 NPM Package**](https://www.npmjs.com/package/@gl1tchblade/browsermcp)

![Browser MCP Demo](https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbzZ4eXh4eXh4eXh4eXh4eXh4eXh4eXh4eXh4eXh4eXh4eCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/example.gif)

## Why?

Most AI browser tools start a headless browser you can't see or control. **Browser MCP** connects to your existing Chrome instance, giving the AI access to:
*   ✅ Your logged-in sessions (GitHub, Gmail, etc.)
*   ✅ Your cookies and history
*   ✅ A browser you can watch and interrupt

## Quick Setup

### 1. Install the Chrome Extension
1.  Download the latest [extension.zip](https://github.com/leoisadev8/browsermcp/releases/latest/download/extension.zip).
2.  Unzip it.
3.  Go to `chrome://extensions`.
4.  Enable **Developer Mode** (top right).
5.  Click **Load Unpacked** and select the folder.

### 2. Configure your AI

**For Claude Desktop:**
Add this to your `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "browser": {
      "command": "npx",
      "args": ["-y", "@gl1tchblade/browsermcp"]
    }
  }
}
```

**For Cursor:**
Go to **Settings > Features > MCP Servers** and add:
*   **Name:** `browser`
*   **Type:** `command`
*   **Command:** `npx -y @gl1tchblade/browsermcp`

### 3. Connect
1.  Restart your AI (Claude/Cursor).
2.  Click the **Browser MCP** extension icon in Chrome.
3.  Ensure it says **"Connected"**.

## Usage

Just ask your AI:
> "Go to github.com/leoisadev8/browsermcp and give me a summary."
> "Take a screenshot of the current page."
> "Click the 'Issues' tab."

## Troubleshooting

*   **"Connection Failed"**: Make sure the AI is running the server (step 2) before you click Connect in Chrome.
*   **"No Active Tab"**: The AI controls the currently visible tab.

## Development

```bash
# Install dependencies
bun install

# Run server dev mode
bun run dev:server

# Run extension dev mode (auto-reloads Chrome)
bun run dev:ext
```

## License

MIT

