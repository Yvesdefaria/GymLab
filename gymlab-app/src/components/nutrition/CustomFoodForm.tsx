// Formulario «alimento desde etiqueta nutricional»: nombre + macros por 100g (o base).
// Calcula kcal con la fórmula Atwater simplificada (4·P + 4·C + 9·G).
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DecimalInput } from '@/components/ui/DecimalInput'
import type { FoodItem } from '@/domain/types'

// Campo numérico etiquetado (label implícito): usado para proteína/carbs/grasa y gramos base.
// `mode` se propaga a DecimalInput (integer para gramos base; decimal para macros).
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
  <label className="flex flex-col gap-1">
    <span className="text-xs text-muted">{label}</span>
    <div className="flex items-center gap-1">
      <DecimalInput
        value={value}
        onChange={onChange}
        mode={mode}
        inputMode={mode === 'integer' ? 'numeric' : 'decimal'}
        placeholder={suffix ? undefined : 'g'}
        className={`min-h-[44px] w-full rounded-xl border border-border/30 bg-bg-elevated/50 px-3 py-3 text-sm text-fg ${inputClass ?? ''}`}
      />
      {suffix && <span className="text-xs text-muted">{suffix}</span>}
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
    // Vacío cuenta como 0 en macros; en gramos base vacío/0 cae al default de 100
    // (misma semántica del parseInt(baseGrams) || 100 anterior).
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
    <div className="rounded-2xl border border-border/30 bg-bg-elevated/30 px-4 py-4">
      <p className="text-sm font-semibold text-fg mb-3">{t('nutrition.customFoodTitle')}</p>
      <div className="flex flex-col gap-2">
        <input
          type="text"
          placeholder={t('nutrition.customFoodName')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="min-h-[44px] rounded-xl border border-border/30 bg-bg-elevated/50 px-4 py-3 text-sm text-fg"
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
          inputClass="w-20"
          suffix="g"
        />
        <div className="flex gap-2 mt-1">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 min-h-[44px] rounded-xl bg-bg-elevated/50 px-4 py-3 text-sm text-muted"
          >
            {t('nutrition.cancel')}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 min-h-[44px] rounded-xl bg-accent px-4 py-3 text-sm font-medium text-accent-fg"
          >
            {t('nutrition.saveCustom')}
          </button>
        </div>
      </div>
    </div>
  )
}