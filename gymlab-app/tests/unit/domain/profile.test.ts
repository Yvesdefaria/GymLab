// Helpers puros del perfil: visibilidad de secciones, primera sesión, insignia y días activos.
// El héroe y el empty state dependen de estos bordes; los cubrimos antes de tocar la UI.
import { describe, expect, it } from 'vitest'
import {
  countActiveDays,
  deloadStatusKey,
  firstWorkoutDate,
  profileSections,
  streakBadge,
} from '@/domain/profile'

const workout = (localDate: string) => ({ localDate, startedAt: `${localDate}T10:00:00` })

describe('firstWorkoutDate', () => {
  it('devuelve null sin entrenos', () => {
    expect(firstWorkoutDate([])).toBeNull()
  })

  it('devuelve la fecha local más antigua aunque la lista venga de más reciente a más vieja', () => {
    expect(
      firstWorkoutDate([workout('2026-10-20'), workout('2025-03-04'), workout('2026-01-01')]),
    ).toBe('2025-03-04')
  })

  it('cae a startedAt cuando el workout no trae localDate', () => {
    expect(firstWorkoutDate([{ startedAt: '2025-01-02T10:00:00' }])).toBe('2025-01-02')
  })
})

describe('profileSections', () => {
  it('con 0 entrenos oculta héroe, stats, marcas, historial y chapas', () => {
    expect(profileSections({ workoutsCount: 0, prsCount: 0, chapasCount: 0 })).toEqual({
      hero: false,
      stats: false,
      prs: false,
      history: false,
      chapas: false,
    })
  })

  it('con datos muestra todas las secciones', () => {
    expect(profileSections({ workoutsCount: 4, prsCount: 2, chapasCount: 3 })).toEqual({
      hero: true,
      stats: true,
      prs: true,
      history: true,
      chapas: true,
    })
  })

  it('oculta marcas y chapas por separado cuando faltan', () => {
    expect(profileSections({ workoutsCount: 1, prsCount: 0, chapasCount: 0 })).toEqual({
      hero: true,
      stats: true,
      prs: false,
      history: true,
      chapas: false,
    })
  })
})

describe('streakBadge', () => {
  it('sin racha no hay insignia próxima', () => {
    expect(streakBadge(0)).toBeNull()
  })

  it('mapea el próximo hito y las semanas restantes', () => {
    expect(streakBadge(1)).toEqual({ key: 'perfil.insignia4', remaining: 3 })
    expect(streakBadge(3)).toEqual({ key: 'perfil.insignia4', remaining: 1 })
    expect(streakBadge(4)).toEqual({ key: 'perfil.insignia8', remaining: 4 })
    expect(streakBadge(8)).toEqual({ key: 'perfil.insignia16', remaining: 8 })
  })

  it('a las 16 semanas ya no hay insignia siguiente', () => {
    expect(streakBadge(16)).toBeNull()
  })
})

describe('countActiveDays', () => {
  const today = '2026-10-23'

  it('cuenta solo los días dentro de la ventana de 30 días', () => {
    // 2026-09-24 es el primer día de la ventana; 2026-09-23 queda afuera.
    expect(countActiveDays(['2026-10-23', '2026-09-24', '2026-09-23'], today)).toBe(2)
  })

  it('acepta un Set y devuelve 0 sin días', () => {
    expect(countActiveDays(new Set(), today)).toBe(0)
    expect(countActiveDays(new Set(['2026-10-23']), today)).toBe(1)
  })
})

describe('deloadStatusKey', () => {
  it('usa los mismos umbrales que el copy largo (40 / 60)', () => {
    expect(deloadStatusKey(0)).toBe('perfil.deloadEstadoBajo')
    expect(deloadStatusKey(39)).toBe('perfil.deloadEstadoBajo')
    expect(deloadStatusKey(40)).toBe('perfil.deloadEstadoMedio')
    expect(deloadStatusKey(59)).toBe('perfil.deloadEstadoMedio')
    expect(deloadStatusKey(60)).toBe('perfil.deloadEstadoAlto')
    expect(deloadStatusKey(100)).toBe('perfil.deloadEstadoAlto')
  })
})
