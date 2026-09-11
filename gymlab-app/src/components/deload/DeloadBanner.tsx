// Banner contextual de la semana de deload activa: muestra el día/7, recomendación y días restantes.
import { useTranslation } from 'react-i18next'
import { Leaf } from 'lucide-react'
import { isDeloadActive, deloadDayProgress } from '@/domain/deload'
import type { ActiveProgram } from '@/domain/types'

export const DeloadBanner = ({ program }: { program: ActiveProgram | undefined }) => {
  const { t } = useTranslation()

  if (!program) return null
  const active = isDeloadActive(program.deloadActive, program.deloadUntil)
  if (!active) return null

  const day = deloadDayProgress(program.deloadUntil)
  const remaining = Math.max(0, 7 - day)

  return (
    <section
      className="reveal rounded-2xl border border-cta/30 bg-cta/10 p-4"
      aria-label={t('perfil.deloadBannerTitulo', { day: day })}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-cta/20">
          <Leaf className="size-5 text-cta" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display text-sm font-semibold text-fg">
            {t('perfil.deloadBannerTitulo', { day })}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted">{t('perfil.deloadBannerTexto')}</p>
          <p className="mt-1 text-[0.65rem] font-medium uppercase tracking-wider text-cta">
            {t('perfil.deloadBannerRestante', { remaining })}
          </p>
        </div>
      </div>
    </section>
  )
}
