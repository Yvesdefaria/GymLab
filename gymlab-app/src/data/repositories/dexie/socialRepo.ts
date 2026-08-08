// Feed social local: perfiles, posts y media (put = upsert por id).
import { db } from './db'
import type { SocialRepository } from '../types'

export const socialRepo: SocialRepository = {
  getProfile: (id) => db.socialProfiles.get(id),
  upsertProfile: (profile) => db.socialProfiles.put(profile),
  // Posts del autor ordenados de más reciente a más antiguo.
  listPostsByAuthor: (authorId) =>
    db.posts.where('authorId').equals(authorId).reverse().sortBy('createdAt'),
  createPost: (post) => db.posts.put(post),
  addMedia: (media) => db.postMedia.put(media),
}
