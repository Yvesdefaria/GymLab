/**
 * Tests de los parsers de importación CSV (Strong/Hevy/JEFIT).
 *
 * Capturan el comportamiento actual de `parseStrongCSV`/`parseHevyCSV`/
 * `parseJEFITCSV`/`parseImport`/`autoDetectAndParse` para poder refactorizar
 * el código duplicado (dry-refactoring, F93 #25) sin cambiar el resultado.
 */
import { describe, expect, it } from 'vitest'
import {
  parseStrongCSV,
  parseHevyCSV,
  parseJEFITCSV,
  parseImport,
  autoDetectAndParse,
} from '@/domain/importParsers'

const STRONG_HEADER = 'Date,Exercise Name,Weight,Reps,Completed'
const HEVY_HEADER = 'Date,Exercise Name,Weight,Reps,Sets,Completed'
const JEFIT_HEADER = 'date,exercise_name,weight,reps,completed'

describe('parseStrongCSV', () => {
  it('parsea una línea válida (salta cabecera, setNumber 1)', () => {
    const r = parseStrongCSV(`${STRONG_HEADER}\n2024-01-02,Press de pecho,60,10,Yes`)
    expect(r.errors).toEqual([])
    expect(r.workouts).toHaveLength(1)
    expect(r.workouts[0].totalVolume).toBe(600)
    expect(r.workouts[0].localDate).toBe('2024-01-02')
    expect(r.sets).toHaveLength(1)
    expect(r.sets[0]).toMatchObject({ weightKg: 60, reps: 10, setNumber: 1, completed: true })
  })

  it('marca completed=false cuando la columna es "No"', () => {
    const r = parseStrongCSV(`${STRONG_HEADER}\n2024-01-02,Press,60,10,No`)
    expect(r.sets[0].completed).toBe(false)
  })

  it('reporta línea inválida por menos de 5 columnas y por peso/reps no numéricos', () => {
    const r = parseStrongCSV(`${STRONG_HEADER}\n2024-01-02,Solo,nada`)
    expect(r.errors.some((e) => e.includes('formato inválido'))).toBe(true)
    const r2 = parseStrongCSV(`${STRONG_HEADER}\n2024-01-02,Press,abc,xyz,Yes`)
    expect(r2.errors.some((e) => e.includes('peso o reps inválidos'))).toBe(true)
    expect(r2.workouts).toHaveLength(0)
  })

  it('devuelve error con CSV vacío', () => {
    const r = parseStrongCSV('')
    expect(r.errors).toContain('CSV vacío o sin datos')
    expect(r.workouts).toHaveLength(0)
  })
})

describe('parseHevyCSV', () => {
  it('parsea con setNumber desde la columna "Sets"', () => {
    const r = parseHevyCSV(`${HEVY_HEADER}\n2024-01-02,Sentadilla,80,5,3,Yes`)
    expect(r.errors).toEqual([])
    expect(r.workouts).toHaveLength(1)
    expect(r.sets[0]).toMatchObject({ weightKg: 80, reps: 5, setNumber: 3, completed: true })
  })

  it('requiere al menos 6 columnas', () => {
    const r = parseHevyCSV(`${HEVY_HEADER}\n2024-01-02,Press,60,10,No`)
    expect(r.errors.some((e) => e.includes('formato inválido'))).toBe(true)
  })
})

describe('parseJEFITCSV', () => {
  it('parsea como Strong (setNumber 1, 5 columnas)', () => {
    const r = parseJEFITCSV(`${JEFIT_HEADER}\n2024-01-02,Press de pecho,50,8,Yes`)
    expect(r.errors).toEqual([])
    expect(r.sets[0]).toMatchObject({ weightKg: 50, reps: 8, setNumber: 1, completed: true })
  })
})

describe('parseImport', () => {
  it('selecciona el parser según el source', () => {
    expect(parseImport('a\n1,2,3,4,Yes', 'strong').source).toBe('strong')
    expect(parseImport('a\n1,2,3,4,5,Yes', 'hevy').source).toBe('hevy')
    expect(parseImport('a\n1,2,3,4,Yes', 'jefit').source).toBe('jefit')
  })
})

describe('autoDetectAndParse', () => {
  it('captura la autodetección actual: strong/hevy/jefit reales caen en "strong"', () => {
    // Quirk preexistente de #25 (no se corrige: fuera de alcance): la rama
    // strong exige `header.includes('exercise')` y gana sobre hevy/jefit,
    // porque sus cabeceras reales también contienen "exercise".
    expect(autoDetectAndParse(`${STRONG_HEADER}\n1,2,3,4,Yes`).source).toBe('strong')
    expect(autoDetectAndParse(`${HEVY_HEADER}\n1,2,3,4,5,Yes`).source).toBe('strong')
    expect(autoDetectAndParse(`${JEFIT_HEADER}\n1,2,3,4,Yes`).source).toBe('strong')
  })

  it('devuelve error para CSV no reconocido', () => {
    const r = autoDetectAndParse('foo,bar\n1,2')
    expect(r.workouts).toHaveLength(0)
    expect(r.errors.some((e) => e.includes('no reconocido'))).toBe(true)
  })
})
