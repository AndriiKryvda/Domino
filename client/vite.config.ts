import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function suppressEconnaborted() {
  return {
    name: 'suppress-econnaborted',
    configureServer(server: any) {
      // Patch Vite 5's WS logger to filter ECONNABORTED messages
      // In Vite 5, server.ws.log is a Vite logger instance with error/warn/info methods
      const wsLogger = server.ws?.log;
      if (!wsLogger) return;

      // Patch error() — this is where Vite logs 'ws proxy socket error'
      const originalError = wsLogger.error;
      if (originalError) {
        (wsLogger.error as any) = function (...args: any[]) {
          const msg = args[0];
          const err = args[1];
          // Check if this is an ECONNABORTED error
          if (typeof msg === 'string' && msg.includes('ECONNABORTED')) return;
          if (err && typeof err === 'object' && err.message && err.message.includes('ECONNABORTED')) return;
          if (err && typeof err === 'object' && err.code === 'ECONNABORTED') return;
          return originalError.apply(wsLogger, args);
        };
      }

      // Also patch warn() for safety
      const originalWarn = wsLogger.warn;
      if (originalWarn) {
        (wsLogger.warn as any) = function (...args: any[]) {
          const msg = args[0];
          const err = args[1];
          if (typeof msg === 'string' && msg.includes('ECONNABORTED')) return;
          if (err && typeof err === 'object' && err.message && err.message.includes('ECONNABORTED')) return;
          if (err && typeof err === 'object' && err.code === 'ECONNABORTED') return;
          return originalWarn.apply(wsLogger, args);
        };
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), suppressEconnaborted()],
  server: {
    port: 3001,
    hmr: {
      overlay: false,
    },
    proxy: {
      '/socket.io': {
        target: 'http://localhost:3002',
        ws: true,
        configure: (proxy) => {
          proxy.on('error', (err: NodeJS.ErrnoException) => {
            if (err.code === 'ECONNABORTED' || err.message?.includes('ECONNABORTED')) {
              return;
            }
            console.error('[vite] ws proxy error:', err);
          });
        },
      },
      '/api': {
        target: 'http://localhost:3002',
      },
    },
  },
  build: {
    outDir: 'dist',
  },
});
