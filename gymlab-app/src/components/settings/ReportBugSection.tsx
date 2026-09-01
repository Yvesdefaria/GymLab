// Formulario de reporte de errores en Ajustes: tipo + descripción + email opcional.
// Al enviar genera un mailto a CONTACT_EMAIL con el reporte preformateado.
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Bug } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { CONTACT_EMAIL } from '@/config/contact'
import { buildReportBody, validateReport, type ReportType } from '@/domain/report'
import type { I18nKey } from '@/i18n'
import { SectionLabel } from './SettingsUI'

const REPORT_TYPES: { value: ReportType; key: I18nKey }[] = [
  { value: 'error', key: 'ajustes.reporteTipoError' },
  { value: 'mejora', key: 'ajustes.reporteTipoMejora' },
  { value: 'otro', key: 'ajustes.reporteTipoOtro' },
]

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
    // Abre el cliente de correo con el reporte ya preformateado (placeholder #30).
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    setSent(true)
  }

  return (
    <section className="panel-light rounded-2xl p-4">
      <div className="flex items-center gap-2">
        <Bug className="size-4 text-accent" aria-hidden />
        <SectionLabel>{t('ajustes.reporteTitulo')}</SectionLabel>
      </div>
      <p className="mt-1 text-xs text-muted">{t('ajustes.reporteSubtitulo')}</p>

      <form onSubmit={handleSubmit} noValidate className="mt-3 space-y-3">
        <div>
          <p className="text-sm font-medium text-fg">{t('ajustes.reporteTipo')}</p>
          <div role="group" aria-label={t('ajustes.reporteTipo')} className="mt-1 flex gap-2">
            {REPORT_TYPES.map(({ value, key }) => {
              const isActive = type === value
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setType(value)}
                  aria-pressed={isActive}
                  className={`flex-1 rounded-xl border px-2 py-2 text-sm transition-colors ${
                    isActive ? 'border-cta bg-cta/15 text-accent-soft' : 'border-border bg-bg text-muted'
                  }`}
                >
                  {t(key)}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <label htmlFor="reporte-descripcion" className="text-sm font-medium text-fg">
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
            className="mt-1 min-h-[88px] w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm text-fg focus:border-cta focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="reporte-email" className="text-sm font-medium text-fg">
            {t('ajustes.reporteEmail')}
          </label>
          <input
            id="reporte-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('ajustes.reporteEmailPlaceholder')}
            className="mt-1 h-11 w-full rounded-xl border border-border bg-bg px-3 text-sm text-fg focus:border-cta focus:outline-none"
          />
        </div>

        {error && (
          <p role="alert" className="text-xs text-red-400">
            {error}
          </p>
        )}
        {sent && (
          <p role="status" className="text-xs text-accent-soft">
            {t('ajustes.reporteEnviado')}
          </p>
        )}

        <Button type="submit" className="w-full">
          {t('ajustes.reporteEnviar')}
        </Button>
      </form>
    </section>
  )
}
