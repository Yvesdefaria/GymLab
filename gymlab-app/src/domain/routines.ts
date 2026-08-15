// Etiquetas del catálogo de rutinas (objetivos y niveles) y utilidad para slugs.
import type { Level, Objective } from './types'

// Etiquetas de UI por objetivo de entrenamiento.
export const OBJECTIVE_LABELS: Record<Objective, string> = {
  volumen: 'Volumen',
  definicion: 'Definición',
  fuerza: 'Fuerza',
  resistencia: 'Resistencia',
  general: 'General',
}

// Etiquetas de UI por nivel de experiencia.
export const LEVEL_LABELS: Record<Level, string> = {
  principiante: 'Principiante',
  intermedio: 'Intermedio',
  avanzado: 'Avanzado',
}

// Normaliza un texto a slug: sin acentos, minúsculas, guiones entre palabras y máx. 60 caracteres.
export const slugify = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
