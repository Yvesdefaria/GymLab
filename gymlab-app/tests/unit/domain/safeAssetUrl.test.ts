import { describe, expect, it } from 'vitest'
import {
  isSafeExerciseImage,
  isSafeLocalAssetUrl,
  isSafePhotoUri,
  isSafeRoutineCover,
  normalizePhotoUri,
  sanitizeProgressPhotoEntry,
} from '@/domain/safeAssetUrl'
import type { ProgressPhotoEntry } from '@/domain/types'

describe('isSafeRoutineCover', () => {
  it('acepta el asset empaquetado', () => {
    expect(isSafeRoutineCover('/images/routines/ppl-volumen.jpg')).toBe(true)
  })

  it('rechaza hosts, esquemas y traversal', () => {
    expect(isSafeRoutineCover('https://collector.example/x.png')).toBe(false)
    expect(isSafeRoutineCover('//collector.example/x.png')).toBe(false)
    expect(isSafeRoutineCover('/images/routines/../../etc/passwd')).toBe(false)
    expect(isSafeRoutineCover('javascript:alert(1)')).toBe(false)
    expect(isSafeRoutineCover('data:image/png;base64,AAA')).toBe(false)
  })

  it('rechaza vacío y null', () => {
    expect(isSafeRoutineCover('')).toBe(false)
    expect(isSafeRoutineCover(null)).toBe(false)
    expect(isSafeRoutineCover(undefined)).toBe(false)
  })
})

describe('isSafeExerciseImage', () => {
  it('acepta assets locales y data URLs de imagen', () => {
    expect(isSafeExerciseImage('/exercises/sentadilla/0.jpg')).toBe(true)
    expect(isSafeExerciseImage('/images/sentadilla.jpg')).toBe(true)
    expect(isSafeExerciseImage('data:image/jpeg;base64,AAA')).toBe(true)
  })

  it('rechaza hosts externos y esquemas ejecutables', () => {
    expect(isSafeExerciseImage('https://collector.example/x.png')).toBe(false)
    expect(isSafeExerciseImage('//collector.example/x.png')).toBe(false)
    expect(isSafeExerciseImage('/exercises/../x.png')).toBe(false)
    expect(isSafeExerciseImage('javascript:alert(1)')).toBe(false)
    expect(isSafeExerciseImage('data:text/html;base64,AAA')).toBe(false)
  })
})

describe('isSafeLocalAssetUrl (endurecido)', () => {
  it('rechaza caracteres de control que el parser de URL borra', () => {
    expect(isSafeLocalAssetUrl('/\t/evil.example/x.png')).toBe(false)
    expect(isSafeLocalAssetUrl('/\n/evil.example/x.png')).toBe(false)
    expect(isSafeLocalAssetUrl('/\r/evil.example/x.png')).toBe(false)
    expect(isSafeLocalAssetUrl('/\u0000/evil.example/x.png')).toBe(false)
    expect(isSafeExerciseImage('/\t/evil.example/x.png')).toBe(false)
  })

  it('rechaza valores que no son string sin lanzar', () => {
    expect(isSafeLocalAssetUrl(42 as unknown as string)).toBe(false)
    expect(isSafeRoutineCover({} as unknown as string)).toBe(false)
    expect(isSafeExerciseImage(true as unknown as string)).toBe(false)
    expect(isSafePhotoUri(0 as unknown as string)).toBe(false)
  })
})

describe('isSafePhotoUri / normalizePhotoUri', () => {
  it('solo acepta data:image base64', () => {
    expect(isSafePhotoUri('data:image/jpeg;base64,AAA')).toBe(true)
    expect(isSafePhotoUri('data:image/webp;base64,AAA')).toBe(true)
    expect(isSafePhotoUri('file:///data/user/0/com.gymlab.app/cache/x.png')).toBe(false)
    expect(isSafePhotoUri('https://collector.example/x.png')).toBe(false)
    expect(isSafePhotoUri('javascript:alert(1)')).toBe(false)
    expect(isSafePhotoUri('')).toBe(false)
  })

  it('normaliza a null lo que no es seguro', () => {
    expect(normalizePhotoUri('data:image/png;base64,AAA')).toBe('data:image/png;base64,AAA')
    expect(normalizePhotoUri('https://collector.example/x.png')).toBeNull()
    expect(normalizePhotoUri(null)).toBeNull()
  })
})

describe('sanitizeProgressPhotoEntry', () => {
  const entry: ProgressPhotoEntry = {
    id: 1,
    localDate: '2026-11-06',
    frontUri: 'data:image/jpeg;base64,AAA',
    sideUri: 'https://collector.example/x.png',
    backUri: 'file:///data/user/0/com.gymlab.app/cache/x.png',
    createdAt: '2026-11-06T09:00:00.000Z',
  }

  it('conserva la segura y nulifica las demás sin tocar el resto', () => {
    expect(sanitizeProgressPhotoEntry(entry)).toEqual({
      ...entry,
      sideUri: null,
      backUri: null,
    })
  })
})
