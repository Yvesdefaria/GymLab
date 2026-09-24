// Página de comparación de fotos de progreso: A|B por ángulo, en modo dividido o alternado.
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ProgressPhotoEntry } from '@/domain/types'
import { AppHeader } from '@/components/layout/AppHeader'
import { BackLink } from '@/components/ui/BackLink'

const ANGLES = ['frontUri', 'sideUri', 'backUri'] as const
type Angle = (typeof ANGLES)[number]
type Mode = 'split' | 'toggle'

interface ProgressPhotosComparePageProps {
  photos: ProgressPhotoEntry[]
}

export const ProgressPhotosComparePage = ({ photos }: ProgressPhotosComparePageProps) => {
  const { t } = useTranslation()
  const dates = [...new Set(photos.map((p) => p.localDate))].sort().reverse()
  const [dateA, setDateA] = useState('')
  const [dateB, setDateB] = useState('')
  const [angle, setAngle] = useState<Angle>('frontUri')
  const [mode, setMode] = useState<Mode>('split')
  const [showB, setShowB] = useState(false)

  // Por defecto, las dos fechas más recientes; la elección del usuario no se pisa.
  const selA = dateA || dates[0] || ''
  const selB = dateB || dates[1] || ''
  const srcA = photos.find((p) => p.localDate === selA)?.[angle] ?? null
  const srcB = photos.find((p) => p.localDate === selB)?.[angle] ?? null

  const selectCls =
    'flex-1 min-h-[44px] rounded-xl border border-border/30 bg-bg-elevated/50 px-3 py-2 text-sm text-fg'
  const tabCls = (active: boolean) =>
    `min-h-[44px] flex-1 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
      active ? 'bg-accent text-accent-fg' : 'bg-accent/10 text-accent'
    }`

  if (dates.length < 2) {
    return (
      <div>
        <AppHeader title={t('progressPhotos.compareTitle')} />
        <div className="flex flex-col gap-4 px-4 pb-20 pt-2">
          <BackLink to="/progreso-fotos" />
          <p className="text-sm text-muted">{t('progressPhotos.needTwoDates')}</p>
        </div>
      </div>
    )
  }

  const placeholder = (
    <div className="flex aspect-[3/4] w-full items-center justify-center rounded-xl bg-bg-elevated/50">
      <span className="text-xs text-muted">{t('progressPhotos.noPhoto')}</span>
    </div>
  )

  return (
    <div>
      <AppHeader title={t('progressPhotos.compareTitle')} />
      <div className="flex flex-col gap-4 px-4 pb-20 pt-2">
        <BackLink to="/progreso-fotos" />

        {/* Fechas A y B: cada lado usa UNA fecha para los 3 ángulos. */}
        <div className="flex gap-3">
          <select
            value={selA}
            onChange={(e) => setDateA(e.target.value)}
            aria-label={t('progressPhotos.dateA')}
            className={selectCls}
          >
            {dates.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <select
            value={selB}
            onChange={(e) => setDateB(e.target.value)}
            aria-label={t('progressPhotos.dateB')}
            className={selectCls}
          >
            {dates.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Ángulo activo */}
        <div className="flex gap-2">
          {ANGLES.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAngle(a)}
              aria-pressed={angle === a}
              className={tabCls(angle === a)}
            >
              {t(`progressPhotos.${a}`)}
            </button>
          ))}
        </div>

        {/* Modo de vista */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode('split')}
            aria-pressed={mode === 'split'}
            className={tabCls(mode === 'split')}
          >
            {t('progressPhotos.modeSplit')}
          </button>
          <button
            type="button"
            onClick={() => setMode('toggle')}
            aria-pressed={mode === 'toggle'}
            className={tabCls(mode === 'toggle')}
          >
            {t('progressPhotos.modeAlternate')}
          </button>
        </div>

        {mode === 'split' ? (
          <div className="grid grid-cols-2 gap-3">
            {[
              { src: srcA, label: selA, side: 'A' },
              { src: srcB, label: selB, side: 'B' },
            ].map(({ src, label, side }) => (
              <div key={side} className="flex flex-col gap-1.5">
                <p className="text-center text-xs text-muted">
                  {side} · {label}
                </p>
                {src ? (
                  <img
                    src={src}
                    alt=""
                    className="aspect-[3/4] w-full rounded-xl bg-bg-elevated/50 object-contain"
                    loading="lazy"
                  />
                ) : (
                  placeholder
                )}
              </div>
            ))}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowB((v) => !v)}
            aria-label={t('progressPhotos.modeAlternate')}
            className="relative w-full"
          >
            {(showB ? srcB : srcA) ? (
              <img
                src={(showB ? srcB : srcA)!}
                alt=""
                className="aspect-[3/4] w-full rounded-xl bg-bg-elevated/50 object-contain"
              />
            ) : (
              placeholder
            )}
            <span className="absolute left-3 top-3 rounded-lg bg-black/60 px-2 py-1 text-xs font-semibold text-fg">
              {(showB ? 'B' : 'A') + ' · ' + (showB ? selB : selA)}
            </span>
          </button>
        )}
      </div>
    </div>
  )
}
