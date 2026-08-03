import type { Exercise } from '@/domain/types'

export const seedExercises: Exercise[] = [
  // Pecho
  { id: 1, slug: 'press-de-pecho-con-barra', name: 'Press de pecho con barra', muscleGroup: 'pecho', equipment: 'barra', instructions: 'Acuéstate en el banco, agarre ancho, baja la barra al pecho y empuja hacia arriba.' },
  { id: 2, slug: 'press-inclinado-mancuernas', name: 'Press inclinado con mancuernas', muscleGroup: 'pecho', equipment: 'mancuernas', instructions: 'Banco inclinado 30-45°, baja las mancuernas controlando y empuja hacia arriba.' },
  { id: 3, slug: 'aperturas-con-mancuernas', name: 'Aperturas con mancuernas', muscleGroup: 'pecho', equipment: 'mancuernas', instructions: 'Banco plano, abre los brazos con codos ligeramente flexionados hasta sentir estiramiento.' },
  { id: 4, slug: 'aperturas-en-maquina', name: 'Aperturas en máquina (pec-deck)', muscleGroup: 'pecho', equipment: 'maquina', instructions: 'Siéntate con la espalda recta, junta los brazos controlando el movimiento.' },
  { id: 5, slug: 'fondos-en-paralelas', name: 'Fondos en paralelas', muscleGroup: 'pecho', equipment: 'peso corporal', instructions: 'Agarra las barras, baja flexionando codos hasta 90° y sube empujando.' },
  { id: 6, slug: 'cruces-en-polea', name: 'Cruces en polea (cable fly)', muscleGroup: 'pecho', equipment: 'polea', instructions: 'De pie entre las poleas, cruza los brazos frente al pecho con control.' },

  // Espalda
  { id: 7, slug: 'dominadas', name: 'Dominadas (pull-ups)', muscleGroup: 'espalda', equipment: 'peso corporal', instructions: 'Agarre prono, sube hasta que la barbilla supere la barra, baja controlando.' },
  { id: 8, slug: 'remo-con-barra', name: 'Remo con barra', muscleGroup: 'espalda', equipment: 'barra', instructions: 'Inclina el torso 45°, tira de la barra hacia el abdomen, aprieta escápulas.' },
  { id: 9, slug: 'remo-con-mancuerna', name: 'Remo con mancuerna a una mano', muscleGroup: 'espalda', equipment: 'mancuernas', instructions: 'Apoya una mano en el banco, tira de la mancuerna hacia la cadera.' },
  { id: 10, slug: 'remo-en-maquina', name: 'Remo en máquina', muscleGroup: 'espalda', equipment: 'maquina', instructions: 'Siéntate con el pecho en el apoyo, tira de los mangos hacia ti.' },
  { id: 11, slug: 'jalón-al-pecho', name: 'Jalón al pecho en polea', muscleGroup: 'espalda', equipment: 'polea', instructions: 'Agarre ancho, tira de la barra hacia el pecho superior, aprieta escápulas.' },
  { id: 12, slug: 'peso-muerto', name: 'Peso muerto convencional', muscleGroup: 'espalda', equipment: 'barra', instructions: 'De pie, agarre ancho o mixto, levanta la barra desde el suelo manteniendo la espalda recta.' },

  // Bíceps
  { id: 13, slug: 'curl-con-barra', name: 'Curl de bíceps con barra', muscleGroup: 'biceps', equipment: 'barra', instructions: 'De pie, sube la barra flexionando los codos sin mover los hombros.' },
  { id: 14, slug: 'curl-con-mancuernas', name: 'Curl con mancuernas (martillo)', muscleGroup: 'biceps', equipment: 'mancuernas', instructions: 'De pie con mancuernas en pronación, sube alternando brazos.' },
  { id: 15, slug: 'curl-en-banco-inclinado', name: 'Curl en banco inclinado', muscleGroup: 'biceps', equipment: 'mancuernas', instructions: 'Banco inclinado 45°, deja caer los brazos y sube las mancuernas.' },
  { id: 16, slug: 'curl-en-polea', name: 'Curl de bíceps en polea baja', muscleGroup: 'biceps', equipment: 'polea', instructions: 'De pie frente a la polea, agarra la barra recta y sube sin mover los codos.' },
  { id: 17, slug: 'curl-concentrado', name: 'Curl concentrado', muscleGroup: 'biceps', equipment: 'mancuernas', instructions: 'Sentado, apoya el codo en el muslo interior, sube la mancuerna.' },

  // Tríceps
  { id: 18, slug: 'press-frances', name: 'Press francés (skull crusher)', muscleGroup: 'triceps', equipment: 'barra', instructions: 'Acostado, baja la barra a la frente flexionando codos, extiende los brazos.' },
  { id: 19, slug: 'extension-triceps-polea', name: 'Extensión de tríceps en polea alta', muscleGroup: 'triceps', equipment: 'polea', instructions: 'De pie, empuja la barra hacia abajo sin mover los codos.' },
  { id: 20, slug: 'fondos-en-banco', name: 'Fondos en banco (tríceps)', muscleGroup: 'triceps', equipment: 'banco', instructions: 'Manos en el borde del banco, baja flexionando codos y sube empujando.' },
  { id: 21, slug: 'extension-mancuerna-detras-cabeza', name: 'Extensión de tríceps con mancuerna detrás de la cabeza', muscleGroup: 'triceps', equipment: 'mancuernas', instructions: 'De pie o sentado, sostén la mancuerna sobre la cabeza y baja por detrás.' },

  // Hombro
  { id: 22, slug: 'press-militar', name: 'Press militar con barra', muscleGroup: 'hombro', equipment: 'barra', instructions: 'De pie, sube la barra desde los hombros hasta la extensión completa.' },
  { id: 23, slug: 'press-mancuernas-hombro', name: 'Press con mancuernas (hombro)', muscleGroup: 'hombro', equipment: 'mancuernas', instructions: 'Sentado o de pie, sube las mancuernas desde los hombros.' },
  { id: 24, slug: 'elevaciones-laterales', name: 'Elevaciones laterales', muscleGroup: 'hombro', equipment: 'mancuernas', instructions: 'De pie, eleva los brazos hasta la altura de los hombros con codos ligeramente flexionados.' },
  { id: 25, slug: 'elevaciones-frontales', name: 'Elevaciones frontales', muscleGroup: 'hombro', equipment: 'mancuernas', instructions: 'De pie, eleva los brazos al frente hasta la altura de los hombros.' },
  { id: 26, slug: 'elevaciones-posteriores', name: 'Elevaciones posteriores (face pull)', muscleGroup: 'hombro', equipment: 'polea', instructions: 'Con polea alta, tira de la cuerda hacia la cara separando las manos.' },

  // Pierna
  { id: 27, slug: 'sentadilla-con-barra', name: 'Sentadilla con barra', muscleGroup: 'pierna', equipment: 'barra', instructions: 'Barra en trapecios, baja hasta que los muslos estén paralelos al suelo.' },
  { id: 28, slug: 'sentadilla-goblet', name: 'Sentadilla goblet con mancuerna', muscleGroup: 'pierna', equipment: 'mancuernas', instructions: 'Sostén la mancuerna al pecho, baja flexionando caderas y rodillas.' },
  { id: 29, slug: 'prensa-de-piernas', name: 'Prensa de piernas', muscleGroup: 'pierna', equipment: 'maquina', instructions: 'Sentado en la máquina, baja la plataforma flexionando rodillas y empuja hacia arriba.' },
  { id: 30, slug: 'extension-de-piernas', name: 'Extensión de piernas (máquina)', muscleGroup: 'pierna', equipment: 'maquina', instructions: 'Sentado, extiende las rodillas contra la resistencia.' },
  { id: 31, slug: 'curl-femoral', name: 'Curl femoral (máquina o acostado)', muscleGroup: 'pierna', equipment: 'maquina', instructions: 'Acostado boca abajo, flexiona las rodillas contra la resistencia.' },
  { id: 32, slug: 'zancadas', name: 'Zancadas con mancuernas', muscleGroup: 'pierna', equipment: 'mancuernas', instructions: 'Da un paso largo hacia adelante y baja la rodilla trasera.' },
  { id: 33, slug: 'pistol-squat', name: 'Sentadilla a una pierna (pistol squat)', muscleGroup: 'pierna', equipment: 'peso corporal', instructions: 'Sentadilla a una pierna manteniendo la otra extendida al frente.' },

  // Glúteos
  { id: 34, slug: 'hip-thrust', name: 'Hip thrust', muscleGroup: 'gluteo', equipment: 'banco', instructions: 'Espalda apoyada en el banco, empuja caderas hacia arriba apretando glúteos.' },
  { id: 35, slug: 'peso-muerto-sumo', name: 'Peso muerto sumo', muscleGroup: 'gluteo', equipment: 'barra', instructions: 'Agarre estrecho, pies abiertos, baja la barra manteniendo la espalda recta.' },

  // Abdomen
  { id: 36, slug: 'plancha', name: 'Plancha (plank)', muscleGroup: 'abdomen', equipment: 'peso corporal', instructions: 'Apoyado en antebrazos y puntas de los pies, mantén el cuerpo recto.' },
  { id: 37, slug: 'crunch-en-maquina', name: 'Crunch en máquina', muscleGroup: 'abdomen', equipment: 'maquina', instructions: 'Sentado, flexiona el torso contra la resistencia.' },
  { id: 38, slug: 'hanging-leg-raise', name: 'Elevación de piernas colgado', muscleGroup: 'abdomen', equipment: 'peso corporal', instructions: 'Colgado de la barra, eleva las rodillas o piernas al pecho.' },

  // Trapecios
  { id: 39, slug: 'encogimientos-con-mancuernas', name: 'Encogimientos con mancuernas', muscleGroup: 'trapecios', equipment: 'mancuernas', instructions: 'De pie, eleva los hombros hacia las orejas manteniendo los brazos rectos.' },

  // Antebrazo
  { id: 40, slug: 'curl-de-muneca', name: 'Curl de muñeca con barra', muscleGroup: 'antebrazo', equipment: 'barra', instructions: 'Sentado, apoya los antebrazos en los muslos, flexiona las muñecas.' },
]
