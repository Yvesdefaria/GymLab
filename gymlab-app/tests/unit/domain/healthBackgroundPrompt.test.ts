// Política del pedido de salud en segundo plano (widget): un "cancelar" no puede
// dejar el permiso inalcanzable ni convertir el arranque en un diálogo eterno.
import { describe, expect, it } from 'vitest'
import {
  nextBackgroundPromptAction,
  parseBackgroundPromptState,
} from '@/domain/healthBackgroundPrompt'

describe('parseBackgroundPromptState', () => {
  it('valores conocidos se conservan', () => {
    expect(parseBackgroundPromptState('asked')).toBe('asked')
    expect(parseBackgroundPromptState('never')).toBe('never')
  })

  it('vacío o desconocido cae en ask (default de instalación nueva)', () => {
    expect(parseBackgroundPromptState('')).toBe('ask')
    expect(parseBackgroundPromptState('cualquier-cosa')).toBe('ask')
  })
})

describe('nextBackgroundPromptAction', () => {
  it('con el permiso ya concedido no se pide nada', () => {
    expect(nextBackgroundPromptAction(true, true, 'ask')).toBe('none')
  })

  it('sin soporte en el dispositivo no se pide nada', () => {
    expect(nextBackgroundPromptAction(false, false, 'ask')).toBe('none')
  })

  it('disponible, sin permiso y sin pedido previo → pide una vez', () => {
    expect(nextBackgroundPromptAction(true, false, 'ask')).toBe('request')
  })

  it('ya pedido antes → no vuelve a interrumpir', () => {
    expect(nextBackgroundPromptAction(true, false, 'asked')).toBe('none')
  })

  it('el usuario eligió no volver a ser preguntado → nunca automático', () => {
    expect(nextBackgroundPromptAction(true, false, 'never')).toBe('none')
  })
})
