# F93 #7 — Filtro por grupo muscular + zona específica Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Añadir un filtro jerárquico de dos niveles al catálogo de ejercicios —grupo principal (Pierna, Pecho, …) y zona específica (Cuádriceps, Pecho medio, …)— manteniendo la búsqueda simple para el usuario.

**Architecture:** Se mantiene `Exercise.muscleGroup` (grupo principal, sin cambios de tipo → mínimo impacto en stats/fatiga/rutinas) y se añade `Exercise.muscleZones: MuscleZone[]` (opcional). El vocabulario de zonas vive en `domain/catalog.ts` (fuente de verdad), la inferencia automática en un módulo de dominio puro `domain/muscleZoneInference.ts`, el filtrado en `hooks/useExerciseCatalog.ts` y la UI en `components/exercises/ExerciseFilterBar.tsx`. El re-seed aplica las zonas vía bump de `SEED_VERSION`.

**Tech Stack:** TypeScript, React 18, Tailwind v4, Dexie (IndexedDB), Zustand, Vitest (`npm run test` = `vitest run`), react-i18next.

**Spec:** `docs/superpowers/specs/2026-09-03-f93-t07-grupo-muscular-zonas-design.md`

## Global Constraints

- Arquitectura por capas: `domain/` es TypeScript puro (sin React, sin Dexie, sin imports UI). La UI no importa `db` directamente.
- `MuscleZone` se modela como string **prefijado** `'<grupo>:<zona>'` (p. ej. `'pierna:cuadriceps'`, `'pecho:superior'`) para desambiguar sin colisiones y poder mapear zona→grupo.
- El campo `muscleGroup` de `Exercise` **no cambia de tipo**. `muscleZones?: MuscleZone[]` es nuevo y opcional.
- Copy de UI en español (es-ES); inglés para identificadores de código. Etiquetas ES/EN para cada zona.
- 1 commit por tarea, mensaje convencional (`feat:`/`refactor:`/`docs:`). No acumular.
- Verificación del repo antes de afirmar "hecho": `npx tsc --noEmit` + `npm run build`.
- `prefers-reduced-motion` respetado; sin scrollbar visible (hidro de scroll ya en `src/index.css`, no se toca).
- Espacio de trabajo: trabajar dentro de `gymlab-app/` con `workdir`.

---

### Task 1: Vocabulario de zonas y tipo `MuscleZone`

**Files:**
- Modify: `src/domain/catalog.ts`
- Modify: `src/domain/types.ts`
- Test: `tests/unit/domain/muscleZones.test.ts` (create)

**Interfaces:**
- Consumes: nada nuevo (usa `MuscleGroup` existente de `./types`).
- Produces:
  - `export type MuscleZone = ...` (string literals prefijados, derivado de `MUSCLE_ZONE_BY_GROUP`).
  - `export const MUSCLE_ZONE_BY_GROUP: Record<MuscleGroup, readonly MuscleZone[]>` — zonas de cada grupo.
  - `export const MUSCLE_ZONE_LABELS_ES: Record<MuscleZone, string>` y `MUSCLE_ZONE_LABELS_EN`.
  - `Export function muscleZonesOfGroup(group: MuscleGroup): readonly MuscleZone[]`.
  - `Exercise` gana `muscleZones?: MuscleZone[]`.

- [ ] **Step 1: Write the failing test**

`tests/unit/domain/muscleZones.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  MUSCLE_ZONE_BY_GROUP,
  MUSCLE_ZONE_LABELS_ES,
  MUSCLE_ZONE_LABELS_EN,
  muscleZonesOfGroup,
} from '@/domain/catalog'
import type { MuscleGroup, MuscleZone } from '@/domain/types'

const ALL_GROUPS: MuscleGroup[] = [
  'pecho', 'espalda', 'biceps', 'triceps', 'hombro',
  'pierna', 'gluteo', 'abdomen', 'trapecios', 'antebrazo',
]

describe('MUSCLE_ZONE_BY_GROUP', () => {
  it('define zonas para todos los grupos musculares', () => {
    for (const g of ALL_GROUPS) {
      expect(MUSCLE_ZONE_BY_GROUP[g].length).toBeGreaterThanOrEqual(1)
    }
  })

  it('pierna incluye cuadriceps y femoral', () => {
    const zones = MUSCLE_ZONE_BY_GROUP.pierna
    expect(zones).toContain('pierna:cuadriceps')
    expect(zones).toContain('pierna:femoral')
  })

  it('cada zona usa el prefijo de su grupo', () => {
    for (const g of ALL_GROUPS) {
      for (const z of MUSCLE_ZONE_BY_GROUP[g]) {
        expect(z.startsWith(`${g}:`)).toBe(true)
      }
    }
  })

  it('no duplica zonas entre grupos', () => {
    const seen = new Set<MuscleZone>()
    for (const g of ALL_GROUPS) {
      for (const z of MUSCLE_ZONE_BY_GROUP[g]) {
        expect(seen.has(z)).toBe(false)
        seen.add(z)
      }
    }
  })
})

describe('muscleZonesOfGroup', () => {
  it('devuelve las zonas de un grupo', () => {
    expect(muscleZonesOfGroup('pierna')).toEqual(MUSCLE_ZONE_BY_GROUP.pierna)
  })
})

describe('MUSCLE_ZONE_LABELS', () => {
  it('tienen etiqueta ES y EN para cada zona', () => {
    for (const g of ALL_GROUPS) {
      for (const z of MUSCLE_ZONE_BY_GROUP[g]) {
        expect(MUSCLE_ZONE_LABELS_ES[z]).toBeTruthy()
        expect(MUSCLE_ZONE_LABELS_EN[z]).toBeTruthy()
      }
    }
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/unit/domain/muscleZones.test.ts`
Expected: FAIL — `MUSCLE_ZONE_BY_GROUP` / `muscleZonesOfGroup` no exportados.

- [ ] **Step 3: Implement vocabulary in `src/domain/catalog.ts`**

Add after `MUSCLE_GROUP_LABELS_EN`:

```ts
// Zonas específicas por grupo muscular. Cada zona usa el prefijo '<grupo>:'
// para ser única y desambigüable (p. ej. 'pecho:superior' vs 'pierna:superior').
export const MUSCLE_ZONE_BY_GROUP = {
  pecho: ['pecho:superior', 'pecho:medio', 'pecho:inferior'],
  espalda: ['espalda:dorsal', 'espalda:lumbar', 'espalda:romboides'],
  biceps: ['biceps:larga', 'biceps:corta', 'biceps:braquial'],
  triceps: ['triceps:larga', 'triceps:lateral', 'triceps:medial'],
  hombro: ['hombro:anterior', 'hombro:lateral', 'hombro:posterior'],
  pierna: ['pierna:cuadriceps', 'pierna:femoral', 'pierna:gemelo', 'pierna:abductor', 'pierna:aductor'],
  gluteo: ['gluteo:mayor', 'gluteo:medio'],
  abdomen: ['abdomen:superior', 'abdomen:inferior', 'abdomen:oblicuos'],
  trapecios: ['trapecios:superior', 'trapecios:medio', 'trapecios:inferior'],
  antebrazo: ['antebrazo:flexor', 'antebrazo:extensor'],
} as const satisfies Record<MuscleGroup, readonly string[]>

export type MuscleZone = (typeof MUSCLE_ZONE_BY_GROUP)[MuscleGroup][number]

export const muscleZonesOfGroup = (group: MuscleGroup): readonly MuscleZone[] =>
  MUSCLE_ZONE_BY_GROUP[group]

export const MUSCLE_ZONE_LABELS_ES: Record<MuscleZone, string> = {
  'pecho:superior': 'Pecho superior',
  'pecho:medio': 'Pecho medio',
  'pecho:inferior': 'Pecho inferior',
  'espalda:dorsal': 'Dorsal',
  'espalda:lumbar': 'Lumbar',
  'espalda:romboides': 'Romboides',
  'biceps:larga': 'Cabeza larga',
  'biceps:corta': 'Cabeza corta',
  'biceps:braquial': 'Braquial',
  'triceps:larga': 'Cabeza larga',
  'triceps:lateral': 'Cabeza lateral',
  'triceps:medial': 'Cabeza medial',
  'hombro:anterior': 'Hombro anterior',
  'hombro:lateral': 'Hombro lateral',
  'hombro:posterior': 'Hombro posterior',
  'pierna:cuadriceps': 'Cuádriceps',
  'pierna:femoral': 'Femoral',
  'pierna:gemelo': 'Gemelo',
  'pierna:abductor': 'Abductor',
  'pierna:aductor': 'Aductor',
  'gluteo:mayor': 'Glúteo mayor',
  'gluteo:medio': 'Glúteo medio',
  'abdomen:superior': 'Abdomen superior',
  'abdomen:inferior': 'Abdomen inferior',
  'abdomen:oblicuos': 'Oblicuos',
  'trapecios:superior': 'Trapecios superiores',
  'trapecios:medio': 'Trapecios medios',
  'trapecios:inferior': 'Trapecios inferiores',
  'antebrazo:flexor': 'Flexores de antebrazo',
  'antebrazo:extensor': 'Extensores de antebrazo',
}

export const MUSCLE_ZONE_LABELS_EN: Record<MuscleZone, string> = {
  'pecho:superior': 'Upper chest',
  'pecho:medio': 'Mid chest',
  'pecho:inferior': 'Lower chest',
  'espalda:dorsal': 'Lats',
  'espalda:lumbar': 'Lower back',
  'espalda:romboides': 'Rhomboids',
  'biceps:larga': 'Long head',
  'biceps:corta': 'Short head',
  'biceps:braquial': 'Brachialis',
  'triceps:larga': 'Long head',
  'triceps:lateral': 'Lateral head',
  'triceps:medial': 'Medial head',
  'hombro:anterior': 'Front delt',
  'hombro:lateral': 'Side delt',
  'hombro:posterior': 'Rear delt',
  'pierna:cuadriceps': 'Quadriceps',
  'pierna:femoral': 'Hamstrings',
  'pierna:gemelo': 'Calves',
  'pierna:abductor': 'Abductors',
  'pierna:aductor': 'Adductors',
  'gluteo:mayor': 'Glute max',
  'gluteo:medio': 'Glute medius',
  'abdomen:superior': 'Upper abs',
  'abdomen:inferior': 'Lower abs',
  'abdomen:oblicuos': 'Obliques',
  'trapecios:superior': 'Upper traps',
  'trapecios:medio': 'Mid traps',
  'trapecios:inferior': 'Lower traps',
  'antebrazo:flexor': 'Forearm flexors',
  'antebrazo:extensor': 'Forearm extensors',
}
```

- [ ] **Step 4: Add `muscleZones` to `Exercise` in `src/domain/types.ts`**

`src/domain/types.ts` — add to the `Exercise` interface after `muscleGroup`:

```ts
  muscleGroup: MuscleGroup
  // Zonas específicas que trabaja (p. ej. ['pierna:cuadriceps','pierna:femoral']).
  // Opcional: un ejercicio sin zonas no aparece al filtrar por zona específica.
  muscleZones?: MuscleZone[]
```

And update the import line in `src/domain/types.ts` (from `./catalog`):

```ts
import { CATEGORY_OPTIONS, EQUIPMENT_OPTIONS, LEVELS, MUSCLE_GROUPS, MUSCLE_ZONE_BY_GROUP, OBJECTIVES } from './catalog'

export type MuscleZone = (typeof MUSCLE_ZONE_BY_GROUP)[MuscleGroup][number]
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test -- tests/unit/domain/muscleZones.test.ts`
Expected: PASS (13 assertions).

- [ ] **Step 6: Commit**

```bash
git add src/domain/catalog.ts src/domain/types.ts tests/unit/domain/muscleZones.test.ts
git commit -m "feat: vocabulario de zonas musculares por grupo (muscleZone) y campo Exercise.muscleZones"
```

---

### Task 2: Localización de zonas (i18n)

**Files:**
- Modify: `src/i18n/catalog/en.ts`
- Test: `tests/unit/domain/muscleZones.test.ts` (add cases)

**Interfaces:**
- Consumes: `MUSCLE_ZONE_LABELS_ES`, `MUSCLE_ZONE_LABELS_EN`, `MuscleZone` (Task 1).
- Produces: `export function localizeMuscleZone(value: string, lang: AppLanguage): string`.

- [ ] **Step 1: Write the failing test**

Add to `tests/unit/domain/muscleZones.test.ts`:

```ts
import { localizeMuscleZone } from '@/i18n/catalog'

describe('localizeMuscleZone', () => {
  it('devuelve etiqueta ES por defecto', () => {
    expect(localizeMuscleZone('pierna:cuadriceps', 'es')).toBe('Cuádriceps')
  })
  it('devuelve etiqueta EN en inglés', () => {
    expect(localizeMuscleZone('pierna:cuadriceps', 'en')).toBe('Quadriceps')
  })
  it('devuelve el valor crudo si no conoce la zona', () => {
    expect(localizeMuscleZone('desconocido:x', 'es')).toBe('desconocido:x')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/unit/domain/muscleZones.test.ts`
Expected: FAIL — `localizeMuscleZone` no definido.

- [ ] **Step 3: Implement `localizeMuscleZone` in `src/i18n/catalog/en.ts`**

Add near `localizeMuscleGroup`:

```ts
import { MUSCLE_ZONE_LABELS_EN, MUSCLE_ZONE_LABELS_ES } from '@/domain/catalog'
import type { MuscleZone } from '@/domain/types'

export function localizeMuscleZone(value: string, lang: AppLanguage): string {
  const labels = lang === 'en' ? MUSCLE_ZONE_LABELS_EN : MUSCLE_ZONE_LABELS_ES
  return labels[value as MuscleZone] ?? value
}
```

`src/i18n/catalog/en.ts` currently starts with `export * from './en'`? No — that's `src/i18n/catalog/index.ts`. Keep `en.ts` as the implementation file. Add imports to the existing import block at the top of `en.ts` (it already imports `MUSCLE_GROUP_LABELS_EN/ES`).

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- tests/unit/domain/muscleZones.test.ts`
Expected: PASS (add 3 assertions, total 16).

- [ ] **Step 5: Commit**

```bash
git add src/i18n/catalog/en.ts tests/unit/domain/muscleZones.test.ts
git commit -m "feat: localizacion de zonas musculares (localizeMuscleZone) ES/EN"
```

---

### Task 3: Inferencia heurística de zonas (`inferZones`)

**Files:**
- Create: `src/domain/muscleZoneInference.ts`
- Test: `tests/unit/domain/muscleZoneInference.test.ts` (create)
- Modify: `src/data/catalogLoader.ts`

**Interfaces:**
- Consumes: `Exercise`, `MuscleZone`, `MuscleGroup` (Task 1).
- Produces: `export function inferZones(ex: Pick<Exercise,'name'|'slug'|'externalId'|'muscleGroup'>): MuscleZone[]`.

- [ ] **Step 1: Write the failing test**

`tests/unit/domain/muscleZoneInference.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { inferZones } from '@/domain/muscleZoneInference'
import type { Exercise } from '@/domain/types'

const ex = (g: Exercise['muscleGroup'], name: string, slug = '', externalId = '') =>
  ({ muscleGroup: g, name, slug, externalId }) as Exercise

describe('inferZones', () => {
  it('no infiere nada para un grupo sin pistas', () => {
    expect(inferZones(ex('pecho', 'Ejercicio genérico', 'generic'))).toEqual([])
  })

  it('identifica curl femoral como femoral', () => {
    expect(inferZones(ex('pierna', 'Curl femoral', 'curl-femoral', 'Leg_Curl'))).toContain('pierna:femoral')
  })

  it('identifica elevación de gemelos como gemelo', () => {
    expect(inferZones(ex('pierna', 'Elevación de gemelos', 'calf-raise', 'Calf_Raise'))).toContain('pierna:gemelo')
  })

  it('identifica extensión/leg extension como cuadriceps', () => {
    expect(inferZones(ex('pierna', 'Extensión de piernas', 'leg-extension', 'Leg_Extension'))).toContain('pierna:cuadriceps')
  })

  it('identifica press inclinado como pecho superior', () => {
    expect(inferZones(ex('pecho', 'Press inclinado', 'incline-press', 'Incline_Press'))).toContain('pecho:superior')
  })

  it('las zonas devueltas pertenecen al grupo del ejercicio', () => {
    const zones = inferZones(ex('pierna', 'Curl femoral sentado', 'seated-leg-curl'))
    for (const z of zones) {
      expect(z.startsWith('pierna:')).toBe(true)
    }
  })

  it('ignora pistas de otro grupo (sin contaminación cruzada)', () => {
    const zones = inferZones(ex('pecho', 'Curl femoral', 'curl-femoral'))
    expect(zones.some((z) => z.startsWith('pierna:'))).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/unit/domain/muscleZoneInference.test.ts`
Expected: FAIL — `inferZones` no exportado.

- [ ] **Step 3: Implement `src/domain/muscleZoneInference.ts`**

```ts
// Inferencia heurística de zonas musculares a partir del nombre/slug/externalId.
// Solo asigna zonas dentro del grupo principal del ejercicio para no contaminar
// otros grupos; devuelve [] si no hay suficiente señal. Los ejercicios curados
// llevan zonas manuales y no dependen de esta heurística.
import type { Exercise, MuscleGroup, MuscleZone } from './types'
import { muscleZonesOfGroup } from './catalog'

// Pares de pistas (regex) -> zona. Escaneadas en orden sobre name+slug+externalId
// en minúsculas. Solo se aceptan zonas del grupo del ejercicio.
const ZONE_RULES: { re: RegExp; zone: MuscleZone }[] = [
  { re: /\b(quad|cuadric|extensi[oó]n de pierna|leg extension)\b/i, zone: 'pierna:cuadriceps' },
  { re: /\b(hamstring|femoral|leg curl|isquio|isquiotibial|curl de femoral|curl femoral|good morning|rumano|romaniano)\b/i, zone: 'pierna:femoral' },
  { re: /\b(calf|gemelo|gemelos|talon|talo[oó]n)\b/i, zone: 'pierna:gemelo' },
  { re: /\b(abductor|abduccion)\b/i, zone: 'pierna:abductor' },
  { re: /\b(adductor|aductor|aduccion)\b/i, zone: 'pierna:aductor' },
  { re: /\b(incline|inclinado)\b/i, zone: 'pecho:superior' },
  { re: /\b(decline|declinado)\b/i, zone: 'pecho:inferior' },
  { re: /\b(pullover|pull over|apertura)\b/i, zone: 'pecho:medio' },
  { re: /\b(glute|hip thrust|puente|bridge|cadera)\b/i, zone: 'gluteo:mayor' },
  { re: /\b(dorsal|lat pulldown|jal[oó]n|pull down|dominada|chin.?up|remo)\b/i, zone: 'espalda:dorsal' },
]

export const inferZones = (
  ex: Pick<Exercise, 'name' | 'slug' | 'externalId' | 'muscleGroup'>
): MuscleZone[] => {
  const haystack = `${ex.name} ${ex.slug} ${ex.externalId ?? ''}`.toLowerCase()
  const valid = new Set<MuscleZone>(muscleZonesOfGroup(ex.muscleGroup))
  const found = new Set<MuscleZone>()
  for (const { re, zone } of ZONE_RULES) {
    if (!valid.has(zone)) continue
    if (re.test(haystack)) found.add(zone)
  }
  // Orden canónico por definición del grupo.
  const order = muscleZonesOfGroup(ex.muscleGroup)
  return order.filter((z) => found.has(z))
}
```

- [ ] **Step 4: Wire inference into `src/data/catalogLoader.ts`**

`src/data/catalogLoader.ts` — modify `normalize` and add import:

```ts
import { inferZones } from '@/domain/muscleZoneInference'

// Rellena zonas inferidas solo si el ejercicio no trae zonas definidas.
const normalize = (rows: unknown[]): Exercise[] =>
  rows.map((row) => {
    const ex = applyCatalogNames(withCategory(row as Exercise))
    return { ...ex, muscleZones: ex.muscleZones?.length ? ex.muscleZones : inferZones(ex) }
  })
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test -- tests/unit/domain/muscleZoneInference.test.ts`
Expected: PASS (7 assertions).

- [ ] **Step 6: Commit**

```bash
git add src/domain/muscleZoneInference.ts src/data/catalogLoader.ts tests/unit/domain/muscleZoneInference.test.ts
git commit -m "feat: inferencia heuristica de zonas musculares (inferZones) y aplicacion en catalogLoader"
```

---

### Task 4: Re-etiquetado manual de los ejercicios curados + bump SEED_VERSION

**Files:**
- Modify: `src/data/seed/exercises.ts`
- Modify: `src/data/repositories/dexie/db.ts` (bump `SEED_VERSION`)

**Interfaces:**
- Consumes: `MuscleZone` (Task 1).
- Produces: ejercicios curados con `muscleZones` manuales; `SEED_VERSION` incrementado para forzar re-seed.

- [ ] **Step 1: Add `muscleZones` to the curated leg/core exercises**

In `src/data/seed/exercises.ts`, add `muscleZones` to these entries (keep `muscleGroup` unchanged):

- id 27 `sentadilla-con-barra` (pierna): `muscleZones: ['pierna:cuadriceps', 'pierna:femoral', 'gluteo:mayor']`
- id 28 `sentadilla-goblet` (pierna): `muscleZones: ['pierna:cuadriceps', 'pierna:femoral', 'gluteo:mayor']`
- id 29 `prensa-de-piernas` (pierna): `muscleZones: ['pierna:cuadriceps', 'pierna:femoral', 'gluteo:mayor']`
- id 30 `extension-de-piernas` (pierna): `muscleZones: ['pierna:cuadriceps']`
- id 31 `curl-femoral` (pierna): `muscleZones: ['pierna:femoral']`
- id 32 `zancadas` (pierna): `muscleZones: ['pierna:cuadriceps', 'pierna:femoral', 'gluteo:mayor']`
- id 33 `peso-muerto-rumano` (pierna): `muscleZones: ['pierna:femoral', 'gluteo:mayor']`
- id 47 `sentadilla-bulgara` (pierna): `muscleZones: ['pierna:cuadriceps', 'pierna:femoral', 'gluteo:mayor']`
- id 48 `gemelo-de-pie` (pierna): `muscleZones: ['pierna:gemelo']`
- id 34 `hip-thrust` (gluteo): `muscleZones: ['gluteo:mayor']`
- id 35 `peso-muerto-sumo` (gluteo): `muscleZones: ['gluteo:mayor', 'pierna:aductor']`
- id 23 `press-mancuernas-hombro` (hombro): `muscleZones: ['hombro:anterior']`
- id 24 `elevaciones-laterales` (hombro): `muscleZones: ['hombro:lateral']`
- id 25 `elevaciones-frontales` (hombro): `muscleZones: ['hombro:anterior']`
- id 26 `elevaciones-posteriores` (hombro): `muscleZones: ['hombro:posterior']`
- id 2 `press-inclinado-mancuernas` (pecho): `muscleZones: ['pecho:superior', 'pecho:medio']`
- id 41 `press-declinado` (pecho): `muscleZones: ['pecho:inferior']`
- id 1 `press-de-pecho-con-barra` (pecho): `muscleZones: ['pecho:medio', 'pecho:superior']`
- id 42 `flexiones` (pecho): `muscleZones: ['pecho:medio', 'pecho:superior']`
- id 3 `aperturas-con-mancuernas` (pecho): `muscleZones: ['pecho:medio']`

(Insert `muscleZones` as a property on each corresponding object literal.)

- [ ] **Step 2: Bump `SEED_VERSION` in `src/data/repositories/dexie/db.ts`**

Change the last line:

```ts
export const SEED_VERSION = '19'
```
→
```ts
export const SEED_VERSION = '20'
```

- [ ] **Step 3: Verify typecheck + build**

Run: `npx tsc --noEmit`
Expected: PASS.

Run: `npm run build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/data/seed/exercises.ts src/data/repositories/dexie/db.ts
git commit -m "feat: re-etiquetado manual con zonas de ejercicios curados y bump SEED_VERSION"
```

---

### Task 5: Filtrado por zona en el hook y estado del filtro

**Files:**
- Modify: `src/hooks/useExerciseCatalog.ts`
- Test: `tests/unit/domain/muscleZoneInference.test.ts` (no — separate); add filter tests to a new `tests/unit/domain/filterExercises.test.ts` (create).

**Interfaces:**
- Consumes: `MuscleZone`, `Exercise` (Task 1).
- Produces:
  - `ExerciseCatalogFilters.zone: MuscleZone | null` (new).
  - `filterExercises` filtra por `zone` y `resets zone` cuando cambia `muscle` (en el caller, ver Task 6).

- [ ] **Step 1: Write the failing test**

`tests/unit/domain/filterExercises.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { EMPTY_FILTERS, filterExercises, type ExerciseCatalogFilters } from '@/hooks/useExerciseCatalog'
import type { Exercise } from '@/domain/types'

const mk = (id: number, muscleGroup: Exercise['muscleGroup'], zones?: string[]): Exercise =>
  ({ id, slug: `ex-${id}`, name: `Ejercicio ${id}`, muscleGroup, equipment: 'barra', instructions: '', muscleZones: zones as Exercise['muscleZones'] })

const ex1 = mk(1, 'pierna', ['pierna:cuadriceps', 'pierna:femoral'])
const ex2 = mk(2, 'pierna', ['pierna:femoral'])
const ex3 = mk(3, 'pecho', ['pecho:superior'])
const all = [ex1, ex2, ex3]

describe('filterExercises por zona', () => {
  it('filtra por zona específica', () => {
    const f: ExerciseCatalogFilters = { ...EMPTY_FILTERS, zone: 'pierna:cuadriceps' }
    const r = filterExercises(all, f, new Set())
    expect(r.map((e) => e.id)).toEqual([1])
  })

  it('un ejercicio con varias zonas sale al filtrar por cualquiera', () => {
    const f: ExerciseCatalogFilters = { ...EMPTY_FILTERS, zone: 'pierna:femoral' }
    const r = filterExercises(all, f, new Set())
    expect(r.map((e) => e.id).sort()).toEqual([1, 2])
  })

  it('sin zona activa no filtra por zona', () => {
    const f: ExerciseCatalogFilters = { ...EMPTY_FILTERS }
    const r = filterExercises(all, f, new Set())
    expect(r).toHaveLength(3)
  })

  it('combina grupo principal y zona', () => {
    const f: ExerciseCatalogFilters = { ...EMPTY_FILTERS, muscle: 'pierna', zone: 'pierna:femoral' }
    const r = filterExercises(all, f, new Set())
    expect(r.map((e) => e.id).sort()).toEqual([1, 2])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/unit/domain/filterExercises.test.ts`
Expected: FAIL — `zone` no existe en `ExerciseCatalogFilters`.

- [ ] **Step 3: Implement in `src/hooks/useExerciseCatalog.ts`**

Add `zone: MuscleZone | null` to the type and `EMPTY_FILTERS`. Update imports and the filter function:

```ts
import type { Equipment, Exercise, ExerciseCategory, MuscleGroup, MuscleZone } from '@/domain/types'
```

```ts
export type ExerciseCatalogFilters = {
  search: string
  muscle: MuscleGroup | null
  zone: MuscleZone | null
  category: ExerciseCategory | null
  equipment: Equipment | null
  onlyFavorites: boolean
  onlyCommon: boolean
}

export const EMPTY_FILTERS: ExerciseCatalogFilters = {
  search: '',
  muscle: null,
  zone: null,
  category: null,
  equipment: null,
  onlyFavorites: false,
  onlyCommon: false,
}
```

Inside `filterExercises`, add after `matchMuscle`:

```ts
    const matchZone = !filters.zone || (ex.muscleZones ?? []).includes(filters.zone)
```

And include `matchZone` in the returned boolean:

```ts
    return matchSearch && matchMuscle && matchZone && matchCategory && matchEquipment && matchFav && matchCommon
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- tests/unit/domain/filterExercises.test.ts`
Expected: PASS (4 assertions).

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useExerciseCatalog.ts tests/unit/domain/filterExercises.test.ts
git commit -m "feat: filtrado de ejercicios por zona especifica (ExerciseCatalogFilters.zone)"
```

---

### Task 6: Fila de chips por zona en la barra de filtros

**Files:**
- Modify: `src/components/exercises/ExerciseFilterBar.tsx`

**Interfaces:**
- Consumes: `ExerciseCatalogFilters` + `onChange` (Task 5); `muscleZonesOfGroup`, `MUSCLE_GROUPS` (Task 1); `localizeMuscleZone` (Task 2).
- Produces: segunda fila `HScroll` con chips de zonas del grupo seleccionado; al cambiar de grupo principal se resetea `zone`.

- [ ] **Step 1: Implement the second chip row**

In `src/components/exercises/ExerciseFilterBar.tsx`:

Add imports:
```ts
import { CATEGORY_OPTIONS, EQUIPMENT_OPTIONS, MUSCLE_GROUPS, muscleZonesOfGroup } from '@/domain/catalog'
import { localizeCategory, localizeMuscleGroup, localizeMuscleZone, localizeEquipment } from '@/i18n/catalog'
```

In the `toggle` handler, when changing `muscle`, also reset `zone`:
```ts
  const toggleMuscle = (value: MuscleGroup) =>
    onChange({
      muscle: filters.muscle === value ? null : value,
      // Al cambiar de grupo, resetea la zona específica para no quedarse con una inválida.
      zone: null,
    })
```

In the muscle-row `onClick`, replace `onClick={() => toggle('muscle', mg)}` with `onClick={() => toggleMuscle(mg)}` and wrap in a type import for `MuscleGroup`.

Add, right after the muscle `HScroll` block (only when a group with zones is selected):

```tsx
      {(filters.muscle && muscleZonesOfGroup(filters.muscle).length > 0) && (
        <HScroll className="pb-1">
          <Chip active={!filters.zone} onClick={() => onChange({ zone: null })}>
            {t('ejercicios.filtros.zona')}
          </Chip>
          {muscleZonesOfGroup(filters.muscle).map((zone) => (
            <Chip key={zone} active={filters.zone === zone} onClick={() => onChange({ zone: filters.zone === zone ? null : zone })}>
              {localizeMuscleZone(zone, lang)}
            </Chip>
          ))}
        </HScroll>
      )}
```

- [ ] **Step 2: Add the i18n key for the "zona" placeholder chip**

Check `src/i18n/locales/es` and `en` (likely `ejercicios.ts` or similar). If `ejercicios.filtros.*` exists (it does — `músculo`, `categoria`, `equipo`), add `zona: 'Zona'` (es) and `zona: 'Zone'` (en) keys in the same `filtros` object.

Find the locale file(s) with `ejercicios.filtros` (search the `es` and `en` locale dirs) and add the key. If not found by grep, add `zona` to the `filtros` object that already contains `músculo`/`categoria`/`equipo`.

- [ ] **Step 3: Verify typecheck + build**

Run: `npx tsc --noEmit`
Expected: PASS.

Run: `npm run build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/exercises/ExerciseFilterBar.tsx src/i18n/locales/es src/i18n/locales/en
git commit -m "feat: fila de chips por zona especifica en el filtro de ejercicios"
```

---

### Task 7: Zonas en la ficha del ejercicio

**Files:**
- Modify: `src/components/exercise/ExerciseMuscleCard.tsx`
- Modify: `src/pages/EjercicioDetailPage.tsx`

**Interfaces:**
- Consumes: `ExerciseMuscleCard` prop `muscleGroup` (existing) + new optional `muscleZones?: MuscleZone[]`; `localizeMuscleZone` (Task 2).

- [ ] **Step 1: Extend `ExerciseMuscleCard` to accept `muscleZones` and render badges**

`src/components/exercise/ExerciseMuscleCard.tsx`:

```tsx
import { useTranslation } from 'react-i18next'
import { Dumbbell } from 'lucide-react'
import { MuscleDummy } from '@/components/body/MuscleDummy'
import type { MuscleGroup, MuscleZone } from '@/domain/types'
import { localizeMuscleZone } from '@/i18n/catalog'
import type { AppLanguage } from '@/domain/onboarding'

export const ExerciseMuscleCard = ({
  muscleGroup,
  muscleZones = [],
  lang,
}: {
  muscleGroup: MuscleGroup
  muscleZones?: MuscleZone[]
  lang: AppLanguage
}) => {
  const { t } = useTranslation()
  return (
    <section className="panel-light rounded-2xl p-4">
      <div className="mb-1 flex items-center gap-2">
        <Dumbbell className="size-5 text-accent" />
        <span className="font-display text-sm font-semibold text-accent">{t('ejercicios.detalle.musculoTrabajado')}</span>
      </div>
      <MuscleDummy fatigue={{}} highlight={muscleGroup} showLegend={false} />
      {muscleZones.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2" aria-label={t('ejercicios.detalle.zonas')}>
          {muscleZones.map((z) => (
            <li key={z} className="rounded-full border border-border px-3 py-1 text-xs text-muted">
              {localizeMuscleZone(z, lang)}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
```

- [ ] **Step 2: Pass zones from `EjercicioDetailPage`**

In `src/pages/EjercicioDetailPage.tsx`, find where `ExerciseMuscleCard` is rendered (passing `muscleGroup`). Add `muscleZones={exercise.muscleZones ?? []}` and `lang={lang}`. `lang` is already in scope.

- [ ] **Step 3: Add i18n keys**

Add `ejercicios.detalle.zonas` = `'Zonas trabajadas'` (es) / `'Trained zones'` (en) to the locale files where `ejercicios.detalle.musculoTrabajado` lives.

- [ ] **Step 4: Verify typecheck + build**

Run: `npx tsc --noEmit`
Expected: PASS.

Run: `npm run build`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/exercise/ExerciseMuscleCard.tsx src/pages/EjercicioDetailPage.tsx src/i18n/locales/es src/i18n/locales/en
git commit -m "feat: badges de zonas especificas en la ficha del ejercicio"
```

---

### Task 8: Verificación completa del conjunto

**Files:** (no code changes; verification only)

- [ ] **Step 1: Run unit tests**

Run: `npm run test`
Expected: ALL PASS.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS (no errors).

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: PASS (clean build).

- [ ] **Step 4: Manual smoke (opcional, con `npm run dev`)**

Verificar en el navegador:
- El filtro muestra fila de grupos (Pierna, Pecho…) y al tocar «Pierna» aparece la 2.ª fila con Cuádriceps/Femoral/Gemelo/Abductor/Aductor.
- Al filtrar por Cuádriceps, aparecen sentadillas, extensiones, prensa.
- Cambiar de grupo limpia la zona seleccionada.
- En la ficha de «Sentadilla con barra» aparecen badges «Cuádriceps · Femoral · Glúteo mayor».

- [ ] **Step 5: Update CHANGELOG.md**

Add under `[Unreleased]` → `Added`:

```md
- Filtro de ejercicios por zona específica (cuádriceps, femoral, gemelo, abductor, aductor, etc.) junto al grupo principal (Pierna, Pecho...) (F93 #7).
```

- [ ] **Step 6: Commit + mark PLAN.md**

```bash
git add CHANGELOG.md PLAN.md
git commit -m "docs: changelog y plan para filtro por grupo muscular y zona especifica (F93 #7)"
```

Mark the corresponding checkbox in `PLAN.md` if the ticket is listed there.

---

## Self-Review

**Spec coverage:**
- WP1 vocabulario + tipo → Task 1 ✅
- WP2 inferencia → Task 3 ✅
- WP3 filtro jerárquico (hook + UI) → Tasks 5 & 6 ✅
- WP4 re-etiquetado seed + bump SEED_VERSION + catalogLoader → Tasks 3 & 4 ✅
- WP5 ficha/badges → Task 7 ✅
- WP6 verificación + changelog → Task 8 ✅

**Placeholder scan:** El único paso «Find the locale file» (Task 6 step 2) es una búsqueda guiada con instrucciones explícitas y fallback concreto; el resto tiene código real. Aceptable.

**Type consistency:** `MuscleZone` definido en Task 1 y usado consistentemente en Tasks 2–7 como `'<grupo>:<zona>'`. `ExerciseCatalogFilters.zone` añadido en Task 5 y consumido en Task 6. `localizeMuscleZone(value: string, lang)` definido en Task 2, usado en Tasks 6–7. `inferZones(ex)` en Task 3, usado en catalogLoader Task 3. Coherente.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-09-03-f93-t07-grupo-muscular-zonas.md`.
