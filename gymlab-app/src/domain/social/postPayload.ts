import type { Post, PostVisibility, Workout } from '../types'

export const buildWorkoutPostPayload = (
  workout: Pick<Workout, 'id' | 'totalVolume' | 'localDate'>,
  authorId: string,
  caption?: string,
  visibility: PostVisibility = 'private'
): Omit<Post, 'id' | 'createdAt' | 'remoteId' | 'syncedAt' | 'mediaIds'> & { mediaIds: string[] } => ({
  authorId,
  type: 'workout',
  workoutId: workout.id,
  caption:
    caption ??
    `Entreno ${workout.localDate}: ${workout.totalVolume.toLocaleString('es-ES')} kg de volumen`,
  mediaIds: [],
  visibility,
})
