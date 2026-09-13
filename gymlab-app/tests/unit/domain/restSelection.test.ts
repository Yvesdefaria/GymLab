// Selección de descanso: precedencia preset explícito > restSec de rutina > heurística (F96, D2).
import { describe, expect, it } from 'vitest'
import { isAutoRestMode, resolveRestSeconds } from '@/domain/restSelection'

describe('restSelection — precedencia de descanso', () => {
  it('un preset explícito gana a la rutina y a la recomendación', () => {
    expect(
      resolveRestSeconds({ restMode: 90, routineRestSec: 180, autoRestSeconds: 240 })
    ).toBe(90)
  })

  it('sin preset explícito, el restSec de la rutina gana a la heurística', () => {
    expect(
      resolveRestSeconds({ restMode: 'auto', routineRestSec: 180, autoRestSeconds: 240 })
    ).toBe(180)
  })

  it('sin preset ni rutina, cae a la heurística recomendada (Auto)', () => {
    expect(
      resolveRestSeconds({ restMode: 'auto', routineRestSec: null, autoRestSeconds: 240 })
    ).toBe(240)
  })

  it('un preset de 0 s se respeta y no cae a la rutina', () => {
    expect(
      resolveRestSeconds({ restMode: 0, routineRestSec: 180, autoRestSeconds: 240 })
    ).toBe(0)
  })

  it('isAutoRestMode distingue el modo Auto de un preset numérico', () => {
    expect(isAutoRestMode('auto')).toBe(true)
    expect(isAutoRestMode(90)).toBe(false)
  })
})
