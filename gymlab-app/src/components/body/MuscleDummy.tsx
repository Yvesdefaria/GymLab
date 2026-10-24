// Muñeco anatómico SVG para visualizar la fatiga por grupo muscular (frente/espalda).
// Silueta reconocible + regiones orgánicas; la escala va de neutro (recuperado) a dorado
// (activo/fatigado) y rojo (muy reciente). El verde no se usa: queda para meta/PR.
import { useTranslation } from 'react-i18next'
import type { FatigueLevel, MuscleGroup } from '@/domain/types'
import { fatigueColorClass } from '@/domain/muscleFatigue'
import { localizeMuscleGroup } from '@/i18n/catalog/en'
import type { AppLanguage } from '@/domain/onboarding'
import { FATIGUE_LABEL_KEYS } from './fatigueLabels'

type Region = { id: MuscleGroup; d: string }

// Regiones visibles de frente; los grupos con dos lados repiten el id para que
// la selección y el color se apliquen a ambas mitades.
const FRONT_REGIONS: Region[] = [
  { id: 'hombro', d: 'M50 68 a10 12 0 1 0 20 0 a10 12 0 1 0 -20 0' },
  { id: 'hombro', d: 'M130 68 a10 12 0 1 0 20 0 a10 12 0 1 0 -20 0' },
  { id: 'trapecios', d: 'M82 50 Q100 44 118 50 L114 62 Q100 56 86 62 Z' },
  { id: 'pecho', d: 'M74 62 Q88 56 99 61 L97 84 Q84 88 74 82 Z' },
  { id: 'pecho', d: 'M126 62 Q112 56 101 61 L103 84 Q116 88 126 82 Z' },
  { id: 'abdomen', d: 'M84 90 Q100 86 116 90 L114 128 Q100 134 86 128 Z' },
  { id: 'biceps', d: 'M54 78 Q46 88 48 104 L60 102 Q60 88 63 78 Z' },
  { id: 'biceps', d: 'M146 78 Q154 88 152 104 L140 102 Q140 88 137 78 Z' },
  { id: 'antebrazo', d: 'M50 112 Q44 132 48 152 L58 150 Q56 132 60 114 Z' },
  { id: 'antebrazo', d: 'M150 112 Q156 132 152 152 L142 150 Q144 132 140 114 Z' },
  { id: 'pierna', d: 'M74 166 Q70 196 74 224 L92 224 Q94 196 92 166 Z' },
  { id: 'pierna', d: 'M126 166 Q130 196 126 224 L108 224 Q106 196 108 166 Z' },
  { id: 'pierna', d: 'M74 234 Q72 260 76 284 L90 284 Q92 260 90 234 Z' },
  { id: 'pierna', d: 'M126 234 Q128 260 124 284 L110 284 Q108 260 110 234 Z' },
]

const BACK_REGIONS: Region[] = [
  { id: 'hombro', d: 'M50 68 a10 12 0 1 0 20 0 a10 12 0 1 0 -20 0' },
  { id: 'hombro', d: 'M130 68 a10 12 0 1 0 20 0 a10 12 0 1 0 -20 0' },
  { id: 'trapecios', d: 'M78 50 Q100 42 122 50 L116 66 Q100 58 84 66 Z' },
  { id: 'espalda', d: 'M72 66 Q64 86 70 110 L88 116 L88 72 Z' },
  { id: 'espalda', d: 'M128 66 Q136 86 130 110 L112 116 L112 72 Z' },
  { id: 'espalda', d: 'M82 112 Q100 108 118 112 L116 142 Q100 148 84 142 Z' },
  { id: 'triceps', d: 'M54 78 Q46 92 49 108 L61 106 Q61 90 63 78 Z' },
  { id: 'triceps', d: 'M146 78 Q154 92 151 108 L139 106 Q139 90 137 78 Z' },
  { id: 'antebrazo', d: 'M50 112 Q44 132 48 152 L58 150 Q56 132 60 114 Z' },
  { id: 'antebrazo', d: 'M150 112 Q156 132 152 152 L142 150 Q144 132 140 114 Z' },
  { id: 'gluteo', d: 'M74 142 Q68 158 76 168 L98 168 L98 140 Z' },
  { id: 'gluteo', d: 'M126 142 Q132 158 124 168 L102 168 L102 140 Z' },
  { id: 'pierna', d: 'M74 170 Q70 198 74 224 L92 224 Q94 198 92 170 Z' },
  { id: 'pierna', d: 'M126 170 Q130 198 126 224 L108 224 Q106 198 108 170 Z' },
  { id: 'pierna', d: 'M74 234 Q72 260 76 284 L90 284 Q92 260 90 234 Z' },
  { id: 'pierna', d: 'M126 234 Q128 260 124 284 L110 284 Q108 260 110 234 Z' },
]

const LEGEND: { key: FatigueLevel | 'noData'; dot: string }[] = [
  { key: 'fresh', dot: 'bg-muted/25 border-border' },
  { key: 'warm', dot: 'bg-gold/25 border-gold/60' },
  { key: 'fatigued', dot: 'bg-gold/55 border-gold' },
  { key: 'sore', dot: 'bg-danger/35 border-danger' },
  { key: 'noData', dot: 'bg-muted/10 border-border/60' },
]

type MuscleDummyProps = {
  fatigue: Partial<Record<MuscleGroup, FatigueLevel>>
  view?: 'front' | 'back'
  selected?: MuscleGroup | null
  onSelect?: (mg: MuscleGroup) => void
  highlight?: MuscleGroup | null
  showLegend?: boolean
}

export const MuscleDummy = ({
  fatigue,
  view = 'front',
  selected,
  onSelect,
  highlight,
  showLegend = true,
}: MuscleDummyProps) => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const regions = view === 'front' ? FRONT_REGIONS : BACK_REGIONS
  const focus = highlight ?? selected
  const interactive = Boolean(onSelect)
  // La región seleccionada se dibuja última para que su borde quede por encima.
  const ordered = focus
    ? [...regions].sort((a, b) => Number(a.id === focus) - Number(b.id === focus))
    : regions

  return (
    <div className="w-full">
      <svg
        viewBox="0 0 200 310"
        role={interactive ? 'group' : 'img'}
        aria-label={t('cuerpo.mapaMuscular')}
        className="mx-auto block h-auto w-full max-w-[260px]"
      >
        {/* Base del cuerpo: no interactiva, debajo de las regiones. */}
        <g className="fill-bg-elevated/60 stroke-border" strokeWidth={1.4} pointerEvents="none">
          <ellipse cx="100" cy="24" rx="15" ry="18" />
          <path d="M94 42 h12 v10 h-12 z" />
          <path d="M62 58 Q100 46 138 58 L132 98 Q130 116 126 132 L128 162 Q100 172 72 162 L74 132 Q70 116 68 98 Z" />
          <path d="M62 60 Q48 66 46 84 L52 112 L64 108 L62 82 Q68 72 70 64 Z" />
          <path d="M138 60 Q152 66 154 84 L148 112 L136 108 L138 82 Q132 72 130 64 Z" />
          <path d="M52 112 Q44 136 48 158 L60 156 Q58 136 62 114 Z" />
          <path d="M148 112 Q156 136 152 158 L140 156 Q142 136 138 114 Z" />
          <path d="M72 164 Q66 198 70 230 L92 230 Q96 198 94 164 Z" />
          <path d="M128 164 Q134 198 130 230 L108 230 Q104 198 106 164 Z" />
          <path d="M72 232 Q70 262 74 288 L90 288 Q92 262 92 232 Z" />
          <path d="M128 232 Q130 262 126 288 L110 288 Q108 262 108 232 Z" />
          <path d="M74 288 Q72 296 78 296 L88 296 Q92 296 90 288 Z" />
          <path d="M126 288 Q128 296 122 296 L112 296 Q108 296 110 288 Z" />
        </g>

        {ordered.map((r, index) => {
          const isSel = focus === r.id
          const level = fatigue[r.id]
          return (
            <path
              key={`${view}-${r.id}-${index}`}
              d={r.d}
              strokeWidth={isSel ? 2.6 : 1.2}
              onClick={() => onSelect?.(r.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onSelect?.(r.id)
              }}
              role={interactive ? 'button' : undefined}
              tabIndex={interactive ? 0 : undefined}
              aria-label={`${localizeMuscleGroup(r.id, lang)}${
                isSel ? `, ${t('cuerpo.resaltado')}` : ''
              }`}
              className={[
                isSel
                  ? 'fill-gold-bright/55 stroke-gold-bright'
                  : level
                    ? fatigueColorClass[level]
                    : 'fill-muted/10 stroke-border/60',
                interactive ? 'cursor-pointer focus:outline-none focus:stroke-gold-bright' : '',
                focus && !isSel ? 'opacity-40' : 'opacity-95',
                'transition-opacity',
              ].join(' ')}
            />
          )
        })}

        {/* Líneas del abdomen: detalle visual, nunca capturan el puntero. */}
        <path
          d="M100 90 V128 M86 104 H114 M86 116 H114"
          fill="none"
          className="pointer-events-none stroke-bg/70"
          strokeWidth={1.2}
        />
      </svg>

      {showLegend && (
        <ul className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1.5">
          {LEGEND.map((item) => (
            <li key={item.key} className="flex items-center gap-1.5 text-[9px] text-muted">
              <span className={`inline-block size-2.5 rounded-[3px] border ${item.dot}`} />
              {t(FATIGUE_LABEL_KEYS[item.key])}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
