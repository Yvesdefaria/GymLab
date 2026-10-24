// F132.2/B2 — acciones de sesión desde el ⋯ del header. La nota y la calculadora
// viven como filas debajo de la tabla; acá solo queda la salida segura.
import { LogOut } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { BottomSheet } from '@/components/ui/BottomSheet'

type Props = {
  onLeave: () => void
  onClose: () => void
}

export const SessionActionsSheet = ({ onLeave, onClose }: Props) => {
  const { t } = useTranslation()
  return (
    <BottomSheet title={t('session.titulo')} subtitle={t('session.accionesSesion')} onClose={onClose}>
      <button
        type="button"
        onClick={onLeave}
        aria-label={t('session.salirSinGuardar')}
        className="mt-2 flex min-h-14 w-full items-center gap-3 border-t border-border/40 py-2 text-left text-danger"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-danger/10 text-danger">
          <LogOut className="size-4" aria-hidden />
        </span>
        <span className="min-w-0 flex-1 text-sm">{t('session.salirSinGuardar')}</span>
      </button>
    </BottomSheet>
  )
}
