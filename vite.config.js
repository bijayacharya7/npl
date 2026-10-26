import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { cricketdataDevPlugin } from './src/vite-plugin-cricketdata.js'

export default defineConfig(({ mode }) => {
  // Load private server variables (for example CRICKETDATA_API_KEY) into the
  // Node process for the dev API plugin. These values are never exposed via
  // import.meta.env or injected into the client bundle.
  const serverEnv = loadEnv(mode, process.cwd(), '')
  for (const [key, value] of Object.entries(serverEnv)) {
    if (process.env[key] === undefined) process.env[key] = value
  }

  return {
    plugins: [react(), cricketdataDevPlugin()],
    server: {
      port: 5173,
    },
    build: {
      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: [
              { name: 'supabase-vendor', test: /node_modules[\\/]@supabase[\\/]/, priority: 20 },
              { name: 'react-vendor', test: /node_modules[\\/](react|react-dom|react-router-dom|scheduler)[\\/]/, priority: 15 },
              { name: 'vendor', test: /node_modules[\\/]/, priority: 10 },
            ],
          },
        },
      },
    },
    test: {
      environment: 'node',
      include: ['src/**/*.test.js'],
    },
  }
})
