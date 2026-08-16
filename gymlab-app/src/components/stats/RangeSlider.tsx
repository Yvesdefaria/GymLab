// RangeSlider: selector de período con indicador deslizante animado estilo segmented control.
import { useRef, useEffect, useState } from 'react'

export type RangeOption = {
  value: number | string
  label: string
}

type Props = {
  options: RangeOption[]
  value: number | string
  onChange: (value: number | string) => void
}

export const RangeSlider = ({ options, value, onChange }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [indicator, setIndicator] = useState({ left: 0, width: 0 })
  const prefersReduced = useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const activeIdx = options.findIndex((o) => o.value === value)
    if (activeIdx === -1) return

    const buttons = container.querySelectorAll<HTMLButtonElement>('[data-range-btn]')
    const btn = buttons[activeIdx]
    if (!btn) return

    setIndicator({
      left: btn.offsetLeft,
      width: btn.offsetWidth,
    })
  }, [value, options])

  return (
    <div
      ref={containerRef}
      className="relative flex rounded-xl border border-border/40 bg-bg-elevated/80 p-1"
      role="radiogroup"
    >
      {/* Sliding indicator */}
      <div
        className="absolute top-1 bottom-1 rounded-lg border border-gold/30 bg-cta/15"
        style={{
          left: indicator.left,
          width: indicator.width,
          transition: prefersReduced.current ? 'none' : 'left 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      />

      {options.map((opt) => (
        <button
          key={opt.value}
          data-range-btn
          onClick={() => onChange(opt.value)}
          role="radio"
          aria-checked={value === opt.value}
          className={`relative z-10 min-h-[44px] flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
            value === opt.value
              ? 'text-cta'
              : 'text-muted hover:text-fg'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
