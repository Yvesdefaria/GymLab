// Avisos de la ficha cuando todavía no hay marca: sin historial (CTA a entrenar) o con
// historial pero sin PR. La marca en sí se muestra en la stat row de la página.
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Play, Target } from 'lucide-react'

export const ExercisePrCard = ({
  hasHistory,
}: {
  hasHistory: boolean
}) => {
  const { t } = useTranslation()

  if (!hasHistory) {
    return (
      <section className="flex flex-col items-start gap-2 border-t border-border/40 py-4">
        <span className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">
          <Target className="size-4" aria-hidden />
          {t('ejercicios.detalle.sinHistorial')}
        </span>
        <p className="max-w-sm text-xs leading-relaxed text-muted">
          {t('ejercicios.detalle.sinHistorialDesc')}
        </p>
        <Link
          to="/"
          className="mt-1 inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-cta px-4 text-sm font-semibold text-on-gold transition-opacity hover:opacity-90"
        >
          <Play className="size-4" aria-hidden />
          {t('ejercicios.detalle.iniciarEntreno')}
        </Link>
      </section>
    )
  }

  return (
    <section className="border-t border-border/40 py-4">
      <div className="flex items-center gap-2">
        <Target className="size-4 text-gold" aria-hidden />
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">
          {t('ejercicios.detalle.sinMejorMarca')}
        </span>
      </div>
      <p className="mt-1 text-xs leading-relaxed text-muted">
        {t('ejercicios.detalle.sinMejorMarcaDesc')}
      </p>
    </section>
  )
}
