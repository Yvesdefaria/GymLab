// Registro central de ayudas (F90): mapea cada id al par de claves i18n.
// Si un id no tiene claves reales en el esquema es, no compila (I18nKey).
import type { I18nKey } from '@/i18n'

export const HELP_IDS = [
  'recovery',
  'deload',
  'insightAlza',
  'insightDescenso',
  'insightEstable',
  'grasa',
  'medidasCorporales',
  'volumen',
  'volumenMuscular',
  'carga',
  'e1rm',
  'frecuencia',
  'pushPull',
  'imc',
  'ratios',
  'rpe',
  'rir',
] as const

export type HelpId = (typeof HELP_IDS)[number]

export type HelpValues = Record<string, string | number>

export const HELP: Record<HelpId, { label: I18nKey; body: I18nKey }> = {
  recovery: { label: 'help.recovery.label', body: 'help.recovery.body' },
  deload: { label: 'help.deload.label', body: 'help.deload.body' },
  insightAlza: { label: 'help.insightAlza.label', body: 'help.insightAlza.body' },
  insightDescenso: { label: 'help.insightDescenso.label', body: 'help.insightDescenso.body' },
  insightEstable: { label: 'help.insightEstable.label', body: 'help.insightEstable.body' },
  grasa: { label: 'help.grasa.label', body: 'help.grasa.body' },
  medidasCorporales: { label: 'help.medidasCorporales.label', body: 'help.medidasCorporales.body' },
  volumen: { label: 'help.volumen.label', body: 'help.volumen.body' },
  volumenMuscular: { label: 'help.volumenMuscular.label', body: 'help.volumenMuscular.body' },
  carga: { label: 'help.carga.label', body: 'help.carga.body' },
  e1rm: { label: 'help.e1rm.label', body: 'help.e1rm.body' },
  frecuencia: { label: 'help.frecuencia.label', body: 'help.frecuencia.body' },
  pushPull: { label: 'help.pushPull.label', body: 'help.pushPull.body' },
  imc: { label: 'help.imc.label', body: 'help.imc.body' },
  ratios: { label: 'help.ratios.label', body: 'help.ratios.body' },
  rpe: { label: 'help.rpe.label', body: 'help.rpe.body' },
  rir: { label: 'help.rir.label', body: 'help.rir.body' },
}
