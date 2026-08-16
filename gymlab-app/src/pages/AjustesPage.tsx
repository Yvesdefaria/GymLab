// Página «Ajustes» (/ajustes): apariencia (tema/paleta), unidades de peso,
// preferencias de sesión y backup/restauración de datos (JSON).
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Moon,
  Sun,
  Shield,
  Dumbbell,
  Timer,
  Bell,
  Wrench,
  ChevronRight,
  Download,
  Upload,
  ExternalLink,
} from 'lucide-react'
import { AppHeader } from '@/components/layout/AppHeader'
import { BackLink } from '@/components/ui/BackLink'
import { Button } from '@/components/ui/Button'
import { ConfirmSheet } from '@/components/ui/ConfirmSheet'
import { useTheme, PALETTES, type Palette } from '@/hooks/useTheme'
import { useSettings } from '@/hooks/useSettings'
import { exportBackup, downloadBackup, parseBackup, importBackup, type BackupFile } from '@/data/backup'
import type { AppLanguage } from '@/domain/onboarding'
import type { Units, PreloadWeightMode } from '@/domain/settings'
import { clamp } from '@/domain/numberGuard'
import { applyLanguage, type I18nKey } from '@/i18n'

// Etiqueta de sección reutilizada en los bloques de ajustes.
const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-accent">
    {children}
  </h2>
)

// Switch accesible (role="switch") que vuelca cada preferencia en useSettings.
const Toggle = ({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  description?: string
}) => (
  <div className="flex items-center justify-between gap-3 py-3">
    <div className="min-w-0">
      <p className="text-sm font-medium text-fg">{label}</p>
      {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
    </div>
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-11 w-14 shrink-0 rounded-full transition-colors ${
        checked ? 'bg-cta' : 'bg-border'
      }`}
    >
      <span
        className={`absolute left-1 top-1/2 size-6 -translate-y-1/2 rounded-full bg-bg shadow transition-transform duration-200 ${
          checked ? 'translate-x-6' : 'translate-x-0'
        }`}
      />
    </button>
  </div>
)

// Campo numérico acotado con clamp() para evitar valores fuera de rango.
const NumberField = ({
  value,
  onChange,
  label,
  suffix,
  min,
  max,
}: {
  value: number
  onChange: (v: number) => void
  label: string
  suffix?: string
  min?: number
  max?: number
}) => (
  <div className="flex items-center gap-2">
    <input
      type="number"
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(clamp(Number(e.target.value), min ?? 0, max ?? Number.MAX_SAFE_INTEGER))}
      aria-label={label}
      className="h-11 w-20 rounded-lg border border-border bg-bg px-2 text-center text-sm text-fg focus:border-cta focus:outline-none"
    />
    {suffix && <span className="text-xs text-muted">{suffix}</span>}
  </div>
)

// Select accesible reutilizado para opciones de preferencias.
const Select = ({
  value,
  onChange,
  label,
  options,
}: {
  value: string
  onChange: (v: string) => void
  label: string
  options: { value: string; label: string }[]
}) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    aria-label={label}
    className="h-11 rounded-lg border border-border bg-bg px-2 text-sm text-fg focus:border-cta focus:outline-none"
  >
    {options.map((o) => (
      <option key={o.value} value={o.value}>
        {o.label}
      </option>
    ))}
  </select>
)

// Mapas nombre/swatch para las paletas de color definidas en useTheme.
const PALETTE_LABELS: Record<Palette, I18nKey> = {
  gold: 'ajustes.paletaDorado',
  energy: 'ajustes.paletaEnergia',
  crimson: 'ajustes.paletaCarmesi',
  electric: 'ajustes.paletaElectrico',
  violet: 'ajustes.paletaVioleta',
  gray: 'ajustes.paletaGris',
}

const PALETTE_SWATCH: Record<Palette, string> = {
  gold: 'swatch-gold',
  energy: 'swatch-energy',
  crimson: 'swatch-crimson',
  electric: 'swatch-electric',
  violet: 'swatch-violet',
  gray: 'swatch-gray',
}

// Página de ajustes: lee preferencias de useSettings/useTheme y las actualiza al vuelo.
export const AjustesPage = () => {
  const { t } = useTranslation()
  const { theme, setTheme, palette, setPalette } = useTheme()
  const { settings, update } = useSettings()

  const [showBackup, setShowBackup] = useState(false)
  const [backupMessage, setBackupMessage] = useState<string | null>(null)
  const [backupBusy, setBackupBusy] = useState(false)
  const [pendingImport, setPendingImport] = useState<BackupFile | null>(null)
  const [warmupError, setWarmupError] = useState<string | null>(null)

  // Exporta todos los datos a JSON y descarga el archivo resultante.
  const handleExport = async () => {
    setBackupBusy(true)
    try {
      const backup = await exportBackup()
      downloadBackup(backup)
      setBackupMessage(t('ajustes.backupExported'))
    } catch {
      setBackupMessage(t('ajustes.backupExportError'))
    } finally {
      setBackupBusy(false)
    }
  }

  // Restaura un backup: valida el JSON y deja pendiente la importación hasta confirmarla en el sheet.
  const handleImportFile = (file: File) => {
    setBackupBusy(true)
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        const parsed = parseBackup(String(reader.result ?? ''))
        if (!parsed) {
          setBackupMessage(t('ajustes.backupInvalid'))
          return
        }
        setPendingImport(parsed)
      } catch {
        setBackupMessage(t('ajustes.backupReadError'))
      } finally {
        setBackupBusy(false)
      }
    }
    reader.onerror = () => {
      setBackupMessage(t('ajustes.backupReadError'))
      setBackupBusy(false)
    }
    reader.readAsText(file)
  }

  // Aplica el backup confirmado y recarga la app con los datos restaurados.
  const applyImport = async () => {
    if (!pendingImport) return
    setBackupBusy(true)
    try {
      const count = await importBackup(pendingImport)
      setPendingImport(null)
      setBackupMessage(t('ajustes.backupRestored', { count }))
      window.setTimeout(() => window.location.reload(), 1200)
    } catch {
      setPendingImport(null)
      setBackupMessage(t('ajustes.backupRestoreError'))
    } finally {
      setBackupBusy(false)
    }
  }

  const themeOptions = [
    { value: 'night' as const, label: t('ajustes.temaNoche'), description: t('ajustes.temaNocheDesc'), icon: Moon },
    { value: 'day' as const, label: t('ajustes.temaDia'), description: t('ajustes.temaDiaDesc'), icon: Sun },
  ]

  // Valida porcentajes de calentamiento (1–100, separados por coma) antes de guardarlos.
  const setWarmupPercents = (raw: string) => {
    const tokens = raw
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
    if (tokens.length === 0) {
      setWarmupError(t('ajustes.warmupErrorVacio'))
      return
    }
    const parsed = tokens.map((s) => Number(s))
    const invalid = tokens.filter((_, i) => !Number.isFinite(parsed[i]) || parsed[i] <= 0 || parsed[i] > 100)
    if (invalid.length > 0) {
      setWarmupError(t('ajustes.warmupError', { count: invalid.length, vals: invalid.join('», «') }))
      return
    }
    setWarmupError(null)
    void update({ warmupPercents: parsed })
  }

  return (
    <div>
      <AppHeader title={t('ajustes.titulo')} subtitle={t('ajustes.subtitulo')} />
      <div className="space-y-5 p-4 pb-32">
        <BackLink to="/mas" />
        {/* --- Sección: Apariencia (paleta, tema claro/oscuro, unidades) */}
        <section className="panel rounded-2xl p-4">
          <SectionLabel>{t('ajustes.apariencia')}</SectionLabel>

          <p className="mt-1 text-xs text-muted">{t('ajustes.colorPrincipal')}</p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {PALETTES.map((value) => {
              const isActive = palette === value
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPalette(value)}
                  className={`flex min-h-[64px] flex-col items-center justify-center gap-1.5 rounded-2xl border p-2 transition-colors ${
                    isActive
                      ? 'border-cta bg-cta/15'
                      : 'border-border bg-bg hover:border-cta'
                  }`}
                  aria-pressed={isActive}
                >
                  <span
                    className={`size-6 rounded-full ${PALETTE_SWATCH[value]} ${
                      isActive ? 'ring-2 ring-fg/60 ring-offset-1 ring-offset-bg-elevated' : ''
                    }`}
                    aria-hidden
                  />
                  <span
                    className={`text-[0.65rem] font-medium leading-none ${
                      isActive ? 'text-accent-soft' : 'text-muted'
                    }`}
                  >
                    {t(PALETTE_LABELS[value])}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            {themeOptions.map(({ value, label, description, icon: Icon }) => {
              const isActive = theme === value
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTheme(value)}
                  className={`flex min-h-[80px] flex-col items-center justify-center gap-1 rounded-2xl border p-3 transition-colors ${
                    isActive
                      ? 'border-cta bg-cta/20 text-accent-soft'
                      : 'border-border bg-bg text-muted hover:border-cta hover:text-accent-soft'
                  }`}
                  aria-pressed={isActive}
                >
                  <Icon className="size-6" aria-hidden />
                  <span className="font-medium">{label}</span>
                  <span className="text-xs opacity-80">{description}</span>
                </button>
              )
            })}
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 border-t border-border/50 pt-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-fg">{t('settings.language')}</p>
              <p className="mt-0.5 text-xs text-muted">{t('settings.languageHint')}</p>
            </div>
            <Select
              value={settings.language}
              onChange={(v) => {
                const language = v as AppLanguage
                // Aplica el idioma al instante y lo persiste en Ajustes.
                void update({ language })
                void applyLanguage(language)
              }}
              label={t('settings.language')}
              options={[
                { value: 'es', label: t('ajustes.idiomaEspanol') },
                { value: 'en', label: t('ajustes.idiomaIngles') },
              ]}
            />
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 border-t border-border/50 pt-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-fg">{t('ajustes.unidadesPeso')}</p>
              <p className="mt-0.5 text-xs text-muted">{t('ajustes.unidadesPesoDesc')}</p>
            </div>
            <Select
              value={settings.units}
              onChange={(v) => {
                const units = v as Units
                // Al cambiar kg/lb se sincroniza también el sistema métrico derivado.
                void update({ units, measurementSystem: units === 'lb' ? 'imperial' : 'metric' })
              }}
              label={t('ajustes.unidadesPeso')}
              options={[
                { value: 'kg', label: t('ajustes.kg') },
                { value: 'lb', label: t('ajustes.lb') },
              ]}
            />
          </div>
        </section>

        {/* --- Sección: Sesión (precarga de pesos, descansos, RPE/RIR, calentamiento) */}
        <section className="panel rounded-2xl p-4">
          <div className="flex items-center gap-2">
            <Dumbbell className="size-4 text-accent" aria-hidden />
            <SectionLabel>{t('ajustes.sesion')}</SectionLabel>
          </div>

          <Toggle
            checked={settings.preloadLast}
            onChange={(v) => void update({ preloadLast: v })}
            label={t('ajustes.preloadLast')}
            description={t('ajustes.preloadLastDesc')}
          />
          {settings.preloadLast && (
            <div className="space-y-3 rounded-xl border border-border/60 bg-bg/40 p-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-muted">{t('ajustes.seriesPrecargarHint')}</p>
                <NumberField
                  value={settings.preloadSetCount}
                  onChange={(v) => void update({ preloadSetCount: Math.max(0, v || 0) })}
                  label={t('ajustes.seriesPrecargar')}
                  min={0}
                  max={20}
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-muted">{t('ajustes.ajustePeso')}</p>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <Select
                    value={settings.preloadWeightMode}
                    onChange={(v) => void update({ preloadWeightMode: v as PreloadWeightMode })}
                    label={t('ajustes.ajustePeso')}
                    options={[
                      { value: 'exact', label: t('ajustes.ajusteExacto') },
                      { value: 'plus_kg', label: t('ajustes.ajusteMasKg') },
                      { value: 'plus_pct', label: t('ajustes.ajusteMasPct') },
                    ]}
                  />
                  {settings.preloadWeightMode !== 'exact' && (
                    <NumberField
                      value={settings.preloadWeightValue}
                      onChange={(v) => void update({ preloadWeightValue: Math.max(0, v || 0) })}
                      label={t('ajustes.ajustePeso')}
                      min={0}
                      max={100}
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          <Toggle
            checked={settings.autoStartRest}
            onChange={(v) => void update({ autoStartRest: v })}
            label={t('ajustes.restAuto')}
            description={t('ajustes.restAutoDesc')}
          />
          <Toggle
            checked={settings.restSound}
            onChange={(v) => void update({ restSound: v })}
            label={t('ajustes.restSound')}
          />
          <Toggle
            checked={settings.restVibrate}
            onChange={(v) => void update({ restVibrate: v })}
            label={t('ajustes.restVibrate')}
          />
          <Toggle
            checked={settings.keepScreenAwake}
            onChange={(v) => void update({ keepScreenAwake: v })}
            label={t('ajustes.keepAwake')}
            description={t('ajustes.keepAwakeDesc')}
          />
          <Toggle
            checked={settings.confirmLeaveSession}
            onChange={(v) => void update({ confirmLeaveSession: v })}
            label={t('ajustes.confirmLeave')}
          />
          <Toggle
            checked={settings.showRpe}
            onChange={(v) => void update({ showRpe: v })}
            label={t('ajustes.showRpe')}
            description={t('ajustes.showRpeDesc')}
          />
          <Toggle
            checked={settings.showRir}
            onChange={(v) => void update({ showRir: v })}
            label={t('ajustes.showRir')}
            description={t('ajustes.showRirDesc')}
          />
          <Toggle
            checked={settings.warmupSets}
            onChange={(v) => void update({ warmupSets: v })}
            label={t('ajustes.warmupSets')}
            description={t('ajustes.warmupSetsDesc')}
          />
          {settings.warmupSets && (
            <div className="rounded-xl border border-border/60 bg-bg/40 p-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-muted">{t('ajustes.warmupPercents')}</p>
                <input
                  type="text"
                  aria-label={t('ajustes.warmupPercentsAria')}
                  aria-invalid={warmupError ? true : undefined}
                  aria-describedby={warmupError ? 'warmup-error' : undefined}
                  defaultValue={settings.warmupPercents.join(', ')}
                  onBlur={(e) => setWarmupPercents(e.target.value)}
                  className={`h-11 w-40 rounded-lg border bg-bg px-2 text-sm text-fg focus:outline-none ${
                    warmupError ? 'border-danger focus:border-danger' : 'border-border focus:border-cta'
                  }`}
                />
              </div>
              {warmupError && (
                <p id="warmup-error" role="alert" className="mt-2 text-xs text-danger">
                  {warmupError}
                </p>
              )}
            </div>
          )}
          <Toggle
            checked={settings.showLoadSuggestion}
            onChange={(v) => void update({ showLoadSuggestion: v })}
            label={t('ajustes.sugerirCarga')}
            description={t('ajustes.sugerirCargaDesc')}
          />
          {settings.showLoadSuggestion && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-bg/40 p-3">
              <div className="min-w-0">
                <p className="text-xs text-muted">{t('ajustes.progresion')}</p>
                <p className="mt-0.5 text-[0.65rem] text-muted/70">
                  {t('ajustes.progresionDesc')}
                </p>
              </div>
            <NumberField
              value={settings.loadProgressionPct}
              onChange={(v) => void update({ loadProgressionPct: Math.max(0.5, Math.min(10, v || 2.5)) })}
              label={t('ajustes.progresion')}
              min={0.5}
              max={10}
              suffix="%"
            />
            </div>
          )}
        </section>

        {/* --- Sección: General (home, instalación, deshacer) */}
        <section className="panel rounded-2xl p-4">
          <div className="flex items-center gap-2">
            <Timer className="size-4 text-accent" aria-hidden />
            <SectionLabel>{t('ajustes.general')}</SectionLabel>
          </div>
          <Toggle
            checked={settings.homeShowTodayFocus}
            onChange={(v) => void update({ homeShowTodayFocus: v })}
            label={t('ajustes.homeToday')}
            description={t('ajustes.homeTodayDesc')}
          />
          <Toggle
            checked={settings.showWeightHint}
            onChange={(v) => void update({ showWeightHint: v })}
            label={t('ajustes.pesoHint')}
            description={t('ajustes.pesoHintDesc')}
          />
          <Toggle
            checked={settings.showInstallPrompt}
            onChange={(v) => void update({ showInstallPrompt: v })}
            label={t('ajustes.instalarApp')}
          />
          <div className="flex items-center justify-between gap-3 border-t border-border/50 pt-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-fg">{t('ajustes.undoDelete')}</p>
              <p className="mt-0.5 text-xs text-muted">{t('ajustes.undoDeleteDesc')}</p>
            </div>
            <NumberField
              value={settings.undoDurationSec}
              onChange={(v) => void update({ undoDurationSec: Math.max(0, v || 0) })}
              label={t('ajustes.undoDelete')}
              min={0}
              max={120}
              suffix="s"
            />
          </div>
        </section>

        {/* --- Sección: Datos (backup y restauración) */}
        <section className="panel rounded-2xl p-4">
          <div className="flex items-center gap-2">
            <Wrench className="size-4 text-accent" aria-hidden />
            <SectionLabel>{t('ajustes.datos')}</SectionLabel>
          </div>
          <button
            onClick={() => setShowBackup((v) => !v)}
            className="mt-2 flex min-h-[48px] w-full items-center justify-between rounded-xl border border-border bg-bg px-3 text-sm text-fg"
          >
            <span>{t('ajustes.backup')}</span>
            <ChevronRight className="size-4 text-muted" />
          </button>
          {showBackup && (
            <div className="mt-2 space-y-2 rounded-xl border border-border/60 bg-bg/40 p-3">
              <p className="text-xs text-muted">
                {t('ajustes.backupDesc')}
              </p>
              <Button
                size="sm"
                className="w-full"
                variant="accent"
                onClick={() => void handleExport()}
                disabled={backupBusy}
              >
                <Download className="size-4" aria-hidden />
                {t('ajustes.exportarBackup')}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => {
                  const input = document.getElementById('backup-file-input') as HTMLInputElement | null
                  input?.click()
                }}
              >
                <Upload className="size-4" aria-hidden />
                {t('ajustes.restaurarArchivo')}
              </Button>
              <input
                id="backup-file-input"
                type="file"
                accept="application/json,.json"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) handleImportFile(f)
                  e.target.value = ''
                }}
              />
              {backupMessage && (
                <p className="text-xs text-accent-soft">{backupMessage}</p>
              )}
            </div>
          )}
        </section>

        {/* --- Sección: Créditos (atribución CC BY-SA del modelo anatómico) */}
        <section className="panel rounded-2xl p-4">
          <SectionLabel>{t('ajustes.creditos')}</SectionLabel>
          <p className="mt-1 text-sm font-medium text-fg">{t('ajustes.creditosModelo')}</p>
          <p className="mt-0.5 text-xs text-muted">{t('ajustes.creditosModeloDesc')}</p>
          <a
            href="https://github.com/Z-Anatomy/Models-of-human-anatomy"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-border px-3 text-xs font-medium text-accent-soft hover:border-gold/60"
          >
            {t('ajustes.creditosLink')}
            <ExternalLink className="size-3.5" aria-hidden />
          </a>
        </section>

        <div className="flex items-start gap-2 rounded-xl border border-border/60 bg-bg-elevated/40 p-3 text-xs text-muted">
          <Bell className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
          <p>
            {t('ajustes.footerLocal')}
          </p>
        </div>

        <div className="flex items-start gap-2 rounded-xl border border-border/60 bg-bg-elevated/40 p-3 text-xs text-muted">
          <Shield className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
          <p>
            {t('ajustes.footerNube')}
          </p>
        </div>
      </div>

      {pendingImport && (
        <ConfirmSheet
          title={t('ajustes.restaurarBackupTitulo')}
          message={t('ajustes.restaurarBackupMsg')}
          confirmLabel={t('ajustes.restaurar')}
          cancelLabel={t('ajustes.cancelar')}
          busy={backupBusy}
          onConfirm={() => void applyImport()}
          onCancel={() => setPendingImport(null)}
        />
      )}
    </div>
  )
}
