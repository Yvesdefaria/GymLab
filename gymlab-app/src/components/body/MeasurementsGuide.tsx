import { useState } from 'react'
import { ChevronDown, Ruler } from 'lucide-react'
import { BODY_ZONES, BODY_ZONE_GROUP_LABELS, MEASUREMENT_TIPS } from '@/domain/bodyMeasurements'

export const MeasurementsGuide = () => {
  const [open, setOpen] = useState(false)

  return (
    <section className="panel rounded-2xl p-4">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="medidas-guide"
        className="flex w-full items-center gap-3 text-left"
      >
        <span className="flex size-11 items-center justify-center rounded-xl bg-bg text-accent">
          <Ruler className="size-5" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-medium text-fg">Cómo medir</span>
          <span className="block text-sm text-muted">Técnica de la cinta y punto de cada zona</span>
        </span>
        <ChevronDown
          className={`size-5 shrink-0 text-muted transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {open && (
        <div id="medidas-guide" className="mt-4 space-y-4">
          <ol className="space-y-2">
            {MEASUREMENT_TIPS.map((tip, i) => (
              <li key={i} className="flex gap-2 text-sm text-fg/90">
                <span className="font-display font-semibold text-accent">{i + 1}.</span>
                <span>{tip}</span>
              </li>
            ))}
          </ol>

          {(['tronco', 'brazos', 'piernas'] as const).map((group) => (
            <div key={group}>
              <p className="mb-1.5 font-display text-xs font-semibold uppercase tracking-wider text-accent">
                {BODY_ZONE_GROUP_LABELS[group]}
              </p>
              <ul className="space-y-1.5">
                {BODY_ZONES.filter((z) => z.group === group).map((z) => (
                  <li key={z.key} className="flex gap-2 text-xs text-muted">
                    <span className="shrink-0 font-medium text-fg/80">{z.label}:</span>
                    <span>{z.guide}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
