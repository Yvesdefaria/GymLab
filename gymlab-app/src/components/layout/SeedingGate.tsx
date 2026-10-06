// F103/T3: gate del área de contenido. Reutiliza el Loader compartido mientras
// el seed corre; si falla, muestra un estado recuperable con reintento (mismos
// textos que el ErrorBoundary).
import { useTranslation } from 'react-i18next'
import { Loader } from '@/components/ui/Loader'
import type { SeedingStatus } from '@/app/seedingStore'

type SeedingGateProps = {
  status: SeedingStatus
  error: string | null
  onRetry: () => void
}

export const SeedingGate = ({ status, error, onRetry }: SeedingGateProps) => {
  const { t } = useTranslation()
  if (status !== 'error') return <Loader />
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-bg p-6 text-center">
      <p className="text-sm font-medium text-fg">{t('errorBoundary.titulo')}</p>
      <p className="max-w-[280px] text-xs text-muted">{error ?? t('errorBoundary.cuerpo')}</p>
      <button
        type="button"
        onClick={onRetry}
        className="min-h-[44px] rounded-xl bg-cta px-4 text-sm font-medium text-accent-fg"
      >
        {t('errorBoundary.reintentar')}
      </button>
    </div>
  )
}
