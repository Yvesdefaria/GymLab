// Comparador de fotos (F132.5): fechas A/B en filas hairline (select nativo invisible
// para conservar accesibilidad y e2e), ángulo/modo en segmentados, vista dividida o
// alternada y delta de peso cuando ambas fechas tienen registro.
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronRight } from 'lucide-react'
import { AppHeader } from '@/components/layout/AppHeader'
import { BackLink } from '@/components/ui/BackLink'
import { CompareWeightDelta } from '@/components/photos/CompareWeightDelta'
import { useSettings } from '@/hooks/useSettings'
import { weightDeltaBetween } from '@/domain/bodyProgress'
import { diffLocalDays, toLocalDateStr } from '@/domain/dates'
import { formatDate } from '@/lib/intl'
import type { AppLanguage } from '@/domain/onboarding'
import type { BodyWeightEntry, ProgressPhotoEntry } from '@/domain/types'

const ANGLES = ['frontUri', 'sideUri', 'backUri'] as const
type Angle = (typeof ANGLES)[number]
type Mode = 'split' | 'toggle'

const ANGLE_LABEL = {
  frontUri: 'progressPhotos.frontUri',
  sideUri: 'progressPhotos.sideUri',
  backUri: 'progressPhotos.backUri',
} as const

interface ProgressPhotosComparePageProps {
  photos: ProgressPhotoEntry[]
  bodyWeights: BodyWeightEntry[]
}

export const ProgressPhotosComparePage = ({
  photos,
  bodyWeights,
}: ProgressPhotosComparePageProps) => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const { settings } = useSettings()
  const today = toLocalDateStr()
  const dates = [...new Set(photos.map((p) => p.localDate))].sort().reverse()
  const [dateA, setDateA] = useState('')
  const [dateB, setDateB] = useState('')
  const [angle, setAngle] = useState<Angle>('frontUri')
  const [mode, setMode] = useState<Mode>('split')
  const [showB, setShowB] = useState(false)

  // Por defecto A = fecha más antigua y B = más reciente, para que el delta se lea
  // como progreso (de A a B). La elección del usuario no se pisa.
  const selA = dateA || dates[1] || ''
  const selB = dateB || dates[0] || ''
  const srcA = photos.find((p) => p.localDate === selA)?.[angle] ?? null
  const srcB = photos.find((p) => p.localDate === selB)?.[angle] ?? null
  const weightDelta = weightDeltaBetween(bodyWeights, selA, selB)

  const format = (localDate: string) =>
    formatDate(localDate + 'T12:00:00', lang, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })

  const relative = (localDate: string) => {
    if (!localDate) return ''
    return diffLocalDays(localDate, today) === 0
      ? t('progressPhotos.hoy')
      : t('progressPhotos.haceDias', { count: diffLocalDays(localDate, today) })
  }

  const pairRow = (
    side: 'A' | 'B',
    value: string,
    onChange: (value: string) => void,
    aria: 'dateA' | 'dateB',
  ) => (
    <label className="relative flex min-h-[52px] items-center gap-3 border-t border-border/10 first:border-t-0">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-lg border border-gold/40 bg-gold/8 text-[10px] font-semibold text-gold-bright">
        {side}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[12px] font-medium text-fg">
          {value ? format(value) : t('progressPhotos.noPhoto')}
        </span>
        <span className="block text-[9px] text-muted">{value ? relative(value) : ''}</span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-muted" aria-hidden />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={aria === 'dateA' ? t('progressPhotos.dateA') : t('progressPhotos.dateB')}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      >
        {dates.map((d) => (
          <option key={d} value={d}>
            {format(d)}
          </option>
        ))}
      </select>
    </label>
  )

  const placeholder = (
    <span
      data-photo-missing
      className="flex h-full w-full items-center justify-center text-[10px] text-muted"
    >
      {t('progressPhotos.noPhoto')}
    </span>
  )

  if (dates.length < 2) {
    return (
      <div>
        <AppHeader
          kicker={t('progressPhotos.kicker')}
          title={t('progressPhotos.compareTitle')}
        />
        <div className="px-4 pb-24">
          <BackLink to="/progreso-fotos" />
          <p className="border-t border-border/40 pt-4 text-sm text-muted">
            {t('progressPhotos.needTwoDates')}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <AppHeader kicker={t('progressPhotos.kicker')} title={t('progressPhotos.compareTitle')} />
      <div className="px-4 pb-24">
        <BackLink to="/progreso-fotos" />

        <div className="border-t border-border/40">
          {pairRow('A', selA, setDateA, 'dateA')}
          {pairRow('B', selB, setDateB, 'dateB')}
        </div>

        <div
          role="group"
          aria-label={t('progressPhotos.angleAria')}
          className="mt-3 grid grid-cols-3 gap-1 rounded-xl border border-border/40 p-1"
        >
          {ANGLES.map((a) => (
            <button
              key={a}
              type="button"
              data-angle={a}
              aria-pressed={angle === a}
              onClick={() => setAngle(a)}
              className={`min-h-[44px] rounded-lg text-[11px] font-medium transition-colors ${
                angle === a ? 'bg-gold/12 text-gold-bright' : 'text-muted'
              }`}
            >
              {t(ANGLE_LABEL[a])}
            </button>
          ))}
        </div>

        <div
          role="group"
          aria-label={t('progressPhotos.modeAria')}
          className="mt-1.5 grid grid-cols-2 gap-1 rounded-xl border border-border/40 p-1"
        >
          {(['split', 'toggle'] as const).map((m) => (
            <button
              key={m}
              type="button"
              data-mode={m}
              aria-pressed={mode === m}
              onClick={() => setMode(m)}
              className={`min-h-[44px] rounded-lg text-[11px] font-medium transition-colors ${
                mode === m ? 'bg-gold/12 text-gold-bright' : 'text-muted'
              }`}
            >
              {m === 'split'
                ? t('progressPhotos.modeSplit')
                : t('progressPhotos.modeAlternate')}
            </button>
          ))}
        </div>

        {mode === 'split' ? (
          <div className="mt-3 grid grid-cols-2 gap-1.5">
            {[
              { src: srcA, side: 'A' as const, date: selA },
              { src: srcB, side: 'B' as const, date: selB },
            ].map(({ src, side, date }) => (
              <div key={side} className="flex flex-col gap-1">
                <div className="relative aspect-[3/4] overflow-hidden rounded-xl border border-border/30 bg-gradient-to-b from-bg-elevated to-bg">
                  {src ? (
                    <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
                  ) : (
                    placeholder
                  )}
                  <span className="absolute left-1.5 top-1.5 rounded-full border border-white/10 bg-black/60 px-1.5 py-0.5 text-[8px] font-semibold text-gold-bright">
                    {side}
                  </span>
                  <span className="absolute bottom-1.5 left-1.5 text-[8px] text-muted">
                    {format(date)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <button
            type="button"
            data-action="toggle-ab"
            aria-label={t('progressPhotos.modeAlternate')}
            onClick={() => setShowB((v) => !v)}
            className="relative mt-3 block w-full"
          >
            <span className="relative block aspect-[3/4] w-full overflow-hidden rounded-xl border border-border/30 bg-gradient-to-b from-bg-elevated to-bg">
              {(showB ? srcB : srcA) ? (
                <img
                  src={(showB ? srcB : srcA)!}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              ) : (
                placeholder
              )}
              <span className="absolute left-2 top-2 rounded-full border border-white/10 bg-black/60 px-2 py-1 text-[8.5px] font-semibold text-fg">
                {showB ? 'B' : 'A'} · {format(showB ? selB : selA)}
              </span>
            </span>
          </button>
        )}

        {weightDelta ? <CompareWeightDelta delta={weightDelta} units={settings.units} /> : null}
      </div>
    </div>
  )
}
