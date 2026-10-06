/// <reference types="node" />
// F103/T8 — invariante de lazy loading por tab en /estadisticas (enfoque A de F91).
// El chunk de la ruta no debe importar estáticamente los 4 tabs (Recharts viaja con
// ellos): cada tab se carga con React.lazy + Suspense recién al activarse.
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const SRC = fileURLToPath(new URL('../../../src', import.meta.url))
const PAGE = readFileSync(path.join(SRC, 'pages/EstadisticasPage.tsx'), 'utf8')

const TABS = [
  '@/components/stats/EntrenoTab',
  '@/components/stats/CuerpoTab',
  '@/components/stats/FuerzaTab',
  '@/components/periodization/PeriodizationSection',
]

describe('EstadisticasPage — tabs lazy (F103/T8)', () => {
  it.each(TABS)('%s se carga con import() dinámico, no estático', (mod) => {
    expect(PAGE).toMatch(new RegExp(`import\\('${mod.replace(/[/@]/g, '\\$&')}'\\)`))
    // Import estático del módulo = vuelve al chunk de la ruta (lo que había antes).
    expect(PAGE).not.toMatch(
      new RegExp(`import\\s*\\{[^}]*\\}\\s*from\\s*'${mod.replace(/[/@]/g, '\\$&')}'`)
    )
  })

  it('envuelve el tab activo en un límite Suspense', () => {
    expect(PAGE).toMatch(/<Suspense\b/)
  })
})
