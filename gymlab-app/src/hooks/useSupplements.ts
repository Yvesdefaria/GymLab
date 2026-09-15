import { useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { supplementRepo } from '@/data/repositories'
import { SUPPLEMENT_SEED } from '@/domain/supplements'
import { db } from '@/data/repositories/dexie/db'

// Seeds supplements into Dexie if the table is empty.
const seedIfNeeded = async () => {
  const count = await db.supplements.count()
  if (count === 0) {
    const { nextId } = await import('@/data/repositories/dexie/base')
    for (const s of SUPPLEMENT_SEED) {
      const id = await nextId(db.supplements)
      await db.supplements.add({ ...s, id, createdAt: new Date().toISOString() })
    }
  }
}

// Deduplica la siembra entre montajes concurrentes (StrictMode ejecuta el efecto dos
// veces): se cachea la PROMESA, no un booleano, para que dos llamadas simultáneas
// compartan la misma siembra en vez de insertar filas duplicadas.
let seedPromise: Promise<void> | null = null
const ensureSeeded = (): Promise<void> => {
  seedPromise ??= seedIfNeeded().catch(() => {
    // Un fallo al sembrar no debe salir como rechazo sin manejar: se limpia la promesa
    // para reintentar en el próximo montaje y la lista queda vacía mientras tanto.
    seedPromise = null
  })
  return seedPromise
}

export const useSupplements = () => {
  // El seed ESCRIBE, así que corre FUERA del querier de useLiveQuery: Dexie 4 prohíbe
  // escrituras dentro de un querier (`ReadOnlyError: Readwrite transaction in liveQuery
  // context`) y, al no haber ErrorBoundary, la excepción desmontaba la app entera
  // (pantalla negra en /suplementos con la tabla vacía). El liveQuery observa la tabla,
  // así que re-emite solo en cuanto el seed inserta las filas.
  useEffect(() => {
    void ensureSeeded()
  }, [])

  const supplements = useLiveQuery(() => supplementRepo.getAll(), []) ?? []
  return { supplements, supplementRepo }
}
