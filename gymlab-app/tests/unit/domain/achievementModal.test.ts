// Smoke test SSR del modal de logros (F95.1): cola secuencial de logros con
// un único ítem visible a la vez, affordance «{{current}} de {{total}}» y
// anuncio de variante de chapa cuando el logro actual acaba de re-lograr una.
// Render real vía renderToStaticMarkup (sin DOM; los efectos no corren).
import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import '@/i18n'
import { AchievementModal } from '@/components/achievements/AchievementModal'
import { getAchievement } from '@/domain/achievements'

const render = (props: Parameters<typeof AchievementModal>[0]) =>
  renderToStaticMarkup(createElement(AchievementModal, props))

const primerPaso = getAchievement('primer-paso')!
const inaugural = getAchievement('inaugural')!
const primeraMarca = getAchievement('primera-marca')!

describe('AchievementModal', () => {
  it('muestra un único logro de la cola a la vez', () => {
    const html = render({
      achievements: [primerPaso, inaugural],
      onClose: () => {},
      counts: { 'primer-paso': 2 },
      newGranted: [],
    })
    expect(html).toContain('data-achievement="primer-paso"')
    expect(html).not.toContain('data-achievement="inaugural"')
  })

  it('con varios logros muestra el affordance de cola «1 de 2»', () => {
    const html = render({
      achievements: [primerPaso, inaugural],
      onClose: () => {},
      counts: {},
      newGranted: [],
    })
    expect(html).toContain('data-queue-progress')
    expect(html).toContain('1 de 2')
  })

  it('un solo logro no muestra contador de cola', () => {
    const html = render({
      achievements: [primerPaso],
      onClose: () => {},
      counts: {},
      newGranted: [],
    })
    expect(html).not.toContain('data-queue-progress')
  })

  it('anuncia la variante nueva cuando el logro actual la acaba de re-lograr', () => {
    const html = render({
      achievements: [primerPaso, primeraMarca],
      onClose: () => {},
      counts: { 'primer-paso': 3 },
      newGranted: [{ achievementId: 'primer-paso', variantId: 'radiant' }],
    })
    expect(html).toContain('data-new-variant')
    expect(html).toContain('Radiante')
  })

  it('sin variante nueva no hay anuncio de coleccionable', () => {
    const html = render({
      achievements: [primerPaso],
      onClose: () => {},
      counts: {},
      newGranted: [],
    })
    expect(html).not.toContain('data-new-variant')
    expect(html).not.toContain('de 1')
  })
})