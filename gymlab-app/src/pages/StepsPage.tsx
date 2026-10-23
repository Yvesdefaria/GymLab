// Página /pasos con la expresión Nocturno Minimal (dirección C): héroe circular,
// mini calendario semanal, gráficas de hoy/semana/mes/año, calendario de actividad
// navegable hacia atrás y meta/alta manual escondidas en el menú de opciones.
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MoreHorizontal } from 'lucide-react'
import { Capacitor } from '@capacitor/core'
import { AppHeader } from '../components/layout/AppHeader'
import { StepHero } from '../components/steps/StepHero'
import { StepWeekStrip } from '../components/steps/StepWeekStrip'
import { StepTodayChart } from '../components/steps/StepTodayChart'
import { StepWeekChart } from '../components/steps/StepWeekChart'
import { StepMonthChart } from '../components/steps/StepMonthChart'
import { StepYearChart } from '../components/steps/StepYearChart'
import { StepActivityCalendar } from '../components/steps/StepActivityCalendar'
import { StepStats } from '../components/steps/StepStats'
import { StepAchievements } from '../components/steps/StepAchievements'
import { StepDailyChallenge } from '../components/steps/StepDailyChallenge'
import { StepSyncStatus } from '../components/steps/StepSyncStatus'
import { StepGoalSheet } from '../components/steps/StepGoalSheet'
import { StepManualSheet } from '../components/steps/StepManualSheet'
import { StepOptionsSheet } from '../components/steps/StepOptionsSheet'
import { HealthSyncBanner } from '../components/steps/HealthSyncBanner'
import { useStepData } from '@/hooks/useStepData'
import { useHealthSync } from '@/hooks/useHealthSync'
import { useAchievementsData } from '@/hooks/useAchievementsData'
import { useTodayHourlySteps } from '@/hooks/useTodayHourlySteps'
import {
  currentMonthKey,
  getMonthEntries,
  getMonthsWithData,
} from '@/domain/stepAnalytics'
import { toLocalDateStr } from '@/domain/dates'
import type { AppLanguage } from '@/domain/onboarding'
import { formatDate } from '@/lib/intl'

type Sheet = 'none' | 'options' | 'goal' | 'manual'

export const StepsPage = () => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  // Logros de pasos unificados (F109.1): mismos ids persistidos que /logros y el
  // proveedor único de stepDays (F120/P1), sin un segundo scan de Dexie.
  const { stepDays, savedIds: unlockedIds } = useAchievementsData()
  const { today, week, streak, goal, recordSteps, setGoal } = useStepData(stepDays)
  const health = useHealthSync()
  const hourly = useTodayHourlySteps(health.status)

  const [sheet, setSheet] = useState<Sheet>('none')
  const [selectedMonth, setSelectedMonth] = useState(() => currentMonthKey())
  const todayKey = toLocalDateStr()
  const currentMonth = currentMonthKey(todayKey)
  const year = Number(currentMonth.slice(0, 4))

  const months = useMemo(
    () => getMonthsWithData(stepDays, currentMonth),
    [stepDays, currentMonth],
  )
  const effectiveMonth = months.includes(selectedMonth) ? selectedMonth : currentMonth
  const monthEntries = useMemo(
    () => getMonthEntries(stepDays, effectiveMonth),
    [stepDays, effectiveMonth],
  )

  const steps = today?.steps ?? 0
  const distanceKm = today?.distanceKm ?? 0
  const calories = today?.calories ?? 0
  const dateLabel = formatDate(new Date(), lang, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <div>
      <AppHeader
        title={t('steps.pageTitle')}
        kicker={dateLabel}
        actions={
          <button
            type="button"
            onClick={() => setSheet('options')}
            aria-label={t('steps.menuAria')}
            className="flex size-11 items-center justify-center rounded-full text-muted"
          >
            <MoreHorizontal className="size-5" aria-hidden />
          </button>
        }
      />

      <div className="space-y-5 px-4 pb-8 pt-4">
        <HealthSyncBanner status={health.status} onAction={() => void health.connect()} />
        <StepSyncStatus connected={health.status === 'granted'} />

        <StepHero steps={steps} goal={goal} onEditGoal={() => setSheet('goal')} />
        <StepWeekStrip week={week} goal={goal} today={todayKey} />

        <StepTodayChart
          hours={hourly.hours}
          available={hourly.available}
          canConnect={Capacitor.isNativePlatform()}
          onConnect={() => void health.connect()}
        />
        <StepWeekChart week={week} goal={goal} />
        <StepMonthChart
          entries={monthEntries}
          monthKey={effectiveMonth}
          goal={goal}
          today={todayKey}
        />
        <StepYearChart entries={stepDays} year={year} today={todayKey} />

        <StepActivityCalendar
          monthKey={effectiveMonth}
          entries={monthEntries}
          goal={goal}
          today={todayKey}
          monthsWithData={months}
          onMonthChange={setSelectedMonth}
        />

        <StepStats distanceKm={distanceKm} calories={calories} streak={streak} />
        <StepAchievements unlockedIds={unlockedIds} />
        <StepDailyChallenge steps={steps} goal={goal} />
      </div>

      <StepOptionsSheet
        open={sheet === 'options'}
        goal={goal}
        onClose={() => setSheet('none')}
        onManual={() => setSheet('manual')}
        onGoal={() => setSheet('goal')}
      />
      <StepGoalSheet
        open={sheet === 'goal'}
        goal={goal}
        onClose={() => setSheet('none')}
        onSave={async (value) => {
          await setGoal(value)
          setSheet('none')
        }}
      />
      <StepManualSheet
        open={sheet === 'manual'}
        currentSteps={steps}
        onClose={() => setSheet('none')}
        onSave={async (value) => {
          await recordSteps(value)
          setSheet('none')
        }}
      />
    </div>
  )
}
