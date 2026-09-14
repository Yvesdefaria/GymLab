// Toast informativo de cancelación del inicio (F99.1/R4): se auto-oculta y no ofrece
// acciones (role="status", lenguaje visual de UndoToast); no se creó ninguna sesión.
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

// Duración visible de la cancelación; sin deshacer porque no existe nada que revertir.
const AUTO_CLOSE_MS = 3000

export const EmptyDayToast = () => {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), AUTO_CLOSE_MS)
    return () => clearTimeout(timer)
  }, [])

  if (!visible) return null

  return (
    <div className="fixed inset-x-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom)+0.75rem)] z-[90]">
      <div
        role="status"
        className="mx-auto flex max-w-md items-center justify-between gap-3 rounded-2xl border border-gold/60 bg-bg-elevated/95 px-4 py-3 shadow-xl backdrop-blur"
      >
        <p className="min-w-0 truncate text-sm text-fg">{t('home.diaVacioToast')}</p>
      </div>
    </div>
  )
}