// Tabs internos (TabNav): barra de pestañas con subrayado animado vía anime.js
// (translateX del indicador) y transición slideOut/slideIn del contenido.
// Accesible: role="tablist"/"tab"/"tabpanel", aria-selected y navegación con teclado.
import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import anime from 'animejs'
import { prefersReducedMotion, slideIn, slideOut } from '@/lib/animations'
import type { SlideDirection } from '@/lib/animations'

export interface TabNavItem {
  id: string
  label: string
  icon?: LucideIcon
}

interface TabNavProps {
  tabs: readonly TabNavItem[]
  active: string
  onChange: (id: string) => void
  /** Etiqueta accesible de la lista (lectores de pantalla). */
  ariaLabel: string
  children: ReactNode
}

export const TabNav = ({ tabs, active, onChange, ariaLabel, children }: TabNavProps) => {
  const listRef = useRef<HTMLDivElement>(null)
  const indicatorRef = useRef<HTMLSpanElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  // Refs separadas: una detecta cambios para el indicador, otra para el contenido.
  const indicatorPrev = useRef(active)
  const contentPrev = useRef(active)
  const pendingDir = useRef<SlideDirection | null>(null)
  const [leaving, setLeaving] = useState<{ node: ReactNode; dir: SlideDirection } | null>(null)

  // Subrayado: en el primer render se posiciona sin animar; al cambiar de pestaña
  // se anima translateX + ancho hacia el botón activo (respeta reduced-motion).
  useEffect(() => {
    const btn = listRef.current?.querySelector<HTMLButtonElement>(`[data-tab="${active}"]`)
    const indicator = indicatorRef.current
    if (!btn || !indicator) return
    const targetLeft = btn.offsetLeft
    const targetWidth = btn.offsetWidth
    if (indicatorPrev.current === active) {
      indicator.style.width = `${targetWidth}px`
      indicator.style.transform = `translateX(${targetLeft}px)`
      return
    }
    indicatorPrev.current = active
    if (prefersReducedMotion()) {
      anime.set(indicator, { translateX: targetLeft, width: targetWidth })
      return
    }
    anime({
      targets: indicator,
      translateX: targetLeft,
      width: targetWidth,
      duration: 240,
      easing: 'easeOutCubic',
    })
  }, [active, tabs])

  // Entrada del nuevo contenido desde el lado opuesto al que sale el anterior.
  useEffect(() => {
    if (contentPrev.current === active) return
    contentPrev.current = active
    const dir = pendingDir.current
    pendingDir.current = null
    if (dir && panelRef.current) {
      slideIn(panelRef.current, dir === 'left' ? 'right' : 'left', { duration: 240 })
    }
  }, [active])

  const handleSelect = (id: string) => {
    if (id === active) return
    const prevIdx = tabs.findIndex((t) => t.id === active)
    const nextIdx = tabs.findIndex((t) => t.id === id)
    pendingDir.current = nextIdx > prevIdx ? 'left' : 'right'
    setLeaving({ node: children, dir: pendingDir.current })
    onChange(id)
    // Con muchos tabs (scroll horizontal), deja visible el recién activado.
    requestAnimationFrame(() => {
      listRef.current
        ?.querySelector<HTMLButtonElement>(`[data-tab="${id}"]`)
        ?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    })
  }

  // Navegación por teclado: flechas cambian de pestaña, Home/End saltan a los extremos.
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return
    e.preventDefault()
    const idx = tabs.findIndex((t) => t.id === active)
    const next =
      e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : e.key === 'ArrowRight' ? (idx + 1) % tabs.length : (idx - 1 + tabs.length) % tabs.length
    handleSelect(tabs[next].id)
    listRef.current?.querySelector<HTMLButtonElement>(`[data-tab="${tabs[next].id}"]`)?.focus()
  }

  const panelId = `tabnav-panel-${active}`

  return (
    <div>
      <div
        ref={listRef}
        role="tablist"
        aria-label={ariaLabel}
        onKeyDown={handleKeyDown}
        className="relative flex gap-1 overflow-x-auto border-b border-border"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === active
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              id={`tabnav-tab-${tab.id}`}
              data-tab={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={panelId}
              onClick={() => handleSelect(tab.id)}
              className={`relative flex min-h-[44px] shrink-0 items-center gap-1.5 whitespace-nowrap px-3 text-sm font-medium transition-colors ${
                isActive ? 'text-accent-soft' : 'text-muted hover:text-fg'
              }`}
            >
              {Icon ? <Icon className="size-4" aria-hidden /> : null}
              {tab.label}
            </button>
          )
        })}
        <span
          ref={indicatorRef}
          aria-hidden
          className="absolute bottom-0 left-0 h-0.5 rounded-full bg-cta"
          style={{ willChange: 'transform, width' }}
        />
      </div>
      <div className="relative">
        {leaving && (
          <div
            className="absolute inset-0 z-10 overflow-hidden"
            aria-hidden
            ref={(el) => {
              if (el) {
                slideOut(el, leaving.dir, {
                  duration: 200,
                  easing: 'easeOutCubic',
                  onComplete: () => setLeaving((prev) => (prev?.node === leaving.node ? null : prev)),
                })
              }
            }}
          >
            {leaving.node}
          </div>
        )}
        <div
          ref={panelRef}
          id={panelId}
          role="tabpanel"
          aria-labelledby={`tabnav-tab-${active}`}
          className="mt-4"
        >
          {children}
        </div>
      </div>
    </div>
  )
}
