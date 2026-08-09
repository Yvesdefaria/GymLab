// Página «Ajustes» (/ajustes): apariencia (tema/paleta), unidades de peso,
// preferencias de sesión y backup/restauración de datos (JSON).
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
import { BackLink } from '@/components/ui/BackLink'
import { Button } from '@/components/ui/Button'
import { ConfirmSheet } from '@/components/ui/ConfirmSheet'
import { useTheme, PALETTES, type Palette } from '@/hooks/useTheme'
import { useSettings } from '@/hooks/useSettings'
import { exportBackup, downloadBackup, parseBackup, importBackup, type BackupFile } from '@/data/backup'
import type { Units, PreloadWeightMode } from '@/domain/settings'
import { clamp } from '@/domain/numberGuard'

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
const PALETTE_LABELS: Record<Palette, string> = {
  gold: 'Dorado',
  energy: 'Energía',
  crimson: 'Carmesí',
  electric: 'Eléctrico',
  violet: 'Violeta',
  gray: 'Gris',
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
      setBackupMessage('Backup exportado correctamente.')
    } catch {
      setBackupMessage('No se pudo exportar el backup.')
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
          setBackupMessage('Archivo no válido. Usa un backup de GymLab.')
          return
        }
        setPendingImport(parsed)
      } catch {
        setBackupMessage('No se pudo leer el archivo.')
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

  // Aplica el backup confirmado y recarga la app con los datos restaurados.
  const applyImport = async () => {
    if (!pendingImport) return
    setBackupBusy(true)
    try {
      const count = await importBackup(pendingImport)
      setPendingImport(null)
      setBackupMessage(`Backup restaurado (${count} registros). La app se recargará.`)
      window.setTimeout(() => window.location.reload(), 1200)
    } catch {
      setPendingImport(null)
      setBackupMessage('No se pudo restaurar el backup.')
    } finally {
      setBackupBusy(false)
    }
  }

  const themeOptions = [
    { value: 'night' as const, label: 'Noche', description: 'Fondo oscuro', icon: Moon },
    { value: 'day' as const, label: 'Día', description: 'Fondo claro', icon: Sun },
  ]

  // Valida porcentajes de calentamiento (1–100, separados por coma) antes de guardarlos.
  const setWarmupPercents = (raw: string) => {
    const tokens = raw
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
    if (tokens.length === 0) {
      setWarmupError('Escribe al menos un porcentaje, separado por comas.')
      return
    }
    const parsed = tokens.map((s) => Number(s))
    const invalid = tokens.filter((_, i) => !Number.isFinite(parsed[i]) || parsed[i] <= 0 || parsed[i] > 100)
    if (invalid.length > 0) {
      setWarmupError(
        `Valor${invalid.length > 1 ? 'es' : ''} no válido${invalid.length > 1 ? 's' : ''}: «${invalid.join('», «')}». Usa porcentajes entre 1 y 100, separados por coma.`
      )
      return
    }
    setWarmupError(null)
    void update({ warmupPercents: parsed })
  }

  return (
    <div>
      <AppHeader title="Ajustes" subtitle="Apariencia y preferencias" />
      <div className="space-y-5 p-4 pb-32">
        <BackLink to="/mas" />
        {/* --- Sección: Apariencia (paleta, tema claro/oscuro, unidades) */}
        <section className="panel rounded-2xl p-4">
          <SectionLabel>Apariencia</SectionLabel>

          <p className="mt-1 text-xs text-muted">Color principal</p>
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
                    {PALETTE_LABELS[value]}
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
              <p className="text-sm font-medium text-fg">Unidades de peso</p>
              <p className="mt-0.5 text-xs text-muted">Se guarda en kg y se muestra en tu unidad.</p>
            </div>
            <Select
              value={settings.units}
              onChange={(v) => void update({ units: v as Units })}
              label="Unidades de peso"
              options={[
                { value: 'kg', label: 'Kilogramos (kg)' },
                { value: 'lb', label: 'Libras (lb)' },
              ]}
            />
          </div>
        </section>

        {/* --- Sección: Sesión (precarga de pesos, descansos, RPE/RIR, calentamiento) */}
        <section className="panel rounded-2xl p-4">
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
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-muted">Series a precargar (0 = rutina)</p>
                <NumberField
                  value={settings.preloadSetCount}
                  onChange={(v) => void update({ preloadSetCount: Math.max(0, v || 0) })}
                  label="Series a precargar"
                  min={0}
                  max={20}
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-muted">Ajuste de peso</p>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <Select
                    value={settings.preloadWeightMode}
                    onChange={(v) => void update({ preloadWeightMode: v as PreloadWeightMode })}
                    label="Ajuste de peso"
                    options={[
                      { value: 'exact', label: 'Exacto' },
                      { value: 'plus_kg', label: '+ kg' },
                      { value: 'plus_pct', label: '+ %' },
                    ]}
                  />
                  {settings.preloadWeightMode !== 'exact' && (
                    <NumberField
                      value={settings.preloadWeightValue}
                      onChange={(v) => void update({ preloadWeightValue: Math.max(0, v || 0) })}
                      label="Ajuste de peso"
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
            checked={settings.showRir}
            onChange={(v) => void update({ showRir: v })}
            label="Mostrar RIR por serie"
            description="Repeticiones en reserva (cuántas más podías hacer)."
          />
          <Toggle
            checked={settings.warmupSets}
            onChange={(v) => void update({ warmupSets: v })}
            label="Series de calentamiento"
            description="Añade series de aproximación al cargar un ejercicio."
          />
          {settings.warmupSets && (
            <div className="rounded-xl border border-border/60 bg-bg/40 p-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-muted">Porcentajes (%)</p>
                <input
                  type="text"
                  aria-label="Porcentajes de calentamiento"
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
            label="Sugerir carga"
            description="Propone el peso de la siguiente serie según tu PR y RIR."
          />
          {settings.showLoadSuggestion && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-bg/40 p-3">
              <div className="min-w-0">
                <p className="text-xs text-muted">Progresión (%)</p>
                <p className="mt-0.5 text-[0.65rem] text-muted/70">
                  Incremento sobre tu mejor marca (2.5–5% recomendado).
                </p>
              </div>
            <NumberField
              value={settings.loadProgressionPct}
              onChange={(v) => void update({ loadProgressionPct: Math.max(0.5, Math.min(10, v || 2.5)) })}
              label="Progresión (%)"
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
              label="Deshacer al borrar"
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
              <Button
                size="sm"
                className="w-full"
                variant="accent"
                onClick={() => void handleExport()}
                disabled={backupBusy}
              >
                <Download className="size-4" aria-hidden />
                Exportar backup
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
                Restaurar desde archivo
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

      {pendingImport && (
        <ConfirmSheet
          title="Restaurar backup"
          message="Esto reemplazará tus datos actuales con el contenido del archivo. ¿Continuar?"
          confirmLabel="Restaurar"
          cancelLabel="Cancelar"
          busy={backupBusy}
          onConfirm={() => void applyImport()}
          onCancel={() => setPendingImport(null)}
        />
      )}
    </div>
  )
}
