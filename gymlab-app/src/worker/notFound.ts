/**
 * Fallback de rutas desconocidas para el Worker de `app.gymlab.dev`.
 *
 * Con `assets.not_found_handling: "none"` el router de Cloudflare solo invoca este Worker
 * cuando el path no resuelve a un archivo real: los assets existentes se sirven antes y no
 * pagan el costo de una invocación.
 */

/** Un path que termina en extensión se trata como archivo, no como ruta del router. */
export const isFileLikePath = (pathname: string): boolean => /\.[a-z0-9]{1,8}$/i.test(pathname)

export interface AssetFetcher {
  fetch(request: Request): Promise<Response>
}

const notFound = (): Response =>
  new Response('Not Found', {
    status: 404,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'x-content-type-options': 'nosniff',
    },
  })

/**
 * Resuelve un path que no existe como asset:
 * - archivo faltante o método que no sea GET/HEAD -> 404 real;
 * - ruta del cliente -> `index.html`, para que el router del SPA la resuelva.
 */
export const handleMissingAsset = async (
  request: Request,
  assets: AssetFetcher,
): Promise<Response> => {
  if (request.method !== 'GET' && request.method !== 'HEAD') return notFound()

  const url = new URL(request.url)
  if (isFileLikePath(url.pathname)) return notFound()

  const indexRequest = new Request(new URL('/index.html', url), {
    method: request.method,
    headers: request.headers,
  })

  return assets.fetch(indexRequest)
}
