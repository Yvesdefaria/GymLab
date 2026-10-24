// Atajos de navegación de la home: calendario completo y objetivos (ya viven en Más).
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { CalendarDays, ChevronRight, Target } from 'lucide-react'

export const HomeMiscLinks = ({ calendarAnchor = false }: { calendarAnchor?: boolean }) => {
  const { t } = useTranslation()

  return (
    <section className="mt-6 border-t border-border/40 pt-4">
      <h2 className="text-[10px] font-semibold uppercase tracking-[0.19em] text-muted">
        {t('home.tambienEnMas')}
      </h2>

      <Link
        to="/calendario"
        className="mt-1 flex min-h-[52px] items-center gap-3 border-t border-border/40"
        data-tour={calendarAnchor ? 'home-calendar' : undefined}
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-fg/5 text-muted">
          <CalendarDays className="size-4" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-medium text-fg">{t('home.calendarioCompleto')}</span>
          <span className="mt-0.5 block text-[9.5px] text-muted">{t('mas.linkCalendarioDesc')}</span>
        </span>
        <ChevronRight className="size-4 shrink-0 text-muted/60" aria-hidden="true" />
      </Link>

      <Link
        to="/objetivos"
        className="flex min-h-[52px] items-center gap-3 border-t border-border/40"
        data-tour="home-goals"
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-fg/5 text-muted">
          <Target className="size-4" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-medium text-fg">{t('goals.title')}</span>
          <span className="mt-0.5 block text-[9.5px] text-muted">{t('mas.linkObjetivosDesc')}</span>
        </span>
        <ChevronRight className="size-4 shrink-0 text-muted/60" aria-hidden="true" />
      </Link>
    </section>
  )
}
