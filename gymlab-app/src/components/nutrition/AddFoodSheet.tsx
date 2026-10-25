// Sheet de alta de comida (F132.6): envuelve FoodAdder en el BottomSheet del
// catálogo; el alta queda abierta después de agregar para cargar varios alimentos.
import { useTranslation } from 'react-i18next'
import { BottomSheet } from '@/components/ui/BottomSheet'
import type { MealEntry, MealType, FoodItem } from '@/domain/types'
import type { FoodWithDisplayName } from '@/hooks/useFoods'
import { FoodAdder } from '@/components/nutrition/FoodAdder'
import { MEAL_TYPE_LABEL_KEY } from '@/components/nutrition/mealTypeMeta'

export const AddFoodSheet = ({
  mealType,
  foods,
  addCustomFood,
  onAdd,
  today,
  onClose,
}: {
  mealType: MealType
  foods: FoodWithDisplayName[]
  addCustomFood: (food: Omit<FoodItem, 'id'>) => Promise<number>
  onAdd: (meal: Omit<MealEntry, 'id' | 'createdAt'>) => void
  today: string
  onClose: () => void
}) => {
  const { t } = useTranslation()
  const meal = t(MEAL_TYPE_LABEL_KEY[mealType])
  return (
    <BottomSheet
      title={t('nutrition.addTo', { meal })}
      subtitle={t('nutrition.addSheetSubtitle')}
      onClose={onClose}
    >
      <div className="pb-2">
        <FoodAdder
          foods={foods}
          addCustomFood={addCustomFood}
          onAdd={onAdd}
          today={today}
          mealType={mealType}
        />
      </div>
    </BottomSheet>
  )
}
