import type { Routine, RoutineDay, RoutineItem } from '@/domain/types'

export const seedRoutines: Routine[] = [
  { id: 1, slug: 'ppl-volumen', title: 'PPL Volumen', objective: 'volumen', level: 'intermedio', description: 'Push/Pull/Legs de 6 días para hipertrofia máxima.', daysCount: 3 },
  { id: 2, slug: 'upper-lower', title: 'Upper/Lower 4 días', objective: 'volumen', level: 'intermedio', description: 'Tren superior/inferior 4 días por semana.', daysCount: 4 },
  { id: 3, slug: 'full-body-3x', title: 'Full Body 3x', objective: 'general', level: 'principiante', description: 'Cuerpo completo 3 días por semana. Ideal para empezar.', daysCount: 3 },
  { id: 4, slug: '5x5-stronglifts', title: '5×5 StrongLifts', objective: 'fuerza', level: 'principiante', description: '5 series de 5 repeticiones con cargas progresivas.', daysCount: 2 },
  { id: 5, slug: 'ppl-definicion', title: 'PPL Definición', objective: 'definicion', level: 'intermedio', description: 'PPL con menos descanso y más volumen para definir.', daysCount: 3 },
  { id: 6, slug: 'bro-split', title: 'Bro Split (1 músculo/día)', objective: 'volumen', level: 'avanzado', description: 'Un grupo muscular por día, alto volumen por sesión.', daysCount: 5 },
  { id: 7, slug: 'starting-strength', title: 'Starting Strength', objective: 'fuerza', level: 'principiante', description: 'Programa clásico de fuerza para principiantes.', daysCount: 3 },
  { id: 8, slug: 'torso-pierna', title: 'Torso/Pierna 4 días', objective: 'volumen', level: 'intermedio', description: 'Alterna torso y pierna 4 días por semana.', daysCount: 4 },
]

export const seedRoutineDays: RoutineDay[] = [
  // PPL Volumen
  { id: 1, routineId: 1, dayIndex: 0, name: 'Push (Pecho/Hombro/Tríceps)' },
  { id: 2, routineId: 1, dayIndex: 1, name: 'Pull (Espalda/Bíceps)' },
  { id: 3, routineId: 1, dayIndex: 2, name: 'Legs (Pierna/Glúteo)' },
  // Upper/Lower
  { id: 4, routineId: 2, dayIndex: 0, name: 'Upper A' },
  { id: 5, routineId: 2, dayIndex: 1, name: 'Lower A' },
  { id: 6, routineId: 2, dayIndex: 2, name: 'Upper B' },
  { id: 7, routineId: 2, dayIndex: 3, name: 'Lower B' },
  // Full Body 3x
  { id: 8, routineId: 3, dayIndex: 0, name: 'Full Body A' },
  { id: 9, routineId: 3, dayIndex: 1, name: 'Full Body B' },
  { id: 10, routineId: 3, dayIndex: 2, name: 'Full Body C' },
  // 5x5
  { id: 11, routineId: 4, dayIndex: 0, name: 'Workout A' },
  { id: 12, routineId: 4, dayIndex: 1, name: 'Workout B' },
  // PPL Definición
  { id: 13, routineId: 5, dayIndex: 0, name: 'Push' },
  { id: 14, routineId: 5, dayIndex: 1, name: 'Pull' },
  { id: 15, routineId: 5, dayIndex: 2, name: 'Legs' },
  // Bro Split
  { id: 16, routineId: 6, dayIndex: 0, name: 'Pecho' },
  { id: 17, routineId: 6, dayIndex: 1, name: 'Espalda' },
  { id: 18, routineId: 6, dayIndex: 2, name: 'Hombro' },
  { id: 19, routineId: 6, dayIndex: 3, name: 'Brazos' },
  { id: 20, routineId: 6, dayIndex: 4, name: 'Pierna' },
  // Starting Strength
  { id: 21, routineId: 7, dayIndex: 0, name: 'Workout A' },
  { id: 22, routineId: 7, dayIndex: 1, name: 'Workout B' },
  { id: 23, routineId: 7, dayIndex: 2, name: 'Workout A (sem 2)' },
  // Torso/Pierna
  { id: 24, routineId: 8, dayIndex: 0, name: 'Torso A' },
  { id: 25, routineId: 8, dayIndex: 1, name: 'Pierna A' },
  { id: 26, routineId: 8, dayIndex: 2, name: 'Torso B' },
  { id: 27, routineId: 8, dayIndex: 3, name: 'Pierna B' },
]

export const seedRoutineItems: RoutineItem[] = [
  // PPL Push
  { id: 1, routineDayId: 1, exerciseId: 1, targetSets: 4, targetReps: 8, restSec: 120, order: 1 },
  { id: 2, routineDayId: 1, exerciseId: 2, targetSets: 3, targetReps: 10, restSec: 90, order: 2 },
  { id: 3, routineDayId: 1, exerciseId: 24, targetSets: 3, targetReps: 12, restSec: 60, order: 3 },
  { id: 4, routineDayId: 1, exerciseId: 19, targetSets: 3, targetReps: 12, restSec: 60, order: 4 },
  // PPL Pull
  { id: 5, routineDayId: 2, exerciseId: 7, targetSets: 4, targetReps: 8, restSec: 120, order: 1 },
  { id: 6, routineDayId: 2, exerciseId: 8, targetSets: 3, targetReps: 10, restSec: 90, order: 2 },
  { id: 7, routineDayId: 2, exerciseId: 11, targetSets: 3, targetReps: 12, restSec: 60, order: 3 },
  { id: 8, routineDayId: 2, exerciseId: 14, targetSets: 3, targetReps: 12, restSec: 60, order: 4 },
  // PPL Legs
  { id: 9, routineDayId: 3, exerciseId: 27, targetSets: 4, targetReps: 8, restSec: 150, order: 1 },
  { id: 10, routineDayId: 3, exerciseId: 30, targetSets: 3, targetReps: 12, restSec: 90, order: 2 },
  { id: 11, routineDayId: 3, exerciseId: 31, targetSets: 3, targetReps: 12, restSec: 90, order: 3 },
  { id: 12, routineDayId: 3, exerciseId: 34, targetSets: 3, targetReps: 12, restSec: 90, order: 4 },
  // Upper A
  { id: 13, routineDayId: 4, exerciseId: 1, targetSets: 4, targetReps: 6, restSec: 150, order: 1 },
  { id: 14, routineDayId: 4, exerciseId: 7, targetSets: 3, targetReps: 8, restSec: 120, order: 2 },
  { id: 15, routineDayId: 4, exerciseId: 23, targetSets: 3, targetReps: 10, restSec: 90, order: 3 },
  { id: 16, routineDayId: 4, exerciseId: 13, targetSets: 3, targetReps: 10, restSec: 60, order: 4 },
  // Lower A
  { id: 17, routineDayId: 5, exerciseId: 27, targetSets: 4, targetReps: 6, restSec: 180, order: 1 },
  { id: 18, routineDayId: 5, exerciseId: 34, targetSets: 3, targetReps: 10, restSec: 90, order: 2 },
  { id: 19, routineDayId: 5, exerciseId: 31, targetSets: 3, targetReps: 12, restSec: 60, order: 3 },
  { id: 20, routineDayId: 5, exerciseId: 36, targetSets: 3, targetReps: 0, restSec: 45, order: 4 },
  // Full Body A
  { id: 21, routineDayId: 8, exerciseId: 27, targetSets: 3, targetReps: 8, restSec: 120, order: 1 },
  { id: 22, routineDayId: 8, exerciseId: 1, targetSets: 3, targetReps: 8, restSec: 90, order: 2 },
  { id: 23, routineDayId: 8, exerciseId: 8, targetSets: 3, targetReps: 8, restSec: 90, order: 3 },
  { id: 24, routineDayId: 8, exerciseId: 23, targetSets: 2, targetReps: 12, restSec: 60, order: 4 },
  { id: 25, routineDayId: 8, exerciseId: 13, targetSets: 2, targetReps: 12, restSec: 60, order: 5 },
  // 5x5 A
  { id: 26, routineDayId: 11, exerciseId: 27, targetSets: 5, targetReps: 5, restSec: 180, order: 1 },
  { id: 27, routineDayId: 11, exerciseId: 1, targetSets: 5, targetReps: 5, restSec: 180, order: 2 },
  { id: 28, routineDayId: 11, exerciseId: 12, targetSets: 5, targetReps: 5, restSec: 180, order: 3 },
  // 5x5 B
  { id: 29, routineDayId: 12, exerciseId: 27, targetSets: 5, targetReps: 5, restSec: 180, order: 1 },
  { id: 30, routineDayId: 12, exerciseId: 8, targetSets: 5, targetReps: 5, restSec: 180, order: 2 },
  { id: 31, routineDayId: 12, exerciseId: 22, targetSets: 5, targetReps: 5, restSec: 180, order: 3 },
]
