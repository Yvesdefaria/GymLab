// @vitest-environment jsdom
// Héroe del perfil: racha, máximo, tira de 30 días, insignia y fallback honesto.
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import '@/i18n'
import { ProfileStreakHero } from '@/components/profile/ProfileStreakHero'
import type { StreakResult } from '@/domain/types'

type HeroWorkout = { localDate: string; startedAt: string; finishedAt: string | null }

const streak = (overrides: Partial<StreakResult> = {}): StreakResult => ({
  currentStreak: 5,
  longestStreak: 11,
  lastWorkoutDate: '2026-10-22',
  ...overrides,
})

const workout = (localDate: string): HeroWorkout => ({
  localDate,
  startedAt: `${localDate}T10:00:00`,
  finishedAt: `${localDate}T11:00:00`,
})

const renderHero = (props: {
  streak?: StreakResult
  workouts?: HeroWorkout[]
  today?: string
}) =>
  render(
    <ProfileStreakHero
      streak={props.streak ?? streak()}
      workouts={props.workouts ?? [workout('2026-10-22'), workout('2026-10-20')]}
      today={props.today ?? '2026-10-23'}
    />,
  )

afterEach(cleanup)

describe('ProfileStreakHero', () => {
  it('pinta la racha, el máximo y la unidad', () => {
    renderHero({})
    expect(screen.getByText('5')).toBeTruthy()
    expect(screen.getByText('11')).toBeTruthy()
    expect(screen.getByText('semanas')).toBeTruthy()
  })

  it('muestra la próxima insignia con las semanas restantes', () => {
    renderHero({ streak: streak({ currentStreak: 5 }) })
    expect(screen.getByText(/A 3 semanas de la insignia de racha de 2 meses/i)).toBeTruthy()
  })

  it('sin insignia próxima cae al último entreno', () => {
    renderHero({
      streak: streak({ currentStreak: 16, longestStreak: 16 }),
      workouts: [workout('2026-10-22')],
    })
    expect(screen.getByText(/Último entreno/i)).toBeTruthy()
    expect(screen.queryByText(/insignia/i)).toBeNull()
  })

  it('con racha rota muestra 0 y el mensaje honesto', () => {
    renderHero({ streak: streak({ currentStreak: 0, lastWorkoutDate: '2026-10-22' }) })
    expect(screen.getByText('0')).toBeTruthy()
    expect(screen.getByText(/Tu racha se rompió/i)).toBeTruthy()
  })

  it('cuenta los días activos de la ventana de 30 días', () => {
    renderHero({
      workouts: [workout('2026-10-23'), workout('2026-10-20')],
      today: '2026-10-23',
    })
    expect(screen.getByText(/2 \/ 30 días/i)).toBeTruthy()
  })

  it('dibuja 30 celdas aunque haya pocos días activos', () => {
    const { getAllByTestId } = renderHero({ workouts: [workout('2026-10-23')] })
    expect(getAllByTestId('streak-cell')).toHaveLength(30)
  })

  it('no renderiza nada sin entrenos', () => {
    const { container } = renderHero({ workouts: [], streak: streak({ currentStreak: 0, longestStreak: 0, lastWorkoutDate: null }) })
    expect(container.firstChild).toBeNull()
  })
})
