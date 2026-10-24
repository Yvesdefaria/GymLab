// Deload activo como fila hairline: contexto, no tarjeta que tape el héroe.
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
    <div
      className="mt-5 flex items-start gap-3 border-t border-border/40 pt-3.5"
      aria-label={t('perfil.deloadBannerTitulo', { day })}
    >
      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-gold/10 text-gold">
        <Leaf className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-fg">
          {t('perfil.deloadBannerTitulo', { day })}
        </p>
        <p className="mt-0.5 text-[9.5px] leading-relaxed text-muted">
          {t('perfil.deloadBannerTexto')}
        </p>
      </div>
      <span className="shrink-0 text-[9px] font-medium uppercase tracking-wider text-gold">
        {t('perfil.deloadBannerRestante', { remaining })}
      </span>
    </div>
  )
}
