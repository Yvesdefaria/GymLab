// Exportar sesión como imagen: renderiza canvas y permite descargar/compartir.
import { useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Share2, Download, Eye } from 'lucide-react'
import { useSettings } from '@/hooks/useSettings'
import { applyUnits, formatUnits, type Units } from '@/domain/settings'
import type { SessionImageData } from '@/domain/sessionImage'

interface SessionImageExportProps {
  data: SessionImageData
}

const CANVAS_WIDTH = 1080
const CANVAS_HEIGHT = 1080

const renderToCanvas = (
  canvas: HTMLCanvasElement,
  data: SessionImageData,
  labels: { duration: string; volume: string; prs: string; exercises: string; footer: string },
  units: Units,
): void => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  canvas.width = CANVAS_WIDTH
  canvas.height = CANVAS_HEIGHT

  ctx.fillStyle = '#121214'
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  ctx.strokeStyle = '#D9B384'
  ctx.lineWidth = 4
  ctx.strokeRect(20, 20, CANVAS_WIDTH - 40, CANVAS_HEIGHT - 40)

  ctx.fillStyle = '#D9B384'
  ctx.font = 'bold 48px system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(data.appName, CANVAS_WIDTH / 2, 100)

  ctx.fillStyle = '#FDDDB4'
  ctx.font = '28px system-ui, sans-serif'
  ctx.fillText(data.date, CANVAS_WIDTH / 2, 150)

  const stats = [
    { label: labels.duration, value: data.duration },
    { label: labels.volume, value: `${applyUnits(data.volume, units).toFixed(0)} ${formatUnits(units)}` },
    { label: labels.prs, value: `${data.prCount}` },
  ]

  stats.forEach((stat, i) => {
    const x = 180 + i * 300
    ctx.fillStyle = '#D9B384'
    ctx.font = 'bold 40px system-ui, sans-serif'
    ctx.fillText(stat.value, x, 250)
    ctx.fillStyle = '#888'
    ctx.font = '22px system-ui, sans-serif'
    ctx.fillText(stat.label, x, 290)
  })

  ctx.strokeStyle = '#333'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(80, 330)
  ctx.lineTo(CANVAS_WIDTH - 80, 330)
  ctx.stroke()

  ctx.textAlign = 'left'
  ctx.fillStyle = '#FDDDB4'
  ctx.font = 'bold 24px system-ui, sans-serif'
  ctx.fillText(labels.exercises, 80, 380)

  let y = 430
  data.exercises.forEach((ex, i) => {
    if (y > 900) return
    ctx.fillStyle = '#D9B384'
    ctx.font = 'bold 22px system-ui, sans-serif'
    ctx.fillText(`${i + 1}. ${ex.name}`, 100, y)
    ctx.fillStyle = '#888'
    ctx.font = '20px system-ui, sans-serif'
    ctx.fillText(`${ex.sets}×${Math.round(applyUnits(ex.weight, units))}${formatUnits(units)}`, 100, y + 30)
    y += 65
  })

  ctx.textAlign = 'center'
  ctx.fillStyle = '#555'
  ctx.font = '18px system-ui, sans-serif'
  ctx.fillText(labels.footer, CANVAS_WIDTH / 2, 1020)
}

const downloadCanvas = (canvas: HTMLCanvasElement, filename: string): void => {
  const link = document.createElement('a')
  link.download = filename
  link.href = canvas.toDataURL('image/png')
  link.click()
}

const shareCanvas = async (canvas: HTMLCanvasElement, filename: string): Promise<void> => {
  canvas.toBlob(async (blob) => {
    if (!blob) return
    const file = new File([blob], filename, { type: 'image/png' })
    if (navigator.share) {
      await navigator.share({ files: [file] })
    } else {
      downloadCanvas(canvas, filename)
    }
  }, 'image/png')
}

export const SessionImageExport = ({ data }: SessionImageExportProps) => {
  const { t } = useTranslation()
  const { settings } = useSettings()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const labels = {
    duration: t('share.durationLabel'),
    volume: t('share.volumeLabel'),
    prs: t('share.prsLabel'),
    exercises: t('share.exercisesLabel'),
    footer: t('share.footer'),
  }

  const handleRender = useCallback(() => {
    if (canvasRef.current) renderToCanvas(canvasRef.current, data, labels, settings.units)
  }, [data, labels, settings.units])

  const handleDownload = () => {
    if (canvasRef.current) downloadCanvas(canvasRef.current, `gymlab-${data.date}.png`)
  }

  const handleShare = () => {
    if (canvasRef.current) shareCanvas(canvasRef.current, `gymlab-${data.date}.png`)
  }

  return (
    <div className="flex flex-col gap-3">
      <canvas ref={canvasRef} className="hidden" />

      <div className="flex gap-2">
        <button
          onClick={handleRender}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-accent/10 px-4 py-3 min-h-[44px] text-sm font-medium text-accent"
        >
          <Eye className="size-4" /> {t('share.preview')}
        </button>
        <button
          onClick={handleDownload}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-bg-elevated/50 px-4 py-3 min-h-[44px] text-sm text-muted"
        >
          <Download className="size-4" /> {t('share.download')}
        </button>
        <button
          onClick={handleShare}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 min-h-[44px] text-sm font-medium text-accent-fg"
        >
          <Share2 className="size-4" /> {t('share.share')}
        </button>
      </div>
    </div>
  )
}
