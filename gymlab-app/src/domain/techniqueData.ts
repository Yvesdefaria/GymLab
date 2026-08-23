// Checklist de técnica: puntos clave por ejercicio para verificar forma.

export interface TechniquePoint {
  id: string
  labelKey: string
  descriptionKey: string
}

export interface TechniqueChecklist {
  exerciseId: number
  points: TechniquePoint[]
}

// Datos de técnica para ejercicios comunes.
export const TECHNIQUE_DATA: TechniqueChecklist[] = [
  {
    exerciseId: 1, // Sentadilla
    points: [
      { id: 's1', labelKey: 'technique.squat.neutralBack', descriptionKey: 'technique.squat.neutralBackDesc' },
      { id: 's2', labelKey: 'technique.squat.kneesAligned', descriptionKey: 'technique.squat.kneesAlignedDesc' },
      { id: 's3', labelKey: 'technique.squat.depth', descriptionKey: 'technique.squat.depthDesc' },
      { id: 's4', labelKey: 'technique.squat.weightOnHeels', descriptionKey: 'technique.squat.weightOnHeelsDesc' },
    ],
  },
  {
    exerciseId: 2, // Press de banca
    points: [
      { id: 'b1', labelKey: 'technique.bench.scapulaeRetracted', descriptionKey: 'technique.bench.scapulaeRetractedDesc' },
      { id: 'b2', labelKey: 'technique.bench.naturalArch', descriptionKey: 'technique.bench.naturalArchDesc' },
      { id: 'b3', labelKey: 'technique.bench.elbows45', descriptionKey: 'technique.bench.elbows45Desc' },
      { id: 'b4', labelKey: 'technique.bench.chestTouch', descriptionKey: 'technique.bench.chestTouchDesc' },
    ],
  },
  {
    exerciseId: 3, // Peso muerto
    points: [
      { id: 'p1', labelKey: 'technique.deadlift.neutralBack', descriptionKey: 'technique.deadlift.neutralBackDesc' },
      { id: 'p2', labelKey: 'technique.deadlift.barClose', descriptionKey: 'technique.deadlift.barCloseDesc' },
      { id: 'p3', labelKey: 'technique.deadlift.hipsFirst', descriptionKey: 'technique.deadlift.hipsFirstDesc' },
      { id: 'p4', labelKey: 'technique.deadlift.fullLockout', descriptionKey: 'technique.deadlift.fullLockoutDesc' },
    ],
  },
  {
    exerciseId: 4, // Press militar
    points: [
      { id: 'm1', labelKey: 'technique.ohp.coreBrace', descriptionKey: 'technique.ohp.coreBraceDesc' },
      { id: 'm2', labelKey: 'technique.ohp.elbowsForward', descriptionKey: 'technique.ohp.elbowsForwardDesc' },
      { id: 'm3', labelKey: 'technique.ohp.fullExtension', descriptionKey: 'technique.ohp.fullExtensionDesc' },
    ],
  },
  {
    exerciseId: 5, // Remo con barra
    points: [
      { id: 'r1', labelKey: 'technique.row.straightBack', descriptionKey: 'technique.row.straightBackDesc' },
      { id: 'r2', labelKey: 'technique.row.pullWithBack', descriptionKey: 'technique.row.pullWithBackDesc' },
      { id: 'r3', labelKey: 'technique.row.elbowsClose', descriptionKey: 'technique.row.elbowsCloseDesc' },
    ],
  },
]

// Obtiene la checklist de un ejercicio (si existe).
export const getTechniqueChecklist = (exerciseId: number): TechniqueChecklist | undefined =>
  TECHNIQUE_DATA.find((t) => t.exerciseId === exerciseId)
