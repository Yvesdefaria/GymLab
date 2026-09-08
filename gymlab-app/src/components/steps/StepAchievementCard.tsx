// StepAchievementCard: card única de un logro de pasos (F84). Dos variantes de
// presentación — 'badge' (badge desbloqueado en /pasos) y 'tile' (galería en
// /logros con estado bloqueado/desbloqueado) — que comparten la resolución del
// icono lucide desde el string del dominio y el copy i18n. Solo presentación.
import { useTranslation } from 'react-i18next'
import {
  Footprints,
  Target,
  Flame,
  Crown,
  TrendingUp,
  CalendarRange,
  Medal,
  Mountain,
  Trophy,
  type LucideIcon,
} from 'lucide-react'
import type { StepAchievementDef } from '@/domain/stepAchievements'
import type { I18nKey } from '@/i18n'

// Iconos de los 8 logros de pasos: el dominio guarda el nombre del icono como
// string; fallback Trophy ante un nombre desconocido.
const STEP_ACHIEVEMENT_ICONS: Record<string, LucideIcon> = {
  Footprints,
  Target,
  Flame,
  Crown,
  TrendingUp,
  CalendarRange,
  Medal,
  Mountain,
}

export type StepAchievementCardVariant = 'badge' | 'tile'

type StepAchievementCardProps = {
  def: StepAchievementDef
  unlocked?: boolean
  variant?: StepAchievementCardVariant
}

export const StepAchievementCard = ({
  def,
  unlocked = true,
  variant = 'badge',
}: StepAchievementCardProps) => {
  const { t } = useTranslation()
  const Icon = STEP_ACHIEVEMENT_ICONS[def.icon] ?? Trophy

  // El dominio tipa titleKey/descriptionKey como string; t() exige literales
  // del schema i18n (mismo cast que usaban las dos cards originales).
  const title = t(def.titleKey as I18nKey)
  const desc = t(def.descriptionKey as I18nKey)

  if (variant === 'tile') {
    return (
      <div
        className={`flex flex-col gap-2 rounded-2xl border p-3 ${
          unlocked ? 'border-accent/50 bg-accent/10' : 'border-border/30 bg-bg-elevated/30 opacity-50'
        }`}
      >
        <span
          className={`flex size-8 items-center justify-center rounded-xl ${
            unlocked ? 'bg-gold/15 text-gold' : 'bg-border/20 text-muted'
          }`}
        >
          <Icon className="size-4" aria-hidden />
        </span>
        <div>
          <p className="text-xs font-semibold text-fg">{title}</p>
          <p className="text-[11px] text-muted">{desc}</p>
        </div>
      </div>
    )
  }

  return (
    <li className="flex items-start gap-2 rounded-2xl border border-gold/20 bg-bg-elevated/50 p-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold">
        <Icon className="size-4" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-semibold leading-tight text-fg">{title}</span>
        <span className="mt-0.5 block text-[10px] leading-tight text-muted">{desc}</span>
      </span>
    </li>
  )
}