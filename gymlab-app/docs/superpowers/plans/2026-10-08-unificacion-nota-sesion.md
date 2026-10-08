# Unificación de la nota de sesión + restauración del sheet — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (or superpowers:subagent-driven-development) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unificar la nota de sesión en `Workout.notes` (única fuente, migrando y limpiando `journal.note`), restaurar el sheet de bitácora post-entreno (regresión F86) con la nota pre-cargada, y permitir editar la nota desde el detalle.

**Architecture:** Dominio puro `mergeSessionNotes` + migración Dexie v15 (helper transaccional compartido con el import de backups) + retiro del campo `note` del journal + hook `useWorkoutNote` como única puerta de lectura/escritura de la nota + panel inline en el detalle + auto-open del sheet con logros por encima.

**Tech Stack:** React 18 + TypeScript, Dexie, Zustand, vitest, Playwright (Python) para e2e.

**Spec:** `docs/superpowers/specs/2026-10-08-unificacion-nota-sesion-design.md` (leerla ANTES de empezar; este plan la implementa).

## Global Constraints

- **cwd de trabajo:** `.worktrees/f84/gymlab-app` (worktree aislado). Todo corre ahí: tests, build, e2e.
- **TDD obligatorio** en dominio y migración: test que falla primero (rojo) → implementación mínima → verde.
- **NO hacer `git add` ni `git commit`**: el ciclo de review del repo corre ANTES del commit y lo coordina el orquestador. El ejecutor deja el workspace listo y reporta.
- **`npm run build` es el typecheck real** (`tsc -b` vía project references). NUNCA usar `npx tsc --noEmit` como evidencia (da falso verde).
- **i18n es/en** en ambos idiomas para toda clave nueva.
- **Copy de UI en español (es-ES)**; código/comentarios breves en el estilo del repo (comentario corto del «por qué» en lógica no obvia).
- Touch targets ≥ 44 px; sin scrollbars visibles; `prefers-reduced-motion` donde aplique.
- Comandos de test por tarea: `npx vitest run <archivo>`. Al cerrar cada candidato: `npm test` + `npm run build`.
- e2e: `python tests/e2e/scripts/with_server.py tests/e2e/<test>.py` (desde `gymlab-app`).

## File Structure

**Crear:**
- `src/domain/sessionNotes.ts` — `mergeSessionNotes` (puro).
- `src/data/sessionNoteMigration.ts` — `migrateJournalNotesToWorkouts(tx)`.
- `src/hooks/useWorkoutNote.ts` — `{ note, save }` sobre `workoutRepo`.
- `src/components/workout/WorkoutNotePanel.tsx` — panel editable de la nota.
- `tests/unit/domain/sessionNotes.test.ts`
- `tests/unit/data/sessionNoteMigration.test.ts`

**Modificar:**
- `src/data/repositories/dexie/db.ts` — v15 + upgrade.
- `src/data/backup.ts` — normalización en `importBackup`.
- `tests/unit/data/backup.test.ts` — doble de `tx` + test de normalización.
- `src/domain/types.ts` — `SessionJournalEntry` sin `note`.
- `src/data/repositories/types.ts` — `upsert` sin `note`.
- `src/data/repositories/dexie/sessionJournalRepo.ts` — sin `note`.
- `src/hooks/useSessionJournal.ts` — `save` sin `note`.
- `src/components/journal/SessionJournalSheet.tsx` — nota vía `useWorkoutNote`.
- `src/components/journal/SessionJournalSummary.tsx` — sin nota.
- `src/components/workout/WorkoutDetail.tsx` — monta `WorkoutNotePanel`.
- `src/components/workout/SessionSummaryView.tsx` — auto-open del sheet.
- `src/components/achievements/AchievementModal.tsx` — `z-[130]`.
- `src/i18n/locales/es/workout.ts` + `src/i18n/locales/en/workout.ts` — claves nuevas.
- `tests/e2e/test_f98_notes.py` — flujo completo ampliado.
- `tests/e2e/test_f105.py` + `tests/e2e/test_f95.py` — descartar el sheet restaurado.
- `CHANGELOG.md` — entrada.

---

## Task 1: `mergeSessionNotes` (dominio puro, TDD)

**Files:**
- Create: `src/domain/sessionNotes.ts`
- Test: `tests/unit/domain/sessionNotes.test.ts`

**Interfaces:**
- Produces: `mergeSessionNotes(sessionNote: string, journalNote?: string): string`

- [ ] **Step 1: Escribir el test que falla**

```ts
// tests/unit/domain/sessionNotes.test.ts
import { describe, expect, it } from 'vitest'
import { mergeSessionNotes } from '@/domain/sessionNotes'

describe('mergeSessionNotes (F84)', () => {
  it('sin nota de journal devuelve la de sesión', () => {
    expect(mergeSessionNotes('durante', undefined)).toBe('durante')
    expect(mergeSessionNotes('durante', '')).toBe('durante')
  })

  it('sin nota de sesión devuelve la del journal', () => {
    expect(mergeSessionNotes('', 'después')).toBe('después')
  })

  it('textos iguales quedan una sola vez', () => {
    expect(mergeSessionNotes('igual', 'igual')).toBe('igual')
  })

  it('textos distintos se unen con línea en blanco (sesión primero)', () => {
    expect(mergeSessionNotes('durante', 'después')).toBe('durante\n\ndespués')
  })

  it('trim de ambas entradas; ambas vacías → cadena vacía', () => {
    expect(mergeSessionNotes('  durante  ', ' después ')).toBe('durante\n\ndespués')
    expect(mergeSessionNotes('   ', undefined)).toBe('')
  })
})
```

- [ ] **Step 2: Correr el test y verlo fallar**

Run: `npx vitest run tests/unit/domain/sessionNotes.test.ts`
Expected: FAIL — no existe `@/domain/sessionNotes`.

- [ ] **Step 3: Implementación mínima**

```ts
// src/domain/sessionNotes.ts
// Unificación de la nota de sesión (F84): la nota vive solo en Workout.notes.
// Une la escrita durante la sesión con la del journal post-entreno.

// Sin journal → sesión; sin sesión → journal; iguales → una; distintas →
// sesión + línea en blanco + journal. Trim de entradas; vacíos se descartan.
export const mergeSessionNotes = (sessionNote: string, journalNote?: string): string => {
  const session = sessionNote.trim()
  const journal = (journalNote ?? '').trim()
  if (!journal) return session
  if (!session) return journal
  if (session === journal) return session
  return `${session}\n\n${journal}`
}
```

- [ ] **Step 4: Correr el test y verlo pasar**

Run: `npx vitest run tests/unit/domain/sessionNotes.test.ts`
Expected: PASS (5 tests).

---

## Task 2: `migrateJournalNotesToWorkouts` (TDD con doble de `tx`)

**Files:**
- Create: `src/data/sessionNoteMigration.ts`
- Test: `tests/unit/data/sessionNoteMigration.test.ts`

**Interfaces:**
- Consumes: `mergeSessionNotes` (Task 1).
- Produces: `migrateJournalNotesToWorkouts(tx: Transaction): Promise<void>` — usado por db.ts (v15) y backup.ts.

- [ ] **Step 1: Escribir el test que falla**

```ts
// tests/unit/data/sessionNoteMigration.test.ts
import { describe, expect, it } from 'vitest'
import type { Transaction } from 'dexie'
import { migrateJournalNotesToWorkouts } from '@/data/sessionNoteMigration'

interface RecordedUpdate {
  table: string
  id: number
  changes: Record<string, unknown>
}

const makeTx = (
  journals: Array<Record<string, unknown>>,
  workouts: Array<Record<string, unknown>>,
) => {
  const updates: RecordedUpdate[] = []
  const tx = {
    table: (name: string) => ({
      toArray: async () => (name === 'sessionJournals' ? journals : workouts),
      get: async (id: number) => workouts.find((w) => w.id === id),
      update: async (id: number, changes: Record<string, unknown>) => {
        updates.push({ table: name, id, changes })
        return 1
      },
    }),
  }
  return { updates, tx: tx as unknown as Transaction }
}

describe('migrateJournalNotesToWorkouts (F84)', () => {
  it('copia la nota del journal al workout vacío y limpia el campo viejo', async () => {
    const { updates, tx } = makeTx(
      [{ id: 1, workoutId: 10, note: 'nota journal' }],
      [{ id: 10, notes: '' }],
    )
    await migrateJournalNotesToWorkouts(tx)
    expect(updates).toStrictEqual([
      { table: 'workouts', id: 10, changes: { notes: 'nota journal' } },
      { table: 'sessionJournals', id: 1, changes: { note: undefined } },
    ])
  })

  it('une ambas notas cuando existen (sesión primero)', async () => {
    const { updates, tx } = makeTx(
      [{ id: 1, workoutId: 10, note: 'después' }],
      [{ id: 10, notes: 'durante' }],
    )
    await migrateJournalNotesToWorkouts(tx)
    expect(updates[0]).toStrictEqual({
      table: 'workouts',
      id: 10,
      changes: { notes: 'durante\n\ndespués' },
    })
    expect(updates[1]).toStrictEqual({ table: 'sessionJournals', id: 1, changes: { note: undefined } })
  })

  it('journals sin nota no se tocan', async () => {
    const { updates, tx } = makeTx([{ id: 1, workoutId: 10 }], [{ id: 10, notes: 'x' }])
    await migrateJournalNotesToWorkouts(tx)
    expect(updates).toStrictEqual([])
  })

  it('journals huérfanos (sin workout) no se tocan', async () => {
    const { updates, tx } = makeTx([{ id: 1, workoutId: 99, note: 'huérfana' }], [])
    await migrateJournalNotesToWorkouts(tx)
    expect(updates).toStrictEqual([])
  })
})
```

- [ ] **Step 2: Correr el test y verlo fallar**

Run: `npx vitest run tests/unit/data/sessionNoteMigration.test.ts`
Expected: FAIL — no existe `@/data/sessionNoteMigration`.

- [ ] **Step 3: Implementación mínima**

```ts
// src/data/sessionNoteMigration.ts
// Migración de la nota de sesión (F84): mueve journal.note a workouts.notes y
// limpia el campo viejo (fuente única). Se usa en el upgrade v15 y en el import
// de backups previos.
import type { Transaction } from 'dexie'
import { mergeSessionNotes } from '@/domain/sessionNotes'

export const migrateJournalNotesToWorkouts = async (tx: Transaction): Promise<void> => {
  const journals = await tx.table('sessionJournals').toArray()
  for (const journal of journals) {
    const journalNote = typeof journal.note === 'string' ? journal.note.trim() : ''
    if (!journalNote) continue
    const workout = await tx.table('workouts').get(journal.workoutId)
    // Huérfano (workout borrado): no hay dónde unificar; no se toca.
    if (!workout) continue
    await tx.table('workouts').update(journal.workoutId, {
      notes: mergeSessionNotes(workout.notes ?? '', journalNote),
    })
    await tx.table('sessionJournals').update(journal.id, { note: undefined })
  }
}
```

- [ ] **Step 4: Correr el test y verlo pasar**

Run: `npx vitest run tests/unit/data/sessionNoteMigration.test.ts`
Expected: PASS (4 tests).

---

## Task 3: Dexie v15 + upgrade

**Files:**
- Modify: `src/data/repositories/dexie/db.ts` (import + bloque v15 antes de `export { db }`)

**Interfaces:**
- Consumes: `migrateJournalNotesToWorkouts` (Task 2).

- [ ] **Step 1: Añadir el import**

Después del bloque de `import type { ... } from '@/domain/types'`:

```ts
import { migrateJournalNotesToWorkouts } from '@/data/sessionNoteMigration'
```

- [ ] **Step 2: Añadir la versión 15 (misma lista de tablas que v14, sin cambios de schema)**

Insertar entre el bloque `db.version(14)` (termina en `})` de la línea ~444) y `export { db }`:

```ts
// v15: unifica la nota de sesión en workouts.notes (F84): mueve la nota del
// journal al workout y limpia el campo viejo (fuente única).
db.version(15)
  .stores({
    exercises: 'id, slug, muscleGroup',
    routines: 'id, slug, objective, level',
    routineDays: 'id, routineId',
    routineItems: 'id, routineDayId, exerciseId',
    workouts: 'id, startedAt, routineId, localDate',
    workoutSets: 'id, workoutId, exerciseId',
    papers: 'id, slug, topic',
    guides: 'id, slug, category',
    profile: 'id',
    activeProgram: 'id, routineId',
    prs: 'exerciseId, date',
    meta: 'key',
    socialProfiles: 'id, handle',
    posts: 'id, authorId, createdAt, type',
    postMedia: 'id',
    bodyWeight: 'id, localDate',
    dailySteps: 'id, &localDate',
    exerciseNotes: 'exerciseId',
    bodyMeasurements: 'id, localDate',
    skinfolds: 'id, localDate',
    sessionJournals: 'id, workoutId',
    benchmarkResults: 'id, exercise, testedAt',
    foods: 'id, name, category',
    mealEntries: 'id, localDate, mealType',
    supplements: 'id, name, active',
    progressPhotos: 'id, localDate',
    workoutTemplates: 'id, category',
    periodizationPlans: 'id, isActive, createdAt',
  })
  .upgrade(async (tx) => {
    await migrateJournalNotesToWorkouts(tx)
  })
```

- [ ] **Step 3: Verificar typecheck**

Run: `npm run build`
Expected: exit 0 (el upgrade compila; la migración corre al abrir la DB en runtime).

---

## Task 4: Normalización en `importBackup` + tests de backup

**Files:**
- Modify: `src/data/backup.ts`
- Modify: `tests/unit/data/backup.test.ts`

**Interfaces:**
- Consumes: `migrateJournalNotesToWorkouts` (Task 2).

- [ ] **Step 1: Actualizar el doble de la DB en `backup.test.ts` (rojo primero)**

En el `dbMock` (líneas 7-28): añadir `updates` al state, `get`/`update` al table, `clear`/`bulkAdd` espejando `rows`, y pasar `db` al scope de la transacción:

```ts
const dbMock = vi.hoisted(() => {
  const state = {
    rows: {} as Record<string, unknown[]>,
    cleared: [] as string[],
    added: {} as Record<string, unknown[]>,
    updates: [] as Array<{ table: string; id: number; changes: Record<string, unknown> }>,
  }
  const db = {
    table: (name: string) => ({
      toArray: async () => state.rows[name] ?? [],
      get: async (id: number) => (state.rows[name] ?? []).find((r) => (r as { id: number }).id === id),
      update: async (id: number, changes: Record<string, unknown>) => {
        state.updates.push({ table: name, id, changes })
      },
      clear: async () => {
        state.cleared.push(name)
        state.rows[name] = []
      },
      bulkAdd: async (rows: unknown[]) => {
        state.added[name] = rows
        state.rows[name] = rows
      },
    }),
    transaction: async (
      _mode: string,
      _tables: unknown,
      scope: (tx: unknown) => Promise<void>,
    ) => scope(db),
  }
  return { state, db }
})
```

Y en `beforeEach`: `dbMock.state.updates = []`.

- [ ] **Step 2: Añadir el test de normalización**

```ts
  it('importBackup normaliza notas de journal de backups viejos (F84)', async () => {
    await importBackup(
      backupWith({
        workouts: [{ id: 1, notes: 'durante' }],
        sessionJournals: [{ id: 5, workoutId: 1, note: 'después', energy: 3 }],
      }),
    )
    expect(dbMock.state.updates).toStrictEqual([
      { table: 'workouts', id: 1, changes: { notes: 'durante\n\ndespués' } },
      { table: 'sessionJournals', id: 5, changes: { note: undefined } },
    ])
  })
```

- [ ] **Step 3: Correr y ver el test nuevo fallar**

Run: `npx vitest run tests/unit/data/backup.test.ts`
Expected: FAIL — `importBackup` todavía no normaliza (no hay updates).

- [ ] **Step 4: Implementar en `backup.ts`**

Añadir el import junto a los existentes:

```ts
import { migrateJournalNotesToWorkouts } from './sessionNoteMigration'
```

Reemplazar `importBackup` (líneas 113-125):

```ts
// Restaura el backup: limpia y rellena cada tabla en una única transacción atómica.
export const importBackup = async (backup: BackupFile): Promise<number> => {
  let imported = 0
  await db.transaction('rw', ALL_TABLES, async (tx) => {
    for (const name of ALL_TABLES) {
      const rows = backup.tables[name] ?? []
      if (rows.length === 0) continue
      await db.table(name).clear()
      await db.table(name).bulkAdd(rows as never[])
      imported += rows.length
    }
    // F84: un backup previo a la unificación puede traer notas de journal;
    // se mueven a workouts.notes y se limpia el campo viejo.
    await migrateJournalNotesToWorkouts(tx)
  })
  return imported
}
```

- [ ] **Step 5: Correr los tests de backup y verlos pasar**

Run: `npx vitest run tests/unit/data/backup.test.ts`
Expected: PASS (6 tests, incluido el nuevo).

---

## Task 5: Retiro de `note` del journal (tipos + repo + hook)

**Files:**
- Modify: `src/domain/types.ts` (línea ~187: quitar `note?: string` de `SessionJournalEntry`)
- Modify: `src/data/repositories/types.ts` (línea ~229: quitar `note?: string` del `upsert`)
- Modify: `src/data/repositories/dexie/sessionJournalRepo.ts` (líneas 24 y 37: quitar `note: entry.note,`)
- Modify: `src/hooks/useSessionJournal.ts` (línea ~20: quitar `note?: string` de la firma de `save`)

**Nota:** el build queda roto hasta terminar Task 6 (el sheet usa `entry.note`). Hacer 5 y 6 y recién ahí correr build.

- [ ] **Step 1: Quitar el campo en los 4 archivos**

`types.ts`:
```ts
export interface SessionJournalEntry {
  id: number
  workoutId: number
  energy: 1 | 2 | 3 | 4 | 5
  sleep: 1 | 2 | 3 | 4 | 5
  mood: 1 | 2 | 3 | 4 | 5
  soreness: 1 | 2 | 3 | 4 | 5
  createdAt: string
}
```

`repositories/types.ts` — `upsert` queda:
```ts
  upsert(entry: {
    workoutId: number
    energy: 1 | 2 | 3 | 4 | 5
    sleep: 1 | 2 | 3 | 4 | 5
    mood: 1 | 2 | 3 | 4 | 5
    soreness: 1 | 2 | 3 | 4 | 5
  }): Promise<number>
```

`sessionJournalRepo.ts` — quitar `note: entry.note,` de los dos sitios (update y row).

`useSessionJournal.ts` — `save` queda:
```ts
    async (data: {
      energy: 1 | 2 | 3 | 4 | 5
      sleep: 1 | 2 | 3 | 4 | 5
      mood: 1 | 2 | 3 | 4 | 5
      soreness: 1 | 2 | 3 | 4 | 5
    }) => {
```

---

## Task 6: `useWorkoutNote` + sheet edita `Workout.notes`

**Files:**
- Create: `src/hooks/useWorkoutNote.ts`
- Modify: `src/components/journal/SessionJournalSheet.tsx`

**Interfaces:**
- Produces: `useWorkoutNote(workoutId: number | null): { note: string; save: (value: string) => Promise<void> }`

- [ ] **Step 1: Crear el hook**

```ts
// src/hooks/useWorkoutNote.ts
// Nota de sesión unificada (F84): vive SOLO en Workout.notes. La leen el sheet
// post-entreno y el panel del detalle; el guardado pasa por workoutRepo.update.
import { useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { workoutRepo } from '@/data/repositories'

export const useWorkoutNote = (workoutId: number | null) => {
  const note = useLiveQuery(
    async () => {
      if (!workoutId) return ''
      const workout = await workoutRepo.getById(workoutId)
      return workout?.notes ?? ''
    },
    [workoutId],
    ''
  )

  const save = useCallback(
    async (value: string) => {
      if (!workoutId) return
      await workoutRepo.update(workoutId, { notes: value.trim() })
    },
    [workoutId]
  )

  return { note: note ?? '', save }
}
```

- [ ] **Step 2: Editar el sheet**

En `SessionJournalSheet.tsx`:
1. Import: `import { useWorkoutNote } from '@/hooks/useWorkoutNote'`.
2. Tras `const { entry, save } = useSessionJournal(workoutId)`:
```ts
  const { note: savedNote, save: saveNote } = useWorkoutNote(workoutId)
```
3. En el efecto de precarga (líneas 62-71): quitar `setNote(entry.note ?? '')` (los ratings se quedan).
4. Añadir efecto de sincronización de la nota:
```ts
  // La nota es la del workout (fuente única, F84): se precarga lo escrito en
  // la sesión y se puede seguir escribiendo acá.
  useEffect(() => {
    setNote(savedNote)
  }, [savedNote])
```
5. `handleSave` queda:
```ts
  const handleSave = async () => {
    setSaving(true)
    await save({ energy, sleep, mood, soreness })
    await saveNote(note)
    setSaving(false)
    onClose()
  }
```
(El label/placeholder del campo se mantienen: `journal.nota` / `journal.notaPlaceholder`.)

- [ ] **Step 3: Typecheck + suite**

Run: `npm run build; if ($?) { npm test }`
Expected: build exit 0; suite completa verde (el campo retirado ya no tiene referencias).

---

## Task 7: `SessionJournalSummary` sin nota

**Files:**
- Modify: `src/components/journal/SessionJournalSummary.tsx` (quitar líneas 46-48)

- [ ] **Step 1: Quitar el bloque de nota**

Eliminar:
```tsx
      {entry.note && (
        <p className="mt-3 text-xs leading-relaxed text-muted">{entry.note}</p>
      )}
```

El componente queda con los 4 `RatingPill` y el título. La nota se ve (una sola vez) en el panel del detalle (Task 8).

- [ ] **Step 2: Verificar**

Run: `npx vitest run tests/unit/data/backup.test.ts tests/unit/domain/sessionNotes.test.ts tests/unit/data/sessionNoteMigration.test.ts`
Expected: PASS.

---

## Task 8: `WorkoutNotePanel` + edición inline en el detalle

**Files:**
- Create: `src/components/workout/WorkoutNotePanel.tsx`
- Modify: `src/components/workout/WorkoutDetail.tsx` (reemplazar el bloque de nota de las líneas 145-150)

**Interfaces:**
- Consumes: `useWorkoutNote` (Task 6).
- Produces: `WorkoutNotePanel({ workoutId }: { workoutId: number })`.

- [ ] **Step 1: Crear el componente**

```tsx
// src/components/workout/WorkoutNotePanel.tsx
// Panel editable de la nota de sesión (F84): única fuente Workout.notes.
// Se muestra siempre: con texto, en edición o con la acción de añadir.
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pencil } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useWorkoutNote } from '@/hooks/useWorkoutNote'

type Props = { workoutId: number }

export const WorkoutNotePanel = ({ workoutId }: Props) => {
  const { t } = useTranslation()
  const { note, save } = useWorkoutNote(workoutId)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)

  const startEdit = () => {
    setDraft(note)
    setEditing(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await save(draft)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="panel-light rounded-2xl p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="kicker">{t('session.notaTitulo')}</p>
        {!editing && (
          <button
            type="button"
            onClick={startEdit}
            aria-label={note ? t('session.notaEditar') : t('session.notaAnadir')}
            className="relative flex size-11 items-center justify-center rounded-xl text-accent after:absolute after:-inset-1 after:content-['']"
          >
            <Pencil className="size-4" aria-hidden />
          </button>
        )}
      </div>
      {editing ? (
        <div className="mt-1.5 space-y-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t('session.notaPlaceholder')}
            aria-label={t('session.notaAria')}
            rows={3}
            className="w-full resize-none rounded-xl border border-border bg-bg-elevated px-3 py-2 text-sm text-fg placeholder:text-muted focus:border-cta focus:outline-none"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={() => void handleSave()} disabled={saving}>
              {t('session.notaGuardar')}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setEditing(false)} disabled={saving}>
              {t('session.notaCancelar')}
            </Button>
          </div>
        </div>
      ) : note ? (
        <p className="mt-2 text-sm leading-relaxed text-fg">{note}</p>
      ) : (
        <p className="mt-2 text-sm text-muted">{t('session.notaVacia')}</p>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Montarlo en `WorkoutDetail.tsx`**

Añadir import: `import { WorkoutNotePanel } from '@/components/workout/WorkoutNotePanel'`.

Reemplazar el bloque condicional (líneas 145-150):
```tsx
        {workout.notes && (
          <div className="panel-light rounded-2xl p-4">
            <p className="kicker">{t('session.notaTitulo')}</p>
            <p className="text-sm leading-relaxed text-fg">{workout.notes}</p>
          </div>
        )}
```
por:
```tsx
        <WorkoutNotePanel workoutId={workoutId} />
```

- [ ] **Step 3: Typecheck**

Run: `npm run build`
Expected: exit 0.

---

## Task 9: Restaurar el auto-open del sheet + logros por encima

**Files:**
- Modify: `src/components/workout/SessionSummaryView.tsx` (línea 81)
- Modify: `src/components/achievements/AchievementModal.tsx` (línea 104)

- [ ] **Step 1: Auto-open (fix regresión F86)**

En `SessionSummaryView.tsx`:
```ts
  // Auto-open restaurado (F84/F86): el resumen solo se monta tras finalizar; el
  // sheet aparece con la nota pre-cargada. El modal de logros se muestra por
  // encima (z-[130] en AchievementModal) y al cerrarlo queda este sheet.
  const [showJournal, setShowJournal] = useState(true)
```

- [ ] **Step 2: Logros por encima del sheet**

En `AchievementModal.tsx`, línea 104:
```tsx
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
```
(antes `z-50`; queda > sheet `z-[120]` y < tour `z-[140]`).

- [ ] **Step 3: Typecheck + suite**

Run: `npm run build; if ($?) { npm test }`
Expected: build exit 0; suite verde.

---

## Task 10: Claves i18n nuevas (es/en)

**Files:**
- Modify: `src/i18n/locales/es/workout.ts` (tras `notaAria`, línea 98)
- Modify: `src/i18n/locales/en/workout.ts` (tras `notaAria`, línea 98)

- [ ] **Step 1: Añadir las claves**

es:
```ts
    notaEditar: 'Editar nota',
    notaAnadir: 'Añadir nota',
    notaGuardar: 'Guardar',
    notaCancelar: 'Cancelar',
    notaVacia: 'Sin nota de la sesión',
```

en:
```ts
    notaEditar: 'Edit note',
    notaAnadir: 'Add note',
    notaGuardar: 'Save',
    notaCancelar: 'Cancel',
    notaVacia: 'No session note',
```

- [ ] **Step 2: Verificar que ambas compilan**

Run: `npm run build`
Expected: exit 0.

---

## Task 11: e2e — flujo ampliado y regresiones

**Files:**
- Modify: `tests/e2e/test_f98_notes.py`
- Modify: `tests/e2e/test_f105.py`
- Modify: `tests/e2e/test_f95.py`

**Contexto:** con el auto-open restaurado, tras finalizar se abre el sheet (`role="dialog"` con `aria-label="Bitácora"`). Si además hay logros, el modal de logros (`role="dialog"` con `aria-labelledby="achievement-modal-title"`) queda POR ENCIMA y debe cerrarse primero. Cualquier click en el resumen necesita el sheet descartado.

- [ ] **Step 1: Helpers en `test_f98_notes.py`**

Añadir tras `latest_workout_id`:

```python
def close_achievements(page):
    """Cierra la cola de logros (F95.1) si quedó abierta tras finalizar."""
    for _ in range(8):
        dialog = page.locator('[role="dialog"][aria-labelledby="achievement-modal-title"]')
        if dialog.count() == 0:
            break
        dialog.first.locator("button").first.click()
        page.wait_for_timeout(500)


def dismiss_journal_sheet(page):
    """F84: el sheet de bitácora se auto-abre tras finalizar; se descarta."""
    sheet = page.locator('[role="dialog"][aria-label="Bitácora"]')
    if sheet.count() > 0:
        sheet.first.locator("button", has_text="Omitir").click()
        page.wait_for_timeout(400)
```

- [ ] **Step 2: Ampliar el flujo de `test_f98_notes.py`**

Tras `page.locator("button", has_text="Finalizar entreno").first.click()` + `wait_for_timeout(2000)`, insertar antes de `workout_id = latest_workout_id(page)`:

```python
            # F84: logros primero; después el sheet auto-abierto con la nota
            # de la sesión pre-cargada.
            close_achievements(page)
            sheet = page.locator('[role="dialog"][aria-label="Bitácora"]')
            if sheet.count() == 0:
                errors.append("nota: el sheet de bitácora no se auto-abrió tras finalizar")
            else:
                prefill = page.input_value("#journal-note")
                if prefill != second:
                    errors.append(f"nota: el sheet no pre-cargó la nota de la sesión ({prefill!r})")

                # Se completa la nota desde el post-entreno y se guarda.
                extended = second + "\n\nSeguí anotando después del entreno"
                page.fill("#journal-note", extended)
                page.locator("button", has_text="Guardar bitácora").first.click()
                page.wait_for_timeout(600)
```

Y en el bloque del detalle, reemplazar el assert de `second` por `extended` + edición inline:

```python
            workout_id = latest_workout_id(page)
            if workout_id < 1:
                errors.append(f"nota: no se creó el workout al finalizar (id={workout_id})")
            else:
                page.goto(f"{BASE}/entrenamiento/{workout_id}", wait_until="networkidle")
                page.wait_for_timeout(1200)
                if extended not in page.locator("body").inner_text():
                    errors.append("nota: el detalle no muestra la nota unificada")
                # F84: edición inline desde el detalle.
                page.locator('button[aria-label="Editar nota"]').first.click()
                page.wait_for_timeout(300)
                edited = extended + " (editada)"
                page.fill('textarea[aria-label="Nota libre de la sesión"]', edited)
                page.locator("button", has_text="Guardar").first.click()
                page.wait_for_timeout(600)
                if edited not in page.locator("body").inner_text():
                    errors.append("nota: la edición inline no persistió en el detalle")
```

- [ ] **Step 3: Actualizar `test_f105.py`**

1. Acotar `close_achievements` (líneas 64-74) al modal de logros (evita que agarre el sheet como primer diálogo):

```python
def close_achievements(page):
    """Cierra la cola de logros del guardado (F95.1): el botón primario avanza
    un ítem por pantalla y cierra al final. Quitar el nodo a mano no sirve:
    React lo re-renderiza con el estado del hook."""
    for _ in range(8):
        dialog = page.locator('[role="dialog"][aria-labelledby="achievement-modal-title"]')
        if dialog.count() == 0:
            return
        dialog.first.locator("button").first.click()
        page.wait_for_timeout(500)
    page.wait_for_timeout(300)


def dismiss_journal_sheet(page):
    """F84: el sheet de bitácora se auto-abre tras finalizar; se descarta para
    poder medir/interactuar con el resumen."""
    sheet = page.locator('[role="dialog"][aria-label="Bitácora"]')
    if sheet.count() > 0:
        sheet.first.locator("button", has_text="Omitir").click()
        page.wait_for_timeout(400)
```

2. Tras el `close_achievements(page)` que sigue a la finalización, añadir `dismiss_journal_sheet(page)` antes de medir/interactuar.

- [ ] **Step 4: Actualizar `test_f95.py`**

Tras finalizar y `wait_for_selector("[data-photo-pr]")`: añadir los mismos helpers (`close_achievements` acotado + `dismiss_journal_sheet`) y llamarlos antes de cualquier click sobre el resumen. Si el loop de diálogos existente (línea ~385) quedó ambiguo con dos diálogos, acotarlo al de logros o al sheet según corresponda.

- [ ] **Step 5: Correr los e2e**

Run (uno por uno, desde `gymlab-app`):
```
python tests/e2e/scripts/with_server.py tests/e2e/test_f98_notes.py
python tests/e2e/scripts/with_server.py tests/e2e/test_f105.py
python tests/e2e/scripts/with_server.py tests/e2e/test_f95.py
```
Expected: ALL OK en los tres. Si `test_f113_carrusel.py` o `test_f93_t22_quick.py` fallan por el sheet (no finalizan sesión, probablemente no afectados), aplicarles el mismo patrón.

---

## Task 12: Docs

**Files:**
- Modify: `CHANGELOG.md` (bajo `[Unreleased]`)

- [ ] **Step 1: Entrada del changelog**

Añadir en `Fixed`/`Changed` (español, concreto):

```md
- **Nota de sesión unificada en un solo campo (F84, `fix`/`refactor`)**: la nota escrita durante el entreno y la del journal post-entreno eran dos campos distintos visibles a la vez en el detalle. Ahora viven solo en `Workout.notes`: la del sheet se precarga con lo escrito en la sesión (se puede seguir escribiendo), el detalle la edita en línea y la migración Dexie v15 mueve y limpia las notas viejas del journal (restore de backups incluido). Además se **restaura el sheet de bitácora post-entreno** (se auto-abre al finalizar; regresión del refactor F86) con el modal de logros por encima (`z-[130]`).
```

---

## Review y commits (lo maneja el orquestador — NO el ejecutor)

- **Candidato 1** (review antes de commit): Tasks 1-7 (contrato de datos + migración + consumidores juntos, regla del repo). Commits: `feat: migra la nota del journal a Workout.notes (v15) y la limpia` (Tasks 1-4) + `refactor: la nota de sesión usa Workout.notes en sheet y resumen` (Tasks 5-7).
- **Candidato 2**: Tasks 8-11. Commits: `feat: edición inline de la nota de sesión en el detalle` (8, 10) + `fix: restaura el auto-open del sheet de bitácora y ordena los modales (F86)` (9, 11).
- **Docs**: Task 12 (pasivo, sin review).
- Verificación por candidato antes del review: `npm test` + `npm run build`; e2e al cerrar el candidato 2.
