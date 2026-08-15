// Helpers compartidos de las implementaciones Dexie: consultas por slug/fecha,
// ids incrementales y upsert por día que se repiten en casi todos los repositorios.
import type { EntityTable, Table } from 'dexie'

// Busca la fila con ese slug en tablas con índice 'slug' (catálogos sembrados).
export const getBySlug = <T extends { id: number; slug: string }>(
  table: EntityTable<T, 'id'>,
  slug: string,
): Promise<T | undefined> => table.where('slug').equals(slug).first()

// Busca la fila de ese día en tablas con índice 'localDate' (registros diarios).
export const getByDate = <T extends { id: number; localDate: string }>(
  table: EntityTable<T, 'id'>,
  localDate: string,
): Promise<T | undefined> => table.where('localDate').equals(localDate).first()

// Siguiente id incremental por encima del último existente (los seeds usan ids bajos).
export const nextId = async <T extends { id: number }>(
  table: EntityTable<T, 'id'>,
): Promise<number> => {
  const last = await table.orderBy('id').last()
  return (last?.id ?? 0) + 1
}

// Upsert por fecha: si ya hay fila ese día aplica el merge y devuelve su id; si no,
// crea la fila con id incremental, localDate y createdAt. El merge decide cómo se
// funde la entrada con la existente (sustituir campos o combinar zonas/notas).
export const upsertByDate = async <T extends { id: number; localDate: string; createdAt?: string }>(
  table: EntityTable<T, 'id'>,
  localDate: string,
  values: Omit<T, 'id' | 'localDate' | 'createdAt'>,
  merge?: (existing: T, incoming: Omit<T, 'id' | 'localDate' | 'createdAt'>) => Partial<T>,
): Promise<number> => {
  const existing = await table.where('localDate').equals(localDate).first()
  if (existing) {
    const changes = merge ? merge(existing, values) : values
    // El key y los cambios de EntityTable no se infieren con genéricos; el cast es
    // seguro: existing es T y changes es un Partial<T> válido para Dexie.
    await (table as unknown as Table<T, number>).update(existing.id, changes as any)
    return existing.id
  }
  const id = await nextId(table)
  const row = { ...values, id, localDate, createdAt: new Date().toISOString() } as T
  // El item ya es un T completo; el cast solo evita el tipo insert de EntityTable.
  await (table as unknown as Table<T, number>).add(row as T)
  return id
}
