// Tests de la calculadora de composición corporal (Jackson-Pollock, Siri, ratios y series temporales).
import { describe, expect, it } from 'vitest'
import {
  bodyFatCategory,
  buildBodyCompSeries,
  buildImcSeries,
  buildRatiosSeries,
  calcFatFreeMass,
  calcFatMass,
  calcJacksonPollock,
  calcSymmetryPct,
  calcWhr,
  calcWhtr,
  densityToBodyFatPct,
  jacksonPollockDensity,
  whrCategory,
  whtrCategory,
} from './bodyComposition'

describe('jacksonPollockDensity', () => {
  it('Jackson-Pollock 7 pliegues en hombres (referencia: sum7=90, 30 años)', () => {
    const density = jacksonPollockDensity(
      {
        sex: 'male',
        age: 30,
        sites: {
          pectoral: 20,
          axilar: 10,
          triceps: 15,
          subescapular: 15,
          abdominal: 15,
          suprailiaco: 10,
          muslo: 5,
        },
      },
      '7',
    )
    expect(density).toBeCloseTo(1.0687, 3)
  })

  it('Jackson-Pollock 7 pliegues en mujeres (referencia: sum7=90, 30 años)', () => {
    const density = jacksonPollockDensity(
      {
        sex: 'female',
        age: 30,
        sites: {
          pectoral: 5,
          axilar: 10,
          triceps: 15,
          subescapular: 15,
          abdominal: 20,
          suprailiaco: 15,
          muslo: 10,
        },
      },
      '7',
    )
    expect(density).toBeCloseTo(1.0554, 3)
  })

  it('Jackson-Pollock 3 pliegues en hombres usa pectoral+abdominal+muslo (sum3=60, 25 años)', () => {
    const density = jacksonPollockDensity(
      {
        sex: 'male',
        age: 25,
        sites: { pectoral: 20, abdominal: 25, muslo: 15 },
      },
      '3',
    )
    expect(density).toBeCloseTo(1.0591, 3)
  })

  it('Jackson-Pollock 3 pliegues en mujeres usa triceps+suprailiaco+muslo (sum3=60, 25 años)', () => {
    const density = jacksonPollockDensity(
      {
        sex: 'female',
        age: 25,
        sites: { triceps: 15, suprailiaco: 25, muslo: 20 },
      },
      '3',
    )
    expect(density).toBeCloseTo(1.0447, 3)
  })

  it('devuelve null si falta un pliegue, es negativo o la edad no es válida', () => {
    expect(
      jacksonPollockDensity(
        {
          sex: 'male',
          age: 30,
          sites: { pectoral: 20, abdominal: 25 },
        },
        '3',
      ),
    ).toBeNull()
    expect(
      jacksonPollockDensity(
        {
          sex: 'male',
          age: 30,
          sites: { pectoral: 20, abdominal: 25, muslo: 0 },
        },
        '3',
      ),
    ).toBeNull()
    expect(
      jacksonPollockDensity(
        {
          sex: 'male',
          age: 0,
          sites: { pectoral: 20, abdominal: 25, muslo: 15 },
        },
        '3',
      ),
    ).toBeNull()
  })
})

describe('densityToBodyFatPct', () => {
  it('convierte densidad a % de grasa con la ecuación de Siri', () => {
    expect(densityToBodyFatPct(1.0687)).toBeCloseTo(13.2, 1)
    expect(densityToBodyFatPct(1.0447)).toBeCloseTo(23.8, 1)
  })

  it('devuelve 0 con densidad no válida', () => {
    expect(densityToBodyFatPct(0)).toBe(0)
    expect(densityToBodyFatPct(-1)).toBe(0)
  })
})

describe('calcJacksonPollock', () => {
  it('devuelve densidad, % grasa y lista de pliegues faltantes', () => {
    const r = calcJacksonPollock(
      {
        sex: 'male',
        age: 30,
        sites: {
          pectoral: 20,
          axilar: 10,
          triceps: 15,
          subescapular: 15,
          abdominal: 15,
          suprailiaco: 10,
          muslo: 5,
        },
      },
      '7',
    )
    expect(r.bodyDensity).toBeCloseTo(1.0687, 3)
    expect(r.bodyFatPct).toBeCloseTo(13.2, 1)
    expect(r.missingSites).toEqual([])
  })

  it('marca los pliegues que faltan cuando el protocolo no está completo', () => {
    const r = calcJacksonPollock(
      { sex: 'female', age: 30, sites: { triceps: 15, suprailiaco: 25 } },
      '7',
    )
    expect(r.bodyDensity).toBeNull()
    expect(r.bodyFatPct).toBeNull()
    expect(r.missingSites).toContain('muslo')
    expect(r.missingSites.length).toBeGreaterThan(0)
  })
})

describe('bodyFatCategory', () => {
  it('hombres: esencial/atleta/en forma/promedio/elevado en sus rangos', () => {
    expect(bodyFatCategory(5, 'male')).toBe('esencial')
    expect(bodyFatCategory(6, 'male')).toBe('atleta')
    expect(bodyFatCategory(13, 'male')).toBe('atleta')
    expect(bodyFatCategory(14, 'male')).toBe('en_forma')
    expect(bodyFatCategory(17, 'male')).toBe('en_forma')
    expect(bodyFatCategory(18, 'male')).toBe('promedio')
    expect(bodyFatCategory(24, 'male')).toBe('promedio')
    expect(bodyFatCategory(25, 'male')).toBe('alto')
  })

  it('mujeres: esencial/atleta/en forma/promedio/elevado en sus rangos', () => {
    expect(bodyFatCategory(13, 'female')).toBe('esencial')
    expect(bodyFatCategory(14, 'female')).toBe('atleta')
    expect(bodyFatCategory(20, 'female')).toBe('atleta')
    expect(bodyFatCategory(21, 'female')).toBe('en_forma')
    expect(bodyFatCategory(24, 'female')).toBe('en_forma')
    expect(bodyFatCategory(25, 'female')).toBe('promedio')
    expect(bodyFatCategory(31, 'female')).toBe('promedio')
    expect(bodyFatCategory(32, 'female')).toBe('alto')
  })
})

describe('masa grasa y masa magra', () => {
  it('calcula masa grasa y masa magra a partir de peso y % grasa', () => {
    expect(calcFatMass(80, 20)).toBe(16)
    expect(calcFatFreeMass(80, 20)).toBe(64)
  })

  it('devuelve 0 con datos no válidos', () => {
    expect(calcFatMass(0, 20)).toBe(0)
    expect(calcFatMass(80, -5)).toBe(0)
    expect(calcFatFreeMass(0, 20)).toBe(0)
  })
})

describe('ratio cintura/altura (WHtR)', () => {
  it('calcula el ratio y su categoría de riesgo', () => {
    expect(calcWhtr(80, 170)).toBe(0.47)
    expect(whtrCategory(0.47)).toBe('saludable')
    expect(whtrCategory(0.5)).toBe('saludable')
    expect(whtrCategory(0.53)).toBe('riesgo_aumentado')
    expect(whtrCategory(0.6)).toBe('riesgo_aumentado')
    expect(whtrCategory(0.62)).toBe('riesgo_alto')
  })

  it('devuelve null sin cintura o altura válidas', () => {
    expect(calcWhtr(0, 170)).toBeNull()
    expect(calcWhtr(80, 0)).toBeNull()
  })
})

describe('ratio cintura/cadera (WHR)', () => {
  it('calcula el ratio y su categoría según sexo', () => {
    expect(calcWhr(80, 100)).toBe(0.8)
    expect(whrCategory(0.8, 'male')).toBe('bajo')
    expect(whrCategory(0.8, 'female')).toBe('moderado')
    expect(whrCategory(0.92, 'male')).toBe('moderado')
    expect(whrCategory(0.92, 'female')).toBe('alto')
    expect(whrCategory(1.0, 'male')).toBe('alto')
  })

  it('devuelve null sin cintura o cadera válidas', () => {
    expect(calcWhr(0, 100)).toBeNull()
    expect(calcWhr(80, 0)).toBeNull()
  })
})

describe('calcSymmetryPct', () => {
  it('calcula la diferencia porcentual entre lado izquierdo y derecho', () => {
    expect(calcSymmetryPct(40, 40)).toBe(0)
    expect(calcSymmetryPct(41, 40)).toBe(2.5)
    expect(calcSymmetryPct(40, 41)).toBe(2.5)
  })

  it('devuelve null sin valores válidos', () => {
    expect(calcSymmetryPct(0, 40)).toBeNull()
    expect(calcSymmetryPct(40, 0)).toBeNull()
  })
})

describe('buildImcSeries', () => {
  it('construye la serie de IMC ordenada por fecha', () => {
    const entries = [
      { id: 2, localDate: '2026-01-10', weightKg: 80, createdAt: '' },
      { id: 1, localDate: '2026-01-05', weightKg: 82, createdAt: '' },
    ]
    const points = buildImcSeries(entries, 180)
    expect(points).toEqual([
      { date: '2026-01-05', imc: 25.3 },
      { date: '2026-01-10', imc: 24.7 },
    ])
  })

  it('devuelve vacío sin altura o con pesos no válidos', () => {
    const entries = [
      { id: 1, localDate: '2026-01-05', weightKg: 80, createdAt: '' },
      { id: 2, localDate: '2026-01-06', weightKg: 0, createdAt: '' },
    ]
    expect(buildImcSeries(entries, 0)).toEqual([])
    expect(buildImcSeries(entries, 180)).toEqual([{ date: '2026-01-05', imc: 24.7 }])
  })
})

describe('buildBodyCompSeries', () => {
  it('deriva % grasa y masas por registro de pliegues', () => {
    const entries = [
      {
        id: 1,
        localDate: '2026-01-05',
        sex: 'male' as const,
        age: 30,
        weightKg: 80,
        sites: { triceps: 15, pectoral: 20, abdominal: 15, muslo: 5 },
        createdAt: '',
      },
    ]
    const points = buildBodyCompSeries(entries)
    expect(points).toHaveLength(1)
    expect(points[0].bodyFatPct).not.toBeNull()
    expect(points[0].fatMassKg).toBeGreaterThan(0)
    expect(points[0].fatFreeMassKg).toBeGreaterThan(0)
  })

  it('deja las masas en null cuando no hay peso registrado', () => {
    const entries = [
      {
        id: 1,
        localDate: '2026-01-05',
        sex: 'male' as const,
        age: 30,
        weightKg: null,
        sites: { triceps: 15, pectoral: 20, abdominal: 15, muslo: 5 },
        createdAt: '',
      },
    ]
    const points = buildBodyCompSeries(entries)
    expect(points[0].fatMassKg).toBeNull()
    expect(points[0].fatFreeMassKg).toBeNull()
  })
})

describe('buildRatiosSeries', () => {
  it('calcula WHtR y WHR por entrada de medidas', () => {
    const entries = [
      {
        id: 1,
        localDate: '2026-01-05',
        values: { cintura: 80, caderas: 100 },
        createdAt: '',
      },
    ]
    const points = buildRatiosSeries(entries, 170)
    expect(points).toEqual([{ date: '2026-01-05', whtr: 0.47, whr: 0.8 }])
  })

  it('omite entradas sin cintura y devuelve vacío si no hay ninguna', () => {
    const entries = [
      {
        id: 1,
        localDate: '2026-01-05',
        values: { cuello: 38 },
        createdAt: '',
      },
    ]
    expect(buildRatiosSeries(entries, 170)).toEqual([])
  })
})
