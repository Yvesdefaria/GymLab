// Validación de URIs de avatar: dataURLs de imagen, presets locales o hosts remotos
// legacy de una allowlist. La UI nunca debe renderizar un src arbitrario; esta función
// es la única puerta de entrada.
const ALLOWED_AVATAR_HOSTS = new Set(['images.unsplash.com', 'images.pexels.com'])
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const MAX_FILE_BYTES = 2 * 1024 * 1024 // 2 MB
// Presets empaquetados en public/avatars: no hacen requests a terceros.
const LOCAL_AVATAR_PATTERN = /^\/avatars\/avatar-\d{2}\.(?:jpe?g|png|webp)$/i

// Comprueba que una URI de imagen es segura: dataURL de imagen, preset local o HTTPS
// de host en allowlist (para avatares ya guardados).
export const isSafeAvatarUri = (uri: string): boolean => {
  if (!uri) return false
  if (LOCAL_AVATAR_PATTERN.test(uri)) return true
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
