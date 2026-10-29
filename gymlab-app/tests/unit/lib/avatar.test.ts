import { describe, expect, it } from 'vitest'
import { isSafeAvatarUri } from '@/lib/avatar'

describe('isSafeAvatarUri', () => {
  it('acepta data URLs de imágenes permitidas', () => {
    expect(isSafeAvatarUri('data:image/png;base64,AAAA')).toBe(true)
    expect(isSafeAvatarUri('data:image/webp;base64,AAAA')).toBe(true)
    expect(isSafeAvatarUri('data:image/svg+xml;base64,AAAA')).toBe(false)
  })

  it('acepta los presets locales empaquetados', () => {
    expect(isSafeAvatarUri('/avatars/avatar-01.jpg')).toBe(true)
    expect(isSafeAvatarUri('/avatars/avatar-12.jpg')).toBe(true)
  })

  it('rechaza paths locales fuera del directorio de presets o con extensión no permitida', () => {
    expect(isSafeAvatarUri('/avatars/../secret.jpg')).toBe(false)
    expect(isSafeAvatarUri('/avatars/avatar-01.svg')).toBe(false)
    expect(isSafeAvatarUri('/images/avatar-01.jpg')).toBe(false)
    expect(isSafeAvatarUri('avatars/avatar-01.jpg')).toBe(false)
  })

  it('mantiene la allowlist HTTPS para avatares ya guardados', () => {
    expect(
      isSafeAvatarUri('https://images.unsplash.com/photo-1517836357463-d25dfeac3438'),
    ).toBe(true)
    expect(isSafeAvatarUri('https://example.com/avatar.jpg')).toBe(false)
  })
})
