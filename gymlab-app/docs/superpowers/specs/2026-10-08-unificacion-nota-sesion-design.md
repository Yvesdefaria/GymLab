# Unificación de la nota de sesión (diseño)

**Fecha:** 2026-10-08 · **Worktree/rama:** `f84` · **Origen:** cierre de F84 (grill de diseño, 2026-10-08)

## Contexto

Hoy la misma sesión puede tener DOS notas de texto libre, escritas en dos momentos y guardadas en dos sitios:

- `Workout.notes` — se escribe **durante** la sesión activa (`SessionHeaderNote`, F98.1), se persiste al finalizar (`useFinishWorkout` → `saveWorkoutSession`) y se muestra en el detalle (`WorkoutDetail.tsx:145-148`).
- `SessionJournalEntry.note` — se escribe **post-entreno** en el sheet "Bitácora" (`SessionJournalSheet`) y se muestra en `SessionJournalSummary.tsx:46-47`, dentro del mismo detalle.

Resultado: en `WorkoutDetail` pueden aparecer dos bloques de nota distintos para la misma sesión (duplicación visible), y el mismo concepto vive en dos campos.

Decisión del usuario (grill, 2026-10-08): el contenido debe ser **el mismo** durante y después; **la UI lo lee de un solo lado**; un único hogar en almacenamiento.

## Decisiones aprobadas

1. **Campo canónico: `Workout.notes`.** `SessionJournalEntry.note` se retira del tipo y deja de escribirse/leerse. Los ratings (energía/sueño/ánimo/dolor) quedan intactos en el journal.
2. **Durante la sesión no cambia la UX:** `SessionHeaderNote` escribe el store activo y al finalizar se persiste en `Workout.notes` (flujo F98.1 actual, sin tocar).
3. **Post-entreno (sheet):** el campo de nota del sheet pasa a leer y editar `Workout.notes` (mismo texto que la cabecera). Al abrir el sheet tras terminar, la nota escrita **durante** aparece pre-cargada y se puede seguir escribiendo (mismo campo, se completa el texto). El guardado actualiza el workout con `workoutRepo.update` junto al upsert del journal (sin nota).
4. **Edición desde el detalle (nuevo):** en `WorkoutDetail` el bloque de nota es editable en línea: texto + botón editar → textarea + Guardar/Cancelar. Si la nota está vacía, el panel se muestra igual con el estado vacío y la acción "Añadir nota" (descubribilidad).
5. **Display único:** `SessionJournalSummary` deja de pintar la nota; `WorkoutDetail` la muestra una sola vez.
6. **Migración Dexie v15 (atómica, dentro del upgrade):** por cada journal con nota:
   - si el workout tiene `notes` vacío → se copia la del journal;
   - si ambas existen y son distintas → se unen (`nota de sesión` + línea en blanco + `nota del journal`);
   - si son iguales → queda una sola;
   - luego se limpia `journal.note` (el texto vive en un único sitio).
   - **Journals huérfanos**: en uso normal no existen (borrar un workout borra su journal — `workoutDeletion.ts:45`); si aparecen por datos corruptos o importados, no se tocan — no hay dónde unificar y ninguna UI los lee.
7. **Restore de backups previos:** `importBackup` aplica la misma normalización (misma función pura) dentro de su transacción, para que un backup viejo no reintroduzca notas en el journal.
8. **i18n es/en:** el sheet reutiliza las claves `session.notaTitulo` / `session.notaPlaceholder` / `session.notaAria` para su campo de nota; claves nuevas para la edición inline del detalle; se retiran `journal.nota` y `journal.notaPlaceholder`.

## Contratos

- `src/domain/sessionNotes.ts` (nuevo, puro):
  `mergeSessionNotes(sessionNote: string, journalNote?: string): string` — sin journal → session; sin session → journal; iguales → una; distintas → `session + '\n\n' + journal`. Trim de entradas; vacíos se descartan.
- Migración: `db.version(15).stores({ …misma lista de tablas… }).upgrade(tx => …)`, siguiendo el patrón de `db.ts:100` (upgrade v2). Itera `sessionJournals`, resuelve el workout, aplica `mergeSessionNotes` y limpia la nota del journal. Si algo falla, la transacción del upgrade hace rollback total.
- `workoutRepo.update(id, { notes })` para persistir ediciones (ya existe, `workoutRepo.ts:22`).
- Lectura del sheet: `useWorkout(workoutId)` (existente) o hook chico derivado para leer `workout.notes`; el detalle ya lo tiene.
- `useSessionJournal.save()` pierde `note` de su firma (solo ratings).
- `sessionJournalRepo.upsert` deja de leer/escribir `note`.

## Paquetes de trabajo (un commit cada uno)

- **WP1 — Dominio + migración:** `mergeSessionNotes` con TDD (casos: sin journal / sin sesión / iguales / distintas con trim / ambas vacías); `db.version(15)` con el upgrade (la lógica se extrae para testearla con un doble de `tx`, patrón `vi.mock` de `tests/unit/data`); normalización en `importBackup` reutilizando la misma función.
- **WP2 — Retiro del campo viejo:** quitar `note` de `SessionJournalEntry` (tipo), `sessionJournalRepo` y `useSessionJournal`; `SessionJournalSheet` edita `Workout.notes`; `SessionJournalSummary` sin nota; i18n (sheet con claves `session.*`, retiro de `journal.nota*`).
- **WP3 — Edición inline en el detalle:** UI en `WorkoutDetail` + claves i18n nuevas (editar/guardar/cancelar/vacía/añadir) + e2e: actualizar `test_f98_notes.py` y ampliar el flujo (escribir durante → terminar → editar desde el detalle → sheet muestra el mismo texto).
- **WP4 — Docs:** CHANGELOG.md; bookkeeping de PLAN.md si corresponde.

## Verificación

- `npm run build` (typecheck real vía `tsc -b`), `npm test` (suite completa), e2e `test_f98_notes.py` + regresiones F98 que toquen journal.
- Review de Gentle AI antes de commit (regla del repo; candidato = diff del workspace).

## Riesgos

- **Pérdida de datos al limpiar el campo viejo:** mitigado por la función pura testeada y la atomicidad del upgrade; la regla garantiza que el contenido sobrevive en `Workout.notes` (copia o unión). Los huérfanos no se limpian.
- **Backups viejos:** cubiertos por la normalización del import; un journal sin workout asociado se deja como está.
- **e2e frágil:** `test_f98_notes.py` depende del textarea del detalle y del sheet; se actualiza en el mismo candidato (contrato de datos y consumidores juntos).

## Fuera de alcance

- Notas por ejercicio (`ExerciseNote`) y notas de rutina (`RoutineItem.notes`).
- Ratings del journal y su resumen.
- Vista de día / bitácora diaria (descartada por obsoleta; ver PLAN).
- Widget nativo (subfase aparte: 84d).
