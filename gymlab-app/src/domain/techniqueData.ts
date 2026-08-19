// Checklist de técnica: puntos clave por ejercicio para verificar forma.

export interface TechniquePoint {
  id: string
  label: string
  description: string
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
      { id: 's1', label: 'Espalda neutra', description: 'Mantén la espalda recta, sin redondear la lumbar.' },
      { id: 's2', label: 'Rodillas alineadas', description: 'Las rodillas siguen la dirección de los pies.' },
      { id: 's3', label: 'Profundidad', description: 'Baja hasta que los muslos estén al menos paralelos al suelo.' },
      { id: 's4', label: 'Peso en talones', description: 'El peso se distribuye en todo el pie, con énfasis en los talones.' },
    ],
  },
  {
    exerciseId: 2, // Press de banca
    points: [
      { id: 'b1', label: 'Escápulas retraídas', description: 'Mantén las escápulas juntas y abajo durante todo el movimiento.' },
      { id: 'b2', label: 'Arco natural', description: 'Arco leve en la espalda baja, glúteos en el banco.' },
      { id: 'b3', label: 'Codos a 45°', description: 'Los codos no se abren más de 75° respecto al torso.' },
      { id: 'b4', label: 'Toque en pecho', description: 'La barra toca el pecho en cada repetición.' },
    ],
  },
  {
    exerciseId: 3, // Peso muerto
    points: [
      { id: 'p1', label: 'Espalda neutra', description: 'Espalda recta desde la cabeza hasta la cadera.' },
      { id: 'p2', label: 'Barra cerca del cuerpo', description: 'La barra se mantiene pegada a las piernas.' },
      { id: 'p3', label: 'Caderas primero', description: 'Al subir, las caderas y hombros suben al mismo tiempo.' },
      { id: 'p4', label: 'Bloqueo completo', description: 'Extiende completamente las caderas en la parte superior.' },
    ],
  },
  {
    exerciseId: 4, // Press militar
    points: [
      { id: 'm1', label: 'Core firme', description: 'Mantén el abdomen contraído para estabilizar la espalda.' },
      { id: 'm2', label: 'Codos al frente', description: 'Los codos permanecen ligeramente por delante de la barra.' },
      { id: 'm3', label: 'Extensión completa', description: 'Bloquea los codos en la posición superior.' },
    ],
  },
  {
    exerciseId: 5, // Remo con barra
    points: [
      { id: 'r1', label: 'Espalda recta', description: 'Torso inclinado a 45° con espalda neutra.' },
      { id: 'r2', label: 'Tirar con espalda', description: 'Inicia el movimiento contrayendo las escápulas.' },
      { id: 'r3', label: 'Codos cerca del cuerpo', description: 'Los codos pasan cerca del torso, no se abren.' },
    ],
  },
]

// Obtiene la checklist de un ejercicio (si existe).
export const getTechniqueChecklist = (exerciseId: number): TechniqueChecklist | undefined =>
  TECHNIQUE_DATA.find((t) => t.exerciseId === exerciseId)
