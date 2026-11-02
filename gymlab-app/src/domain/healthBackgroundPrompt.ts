// Política del pedido de lectura de salud en segundo plano (widget sin abrir la app).
// Puro y testeable: decide SI corresponde pedir, no cómo. Tres estados:
// - ask:   nunca se pidió; el arranque puede pedirlo UNA vez.
// - asked: ya se pidió (concedido o no); no volver a interrumpir. El botón de
//          Ajustes sigue disponible siempre.
// - never: el usuario eligió no volver a ser preguntado.
export type BackgroundPromptState = 'ask' | 'asked' | 'never'

export const parseBackgroundPromptState = (raw: string): BackgroundPromptState => {
  if (raw === 'asked' || raw === 'never') return raw
  return 'ask'
}

// `request` solo si el permiso existe en el dispositivo, falta, y el usuario todavía
// no decidió que no quiere que le preguntemos más.
export const nextBackgroundPromptAction = (
  available: boolean,
  granted: boolean,
  state: BackgroundPromptState,
): 'request' | 'none' => {
  if (!available || granted) return 'none'
  return state === 'ask' ? 'request' : 'none'
}
