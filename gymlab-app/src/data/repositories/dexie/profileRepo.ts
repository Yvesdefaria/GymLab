// Perfil único del usuario en Dexie (fila fija id=1); se crea bajo demanda.
import { db } from './db'
import type { ProfileRepository } from '../types'
import type { Profile } from '@/domain/types'

// Perfil por defecto para usuarios nuevos.
const defaultProfile = (): Profile => ({
  id: 1,
  displayName: 'Atleta',
  weeklyGoal: 3,
  createdAt: new Date().toISOString(),
  userId: crypto.randomUUID(),
})

export const profileRepo: ProfileRepository = {
  get: () => db.profile.where('id').equals(1).first(),
  ensure: async () => {
    // Garantiza que exista el perfil; rellena userId si faltara de versiones antiguas.
    const existing = await db.profile.get(1)
    if (existing) {
      if (!existing.userId) {
        await db.profile.update(1, { userId: crypto.randomUUID() })
        return (await db.profile.get(1))!
      }
      return existing
    }
    const p = defaultProfile()
    await db.profile.put(p)
    return p
  },
  update: (changes) => db.profile.where('id').equals(1).modify(changes),
}
