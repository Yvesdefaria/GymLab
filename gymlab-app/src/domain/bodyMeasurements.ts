// Catálogos de guías y etiquetas para el registro de medidas corporales (cinta métrica y pliegues).
import type { BodyZone, BodyZoneGroup, Sex, SkinfoldSite } from './types'

export interface BodyZoneInfo {
  key: BodyZone
  label: string
  group: BodyZoneGroup
  side: 'center' | 'left' | 'right'
  guide: string
}

// Consejos de medición con cinta métrica que se muestran en la ficha de medidas.
export const BODY_ZONES: BodyZoneInfo[] = [
  {
    key: 'cuello',
    label: 'Cuello',
    group: 'tronco',
    side: 'center',
    guide: 'De pie, cabeza recta mirando al frente. Coloca la cinta justo debajo de la nuez de Adán y ciérrala horizontal, sin inclinarla.',
  },
  {
    key: 'hombros',
    label: 'Hombros',
    group: 'tronco',
    side: 'center',
    guide: 'De pie, con los brazos relajados a los lados. Mide el punto más ancho de los deltoides pasando por los hombros.',
  },
  {
    key: 'pecho',
    label: 'Pecho',
    group: 'tronco',
    side: 'center',
    guide: 'Con los brazos relajados, rodea el torso a la altura del pezón (hombres) o justo debajo del pecho (mujeres). Lee al final de una espiración.',
  },
  {
    key: 'cintura',
    label: 'Cintura',
    group: 'tronco',
    side: 'center',
    guide: 'Localiza el punto más estrecho del torso, por encima del ombligo. Al final de una espiración, ciérrala ahí, horizontal.',
  },
  {
    key: 'abdomen',
    label: 'Abdomen',
    group: 'tronco',
    side: 'center',
    guide: 'Mide a la altura del ombligo, con la cinta horizontal y pegada a la piel. Lee al final de una espiración.',
  },
  {
    key: 'caderas',
    label: 'Caderas',
    group: 'tronco',
    side: 'center',
    guide: 'De pie con los pies juntos, rodea la parte más ancha de los glúteos. Es la medida que suele superar a la cintura.',
  },
  {
    key: 'biceps_izq',
    label: 'Bíceps izq.',
    group: 'brazos',
    side: 'left',
    guide: 'Brazo relajado colgando junto al cuerpo. Mide el punto de mayor volumen del bíceps, a mitad del brazo.',
  },
  {
    key: 'biceps_der',
    label: 'Bíceps der.',
    group: 'brazos',
    side: 'right',
    guide: 'Brazo relajado colgando junto al cuerpo. Mide el punto de mayor volumen del bíceps, a mitad del brazo.',
  },
  {
    key: 'antebrazo_izq',
    label: 'Antebrazo izq.',
    group: 'brazos',
    side: 'left',
    guide: 'Brazo relajado con la palma hacia arriba. Mide la parte más ancha del antebrazo, justo debajo del codo.',
  },
  {
    key: 'antebrazo_der',
    label: 'Antebrazo der.',
    group: 'brazos',
    side: 'right',
    guide: 'Brazo relajado con la palma hacia arriba. Mide la parte más ancha del antebrazo, justo debajo del codo.',
  },
  {
    key: 'muneca_izq',
    label: 'Muñeca izq.',
    group: 'brazos',
    side: 'left',
    guide: 'Mide la parte más estrecha de la muñeca, justo por debajo del hueso del pulgar.',
  },
  {
    key: 'muneca_der',
    label: 'Muñeca der.',
    group: 'brazos',
    side: 'right',
    guide: 'Mide la parte más estrecha de la muñeca, justo por debajo del hueso del pulgar.',
  },
  {
    key: 'muslo_izq',
    label: 'Muslo izq.',
    group: 'piernas',
    side: 'left',
    guide: 'De pie, con el peso repartido y la pierna relajada. Mide la parte más ancha del muslo, justo debajo del glúteo.',
  },
  {
    key: 'muslo_der',
    label: 'Muslo der.',
    group: 'piernas',
    side: 'right',
    guide: 'De pie, con el peso repartido y la pierna relajada. Mide la parte más ancha del muslo, justo debajo del glúteo.',
  },
  {
    key: 'pantorrilla_izq',
    label: 'Pantorrilla izq.',
    group: 'piernas',
    side: 'left',
    guide: 'De pie, con los pies ligeramente separados. Mide el punto de mayor volumen de la pantorrilla.',
  },
  {
    key: 'pantorrilla_der',
    label: 'Pantorrilla der.',
    group: 'piernas',
    side: 'right',
    guide: 'De pie, con los pies ligeramente separados. Mide el punto de mayor volumen de la pantorrilla.',
  },
  {
    key: 'tobillo_izq',
    label: 'Tobillo izq.',
    group: 'piernas',
    side: 'left',
    guide: 'Mide la parte más estrecha del tobillo, justo por encima de la prominencia ósea.',
  },
  {
    key: 'tobillo_der',
    label: 'Tobillo der.',
    group: 'piernas',
    side: 'right',
    guide: 'Mide la parte más estrecha del tobillo, justo por encima de la prominencia ósea.',
  },
]

// Etiquetas de los grupos en que se agrupan las zonas (tronco, brazos, piernas).
export const BODY_ZONE_GROUP_LABELS: Record<BodyZoneGroup, string> = {
  tronco: 'Tronco',
  brazos: 'Brazos',
  piernas: 'Piernas',
}

export interface BodyZonePair {
  base: string
  left: BodyZone
  right: BodyZone
  label: string
}

// Pares de zonas simétricas (izquierda/derecha) para agregar y comparar ambos lados.
export const BODY_ZONE_PAIRS: BodyZonePair[] = [
  { base: 'biceps', left: 'biceps_izq', right: 'biceps_der', label: 'Bíceps' },
  { base: 'antebrazo', left: 'antebrazo_izq', right: 'antebrazo_der', label: 'Antebrazo' },
  { base: 'muneca', left: 'muneca_izq', right: 'muneca_der', label: 'Muñeca' },
  { base: 'muslo', left: 'muslo_izq', right: 'muslo_der', label: 'Muslo' },
  { base: 'pantorrilla', left: 'pantorrilla_izq', right: 'pantorrilla_der', label: 'Pantorrilla' },
  { base: 'tobillo', left: 'tobillo_izq', right: 'tobillo_der', label: 'Tobillo' },
]

export interface SkinfoldSiteInfo {
  key: SkinfoldSite
  label: string
  guide: string
}

// Puntos de medida de pliegues con la guía anatómica de colocación del picómetro.
export const SKINFOLD_SITES: SkinfoldSiteInfo[] = [
  {
    key: 'triceps',
    label: 'Tríceps',
    guide: 'Pliegue vertical en la parte posterior del brazo, en el punto medio entre el hombro (acromion) y el codo (olécranon). Brazo relajado.',
  },
  {
    key: 'subescapular',
    label: 'Subescapular',
    guide: 'Pliegue diagonal (sigue las líneas naturales de la piel), 1-2 cm por debajo del ángulo inferior del omóplato.',
  },
  {
    key: 'suprailiaco',
    label: 'Suprailíaco',
    guide: 'Pliegue diagonal justo por encima de la cresta de la cadera, sobre la línea axilar media.',
  },
  {
    key: 'abdominal',
    label: 'Abdominal',
    guide: 'Pliegue vertical, unos 2-3 cm a la derecha del ombligo. Relaja el abdomen.',
  },
  {
    key: 'muslo',
    label: 'Muslo',
    guide: 'Pliegue vertical en la parte anterior del muslo, en el punto medio entre la cadera y la rótula. Pierna relajada, peso en la otra.',
  },
  {
    key: 'pectoral',
    label: 'Pectoral',
    guide: 'Pliegue diagonal desde el pezón hacia la axila, en la línea axilar anterior, unos 1-2 cm lateralmente al pezón (en hombres).',
  },
  {
    key: 'axilar',
    label: 'Axilar',
    guide: 'Pliegue vertical en la línea axilar media, a la altura del esternón (apófisis xifoides). Brazo relajado.',
  },
]

// Etiqueta del sexo usado en los cálculos de composición corporal.
export const SEX_LABELS: Record<Sex, string> = {
  male: 'Hombre',
  female: 'Mujer',
}
