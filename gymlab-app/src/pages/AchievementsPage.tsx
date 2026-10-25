// Logros extendidos (F132.4): vitrina de dos columnas con filtros por estado.
// Conserva el contrato de datos de F95.3: una barra accesible por logro
// (data-progress + role=progressbar + «1 de 50» visible) y el contador general.
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ACHIEVEMENTS,
  filterAchievementsByState,
  type Achievement,
  type AchievementFilter,
} from '@/domain/achievements'
import type { AchievementProgress } from '@/domain/achievementProgress'
import type { AppLanguage } from '@/domain/onboarding'
import { AppHeader } from '@/components/layout/AppHeader'
import { BackLink } from '@/components/ui/BackLink'
import { EmptyState } from '@/components/ui/EmptyState'
import { FilterChips } from '@/components/ui/FilterChips'
import { AchievementTile } from '@/components/achievements/AchievementTile'
import { AchievementDetailSheet } from '@/components/achievements/AchievementDetailSheet'

interface AchievementsPageProps {
  unlockedIds: string[]
  counts: Record<string, number>
  // Progreso en vivo de las 36 barras unificadas (F95.3, F109.1), una por logro.
  progress: Record<string, AchievementProgress>
  // Variante de chapa vigente por logro desbloqueado (F95.1), si concedió alguna.
  variants?: Record<string, string>
}

export const AchievementsPage = ({
  unlockedIds,
  counts,
  progress,
  variants,
}: AchievementsPageProps) => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const [filter, setFilter] = useState<AchievementFilter>('all')
  const [selected, setSelected] = useState<Achievement | null>(null)
  const triggerRef = useRef<HTMLElement | null>(null)

  const unlocked = filterAchievementsByState(ACHIEVEMENTS, 'unlocked', unlockedIds)
  const locked = filterAchievementsByState(ACHIEVEMENTS, 'locked', unlockedIds)
  const showUnlocked = filter !== 'locked'
  const showLocked = filter !== 'unlocked'
  // Ancla del tour: la primera tarjeta realmente renderizada con el filtro actual.
  const firstRenderedId = (showUnlocked ? unlocked[0] : undefined)?.id ?? (showLocked ? locked[0] : undefined)?.id
  const variantsCount = Object.keys(variants ?? {}).length
  const visibleCount = (showUnlocked ? unlocked.length : 0) + (showLocked ? locked.length : 0)

  const openDetail = (achievement: Achievement) => {
    triggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    setSelected(achievement)
  }

  const closeDetail = () => {
    setSelected(null)
    // BottomSheet no devuelve el foco: lo hacemos acá para no perder el lugar.
    requestAnimationFrame(() => triggerRef.current?.focus())
  }

  const filters: { value: AchievementFilter; label: string }[] = [
    { value: 'all', label: t('achievements.filters.all') },
    { value: 'unlocked', label: t('achievements.filters.unlocked') },
    { value: 'locked', label: t('achievements.filters.locked') },
  ]

  return (
    <div>
      <AppHeader title={t('achievements.title')} />
      <div className="px-4 pb-20 pt-2">
        <BackLink to="/mas" />

        <section className="border-b border-border/40 pb-4 pt-1">
          <p className="kicker">{t('achievements.hero.kicker')}</p>
          <strong className="mt-1 block font-display text-[46px] font-light leading-none tabular-nums text-fg">
            {unlocked.length}/{ACHIEVEMENTS.length}
          </strong>

          {/* Barra general: desbloqueados sobre el total. */}
          <div
            role="progressbar"
            data-progress="general"
            aria-label={t('achievements.progress.general', {
              current: unlocked.length,
              total: ACHIEVEMENTS.length,
            })}
            aria-valuenow={unlocked.length}
            aria-valuemin={0}
            aria-valuemax={ACHIEVEMENTS.length}
            className="mt-2 h-2 overflow-hidden rounded-full bg-border/30"
          >
            <div
              className="h-full rounded-full bg-cta transition-[width]"
              style={{ width: `${(unlocked.length / ACHIEVEMENTS.length) * 100}%` }}
            />
          </div>

          <div className="mt-2 flex items-baseline justify-between gap-3 text-[10px] text-muted">
            <span>{t('achievements.progress.pending', { count: locked.length })}</span>
            {variantsCount > 0 && (
              <span className="font-semibold text-gold-bright">
                {t('achievements.progress.variants', { count: variantsCount })}
              </span>
            )}
          </div>
        </section>

        <FilterChips
          options={filters}
          value={filter}
          onChange={(value) => setFilter(value ?? 'all')}
          ariaLabel={t('achievements.filters.aria')}
          allowDeselect={false}
          grow
          className="mt-4"
        />

        {visibleCount === 0 ? (
          <EmptyState size="sm" message={t('achievements.filters.empty')} className="mt-4" />
        ) : (
          <div className="mt-4 flex flex-col gap-5">
            {showUnlocked && unlocked.length > 0 && (
              <section>
                <div className="flex items-baseline justify-between border-t border-border/40 pt-2">
                  <h2 className="kicker">{t('achievements.sections.unlocked')}</h2>
                  <span className="text-[10px] tabular-nums text-muted">{unlocked.length}</span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3">
                  {unlocked.map((a) => (
                    <AchievementTile
                      // El sufijo remonta el ancla del tour si Dexie cambia la
                      // primera tarjeta de sección al resolver.
                      key={a.id === firstRenderedId ? `${a.id}__tour` : a.id}
                      achievement={a}
                      unlocked
                      count={counts[a.id] ?? 0}
                      progress={progress[a.id]}
                      variant={variants?.[a.id]}
                      lang={lang}
                      dataTour={a.id === firstRenderedId ? 'logros-medalla' : undefined}
                      onOpen={() => openDetail(a)}
                    />
                  ))}
                </div>
              </section>
            )}

            {showLocked && locked.length > 0 && (
              <section>
                <div className="flex items-baseline justify-between border-t border-border/40 pt-2">
                  <h2 className="kicker">{t('achievements.locked')}</h2>
                  <span className="text-[10px] tabular-nums text-muted">{locked.length}</span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3">
                  {locked.map((a) => (
                    <AchievementTile
                      key={a.id === firstRenderedId ? `${a.id}__tour` : a.id}
                      achievement={a}
                      unlocked={false}
                      count={0}
                      progress={progress[a.id]}
                      lang={lang}
                      dataTour={a.id === firstRenderedId ? 'logros-medalla' : undefined}
                      onOpen={() => openDetail(a)}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      {selected && (
        <AchievementDetailSheet
          achievement={selected}
          unlocked={unlockedIds.includes(selected.id)}
          count={counts[selected.id] ?? 0}
          progress={progress[selected.id]}
          variant={variants?.[selected.id]}
          lang={lang}
          onClose={closeDetail}
        />
      )}
    </div>
  )
}
