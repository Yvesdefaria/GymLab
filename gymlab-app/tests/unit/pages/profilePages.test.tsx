// @vitest-environment jsdom
// Composición de /perfil y /perfil/historial: héroe vs empty state, links por
// sección, paginación del historial y guarda del comparador con 1 entreno.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import '@/i18n'

const data = vi.hoisted(() => ({
  current: {} as Record<string, unknown>,
  bestSession: vi.fn(() => null),
}))

vi.mock('@/hooks/useAchievementsData', () => ({
  useAchievementsData: () => data.current,
}))
vi.mock('@/hooks/useSettings', () => ({
  useSettings: () => ({ settings: { units: 'kg' } }),
}))
vi.mock('@/hooks/useExerciseCatalog', () => ({
  useExerciseCatalog: () => ({ exercises: data.current.exercises }),
}))
vi.mock('@/hooks/useBodyProfile', () => ({
  useBodyProfile: () => ({ age: 35, bodySex: 'male', heightCm: 180, weightKg: 78.4 }),
}))
vi.mock('@/hooks/useAvatar', () => ({
  useAvatar: () => ({ avatarUri: null, setAvatar: vi.fn() }),
}))
vi.mock('@/hooks/useProfileName', () => ({
  useProfileName: () => ({ name: 'Yves', setName: vi.fn() }),
}))
vi.mock('@/components/profile/AvatarPicker', () => ({ AvatarPicker: () => null }))
vi.mock('@/components/profile/ProfileDeloadRow', () => ({ ProfileDeloadRow: () => null }))
vi.mock('@/components/profile/BestSessionCard', () => ({
  BestSessionCard: data.bestSession,
}))

import { PerfilPage } from '@/pages/PerfilPage'
import { PerfilHistorialPage } from '@/pages/PerfilHistorialPage'
import type { Exercise, PRRecord, Workout } from '@/domain/types'

const ymd = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

const workout = (id: number, daysAgo: number): Workout => {
  const date = new Date(2026, 9, 23)
  date.setDate(date.getDate() - daysAgo)
  const day = ymd(date)
  return {
    id,
    startedAt: `${day}T10:00:00`,
    finishedAt: `${day}T11:00:00`,
    routineId: null,
    routineDayId: null,
    localDate: day,
    notes: '',
    totalVolume: 12000 + id * 100,
  }
}

const pr = (exerciseId: number): PRRecord => ({
  exerciseId,
  weightKg: 100,
  reps: 5,
  date: '2026-10-20T11:00:00',
  estimated1RM: 112,
})

const exercise = (id: number, name: string, muscleGroup: Exercise['muscleGroup'] = 'pecho'): Exercise => ({
  id,
  slug: `e${id}`,
  name,
  muscleGroup,
  equipment: ['barra'],
  instructions: '',
})

const base = (overrides: Record<string, unknown>) => {
  const prs = (overrides.prs as ReturnType<typeof pr>[] | undefined) ?? [pr(1)]
  return {
    workouts: [workout(1, 0), workout(2, 2)],
    prs,
    bestPrs: prs,
    streak: { currentStreak: 5, longestStreak: 11, lastWorkoutDate: '2026-10-23' },
    savedIds: ['inaugural'],
    counts: { inaugural: 1 },
    collectibles: [],
    bodyWeights: [],
    exercises: [exercise(1, 'Press de banca'), exercise(2, 'Sentadilla', 'pierna')],
    ...overrides,
  }
}

const renderPerfil = () =>
  render(
    <MemoryRouter initialEntries={['/perfil']}>
      <PerfilPage />
    </MemoryRouter>,
  )

const renderHistorial = () =>
  render(
    <MemoryRouter initialEntries={['/perfil/historial']}>
      <PerfilHistorialPage />
    </MemoryRouter>,
  )

const workoutLinks = () =>
  screen
    .getAllByRole('link')
    .filter((link) => link.getAttribute('href')?.startsWith('/entrenamiento/'))

beforeEach(() => {
  data.current = base({})
  data.bestSession.mockClear()
})

afterEach(cleanup)

describe('PerfilPage', () => {
  it('compone héroe, fila de stats y secciones con sus links', () => {
    renderPerfil()

    expect(screen.getByText('Racha actual')).toBeTruthy()
    expect(screen.getByText('5')).toBeTruthy()
    expect(screen.getByText(/2 entrenos · desde/)).toBeTruthy()
    expect(screen.getByText('Volumen semanal')).toBeTruthy()
    expect(screen.getByText('Press de banca')).toBeTruthy()
    expect(screen.getByText('Historial reciente')).toBeTruthy()
    expect(screen.getByText('Tus datos')).toBeTruthy()
    expect(screen.getByText('Chapas')).toBeTruthy()
    expect(screen.queryByText('Todavía no hay datos')).toBeNull()

    expect(screen.getByRole('link', { name: 'Ver todo' }).getAttribute('href')).toBe(
      '/perfil/historial',
    )
    const seeAll = screen.getAllByRole('link', { name: 'Ver todas' })
    expect(seeAll.map((link) => link.getAttribute('href'))).toEqual([
      '/perfil/historial',
      '/logros',
    ])
  })

  it('con 0 entrenos muestra un único empty state y conserva Tus datos', () => {
    data.current = base({
      workouts: [],
      prs: [],
      streak: { currentStreak: 0, longestStreak: 0, lastWorkoutDate: null },
      savedIds: [],
      counts: {},
    })
    renderPerfil()

    expect(screen.getByText('Todavía no hay datos')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Empezar a entrenar' }).getAttribute('href')).toBe('/')
    expect(screen.queryByText('Racha actual')).toBeNull()
    expect(screen.queryByText('Volumen semanal')).toBeNull()
    expect(screen.queryByText('Chapas')).toBeNull()
    expect(screen.getByText('Tus datos')).toBeTruthy()
    expect(screen.getByText('35 años')).toBeTruthy()
  })
})

describe('PerfilHistorialPage', () => {
  it('pagina el timeline de 10 en 10 y mantiene el comparador al final', () => {
    const workouts = Array.from({ length: 25 }, (_, index) => workout(index + 1, index * 2))
    data.current = base({ workouts, prs: [pr(1), pr(2)] })
    renderHistorial()

    expect(screen.getByText('Historial')).toBeTruthy()
    expect(screen.getByText('2 marcas')).toBeTruthy()
    expect(screen.getByText('octubre de 2026')).toBeTruthy()
    expect(workoutLinks()).toHaveLength(10)

    fireEvent.click(screen.getByText('Ver más entrenos'))
    expect(workoutLinks()).toHaveLength(20)

    fireEvent.click(screen.getByText('Ver más entrenos'))
    expect(workoutLinks()).toHaveLength(25)
    expect(screen.queryByText('Ver más entrenos')).toBeNull()
    expect(data.bestSession).toHaveBeenCalled()
  })

  it('con 1 entreno no monta el comparador ni un shell vacío', () => {
    data.current = base({ workouts: [workout(1, 0)] })
    renderHistorial()

    expect(workoutLinks()).toHaveLength(1)
    expect(screen.queryByText('Ver más entrenos')).toBeNull()
    expect(data.bestSession).not.toHaveBeenCalled()
  })

  it('con 0 entrenos muestra el empty state y no monta el comparador', () => {
    data.current = base({
      workouts: [],
      prs: [],
      streak: { currentStreak: 0, longestStreak: 0, lastWorkoutDate: null },
      savedIds: [],
      counts: {},
    })
    renderHistorial()

    expect(screen.getByText('Todavía no hay datos')).toBeTruthy()
    expect(data.bestSession).not.toHaveBeenCalled()
  })
})
