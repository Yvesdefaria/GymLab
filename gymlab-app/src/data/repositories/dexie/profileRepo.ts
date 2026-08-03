import { db } from './db'
import type { ProfileRepository } from '../types'

export const profileRepo: ProfileRepository = {
  get: () => db.profile.where('id').equals(1).first(),
  update: (changes) => db.profile.where('id').equals(1).modify(changes),
}
