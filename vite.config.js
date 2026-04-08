import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const arkKey = env.AI_API_KEY || env.VITE_AI_API_KEY || ''
  const moonshotKey = env.MOONSHOT_API_KEY || env.AI_API_KEY || env.VITE_AI_API_KEY || ''
  const adaBase = env.ADA_API_BASE || ''
  const adaKey = env.ADA_API_KEY || env.AI_API_KEY || env.VITE_AI_API_KEY || ''
  const adaPath = env.ADA_PROXY_PATH || '/v1/messages'

  const proxy = {
    '/api/ai-proxy/chat': {
      target: 'https://ark.cn-beijing.volces.com',
      changeOrigin: true,
      rewrite: () => '/api/v3/chat/completions',
      configure: (proxyInst) => {
        proxyInst.on('proxyReq', (proxyReq) => {
          if (arkKey) {
            proxyReq.setHeader('Authorization', `Bearer ${arkKey}`)
          }
        })
      },
    },
    '/api/kimi-proxy/chat': {
      target: 'https://api.moonshot.cn',
      changeOrigin: true,
      rewrite: () => '/v1/chat/completions',
      configure: (proxyInst) => {
        proxyInst.on('proxyReq', (proxyReq) => {
          if (moonshotKey) {
            proxyReq.setHeader('Authorization', `Bearer ${moonshotKey}`)
          }
        })
      },
    },
  }

  if (adaBase) {
    proxy['/api/ada-proxy/chat'] = {
      target: adaBase,
      changeOrigin: true,
      rewrite: () => adaPath,
      configure: (proxy) => {
        proxy.on('proxyReq', (proxyReq) => {
          if (adaKey) {
            proxyReq.setHeader('Authorization', `Bearer ${adaKey}`);
            proxyReq.setHeader('x-api-key', adaKey);
            proxyReq.setHeader('anthropic-version', '2023-06-01');
          }
        });
        proxy.on('proxyRes', (proxyRes) => {
          // Ensure streaming works by setting proper headers
          proxyRes.headers['x-proxied-by'] = 'vite-development-server';
        });
      },
      // Enable streaming support
      selfHandleResponse: false,
    }
  }

  return {
    plugins: [react()],
    base: './',
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },
    server: {
      port: 5173,
      open: true,
      proxy,
    },
  }
})