// Palabra de confirmación del reset de fábrica (F112, D2): type-to-confirm para
// evitar resets accidentales. Pura y compartida por la UI y sus tests.
export const RESET_CONFIRMATION_WORD = 'BORRAR'

// Comparación trim + case-insensitive contra la palabra (spec §4.2.2).
export const matchesResetConfirmation = (value: string): boolean =>
  value.trim().toUpperCase() === RESET_CONFIRMATION_WORD
