import { defineConfig } from 'wxt';

export default defineConfig({
  manifest: {
    name: 'Browser MCP',
    description: 'Connects your browser to MCP servers for AI automation',
    version: '0.1.2',
    permissions: [
      'activeTab',
      'scripting',
      'tabs',
      'debugger',
      'storage'
    ],
    host_permissions: [
      '<all_urls>'
    ],
    action: {
      default_title: "Browser MCP"
    }
  },
  modules: ['@wxt-dev/module-react'],
});
