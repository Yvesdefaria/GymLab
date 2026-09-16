import { describe, expect, it } from 'vitest'
import { seedExercises } from '@/data/seed/exercises'
import { seedExercisesExtra } from '@/data/seed/exercisesExtra'

// Equipamiento con banco (WP0b): ejercicios que exigen un banco de entrenamiento
// LIBRE y desmontable (plano / inclinado / declinado / predicador) como parte del setup.
// El banco integrado a una máquina o estación Smith NO cuenta (mismo criterio para todos).
// Los 112 del catálogo ampliado vienen de la lista del plan; `fondos-en-banco` e
// `hip-thrust` ya venían etiquetados en el seed curado y no se deben perder.
// Cualquier ejercicio con `banco` que NO esté acá es un falso positivo a revisar.
const CON_BANCO = new Set([
  // pierna.ts (2)
  'barbell-seated-calf-raise',
  'dumbbell-seated-one-leg-calf-raise',
  // hombro.ts (22)
  'anti-gravity-press',
  'barbell-incline-shoulder-raise',
  'barbell-shoulder-press',
  'bent-over-dumbbell-rear-delt-raise-with-head-on-bench',
  'bradford-rocky-presses',
  'cable-seated-lateral-raise',
  'dumbbell-incline-shoulder-raise',
  'dumbbell-lying-one-arm-rear-lateral-raise',
  'dumbbell-lying-rear-lateral-raise',
  'external-rotation',
  'front-incline-dumbbell-raise',
  'lying-one-arm-lateral-raise',
  'lying-rear-delt-raise',
  'one-arm-incline-lateral-raise',
  'reverse-flyes',
  'reverse-flyes-with-external-rotation',
  'seated-barbell-military-press',
  'seated-bent-over-rear-delt-raise',
  'seated-dumbbell-press',
  'seated-side-lateral-raise',
  'smith-incline-shoulder-raise',
  'straight-raises-on-incline-bench',
  // espalda.ts (5)
  'bent-arm-barbell-pullover',
  'dumbbell-incline-row',
  'incline-bench-pull',
  'lying-cambered-barbell-row',
  'straight-bar-bench-mid-rows',
  // abdomen.ts (10)
  'barbell-rollout-from-bench',
  'cable-seated-crunch',
  'decline-crunch',
  'decline-oblique-crunch',
  'decline-reverse-crunch',
  'flat-bench-lying-leg-raise',
  'press-sit-up',
  'seated-barbell-twist',
  'seated-flat-bench-leg-pull-in',
  'seated-leg-tucks',
  // antebrazo.ts (12)
  'cable-wrist-curl',
  'dumbbell-lying-pronation',
  'dumbbell-lying-supination',
  'palms-down-dumbbell-wrist-curl-over-a-bench',
  'palms-down-wrist-curl-over-a-bench',
  'palms-up-barbell-wrist-curl-over-a-bench',
  'palms-up-dumbbell-wrist-curl-over-a-bench',
  'seated-dumbbell-palms-down-wrist-curl',
  'seated-dumbbell-palms-up-wrist-curl',
  'seated-one-arm-dumbbell-palms-down-wrist-curl',
  'seated-one-arm-dumbbell-palms-up-wrist-curl',
  'seated-two-arm-palms-up-low-pulley-wrist-curl',
  // pecho.ts (24)
  'around-the-worlds',
  'barbell-guillotine-bench-press',
  'barbell-incline-bench-press-medium-grip',
  'bench-press-with-bands',
  'bent-arm-dumbbell-pullover',
  'chain-press',
  'decline-dumbbell-bench-press',
  'decline-dumbbell-flyes',
  'dumbbell-bench-press',
  'dumbbell-bench-press-with-neutral-grip',
  'flat-bench-cable-flyes',
  'front-raise-and-pullover',
  'hammer-grip-incline-db-bench-press',
  'incline-cable-flye',
  'incline-cable-chest-press',
  'incline-dumbbell-bench-with-palms-facing-in',
  'incline-dumbbell-flyes',
  'incline-dumbbell-flyes-with-a-twist',
  'neck-press',
  'one-arm-flat-bench-dumbbell-flye',
  'one-arm-dumbbell-bench-press',
  'push-ups-with-feet-elevated',
  'wide-grip-barbell-bench-press',
  'wide-grip-decline-barbell-pullover',
  // triceps.ts (20)
  'bench-dips',
  'bench-press-powerlifting',
  'bench-press-with-chains',
  'board-press',
  'close-grip-dumbbell-press',
  'close-grip-ez-bar-press',
  'decline-close-grip-bench-to-skull-crusher',
  'decline-dumbbell-triceps-extension',
  'decline-ez-bar-triceps-extension',
  'incline-barbell-triceps-extension',
  'jm-press',
  'lying-close-grip-barbell-triceps-extension-behind-the-head',
  'lying-close-grip-barbell-triceps-press-to-chin',
  'lying-dumbbell-tricep-extension',
  'lying-triceps-press',
  'reverse-band-bench-press',
  'reverse-triceps-bench-press',
  'seated-bent-over-one-arm-dumbbell-triceps-extension',
  'seated-bent-over-two-arm-dumbbell-triceps-extension',
  'tate-press',
  // biceps.ts (17)
  'alternate-incline-dumbbell-curl',
  'barbell-curls-lying-against-an-incline',
  'dumbbell-prone-incline-curl',
  'flexor-incline-dumbbell-curls',
  'incline-hammer-curls',
  'incline-inner-biceps-curl',
  'lying-high-bench-barbell-curl',
  'lying-supine-dumbbell-curl',
  'one-arm-dumbbell-preacher-curl',
  'preacher-hammer-dumbbell-curl',
  'reverse-barbell-preacher-curls',
  'seated-close-grip-concentration-barbell-curl',
  'seated-dumbbell-curl',
  'seated-dumbbell-inner-biceps-curl',
  'spider-curl',
  'two-arm-dumbbell-preacher-curl',
  'zottman-preacher-curl',
  // seed curado: ya declaraban banco antes de WP0b
  'fondos-en-banco',
  'hip-thrust',
  // Añadidos al revisar el pase: banco libre exigido, sin sustituto equivalente.
  // (Quedaron FUERA a propósito los Smith/máquina con banco integrado, y los que
  // admiten colchoneta, cajón o el predicador propio de una estación de polea.)
  'press-inclinado-mancuernas',
  'wide-grip-decline-barbell-bench-press',
  'standing-one-arm-dumbbell-curl-over-incline-bench',
])

const all = [...seedExercises, ...seedExercisesExtra]

describe('tagging de banco', () => {
  it('todos los ejercicios de la lista declaran banco', () => {
    const missing = all.filter((ex) => CON_BANCO.has(ex.slug) && !ex.equipment.includes('banco'))
    expect(missing.map((e) => e.slug)).toEqual([])
  })

  it('ningún ejercicio declara banco sin estar en la lista', () => {
    const extra = all.filter((ex) => ex.equipment.includes('banco') && !CON_BANCO.has(ex.slug))
    expect(extra.map((e) => e.slug)).toEqual([])
  })

  it('todo ejercicio declara al menos un equipamiento', () => {
    const empty = all.filter((ex) => ex.equipment.length === 0)
    expect(empty.map((e) => e.slug)).toEqual([])
  })

  it('conserva el tag curado que ya existía (no se quita)', () => {
    const curated = seedExercises.filter((ex) => ex.slug === 'fondos-en-banco' || ex.slug === 'hip-thrust')
    expect(curated.map((e) => e.slug)).toHaveLength(2)
    expect(curated.every((e) => e.equipment.includes('banco'))).toBe(true)
  })
})
