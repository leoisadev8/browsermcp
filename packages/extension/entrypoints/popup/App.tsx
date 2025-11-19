import React, { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    checkStatus();
    
    // Listen for status updates from background
    const listener = (message: any) => {
      if (message.type === 'STATUS_UPDATE') {
        setConnected(message.connected);
      }
    };
    
    // WXT browser polyfill
    browser.runtime.onMessage.addListener(listener);
    return () => browser.runtime.onMessage.removeListener(listener);
  }, []);

  const checkStatus = async () => {
    const response = await browser.runtime.sendMessage({ type: 'GET_STATUS' });
    setConnected(response.connected);
  };

  const toggleConnection = async () => {
    if (connected) {
      await browser.runtime.sendMessage({ type: 'DISCONNECT' });
    } else {
      await browser.runtime.sendMessage({ type: 'CONNECT' });
    }
    checkStatus();
  };

  return (
    <div className="container">
      <div className="header">
        <h1>Browser MCP</h1>
        <div className={`status-badge ${connected ? 'active' : 'inactive'}`}>
          {connected ? 'Connected' : 'Disconnected'}
        </div>
      </div>
      
      <div className="content">
        <div className="info-box">
          <p><strong>Status:</strong> {connected ? '🟢 Agent Active' : '🔴 Disconnected'}</p>
          <p><strong>Server:</strong> <code>ws://localhost:18080</code></p>
        </div>

        <button 
          onClick={toggleConnection} 
          className={`connect-btn ${connected ? 'disconnect' : 'connect'}`}
        >
          {connected ? 'Disconnect' : 'Connect'}
        </button>

        <p className="help-text">
          1. Run <code>npx -y @gl1tchblade/browsermcp</code><br/>
          2. Click Connect above
        </p>
      </div>
    </div>
  );
}

export default App;
