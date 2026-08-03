import { Moon, Sun, Shield } from 'lucide-react'
import { AppHeader } from '@/components/layout/AppHeader'
import { useTheme } from '@/hooks/useTheme'

export const AjustesPage = () => {
  const { theme, setTheme } = useTheme()

  const options = [
    {
      value: 'night' as const,
      label: 'Noche',
      description: 'Negro y dorado',
      icon: Moon,
    },
    {
      value: 'day' as const,
      label: 'Día',
      description: 'Blanco y dorado',
      icon: Sun,
    },
  ]

  return (
    <div>
      <AppHeader title="Ajustes" subtitle="Apariencia y preferencias" />
      <div className="space-y-4 p-4">
        <section className="rounded-2xl border border-gold/40 bg-bg-elevated p-4">
          <h2 className="font-display text-lg text-accent">Tema</h2>
          <p className="mt-1 text-sm text-muted">Elige el modo de la app.</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {options.map(({ value, label, description, icon: Icon }) => {
              const isActive = theme === value
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTheme(value)}
                  className={`flex min-h-[88px] flex-col items-center justify-center gap-1 rounded-2xl border p-3 transition-colors ${
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
        </section>

        <div className="flex items-start gap-2 rounded-xl border border-border/60 bg-bg-elevated/40 p-3 text-xs text-muted">
          <Shield className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
          <p>
            El tema se guarda en este dispositivo (local-first). Las cuentas en la
            nube llegarán en una fase posterior.
          </p>
        </div>
      </div>
    </div>
  )
}
