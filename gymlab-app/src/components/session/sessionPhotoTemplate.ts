// Pintado del card con foto de fondo (D2, 1080×1080): foto cover + degradado y
// bloque hero anclado al pie. UI-side puro sin React, como sessionTemplates.ts.
import type { SessionImageData } from '@/domain/sessionImage'
import { computeCoverCrop } from '@/domain/sessionPhotoCard'
import { CANVAS_HEIGHT, CANVAS_WIDTH, fitText } from './sessionTemplates'

type Ctx = CanvasRenderingContext2D

// Paleta/fuente compartidas con las plantillas existentes.
const BG = '#121214'
const GOLD = '#D9B384'
const WHITE = '#FFFFFF'
const FONT = 'system-ui, sans-serif'

// Baselines del D2 congelados (spec 2026-09-27): bloque centrado y anclado al pie,
// con la marca a ~47 px del borde inferior. La spec fija tamaños, colores y pie;
// estas separaciones intermedias son el layout del renderer.
const BRAND_BASELINE = 1033
const STATS_BASELINE = 952
const DURATION_BASELINE = 852
const NAME_BASELINE = 706
const DATE_BASELINE = 628

export interface PhotoCanvasLabels {
  date: string // fecha localizada ('vie, 26 sept 2026'); se pinta en mayúsculas
  volume: string // segmento volumen ya armado ('4.800 kg de volumen')
  prs: string | null // segmento PRs ya armado ('2 PRs' | '1 PR' | null)
}

// ctx.letterSpacing existe desde Chromium 99; sin soporte se espacia carácter por carácter.
// El lib DOM de TS 6 ya declara la propiedad en Ctx, así que un type predicate dejaría la
// rama del fallback en `never`: el chequeo queda como boolean y el fallback conserva el tipo Ctx.
const hasLetterSpacing = (ctx: Ctx): boolean => 'letterSpacing' in ctx

const drawSpacedCentered = (ctx: Ctx, text: string, spacingPx: number, y: number): void => {
  if (hasLetterSpacing(ctx)) {
    ctx.letterSpacing = `${spacingPx}px`
    ctx.textAlign = 'center'
    ctx.fillText(text, CANVAS_WIDTH / 2, y)
    ctx.letterSpacing = '0px'
    return
  }
  // Fallback: avance manual por carácter, centrado sobre el ancho total.
  const chars = [...text]
  const widths = chars.map((ch) => ctx.measureText(ch).width)
  const total = widths.reduce((sum, w) => sum + w, 0) + spacingPx * (chars.length - 1)
  ctx.textAlign = 'left'
  let x = CANVAS_WIDTH / 2 - total / 2
  chars.forEach((ch, i) => {
    ctx.fillText(ch, x, y)
    x += widths[i] + spacingPx
  })
}

// Línea de stats bicolor: volumen en blanco y PRs en dorado extrabold, centrados.
const drawStats = (ctx: Ctx, labels: PhotoCanvasLabels, y: number): void => {
  ctx.font = `500 28px ${FONT}`
  const volumeWidth = ctx.measureText(labels.volume).width
  const separator = labels.prs ? ' · ' : ''
  ctx.font = `800 28px ${FONT}`
  const prsWidth = labels.prs ? ctx.measureText(`${separator}${labels.prs}`).width : 0
  let x = CANVAS_WIDTH / 2 - (volumeWidth + prsWidth) / 2
  ctx.textAlign = 'left'
  ctx.fillStyle = WHITE
  ctx.font = `500 28px ${FONT}`
  ctx.fillText(labels.volume, x, y)
  if (labels.prs) {
    x += volumeWidth
    ctx.fillStyle = GOLD
    ctx.font = `800 28px ${FONT}`
    ctx.fillText(`${separator}${labels.prs}`, x, y)
  }
}

export const drawPhotoHero = (
  ctx: Ctx,
  data: SessionImageData,
  labels: PhotoCanvasLabels,
  photo: HTMLImageElement | null,
): void => {
  const canvas = ctx.canvas
  canvas.width = CANVAS_WIDTH
  canvas.height = CANVAS_HEIGHT

  ctx.fillStyle = BG
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  // Foto con recorte cover centrado; si es menor se escala igual (spec).
  if (photo) {
    const crop = computeCoverCrop(photo.naturalWidth, photo.naturalHeight, CANVAS_WIDTH)
    if (crop.sw > 0 && crop.sh > 0) {
      ctx.drawImage(photo, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    }
  }

  // Degradado exacto del contrato D2 (transparente arriba, oscuro al pie).
  const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT)
  gradient.addColorStop(0, 'rgba(18,18,20,.30)')
  gradient.addColorStop(0.36, 'rgba(18,18,20,0)')
  gradient.addColorStop(0.66, 'rgba(18,18,20,.50)')
  gradient.addColorStop(1, 'rgba(18,18,20,.95)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  // Fecha: dorada, bold 23 px, mayúsculas, letter-spacing ~.20em.
  ctx.fillStyle = GOLD
  ctx.font = `bold 23px ${FONT}`
  drawSpacedCentered(ctx, labels.date.toUpperCase(), 23 * 0.2, DATE_BASELINE)

  // Nombre: blanco bold 50 px (truncado si no entra), fallback ya resuelto por el hook.
  ctx.fillStyle = WHITE
  ctx.font = `bold 50px ${FONT}`
  ctx.textAlign = 'center'
  ctx.fillText(fitText(ctx, data.workoutName, CANVAS_WIDTH - 160), CANVAS_WIDTH / 2, NAME_BASELINE)

  // Duración: el número héroe (extrabold 104 px).
  ctx.font = `800 104px ${FONT}`
  ctx.fillText(data.duration, CANVAS_WIDTH / 2, DURATION_BASELINE)

  drawStats(ctx, labels, STATS_BASELINE)

  // Marca: GYMLAB dorada, extrabold 34 px, letter-spacing .36em.
  ctx.fillStyle = GOLD
  ctx.font = `800 34px ${FONT}`
  drawSpacedCentered(ctx, data.appName.toUpperCase(), 34 * 0.36, BRAND_BASELINE)
}
