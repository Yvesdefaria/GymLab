// Formulario «alimento desde etiqueta nutricional» (F132.6): campos hairline y
// cálculo Atwater simplificado (4·P + 4·C + 9·G) sin tarjeta.
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DecimalInput } from '@/components/ui/DecimalInput'
import type { FoodItem } from '@/domain/types'

const MacroField = ({
  label,
  value,
  onChange,
  inputClass,
  suffix,
  mode = 'decimal',
}: {
  label: string
  value: number | undefined
  onChange: (v: number | undefined) => void
  inputClass?: string
  suffix?: string
  mode?: 'decimal' | 'integer'
}) => (
  <label className="flex min-w-0 flex-col gap-1">
    <span className="text-[9.5px] uppercase tracking-[0.12em] text-muted">{label}</span>
    <div className="flex items-center gap-1">
      <DecimalInput
        value={value}
        onChange={onChange}
        mode={mode}
        inputMode={mode === 'integer' ? 'numeric' : 'decimal'}
        placeholder={suffix ? undefined : 'g'}
        className={`min-h-[44px] w-full rounded-xl border border-border bg-bg px-3 text-sm text-fg ${inputClass ?? ''}`}
      />
      {suffix && <span className="text-[10px] text-muted">{suffix}</span>}
    </div>
  </label>
)

export const CustomFoodForm = ({
  onSave,
  onCancel,
}: {
  onSave: (food: Omit<FoodItem, 'id'>) => void
  onCancel: () => void
}) => {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [protein, setProtein] = useState<number | undefined>(undefined)
  const [carbs, setCarbs] = useState<number | undefined>(undefined)
  const [fat, setFat] = useState<number | undefined>(undefined)
  const [baseGrams, setBaseGrams] = useState<number | undefined>(100)

  const handleSave = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    const p = protein ?? 0
    const c = carbs ?? 0
    const f = fat ?? 0
    const base = baseGrams || 100
    onSave({
      name: trimmed,
      foodKey: `custom_${Date.now()}`,
      kcal: Math.round(p * 4 + c * 4 + f * 9),
      proteinG: p,
      carbsG: c,
      fatG: f,
      category: 'otro',
      baseGrams: base,
    })
  }

  return (
    <div className="mt-2 border-t border-border/40 pt-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
        {t('nutrition.customFoodTitle')}
      </p>
      <div className="mt-2 flex flex-col gap-2">
        <input
          type="text"
          placeholder={t('nutrition.customFoodName')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="min-h-[44px] rounded-xl border border-border bg-bg px-3 text-sm text-fg"
        />
        <div className="grid grid-cols-3 gap-2">
          <MacroField label={t('nutrition.protein')} value={protein} onChange={setProtein} />
          <MacroField label={t('nutrition.carbs')} value={carbs} onChange={setCarbs} />
          <MacroField label={t('nutrition.fat')} value={fat} onChange={setFat} />
        </div>
        <MacroField
          label={t('nutrition.baseGrams')}
          value={baseGrams}
          onChange={setBaseGrams}
          mode="integer"
          inputClass="w-24"
          suffix="g"
        />
        <div className="mt-1 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[44px] flex-1 rounded-xl border border-border px-4 text-sm text-muted"
          >
            {t('nutrition.cancel')}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="min-h-[44px] flex-1 rounded-xl bg-cta px-4 text-sm font-semibold text-on-gold"
          >
            {t('nutrition.saveCustom')}
          </button>
        </div>
      </div>
    </div>
  )
}
