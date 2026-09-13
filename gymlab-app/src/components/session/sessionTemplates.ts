// Pintado del canvas de la foto de sesión (1080×1080): un layout por plantilla.
// UI-side puro sin React: solo medir y dibujar, con fuentes del sistema.
import type { PhotoTemplateId, SessionImageData } from '@/domain/sessionImage'
import type { Units } from '@/domain/settings'
import { applyUnits, formatUnits } from '@/domain/settings'

export const CANVAS_WIDTH = 1080
export const CANVAS_HEIGHT = 1080

// Tope de ejercicios que entran en la tarjeta; las filas sobrantes se descartan
// (misma truncación que el layout original).
const EXERCISE_CAP = 8

export interface CanvasLabels {
  duration: string
  volume: string
  prs: string
  exercises: string
  footer: string
}

type Ctx = CanvasRenderingContext2D

// Paleta de la tarjeta (tema GymLab): fondo oscuro y dorado de acento.
const BG = '#121214'
const PANEL = '#1E1E20'
const BORDER = '#2E2E30'
const GOLD = '#D9B384'
const CREAM = '#FDDDB4'
const MUTED = '#8A8A8A'
const FAINT = '#555'
const FONT = 'system-ui, sans-serif'

const volumeText = (data: SessionImageData, units: Units): string =>
  `${applyUnits(data.volume, units).toFixed(0)} ${formatUnits(units)}`

const weightText = (weightKg: number, units: Units): string =>
  `${Math.round(applyUnits(weightKg, units))}${formatUnits(units)}`

// Recorta un texto con ellipsis midiendo sobre el propio contexto del canvas.
const fitText = (ctx: Ctx, text: string, maxWidth: number): string => {
  if (ctx.measureText(text).width <= maxWidth) return text
  let t = text
  while (t.length > 1 && ctx.measureText(`${t}…`).width > maxWidth) t = t.slice(0, -1)
  return `${t}…`
}

const drawStat = (ctx: Ctx, value: string, label: string, x: number, y: number): void => {
  ctx.textAlign = 'center'
  ctx.fillStyle = GOLD
  ctx.font = `bold 42px ${FONT}`
  ctx.fillText(value, x, y)
  ctx.fillStyle = MUTED
  ctx.font = `500 22px ${FONT}`
  ctx.fillText(label, x, y + 36)
}

const drawStatTile = (ctx: Ctx, value: string, label: string, x: number, y: number): void => {
  ctx.fillStyle = PANEL
  ctx.fillRect(x, y, 310, 132)
  ctx.strokeStyle = BORDER
  ctx.lineWidth = 2
  ctx.strokeRect(x, y, 310, 132)
  ctx.textAlign = 'center'
  ctx.fillStyle = GOLD
  ctx.font = `bold 44px ${FONT}`
  ctx.fillText(value, x + 155, y + 78)
  ctx.fillStyle = MUTED
  ctx.font = `500 22px ${FONT}`
  ctx.fillText(label, x + 155, y + 112)
}

const drawSectionTitle = (ctx: Ctx, text: string, x: number, y: number): void => {
  ctx.textAlign = 'left'
  ctx.fillStyle = CREAM
  ctx.font = `bold 28px ${FONT}`
  ctx.fillText(text, x, y)
}

const drawFooter = (ctx: Ctx, text: string, y: number): void => {
  ctx.textAlign = 'center'
  ctx.fillStyle = FAINT
  ctx.font = `500 20px ${FONT}`
  ctx.fillText(text, CANVAS_WIDTH / 2, y)
}

const drawExerciseRow = (
  ctx: Ctx,
  index: number,
  ex: SessionImageData['exercises'][number],
  units: Units,
  y: number,
  opts: { left: number; right: number; maxNameWidth: number }
): void => {
  ctx.textAlign = 'left'
  ctx.fillStyle = GOLD
  ctx.font = `bold 24px ${FONT}`
  ctx.fillText(`${index + 1}.`, opts.left, y)
  ctx.fillStyle = CREAM
  ctx.font = `500 24px ${FONT}`
  ctx.fillText(fitText(ctx, ex.name, opts.maxNameWidth), opts.left + 44, y)
  ctx.fillStyle = MUTED
  ctx.font = `500 22px ${FONT}`
  ctx.textAlign = 'right'
  ctx.fillText(`${ex.sets}×${weightText(ex.weight, units)}`, opts.right, y)
}

// Clásica: marco dorado, marca centrada, nombre destacado y filas de ejercicios.
const drawClassic = (ctx: Ctx, data: SessionImageData, labels: CanvasLabels, units: Units): void => {
  ctx.fillStyle = BG
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
  ctx.strokeStyle = GOLD
  ctx.lineWidth = 4
  ctx.strokeRect(20, 20, CANVAS_WIDTH - 40, CANVAS_HEIGHT - 40)

  ctx.textAlign = 'center'
  ctx.fillStyle = GOLD
  ctx.font = `bold 44px ${FONT}`
  ctx.fillText(data.appName, CANVAS_WIDTH / 2, 96)
  ctx.fillStyle = MUTED
  ctx.font = `500 28px ${FONT}`
  ctx.fillText(data.date, CANVAS_WIDTH / 2, 140)
  ctx.fillStyle = CREAM
  ctx.font = `bold 46px ${FONT}`
  ctx.fillText(fitText(ctx, data.workoutName, CANVAS_WIDTH - 240), CANVAS_WIDTH / 2, 196)

  const stats = [
    { value: data.duration, label: labels.duration },
    { value: volumeText(data, units), label: labels.volume },
    { value: `${data.prCount}`, label: labels.prs },
  ]
  stats.forEach((stat, i) => drawStat(ctx, stat.value, stat.label, 225 + i * 315, 310))

  ctx.strokeStyle = BORDER
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(80, 372)
  ctx.lineTo(CANVAS_WIDTH - 80, 372)
  ctx.stroke()

  drawSectionTitle(ctx, labels.exercises, 80, 412)
  data.exercises.slice(0, EXERCISE_CAP).forEach((ex, i) => {
    drawExerciseRow(ctx, i, ex, units, 470 + i * 62, {
      left: 100,
      right: CANVAS_WIDTH - 100,
      maxNameWidth: CANVAS_WIDTH - 560,
    })
  })

  drawFooter(ctx, labels.footer, 1016)
}

// Hero: banda superior con degradado, nombre enorme y tiles de estadísticas.
const drawHero = (ctx: Ctx, data: SessionImageData, labels: CanvasLabels, units: Units): void => {
  ctx.fillStyle = BG
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  const gradient = ctx.createLinearGradient(0, 0, 0, 300)
  gradient.addColorStop(0, '#1C1C1E')
  gradient.addColorStop(1, '#121214')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, CANVAS_WIDTH, 300)

  ctx.textAlign = 'left'
  ctx.fillStyle = GOLD
  ctx.font = `bold 30px ${FONT}`
  ctx.fillText(data.appName, 60, 74)
  ctx.fillStyle = MUTED
  ctx.font = `500 26px ${FONT}`
  ctx.fillText(data.date, 60, 114)

  ctx.textAlign = 'center'
  ctx.fillStyle = CREAM
  ctx.font = `bold 62px ${FONT}`
  ctx.fillText(fitText(ctx, data.workoutName, CANVAS_WIDTH - 200), CANVAS_WIDTH / 2, 218)

  ctx.fillStyle = GOLD
  ctx.fillRect(CANVAS_WIDTH / 2 - 140, 244, 280, 5)

  const stats = [
    { value: data.duration, label: labels.duration },
    { value: volumeText(data, units), label: labels.volume },
    { value: `${data.prCount}`, label: labels.prs },
  ]
  stats.forEach((stat, i) => drawStatTile(ctx, stat.value, stat.label, 40 + i * 350, 340))

  ctx.strokeStyle = BORDER
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(80, 512)
  ctx.lineTo(CANVAS_WIDTH - 80, 512)
  ctx.stroke()

  drawSectionTitle(ctx, labels.exercises, 80, 552)
  data.exercises.slice(0, EXERCISE_CAP).forEach((ex, i) => {
    drawExerciseRow(ctx, i, ex, units, 610 + i * 52, {
      left: 100,
      right: CANVAS_WIDTH - 100,
      maxNameWidth: CANVAS_WIDTH - 560,
    })
  })

  drawFooter(ctx, labels.footer, 1038)
}

// Compacta: cabecera minimalista, stats en una fila con separadores y filas justas.
const drawCompact = (ctx: Ctx, data: SessionImageData, labels: CanvasLabels, units: Units): void => {
  ctx.fillStyle = BG
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  ctx.textAlign = 'left'
  ctx.fillStyle = CREAM
  ctx.font = `bold 44px ${FONT}`
  ctx.fillText(fitText(ctx, data.workoutName, CANVAS_WIDTH - 420), 60, 112)
  ctx.textAlign = 'right'
  ctx.fillStyle = MUTED
  ctx.font = `500 26px ${FONT}`
  ctx.fillText(data.date, CANVAS_WIDTH - 60, 112)

  ctx.textAlign = 'left'
  ctx.fillStyle = GOLD
  ctx.font = `bold 26px ${FONT}`
  ctx.fillText(data.appName, 60, 158)

  const stats = [
    { value: data.duration, label: labels.duration },
    { value: volumeText(data, units), label: labels.volume },
    { value: `${data.prCount}`, label: labels.prs },
  ]
  stats.forEach((stat, i) => {
    const x = 180 + i * 300
    drawStat(ctx, stat.value, stat.label, x, 300)
    if (i < stats.length - 1) {
      ctx.fillStyle = FAINT
      ctx.fillRect(x + 130, 252, 3, 82)
    }
  })

  drawSectionTitle(ctx, labels.exercises, 60, 396)
  data.exercises.slice(0, EXERCISE_CAP).forEach((ex, i) => {
    drawExerciseRow(ctx, i, ex, units, 452 + i * 62, {
      left: 80,
      right: CANVAS_WIDTH - 80,
      maxNameWidth: CANVAS_WIDTH - 520,
    })
  })

  drawFooter(ctx, labels.footer, 1028)
}

// Renderiza la tarjeta con la plantilla elegida; el componente la invoca en vivo.
export const renderSessionCanvas = (
  canvas: HTMLCanvasElement,
  data: SessionImageData,
  labels: CanvasLabels,
  units: Units,
  template: PhotoTemplateId,
): void => {
  canvas.width = CANVAS_WIDTH
  canvas.height = CANVAS_HEIGHT
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  if (template === 'hero') drawHero(ctx, data, labels, units)
  else if (template === 'compact') drawCompact(ctx, data, labels, units)
  else drawClassic(ctx, data, labels, units)
}