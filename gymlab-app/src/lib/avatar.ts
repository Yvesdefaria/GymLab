// Validación de URIs de avatar: dataURLs de imagen o hosts remotos de una allowlist.
// La UI nunca debe renderizar un src arbitrario; esta función es la única puerta de entrada.

const ALLOWED_AVATAR_HOSTS = new Set(['images.unsplash.com', 'images.pexels.com'])
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const MAX_FILE_BYTES = 2 * 1024 * 1024 // 2 MB

// Comprueba que una URI de imagen es segura: dataURL de imagen o HTTPS de host en allowlist.
export const isSafeAvatarUri = (uri: string): boolean => {
  if (!uri) return false
  if (uri.startsWith('data:image/')) {
    const mime = uri.slice(5, uri.indexOf(';'))
    return ALLOWED_MIME.has(mime)
  }
  if (!uri.startsWith('https://')) return false
  try {
    return ALLOWED_AVATAR_HOSTS.has(new URL(uri).hostname)
  } catch {
    return false
  }
}

export { ALLOWED_AVATAR_HOSTS, ALLOWED_MIME, MAX_FILE_BYTES }
