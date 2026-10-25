// F132.4: tarjeta de la vitrina de logros. Toda la superficie es un botón de
// 96 px que abre el detalle; conserva el contrato de progreso de F95.3
// (role=progressbar + data-progress + etiqueta «1 de 50» visible).
import { useTranslation } from 'react-i18next'
import { AchievementMedal } from './AchievementMedal'
import type { Achievement } from '@/domain/achievements'
import type { AchievementProgress } from '@/domain/achievementProgress'
import type { AppLanguage } from '@/domain/onboarding'
import { formatNumber } from '@/lib/intl'

interface AchievementTileProps {
  achievement: Achievement
  unlocked: boolean
  count: number
  progress?: AchievementProgress
  variant?: string
  lang: AppLanguage
  // Ancla opcional del tour (solo la primera tarjeta renderizada la recibe).
  dataTour?: string
  onOpen: () => void
}

export const AchievementTile = ({
  achievement,
  unlocked,
  count,
  progress,
  variant,
  lang,
  dataTour,
  onOpen,
}: AchievementTileProps) => {
  const { t } = useTranslation()
  // Sin target no hay señal de avance (p. ej. guías sin catálogo): no se pinta
  // una barra vacía ni un «0 de 0» que finja progreso.
  const hasProgress = progress !== undefined && progress.target > 0
  const pct = hasProgress ? Math.min(100, (progress.current / progress.target) * 100) : 0

  return (
    <div className="relative min-h-[96px]">
      {/* Botón estirado: cubre la tarjeta pero queda como hermano del
          contenido. Un <button> con aria-label vuelve presentacionales a sus
          descendientes y ocultaría la barra accesible (hallazgo R3-A11Y-PROGRESS). */}
      <button
        type="button"
        onClick={onOpen}
        data-tour={dataTour}
        aria-label={t(achievement.titleKey as never)}
        className="absolute inset-0 z-0 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta"
      />
      <div className="pointer-events-none relative z-10">
        <span className="flex items-start gap-2">
          <AchievementMedal
            achievement={achievement}
            unlocked={unlocked}
            count={count}
            size="sm"
            variant={variant}
          />
          <span className="min-w-0 flex-1 pt-1">
            <span
              className={`line-clamp-2 block text-xs font-semibold leading-tight ${
                unlocked ? 'text-fg' : 'text-fg/80'
              }`}
            >
              {t(achievement.titleKey as never)}
            </span>
          </span>
        </span>

        {hasProgress && (
          <>
            <span
              role="progressbar"
              data-progress={achievement.id}
              aria-label={t(achievement.titleKey as never)}
              aria-valuenow={progress.current}
              aria-valuemin={0}
              aria-valuemax={progress.target}
              className="mt-2 block h-[2px] overflow-hidden rounded-full bg-border/30"
            >
              <span className="block h-full rounded-full bg-cta" style={{ width: `${pct}%` }} />
            </span>
            <span className="mt-1 block text-[9px] tabular-nums text-muted">
              {t('achievements.progress.count', {
                current: formatNumber(progress.current, lang),
                target: formatNumber(progress.target, lang),
              })}
            </span>
          </>
        )}
      </div>
    </div>
  )
}
