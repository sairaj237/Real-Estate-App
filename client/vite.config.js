import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Forward all /api requests to the backend
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        // Keep the /api prefix when forwarding
      },
    },
  },
});
