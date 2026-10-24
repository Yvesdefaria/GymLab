// Vínculos de /cuerpo hacia las otras dos pantallas del bloque: peso y fotos.
// Dos filas hairline de 48 px; no agrega una ruta hub nueva.
import { Link } from 'react-router-dom'
import { Camera, ChevronRight, Scale } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const LINKS = [
  { to: '/peso-corporal', icon: Scale, labelKey: 'cuerpo.pesoCorporal' },
  { to: '/progreso-fotos', icon: Camera, labelKey: 'cuerpo.fotosProgreso' },
] as const

export const CuerpoLinks = () => {
  const { t } = useTranslation()

  return (
    <section className="border-t border-border/40 pt-4">
      <h2 className="pb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
        {t('cuerpo.masDeCuerpo')}
      </h2>
      {LINKS.map(({ to, icon: Icon, labelKey }) => (
        <Link
          key={to}
          to={to}
          className="flex min-h-[48px] items-center gap-3 border-t border-border/10 text-[12px] text-fg first:border-t-0"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gold/10 text-gold">
            <Icon className="size-4" aria-hidden />
          </span>
          <span className="min-w-0 flex-1 truncate">{t(labelKey)}</span>
          <ChevronRight className="size-4 shrink-0 text-muted" aria-hidden />
        </Link>
      ))}
    </section>
  )
}
