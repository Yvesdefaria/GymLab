import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Calendar, ChevronDown, Info, Plus, Trash2, ChevronUp } from 'lucide-react'
import { getCurrentWeek, getMesocycleProgress, type PeriodizationPlan, type Mesocycle, type MesocycleType } from '@/domain/periodization'

const mesocycleBorder: Record<MesocycleType, string> = {
  volumen: 'border-l-blue-400',
  hipertrofia: 'border-l-accent',
  fuerza: 'border-l-orange-400',
  deload: 'border-l-green-400',
  potencia: 'border-l-red-400',
}

const mesocycleDot: Record<MesocycleType, string> = {
  volumen: 'bg-blue-400',
  hipertrofia: 'bg-accent',
  fuerza: 'bg-orange-400',
  deload: 'bg-green-400',
  potencia: 'bg-red-400',
}

const MESOCYCLE_TYPES: MesocycleType[] = ['volumen', 'hipertrofia', 'fuerza', 'deload', 'potencia']

interface PeriodizationViewProps {
  plan: PeriodizationPlan
  currentDate?: string
  editable?: boolean
  onSave?: (mesocycles: Mesocycle[]) => void
}

export const PeriodizationView = ({ plan, currentDate, editable, onSave }: PeriodizationViewProps) => {
  const { t } = useTranslation()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [draftMesos, setDraftMesos] = useState<Mesocycle[]>(plan.mesocycles)
  const now = currentDate ?? new Date().toISOString()
  const currentWeek = getCurrentWeek(plan, now)
  const progress = getMesocycleProgress(draftMesos, currentWeek)

  const toggle = (id: string) => setExpandedId((prev) => (prev === id ? null : id))

  const addMeso = () => {
    const lastEnd = draftMesos.length > 0
      ? draftMesos[draftMesos.length - 1].startWeek + draftMesos[draftMesos.length - 1].weeks
      : 1
    setDraftMesos((prev) => [
      ...prev,
      { id: `m${Date.now()}`, name: '', type: 'volumen', weeks: 4, startWeek: lastEnd },
    ])
  }

  const removeMeso = (id: string) => setDraftMesos((prev) => prev.filter((m) => m.id !== id))

  const moveMeso = (idx: number, dir: -1 | 1) => {
    const newIdx = idx + dir
    if (newIdx < 0 || newIdx >= draftMesos.length) return
    setDraftMesos((prev) => {
      const arr = [...prev]
      ;[arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]]
      return arr
    })
  }

  const updateMeso = (id: string, changes: Partial<Mesocycle>) =>
    setDraftMesos((prev) => prev.map((m) => (m.id === id ? { ...m, ...changes } : m)))

  const startWeekOf = (idx: number): number => {
    let w = 1
    for (let i = 0; i < idx; i++) w += draftMesos[i].weeks
    return w
  }

  const saveEdits = () => {
    const reindexed = draftMesos.map((m, i) => ({ ...m, startWeek: startWeekOf(i) }))
    setDraftMesos(reindexed)
    onSave?.(reindexed)
    setEditing(false)
  }

  const cancelEdits = () => {
    setDraftMesos(plan.mesocycles)
    setEditing(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Calendar className="size-5 text-accent" aria-hidden />
        <p className="text-base font-bold text-fg">{plan.name}</p>
        <span className="ml-auto text-sm text-muted">
          {t('periodization.week')} {currentWeek}/{plan.totalWeeks}
        </span>
        {editable && !editing && (
          <button onClick={() => setEditing(true)} className="ml-2 text-xs text-accent border border-accent/40 rounded-lg px-2 py-1 min-h-[36px]">
            {t('periodization.edit')}
          </button>
        )}
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-border/20 bg-bg-elevated/20 px-3 py-2.5">
        <Info className="size-4 text-accent shrink-0 mt-0.5" aria-hidden />
        <p className="text-xs text-muted leading-relaxed">{t('periodization.description')}</p>
      </div>

      <div className="h-2.5 w-full rounded-full bg-border/30 overflow-hidden">
        <div
          className="h-full rounded-full bg-accent transition-all duration-500"
          style={{ width: `${plan.totalWeeks > 0 ? (currentWeek / plan.totalWeeks) * 100 : 0}%` }}
        />
      </div>

      <div className="flex flex-col gap-2">
        {(editing ? draftMesos : progress).map((entry, mapIdx) => {
          const meso = editing ? (entry as Mesocycle) : (entry as { mesocycle: Mesocycle; progress: number }).mesocycle
          const pct = editing ? 0 : (entry as { mesocycle: Mesocycle; progress: number }).progress
          const isCurrent = !editing && pct > 0 && pct < 1
          const isExpanded = expandedId === meso.id
          const weeksDone = editing ? 0 : Math.round(pct * meso.weeks)
          const idx = editing ? mapIdx : -1

          return (
            <div key={meso.id}>
              <div
                role="button"
                tabIndex={0}
                onClick={() => toggle(meso.id)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggle(meso.id) }}
                className={`flex w-full items-center gap-3 rounded-xl border-l-4 px-3 py-3 text-left transition-colors min-h-[48px] cursor-pointer ${mesocycleBorder[meso.type]} ${isCurrent ? 'bg-bg-elevated/50' : 'bg-bg-elevated/20'} border border-border/15`}
              >
                <div className={`size-2.5 rounded-full shrink-0 ${mesocycleDot[meso.type]} ${!isCurrent && pct < 1 ? 'opacity-40' : ''}`} />
                <div className="flex-1 min-w-0">
                  {editing ? (
                    <div className="flex gap-2">
                      <input value={meso.name} onChange={(e) => updateMeso(meso.id, { name: e.target.value })} placeholder={t('periodization.mesocycleName')} className="flex-1 bg-bg-elevated/40 border border-border/30 rounded-lg px-2 py-1 text-sm text-fg min-w-0" />
                      <select value={meso.type} onChange={(e) => updateMeso(meso.id, { type: e.target.value as MesocycleType })} className="bg-bg-elevated/40 border border-border/30 rounded-lg px-2 py-1 text-sm text-fg">
                        {MESOCYCLE_TYPES.map((tp) => (
                          <option key={tp} value={tp}>{t(`periodization.type.${tp}` as any)}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <>
                      <p className={`text-sm font-semibold truncate ${isCurrent ? 'text-fg' : 'text-muted'}`}>{meso.name || t(`periodization.type.${meso.type}` as any)}</p>
                      <p className="text-xs text-muted">{t(`periodization.type.${meso.type}` as any)} · {meso.weeks} {t('periodization.weeksShort')}</p>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {editing ? (
                    <>
                      <input type="number" min={1} max={52} value={meso.weeks} onChange={(e) => updateMeso(meso.id, { weeks: Math.max(1, parseInt(e.target.value) || 1) })} className="w-14 bg-bg-elevated/40 border border-border/30 rounded-lg px-2 py-1 text-sm text-fg text-center" />
                      <div className="flex flex-col gap-0.5">
                        <button onClick={(e) => { e.stopPropagation(); moveMeso(idx, -1) }} disabled={idx === 0} className="p-0.5 rounded hover:bg-bg-elevated/30 disabled:opacity-30 min-h-[20px] min-w-[20px] flex items-center justify-center" aria-label={t('periodization.moveUp' as any)}>
                          <ChevronUp className="size-3 text-muted" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); moveMeso(idx, 1) }} disabled={idx === draftMesos.length - 1} className="p-0.5 rounded hover:bg-bg-elevated/30 disabled:opacity-30 min-h-[20px] min-w-[20px] flex items-center justify-center" aria-label={t('periodization.moveDown' as any)}>
                          <ChevronDown className="size-3 text-muted" />
                        </button>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); removeMeso(meso.id) }} className="p-1.5 rounded-lg hover:bg-red-400/20 min-h-[36px] min-w-[36px] flex items-center justify-center" aria-label={t('periodization.removeMesocycle')}>
                        <Trash2 className="size-4 text-red-400" />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className={`text-sm font-medium ${isCurrent ? 'text-accent' : 'text-muted'}`}>{weeksDone}/{meso.weeks}</span>
                      <ChevronDown className={`size-4 text-muted transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} aria-hidden />
                    </>
                  )}
                </div>
              </div>

              {!editing && isExpanded && (
                <div className="mt-1 ml-2 rounded-xl border border-border/15 bg-bg-elevated/15 px-3 py-3">
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-muted mb-1">
                      <span>{t('periodization.progress')}</span>
                      <span className="font-medium text-fg">{Math.round(pct * 100)}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-border/30 overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${mesocycleDot[meso.type]}`} style={{ width: `${pct * 100}%` }} />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div>
                      <p className="text-muted mb-0.5">{t('periodization.totalWeeks')}</p>
                      <p className="font-semibold text-fg">{meso.weeks}</p>
                    </div>
                    <div>
                      <p className="text-muted mb-0.5">{t('periodization.elapsed')}</p>
                      <p className="font-semibold text-fg">{weeksDone}</p>
                    </div>
                    <div>
                      <p className="text-muted mb-0.5">{t('periodization.status')}</p>
                      <p className={`font-semibold ${pct >= 1 ? 'text-green-400' : isCurrent ? 'text-accent' : 'text-muted'}`}>
                        {pct >= 1 ? t('periodization.completed') : isCurrent ? t('periodization.inProgress') : t('periodization.pending')}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {editing && (
        <div className="flex gap-2">
          <button onClick={addMeso} className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-dashed border-border/30 bg-bg-elevated/15 py-2.5 text-sm text-muted hover:bg-bg-elevated/30 min-h-[44px]">
            <Plus className="size-4" /> {t('periodization.addMesocycle')}
          </button>
          <button onClick={cancelEdits} className="rounded-xl border border-border/30 bg-bg-elevated/15 px-4 py-2.5 text-sm text-muted min-h-[44px]">
            {t('periodization.cancel')}
          </button>
          <button onClick={saveEdits} className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-bg min-h-[44px]">
            {t('periodization.save')}
          </button>
        </div>
      )}
    </div>
  )
}
