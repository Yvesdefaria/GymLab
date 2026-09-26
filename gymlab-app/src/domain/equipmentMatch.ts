import type { Equipment } from './types'

// Regla ÚNICA de disponibilidad: requerido ⊆ disponible; disponible vacío = sin filtro (entra todo).
// La comparten las DOS vías del resolutor (predefinida y generador). Duplicarla ya se pagó caro:
// el generador la tenía invertida y devolvía planes vacíos con dos equipos declarados.
export const fits = (required: readonly Equipment[], available: readonly Equipment[]): boolean =>
  available.length === 0 || required.every((eq) => available.includes(eq))
