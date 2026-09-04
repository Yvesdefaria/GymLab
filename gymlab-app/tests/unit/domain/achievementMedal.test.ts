// Tests del componente de la chapa-medalla (estilo BO2): verifica que
// renderiza el icono del logro, el metal correcto por tier y el contador ×N
// de veces conseguido. Render real vía renderToStaticMarkup (sin DOM).
import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import '@/i18n'
import { AchievementMedal } from '@/components/achievements/AchievementMedal'
import { getAchievement, ACHIEVEMENT_TIERS } from '@/domain/achievements'

const render = (props: Parameters<typeof AchievementMedal>[0]) =>
  renderToStaticMarkup(createElement(AchievementMedal, props))

const primerPaso = getAchievement('primer-paso')!
const sesiones500 = getAchievement('sesiones-500')!

describe('AchievementMedal', () => {
  it('muestra el contador ×N cuando el logro se consiguió varias veces', () => {
    const html = render({ achievement: primerPaso, unlocked: true, count: 3 })
    expect(html).toContain('×3')
  })

  it('no muestra contador si aún no se consiguió ninguna vez', () => {
    const html = render({ achievement: primerPaso, unlocked: false, count: 0 })
    expect(html).not.toContain('×0')
  })

  it('etiqueta la chapa bloqueada como tal para accesibilidad', () => {
    const html = render({ achievement: sesiones500, unlocked: false, count: 0 })
    expect(html.toLowerCase()).toContain('bloqueada')
  })

  it('etiqueta la chapa desbloqueada con el metal de su tier', () => {
    const tier = ACHIEVEMENT_TIERS['primer-paso']
    const html = render({ achievement: primerPaso, unlocked: true, count: 1 })
    // primer-paso es bronce → aria-label incluye «bronce» (es).
    expect(html.toLowerCase()).toContain('bronce')
    expect(html).not.toContain(tier) // el texto visible no usa la clave EN
  })

  it('no muestra metal más alto que su tier', () => {
    const html = render({ achievement: primerPaso, unlocked: true, count: 1 })
    expect(html.toLowerCase()).not.toContain('platino')
  })

  it('no renderiza iconos de otros logros', () => {
    const html = render({ achievement: primerPaso, unlocked: true, count: 1 })
    expect(html).toContain('primer-paso')
    expect(html).not.toContain('sesiones-500')
  })
})