// Visor de páginas legales en formato artículo: índice (TOC) con anclas arriba
// y prosa continua (h2 + párrafos), sin tarjetas. Compartido por T&C y
// Política de privacidad para mantener un único estilo y comportamiento.
import type { ReactNode } from 'react'
import { Mail, ShieldCheck } from 'lucide-react'
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

export const LegalArticle = ({ title, subtitle, updated, tocLabel, backTo, secciones, contacto, footer, intro }: LegalArticleProps) => {
  return (
    <div>
      <AppHeader title={title} subtitle={subtitle} />
      <div className="mx-auto w-full max-w-prose space-y-8 p-4 pb-32">
        <BackLink to={backTo} />

        <p className="text-xs text-muted">{updated}</p>

        {intro ? <p className="text-sm leading-relaxed text-muted">{intro}</p> : null}

        <details className="rounded-2xl border border-border bg-bg-elevated/40 p-3">
          <summary className="cursor-pointer select-none text-sm font-semibold text-accent-soft">{tocLabel}</summary>
          <ol className="mt-3 space-y-2 pl-5 text-sm text-muted">
            {secciones.map((seccion, i) => (
              <li key={seccion.id}>
                <a href={`#${seccion.id}`} className="underline-offset-2 hover:text-accent-soft hover:underline">
                  {i + 1}. {seccion.titulo}
                </a>
              </li>
            ))}
          </ol>
        </details>

        {secciones.map((seccion) => (
          <section key={seccion.id} id={seccion.id} className="scroll-mt-24 space-y-2 border-t border-border/40 pt-6">
            <h2 className="font-display text-base font-semibold text-accent-soft">{seccion.titulo}</h2>
            {seccion.cuerpo.map((parrafo, i) => (
              <p key={i} className="text-sm leading-relaxed text-fg">
                {parrafo}
              </p>
            ))}
          </section>
        ))}

        <section id="contacto" className="scroll-mt-24 space-y-2 border-t border-border/40 pt-6">
          <div className="flex items-center gap-2">
            <Mail className="size-4 text-accent" aria-hidden />
            <h2 className="font-display text-base font-semibold text-accent-soft">{contacto.titulo}</h2>
          </div>
          <div className="text-sm leading-relaxed text-fg">{contacto.parrafos}</div>
        </section>

        <div className="flex items-start gap-2 rounded-xl border border-border/30 bg-bg-elevated/30 p-3 text-xs text-muted">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
          <p>{footer}</p>
        </div>
      </div>
    </div>
  )
}