# Exploration: Fase 88 — Rutinas Predefinidas (clonar y editar rutinas predefinidas)

Explored on 2026-09-10 from gymlab-app source (fresh evidence). No source files modified.

## Current State

### Data model (Dexie)
- Tables (v1→v13, `src/data/repositories/dexie/db.ts`): `routines: 'id, slug, objective, level'`, `routineDays: 'id, routineId'`, `routineItems: 'id, routineDayId, exerciseId'`. No schema bump needed for a non-indexed field.
- Types (`src/domain/types.ts:46-76`): `Routine { id, slug, title, objective, level, description, daysCount, isCustom?, imageUrl? }`, `RoutineDay { id, routineId, dayIndex, name }`, `RoutineItem { id, routineDayId, exerciseId, targetSets, targetReps, restSec, order, supersetGroup?, notes? }`.
- **Differentiation predefined vs custom**: `isCustom?: boolean` — `routineRepo.createRoutine` writes `isCustom: true` (`routineRepo.ts:71`); seed rows never set it (falsy). Convention backup: custom ids `>= CUSTOM_ID_BASE` (10000, `routineRepo.ts:9`); seed ids 1 and 4–70. All UI slices on `isCustom` (`RutinasPage.tsx:35,39`, `RutinaDetailPage.tsx:122,151`).
- Repository contract (`src/data/repositories/types.ts:68-77`): getAll / getBySlug / getDays / getItems / createRoutine / updateRoutine / deleteRoutine / reorderItems. Draft types `RoutineDraft { slug, title, objective, level, description, days }`, `RoutineDayDraft { name, items[] }` with `order` 1-based. **No `basedOn`/`source` field exists anywhere.**
- `createRoutine` (`routineRepo.ts:60-76`): id = `max(10000, nextId+1)`; atomic tx; inserts days/items with sequential custom ids (`addDaysAndItems`, lines 16-40). `updateRoutine` (79-92) rebuilds days/items (delete + reinsert).

### Predefined routines
- Sole seed source: `src/data/seed/routines/` — `routines.ts` (68 rows, ids 1 + 4..70), `days.ts` (220 rows), `items.ts` (1050 rows). PLAN.md's "8 rutinas (F80)" is historical wording; the catalog grew to 68. The feature applies to **all** `!isCustom` routines.
- Seeding: `src/data/seed/reseeder.ts` `ensureSeeded()` — on `meta.seedVersion !== SEED_VERSION` ('20', `db.ts:415`) it clears seedable tables, bulkAdds seeds, then restores preserved custom routines (`preserveCustom` keeps `id >= CUSTOM_ID_BASE || isCustom`, line 16). **Clones survive reseeds.**

### Builder (RutinaBuilderPage + useRoutineDraft)
- Routes already registered (`src/app/router.tsx:67-68`, lazy): `rutinas/nueva` and `rutinas/:slug/editar` → `RutinaBuilderPage`.
- `src/hooks/useRoutineDraft.ts` — edit mode loads by slug **and rejects non-custom** (`if (!routine || !routine.isCustom) setNotFound(true)`, line 33; UI shows `rutinas.builder.soloPropias`). Its load loop (lines 42-61: getDays → getItems → resolve localized exercise names) is exactly the clone draft builder — candidates for extraction into a shared helper so clone-edit and edit-load share it.
- Days: add (`addDay`), remove (won't remove last), rename (`updateDayName`) — **no day reorder exists** (88.2 net-new). Items: add via `ExercisePicker`, remove, drag reorder (`useDragReorder` + `ExerciseItem` GripVertical) and target edit — already complete (88.3 mostly done, items-level).
- Save: `uniqueSlug(title, allSlugs, existing?.slug)` (`domain/routines.ts:45-52`; collisions → `-2` suffix) → `routineDraftFrom` (55-85) → `createRoutine`/`updateRoutine` → navigate `/rutinas/{finalSlug}`. Slug collision against the source seed slug is handled automatically.

### Detail page (RutinaDetailPage)
- `useRoutineDetail(slug)` → `routineRepo.getBySlug`. Edit/Delete block for custom only: lines 122-138 (`{routine.isCustom ? (...) : null}`). **This is the insertion point for "Editar esta rutina"** (a sibling branch for `!isCustom`).
- `routine.isCustom ?? false` feeds `RoutineDayPanel` empty-state edit link (line 151).

### Mis rutinas list (RutinasPage)
- `custom = routines.filter(r => r.isCustom ...)` (line 35). Custom cards get `badge={t('rutinas.propia')}` (line 111). `RoutineCard` renders **one** badge slot (`RoutineCard.tsx:58-73`: objective chip, then isActive/badge/sesionSuelta; badge wins over sesionSuelta). "Basada en …" reuses this prop (replaces "Propia" or composes text).

### Domain / i18n / tests
- `src/domain/routines.ts` — pure: TARGET_BOUNDS, slugify, reorderArray, uniqueSlug, routineDraftFrom. Clone mapping belongs here.
- i18n: es source of truth `src/i18n/locales/es/routines.ts` (typed `I18nKey`/EsSchema from `src/i18n/index.ts:13-21`); en mirror `src/i18n/locales/en/routines.ts` (identical shape). No `basadaEn` key yet; `propia`, `builder.*`, `detalle.editar` exist.
- `localizeRoutine` (EN) is keyed by **routine.slug** (`src/i18n/catalog/en.ts:125-130`), `localizeRoutineDay` by day.id. A clone's new slug has no EN entry → title stays ES in EN locale (same as all custom routines today). To localize the badge source title, resolve the source routine via id and `localizeRoutine(source)` (source slug IS in `ROUTINES_EN`).
- Tests: `tests/unit/domain/routines.test.ts` (slugify/labels), `tests/unit/domain/routineDraft.test.ts` (uniqueSlug, routineDraftFrom). No clone tests yet. E2E: Python Playwright via `python tests/e2e/scripts/with_server.py tests/e2e/test_f88.py` (pattern in `test_f45.py`, `test_t3.py` covers `/rutinas/:slug`).
- Verification conventions (openspec/config.yaml + gymlab-app/AGENTS.md): `npm test` (vitest) and `npm run build` (tsc -b && vite build, the real typecheck gate) from `gymlab-app/`; UI copy es-ES; i18n keys in both locales; components < ~80 lines; files < ~200 lines; no emojis as icons; commit per task without push.

## Affected Areas
- `src/pages/RutinaDetailPage.tsx` — add "Editar esta rutina" button + clone handler (lines 122-138 block).
- `src/hooks/useRoutineDraft.ts` — extract shared draft loader (lines 42-61), add `reorderDays` for 88.2.
- `src/domain/routines.ts` — new pure clone mapper (source Routine + days + items → RoutineDraft-ready payload).
- `src/domain/types.ts:46-57` — optional `basedOnId?: number` on `Routine` (badge provenance).
- `src/data/repositories/types.ts:58-65` — optional `basedOnId` in `RoutineDraft`; `routineRepo.ts:63-72` set it on create.
- `src/pages/RutinasPage.tsx:107-117` — badge for clones; resolve source title from already-live `routines` list.
- `src/hooks/useDragReorder.ts` / `RutinaBuilderPage.tsx` — day-level reorder (only real new editor mechanic).
- `src/i18n/locales/es/routines.ts` + `en/routines.ts` — new keys: `rutinas.detalle.editarPredefinida`, `rutinas.basadaEn` (+ possibly builder clone subtitle).
- Tests: `tests/unit/domain/routineClone.test.ts` (new), `tests/e2e/test_f88.py` (new).

## Approaches

1. **Clone-on-click, then edit route (recommended)** — Detail button builds the draft from the source (shared loader), `routineRepo.createRoutine(draft)` with `basedOnId`, navigates to `/rutinas/{newSlug}/editar`. Builder's existing edit-mode loads the clone and "Guardar cambios" updates it. Original seed row untouched.
   - Pros: matches PLAN 88.1 wording; zero new routes; 88.4/88.6 satisfied by existing createRoutine + optional field; reseed-safe (isCustom:true, id ≥ 10000); badge provenance via basedOnId.
   - Cons: clone created on click — abandoning the editor leaves a default-named clone (acceptable: same as "Nueva rutina" abandonment). One extra DB write before editing.
   - Effort: Low–Medium

2. **Clone in builder via route state** — `navigate('/rutinas/nueva', { state: { cloneFrom: slug } })`; draft seeded from source; `createRoutine` only on save.
   - Pros: no orphan clones; single write; name editable before persistence.
   - Cons: route-state plumbing; diverges from "clonar … y abrir el editor" wording; create-mode UI (title "Nueva rutina") mismatches clone semantics; more surface.
   - Effort: Medium

3. **Relax the builder gate for any routine** — let `/rutinas/:slug/editar` load seed routines directly with an "edit = clone on save" flag.
   - Pros: smallest diff on paper.
   - Cons: mutates edit semantics (seed routine must never be updatable in place); risk of accidental writes to seed ids; `updateRoutine` on a seed id would corrupt the catalog. Rejected.
   - Effort: Medium (high risk)

## Recommendation

Approach 1. Concretely:
- **Clone mechanics**: new pure function in `domain/routines.ts` (e.g. `cloneRoutineDraft(source, days, items): RoutineDraft`-shaped payload) whose only re-assignments are: routine **id** (auto `≥ 10000` by `createRoutine`), **slug** (`uniqueSlug` → `-2` suffix when title matches source), **basedOnId** = source id; days/items get fresh ids (auto) and `order` rebuilt 1-based; copy title/objective/level/description/days names/items fields (targetSets/targetReps/restSec/supersetGroup/notes). **Do not** copy `imageUrl` (custom cards use fallback images).
- Extract the draft-load loop from `useRoutineDraft.ts:42-61` into a shared loader, then the detail handler = load → `createRoutine(clone)` → `navigate('/rutinas/{newSlug}/editar')`.
- **Badge**: `RutinasPage` custom section — `badge={basedOn ? t('rutinas.basadaEn', { titulo: localizeRoutine(source).title }) : t('rutinas.propia')}`, resolving source from the live `routines` array by `basedOnId`; hide/fallback when source missing.
- **88.2 day reorder**: add `reorderDays` to `useRoutineDraft` + day-level drag (extend `useDragReorder` with a day scope or a second instance) and normalize `dayIndex` on save. 88.3 is already implemented at item level; verify `+`/`×`/drag remain intact for cloned drafts.
- New i18n keys in both locales (es typed source first).

## Risks
- **Reseed**: safe today (`preserveCustom` keeps clones), but if a future seed version *removes* a seed routine, `basedOnId` points to nothing → badge must degrade gracefully (fallback to "Propia" or hide). Seed ids are stable, so `basedOnId` survives reseeds otherwise.
- **Id conflicts**: none — custom ids start at 10000 (`nextCustomId`), seeds < 10000.
- **Slug uniqueness**: handled by `uniqueSlug` (clone of `ppl-volumen` → `ppl-volumen-2`); both slugs coexist under `/rutinas/:slug`.
- **EN localization**: cloned routine titles have no EN entry (existing behavior for all customs). Badge source title must be localized from the **source** routine (slug-keyed EN exists), not the clone.
- **Single badge slot in RoutineCard**: "Basada en …" replaces "Propia" or composes text; decide in proposal (PLAN: badge "Basada en …").
- **Orphan clones**: user clicks edit and abandons → default-named clone remains. Fine; mirror of "Nueva rutina".
- **88.7 test scope**: clone domain tests are cheap (pure); UI/e2e must cover clone → edit → save → badge → original intact, seed untouched, reseed survival.

## Ready for Proposal

Yes. Tell the user: the flow is ~90% scaffolding exists (routes, builder edit mode, item drag, create/update atomic tx, reseed preservation). Net-new: clone mapper + shared loader extraction, `basedOnId` optional field, detail-page button, badge + i18n keys, day-level reorder, and tests. No new tables, no schema migration (non-indexed field). PLAN.md "8 rutinas" wording is stale (68 predefined exist); feature covers all `!isCustom` routines.