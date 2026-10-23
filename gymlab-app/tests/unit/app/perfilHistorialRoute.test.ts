// La subpágina de historial del perfil se carga lazy (no viaja en el chunk de /perfil)
// y se registra antes de la ruta padre para que el matcher no la confunda.
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const SRC = fileURLToPath(new URL('../../../src', import.meta.url))
const ROUTER = readFileSync(path.join(SRC, 'app/router.tsx'), 'utf8')

describe('router — /perfil/historial', () => {
  it('registra la ruta antes de /perfil', () => {
    const historial = ROUTER.indexOf('path="perfil/historial"')
    const perfil = ROUTER.indexOf('path="perfil"')
    expect(historial).toBeGreaterThan(-1)
    expect(perfil).toBeGreaterThan(-1)
    expect(historial).toBeLessThan(perfil)
  })

  it('carga la página con import() dinámico, no estático', () => {
    expect(ROUTER).toMatch(/import\('\.\.\/pages\/PerfilHistorialPage'\)/)
    expect(ROUTER).not.toMatch(/import\s+PerfilHistorialPage\s+from/)
  })
})
