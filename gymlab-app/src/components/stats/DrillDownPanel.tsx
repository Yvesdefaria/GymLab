// DrillDownPanel: panel expandible que muestra detalles al tocar un punto del gráfico.
import { useRef, useEffect, useState } from 'react'
import { X } from 'lucide-react'

export type DrillDownData = {
  title: string
  subtitle?: string
  metrics: { label: string; value: string }[]
}

type Props = {
  data: DrillDownData | null
  onClose: () => void
}

export const DrillDownPanel = ({ data, onClose }: Props) => {
  const ref = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState(0)
  const prefersReduced = useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    if (data && ref.current) {
      setHeight(ref.current.scrollHeight)
    } else {
      setHeight(0)
    }
  }, [data])

  return (
    <div
      className="overflow-hidden"
      style={{
        maxHeight: height,
        transition: prefersReduced.current ? 'none' : 'max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <div ref={ref} className="mt-3 rounded-xl border border-border/30 bg-bg-elevated/60 p-3">
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-fg">{data?.title}</p>
            {data?.subtitle && (
              <p className="mt-0.5 text-xs text-muted">{data.subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex size-7 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-bg-elevated hover:text-fg"
            aria-label="Cerrar detalle"
          >
            <X className="size-4" />
          </button>
        </div>
        {data?.metrics && (
          <div className="grid grid-cols-2 gap-2">
            {data.metrics.map((m, i) => (
              <div key={i}>
                <p className="text-[0.65rem] text-muted">{m.label}</p>
                <p className="text-sm font-semibold text-fg">{m.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
