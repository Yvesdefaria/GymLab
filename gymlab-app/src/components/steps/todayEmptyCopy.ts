// F136.2 — el vacío del detalle por hora elige el copy según la fuente real del dato.
// Antes se atribuía a «alta manual» un día importado de salud (source: phone/watch).
import type { StepSource } from '@/domain/types'

export type TodayEmptyCopyKey =
  | 'todayEmptyText'
  | 'todayEmptyManualText'
  | 'todayEmptyHealthText'
  | 'todayEmptyErrorText'
  | 'todayEmptyNeutralText'

export const todayEmptyTextKey = (
  source: StepSource | null | undefined,
  healthConnected: boolean,
): TodayEmptyCopyKey => {
  if (source === 'manual') {
    return healthConnected ? 'todayEmptyManualText' : 'todayEmptyText'
  }
  if (source === 'phone' || source === 'watch') {
    return healthConnected ? 'todayEmptyErrorText' : 'todayEmptyHealthText'
  }
  return 'todayEmptyNeutralText'
}
