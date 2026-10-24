// Sheet del «+»: elegir cómo crear la rutina (manual o con el planificador).
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronRight, Pencil, Sparkles } from 'lucide-react'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'

export const NewRoutineSheet = ({ onClose }: { onClose: () => void }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  // Cierra primero para que el sheet no quede montado sobre la ruta destino.
  const go = (to: string) => {
    onClose()
    navigate(to)
  }

  return (
    <BottomSheet
      title={t('rutinas.nuevaSheet.titulo')}
      subtitle={t('rutinas.nuevaSheet.subtitulo')}
      onClose={onClose}
    >
      <div className="mt-2">
        <button
          type="button"
          autoFocus
          onClick={() => go('/rutinas/nueva')}
          className="flex min-h-14 w-full items-center gap-3 border-t border-border/40 py-2.5 text-left first:border-t-0"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-cta/10 text-cta" aria-hidden>
            <Pencil className="size-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-medium text-fg">{t('rutinas.nuevaSheet.manual')}</span>
            <span className="block text-[10px] text-muted">{t('rutinas.nuevaSheet.manualDesc')}</span>
          </span>
          <ChevronRight className="size-4 shrink-0 text-muted" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => go('/rutinas/planificador')}
          className="flex min-h-14 w-full items-center gap-3 border-t border-border/40 py-2.5 text-left"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-cta/10 text-cta" aria-hidden>
            <Sparkles className="size-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-medium text-fg">{t('rutinas.nuevaSheet.auto')}</span>
            <span className="block text-[10px] text-muted">{t('rutinas.nuevaSheet.autoDesc')}</span>
          </span>
          <ChevronRight className="size-4 shrink-0 text-muted" aria-hidden />
        </button>
      </div>
      <Button variant="outline" size="sm" className="mt-4 w-full" onClick={onClose}>
        {t('layout.confirm.cancel')}
      </Button>
    </BottomSheet>
  )
}
