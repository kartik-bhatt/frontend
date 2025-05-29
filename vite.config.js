// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['ttsdashboard.com', 'localhost', '0.0.0.0','44.212.6.252'],           // Allow all hosts
    host: true,        // or use '0.0.0.0'
    port: 5173,


    // or your preferred port
  }
});
