// Añadidor de comida: buscador con lista de resultados, gramos por ración, agregar
// al tipo de comida actual y formulario de alimento personalizado (desde etiqueta).
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PackagePlus } from 'lucide-react'
import { calculateFoodMacros } from '@/domain/nutrition'
import type { MealEntry, MealType, FoodItem } from '@/domain/types'
import type { FoodWithDisplayName } from '@/hooks/useFoods'
import { CustomFoodForm } from '@/components/nutrition/CustomFoodForm'
import { FoodAmountRow } from '@/components/nutrition/FoodAmountRow'
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
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [grams, setGrams] = useState('100')
  const [selectedFoodId, setSelectedFoodId] = useState<number | null>(null)
  const [showCustomForm, setShowCustomForm] = useState(false)

  const filteredFoods: FoodOption[] = foods.filter((f) =>
    f.displayName.toLowerCase().includes(search.toLowerCase())
  )

  const handlePick = (f: FoodOption) => {
    setSelectedFoodId(f.id)
    setSearch(f.displayName)
  }

  const handleAdd = () => {
    if (!selectedFoodId) return
    const food = foods.find((f) => f.id === selectedFoodId)
    if (!food) return
    const g = parseInt(grams, 10)
    if (isNaN(g) || g <= 0) return

    const item = calculateFoodMacros(food, g)
    onAdd({
      localDate: today,
      mealType,
      items: [item],
    })
    setSearch('')
    setSelectedFoodId(null)
    setGrams('100')
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        type="text"
        placeholder={t('nutrition.search')}
        value={search}
        onChange={(e) => { setSearch(e.target.value); setSelectedFoodId(null) }}
        className="min-h-[44px] rounded-xl border border-border/30 bg-bg-elevated/30 px-4 py-3 text-sm text-fg"
      />
      {search && !selectedFoodId && (
        <FoodResultsList options={filteredFoods} onPick={handlePick} />
      )}
      {selectedFoodId && (
        <FoodAmountRow grams={grams} onGramsChange={setGrams} onAdd={handleAdd} />
      )}

      {/* Botón para agregar alimento custom */}
      <button
        type="button"
        onClick={() => setShowCustomForm(!showCustomForm)}
        className="flex items-center justify-center gap-2 min-h-[44px] rounded-xl border border-dashed border-accent/50 text-sm font-medium text-accent"
      >
        <PackagePlus className="size-4" /> {t('nutrition.addCustom')}
      </button>

      {/* Formulario de alimento personalizado (desde etiqueta) */}
      {showCustomForm && (
        <CustomFoodForm
          onSave={(food) => { void addCustomFood(food).then(() => setShowCustomForm(false)) }}
          onCancel={() => setShowCustomForm(false)}
        />
      )}
    </div>
  )
}