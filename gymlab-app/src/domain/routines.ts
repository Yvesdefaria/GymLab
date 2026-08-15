// Utilidades de dominio para rutinas (los labels de objetivo/nivel viven en domain/catalog.ts).

// Rangos válidos [min, max] de los objetivos por serie en el builder de rutinas.
export const TARGET_BOUNDS: Record<'targetSets' | 'targetReps' | 'restSec', [number, number]> = {
  targetSets: [1, 99],
  targetReps: [1, 100],
  restSec: [1, 600],
}

export const slugify = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
