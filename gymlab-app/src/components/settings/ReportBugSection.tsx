// Reportar un error (Nocturno Minimal): tipo como chips hairline, descripción y
// email como campos planos subrayados. Al enviar abre el cliente de correo con
// el reporte preformateado.
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { CONTACT_EMAIL } from '@/config/contact'
import { buildReportBody, validateReport, type ReportType } from '@/domain/report'
import type { I18nKey } from '@/i18n'
import { track } from '@/lib/telemetry'
import { SectionLabel, settingsGroupClass } from './SettingsUI'

const REPORT_TYPES: { value: ReportType; key: I18nKey }[] = [
  { value: 'error', key: 'ajustes.reporteTipoError' },
  { value: 'mejora', key: 'ajustes.reporteTipoMejora' },
  { value: 'otro', key: 'ajustes.reporteTipoOtro' },
]

const fieldClass =
  'w-full border-0 border-b border-border/50 bg-transparent px-1 text-sm text-fg placeholder:text-muted/70 focus:border-cta focus:outline-none'

export const ReportBugSection = () => {
  const { t } = useTranslation()
  const [type, setType] = useState<ReportType>('error')
  const [description, setDescription] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSent(false)
    const validation = validateReport(description, type)
    if (!validation.valid) {
      setError(t('ajustes.reporteErrorDescripcion'))
      return
    }
    setError(null)
    const body = buildReportBody(type, description, email)
    const subject = `Reporte: ${type}`
    track('report_bug_submitted', { type })
    // Abre el cliente de correo con el reporte ya preformateado (placeholder #30).
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    setSent(true)
  }

  return (
    <section className={settingsGroupClass}>
      <SectionLabel>{t('ajustes.reporteTitulo')}</SectionLabel>
      <p className="pb-2 pt-1 text-xs leading-relaxed text-muted">{t('ajustes.reporteSubtitulo')}</p>

      <form onSubmit={handleSubmit} noValidate className="space-y-4 pb-2">
        <div>
          <p className="pb-1 text-xs text-muted">{t('ajustes.reporteTipo')}</p>
          <div role="group" aria-label={t('ajustes.reporteTipo')} className="flex gap-1.5">
            {REPORT_TYPES.map(({ value, key }) => {
              const isActive = type === value
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setType(value)}
                  aria-pressed={isActive}
                  className={`min-h-11 flex-1 rounded-full border px-2 text-sm transition-colors motion-reduce:transition-none ${
                    isActive
                      ? 'border-cta/60 bg-cta/15 text-accent-soft'
                      : 'border-border/60 text-muted'
                  }`}
                >
                  {t(key)}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <label htmlFor="reporte-descripcion" className="text-xs text-muted">
            {t('ajustes.reporteDescripcion')}
          </label>
          <textarea
            id="reporte-descripcion"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('ajustes.reporteDescripcionPlaceholder')}
            minLength={10}
            required
            aria-invalid={error ? true : undefined}
            className={`${fieldClass} mt-1 min-h-[88px] resize-y py-2`}
          />
        </div>

        <div>
          <label htmlFor="reporte-email" className="text-xs text-muted">
            {t('ajustes.reporteEmail')}
          </label>
          <input
            id="reporte-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('ajustes.reporteEmailPlaceholder')}
            className={`${fieldClass} mt-1 h-11`}
          />
        </div>

        {error && (
          <p role="alert" className="text-xs text-danger">
            {error}
          </p>
        )}
        {sent && (
          <p role="status" className="text-xs text-accent-soft">
            {t('ajustes.reporteEnviado')}
          </p>
        )}

        <Button type="submit" size="sm" variant="accent" className="w-full">
          {t('ajustes.reporteEnviar')}
        </Button>
      </form>
    </section>
  )
}
