// Providers de la app: bloquea la UI hasta asegurar los datos semilla en Dexie.
import { useEffect, useState } from 'react'
import { ensureSeeded } from '@/data/seed/reseeder'

type ProvidersProps = {
  children: React.ReactNode
}

// Envuelve la app; muestra loading o error mientras se prepara la base local.
export const Providers = ({ children }: ProvidersProps) => {
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Semilla la base local (IndexedDB) una sola vez al montar.
  useEffect(() => {
    ensureSeeded()
      .then(() => setReady(true))
      .catch((e) => setError(e instanceof Error ? e.message : 'Error al cargar'))
  }, [])

  if (error) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg p-4 text-center">
        <p className="text-sm text-danger">{error}</p>
      </div>
    )
  }

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg">
        <div className="text-center">
          <div className="mb-3 inline-block size-8 animate-spin rounded-full border-2 border-border border-t-cta" />
          <p className="text-sm text-muted">Cargando GymLab...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
