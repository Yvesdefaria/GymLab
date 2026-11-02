// Pila de manejadores del botón back de Android.
// Un único listener nativo (useHardwareBack) recorre esta pila en LIFO: el último
// registrado gana, así un overlay abierto cierra antes que el guard de la sesión.
// Fundamento: el e2e web no ejercita este botón; sin esta pila, Capacitor aplica su
// default (history.back()) y abandona la pantalla con el sheet abierto (F134/T1).
export type BackHandler = () => boolean

const handlers: BackHandler[] = []

// Registra un handler y devuelve su desregistro (idempotente).
export const registerBackHandler = (handler: BackHandler): (() => void) => {
  handlers.push(handler)
  return () => {
    const index = handlers.lastIndexOf(handler)
    if (index >= 0) handlers.splice(index, 1)
  }
}

// Recorre la pila de más reciente a más viejo hasta que uno consuma el evento.
// Itera sobre una copia: un handler puede desregistrarse a sí mismo al cerrar su overlay.
export const runBackHandlers = (): boolean => {
  const snapshot = [...handlers]
  for (let i = snapshot.length - 1; i >= 0; i -= 1) {
    const handler = snapshot[i]
    if (handler?.()) return true
  }
  return false
}

// Solo para tests: deja la pila limpia entre casos.
export const resetBackHandlers = () => {
  handlers.length = 0
}
