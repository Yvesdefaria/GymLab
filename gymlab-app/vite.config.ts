/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

// Config de build: alias '@' → src, PWA offline-first y code-splitting de vendors.
// base '/': ABSOLUTA, imprescindible. Con base relativa ('./') el index.html referencia
// `./assets/index-*.js`, y en una ruta de DOS segmentos (`/entrenamiento/active`) eso
// resuelve a `/entrenamiento/assets/...` -> 404 del ENTRY -> la app no arranca y queda en
// pantalla negra. Rompía las 17 rutas multi-segmento en la app nativa: la sesión de
// entrenamiento, las 9 calculadoras y los detalles de rutinas/papers/guías/ejercicios.
// (El comentario original decía que hacía falta relativo por el WebView `file://`; con
// Capacitor 8 el WebView sirve desde `https://localhost`, así que lo absoluto es correcto.)
export default defineConfig({
  base: '/',
  test: {
    include: ['tests/unit/**/*.test.ts'],
  },
  plugins: [
    react(),
    tailwindcss(),
    /*
     * ───────────────────────────────────────────────────────────────────────────
     * PWA / SERVICE WORKER — POR QUÉ ESTÁ ACÁ Y CUÁNDO HAY QUE SACARLO
     * ───────────────────────────────────────────────────────────────────────────
     *
     * POR QUÉ EXISTE (único motivo):
     *   Es la única forma de PROBAR la app en iPhone hoy. No hay build de iOS (requiere
     *   macOS + Xcode) ni forma de distribuirla, así que se usa la PWA desde Safari:
     *   se abre la web, "Añadir a pantalla de inicio", y queda como app con su icono,
     *   su splash y el precache offline de Workbox. NO es un canal de distribución.
     *
     * EL PROBLEMA QUE TRAE (ya nos costó una pantalla negra):
     *   El service worker precachea el index.html. Al publicar un build nuevo, Vite
     *   rehashea los chunks lazy (`StepsPage-<hash>.js` cambia de nombre). El SW puede
     *   quedar sirviendo el index.html VIEJO, que apunta a chunks que ya no existen en
     *   disco: el `import()` dinámico falla con
     *     "Failed to fetch dynamically imported module: .../StepsPage-<hash>.js"
     *   y, al no capturarlo nadie, React desmonta el árbol COMPLETO y la app queda en
     *   PANTALLA NEGRA. Pasó en /suplementos y en /pasos.
     *
     * MITIGACIONES ACTUALES (si tocás el SW, NO las rompas):
     *   1. `src/main.tsx` escucha `vite:preloadError` y recarga UNA vez por sesión para
     *      traer HTML y chunks consistentes entre sí; si vuelve a fallar, deja propagar
     *      el error en vez de recargar en loop.
     *   2. `src/components/layout/AppErrorBoundary.tsx` captura cualquier excepción de
     *      render y muestra un mensaje recuperable en lugar de dejar la app en negro.
     *   Cubierto por dos e2e que corren contra el bundle de producción (en dev no
     *   reproducen, ver el docstring de cada test):
     *     python tests/e2e/scripts/with_server.py tests/e2e/test_preload_recovery.py --mode preview
     *     python tests/e2e/scripts/with_server.py tests/e2e/test_supplements_seed.py --mode preview
     *
     * ⚠️ TODO — QUITAR LA PWA CUANDO SE PUEDA PUBLICAR EN LA APP STORE:
     *   En cuanto la app se distribuya como app nativa por la App Store (y/o Play Store),
     *   este bloque pierde su única razón de ser y pasa a ser pura liability: en la app
     *   nativa los assets son LOCALES, así que el SW no aporta nada, el precache de ~100 MB
     *   solo ocupa espacio, y sigue siendo la causa raíz de las pantallas negras de arriba.
     *   Pasos, EN ESTE ORDEN (el orden importa):
     *     1) Poner `selfDestroying: true` y publicar UNA release. El plugin despliega un SW
     *        que se auto-desregistra y borra los caches (vite-plugin-pwa ≥0.17.2), así los
     *        dispositivos que ya tienen el SW viejo se limpian SOLOS. Si se saca el plugin
     *        de golpe, esos dispositivos se quedan con el SW viejo pegado para siempre.
     *     2) Sacar el plugin VitePWA de este archivo (con `includeAssets`, `manifest` y
     *        `workbox`), y quitar de `index.html` las referencias a `manifest.webmanifest`,
     *        `registerSW.js` y los iconos PWA.
     *     3) Verificar por CDP/DevTools que `navigator.serviceWorker.getRegistrations()`
     *        devuelve vacío y que `caches.keys()` ya no lista `workbox-precache*`.
     */
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        id: '/',
        name: 'GymLab',
        short_name: 'GymLab',
        description: 'Rutinas, seguimiento de entrenos y calculadoras de fitness',
        theme_color: '#D9B384',
        background_color: '#121214',
        display: 'standalone',
        orientation: 'any',
        lang: 'es',
        start_url: '/',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,jpg,svg,webp,woff2}'],
        // Capa de 5 MB por archivo: ninguna foto de rutina queda fuera del precache.
        maximumFileSizeToCacheInBytes: 5_000_000,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(rootDir, './src'),
    },
  },
  build: {
    rolldownOptions: {
      output: {
        // Separa React, router, Dexie, Recharts y lucide en chunks propios
        // para aprovechar la caché del service worker y reducir el JS inicial.
        codeSplitting: {
          groups: [
            { name: 'vendor-react', test: /node_modules[\\/](react|react-dom|react-is|scheduler)[\\/]/ },
            { name: 'vendor-router', test: /node_modules[\\/]react-router[\\/]/ },
            { name: 'vendor-dexie', test: /node_modules[\\/](dexie|dexie-react-hooks)[\\/]/ },
            { name: 'vendor-icons', test: /node_modules[\\/]lucide-react[\\/]/ },
          ],
        },
      },
    },
  },
})
