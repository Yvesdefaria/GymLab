// Módulo del catálogo EN (overlay en render). El seed y Dexie guardan los datos
// en español; estos helpers devuelven la versión EN cuando el idioma es 'en'.
// Los datos no se modifican: se copia con los campos traducidos.
import type { Exercise, Guide, Paper, Routine, RoutineDay } from '@/domain/types'
import type { AppLanguage } from '@/domain/onboarding'
import { EXERCISE_NAMES_EN } from './exerciseNamesEn'
import { INSTRUCTION_TEMPLATES_EN } from './instructionTemplatesEn'
import { CURATED_EXERCISES_EN } from './curatedExercisesEn'
import { STEPS_BY_INSTRUCTION } from './exerciseSteps'
import { STEPS_BY_INSTRUCTION_EN } from './exerciseStepsEn'
import { ROUTINES_EN, ROUTINE_DAYS_EN } from './routinesEn'
import { GUIDES_EN } from './guidesEn'
import { PAPERS_EN } from './papersEn'
import type { Equipment, ExerciseCategory, GuideCategory, MuscleGroup, Objective, Level } from '@/domain/types'
import { OBJECTIVE_LABELS, LEVEL_LABELS } from '@/domain/routines'
import {
  CATEGORY_LABELS_EN,
  CATEGORY_LABELS_ES,
  EQUIPMENT_LABELS_EN,
  MUSCLE_GROUP_LABELS_EN,
  MUSCLE_GROUP_LABELS_ES,
} from '@/domain/catalog'

// Etiquetas ES de las categorías de guía y temas de paper (hardcoded hoy en las páginas).
const GUIDE_CATEGORY_LABELS_ES: Record<GuideCategory, string> = {
  entrenamiento: 'Entrenamiento',
  nutricion: 'Nutrición',
  dietas: 'Dietas',
  suplementos: 'Suplementos',
  mujer: 'Mujer',
  recuperacion: 'Recuperación',
}

const PAPER_TOPIC_LABELS_ES: Record<string, string> = {
  hipertrofia: 'Hipertrofia',
  nutricion: 'Nutrición',
  entrenamiento: 'Entrenamiento',
  recuperacion: 'Recuperación',
}

// Etiquetas EN de objetivos y niveles de rutina (las de domain/routines.ts son ES).
export const OBJECTIVE_LABELS_EN: Record<Objective, string> = {
  volumen: 'Volume',
  definicion: 'Cut',
  fuerza: 'Strength',
  resistencia: 'Endurance',
  general: 'General',
}

export const LEVEL_LABELS_EN: Record<Level, string> = {
  principiante: 'Beginner',
  intermedio: 'Intermediate',
  avanzado: 'Advanced',
}

// Etiquetas EN de las categorías de guía y de los temas de paper (hardcoded ES en las páginas).
export const GUIDE_CATEGORY_LABELS_EN: Record<GuideCategory, string> = {
  entrenamiento: 'Training',
  nutricion: 'Nutrition',
  dietas: 'Diets',
  suplementos: 'Supplements',
  mujer: 'Women',
  recuperacion: 'Recovery',
}

export const PAPER_TOPIC_LABELS_EN: Record<string, string> = {
  hipertrofia: 'Hypertrophy',
  nutricion: 'Nutrition',
  entrenamiento: 'Training',
  recuperacion: 'Recovery',
}

export function localizeMuscleGroup(value: string, lang: AppLanguage): string {
  const labels = lang === 'en' ? MUSCLE_GROUP_LABELS_EN : MUSCLE_GROUP_LABELS_ES
  return labels[value as MuscleGroup] ?? value
}

export function localizeEquipment(value: string, lang: AppLanguage): string {
  return (lang === 'en' ? EQUIPMENT_LABELS_EN[value as Equipment] : undefined) ?? value
}

export function localizeCategory(value: string, lang: AppLanguage): string {
  const labels = lang === 'en' ? CATEGORY_LABELS_EN : CATEGORY_LABELS_ES
  return labels[value as ExerciseCategory] ?? value
}

export function localizeObjective(value: Objective, lang: AppLanguage): string {
  return (lang === 'en' ? OBJECTIVE_LABELS_EN[value] : undefined) ?? OBJECTIVE_LABELS[value]
}

export function localizeLevel(value: Level, lang: AppLanguage): string {
  return (lang === 'en' ? LEVEL_LABELS_EN[value] : undefined) ?? LEVEL_LABELS[value]
}

export function localizeGuideCategory(value: GuideCategory, lang: AppLanguage): string {
  return (lang === 'en' ? GUIDE_CATEGORY_LABELS_EN[value] : undefined) ?? GUIDE_CATEGORY_LABELS_ES[value]
}

export function localizePaperTopic(value: string, lang: AppLanguage): string {
  return (lang === 'en' ? PAPER_TOPIC_LABELS_EN[value] : undefined) ?? PAPER_TOPIC_LABELS_ES[value] ?? value
}

export function localizeExercise(exercise: Exercise, lang: AppLanguage): Exercise {
  if (lang === 'es') return exercise
  const curated = CURATED_EXERCISES_EN[exercise.slug]
  const name = curated?.name ?? EXERCISE_NAMES_EN[exercise.externalId ?? ''] ?? exercise.name
  const instructions = curated?.instructions ?? INSTRUCTION_TEMPLATES_EN[exercise.instructions] ?? exercise.instructions
  if (name === exercise.name && instructions === exercise.instructions) return exercise
  return { ...exercise, name, instructions }
}

export function localizeExerciseDetail(exercise: Exercise, lang: AppLanguage): Exercise {
  const curated = CURATED_EXERCISES_EN[exercise.slug]
  if (lang === 'es') {
    // El catálogo ampliado no guarda detailedSteps; se derivan en render desde la
    // plantilla de instrucciones (o la instrucción única de los curados).
    const detailedSteps = exercise.detailedSteps ?? STEPS_BY_INSTRUCTION[exercise.instructions]
    return detailedSteps === exercise.detailedSteps ? exercise : { ...exercise, detailedSteps }
  }
  const localized = localizeExercise(exercise, lang)
  const detailedSteps = curated?.detailedSteps ?? STEPS_BY_INSTRUCTION_EN[exercise.instructions] ?? exercise.detailedSteps
  if (detailedSteps === exercise.detailedSteps) return localized
  return { ...localized, detailedSteps }
}

export function localizeRoutine(routine: Routine, lang: AppLanguage): Routine {
  if (lang === 'es') return routine
  const en = ROUTINES_EN[routine.slug]
  if (!en) return routine
  return { ...routine, title: en.title, description: en.description }
}

export function localizeRoutineDay(day: RoutineDay, lang: AppLanguage): RoutineDay {
  if (lang === 'es') return day
  const name = ROUTINE_DAYS_EN[day.id]
  if (!name || name === day.name) return day
  return { ...day, name }
}

export function localizeGuide(guide: Guide, lang: AppLanguage): Guide {
  if (lang === 'es') return guide
  const en = GUIDES_EN[guide.slug]
  if (!en) return guide
  return {
    ...guide,
    title: en.title,
    summary: en.summary,
    keyPoints: en.keyPoints,
    sections: guide.sections?.map((section, i) => ({
      ...section,
      title: en.sections[i]?.title ?? section.title,
      content: en.sections[i]?.content ?? section.content,
      bullets: en.sections[i]?.bullets ?? section.bullets,
    })),
  }
}

export function localizePaper(paper: Paper, lang: AppLanguage): Paper {
  if (lang === 'es') return paper
  const en = PAPERS_EN[paper.slug]
  if (!en) return paper
  return { ...paper, summary: en.summary, keyPoints: en.keyPoints }
}
