// Maniquí anatómico 3D (Three.js): rotación libre por arrastre, selección por grupo y leyenda.
// Carga la escena con dynamic import (chunk lazy) y cae al SVG si no hay WebGL (webviews viejas).
import { useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { RotateCcw } from 'lucide-react'
import { MuscleDummy } from './MuscleDummy'
import { MUSCLE_GROUPS } from '@/domain/catalog'
import { FATIGUE_HEAT_COLORS } from '@/domain/muscleColors'
import { fatigueLabel } from '@/domain/muscleFatigue'
import { localizeMuscleGroup } from '@/i18n/catalog'
import type { MuscleSceneHandle, MuscleSceneState } from '@/three/scene'
import type { AppLanguage } from '@/domain/onboarding'
import type { FatigueLevel, MuscleGroup } from '@/domain/types'

type MuscleDummy3DProps = {
  fatigue: Partial<Record<MuscleGroup, FatigueLevel>>
  selected?: MuscleGroup | null
  onSelect?: (mg: MuscleGroup | null) => void
  highlight?: MuscleGroup | null
  showLegend?: boolean
}

// WebGL es opcional: sin soporte se usa el muñeco SVG como fallback.
const detectWebGL = (): boolean => {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}

export const MuscleDummy3D = ({
  fatigue,
  selected,
  onSelect,
  highlight,
  showLegend = true,
}: MuscleDummy3DProps) => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage

  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<MuscleSceneHandle | null>(null)
  // Ref para que el manejador de la escena vea siempre el onSelect actual sin remontar.
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect

  const hasWebGL = useMemo(detectWebGL, [])
  const reducedMotion = useMemo(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  )

  // Monta la escena 3D una vez (carga lazy) y la destruye al desmontar el componente.
  useEffect(() => {
    let disposed = false
    void import('@/three/scene').then(({ mountMuscleScene }) => {
      if (disposed || !containerRef.current) return
      sceneRef.current = mountMuscleScene(containerRef.current, {
        onSelect: (mg) => onSelectRef.current?.(mg),
        reducedMotion,
      })
      sceneRef.current.update({
        fatigue,
        selected: selected ?? null,
        highlight: highlight ?? null,
      })
    })
    return () => {
      disposed = true
      sceneRef.current?.dispose()
      sceneRef.current = null
    }
    // La escena solo se crea una vez; los cambios de estado se aplican en el efecto de abajo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion])

  // Propaga cambios de fatiga/selección/resaltado a la escena montada.
  useEffect(() => {
    sceneRef.current?.update({
      fatigue,
      selected: selected ?? null,
      highlight: highlight ?? null,
    })
  }, [fatigue, selected, highlight])

  if (!hasWebGL) {
    return (
      <MuscleDummy
        fatigue={fatigue}
        selected={selected}
        onSelect={onSelect}
        highlight={highlight}
        showLegend={showLegend}
      />
    )
  }

  const selectedLabel = selected ? localizeMuscleGroup(selected, lang) : null

  return (
    <div className="w-full">
      {/* La escena se monta dentro de este contenedor; el aria-label describe el lienzo para AT. */}
      <div
        ref={containerRef}
        role="img"
        aria-label={t('cuerpo.mapaMuscular')}
        className="h-80 w-full touch-none"
      />
      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="text-xs text-muted">{t('cuerpo.gira')}</p>
        <button
          type="button"
          onClick={() => sceneRef.current?.resetView()}
          className="flex min-h-[44px] items-center gap-1.5 rounded-xl border border-border px-3 text-xs font-medium text-muted hover:border-gold/60"
        >
          <RotateCcw className="size-4" aria-hidden />
          {t('cuerpo.centrar')}
        </button>
      </div>

      {/* Chips accesibles: alternativa al lienzo para teclado/lectores de pantalla (misma selección). */}
      {onSelect && (
        <div
          role="group"
          aria-label={t('cuerpo.seleccionGrupos')}
          className="mt-3 flex flex-wrap justify-center gap-1.5"
        >
          {MUSCLE_GROUPS.map((mg) => {
            const isSelected = selected === mg
            return (
              <button
                key={mg}
                type="button"
                onClick={() => onSelect(isSelected ? null : mg)}
                aria-pressed={isSelected}
                className={`min-h-[44px] rounded-full border px-3 text-[0.7rem] font-medium transition-colors ${
                  isSelected
                    ? 'border-cta bg-cta/20 text-accent-soft'
                    : 'border-border text-muted hover:border-gold/60'
                }`}
              >
                {localizeMuscleGroup(mg, lang)}
              </button>
            )
          })}
        </div>
      )}

      {/* Anuncio silencioso del músculo seleccionado para lectores de pantalla. */}
      <p aria-live="polite" className="sr-only">
        {selectedLabel ? t('cuerpo.selMusculo', { nombre: selectedLabel }) : ''}
      </p>

      {showLegend && (
        <ul className="mt-3 flex flex-wrap justify-center gap-2 text-[0.65rem]">
          {(['fresh', 'warm', 'fatigued', 'sore'] as FatigueLevel[]).map((l) => (
            <li key={l} className="flex items-center gap-1 text-muted">
              <span
                className="inline-block size-2.5 rounded-sm"
                style={{ backgroundColor: FATIGUE_HEAT_COLORS[l] }}
              />
              {fatigueLabel[l]}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// Mantiene visible el tipo de estado para tipado explícito en los consumidores.
export type { MuscleSceneState }
