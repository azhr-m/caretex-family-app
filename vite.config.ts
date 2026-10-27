import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { PUSH_BODIES } from './src/lib/pushBodies'

const PUBLIC_SHELL = ['/index.html', '/manifest.webmanifest', '/favicon.svg', '/icons/icon-192.png', '/icons/icon-512.png']

/** Emits /sw.js from pwa/sw.js with the precache list (app shell only) and a version from its hash. */
function appServiceWorker(): Plugin {
  return {
    name: 'caretex-app-service-worker',
    apply: 'build',
    generateBundle(_, bundle) {
      const built = Object.keys(bundle)
        .filter((f) => /\.(js|css)$/.test(f) || /-(latin|hebrew)-\d+-normal-.*\.woff2$/.test(f))
        .map((f) => `/${f}`)
      const precache = [...PUBLIC_SHELL, ...built].sort()
      const version = createHash('sha256').update(precache.join('\n')).digest('hex').slice(0, 12)
      const template = readFileSync(new URL('./pwa/sw.js', import.meta.url), 'utf8')
      const source = template
        .slice(template.indexOf('\n') + 1) // drops the eslint globals line
        .replace('__PRECACHE__', JSON.stringify(precache))
        .replace('${__VERSION__}', version)
        .replaceAll('__PUSH_BODIES__', JSON.stringify(PUSH_BODIES))
      this.emitFile({ type: 'asset', fileName: 'sw.js', source })
    },
  }
}

export default defineConfig({
  plugins: [tanstackRouter({ target: 'react', autoCodeSplitting: true }), react(), tailwindcss(), appServiceWorker()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: { port: 5175 },
})
