/// <reference types="node" />
// Invariantes del self-host de tipografías: la app es offline-first (PWA + Capacitor),
// así que Oswald/Barlow deben salir de public/fonts y nunca de Google Fonts. El test
// audita los archivos FUENTE: un @import externo o un preconnect reintroducirían la
// dependencia de red sin que ninguna otra prueba lo note.
import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../../../', import.meta.url))
const CSS = readFileSync(path.join(ROOT, 'src/index.css'), 'utf8')
const HTML = readFileSync(path.join(ROOT, 'index.html'), 'utf8')

const GOOGLE_FONTS = /fonts\.(?:googleapis|gstatic)\.com/
// @import externo (http/https o protocol-relative), que bloquea el render sin red.
const EXTERNAL_IMPORT = /@import\s+url\(\s*['"]?(?:https?:)?\/\//i

type Variant = { family: string; weight: number }

const EXPECTED_VARIANTS: Variant[] = [
  { family: 'Oswald', weight: 500 },
  { family: 'Oswald', weight: 600 },
  { family: 'Oswald', weight: 700 },
  { family: 'Barlow', weight: 400 },
  { family: 'Barlow', weight: 500 },
  { family: 'Barlow', weight: 600 },
  { family: 'Barlow', weight: 700 },
]

const keyOf = (variant: Variant) => `${variant.family}-${variant.weight}`

// Cada @font-face del archivo como bloque de texto (CSS no anida @font-face).
const fontFaces = CSS.match(/@font-face\s*\{[^}]*\}/g) ?? []

const variantOf = (block: string): Variant | null => {
  const family = /font-family\s*:\s*['"]?(Oswald|Barlow)['"]?/.exec(block)?.[1]
  const weight = Number(/font-weight\s*:\s*(\d+)/.exec(block)?.[1])
  return family && Number.isInteger(weight) ? { family, weight } : null
}

const srcOf = (block: string): string | null =>
  /src\s*:\s*url\(\s*['"]?(\/fonts\/[^'")]+\.woff2)['"]?\s*\)/.exec(block)?.[1] ?? null

describe('fuentes self-hosted', () => {
  it('ni index.css ni index.html referencian Google Fonts', () => {
    for (const [name, text] of [
      ['src/index.css', CSS],
      ['index.html', HTML],
    ] as const) {
      expect(text, `${name} referencia Google Fonts`).not.toMatch(GOOGLE_FONTS)
    }
  })

  it('index.css no tiene @import externos', () => {
    expect(CSS).not.toMatch(EXTERNAL_IMPORT)
  })

  it('index.css declara las 7 variantes con woff2 local existente y válido', () => {
    const declared = new Map<string, string>()
    for (const block of fontFaces) {
      const variant = variantOf(block)
      const src = srcOf(block)
      if (!variant || !src) continue
      const key = keyOf(variant)
      expect(declared.has(key), `variante duplicada: ${key}`).toBe(false)
      declared.set(key, src)
    }

    expect([...declared.keys()].sort()).toEqual(EXPECTED_VARIANTS.map(keyOf).sort())

    for (const src of declared.values()) {
      const file = path.join(ROOT, 'public', src.replace(/^\/+/, ''))
      expect(existsSync(file), `falta el archivo ${src}`).toBe(true)
      const magic = readFileSync(file).subarray(0, 4).toString('latin1')
      expect(magic, `${src} no es un woff2 (magic wOF2)`).toBe('wOF2')
      expect(statSync(file).size, `${src} mide menos de 5 KB`).toBeGreaterThan(5 * 1024)
    }
  })
})
