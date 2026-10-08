/**
 * Tests de los parsers de importación CSV (Strong/Hevy/JEFIT).
 *
 * Contrato actual (F81): un Workout por fecha, series agrupadas por ejercicio
 * con setNumber secuencial, totalVolume solo de series completadas y resolución
 * opcional contra el catálogo (resolver inyectable + unmatched).
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
    expect(r.unmatched).toEqual([])
    expect(r.workouts).toHaveLength(1)
    expect(r.workouts[0].totalVolume).toBe(600)
    expect(r.workouts[0].localDate).toBe('2024-01-02')
    expect(r.workouts[0].startedAt).toBe('2024-01-02T00:00:00')
    expect(r.sets).toHaveLength(1)
    expect(r.sets[0]).toMatchObject({ weightKg: 60, reps: 10, setNumber: 1, completed: true })
  })

  it('normaliza la coma decimal de un campo entre comillas ("16,5" -> 16.5)', () => {
    const r = parseStrongCSV(`${STRONG_HEADER}\n2024-01-02,Press de pecho,"16,5",5,Yes`)
    expect(r.errors).toEqual([])
    expect(r.workouts).toHaveLength(1)
    expect(r.sets).toHaveLength(1)
    expect(r.sets[0]).toMatchObject({ weightKg: 16.5, reps: 5, setNumber: 1 })
    expect(r.workouts[0].totalVolume).toBe(82.5)
  })

  it('mantiene el peso con punto decimal sin comillas', () => {
    const r = parseStrongCSV(`${STRONG_HEADER}\n2024-01-02,Press,16.5,5,Yes`)
    expect(r.sets[0]).toMatchObject({ weightKg: 16.5, reps: 5 })
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

  it('reagrupa filas de la misma fecha en un workout con series por ejercicio y setNumber secuencial', () => {
    const csv = [
      STRONG_HEADER,
      '2024-01-02,Press de pecho,60,10,Yes',
      '2024-01-02,Sentadilla,80,5,Yes',
      '2024-01-02,Press de pecho,65,8,No',
    ].join('\n')
    const r = parseStrongCSV(csv)

    expect(r.errors).toEqual([])
    expect(r.workouts).toHaveLength(1)
    // Solo las completadas suman al volumen: 60×10 + 80×5.
    expect(r.workouts[0].totalVolume).toBe(1000)

    // Series agrupadas por ejercicio (orden de aparición) y setNumber 1..n.
    expect(r.sets).toHaveLength(3)
    expect(r.sets.map((s) => [s.id, s.setNumber, s.weightKg, s.reps])).toEqual([
      [1, 1, 60, 10],
      [2, 2, 65, 8],
      [3, 1, 80, 5],
    ])
    expect(r.sets.every((s) => s.workoutId === 1)).toBe(true)
    expect(r.sets.every((s) => s.createdAt === '2024-01-02T00:00:00')).toBe(true)
  })

  it('crea un workout por fecha distinta, ordenados por fecha ascendente', () => {
    // El archivo llega en orden inverso: igual se ordena por localDate.
    const csv = [
      STRONG_HEADER,
      '2024-03-05,Sentadilla,80,5,Yes',
      '2024-01-02,Press de pecho,60,10,Yes',
    ].join('\n')
    const r = parseStrongCSV(csv)

    expect(r.workouts.map((w) => w.localDate)).toEqual(['2024-01-02', '2024-03-05'])
    expect(r.workouts.map((w) => w.id)).toEqual([1, 2])
    expect(r.sets.map((s) => [s.id, s.workoutId, s.weightKg])).toEqual([
      [1, 1, 60],
      [2, 2, 80],
    ])
  })

  it('resuelve exerciseId con el resolver y reporta unmatched único con fallback hashCode', () => {
    const csv = [
      STRONG_HEADER,
      '2024-01-02,Press de pecho,60,10,Yes',
      '2024-01-02,Misterio,30,10,Yes',
      '2024-01-02,Misterio,35,8,Yes',
    ].join('\n')
    const resolver = (name: string) => (name === 'Press de pecho' ? 7 : null)
    const r = parseStrongCSV(csv, resolver)

    expect(r.sets[0].exerciseId).toBe(7)
    expect(r.unmatched).toEqual(['Misterio'])
    // La segunda fila sin match reutiliza el mismo fallback estable.
    expect(r.sets[1].exerciseId).toBe(r.sets[2].exerciseId)
    expect(r.sets[1].exerciseId).not.toBe(7)
  })

  it('sin resolver usa hashCode y no reporta unmatched', () => {
    const r = parseStrongCSV(`${STRONG_HEADER}\n2024-01-02,Press de pecho,60,10,Yes`)
    expect(r.unmatched).toEqual([])
    expect(r.sets[0].exerciseId).toBeGreaterThan(0)
  })
})

describe('parseHevyCSV', () => {
  it('requiere al menos 6 columnas', () => {
    const r = parseHevyCSV(`${HEVY_HEADER}\n2024-01-02,Press,60,10,No`)
    expect(r.errors.some((e) => e.includes('formato inválido'))).toBe(true)
  })

  it('toma completed de su columna y renumera setNumber 1..n por ejercicio', () => {
    const csv = [
      HEVY_HEADER,
      '2024-01-02,Sentadilla,80,5,3,Yes',
      '2024-01-02,Sentadilla,85,3,1,No',
    ].join('\n')
    const r = parseHevyCSV(csv)

    expect(r.errors).toEqual([])
    expect(r.workouts).toHaveLength(1)
    expect(r.sets.map((s) => [s.setNumber, s.completed])).toEqual([
      [1, true],
      [2, false],
    ])
    // Solo la serie completada suma al volumen.
    expect(r.workouts[0].totalVolume).toBe(400)
  })
})

describe('parseJEFITCSV', () => {
  it('parsea como Strong (setNumber secuencial, 5 columnas)', () => {
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

  it('pasa el resolver al parser elegido', () => {
    const r = parseImport(
      `${STRONG_HEADER}\n2024-01-02,Press de pecho,60,10,Yes`,
      'strong',
      (name) => (name === 'Press de pecho' ? 42 : null)
    )
    expect(r.sets[0].exerciseId).toBe(42)
  })
})

describe('autoDetectAndParse', () => {
  it('detecta cada app por su header y parsea con su layout', () => {
    expect(autoDetectAndParse(`${STRONG_HEADER}\n2024-01-02,Press,60,10,Yes`).source).toBe('strong')
    const hevy = autoDetectAndParse(`${HEVY_HEADER}\n2024-01-02,Press,60,10,3,Yes`)
    expect(hevy.source).toBe('hevy')
    expect(hevy.sets[0]).toMatchObject({ setNumber: 1, completed: true })
    expect(autoDetectAndParse(`${JEFIT_HEADER}\n2024-01-02,Press,60,10,Yes`).source).toBe('jefit')
  })

  it('pasa el resolver a todos los parsers', () => {
    const r = autoDetectAndParse(
      `${JEFIT_HEADER}\n2024-01-02,Press de pecho,50,8,Yes`,
      (name) => (name === 'Press de pecho' ? 9 : null)
    )
    expect(r.sets[0].exerciseId).toBe(9)
    expect(r.unmatched).toEqual([])
  })

  it('devuelve error para CSV no reconocido', () => {
    const r = autoDetectAndParse('foo,bar\n1,2')
    expect(r.workouts).toHaveLength(0)
    expect(r.errors.some((e) => e.includes('no reconocido'))).toBe(true)
  })
})
