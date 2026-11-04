/**
 * Soft-404 de `app.gymlab.dev` (auditoría 2026-11-04, verificado en vivo).
 *
 * El Worker de assets servía `index.html` con 200 para cualquier path desconocido
 * (`not_found_handling: "single-page-application"`), así que los escáneres que pedían
 * `/pinfo.php` o `/.env` recibían un 200 y volvían. El fix tiene que devolver 404 solo
 * cuando el path parece un archivo, y conservar el fallback SPA para las rutas del router.
 *
 * Con `not_found_handling: "none"` + `main`, el router de Cloudflare manda al Worker
 * únicamente las rutas que NO resuelven a un asset: los archivos reales ni lo tocan.
 */
import { describe, expect, it } from 'vitest'
import { handleMissingAsset, isFileLikePath } from '@/worker/notFound'

describe('isFileLikePath', () => {
  it.each([
    '/pinfo.php',
    '/beta/phpinfo.php',
    '/backend/web/phpinfo.php',
    '/cakephp/.env',
    '/.env.local',
    '/backup.bak',
    '/sitemap.xml',
    '/assets/missing-chunk.js',
    '/PINFO.PHP',
  ])('%s looks like a file', (path) => {
    expect(isFileLikePath(path)).toBe(true)
  })

  it.each([
    '/',
    '/entrenar',
    '/historial',
    '/entrenamiento/active',
    '/ejercicios/bent-over-row',
    '/calculadoras/imc',
    '/pasos',
  ])('%s is a client route', (path) => {
    expect(isFileLikePath(path)).toBe(false)
  })
})

describe('handleMissingAsset', () => {
  const makeAssets = () => {
    const calls: Request[] = []
    return {
      calls,
      fetch: async (request: Request) => {
        calls.push(request)
        return new Response('<!doctype html><div id="root"></div>', {
          status: 200,
          headers: { 'content-type': 'text/html' },
        })
      },
    }
  }

  it('returns 404 for a missing file-like path without touching assets', async () => {
    const assets = makeAssets()
    const response = await handleMissingAsset(
      new Request('https://app.gymlab.dev/pinfo.php'),
      assets,
    )

    expect(response.status).toBe(404)
    expect(assets.calls).toHaveLength(0)
  })

  it('serves index.html for a client route', async () => {
    const assets = makeAssets()
    const response = await handleMissingAsset(
      new Request('https://app.gymlab.dev/entrenar'),
      assets,
    )

    expect(response.status).toBe(200)
    expect(assets.calls).toHaveLength(1)
    expect(new URL(assets.calls[0].url).pathname).toBe('/index.html')
  })

  it('keeps the original method and headers when falling back', async () => {
    const assets = makeAssets()
    await handleMissingAsset(
      new Request('https://app.gymlab.dev/historial', {
        method: 'HEAD',
        headers: { accept: 'text/html' },
      }),
      assets,
    )

    expect(assets.calls[0].method).toBe('HEAD')
    expect(assets.calls[0].headers.get('accept')).toBe('text/html')
  })

  it('returns 404 for a non-GET request to an unknown route', async () => {
    const assets = makeAssets()
    const response = await handleMissingAsset(
      new Request('https://app.gymlab.dev/entrenar', { method: 'POST' }),
      assets,
    )

    expect(response.status).toBe(404)
    expect(assets.calls).toHaveLength(0)
  })
})
