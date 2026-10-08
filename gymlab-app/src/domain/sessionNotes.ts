// Unificación de la nota de sesión (F84): la nota vive solo en Workout.notes.
// Une la escrita durante la sesión con la del journal post-entreno.

// Sin journal → sesión; sin sesión → journal; iguales → una; distintas →
// sesión + línea en blanco + journal. Trim de entradas; vacíos se descartan.
export const mergeSessionNotes = (sessionNote: string, journalNote?: string): string => {
  const session = sessionNote.trim()
  const journal = (journalNote ?? '').trim()
  if (!journal) return session
  if (!session) return journal
  if (session === journal) return session
  return `${session}\n\n${journal}`
}
