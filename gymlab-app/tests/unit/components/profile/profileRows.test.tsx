// @vitest-environment jsdom
// Filas presentacionales del perfil: datos honestos, historial con paginación y marcas.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import '@/i18n'
import { ProfileDataRows } from '@/components/profile/ProfileDataRows'
import { ProfileWorkoutRows } from '@/components/profile/ProfileWorkoutRows'
import { ProfilePrRows } from '@/components/profile/ProfilePrRows'
import type { Exercise, PRRecord, Workout } from '@/domain/types'

const withRouter = (node: React.ReactNode) => render(<MemoryRouter>{node}</MemoryRouter>)

const workout = (id: number, localDate: string, totalVolume = 5000): Workout => ({
  id,
  startedAt: `${localDate}T10:00:00`,
  finishedAt: `${localDate}T10:58:00`,
  routineId: null,
  routineDayId: null,
  localDate,
  notes: '',
  totalVolume,
})

const pr = (exerciseId: number, weightKg: number): PRRecord => ({
  exerciseId,
  weightKg,
  reps: 5,
  estimated1RM: weightKg * 1.12,
  date: '2026-10-20',
})

const exercise = (id: number, name: string, muscleGroup: Exercise['muscleGroup']): Exercise => ({
  id,
  slug: `e${id}`,
  name,
  muscleGroup,
  equipment: ['barra'],
  instructions: '',
})

afterEach(cleanup)

describe('ProfileDataRows', () => {
  it('muestra edad de lectura y filas editables con su destino', () => {
    withRouter(
      <ProfileDataRows age={35} heightCm={180} bodySex="male" weightKg={78.4} units="kg" />,
    )
    expect(screen.getByText('35 años')).toBeTruthy()
    expect(screen.getByText('180 cm · Hombre')).toBeTruthy()
    expect(screen.getByText('78,4 kg')).toBeTruthy()

    // La edad no es un enlace: no hay editor de fecha de nacimiento todavía.
    expect(screen.getByText('Edad').closest('a')).toBeNull()
    expect(screen.getByText('Altura y sexo').closest('a')?.getAttribute('href')).toBe(
      '/calculadoras/medidas',
    )
    expect(screen.getByText('Peso').closest('a')?.getAttribute('href')).toBe('/peso-corporal')
  })

  it('omite las filas sin dato', () => {
    withRouter(
      <ProfileDataRows age={35} heightCm={null} bodySex={null} weightKg={null} units="kg" />,
    )
    expect(screen.getByText('Edad')).toBeTruthy()
    expect(screen.queryByText('Altura y sexo')).toBeNull()
    expect(screen.queryByText('Peso')).toBeNull()
  })

  it('no renderiza nada sin datos', () => {
    const { container } = withRouter(
      <ProfileDataRows age={null} heightCm={null} bodySex={null} weightKg={null} units="kg" />,
    )
    expect(container.firstChild).toBeNull()
  })
})

describe('ProfileWorkoutRows', () => {
  const workouts = Array.from({ length: 25 }, (_, i) =>
    workout(
      i + 1,
      `2026-10-${String((i % 20) + 1).padStart(2, '0')}`,
      i === 0 ? 12480 : 5000,
    ),
  )

  it('respeta el límite y linkea a la sesión', () => {
    withRouter(<ProfileWorkoutRows workouts={workouts} units="kg" limit={3} />)
    expect(screen.getAllByRole('link')).toHaveLength(3)
    expect(screen.getByText(/12\.480 kg/)).toBeTruthy()
    expect(screen.getAllByText(/58 min/).length).toBeGreaterThan(0)
  })

  it('muestra “Ver más” solo cuando hay más y avisa al hacer click', () => {
    const onMore = vi.fn()
    withRouter(
      <ProfileWorkoutRows workouts={workouts} units="kg" limit={10} showMore onMore={onMore} />,
    )
    fireEvent.click(screen.getByText('Ver más entrenos'))
    expect(onMore).toHaveBeenCalledTimes(1)
  })

  it('sin más ítems no hay botón', () => {
    withRouter(<ProfileWorkoutRows workouts={workouts.slice(0, 2)} units="kg" limit={10} showMore />)
    expect(screen.queryByText('Ver más entrenos')).toBeNull()
  })
})

describe('ProfilePrRows', () => {
  const exerciseById = new Map<number, Exercise>([
    [1, exercise(1, 'Press de banca', 'pecho')],
    [2, exercise(2, 'Sentadilla', 'pierna')],
    [3, exercise(3, 'Peso muerto', 'espalda')],
    [4, exercise(4, 'Remo con barra', 'espalda')],
  ])
  const nameById = new Map([...exerciseById].map(([id, ex]) => [id, ex.name]))
  const prs = [pr(1, 100), pr(2, 140), pr(3, 180), pr(4, 85)]

  it('limita las marcas y muestra peso y e1RM', () => {
    withRouter(
      <ProfilePrRows prs={prs} nameById={nameById} exerciseById={exerciseById} units="kg" limit={2} />,
    )
    expect(screen.getByText('Press de banca')).toBeTruthy()
    expect(screen.getByText('Sentadilla')).toBeTruthy()
    expect(screen.queryByText('Peso muerto')).toBeNull()
    expect(screen.getByText('100 kg')).toBeTruthy()
  })

  it('no renderiza nada sin PRs', () => {
    const { container } = withRouter(
      <ProfilePrRows prs={[]} nameById={nameById} exerciseById={exerciseById} units="kg" />,
    )
    expect(container.firstChild).toBeNull()
  })
})
