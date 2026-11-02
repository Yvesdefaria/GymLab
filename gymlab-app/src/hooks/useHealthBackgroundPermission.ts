// Estado del permiso de salud en background para la sección Permisos de Ajustes:
// consulta sin diálogo, re-chequea al volver del sistema y expone el pedido explícito.
import { useCallback, useEffect, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import {
  getHealthBackgroundStatus,
  requestHealthBackgroundRead,
  type HealthBackgroundResult,
} from '@/data/healthBackgroundBridge'
import { getBackgroundPromptState, setBackgroundPromptState } from '@/data/healthBackgroundPreference'
import type { BackgroundPromptState } from '@/domain/healthBackgroundPrompt'

const UNKNOWN: HealthBackgroundResult = { granted: false, available: false }

export const useHealthBackgroundPermission = () => {
  const [status, setStatus] = useState<HealthBackgroundResult>(UNKNOWN)
  const [prompt, setPrompt] = useState<BackgroundPromptState>('ask')
  const [asking, setAsking] = useState(false)

  const refresh = useCallback(async () => {
    const [nextStatus, nextPrompt] = await Promise.all([
      getHealthBackgroundStatus(),
      getBackgroundPromptState(),
    ])
    setStatus(nextStatus)
    setPrompt(nextPrompt)
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  // Al volver del diálogo del sistema el permiso pudo cambiar: re-chequear.
  useEffect(() => {
    if (Capacitor.getPlatform() !== 'android') return
    const onVisibility = () => {
      if (document.visibilityState === 'visible') void refresh()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [refresh])

  const request = useCallback(async (): Promise<HealthBackgroundResult> => {
    setAsking(true)
    try {
      const next = await requestHealthBackgroundRead()
      setStatus(next)
      // Un pedido explícito ya cumplió el aviso automático: no volver a interrumpir.
      await setBackgroundPromptState('asked')
      setPrompt('asked')
      return next
    } finally {
      setAsking(false)
    }
  }, [])

  const updatePrompt = useCallback(async (next: BackgroundPromptState) => {
    await setBackgroundPromptState(next)
    setPrompt(next)
  }, [])

  return { ...status, prompt, asking, request, updatePrompt, refresh }
}
