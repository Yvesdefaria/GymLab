import { useTranslation } from 'react-i18next'
import { Moon, Sun } from 'lucide-react'
import { useTheme, PALETTES } from '@/hooks/useTheme'
import { useSettings } from '@/hooks/useSettings'
import { applyLanguage } from '@/i18n'
import type { AppLanguage } from '@/domain/onboarding'
import type { Units } from '@/domain/settings'
import { SectionLabel, Select, PALETTE_LABELS, PALETTE_SWATCH } from './SettingsUI'

export const AppearanceSection = () => {
  const { t } = useTranslation()
  const { theme, setTheme, palette, setPalette } = useTheme()
  const { settings, update } = useSettings()

  const themeOptions = [
    { value: 'night' as const, label: t('ajustes.temaNoche'), description: t('ajustes.temaNocheDesc'), icon: Moon },
    { value: 'day' as const, label: t('ajustes.temaDia'), description: t('ajustes.temaDiaDesc'), icon: Sun },
  ]

  return (
    <section className="panel-light rounded-2xl p-4">
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
                isActive ? 'border-cta bg-cta/15' : 'border-border bg-bg hover:border-cta'
              }`}
              aria-pressed={isActive}
            >
              <span
                className={`size-6 rounded-full ${PALETTE_SWATCH[value]} ${
                  isActive ? 'ring-2 ring-fg/60 ring-offset-1 ring-offset-bg-elevated' : ''
                }`}
                aria-hidden
              />
              <span className={`text-[0.65rem] font-medium leading-none ${isActive ? 'text-accent-soft' : 'text-muted'}`}>
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
  )
}
