// Paridad legal es/en: cada sección definida en domain/legal debe existir con
// título y párrafos (cuerpo: string[]) no vacíos en ambos idiomas, incluida la
// sección de contacto. Asegura que los T&C y la Política de privacidad no se
// rompan al ampliar contenido o cambiar de estructura (formato artículo).
import { describe, expect, it } from 'vitest'
import { PRIVACIDAD_SECTIONS, TERMINOS_SECTIONS } from '@/domain/legal'
import { en } from '@/i18n/locales/en'
import { es } from '@/i18n/locales/es'

type LegalGroup = {
  secciones: Record<string, { titulo: string; cuerpo: string[] }>
  contacto: { titulo: string; cuerpo: string }
}

const castGroup = (grupo: unknown): LegalGroup => grupo as LegalGroup

const noVacia = (s: string): boolean => typeof s === 'string' && s.trim() !== ''

function assertSecciones(
  locales: Array<[string, unknown]>,
  secciones: readonly string[],
  nombre: string,
) {
  for (const [idioma, bundle] of locales) {
    const g = castGroup((bundle as Record<string, unknown>)[nombre])
    for (const id of secciones) {
      const seccion = g.secciones[id]
      expect(seccion, `${nombre}.${id} sin sección en ${idioma}`).toBeTruthy()
      expect(noVacia(seccion.titulo), `${nombre}.${id}.titulo vacío en ${idioma}`).toBe(true)
      expect(Array.isArray(seccion.cuerpo), `${nombre}.${id}.cuerpo no es array en ${idioma}`).toBe(true)
      expect(seccion.cuerpo.length, `${nombre}.${id}.cuerpo sin párrafos en ${idioma}`).toBeGreaterThan(0)
      for (const parrafo of seccion.cuerpo) {
        expect(noVacia(parrafo), `${nombre}.${id} párrafo vacío en ${idioma}`).toBe(true)
      }
    }
  }
}

const LOCALES: Array<[string, unknown]> = [
  ['es', es],
  ['en', en],
]

describe('domain/legal', () => {
  it('expone listas de secciones para T&C y privacidad, sin vacíos ni duplicados', () => {
    expect(TERMINOS_SECTIONS.length).toBeGreaterThan(0)
    expect(PRIVACIDAD_SECTIONS.length).toBeGreaterThan(0)
    expect(new Set(TERMINOS_SECTIONS).size).toBe(TERMINOS_SECTIONS.length)
    expect(new Set(PRIVACIDAD_SECTIONS).size).toBe(PRIVACIDAD_SECTIONS.length)
  })

  it('terminos: cada sección tiene título y párrafos no vacíos en es y en', () => {
    assertSecciones(LOCALES, TERMINOS_SECTIONS, 'terminos')
  })

  it('privacidad: cada sección tiene título y párrafos no vacíos en es y en', () => {
    assertSecciones(LOCALES, PRIVACIDAD_SECTIONS, 'privacidad')
  })

  it('ambos grupos tienen contacto con correo (placeholder) en es y en', () => {
    for (const [idioma, bundle] of LOCALES) {
      for (const nombre of ['terminos', 'privacidad'] as const) {
        const contacto = castGroup((bundle as Record<string, unknown>)[nombre]).contacto
        expect(noVacia(contacto.titulo), `${nombre}.contacto.titulo vacío en ${idioma}`).toBe(true)
        expect(noVacia(contacto.cuerpo), `${nombre}.contacto.cuerpo vacío en ${idioma}`).toBe(true)
        expect(contacto.cuerpo).toContain('{{email}}')
      }
    }
  })
})