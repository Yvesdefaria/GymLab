import { useCallback, useEffect, useState } from 'react'
import { metaRepo } from '@/data/repositories'

export type Theme = 'night' | 'day'

const STORAGE_KEY = 'gymlab.theme'

const readStored = (): Theme => {
  const saved = localStorage.getItem(STORAGE_KEY)
  return saved === 'day' || saved === 'night' ? saved : 'night'
}

export const useTheme = () => {
  const [theme, setThemeState] = useState<Theme>(readStored)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem(STORAGE_KEY, theme)
    void metaRepo.set('theme', theme)
  }, [theme])

  const setTheme = useCallback((next: Theme) => setThemeState(next), [])

  return { theme, setTheme }
}
