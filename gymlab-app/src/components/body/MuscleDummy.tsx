// Muñeco anatómico SVG para visualizar el nivel de fatiga muscular por grupo y zona (frente/espalda).
import { useTranslation } from 'react-i18next'
import type { FatigueLevel, MuscleGroup } from '@/domain/types'
import { fatigueColorClass, fatigueLabel } from '@/domain/muscleFatigue'

// Regiones del cuerpo con su trayectoria SVG; la vista decide cuáles se dibujan.
const REGIONS: { id: MuscleGroup; label: string; d: string }[] = [
  { id: 'hombro', label: 'Hombros', d: 'M70 58 h20 v14 h-20 z M110 58 h20 v14 h-20 z' },
  { id: 'pecho', label: 'Pecho', d: 'M78 72 h44 v28 h-44 z' },
  { id: 'biceps', label: 'Bíceps', d: 'M58 78 h16 v36 h-16 z M126 78 h16 v36 h-16 z' },
  { id: 'antebrazo', label: 'Antebrazo', d: 'M54 116 h14 v32 h-14 z M132 116 h14 v32 h-14 z' },
  { id: 'abdomen', label: 'Abdomen', d: 'M82 102 h36 v34 h-36 z' },
  { id: 'trapecios', label: 'Trapecios', d: 'M84 48 h32 v12 h-32 z' },
  { id: 'espalda', label: 'Espalda', d: 'M80 72 h40 v36 h-40 z' },
  { id: 'gluteo', label: 'Glúteos', d: 'M80 138 h40 v18 h-40 z' },
  { id: 'pierna', label: 'Piernas', d: 'M78 158 h18 v48 h-18 z M104 158 h18 v48 h-18 z' },
  { id: 'triceps', label: 'Tríceps', d: 'M62 78 h10 v36 h-10 z M128 78 h10 v36 h-10 z' },
]

type MuscleDummyProps = {
  fatigue: Partial<Record<MuscleGroup, FatigueLevel>>
  view?: 'front' | 'back'
  selected?: MuscleGroup | null
  onSelect?: (mg: MuscleGroup) => void
  highlight?: MuscleGroup | null
  showLegend?: boolean
}

// Muñeco interactivo: colorea grupos según fatiga y permite seleccionarlos (teclado incluido).
export const MuscleDummy = ({
  fatigue,
  view = 'front',
  selected,
  onSelect,
  highlight,
  showLegend = true,
}: MuscleDummyProps) => {
  const { t } = useTranslation()
  // Cada vista solo muestra los grupos musculares visibles desde ese ángulo.
  const front = new Set<MuscleGroup>(['pecho', 'biceps', 'abdomen', 'hombro', 'antebrazo', 'pierna', 'trapecios'])
  const back = new Set<MuscleGroup>(['espalda', 'triceps', 'gluteo', 'hombro', 'pierna', 'trapecios', 'antebrazo'])
  const visible = REGIONS.filter((r) => (view === 'front' ? front.has(r.id) : back.has(r.id)))
  const focus = highlight ?? selected

  return (
    <div className="w-full">
      <svg viewBox="0 0 200 230" className="mx-auto h-auto w-full max-w-xs" role="img" aria-label={t('cuerpo.mapaMuscular')}>
        <ellipse cx="100" cy="36" rx="18" ry="20" className="fill-bg-elevated stroke-border" strokeWidth="2" />
        <path d="M88 54 Q100 62 112 54" className="stroke-border" fill="none" strokeWidth="2" />
        {visible.map((r) => {
          const level = fatigue[r.id] ?? 'fresh'
          const isSel = focus === r.id
          // Atenúa los grupos no relacionados para focalizar la atención si hay selección activa.
          return (
            <path
              key={`${view}-${r.id}`}
              d={r.d}
              className={
                isSel
                  ? 'cursor-pointer fill-danger/70 stroke-danger transition-opacity'
                  : `cursor-pointer ${fatigueColorClass[level]} transition-opacity ${focus ? 'opacity-40' : 'opacity-90 hover:opacity-100'}`
              }
              strokeWidth={isSel ? 3 : 1.5}
              onClick={() => onSelect?.(r.id)}
              role="button"
              tabIndex={0}
              aria-label={`${r.label}${isSel ? `, ${t('cuerpo.resaltado')}` : ''}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onSelect?.(r.id)
              }}
            />
          )
        })}
      </svg>
      {showLegend && (
        <ul className="mt-3 flex flex-wrap justify-center gap-2 text-[0.65rem]">
          {(['fresh', 'warm', 'fatigued', 'sore'] as FatigueLevel[]).map((l) => (
            <li key={l} className="flex items-center gap-1 text-muted">
              <span
                className={`inline-block size-2.5 rounded-sm border ${
                  l === 'fresh'
                    ? 'border-border bg-muted/40'
                    : l === 'warm'
                      ? 'border-accent/60 bg-accent/30'
                      : l === 'fatigued'
                        ? 'border-cta bg-cta/50'
                        : 'border-success bg-success/40'
                }`}
              />
              {fatigueLabel[l]}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
