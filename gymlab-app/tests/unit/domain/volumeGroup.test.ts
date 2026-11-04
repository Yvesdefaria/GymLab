import { describe, expect, it } from 'vitest'
import {
  attributeVolume,
  SYNERGIST_FACTOR,
  synergistsOf,
  VOLUME_GROUPS,
  VOLUME_TARGETS,
  volumeGroupOf,
  volumeTarget,
} from '@/domain/volumeGroup'
import type { Exercise } from '@/domain/types'

const ex = (muscleGroup: Exercise['muscleGroup'], name: string, muscleZones?: Exercise['muscleZones']) =>
  ({ muscleGroup, name, slug: name.toLowerCase().replace(/\s+/g, '-'), muscleZones }) as Exercise

describe('volumeGroupOf', () => {
  it('separa pierna por zona', () => {
    expect(volumeGroupOf(ex('pierna', 'Sentadilla', ['pierna:cuadriceps']))).toBe('cuadriceps')
    expect(volumeGroupOf(ex('pierna', 'Curl femoral', ['pierna:femoral']))).toBe('isquios')
    expect(volumeGroupOf(ex('pierna', 'Elevación de gemelos', ['pierna:gemelo']))).toBe('gemelos')
  })

  it('hombro lateral y posterior cuentan como hombro; el anterior no', () => {
    expect(volumeGroupOf(ex('hombro', 'Elevación lateral', ['hombro:lateral']))).toBe('hombro')
    expect(volumeGroupOf(ex('hombro', 'Pájaros', ['hombro:posterior']))).toBe('hombro')
    expect(volumeGroupOf(ex('hombro', 'Press militar', ['hombro:anterior']))).toBeNull()
  })

  it('pierna sin zona queda sin clasificar', () => {
    expect(volumeGroupOf(ex('pierna', 'Ejercicio genérico'))).toBeNull()
  })

  it('abductores y aductores quedan sin clasificar', () => {
    expect(volumeGroupOf(ex('pierna', 'Abducción de cadera', ['pierna:abductor']))).toBeNull()
    expect(volumeGroupOf(ex('pierna', 'Aducción de cadera', ['pierna:aductor']))).toBeNull()
  })

  it('los grupos 1:1 caen al grupo aunque no tengan zona', () => {
    expect(volumeGroupOf(ex('pecho', 'Press banca'))).toBe('pecho')
    expect(volumeGroupOf(ex('espalda', 'Remo con barra'))).toBe('espalda')
    expect(volumeGroupOf(ex('biceps', 'Curl con barra'))).toBe('biceps')
    expect(volumeGroupOf(ex('gluteo', 'Hip thrust'))).toBe('gluteo')
  })

  it('el peso muerto se atribuye a isquios aunque el catálogo lo ponga en espalda', () => {
    expect(volumeGroupOf(ex('espalda', 'Peso muerto convencional', ['espalda:dorsal']))).toBe('isquios')
    expect(volumeGroupOf(ex('espalda', 'Peso muerto rumano', ['espalda:dorsal']))).toBe('isquios')
  })

  it('el press militar queda fuera de la banda de hombro (anterior)', () => {
    expect(volumeGroupOf(ex('hombro', 'Press militar con barra'))).toBeNull()
  })

  it('todas las bandas existen y son rangos válidos', () => {
    for (const group of VOLUME_GROUPS) {
      expect(volumeTarget(group)).toBeTruthy()
      expect(VOLUME_TARGETS[group].min).toBeLessThanOrEqual(VOLUME_TARGETS[group].max)
    }
  })

  it('el factor sinérgico es 0,5', () => {
    expect(SYNERGIST_FACTOR).toBe(0.5)
  })

  it('distingue excluido por diseño de sin datos', () => {
    expect(attributeVolume(ex('hombro', 'Press militar'))).toEqual({ kind: 'excluded' })
    expect(attributeVolume(ex('hombro', 'Elevación frontal con polea'))).toEqual({ kind: 'excluded' })
    expect(attributeVolume(ex('pierna', 'Ejercicio raro'))).toEqual({ kind: 'unknown' })
    expect(attributeVolume(ex('pierna', 'Sentadilla', ['pierna:cuadriceps']))).toEqual({
      kind: 'group',
      group: 'cuadriceps',
    })
  })

  it('excluye del volumen los ejercicios que no son series de hipertrofia (F138)', () => {
    expect(attributeVolume(ex('pierna', 'Cargada desde colgado'))).toEqual({ kind: 'excluded' })
    expect(attributeVolume(ex('pierna', 'Salto al cajón'))).toEqual({ kind: 'excluded' })
    expect(attributeVolume(ex('pierna', 'Bicicleta'))).toEqual({ kind: 'excluded' })
    expect(attributeVolume(ex('pierna', 'Círculos de tobillo'))).toEqual({ kind: 'excluded' })
    expect(attributeVolume(ex('pierna', 'Sentadilla'))).toEqual({ kind: 'group', group: 'cuadriceps' })
    expect(attributeVolume(ex('pierna', 'Buenos días con banda'))).toEqual({ kind: 'group', group: 'isquios' })
  })
})

// F138.3 — los 67 que quedaban sin atribuir en el inventario.
describe('F138.3 — sentadillas en plural y step-ups', () => {
  const real = (name: string, slug: string) => ({ muscleGroup: 'pierna', name, slug }) as Exercise

  it('atribuye al cuádriceps las sentadillas en plural', () => {
    expect(attributeVolume(real('Sentadillas con piernas cerradas', 'narrow-stance-squats'))).toEqual({
      kind: 'group',
      group: 'cuadriceps',
    })
    expect(attributeVolume(real('Sentadillas divididas', 'split-squats'))).toEqual({
      kind: 'group',
      group: 'cuadriceps',
    })
    expect(attributeVolume(real('Sentadillas sentadas', 'sit-squats'))).toEqual({
      kind: 'group',
      group: 'cuadriceps',
    })
    expect(attributeVolume(real('Sentadillas de jefferson', 'jefferson-squats'))).toEqual({
      kind: 'group',
      group: 'cuadriceps',
    })
  })

  it('atribuye los step-ups al cuádriceps y suma glúteo como sinérgico', () => {
    const stepUp = real('Pasos al cajón con barra', 'barbell-step-ups')
    expect(attributeVolume(stepUp)).toEqual({ kind: 'group', group: 'cuadriceps' })
    expect(synergistsOf(stepUp)).toEqual([{ group: 'gluteo', factor: SYNERGIST_FACTOR }])
  })

  it('atribuye al glúteo la hiperextensión inversa, el monster walk y las elevaciones laterales', () => {
    expect(attributeVolume(real('Hiperextensión inverso', 'reverse-hyperextension'))).toEqual({
      kind: 'group',
      group: 'gluteo',
    })
    expect(attributeVolume(real('Caminata del monstruo', 'monster-walk'))).toEqual({
      kind: 'group',
      group: 'gluteo',
    })
    expect(attributeVolume(real('Elevaciones laterales de pierna', 'side-leg-raises'))).toEqual({
      kind: 'group',
      group: 'gluteo',
    })
  })

  it('la hiperextensión inversa suma isquios como sinérgicos', () => {
    expect(synergistsOf(real('Hiperextensión inverso', 'reverse-hyperextension'))).toEqual([
      { group: 'isquios', factor: SYNERGIST_FACTOR },
    ])
  })
})

describe('F138.3 — excluir movilidad, estiramiento, cardio, drills y strongman', () => {
  const leg = (name: string, slug: string) => ({ muscleGroup: 'pierna', name, slug }) as Exercise
  const anyGroup = (muscleGroup: Exercise['muscleGroup'], name: string, slug: string) =>
    ({ muscleGroup, name, slug }) as Exercise

  it('excluye estiramientos y liberación miofascial', () => {
    expect(attributeVolume(leg('Estiramiento de cuádriceps', 'quad-stretch'))).toEqual({ kind: 'excluded' })
    expect(attributeVolume(leg('Hamstring-SMR', 'hamstring-smr'))).toEqual({ kind: 'excluded' })
    expect(attributeVolume(anyGroup('biceps', 'Brachialis-SMR', 'brachialis-smr'))).toEqual({
      kind: 'excluded',
    })
  })

  it('excluye cardio de máquina y carrera', () => {
    expect(attributeVolume(leg('Elíptica con máquina', 'elliptical-trainer'))).toEqual({ kind: 'excluded' })
    expect(attributeVolume(leg('Correr, cinta', 'running-treadmill'))).toEqual({ kind: 'excluded' })
    expect(attributeVolume(leg('Stairmaster', 'stairmaster'))).toEqual({ kind: 'excluded' })
    expect(attributeVolume(leg('Remo, estacionario', 'rowing-stationary'))).toEqual({ kind: 'excluded' })
    expect(attributeVolume(leg('Patinar', 'skating'))).toEqual({ kind: 'excluded' })
    expect(attributeVolume(leg('Banca esprint', 'bench-sprint'))).toEqual({ kind: 'excluded' })
    expect(attributeVolume(leg('Trail Running/Walking', 'trail-running-walking'))).toEqual({
      kind: 'excluded',
    })
  })

  it('excluye pliometría y drills de velocidad', () => {
    expect(attributeVolume(leg('Paso saltado al cajón', 'box-skip'))).toEqual({ kind: 'excluded' })
    expect(attributeVolume(leg('Paso lateral en cajón', 'side-to-side-box-shuffle'))).toEqual({
      kind: 'excluded',
    })
    expect(attributeVolume(leg('Front Cone Hops (or hurdle hops)', 'front-cone-hops-or-hurdle-hops'))).toEqual({
      kind: 'excluded',
    })
    expect(attributeVolume(leg('Empuje una pierna', 'single-leg-push-off'))).toEqual({ kind: 'excluded' })
    expect(attributeVolume(leg('Linear Acceleration Wall Drill', 'linear-acceleration-wall-drill'))).toEqual({
      kind: 'excluded',
    })
    expect(attributeVolume(leg('Escaleras de potencia', 'power-stairs'))).toEqual({ kind: 'excluded' })
  })

  it('excluye halterofilia, strongman y potencia balística', () => {
    expect(attributeVolume(leg('Split Jerk', 'split-jerk'))).toEqual({ kind: 'excluded' })
    expect(attributeVolume(leg('Caminata con yugo', 'yoke-walk'))).toEqual({ kind: 'excluded' })
    expect(attributeVolume(leg('Volteo de neumático', 'tire-flip'))).toEqual({ kind: 'excluded' })
    expect(attributeVolume(leg('Carga de saco de arena', 'sandbag-load'))).toEqual({ kind: 'excluded' })
    expect(attributeVolume(leg("Conan's Wheel", 'conans-wheel'))).toEqual({ kind: 'excluded' })
    expect(attributeVolume(leg('Prowler esprint', 'prowler-sprint'))).toEqual({ kind: 'excluded' })
    expect(attributeVolume(leg('Balanceos un brazo con kettlebell', 'one-arm-kettlebell-swings'))).toEqual({
      kind: 'excluded',
    })
  })

  it('excluye movilidad y yoga', () => {
    expect(attributeVolume(leg('Inchworm', 'inchworm'))).toEqual({ kind: 'excluded' })
    expect(attributeVolume(leg('Groiners', 'groiners'))).toEqual({ kind: 'excluded' })
    expect(attributeVolume(leg('Media langosta', 'one-half-locust'))).toEqual({ kind: 'excluded' })
    expect(attributeVolume(leg('Abertura', 'the-straddle'))).toEqual({ kind: 'excluded' })
    expect(attributeVolume(leg('Molinos', 'windmills'))).toEqual({ kind: 'excluded' })
    expect(attributeVolume(leg('Mirando al techo', 'looking-at-ceiling'))).toEqual({ kind: 'excluded' })
    expect(attributeVolume(leg('Toques de punta de pie', 'standing-toe-touches'))).toEqual({
      kind: 'excluded',
    })
    expect(attributeVolume(leg('Agarre espalda-pierna', 'upper-back-leg-grab'))).toEqual({
      kind: 'excluded',
    })
    expect(attributeVolume(leg('Ingle espalda estiramiento', 'groin-and-back-stretch'))).toEqual({
      kind: 'excluded',
    })
    expect(attributeVolume(leg('Flexor de cadera de rodillas', 'kneeling-hip-flexor'))).toEqual({
      kind: 'excluded',
    })
    expect(attributeVolume(leg('Cruces tumbado', 'lying-crossover'))).toEqual({ kind: 'excluded' })
    expect(attributeVolume(leg('Prono de cuádriceps tumbado', 'lying-prone-quadriceps'))).toEqual({
      kind: 'excluded',
    })
    expect(attributeVolume(leg('Moving Claw Series', 'moving-claw-series'))).toEqual({ kind: 'excluded' })
  })

  it('no excluye fuerza real que comparte palabras clave', () => {
    expect(attributeVolume(leg('Elevación de gemelos de pie con balanceo', 'rocking-standing-calf-raise'))).toEqual({
      kind: 'group',
      group: 'gemelos',
    })
    // El agarre de cargada es una sentadilla frontal, no una cargada.
    expect(attributeVolume(leg('Sentadilla frontal (cargada agarre)', 'front-squat-clean-grip'))).toEqual({
      kind: 'group',
      group: 'cuadriceps',
    })
    expect(attributeVolume(anyGroup('abdomen', 'Bicicleta en el aire', 'air-bike'))).toEqual({
      kind: 'group',
      group: 'abdomen',
    })
    expect(attributeVolume(anyGroup('abdomen', 'Molino con kettlebell', 'kettlebell-windmill'))).toEqual({
      kind: 'group',
      group: 'abdomen',
    })
    expect(attributeVolume(anyGroup('abdomen', 'Golpes de mazo', 'sledgehammer-swings'))).toEqual({
      kind: 'group',
      group: 'abdomen',
    })
    expect(attributeVolume(anyGroup('hombro', 'Press de empuje', 'push-press'))).toEqual({
      kind: 'group',
      group: 'hombro',
    })
    expect(attributeVolume(anyGroup('espalda', 'Remo con barra', 'barbell-row'))).toEqual({
      kind: 'group',
      group: 'espalda',
    })
    expect(attributeVolume(leg('Zancada caminando con barra', 'barbell-walking-lunge'))).toEqual({
      kind: 'group',
      group: 'cuadriceps',
    })
  })
})
