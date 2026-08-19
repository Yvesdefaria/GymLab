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

// Simula alimentos seed con IDs.
const FOODS: FoodItem[] = FOOD_SEED.map((f, i) => ({ ...f, id: i + 1 }))

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

  return (
    <div className="flex flex-col gap-4 px-4 pb-20 pt-2">
      {/* Header */}
      <div className="flex items-center gap-2">
        <UtensilsCrossed className="size-5 text-accent" aria-hidden />
        <h1 className="text-lg font-bold text-fg">{t('nutrition.title')}</h1>
      </div>

      {/* Resumen diario */}
      <div className="rounded-xl border border-border/30 bg-bg-elevated/30 px-3 py-3">
        <p className="text-xs font-semibold text-fg">{t('nutrition.dailySummary')}</p>
        <div className="mt-2 h-3 w-full rounded-full bg-border/30 overflow-hidden">
          <div
            className="h-full rounded-full bg-accent transition-all duration-500"
            style={{ width: `${kcalPct}%` }}
          />
        </div>
        <div className="mt-1.5 flex justify-between text-[0.6rem] text-muted">
          <span>{totals.kcal} / {tdee} kcal</span>
          <span>{kcalPct.toFixed(0)}%</span>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-[0.6rem] text-muted">{t('nutrition.protein')}</p>
            <p className="text-xs font-semibold text-fg">{totals.proteinG.toFixed(0)}g</p>
          </div>
          <div>
            <p className="text-[0.6rem] text-muted">{t('nutrition.carbs')}</p>
            <p className="text-xs font-semibold text-fg">{totals.carbsG.toFixed(0)}g</p>
          </div>
          <div>
            <p className="text-[0.6rem] text-muted">{t('nutrition.fat')}</p>
            <p className="text-xs font-semibold text-fg">{totals.fatG.toFixed(0)}g</p>
          </div>
        </div>
      </div>

      {/* Selector de tipo de comida */}
      <div className="flex gap-1">
        {(['desayuno', 'almuerzo', 'cena', 'snack'] as MealType[]).map((mt) => (
          <button
            key={mt}
            onClick={() => setSelectedMealType(mt)}
            className={`flex-1 rounded-lg px-1.5 py-1.5 text-[0.55rem] font-medium transition-colors ${
              selectedMealType === mt
                ? 'bg-accent text-accent-fg'
                : 'bg-bg-elevated/50 text-muted'
            }`}
          >
            {mt === 'desayuno' ? t('nutrition.meal.desayuno') : mt === 'almuerzo' ? t('nutrition.meal.almuerzo') : mt === 'cena' ? t('nutrition.meal.cena') : t('nutrition.meal.snack')}
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
          className="rounded-lg border border-border/30 bg-bg-elevated/30 px-3 py-2 text-xs text-fg"
        />
        {search && !selectedFoodId && (
          <div className="max-h-40 overflow-y-auto rounded-lg border border-border/30 bg-bg-elevated/30">
            {filteredFoods.slice(0, 10).map((f) => (
              <button
                key={f.id}
                onClick={() => { setSelectedFoodId(f.id); setSearch(f.name) }}
                className="flex w-full items-center justify-between px-3 py-1.5 text-[0.6rem] text-left hover:bg-bg-elevated/50"
              >
                <span className="text-fg">{f.name}</span>
                <span className="text-muted">{f.kcal} kcal/100g</span>
              </button>
            ))}
          </div>
        )}
        {selectedFoodId && (
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder={t('nutrition.grams')}
              value={grams}
              onChange={(e) => setGrams(e.target.value)}
              className="w-20 rounded-lg border border-border/30 bg-bg-elevated/30 px-2 py-1.5 text-[0.65rem] text-fg"
            />
            <button
              onClick={handleAdd}
              className="flex items-center gap-1 rounded-lg bg-accent px-3 py-1.5 text-[0.6rem] font-medium text-accent-fg"
            >
              <Plus className="size-3" /> {t('nutrition.add')}
            </button>
          </div>
        )}
      </div>

      {/* Historial de comidas del día */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold text-fg">{t('nutrition.todayMeals')}</p>
        {todayMeals.length === 0 ? (
          <p className="text-[0.65rem] text-muted">{t('nutrition.noMeals')}</p>
        ) : (
          todayMeals.map((meal) => (
            <div key={meal.id} className="rounded-xl border border-border/30 bg-bg-elevated/30 px-3 py-2">
              <div className="flex items-center justify-between">
                <p className="text-[0.6rem] font-medium text-fg">
                  {meal.mealType === 'desayuno' ? t('nutrition.meal.desayuno') : meal.mealType === 'almuerzo' ? t('nutrition.meal.almuerzo') : meal.mealType === 'cena' ? t('nutrition.meal.cena') : t('nutrition.meal.snack')}
                </p>
                <button onClick={() => onDeleteMeal(meal.id)} className="text-muted hover:text-red-400">
                  <Trash2 className="size-3" />
                </button>
              </div>
              {meal.items.map((item, i) => (
                <p key={i} className="text-[0.55rem] text-muted">
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
