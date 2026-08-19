// Exportar sesión como imagen: renderiza canvas y permite descargar/compartir.
import { useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Share2, Download } from 'lucide-react'
import type { SessionImageData } from '@/domain/sessionImage'

interface SessionImageExportProps {
  data: SessionImageData
}

const CANVAS_WIDTH = 1080
const CANVAS_HEIGHT = 1080

// Renderiza la imagen de sesión en un canvas.
const renderToCanvas = (canvas: HTMLCanvasElement, data: SessionImageData): void => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  canvas.width = CANVAS_WIDTH
  canvas.height = CANVAS_HEIGHT

  // Fondo.
  ctx.fillStyle = '#121214'
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  // Borde decorativo.
  ctx.strokeStyle = '#D9B384'
  ctx.lineWidth = 4
  ctx.strokeRect(20, 20, CANVAS_WIDTH - 40, CANVAS_HEIGHT - 40)

  // Título GymLab.
  ctx.fillStyle = '#D9B384'
  ctx.font = 'bold 48px system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(data.appName, CANVAS_WIDTH / 2, 100)

  // Fecha.
  ctx.fillStyle = '#FDDDB4'
  ctx.font = '28px system-ui, sans-serif'
  ctx.fillText(data.date, CANVAS_WIDTH / 2, 150)

  // Stats principales.
  const stats = [
    { label: 'Duración', value: data.duration },
    { label: 'Volumen', value: `${data.volume.toFixed(0)} kg` },
    { label: 'PRs', value: `${data.prCount}` },
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

  // Línea separadora.
  ctx.strokeStyle = '#333'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(80, 330)
  ctx.lineTo(CANVAS_WIDTH - 80, 330)
  ctx.stroke()

  // Lista de ejercicios.
  ctx.textAlign = 'left'
  ctx.fillStyle = '#FDDDB4'
  ctx.font = 'bold 24px system-ui, sans-serif'
  ctx.fillText('Ejercicios', 80, 380)

  let y = 430
  data.exercises.forEach((ex, i) => {
    if (y > 900) return
    ctx.fillStyle = '#D9B384'
    ctx.font = 'bold 22px system-ui, sans-serif'
    ctx.fillText(`${i + 1}. ${ex.name}`, 100, y)
    ctx.fillStyle = '#888'
    ctx.font = '20px system-ui, sans-serif'
    ctx.fillText(`${ex.sets}×${ex.weight}kg`, 100, y + 30)
    y += 65
  })

  // Footer.
  ctx.textAlign = 'center'
  ctx.fillStyle = '#555'
  ctx.font = '18px system-ui, sans-serif'
  ctx.fillText('Entrena con GymLab 💪', CANVAS_WIDTH / 2, 1020)
}

// Descarga el canvas como imagen.
const downloadCanvas = (canvas: HTMLCanvasElement, filename: string): void => {
  const link = document.createElement('a')
  link.download = filename
  link.href = canvas.toDataURL('image/png')
  link.click()
}

// Comparte usando Web Share API si está disponible.
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
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const handleRender = useCallback(() => {
    if (canvasRef.current) renderToCanvas(canvasRef.current, data)
  }, [data])

  const handleDownload = () => {
    if (canvasRef.current) downloadCanvas(canvasRef.current, `gymlab-${data.date}.png`)
  }

  const handleShare = () => {
    if (canvasRef.current) shareCanvas(canvasRef.current, `gymlab-${data.date}.png`)
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Canvas oculto para renderizar */}
      <canvas ref={canvasRef} className="hidden" />

      <div className="flex gap-2">
        <button
          onClick={handleRender}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-accent/10 px-3 py-2 text-[0.65rem] font-medium text-accent"
        >
          {t('share.preview')}
        </button>
        <button
          onClick={handleDownload}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-bg-elevated/50 px-3 py-2 text-[0.65rem] text-muted"
        >
          <Download className="size-3" /> {t('share.download')}
        </button>
        <button
          onClick={handleShare}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-accent px-3 py-2 text-[0.65rem] font-medium text-accent-fg"
        >
          <Share2 className="size-3" /> {t('share.share')}
        </button>
      </div>
    </div>
  )
}
