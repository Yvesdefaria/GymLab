// Nutrición: página de registro de comidas con resumen diario de kcal/macros.
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { UtensilsCrossed, Plus, Trash2 } from 'lucide-react'
import { calculateDailyTotals, calculateFoodMacros, FOOD_SEED } from '@/domain/nutrition'
import type { FoodItem, MealEntry, MealType } from '@/domain/types'

interface NutritionPageProps {
  meals: MealEntry[]
  onAddMeal: (meal: Omit<MealEntry, 'id' | 'createdAt'>) => void
  onDeleteMeal: (id: number) => void
  tdee?: number
}

const FOODS: FoodItem[] = FOOD_SEED.map((f, i) => ({ ...f, id: i + 1 }))

const MEAL_TYPES: MealType[] = ['desayuno', 'almuerzo', 'cena', 'snack']

export const NutritionPage = ({ meals, onAddMeal, onDeleteMeal, tdee = 2200 }: NutritionPageProps) => {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [selectedMealType, setSelectedMealType] = useState<MealType>('almuerzo')
  const [grams, setGrams] = useState('100')
  const [selectedFoodId, setSelectedFoodId] = useState<number | null>(null)

  const today = new Date().toISOString().split('T')[0]
  const todayMeals = meals.filter((m) => m.localDate === today)
  const totals = calculateDailyTotals(todayMeals)
  const kcalPct = tdee > 0 ? Math.min(100, (totals.kcal / tdee) * 100) : 0

  const filteredFoods = FOODS.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleAdd = () => {
    if (!selectedFoodId) return
    const food = FOODS.find((f) => f.id === selectedFoodId)
    if (!food) return
    const g = parseInt(grams, 10)
    if (isNaN(g) || g <= 0) return

    const item = calculateFoodMacros(food, g)
    onAddMeal({
      localDate: today,
      mealType: selectedMealType,
      items: [item],
    })
    setSearch('')
    setSelectedFoodId(null)
    setGrams('100')
  }

  const mealLabel = (mt: MealType) => t(`nutrition.meal.${mt}` as any)

  return (
    <div className="flex flex-col gap-4 px-4 pb-20 pt-2">
      {/* Header */}
      <div className="flex items-center gap-2">
        <UtensilsCrossed className="size-5 text-accent" aria-hidden />
        <h1 className="text-lg font-bold text-fg">{t('nutrition.title')}</h1>
      </div>

      {/* Resumen diario — 60/30/10: 60% neutral bg, 30% text, 10% accent bar */}
      <div className="rounded-2xl border border-border/30 bg-bg-elevated/30 px-4 py-4">
        <p className="text-sm font-semibold text-fg">{t('nutrition.dailySummary')}</p>
        <div className="mt-3 h-3 w-full rounded-full bg-border/30 overflow-hidden">
          <div
            className="h-full rounded-full bg-accent transition-all duration-500"
            style={{ width: `${kcalPct}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs text-muted">
          <span>{totals.kcal} / {tdee} kcal</span>
          <span>{kcalPct.toFixed(0)}%</span>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-xs text-muted">{t('nutrition.protein')}</p>
            <p className="text-sm font-semibold text-fg">{totals.proteinG.toFixed(0)}g</p>
          </div>
          <div>
            <p className="text-xs text-muted">{t('nutrition.carbs')}</p>
            <p className="text-sm font-semibold text-fg">{totals.carbsG.toFixed(0)}g</p>
          </div>
          <div>
            <p className="text-xs text-muted">{t('nutrition.fat')}</p>
            <p className="text-sm font-semibold text-fg">{totals.fatG.toFixed(0)}g</p>
          </div>
        </div>
      </div>

      {/* Meal type selector — thumb zone friendly, 44px touch targets */}
      <div className="flex gap-2">
        {MEAL_TYPES.map((mt) => (
          <button
            key={mt}
            onClick={() => setSelectedMealType(mt)}
            className={`flex-1 min-h-[44px] rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
              selectedMealType === mt
                ? 'bg-accent text-accent-fg'
                : 'bg-bg-elevated/50 text-muted'
            }`}
          >
            {mealLabel(mt)}
          </button>
        ))}
      </div>

      {/* Formulario de búsqueda */}
      <div className="flex flex-col gap-2">
        <input
          type="text"
          placeholder={t('nutrition.search')}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setSelectedFoodId(null) }}
          className="min-h-[44px] rounded-xl border border-border/30 bg-bg-elevated/30 px-4 py-3 text-sm text-fg"
        />
        {search && !selectedFoodId && (
          <div className="max-h-48 overflow-y-auto rounded-xl border border-border/30 bg-bg-elevated/30">
            {filteredFoods.slice(0, 10).map((f) => (
              <button
                key={f.id}
                onClick={() => { setSelectedFoodId(f.id); setSearch(f.name) }}
                className="flex w-full items-center justify-between px-4 py-3 min-h-[44px] text-sm text-left hover:bg-bg-elevated/50"
              >
                <span className="text-fg">{f.name}</span>
                <span className="text-xs text-muted">{f.kcal} kcal/100g</span>
              </button>
            ))}
          </div>
        )}
        {selectedFoodId && (
          <div className="flex items-center gap-3">
            <input
              type="number"
              placeholder={t('nutrition.grams')}
              value={grams}
              onChange={(e) => setGrams(e.target.value)}
              className="w-24 min-h-[44px] rounded-xl border border-border/30 bg-bg-elevated/30 px-3 py-3 text-sm text-fg"
            />
            <button
              onClick={handleAdd}
              className="flex items-center gap-2 min-h-[44px] rounded-xl bg-accent px-4 py-3 text-sm font-medium text-accent-fg"
            >
              <Plus className="size-4" /> {t('nutrition.add')}
            </button>
          </div>
        )}
      </div>

      {/* Historial de comidas del día */}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-fg">{t('nutrition.todayMeals')}</p>
        {todayMeals.length === 0 ? (
          <p className="text-sm text-muted">{t('nutrition.noMeals')}</p>
        ) : (
          todayMeals.map((meal) => (
            <div key={meal.id} className="rounded-2xl border border-border/30 bg-bg-elevated/30 px-4 py-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-fg">
                  {mealLabel(meal.mealType)}
                </p>
                <button
                  onClick={() => onDeleteMeal(meal.id)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center text-muted hover:text-red-400"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
              {meal.items.map((item, i) => (
                <p key={i} className="mt-1 text-xs text-muted">
                  {item.foodName} ({item.grams}g) — {item.kcal} kcal
                </p>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
