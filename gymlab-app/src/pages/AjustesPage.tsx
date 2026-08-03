import { useState } from 'react'
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
} from 'lucide-react'
import { AppHeader } from '@/components/layout/AppHeader'
import { useTheme } from '@/hooks/useTheme'
import { useSettings } from '@/hooks/useSettings'
import { exportBackup, downloadBackup, parseBackup, importBackup } from '@/data/backup'
import type { Units, PreloadWeightMode } from '@/domain/settings'

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-accent">
    {children}
  </h2>
)

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
      onClick={() => onChange(!checked)}
      className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${
        checked ? 'bg-cta' : 'bg-border'
      }`}
    >
      <span
        className={`absolute left-1 top-1 size-6 rounded-full bg-bg transition-transform duration-200 ${
          checked ? 'translate-x-6' : 'translate-x-0'
        }`}
      />
    </button>
  </div>
)

const NumberField = ({
  value,
  onChange,
  suffix,
  min,
}: {
  value: number
  onChange: (v: number) => void
  suffix?: string
  min?: number
}) => (
  <div className="flex items-center gap-2">
    <input
      type="number"
      min={min}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="h-10 w-20 rounded-lg border border-border bg-bg px-2 text-center text-sm text-fg focus:border-cta focus:outline-none"
    />
    {suffix && <span className="text-xs text-muted">{suffix}</span>}
  </div>
)

const Select = ({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="h-10 rounded-lg border border-border bg-bg px-2 text-sm text-fg focus:border-cta focus:outline-none"
  >
    {options.map((o) => (
      <option key={o.value} value={o.value}>
        {o.label}
      </option>
    ))}
  </select>
)

export const AjustesPage = () => {
  const { theme, setTheme } = useTheme()
  const { settings, update } = useSettings()

  const [showBackup, setShowBackup] = useState(false)
  const [backupMessage, setBackupMessage] = useState<string | null>(null)
  const [backupBusy, setBackupBusy] = useState(false)

  const handleExport = async () => {
    setBackupBusy(true)
    try {
      const backup = await exportBackup()
      downloadBackup(backup)
      setBackupMessage('Backup exportado correctamente.')
    } catch {
      setBackupMessage('No se pudo exportar el backup.')
    } finally {
      setBackupBusy(false)
    }
  }

  const handleImportFile = (file: File) => {
    setBackupBusy(true)
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        const parsed = parseBackup(String(reader.result ?? ''))
        if (!parsed) {
          setBackupMessage('Archivo no válido. Usa un backup de GymLab.')
          return
        }
        const confirmed = window.confirm(
          'Esto reemplazará tus datos actuales con el contenido del backup. ¿Continuar?'
        )
        if (!confirmed) return
        const count = await importBackup(parsed)
        setBackupMessage(`Backup restaurado (${count} registros). La app se recargará.`)
        window.setTimeout(() => window.location.reload(), 1200)
      } catch {
        setBackupMessage('No se pudo restaurar el backup.')
      } finally {
        setBackupBusy(false)
      }
    }
    reader.onerror = () => {
      setBackupMessage('No se pudo leer el archivo.')
      setBackupBusy(false)
    }
    reader.readAsText(file)
  }

  const themeOptions = [
    { value: 'night' as const, label: 'Noche', description: 'Negro y dorado', icon: Moon },
    { value: 'day' as const, label: 'Día', description: 'Blanco y dorado', icon: Sun },
  ]

  const setWarmupPercents = (raw: string) => {
    const percents = raw
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isFinite(n) && n > 0 && n <= 100)
    if (percents.length > 0) void update({ warmupPercents: percents })
  }

  return (
    <div>
      <AppHeader title="Ajustes" subtitle="Apariencia y preferencias" />
      <div className="space-y-5 p-4 pb-32">
        <section className="rounded-2xl border border-gold/40 bg-bg-elevated p-4">
          <SectionLabel>Apariencia</SectionLabel>

          <div className="mt-2 grid grid-cols-2 gap-3">
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
              <p className="text-sm font-medium text-fg">Unidades de peso</p>
              <p className="mt-0.5 text-xs text-muted">Se guarda en kg y se muestra en tu unidad.</p>
            </div>
            <Select
              value={settings.units}
              onChange={(v) => void update({ units: v as Units })}
              options={[
                { value: 'kg', label: 'Kilogramos (kg)' },
                { value: 'lb', label: 'Libras (lb)' },
              ]}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-gold/40 bg-bg-elevated p-4">
          <div className="flex items-center gap-2">
            <Dumbbell className="size-4 text-accent" aria-hidden />
            <SectionLabel>Sesión</SectionLabel>
          </div>

          <Toggle
            checked={settings.preloadLast}
            onChange={(v) => void update({ preloadLast: v })}
            label="Precargar último peso"
            description="Usa el último peso/reps registrado al abrir un ejercicio."
          />
          {settings.preloadLast && (
            <div className="space-y-3 rounded-xl border border-border/60 bg-bg/40 p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-muted">Series a precargar (0 = rutina)</p>
                <NumberField
                  value={settings.preloadSetCount}
                  onChange={(v) => void update({ preloadSetCount: Math.max(0, v || 0) })}
                  min={0}
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-muted">Ajuste de peso</p>
                <div className="flex items-center gap-2">
                  <Select
                    value={settings.preloadWeightMode}
                    onChange={(v) => void update({ preloadWeightMode: v as PreloadWeightMode })}
                    options={[
                      { value: 'exact', label: 'Exacto' },
                      { value: 'plus_kg', label: '+ kg' },
                      { value: 'plus_pct', label: '+ %' },
                    ]}
                  />
                  {settings.preloadWeightMode !== 'exact' && (
                    <NumberField
                      value={settings.preloadWeightValue}
                      onChange={(v) => void update({ preloadWeightValue: v || 0 })}
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          <Toggle
            checked={settings.autoStartRest}
            onChange={(v) => void update({ autoStartRest: v })}
            label="Descanso automático"
            description="Arranca el temporizador al marcar una serie como hecha."
          />
          <Toggle
            checked={settings.restSound}
            onChange={(v) => void update({ restSound: v })}
            label="Sonido al terminar descanso"
          />
          <Toggle
            checked={settings.restVibrate}
            onChange={(v) => void update({ restVibrate: v })}
            label="Vibración al terminar descanso"
          />
          <Toggle
            checked={settings.keepScreenAwake}
            onChange={(v) => void update({ keepScreenAwake: v })}
            label="Mantener pantalla encendida"
            description="Durante la sesión (si el navegador lo permite)."
          />
          <Toggle
            checked={settings.confirmLeaveSession}
            onChange={(v) => void update({ confirmLeaveSession: v })}
            label="Confirmar al salir de sesión"
          />
          <Toggle
            checked={settings.showRpe}
            onChange={(v) => void update({ showRpe: v })}
            label="Mostrar RPE por serie"
            description="Registro opcional de esfuerzo percibido."
          />
          <Toggle
            checked={settings.warmupSets}
            onChange={(v) => void update({ warmupSets: v })}
            label="Series de calentamiento"
            description="Añade series de aproximación al cargar un ejercicio."
          />
          {settings.warmupSets && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-bg/40 p-3">
              <p className="text-xs text-muted">Porcentajes (%)</p>
              <input
                type="text"
                defaultValue={settings.warmupPercents.join(', ')}
                onBlur={(e) => setWarmupPercents(e.target.value)}
                className="h-10 w-40 rounded-lg border border-border bg-bg px-2 text-sm text-fg focus:border-cta focus:outline-none"
              />
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-gold/40 bg-bg-elevated p-4">
          <div className="flex items-center gap-2">
            <Timer className="size-4 text-accent" aria-hidden />
            <SectionLabel>General</SectionLabel>
          </div>
          <Toggle
            checked={settings.homeShowTodayFocus}
            onChange={(v) => void update({ homeShowTodayFocus: v })}
            label="Destacar el día de hoy en inicio"
            description="Muestra qué toca entrenar hoy en la home."
          />
          <Toggle
            checked={settings.showWeightHint}
            onChange={(v) => void update({ showWeightHint: v })}
            label="Recordatorio de peso en inicio"
            description="Chip con tu último peso corporal en la home."
          />
          <Toggle
            checked={settings.showInstallPrompt}
            onChange={(v) => void update({ showInstallPrompt: v })}
            label="Sugerir instalar la app"
          />
          <div className="flex items-center justify-between gap-3 border-t border-border/50 pt-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-fg">Deshacer al borrar</p>
              <p className="mt-0.5 text-xs text-muted">Segundos para recuperar (0 = sin deshacer).</p>
            </div>
            <NumberField
              value={settings.undoDurationSec}
              onChange={(v) => void update({ undoDurationSec: Math.max(0, v || 0) })}
              min={0}
              suffix="s"
            />
          </div>
        </section>

        <section className="rounded-2xl border border-gold/40 bg-bg-elevated p-4">
          <div className="flex items-center gap-2">
            <Wrench className="size-4 text-accent" aria-hidden />
            <SectionLabel>Datos</SectionLabel>
          </div>
          <button
            onClick={() => setShowBackup((v) => !v)}
            className="mt-2 flex min-h-[48px] w-full items-center justify-between rounded-xl border border-border bg-bg px-3 text-sm text-fg"
          >
            <span>Backup y restauración</span>
            <ChevronRight className="size-4 text-muted" />
          </button>
          {showBackup && (
            <div className="mt-2 space-y-2 rounded-xl border border-border/60 bg-bg/40 p-3">
              <p className="text-xs text-muted">
                Exporta o restaura tus datos (entrenos, rutinas, PRs, peso corporal) en formato
                JSON.
              </p>
              <button
                onClick={() => void handleExport()}
                disabled={backupBusy}
                className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-cta bg-cta/15 text-sm font-medium text-accent-soft disabled:opacity-50"
              >
                <Download className="size-4" aria-hidden />
                Exportar backup
              </button>
              <label className="flex min-h-[44px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-bg text-sm text-fg transition-colors hover:border-cta">
                <Upload className="size-4" aria-hidden />
                Restaurar desde archivo
                <input
                  type="file"
                  accept="application/json,.json"
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) handleImportFile(f)
                    e.target.value = ''
                  }}
                />
              </label>
              {backupMessage && (
                <p className="text-xs text-accent-soft">{backupMessage}</p>
              )}
            </div>
          )}
        </section>

        <div className="flex items-start gap-2 rounded-xl border border-border/60 bg-bg-elevated/40 p-3 text-xs text-muted">
          <Bell className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
          <p>
            Todo se guarda en este dispositivo (local-first). Sonido y vibración requieren
            interacción previa en el navegador.
          </p>
        </div>

        <div className="flex items-start gap-2 rounded-xl border border-border/60 bg-bg-elevated/40 p-3 text-xs text-muted">
          <Shield className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
          <p>
            Las cuentas en la nube llegarán en una fase posterior (social, sincronización).
          </p>
        </div>
      </div>
    </div>
  )
}
