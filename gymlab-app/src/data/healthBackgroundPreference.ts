// Persistencia de la política del pedido de salud en background. Vive en Dexie
// (local-first, como el resto de preferencias) y no en el plugin nativo: la decisión
// de cuándo preguntar es de producto, no de la plataforma.
import { metaRepo } from './repositories'
import {
  parseBackgroundPromptState,
  type BackgroundPromptState,
} from '@/domain/healthBackgroundPrompt'

export const HEALTH_BACKGROUND_PROMPT_KEY = 'healthBackgroundPrompt'

export const getBackgroundPromptState = async (): Promise<BackgroundPromptState> => {
  const raw = await metaRepo.getJson<string>(HEALTH_BACKGROUND_PROMPT_KEY, '')
  return parseBackgroundPromptState(raw)
}

export const setBackgroundPromptState = async (state: BackgroundPromptState): Promise<void> => {
  await metaRepo.setJson(HEALTH_BACKGROUND_PROMPT_KEY, state)
}
