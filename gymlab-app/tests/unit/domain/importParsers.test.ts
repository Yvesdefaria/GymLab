/**
 * Tests de los parsers de importación CSV (Strong/Hevy/JEFIT).
 *
 * Contrato actual (F81): un Workout por fecha, series agrupadas por ejercicio
 * con setNumber secuencial, totalVolume solo de series completadas y resolución
 * opcional contra el catálogo (resolver inyectable + unmatched).
 */
import { describe, expect, it } from 'vitest'
import type { WorkoutSet } from '@/domain/types'
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

// El volumen ya no se guarda en la cabecera: se deriva de las series de trabajo.
const completedVolume = (sets: WorkoutSet[]): number =>
  sets
    .filter((s) => s.completed && !s.isWarmup)
    .reduce((acc, s) => acc + s.weightKg * s.reps, 0)

describe('parseStrongCSV', () => {
  it('parsea una línea válida (salta cabecera, setNumber 1)', () => {
    const r = parseStrongCSV(`${STRONG_HEADER}\n2024-01-02,Press de pecho,60,10,Yes`)
    expect(r.errors).toEqual([])
    expect(r.unmatched).toEqual([])
    expect(r.workouts).toHaveLength(1)
    expect(completedVolume(r.sets)).toBe(600)
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
    expect(completedVolume(r.sets)).toBe(82.5)
  })

  it('mantiene el peso con punto decimal sin comillas', () => {
    const r = parseStrongCSV(`${STRONG_HEADER}\n2024-01-02,Press,16.5,5,Yes`)
    expect(r.sets[0]).toMatchObject({ weightKg: 16.5, reps: 5 })
  })

  it('marca completed=false cuando la columna es "No"', () => {
    const r = parseStrongCSV(`${STRONG_HEADER}\n2024-01-02,Press,60,10,No`)
    expect(r.sets[0].completed).toBe(false)
  })

  it('normaliza las variantes de completed y rechaza lo desconocido', () => {
    for (const value of ['No', 'no', 'false', '0', 'n']) {
      const r = parseStrongCSV(`${STRONG_HEADER}\n2024-01-02,Press,60,10,${value}`)
      expect(r.sets[0]?.completed).toBe(false)
    }
    for (const value of ['Yes', 'yes', 'true', '1', 's']) {
      const r = parseStrongCSV(`${STRONG_HEADER}\n2024-01-02,Press,60,10,${value}`)
      expect(r.sets[0]?.completed).toBe(true)
    }
    const bad = parseStrongCSV(`${STRONG_HEADER}\n2024-01-02,Press,60,10,maybe`)
    expect(bad.errors.some((e) => e.includes('completado inválido'))).toBe(true)
    expect(bad.workouts).toHaveLength(0)
  })

  // F140.5: una celda vacía conserva el comportamiento previo (true); no es un
  // valor desconocido y no debe perder la fila.
  it('interpreta completed vacío como true', () => {
    const r = parseStrongCSV(`${STRONG_HEADER}\n2024-01-02,Press,60,10,`)
    expect(r.errors).toEqual([])
    expect(r.sets[0]?.completed).toBe(true)
  })

  // F140.4: una comilla sin cerrar no debe tragarse las filas siguientes; se
  // recupera línea por línea y se reporta el problema.
  it('recupera líneas válidas tras una comilla sin cerrar', () => {
    const csv = [
      STRONG_HEADER,
      '2024-01-02,Press 5",60,10,Yes',
      '2024-01-03,Sentadilla,80,5,Yes',
    ].join('\n')
    const r = parseStrongCSV(csv)

    expect(r.errors.some((e) => e.includes('comillas sin cerrar'))).toBe(true)
    expect(r.workouts.some((w) => w.localDate === '2024-01-03')).toBe(true)
    expect(r.sets.some((s) => s.weightKg === 80 && s.reps === 5)).toBe(true)
  })

  // F140.4: con un campo multilínea, el error de una fila posterior debe apuntar
  // a la línea física de inicio del registro, no al ordinal del registro.
  it('reporta la línea física de un registro multilínea', () => {
    const csv = [
      STRONG_HEADER,
      '2024-01-02,"Press',
      'banca",60,10,Yes',
      '2024-01-03,Sentadilla,abc,5,Yes',
    ].join('\n')
    const r = parseStrongCSV(csv)

    expect(r.errors.some((e) => e.includes('Línea 4'))).toBe(true)
  })

  // F141/S1: la recuperación conserva los registros completos previos a la
  // comilla rota, incluidos los campos multilínea.
  it('conserva un campo multilínea válido antes de una comilla sin cerrar', () => {
    const names: string[] = []
    const csv = [
      STRONG_HEADER,
      '2024-01-02,"Press',
      'banca",60,10,Yes',
      '2024-01-03,Sentadilla 5",80,5,Yes',
      '2024-01-04,Peso muerto,100,5,Yes',
    ].join('\n')
    const r = parseStrongCSV(csv, (name) => { names.push(name); return 1 })

    expect(r.errors.some((e) => e.includes('comillas sin cerrar'))).toBe(true)
    expect(names).toContain('Press\nbanca')
    expect(r.sets.some((s) => s.weightKg === 100)).toBe(true)
  })

  // F141/S2: recortar el preámbulo en blanco no debe desplazar la línea física.
  it('conserva la línea física cuando el CSV empieza con líneas en blanco', () => {
    const csv = [
      '',
      '',
      STRONG_HEADER,
      '2024-01-02,Sentadilla,abc,5,Yes',
    ].join('\n')
    const r = parseStrongCSV(csv)

    expect(r.errors.some((e) => e.includes('Línea 4'))).toBe(true)
  })

  it('soporta comillas escapadas dentro de un campo ("")', () => {
    const names: string[] = []
    const r = parseStrongCSV(
      `${STRONG_HEADER}\n2024-01-02,"Press ""militar""",60,10,Yes`,
      (name) => { names.push(name); return 1 },
    )
    expect(r.errors).toEqual([])
    expect(names).toEqual(['Press "militar"'])
    expect(r.sets).toHaveLength(1)
  })

  it('soporta un campo multilínea entre comillas', () => {
    const names: string[] = []
    const r = parseStrongCSV(
      `${STRONG_HEADER}\n2024-01-02,"Press\nbanca",60,10,Yes`,
      (name) => { names.push(name); return 1 },
    )
    expect(r.errors).toEqual([])
    expect(names).toEqual(['Press\nbanca'])
    expect(r.workouts).toHaveLength(1)
    expect(r.sets).toHaveLength(1)
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
    expect(completedVolume(r.sets)).toBe(1000)

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

  it('resuelve con el resolver y descarta las series sin match (sin ids huérfanos)', () => {
    const csv = [
      STRONG_HEADER,
      '2024-01-02,Press de pecho,60,10,Yes',
      '2024-01-02,Misterio,30,10,Yes',
      '2024-01-02,Misterio,35,8,Yes',
    ].join('\n')
    const resolver = (name: string) => (name === 'Press de pecho' ? 7 : null)
    const r = parseStrongCSV(csv, resolver)

    expect(r.sets).toHaveLength(1)
    expect(r.sets[0].exerciseId).toBe(7)
    expect(r.unmatched).toEqual(['Misterio'])
    expect(r.discardedSets).toBe(2)
    // El entreno se conserva porque le queda una serie resuelta.
    expect(r.workouts).toHaveLength(1)
  })

  it('no crea el entreno cuando todas sus series quedan sin match', () => {
    const csv = [
      STRONG_HEADER,
      '2024-01-02,Misterio,30,10,Yes',
      '2024-01-03,Press de pecho,60,10,Yes',
    ].join('\n')
    const resolver = (name: string) => (name === 'Press de pecho' ? 7 : null)
    const r = parseStrongCSV(csv, resolver)

    expect(r.workouts.map((w) => w.localDate)).toEqual(['2024-01-03'])
    expect(r.sets.map((s) => s.exerciseId)).toEqual([7])
    expect(r.unmatched).toEqual(['Misterio'])
    expect(r.discardedSets).toBe(1)
  })

  // F141/S5: un resolver que devuelve undefined se comporta como sin match.
  it('descarta la serie cuando el resolver devuelve undefined', () => {
    const resolver = (() => undefined) as unknown as (name: string) => number | null
    const r = parseStrongCSV(`${STRONG_HEADER}\n2024-01-02,Misterio,30,10,Yes`, resolver)

    expect(r.unmatched).toEqual(['Misterio'])
    expect(r.discardedSets).toBe(1)
    expect(r.sets).toHaveLength(0)
  })

  it('sin resolver usa hashCode y no descarta nada (compatibilidad)', () => {
    const r = parseStrongCSV(`${STRONG_HEADER}\n2024-01-02,Press de pecho,60,10,Yes`)
    expect(r.unmatched).toEqual([])
    expect(r.discardedSets).toBe(0)
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
    expect(completedVolume(r.sets)).toBe(400)
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

// La fecha del CSV es el único campo sin validar y termina en un path nativo:
// se normaliza a ISO y se rechaza lo que no es un día real.
describe('fechas de importación', () => {
  it('normaliza YYYY/MM/DD a ISO', () => {
    const r = parseStrongCSV(`${STRONG_HEADER}\n2024/01/02,Press,60,10,Yes`)
    expect(r.errors).toEqual([])
    expect(r.workouts[0].localDate).toBe('2024-01-02')
  })

  it('normaliza MM/DD/YYYY a ISO', () => {
    const r = parseStrongCSV(`${STRONG_HEADER}\n01/02/2024,Press,60,10,Yes`)
    expect(r.errors).toEqual([])
    expect(r.workouts[0].localDate).toBe('2024-01-02')
  })

  it('rechaza una fecha inexistente', () => {
    const r = parseStrongCSV(`${STRONG_HEADER}\n2024-02-30,Press,60,10,Yes`)
    expect(r.workouts).toEqual([])
    expect(r.errors.join(' ')).toContain('fecha')
  })

  it('rechaza texto arbitrario en la fecha', () => {
    const r = parseStrongCSV(`${STRONG_HEADER}\n../../x,Press,60,10,Yes`)
    expect(r.workouts).toEqual([])
    expect(r.errors.join(' ')).toContain('fecha')
  })
})
