// Apariencia (Nocturno Minimal): tema en control segmentado, las 6 paletas como
// discos en una sola fila y los selectores de idioma/unidades como filas hairline.
import { useTranslation } from 'react-i18next'
import { Moon, Sun } from 'lucide-react'
import { useTheme, PALETTES } from '@/hooks/useTheme'
import { useSettings } from '@/hooks/useSettings'
import { applyLanguage } from '@/i18n'
import type { AppLanguage } from '@/domain/onboarding'
import type { Units } from '@/domain/settings'
import {
  SectionLabel,
  Select,
  PALETTE_LABELS,
  PALETTE_SWATCH,
  settingsGroupClass,
  settingsRowClass,
} from './SettingsUI'

export const AppearanceSection = () => {
  const { t } = useTranslation()
  const { theme, setTheme, palette, setPalette } = useTheme()
  const { settings, update } = useSettings()

  const themeOptions = [
    { value: 'night' as const, label: t('ajustes.temaNoche'), description: t('ajustes.temaNocheDesc'), icon: Moon },
    { value: 'day' as const, label: t('ajustes.temaDia'), description: t('ajustes.temaDiaDesc'), icon: Sun },
  ]
  const activeTheme = themeOptions.find((o) => o.value === theme) ?? themeOptions[0]

  return (
    <section className={settingsGroupClass}>
      <SectionLabel>{t('ajustes.apariencia')}</SectionLabel>

      <div className={settingsRowClass}>
        <div className="min-w-0">
          <p className="text-sm text-fg">{t('ajustes.tema')}</p>
          <p className="mt-0.5 text-xs text-muted">{activeTheme.description}</p>
        </div>
        <div
          role="group"
          aria-label={t('ajustes.tema')}
          className="flex shrink-0 rounded-full border border-border p-0.5"
        >
          {themeOptions.map(({ value, label, icon: Icon }) => {
            const isActive = theme === value
            return (
              <button
                key={value}
                type="button"
                onClick={() => setTheme(value)}
                aria-pressed={isActive}
                className={`flex min-h-11 items-center gap-1.5 rounded-full px-3 text-xs transition-colors motion-reduce:transition-none ${
                  isActive ? 'bg-cta/15 text-accent-soft' : 'text-muted'
                }`}
              >
                <Icon className="size-3.5" aria-hidden />
                {label}
              </button>
            )
          })}
        </div>
      </div>

      <div className={settingsRowClass}>
        <p className="shrink-0 text-sm text-fg">{t('ajustes.paleta')}</p>
        <div className="flex items-center">
          {PALETTES.map((value) => {
            const isActive = palette === value
            return (
              <button
                key={value}
                type="button"
                onClick={() => setPalette(value)}
                aria-pressed={isActive}
                aria-label={t(PALETTE_LABELS[value])}
                className="flex size-11 items-center justify-center"
              >
                <span
                  className={`size-6 rounded-full ${PALETTE_SWATCH[value]} ${
                    isActive ? 'ring-2 ring-fg ring-offset-2 ring-offset-bg' : ''
                  }`}
                  aria-hidden
                />
              </button>
            )
          })}
        </div>
      </div>

      <div className={settingsRowClass}>
        <div className="min-w-0">
          <p className="text-sm text-fg">{t('settings.language')}</p>
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

      <div className={settingsRowClass}>
        <div className="min-w-0">
          <p className="text-sm text-fg">{t('ajustes.unidadesPeso')}</p>
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
