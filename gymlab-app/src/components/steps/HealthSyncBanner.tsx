// Banner de estado del puente de salud: solo se muestra para estados que el
// usuario debe ver (syncing/denied/error); idle/granted/unavailable → null.
import { useTranslation } from 'react-i18next'
import { RefreshCw } from 'lucide-react'
import { Button } from '../ui/Button'
import type { HealthSyncStatus } from '@/hooks/useHealthSync'

interface Props {
  status: HealthSyncStatus
  onAction: () => void
}

const VISIBLE: HealthSyncStatus[] = ['syncing', 'denied', 'error']

export const HealthSyncBanner = ({ status, onAction }: Props) => {
  const { t } = useTranslation()
  if (!VISIBLE.includes(status)) return null

  if (status === 'syncing') {
    return (
      <p className="flex items-center gap-2 text-xs text-muted" aria-live="polite">
        <RefreshCw className="size-4 animate-spin" aria-hidden />
        {t('steps.healthSyncing')}
      </p>
    )
  }

  const denied = status === 'denied'
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-border bg-bg-elevated/50 p-3">
      <p className="text-xs text-muted">{denied ? t('steps.healthDenied') : t('steps.healthError')}</p>
      <Button variant="outline" size="sm" onClick={onAction}>
        {denied ? t('steps.healthDeniedAction') : t('steps.healthRetry')}
      </Button>
    </div>
  )
}