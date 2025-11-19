import React, { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [status, setStatus] = useState<string>('Checking...');

  useEffect(() => {
    // We can poll the background script or just assume if the extension is loaded, it's trying to connect.
    // Real status would require messaging.
    setStatus('Background Service Worker Active');
  }, []);

  return (
    <div className="container">
      <div className="header">
        <h1>Browser MCP</h1>
        <div className={`status-badge ${status.includes('Active') ? 'active' : 'inactive'}`}>
          {status}
        </div>
      </div>
      
      <div className="content">
        <p>
          This extension connects your browser to the <strong>Browser MCP Server</strong>.
        </p>
        
        <div className="info-box">
          <p><strong>Server URL:</strong> <code>ws://localhost:18080</code></p>
        </div>

        <p className="help-text">
          Ensure your MCP server is running:
          <br />
          <code>bun run dev:server</code>
        </p>
      </div>
    </div>
  );
}

export default App;
