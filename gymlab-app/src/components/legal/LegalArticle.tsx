// Visor de páginas legales en Nocturno Minimal: índice plegable hairline
// (mismo <details>/<ol> que necesita el e2e), secciones numeradas con línea
// superior y prosa continua. Sin tarjetas ni cajas de color.
import type { ReactNode } from 'react'
import { ChevronDown, Mail } from 'lucide-react'
import { AppHeader } from '@/components/layout/AppHeader'
import { BackLink } from '@/components/ui/BackLink'

export type LegalSeccion = { id: string; titulo: string; cuerpo: string[] }

type LegalArticleProps = {
  title: string
  subtitle: string
  updated: string
  tocLabel: string
  backTo: string
  secciones: LegalSeccion[]
  contacto: { titulo: string; parrafos: ReactNode }
  footer: string
  intro?: ReactNode
}

const eyebrowClass =
  'text-[10px] font-semibold uppercase leading-5 tracking-[0.2em] text-muted'

export const LegalArticle = ({ title, subtitle, updated, tocLabel, backTo, secciones, contacto, footer, intro }: LegalArticleProps) => {
  return (
    <div>
      <AppHeader title={title} subtitle={subtitle} />
      <div className="mx-auto w-full max-w-prose px-4 pb-32">
        <BackLink to={backTo} />

        <p className="pb-3 text-[11px] text-muted">{updated}</p>

        {intro ? <p className="pb-4 text-sm leading-relaxed text-muted">{intro}</p> : null}

        <details className="group border-y border-border/40 py-1">
          <summary className="flex min-h-11 cursor-pointer select-none list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
            <span className={eyebrowClass}>{tocLabel}</span>
            <ChevronDown
              className="size-4 text-muted transition-transform group-open:rotate-180 motion-reduce:transition-none"
              aria-hidden
            />
          </summary>
          <ol className="pb-2">
            {secciones.map((seccion, i) => (
              <li key={seccion.id} className="border-t border-border/30 first:border-t-0">
                <a
                  href={`#${seccion.id}`}
                  className="flex min-h-11 items-center gap-3 text-sm text-fg"
                >
                  <span className="w-5 shrink-0 text-[11px] tabular-nums text-muted">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="min-w-0">{seccion.titulo}</span>
                </a>
              </li>
            ))}
          </ol>
        </details>

        {secciones.map((seccion, i) => (
          <section
            key={seccion.id}
            id={seccion.id}
            className="scroll-mt-24 space-y-2 border-b border-border/40 pb-6 pt-6 last:border-b-0"
          >
            <div className="flex items-baseline gap-3">
              <span className="font-display text-[11px] tabular-nums text-accent">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h2 className="font-display text-[17px] font-medium leading-tight text-fg">
                {seccion.titulo}
              </h2>
            </div>
            {seccion.cuerpo.map((parrafo, k) => (
              <p key={k} className="text-sm leading-relaxed text-fg/90">
                {parrafo}
              </p>
            ))}
          </section>
        ))}

        <section id="contacto" className="scroll-mt-24 space-y-2 border-b border-border/40 pb-6 pt-6">
          <div className="flex items-center gap-2">
            <Mail className="size-3.5 text-accent" aria-hidden />
            <h2 className="font-display text-[17px] font-medium leading-tight text-fg">{contacto.titulo}</h2>
          </div>
          <div className="text-sm leading-relaxed text-fg/90">{contacto.parrafos}</div>
        </section>

        <p className="pt-6 text-[11px] leading-relaxed text-muted">{footer}</p>
      </div>
    </div>
  )
}
