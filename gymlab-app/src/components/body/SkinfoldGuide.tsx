import { useState } from 'react'
import { ChevronDown, Hand } from 'lucide-react'
import { SKINFOLD_SITES, SKINFOLD_TECHNIQUE } from '@/domain/bodyMeasurements'

export const SkinfoldGuide = () => {
  const [open, setOpen] = useState(false)

  return (
    <section className="panel rounded-2xl p-4">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="picometro-guide"
        className="flex w-full items-center gap-3 text-left"
      >
        <span className="flex size-11 items-center justify-center rounded-xl bg-bg text-accent">
          <Hand className="size-5" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-medium text-fg">Cómo usar el picómetro</span>
          <span className="block text-sm text-muted">Técnica de la pinza y punto de cada pliegue</span>
        </span>
        <ChevronDown
          className={`size-5 shrink-0 text-muted transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {open && (
        <div id="picometro-guide" className="mt-4 space-y-4">
          <ol className="space-y-2">
            {SKINFOLD_TECHNIQUE.map((tip, i) => (
              <li key={i} className="flex gap-2 text-sm text-fg/90">
                <span className="font-display font-semibold text-accent">{i + 1}.</span>
                <span>{tip}</span>
              </li>
            ))}
          </ol>

          <div>
            <p className="mb-1.5 font-display text-xs font-semibold uppercase tracking-wider text-accent">
              Punto de cada pliegue
            </p>
            <ul className="space-y-1.5">
              {SKINFOLD_SITES.map((s) => (
                <li key={s.key} className="flex gap-2 text-xs text-muted">
                  <span className="shrink-0 font-medium text-fg/80">{s.label}:</span>
                  <span>{s.guide}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  )
}
