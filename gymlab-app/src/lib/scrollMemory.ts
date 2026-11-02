// Memoria de scroll por pantalla (F134/T4).
// Vive en memoria de módulo: sobrevive a navegar y volver, que es el caso que reportó
// el usuario. No escribe en storage ni dispara renders; guardar 0 borra la entrada
// para no acumular claves de pantallas que quedaron arriba del todo.
const positions = new Map<string, number>()

// La clave incluye la query: `?q=press` y `?q=curl` son listas distintas.
export const scrollKeyFor = (pathname: string, search = ''): string => `${pathname}${search}`

export const saveScroll = (key: string, y: number): void => {
  if (y <= 0) positions.delete(key)
  else positions.set(key, y)
}

export const readScroll = (key: string): number => positions.get(key) ?? 0

// Solo para tests: deja la memoria limpia entre casos.
export const clearScrollMemory = (): void => {
  positions.clear()
}
