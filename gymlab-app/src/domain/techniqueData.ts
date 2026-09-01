// Checklist de técnica: puntos clave por ejercicio para verificar forma.
// Matching por slug (patrón) en vez de ID para cubrir variaciones del mismo ejercicio.

export interface TechniquePoint {
  id: string
  labelKey: string
  descriptionKey: string
}

export interface TechniqueChecklist {
  slugPattern: RegExp
  points: TechniquePoint[]
}

// Datos de técnica para ejercicios compuestos principales.
// Orden importante: los patrones más específicos van ANTES de los más amplios
// porque getTechniqueChecklist usa find() (primer match).
export const TECHNIQUE_DATA: TechniqueChecklist[] = [
  {
    slugPattern: /zancada|lunge|zancadas|sentadilla-bulgara/i,
    points: [
      { id: 'lu1', labelKey: 'technique.lunge.tallTorso', descriptionKey: 'technique.lunge.tallTorsoDesc' },
      { id: 'lu2', labelKey: 'technique.lunge.kneeOverToe', descriptionKey: 'technique.lunge.kneeOverToeDesc' },
      { id: 'lu3', labelKey: 'technique.lunge.pushOff', descriptionKey: 'technique.lunge.pushOffDesc' },
    ],
  },
  {
    slugPattern: /squat|sentadilla/i,
    points: [
      { id: 's1', labelKey: 'technique.squat.neutralBack', descriptionKey: 'technique.squat.neutralBackDesc' },
      { id: 's2', labelKey: 'technique.squat.kneesAligned', descriptionKey: 'technique.squat.kneesAlignedDesc' },
      { id: 's3', labelKey: 'technique.squat.depth', descriptionKey: 'technique.squat.depthDesc' },
      { id: 's4', labelKey: 'technique.squat.weightOnHeels', descriptionKey: 'technique.squat.weightOnHeelsDesc' },
    ],
  },
  {
    slugPattern: /bench|banca|press-de-pecho|chest/i,
    points: [
      { id: 'b1', labelKey: 'technique.bench.scapulaeRetracted', descriptionKey: 'technique.bench.scapulaeRetractedDesc' },
      { id: 'b2', labelKey: 'technique.bench.naturalArch', descriptionKey: 'technique.bench.naturalArchDesc' },
      { id: 'b3', labelKey: 'technique.bench.elbows45', descriptionKey: 'technique.bench.elbows45Desc' },
      { id: 'b4', labelKey: 'technique.bench.chestTouch', descriptionKey: 'technique.bench.chestTouchDesc' },
    ],
  },
  {
    slugPattern: /deadlift|peso-muerto/i,
    points: [
      { id: 'p1', labelKey: 'technique.deadlift.neutralBack', descriptionKey: 'technique.deadlift.neutralBackDesc' },
      { id: 'p2', labelKey: 'technique.deadlift.barClose', descriptionKey: 'technique.deadlift.barCloseDesc' },
      { id: 'p3', labelKey: 'technique.deadlift.hipsFirst', descriptionKey: 'technique.deadlift.hipsFirstDesc' },
      { id: 'p4', labelKey: 'technique.deadlift.fullLockout', descriptionKey: 'technique.deadlift.fullLockoutDesc' },
    ],
  },
  {
    slugPattern: /overhead|press-militar|military|ohp/i,
    points: [
      { id: 'm1', labelKey: 'technique.ohp.coreBrace', descriptionKey: 'technique.ohp.coreBraceDesc' },
      { id: 'm2', labelKey: 'technique.ohp.elbowsForward', descriptionKey: 'technique.ohp.elbowsForwardDesc' },
      { id: 'm3', labelKey: 'technique.ohp.fullExtension', descriptionKey: 'technique.ohp.fullExtensionDesc' },
    ],
  },
  {
    slugPattern: /prensa-de-piernas|leg-press|prensa/i,
    points: [
      { id: 'lp1', labelKey: 'technique.legPress.feetPosition', descriptionKey: 'technique.legPress.feetPositionDesc' },
      { id: 'lp2', labelKey: 'technique.legPress.backOnPad', descriptionKey: 'technique.legPress.backOnPadDesc' },
      { id: 'lp3', labelKey: 'technique.legPress.depth', descriptionKey: 'technique.legPress.depthDesc' },
      { id: 'lp4', labelKey: 'technique.legPress.noLockout', descriptionKey: 'technique.legPress.noLockoutDesc' },
    ],
  },
  {
    slugPattern: /extension-de-piernas|leg-extension/i,
    points: [
      { id: 'le1', labelKey: 'technique.legExtension.kneeAlign', descriptionKey: 'technique.legExtension.kneeAlignDesc' },
      { id: 'le2', labelKey: 'technique.legExtension.fullExtend', descriptionKey: 'technique.legExtension.fullExtendDesc' },
      { id: 'le3', labelKey: 'technique.legExtension.controlled', descriptionKey: 'technique.legExtension.controlledDesc' },
    ],
  },
  {
    slugPattern: /curl-femoral|leg-curl|femoral/i,
    points: [
      { id: 'lc1', labelKey: 'technique.legCurl.padPosition', descriptionKey: 'technique.legCurl.padPositionDesc' },
      { id: 'lc2', labelKey: 'technique.legCurl.hipsDown', descriptionKey: 'technique.legCurl.hipsDownDesc' },
      { id: 'lc3', labelKey: 'technique.legCurl.squeeze', descriptionKey: 'technique.legCurl.squeezeDesc' },
    ],
  },
  {
    slugPattern: /gemelo|calf|pantorrilla/i,
    points: [
      { id: 'ca1', labelKey: 'technique.calf.fullRange', descriptionKey: 'technique.calf.fullRangeDesc' },
      { id: 'ca2', labelKey: 'technique.calf.stretch', descriptionKey: 'technique.calf.stretchDesc' },
      { id: 'ca3', labelKey: 'technique.calf.noBounce', descriptionKey: 'technique.calf.noBounceDesc' },
    ],
  },
  {
    slugPattern: /curl|biceps|hammer/i,
    points: [
      { id: 'c1', labelKey: 'technique.curl.elbowsStill', descriptionKey: 'technique.curl.elbowsStillDesc' },
      { id: 'c2', labelKey: 'technique.curl.noSwing', descriptionKey: 'technique.curl.noSwingDesc' },
      { id: 'c3', labelKey: 'technique.curl.squeezeTop', descriptionKey: 'technique.curl.squeezeTopDesc' },
    ],
  },
  {
    slugPattern: /press-frances|triceps|skull|patada-triceps|extension-triceps|fondos-en-banco/i,
    points: [
      { id: 't1', labelKey: 'technique.triceps.elbowsFixed', descriptionKey: 'technique.triceps.elbowsFixedDesc' },
      { id: 't2', labelKey: 'technique.triceps.fullExtend', descriptionKey: 'technique.triceps.fullExtendDesc' },
      { id: 't3', labelKey: 'technique.triceps.controlled', descriptionKey: 'technique.triceps.controlledDesc' },
    ],
  },
  {
    slugPattern: /elevaciones-laterales|lateral-raise|elevaciones-frontales|front-raise|face-pull|elevaciones-posteriores/i,
    points: [
      { id: 'd1', labelKey: 'technique.delt.isolation', descriptionKey: 'technique.delt.isolationDesc' },
      { id: 'd2', labelKey: 'technique.delt.lightWeight', descriptionKey: 'technique.delt.lightWeightDesc' },
      { id: 'd3', labelKey: 'technique.delt.control', descriptionKey: 'technique.delt.controlDesc' },
    ],
  },
  {
    slugPattern: /dominadas|pull-up|chin-up|jalon|lat-pulldown|pullover|jalon-al-pecho/i,
    points: [
      { id: 'pu1', labelKey: 'technique.pullup.elbowsDown', descriptionKey: 'technique.pullup.elbowsDownDesc' },
      { id: 'pu2', labelKey: 'technique.pullup.scapulae', descriptionKey: 'technique.pullup.scapulaeDesc' },
      { id: 'pu3', labelKey: 'technique.pullup.noSwing', descriptionKey: 'technique.pullup.noSwingDesc' },
    ],
  },
  {
    slugPattern: /plancha|plank|crunch|abdominal|sit-up|leg-raise|elevacion-de-piernas|hanging|eleva-las-rodillas/i,
    points: [
      { id: 'ab1', labelKey: 'technique.abs.lowBackFloor', descriptionKey: 'technique.abs.lowBackFloorDesc' },
      { id: 'ab2', labelKey: 'technique.abs.exhale', descriptionKey: 'technique.abs.exhaleDesc' },
      { id: 'ab3', labelKey: 'technique.abs.controlled', descriptionKey: 'technique.abs.controlledDesc' },
    ],
  },
  {
    slugPattern: /encogimiento|shrug|remo-al-menton|upright-row|eleva-los-hombros/i,
    points: [
      { id: 'tr1', labelKey: 'technique.traps.vertical', descriptionKey: 'technique.traps.verticalDesc' },
      { id: 'tr2', labelKey: 'technique.traps.noRoll', descriptionKey: 'technique.traps.noRollDesc' },
      { id: 'tr3', labelKey: 'technique.traps.control', descriptionKey: 'technique.traps.controlDesc' },
    ],
  },
  {
    slugPattern: /hip-thrust|gluteo|glute|patada-de-gluteo|empuje-de-cadera/i,
    points: [
      { id: 'g1', labelKey: 'technique.glute.hipsUp', descriptionKey: 'technique.glute.hipsUpDesc' },
      { id: 'g2', labelKey: 'technique.glute.squeeze', descriptionKey: 'technique.glute.squeezeDesc' },
      { id: 'g3', labelKey: 'technique.glute.chinTuck', descriptionKey: 'technique.glute.chinTuckDesc' },
    ],
  },
  {
    slugPattern: /fondos|dips|paralelas/i,
    points: [
      { id: 'di1', labelKey: 'technique.dips.elbows', descriptionKey: 'technique.dips.elbowsDesc' },
      { id: 'di2', labelKey: 'technique.dips.lean', descriptionKey: 'technique.dips.leanDesc' },
      { id: 'di3', labelKey: 'technique.dips.noLock', descriptionKey: 'technique.dips.noLockDesc' },
    ],
  },
  {
    slugPattern: /flexiones|push-up|pushup|lagartijas/i,
    points: [
      { id: 'f1', labelKey: 'technique.pushup.bodyLine', descriptionKey: 'technique.pushup.bodyLineDesc' },
      { id: 'f2', labelKey: 'technique.pushup.elbows', descriptionKey: 'technique.pushup.elbowsDesc' },
      { id: 'f3', labelKey: 'technique.pushup.chestDown', descriptionKey: 'technique.pushup.chestDownDesc' },
    ],
  },
  {
    slugPattern: /row|remo/i,
    points: [
      { id: 'r1', labelKey: 'technique.row.straightBack', descriptionKey: 'technique.row.straightBackDesc' },
      { id: 'r2', labelKey: 'technique.row.pullWithBack', descriptionKey: 'technique.row.pullWithBackDesc' },
      { id: 'r3', labelKey: 'technique.row.elbowsClose', descriptionKey: 'technique.row.elbowsCloseDesc' },
    ],
  },
]

// Obtiene la checklist de un ejercicio por su slug.
export const getTechniqueChecklist = (slug: string): TechniqueChecklist | undefined =>
  TECHNIQUE_DATA.find((t) => t.slugPattern.test(slug))
