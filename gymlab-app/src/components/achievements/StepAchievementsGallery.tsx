// StepAchievementsGallery: galería de los 8 logros de pasos en /logros (F84f).
// Solo presentación: el estado (def + unlocked) llega calculado desde el dominio.
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
import type { I18nKey } from '@/i18n'
import type { DailyStepsEntry } from '@/domain/types'
import { getStepAchievementsWithStatus } from '@/domain/stepAchievements'

// Mapa icono-definición duplicado a propósito: no se exporta del componente de
// /pasos para no acoplar páginas (acceso por key, fallback Trophy).
const ICONS: Record<string, LucideIcon> = {
  Footprints,
  Target,
  Flame,
  Crown,
  TrendingUp,
  CalendarRange,
  Medal,
  Mountain,
}

type StepAchievementsGalleryProps = {
  days: DailyStepsEntry[]
}

export const StepAchievementsGallery = ({ days }: StepAchievementsGalleryProps) => {
  const { t } = useTranslation()
  const entries = getStepAchievementsWithStatus(days)
  const unlockedCount = entries.filter((e) => e.unlocked).length

  return (
    <div className="mt-8">
      <div className="flex items-baseline justify-between gap-3 px-1">
        <h2 className="text-sm font-semibold text-fg">{t('achievements.stepsTitle')}</h2>
        <span className="text-xs text-muted">
          {unlockedCount}/{entries.length}
        </span>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2">
        {entries.map(({ def, unlocked }) => {
          const Icon = ICONS[def.icon] ?? Trophy
          return (
            <div
              key={def.id}
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
                <p className="text-xs font-semibold text-fg">{t(def.titleKey as I18nKey)}</p>
                <p className="text-[11px] text-muted">{t(def.descriptionKey as I18nKey)}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}