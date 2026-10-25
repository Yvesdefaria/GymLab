// Alta de comida (F132.6): buscador + resultados hairline, gramos con vista
// previa de macros y alimento personalizado. No cierra el sheet al agregar:
// limpia la búsqueda y deja el formulario listo para el siguiente alimento.
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PackagePlus, Plus, Search } from 'lucide-react'
import { calculateFoodMacros } from '@/domain/nutrition'
import type { MealEntry, MealType, FoodItem } from '@/domain/types'
import type { AppLanguage } from '@/domain/onboarding'
import type { FoodWithDisplayName } from '@/hooks/useFoods'
import { formatNumber } from '@/lib/intl'
import { DecimalInput } from '@/components/ui/DecimalInput'
import { CustomFoodForm } from '@/components/nutrition/CustomFoodForm'
import { FoodResultsList, type FoodOption } from '@/components/nutrition/FoodResultsList'

export const FoodAdder = ({
  foods,
  addCustomFood,
  onAdd,
  today,
  mealType,
}: {
  foods: FoodWithDisplayName[]
  addCustomFood: (food: Omit<FoodItem, 'id'>) => Promise<number>
  onAdd: (meal: Omit<MealEntry, 'id' | 'createdAt'>) => void
  today: string
  mealType: MealType
}) => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const [search, setSearch] = useState('')
  const [grams, setGrams] = useState<number | undefined>(100)
  const [selectedFoodId, setSelectedFoodId] = useState<number | null>(null)
  const [showCustomForm, setShowCustomForm] = useState(false)
  const [lastAdded, setLastAdded] = useState<string | null>(null)

  const filteredFoods: FoodOption[] = foods.filter((food) =>
    food.displayName.toLowerCase().includes(search.toLowerCase())
  )
  const selectedFood = foods.find((food) => food.id === selectedFoodId)
  const preview = selectedFood && grams !== undefined && grams > 0
    ? calculateFoodMacros(selectedFood, grams)
    : null

  const handlePick = (food: FoodOption) => {
    setSelectedFoodId(food.id)
    setSearch(food.displayName)
    setLastAdded(null)
  }

  const handleAdd = () => {
    if (!selectedFood || grams === undefined || grams <= 0) return
    const item = calculateFoodMacros(selectedFood, grams)
    onAdd({ localDate: today, mealType, items: [item] })
    setLastAdded(selectedFood.displayName)
    setSearch('')
    setSelectedFoodId(null)
    setGrams(100)
  }

  return (
    <div className="flex flex-col">
      <label className="flex min-h-[44px] items-center gap-2 rounded-xl border border-border bg-bg px-3">
        <Search className="size-4 shrink-0 text-muted" aria-hidden />
        <input
          type="text"
          aria-label={t('nutrition.searchAria')}
          placeholder={t('nutrition.search')}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setSelectedFoodId(null)
            setLastAdded(null)
          }}
          className="min-w-0 flex-1 bg-transparent text-sm text-fg outline-none placeholder:text-muted"
        />
      </label>

      {search && !selectedFoodId && <FoodResultsList options={filteredFoods} onPick={handlePick} />}

      {selectedFood && (
        <div className="mt-2 border border-cta/30 bg-cta/5 px-3 py-2">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-[12.5px] font-medium text-fg">{selectedFood.displayName}</p>
            <span className="shrink-0 text-[8.5px] font-semibold uppercase tracking-[0.12em] text-gold-bright">
              {t('nutrition.selected')}
            </span>
          </div>
          <p className="mt-1 text-[9.5px] tabular-nums text-muted">
            {preview
              ? `P ${formatNumber(preview.proteinG, lang, { maximumFractionDigits: 1 })} · C ${formatNumber(preview.carbsG, lang, { maximumFractionDigits: 1 })} · G ${formatNumber(preview.fatG, lang, { maximumFractionDigits: 1 })}`
              : t('nutrition.gramsHint')}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <DecimalInput
              value={grams}
              onChange={setGrams}
              mode="integer"
              inputMode="numeric"
              ariaLabel={t('nutrition.grams')}
              placeholder={t('nutrition.grams')}
              className="h-11 w-24 rounded-xl border border-border bg-bg px-3 text-sm text-fg"
            />
            <span className="text-[10px] text-muted">g</span>
            <button
              type="button"
              onClick={handleAdd}
              className="ml-auto flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-cta px-4 text-sm font-semibold text-on-gold"
            >
              <Plus className="size-4" /> {t('nutrition.add')}
            </button>
          </div>
          {preview && (
            <p className="mt-1 text-right text-[9.5px] tabular-nums text-muted">
              {formatNumber(preview.kcal, lang)} kcal
            </p>
          )}
        </div>
      )}

      {lastAdded && (
        <p role="status" className="mt-2 text-[10.5px] text-success">
          {t('nutrition.added', { name: lastAdded })}
        </p>
      )}

      <button
        type="button"
        onClick={() => setShowCustomForm((open) => !open)}
        className="mt-2 flex min-h-[44px] items-center justify-center gap-2 border-t border-border/40 text-[11px] font-medium text-cta"
      >
        <PackagePlus className="size-4" /> {t('nutrition.addCustom')}
      </button>

      {showCustomForm && (
        <CustomFoodForm
          onSave={(food) => {
            void addCustomFood(food).then(() => setShowCustomForm(false))
          }}
          onCancel={() => setShowCustomForm(false)}
        />
      )}
    </div>
  )
}
