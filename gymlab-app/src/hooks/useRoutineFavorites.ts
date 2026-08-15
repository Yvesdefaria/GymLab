// Hook que gestiona las rutinas marcadas como favoritas (persistidas en la tabla meta).
import { useMetaIdFavorites } from './useMetaIdFavorites'

const FAV_KEY = 'routineFavorites'

// Favoritos de rutinas: delega en el hook genérico de ids.
export const useRoutineFavorites = () => useMetaIdFavorites(FAV_KEY)
