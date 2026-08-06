import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, Scale } from 'lucide-react'
import { AppHeader } from '@/components/layout/AppHeader'
import { BodyWeightChart } from '@/components/profile/BodyWeightChart'
import { useBodyWeight } from '@/hooks/useBodyWeight'
import { useSettings } from '@/hooks/useSettings'
import { applyUnits, formatUnits, parseWeightToKg } from '@/domain/settings'
import { clamp } from '@/domain/numberGuard'

const MAX_BODY_WEIGHT_KG = 400

export const PesoCorporalPage = () => {
  const { settings } = useSettings()
  const { entries, addToday, remove, today } = useBodyWeight()
  const [value, setValue] = useState('')

  const handleSave = async () => {
    const kg = clamp(parseWeightToKg(Number(value) || 0, settings.units), 0, MAX_BODY_WEIGHT_KG)
    if (kg <= 0) return
    await addToday(kg)
    setValue('')
  }

  const latest = entries[entries.length - 1]

  return (
    <div>
      <AppHeader title="Peso corporal" subtitle="Seguimiento de tu evolución" />
      <div className="space-y-4 p-4">
        <Link to="/mas" className="inline-flex min-h-[44px] items-center gap-2 text-sm text-accent-soft">
          <ArrowLeft className="size-4" aria-hidden />
          Volver
        </Link>

        {latest && (
          <div className="flex items-center gap-4 rounded-2xl border border-gold/40 bg-bg-elevated p-4">
            <span className="flex size-12 items-center justify-center rounded-xl bg-bg text-accent">
              <Scale className="size-6" aria-hidden />
            </span>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted">Último registro</p>
              <p className="font-display text-2xl font-bold text-accent">
                {applyUnits(latest.weightKg, settings.units).toFixed(1)}{' '}
                {formatUnits(settings.units)}
              </p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-xs text-muted">Fecha</p>
              <p className="text-sm font-medium text-fg">
                {new Date(latest.localDate + 'T12:00:00').toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'short',
                })}
              </p>
            </div>
          </div>
        )}

        <section className="rounded-2xl border border-gold/40 bg-bg-elevated p-4">
          <h2 className="mb-2 font-display text-sm font-semibold uppercase tracking-wider text-accent">
            Registrar hoy
          </h2>
          <div className="flex gap-2">
            <input
              type="number"
              min={0}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={today ? `Hoy: ${applyUnits(today.weightKg, settings.units).toFixed(1)}` : 'Peso'}
              inputMode="decimal"
              className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-bg px-3 text-base font-semibold text-fg placeholder:font-normal placeholder:text-muted/50 focus:border-cta focus:outline-none"
            />
            <button
              onClick={() => void handleSave()}
              disabled={!value}
              className="gold-gradient flex h-11 shrink-0 items-center gap-1 rounded-xl px-4 font-medium text-on-gold transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              <Plus className="size-4" aria-hidden />
              {today ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        </section>

        {entries.length >= 2 && (
          <section className="rounded-2xl border border-gold/40 bg-bg-elevated p-4">
            <h2 className="mb-2 font-display text-sm font-semibold uppercase tracking-wider text-accent">
              Evolución
            </h2>
            <BodyWeightChart entries={entries} />
          </section>
        )}

        {entries.length > 0 && (
          <section className="rounded-2xl border border-gold/40 bg-bg-elevated p-4">
            <h2 className="mb-2 font-display text-sm font-semibold uppercase tracking-wider text-accent">
              Historial
            </h2>
            <div className="relative">
              <div className="absolute bottom-3 left-[5px] top-3 w-px bg-border" aria-hidden />
              <div>
                {[...entries].reverse().map((e) => (
                  <div
                    key={e.id}
                    className="relative flex items-start gap-3 pb-3 pl-5 last:pb-0"
                  >
                    <span
                      className="absolute left-0 top-1.5 size-[11px] rounded-full border-2 border-cta bg-bg-elevated"
                      aria-hidden
                    />
                    <span className="flex-1 rounded-xl border border-border/50 bg-bg/40 px-3 py-2">
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-fg">
                          {new Date(e.localDate + 'T12:00:00').toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'short',
                            weekday: 'short',
                          })}
                        </span>
                        <span className="font-display font-semibold text-accent">
                          {applyUnits(e.weightKg, settings.units).toFixed(1)} {formatUnits(settings.units)}
                        </span>
                      </span>
                    </span>
                    <button
                      onClick={() => void remove(e.id)}
                      className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border text-danger/70 transition-colors hover:border-danger/50 hover:text-danger"
                      aria-label={`Eliminar registro del ${e.localDate}`}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {entries.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-bg-elevated/50 p-8 text-center">
            <p className="text-sm text-muted">
              Registra tu peso a lo largo del tiempo para ver la evolución en gráfico.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
