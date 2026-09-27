import { describe, expect, it } from 'vitest'
import {
  markSectionsSeen,
  sectionForPath,
  shouldAutoStartTour,
  TOUR_COVERED_SECTIONS,
} from '@/domain/tour'
import { DEFAULT_SETTINGS } from '@/domain/settings'

describe('shouldAutoStartTour', () => {
  it('arranca solo con setup completo, pending y sin ver', () => {
    expect(shouldAutoStartTour({ onboardingDone: true, tourPending: true, tourDone: false })).toBe(true)
  })
  it('no arranca sin setup completo (evita solaparse con el wizard)', () => {
    expect(shouldAutoStartTour({ onboardingDone: false, tourPending: true, tourDone: false })).toBe(false)
  })
  it('no arranca sin pending (usuarios existentes)', () => {
    expect(shouldAutoStartTour({ onboardingDone: true, tourPending: false, tourDone: false })).toBe(false)
  })
  it('no re-arranca si ya se vio', () => {
    expect(shouldAutoStartTour({ onboardingDone: true, tourPending: true, tourDone: true })).toBe(false)
  })
})

describe('sectionForPath', () => {
  it('mapea las raíces y sus subrutas', () => {
    expect(sectionForPath('/')).toBe('inicio')
    expect(sectionForPath('/rutinas')).toBe('rutinas')
    expect(sectionForPath('/rutinas/nueva')).toBe('rutinas')
    expect(sectionForPath('/estadisticas')).toBe('estadisticas')
    expect(sectionForPath('/logros')).toBe('logros')
    expect(sectionForPath('/mas')).toBe('mas')
    expect(sectionForPath('/perfil')).toBe('perfil')
  })
  it('no mapea secciones sin tip', () => {
    expect(sectionForPath('/calculadoras/imc')).toBeNull()
    expect(sectionForPath('/entrenamiento/active')).toBeNull()
  })
})

describe('markSectionsSeen', () => {
  it('marca sin mutar el mapa original', () => {
    const before = { inicio: true as const }
    const after = markSectionsSeen(before, ['rutinas', 'logros'])
    expect(after).toEqual({ inicio: true, rutinas: true, logros: true })
    expect(before).toEqual({ inicio: true })
  })
  it('el tour cubre las cinco secciones que explica', () => {
    expect(TOUR_COVERED_SECTIONS).toEqual(['inicio', 'rutinas', 'estadisticas', 'logros', 'mas'])
  })
})

describe('defaults de F101', () => {
  it('showSectionTips viene encendido', () => {
    expect(DEFAULT_SETTINGS.showSectionTips).toBe(true)
  })
})
