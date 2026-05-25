import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Shim paths for Node.js built-ins pulled in by @anthropic-ai/sdk's server-only agent toolset.
const shimDir = path.resolve(__dirname, 'src/lib/shims');

export default defineConfig({
  plugins: [react()],
  base: '/ScheduleWhen/',
  resolve: {
    alias: {
      'node:crypto':          path.join(shimDir, 'node-crypto.ts'),
      'node:fs/promises':     path.join(shimDir, 'node-fs.ts'),
      'node:fs':              path.join(shimDir, 'node-fs.ts'),
      'node:path':            path.join(shimDir, 'node-path.ts'),
      'node:child_process':   path.join(shimDir, 'node-all.ts'),
      'node:util':            path.join(shimDir, 'node-all.ts'),
      'node:stream/promises': path.join(shimDir, 'node-all.ts'),
      'node:stream':          path.join(shimDir, 'node-all.ts'),
      'node:os':              path.join(shimDir, 'node-all.ts'),
      'node:buffer':          path.join(shimDir, 'node-all.ts'),
      'node:events':          path.join(shimDir, 'node-all.ts'),
      'node:url':             path.join(shimDir, 'node-all.ts'),
      'node:net':             path.join(shimDir, 'node-all.ts'),
      'node:tls':             path.join(shimDir, 'node-all.ts'),
      'node:http':            path.join(shimDir, 'node-all.ts'),
      'node:https':           path.join(shimDir, 'node-all.ts'),
    },
  },
})
