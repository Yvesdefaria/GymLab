// Providers de la app: arranque no bloqueante (F103/T3). La shell se pinta
// apenas se aplica el idioma guardado y el seed sigue en segundo plano; el
// estado compartido vive en `app/seeding.tsx` (`useSeedingStatus`).
import type { ReactNode } from 'react'
import { SeedingProvider } from './seeding'

type ProvidersProps = {
  children: ReactNode
}

export const Providers = ({ children }: ProvidersProps) => (
  <SeedingProvider>{children}</SeedingProvider>
)
