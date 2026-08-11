// Aviso para instalar la app como PWA, ocultable por el usuario.
import { Download, X } from 'lucide-react'
import { useState } from 'react'
import { useInstallPrompt } from '@/hooks/useInstallPrompt'
import { Button } from '@/components/ui/Button'

// Solo se muestra si el navegador permite instalación y el usuario no la ha descartado.
export const InstallBanner = () => {
  const { canInstall, promptInstall } = useInstallPrompt()
  const [dismissed, setDismissed] = useState(false)

  if (!canInstall || dismissed) return null

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-gold/50 bg-cta/10 p-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-accent-soft">Instala GymLab</p>
        <p className="text-xs text-muted">Ábrela como una app en tu pantalla de inicio.</p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          size="sm"
          onClick={() => void promptInstall()}
        >
          <Download className="size-4" aria-hidden />
          Instalar
        </Button>
        <button
          onClick={() => setDismissed(true)}
          className="relative flex size-10 items-center justify-center rounded-lg text-muted after:absolute after:-inset-1 after:content-[''] hover:text-fg"
          aria-label="Descartar sugerencia de instalación"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  )
}
