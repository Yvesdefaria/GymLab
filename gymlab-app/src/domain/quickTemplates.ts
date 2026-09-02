// Templates de sesión rápida: rutinas pre-armadas de 15-20 min.
export type QuickTemplateCategory = 'express' | 'stretch' | 'mobility'

export interface QuickTemplateExercise {
  id: string
  /** Id real del ejercicio en el catálogo (>0) para sesión/estadísticas reales. */
  exerciseId: number
  nameKey: string
  descriptionKey: string
  durationSeconds: number
}

export interface QuickTemplate {
  id: string
  nameKey: string
  descriptionKey: string
  category: QuickTemplateCategory
  exercises: QuickTemplateExercise[]
  totalMinutes: number
}

// Plantillas predefinidas.
export const quickTemplates: QuickTemplate[] = [
  // Express
  {
    id: 'full-body-express',
    nameKey: 'quickTemplates.fullBodyExpress',
    descriptionKey: 'quickTemplates.fullBodyExpressDesc',
    category: 'express',
    totalMinutes: 15,
    exercises: [
      { id: 'fe', exerciseId: 42, 'nameKey': 'quickTemplates.exercises.pushups', 'descriptionKey': 'quickTemplates.exercises.pushupsDesc', durationSeconds: 45 },
      { id: 'fe', exerciseId: 1086, 'nameKey': 'quickTemplates.exercises.squats', 'descriptionKey': 'quickTemplates.exercises.squatsDesc', durationSeconds: 45 },
      { id: 'fe', exerciseId: 36, 'nameKey': 'quickTemplates.exercises.plank', 'descriptionKey': 'quickTemplates.exercises.plankDesc', durationSeconds: 45 },
      { id: 'fe', exerciseId: 32, 'nameKey': 'quickTemplates.exercises.lunges', 'descriptionKey': 'quickTemplates.exercises.lungesDesc', durationSeconds: 45 },
      { id: 'fe', exerciseId: 1741, 'nameKey': 'quickTemplates.exercises.starJump', 'descriptionKey': 'quickTemplates.exercises.starJumpDesc', durationSeconds: 45 },
      { id: 'fe', exerciseId: 1438, 'nameKey': 'quickTemplates.exercises.mountainClimbers', 'descriptionKey': 'quickTemplates.exercises.mountainClimbersDesc', durationSeconds: 45 },
    ],
  },
  {
    id: 'core-express',
    nameKey: 'quickTemplates.coreExpress',
    descriptionKey: 'quickTemplates.coreExpressDesc',
    category: 'express',
    totalMinutes: 12,
    exercises: [
      { id: 'ce', exerciseId: 36, 'nameKey': 'quickTemplates.exercises.plank', 'descriptionKey': 'quickTemplates.exercises.plankDesc', durationSeconds: 45 },
      { id: 'ce', exerciseId: 1006, 'nameKey': 'quickTemplates.exercises.bicycleCrunches', 'descriptionKey': 'quickTemplates.exercises.bicycleCrunchesDesc', durationSeconds: 45 },
      { id: 'ce', exerciseId: 1625, 'nameKey': 'quickTemplates.exercises.sideLegRaises', 'descriptionKey': 'quickTemplates.exercises.sideLegRaisesDesc', durationSeconds: 45 },
      { id: 'ce', exerciseId: 1438, 'nameKey': 'quickTemplates.exercises.mountainClimbers', 'descriptionKey': 'quickTemplates.exercises.mountainClimbersDesc', durationSeconds: 45 },
    ],
  },
  // Stretch
  {
    id: 'full-body-stretch',
    nameKey: 'quickTemplates.fullBodyStretch',
    descriptionKey: 'quickTemplates.fullBodyStretchDesc',
    category: 'stretch',
    totalMinutes: 10,
    exercises: [
      { id: 'fs', exerciseId: 1007, 'nameKey': 'quickTemplates.exercises.quadStretch', 'descriptionKey': 'quickTemplates.exercises.quadStretchDesc', durationSeconds: 30 },
      { id: 'fs', exerciseId: 1001, 'nameKey': 'quickTemplates.exercises.hamstringStretch', 'descriptionKey': 'quickTemplates.exercises.hamstringStretchDesc', durationSeconds: 30 },
      { id: 'fs', exerciseId: 1754, 'nameKey': 'quickTemplates.exercises.chestOpener', 'descriptionKey': 'quickTemplates.exercises.chestOpenerDesc', durationSeconds: 30 },
      { id: 'fs', exerciseId: 1311, 'nameKey': 'quickTemplates.exercises.childPose', 'descriptionKey': 'quickTemplates.exercises.childPoseDesc', durationSeconds: 30 },
      { id: 'fs', exerciseId: 1335, 'nameKey': 'quickTemplates.exercises.neckRoll', 'descriptionKey': 'quickTemplates.exercises.neckRollDesc', durationSeconds: 30 },
    ],
  },
  {
    id: 'pre-sleep-stretch',
    nameKey: 'quickTemplates.preSleepStretch',
    descriptionKey: 'quickTemplates.preSleepStretchDesc',
    category: 'stretch',
    totalMinutes: 8,
    exercises: [
      { id: 'ps', exerciseId: 1412, 'nameKey': 'quickTemplates.exercises.supineTwist', 'descriptionKey': 'quickTemplates.exercises.supineTwistDesc', durationSeconds: 45 },
      { id: 'ps', exerciseId: 1754, 'nameKey': 'quickTemplates.exercises.childPose', 'descriptionKey': 'quickTemplates.exercises.childPoseDesc', durationSeconds: 45 },
      { id: 'ps', exerciseId: 1363, 'nameKey': 'quickTemplates.exercises.catCow', 'descriptionKey': 'quickTemplates.exercises.catCowDesc', durationSeconds: 45 },
      { id: 'ps', exerciseId: 1541, 'nameKey': 'quickTemplates.exercises.legsUp', 'descriptionKey': 'quickTemplates.exercises.legsUpDesc', durationSeconds: 60 },
    ],
  },
  // Mobility
  {
    id: 'joint-mobility',
    nameKey: 'quickTemplates.jointMobility',
    descriptionKey: 'quickTemplates.jointMobilityDesc',
    category: 'mobility',
    totalMinutes: 12,
    exercises: [
      { id: 'jm', exerciseId: 1363, 'nameKey': 'quickTemplates.exercises.ankleCircles', 'descriptionKey': 'quickTemplates.exercises.ankleCirclesDesc', durationSeconds: 30 },
      { id: 'jm', exerciseId: 1719, 'nameKey': 'quickTemplates.exercises.hipCircles', 'descriptionKey': 'quickTemplates.exercises.hipCirclesDesc', durationSeconds: 30 },
      { id: 'jm', exerciseId: 1625, 'nameKey': 'quickTemplates.exercises.sideLegRaises', 'descriptionKey': 'quickTemplates.exercises.sideLegRaisesDesc', durationSeconds: 30 },
      { id: 'jm', exerciseId: 1814, 'nameKey': 'quickTemplates.exercises.wristsCircles', 'descriptionKey': 'quickTemplates.exercises.wristsCirclesDesc', durationSeconds: 30 },
      { id: 'jm', exerciseId: 1336, 'nameKey': 'quickTemplates.exercises.neckRoll', 'descriptionKey': 'quickTemplates.exercises.neckRollDesc', durationSeconds: 30 },
    ],
  },
]

// Categorías con label i18n.
export const templateCategories: { key: QuickTemplateCategory; labelKey: string }[] = [
  { key: 'express', labelKey: 'quickTemplates.categories.express' },
  { key: 'stretch', labelKey: 'quickTemplates.categories.stretch' },
  { key: 'mobility', labelKey: 'quickTemplates.categories.mobility' },
]
