import { progressPhotoRepo } from '@/data/repositories'

// F120/PH-2: la LECTURA de fotos vive en la capa única (useAchievementsData().photos);
// este hook ya no declara una liveQuery propia (antes duplicaba progressPhotoRepo.getAll)
// y queda solo como punto de acceso a las mutaciones.
export const useProgressPhotos = () => ({ progressPhotoRepo })
