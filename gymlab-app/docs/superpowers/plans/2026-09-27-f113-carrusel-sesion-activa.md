# F113 — Sesión activa: carrusel horizontal de ejercicios — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que el apartado de ejercicios de la sesión activa (`/entrenamiento/active`) deje de ser una lista vertical y pase a ser un carrusel horizontal (un slide por grupo: ejercicio suelto o superserie), con indicador segmentado + contador «N de M», auto-avance F34c conservado y los botones «+ Añadir ejercicio» / «Finalizar» en una barra fija sobre la TabBar.

**Architecture:** Reemplazo del layout de `SessionGroupList` por `SessionCarousel` (contenedor `overflow-x-auto` + `scroll-snap-type: x mandatory`, slides `w-[88%] shrink-0 snap-center`, sin virtualización) y un `SessionCarouselIndicator` (contador + barra segmentada). El auto-avance conserva la semántica F34c (transición grupo → completo) pero pasa de `scrollIntoView` a `scrollTo` del contenedor, con refs por slide. La lógica nueva de índices nace en `src/domain/sessionGroups.ts` con tests unitarios primero. Hero, nota, `RestTimer`, calculadora de discos, `ExerciseBlock`, `useActiveSession` y el store **no cambian**.

**Tech Stack:** Vite + React 19 + TypeScript, Tailwind CSS v4, react-i18next, Zustand (sin cambios), Vitest (entorno node, sin DOM; render estático) y Playwright (librería Python) para e2e, Capacitor 8 (Android) para el smoke de emulador.

**Spec:** `docs/superpowers/specs/2026-09-27-f113-carrusel-sesion-activa-design.md`

**Precondición de ejecución:** todo corre en el worktree aislado `C:\Users\Yves De Faria\Desktop\ProyectoGymLab\.worktrees\f113\gymlab-app` (rama `f113`), con sesiones paralelas únicamente si el usuario lo pidió. Los comandos se ejecutan desde esa carpeta (PowerShell). Antes de la Task 1, el orquestador commitea **este plan** con su propio commit `docs:` (convención del repo: `b3ca764 docs: plan de implementación de F106 ...`), sin mezclarlo con código.

## Estado de avance

- [x] Task 1 — Helpers de dominio para índices de grupos (+ tests)
- [x] Task 2 — `SessionCarousel` + indicador + i18n (+ test de render)
- [x] Task 3 — Integración en `EntrenamientoPage` + barra fija + retiro de `SessionGroupList`
- [x] Task 4 — e2e: re-scope de t22 + nuevo `test_f113_carrusel.py`
- [x] Task 5 — Verificación completa + emulador + cierre en `PLAN.md`/`CHANGELOG`

(El orquestador marca cada casilla en el mismo commit de cierre de la tarea.)

## Global Constraints

Copiadas de la spec (`2026-09-27-f113-carrusel-sesion-activa-design.md`) y de `gymlab-app/AGENTS.md`. Aplican a **todas** las tareas.

- **Mobile-first 375×812**; touch targets ≥ 44×44 px; gap ≥ 8 px.
- **Sin scrollbars visibles en ninguna superficie** (los contenedores nuevos usan `scrollbar-hidden`; la app ya oculta la scrollbar globalmente en `src/index.css`).
- **`prefers-reduced-motion`**: el auto-avance usa `behavior: 'smooth'` salvo con la preferencia activa (→ `'auto'`).
- **i18n es/en obligatoria**: las claves nuevas van en `src/i18n/locales/es/workout.ts` (fuente tipada `EsSchema`) y en `src/i18n/locales/en/workout.ts`; si falta una clave en inglés, `npm run build` falla.
- **Cero cambios de datos**: sin tocar `useActiveSession`, `activeWorkoutStore`, repos, esquema ni semántica de dominio existente. Solo se **agregan** funciones puras a `src/domain/sessionGroups.ts`.
- **Sin virtualización**: TODOS los slides montados (requisito del e2e, de accesibilidad y del drag global).
- **Slide = grupo**: ejercicio suelto = 1 slide; superserie = 1 slide con sus bloques apilados y su badge. Cada bloque conserva su sugerencia. `ExerciseBlock` no se modifica.
- **Barra fija** con el patrón de `RutinaDetailPage`: `fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40` + `mx-auto max-w-lg`; el contenido suma padding inferior (`pb-40`) para que nada quede tapado.
- **`touch-action` del carrusel**: `pan-x pan-y` (+ `pinch-zoom`); **prohibido** copiar el `touch-pan-x` de `HScroll` (bloquearía el scroll vertical de la página desde dentro).
- **`npm run build` es el typecheck REAL** (`tsc -b`); **nunca** usar `npx tsc --noEmit` como evidencia (falso verde).
- Antes de cada commit: `npm run build` limpio + `npm test` verde + `npm run lint` sin hallazgos.
- **Ciclo RDD antes de cada commit** (implementar → normalizar → verificar → review → commit): `gentle-ai review status --cwd . --contract gentle-ai.review-integration/v2 --agent opencode --next-transition` y rutear **solo** desde `next_transition`. El review es informativo: no autoriza push.
- **Un commit por tarea**, mensaje convencional, **stage de rutas exactas** (nunca `git add -A`/`.`), **sin push**.
- **Emulador obligatorio** para este cambio de UI (Task 5): receta de `AGENTS.md`; criterio `root.children.length > 0`, body con texto, **0 `pageerror`**, `/entrenamiento/active` navegable, swipe horizontal y scroll vertical de página funcionando con toque.

## Estructura de archivos

| Archivo | Acción | Responsabilidad |
|---|---|---|
| `src/domain/sessionGroups.ts` | Modificar | Agregar `firstIncompleteGroupIndex`, `nextIncompleteGroupIndex`, `clampGroupIndex` (puras, sin React) |
| `tests/unit/domain/sessionGroups.test.ts` | Modificar | Tests unitarios de los 3 helpers (primero en rojo) |
| `src/components/workout/SessionCarouselIndicator.tsx` | Crear | Contador «N de M» + barra segmentada (un segmento por grupo) |
| `src/components/workout/SessionCarousel.tsx` | Crear | Contenedor scrolleable con snap, slides por grupo, auto-avance F34c (`scrollTo`) y reposicionamiento |
| `tests/unit/components/sessionCarousel.test.tsx` | Crear | Render estático: slides montados, agrupación de superserie, aria-labels y contador |
| `src/i18n/locales/es/workout.ts` + `src/i18n/locales/en/workout.ts` | Modificar | 4 claves nuevas en `session.*` (aria de la región, contador, aria por slide, aria de superserie) |
| `src/pages/EntrenamientoPage.tsx` | Modificar | Reemplazar `SessionGroupList` por `SessionCarousel`; mover los 2 botones a la barra fija; `pb-40` con sesión no vacía; pasar el offset del `UndoToast` |
| `src/components/ui/UndoToast.tsx` | Modificar | Prop opcional `offsetClass` (default intacto) para no tapar la barra fija en esta página |
| `src/components/workout/SessionGroupList.tsx` | Eliminar | Sustituido por `SessionCarousel` (único consumidor verificado: la página) |
| `tests/e2e/test_f93_t22_quick.py` | Modificar | La horizontalidad se mide sobre el CARRUSEL; agregar swipe, contador y barra fija |
| `tests/e2e/test_f113_carrusel.py` | Crear | Superserie (1 slide), auto-avance F34c, arranque en el primer incompleto, empty state |
| `PLAN.md` | Modificar | Marcar F113/113.1 como implementada (Task 5) |
| `CHANGELOG.md` | Modificar | Entrada de F113 bajo `[Unreleased] > Added` (Task 5) |
| `C:\Users\Yves De Faria\AppData\Local\Temp\opencode\f113\cdp_check.py` | Crear (temporal, NO se commitea) | Smoke por CDP sobre el WebView del emulador (Task 5) |

---

### Task 1: Helpers de dominio para índices de grupos

**Files:**
- Modify: `src/domain/sessionGroups.ts`
- Test: `tests/unit/domain/sessionGroups.test.ts`

**Interfaces:**
- Consumes: `groupExercises`, `isGroupComplete`, `ExerciseGroup<T>` (ya existen en el mismo módulo).
- Produces (las usan Task 2 y Task 3; los nombres y firmas quedan congelados):
  - `firstIncompleteGroupIndex<T extends { sets: { completed: boolean }[] }>(groups: ExerciseGroup<T>[]): number` — primer grupo incompleto; `0` si todos están completos o la lista está vacía.
  - `nextIncompleteGroupIndex<T extends { sets: { completed: boolean }[] }>(groups: ExerciseGroup<T>[], from: number): number | null` — primer incompleto **después** de `from`; `null` si no queda ninguno.
  - `clampGroupIndex(index: number, groupCount: number): number` — reajusta a `[0, groupCount - 1]`; con 0 grupos devuelve `0`.

- [ ] **Step 1: Escribir los tests que fallan (RED)**

En `tests/unit/domain/sessionGroups.test.ts`, reemplazar el import actual:

```ts
import { groupExercises, isGroupComplete } from '@/domain/sessionGroups'
```

por:

```ts
import {
  clampGroupIndex,
  firstIncompleteGroupIndex,
  groupExercises,
  isGroupComplete,
  nextIncompleteGroupIndex,
} from '@/domain/sessionGroups'
```

y **agregar al final del archivo** (los helpers `set` y `ex` ya existen y se reutilizan):

```ts
describe('firstIncompleteGroupIndex', () => {
  it('devuelve el primer grupo incompleto', () => {
    const groups = groupExercises([
      ex(1, undefined, [set('s1', true)]),
      ex(2, undefined, [set('s2', false)]),
      ex(3, undefined, [set('s3', false)]),
    ])
    expect(firstIncompleteGroupIndex(groups)).toBe(1)
  })

  it('con todos completos devuelve 0 (el carrusel arranca en el primero)', () => {
    const groups = groupExercises([ex(1, undefined, [set('s1', true)])])
    expect(firstIncompleteGroupIndex(groups)).toBe(0)
  })

  it('con lista vacía devuelve 0', () => {
    expect(firstIncompleteGroupIndex([])).toBe(0)
  })
})

describe('nextIncompleteGroupIndex', () => {
  it('devuelve el siguiente incompleto después de un índice', () => {
    const groups = groupExercises([
      ex(1, undefined, [set('s1', true)]),
      ex(2, undefined, [set('s2', true)]),
      ex(3, undefined, [set('s3', false)]),
    ])
    expect(nextIncompleteGroupIndex(groups, 1)).toBe(2)
  })

  it('devuelve null si no queda ningún incompleto después', () => {
    const groups = groupExercises([ex(1, undefined, [set('s1', true)])])
    expect(nextIncompleteGroupIndex(groups, 0)).toBeNull()
  })
})

describe('clampGroupIndex', () => {
  it('recorta al último índice válido (anterior) cuando el índice quedó fuera', () => {
    expect(clampGroupIndex(3, 2)).toBe(1)
  })

  it('conserva los índices válidos', () => {
    expect(clampGroupIndex(1, 3)).toBe(1)
  })

  it('con cero grupos devuelve 0', () => {
    expect(clampGroupIndex(2, 0)).toBe(0)
  })
})
```

- [ ] **Step 2: Correr los tests y verificar que fallan**

Run: `npm test -- tests/unit/domain/sessionGroups.test.ts`
Expected: FAIL — `TypeError: firstIncompleteGroupIndex is not a function` (los 3 describes nuevos en rojo; los 3 viejos siguen verdes).

- [ ] **Step 3: Implementar los 3 helpers (GREEN)**

En `src/domain/sessionGroups.ts`, agregar al final:

```ts
// Índice del primer grupo incompleto: punto de arranque del carrusel. Con todos completos
// o sin grupos devuelve 0 (el carrusel no se monta si la sesión no tiene ejercicios).
export const firstIncompleteGroupIndex = <T extends { sets: { completed: boolean }[] }>(
  groups: ExerciseGroup<T>[]
): number => {
  const index = groups.findIndex((group) => !isGroupComplete(group))
  return index === -1 ? 0 : index
}

// Índice del primer grupo incompleto DESPUÉS de `from`; null si no queda ninguno
// (el auto-avance no se mueve, igual que F34c cuando no hay destino).
export const nextIncompleteGroupIndex = <T extends { sets: { completed: boolean }[] }>(
  groups: ExerciseGroup<T>[],
  from: number
): number | null => {
  for (let index = from + 1; index < groups.length; index++) {
    if (!isGroupComplete(groups[index])) return index
  }
  return null
}

// Reajusta el índice activo tras quitar grupos: el grupo que ocupó el lugar del eliminado
// (siguiente) o, si era el último, el anterior. Sin grupos válidos devuelve 0.
export const clampGroupIndex = (index: number, groupCount: number): number =>
  Math.max(0, Math.min(index, groupCount - 1))
```

- [ ] **Step 4: Correr los tests y verificar que pasan**

Run: `npm test -- tests/unit/domain/sessionGroups.test.ts`
Expected: PASS — 11 tests verdes en el archivo.

- [ ] **Step 5: Verificación completa de la tarea**

Run: `npm run build`
Expected: build limpio (`tsc -b` + Vite, exit 0).

Run: `npm test`
Expected: suite completa verde.

Run: `npm run lint`
Expected: exit 0, sin hallazgos nuevos.

- [ ] **Step 6: Ciclo de review (RDD)**

Run: `gentle-ai review status --cwd . --contract gentle-ai.review-integration/v2 --agent opencode --next-transition`
Expected: JSON con `next_transition` (y `paths` con `src/domain/sessionGroups.ts` + el test). Rutear **solo** desde `next_transition`. Si un hallazgo es real: corregirlo, repetir Steps 4–5 y volver a entrar al ciclo.

- [ ] **Step 7: Commit**

```bash
git status
git diff
git add src/domain/sessionGroups.ts tests/unit/domain/sessionGroups.test.ts
git diff --cached --name-only
git commit -m "feat: helpers de dominio para el carrusel de la sesión activa"
```

---

### Task 2: `SessionCarousel` + indicador + i18n

**Files:**
- Create: `src/components/workout/SessionCarousel.tsx`
- Create: `src/components/workout/SessionCarouselIndicator.tsx`
- Create: `tests/unit/components/sessionCarousel.test.tsx`
- Modify: `src/i18n/locales/es/workout.ts` (grupo `session`, junto a `superserie`)
- Modify: `src/i18n/locales/en/workout.ts` (mismas claves, en inglés)

**Interfaces:**
- Consumes (Task 1): `firstIncompleteGroupIndex`, `nextIncompleteGroupIndex`, `clampGroupIndex`, `groupExercises`, `isGroupComplete`, `ExerciseGroup<T>`.
- Produces (los usa Task 3; nombres y firmas congelados):
  - `SessionCarousel` — componente `memo` exportado; props `SessionCarouselProps`: mismas props que el retirado `SessionGroupListProps` (`exercises`, `prMap`, `showRpe`, `showRir`, `units`, `categoryFor`, `slugFor`, `noteFor`, `deloadActive?`, `bodyWeight?`, `loadAverages?`, `suggestions?`, `onSuggestionApply`, `onSuggestionWarmup`, `onCompleteExercise`, `onSetCompleted`, `onRemoveRequest`, `onSetRemoveRequest`).
  - DOM estable para e2e: contenedor con `role="region"` + `aria-label={t('session.carruselAria')}` ("Ejercicios de la sesión"), slides con `role="group"` + `aria-label` ("Ejercicio N de M: …" / "Superserie N de M: …"), contador en `p[aria-live="polite"]` dentro del `<section>` que envuelve al carrusel.
  - i18n: `session.carruselAria`, `session.contadorGrupos` (`{{actual}} de {{total}}`), `session.ejercicioDeGrupos` (`Ejercicio {{actual}} de {{total}}: {{nombre}}`), `session.superserieDeGrupos` (`Superserie {{actual}} de {{total}}: {{nombres}}`).

- [ ] **Step 1: Escribir el test de render que falla (RED)**

Crear `tests/unit/components/sessionCarousel.test.tsx`:

```tsx
// Render estático del carrusel de la sesión: slides montados (sin virtualización), agrupación
// de superserie y aria-labels. El scroll y el auto-avance se cubren en los e2e (aquí no hay DOM).
// (El warning de React sobre useLayoutEffect en SSR es esperado: renderToStaticMarkup no
// ejecuta effects; no afecta el resultado del test.)
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import '@/i18n'
import { SessionCarousel } from '@/components/workout/SessionCarousel'
import type { ActiveExercise, ActiveSet } from '@/store/activeWorkoutStore'
import type { PRRecord } from '@/domain/types'

const set = (id: string, completed: boolean): ActiveSet => ({
  id,
  exerciseId: 1,
  exerciseName: 'Fake',
  setNumber: 1,
  weightKg: 60,
  reps: 10,
  completed,
})

const ex = (
  exerciseId: number,
  exerciseName: string,
  supersetGroup: string | undefined,
  sets: ActiveSet[]
): ActiveExercise => ({ exerciseId, exerciseName, supersetGroup, sets })

const renderCarousel = (exercises: ActiveExercise[]) =>
  renderToStaticMarkup(
    <SessionCarousel
      exercises={exercises}
      prMap={new Map<number, PRRecord>()}
      showRpe={false}
      showRir={false}
      units="kg"
      categoryFor={() => 'strength'}
      slugFor={() => undefined}
      noteFor={() => undefined}
      onSuggestionApply={() => {}}
      onSuggestionWarmup={() => {}}
      onCompleteExercise={() => {}}
      onSetCompleted={() => {}}
      onRemoveRequest={() => {}}
      onSetRemoveRequest={() => {}}
    />
  )

describe('SessionCarousel', () => {
  it('monta un slide por grupo y el contador «N de M»', () => {
    const html = renderCarousel([
      ex(1, 'Press de banca', undefined, [set('s1', false)]),
      ex(2, 'Remo con barra', undefined, [set('s2', false)]),
    ])
    expect(html).toContain('Press de banca')
    expect(html).toContain('Remo con barra')
    expect(html).toContain('1 de 2')
    expect(html).toContain('Ejercicio 1 de 2: Press de banca')
  })

  it('agrupa la superserie en UN slide con su badge y su aria-label', () => {
    const html = renderCarousel([
      ex(1, 'Press de banca', 'A', [set('s1', false)]),
      ex(2, 'Remo con barra', 'A', [set('s2', false)]),
      ex(3, 'Curl de bíceps', undefined, [set('s3', false)]),
    ])
    expect(html).toContain('Superserie A')
    expect(html).toContain('Superserie 1 de 2: Press de banca, Remo con barra')
    expect(html).toContain('Ejercicio 2 de 2: Curl de bíceps')
  })
})
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `npm test -- tests/unit/components/sessionCarousel.test.tsx`
Expected: FAIL — `Failed to resolve import "@/components/workout/SessionCarousel"` (el componente no existe todavía).

- [ ] **Step 3: Agregar las claves i18n (es + en)**

En `src/i18n/locales/es/workout.ts`, dentro de `session` (justo después de `superserie: 'Superserie {{grupo}}',`):

```ts
    carruselAria: 'Ejercicios de la sesión',
    contadorGrupos: '{{actual}} de {{total}}',
    ejercicioDeGrupos: 'Ejercicio {{actual}} de {{total}}: {{nombre}}',
    superserieDeGrupos: 'Superserie {{actual}} de {{total}}: {{nombres}}',
```

En `src/i18n/locales/en/workout.ts`, dentro de `session` (justo después de `superserie: 'Superset {{grupo}}',`):

```ts
    carruselAria: 'Session exercises',
    contadorGrupos: '{{actual}} of {{total}}',
    ejercicioDeGrupos: 'Exercise {{actual}} of {{total}}: {{nombre}}',
    superserieDeGrupos: 'Superset {{actual}} of {{total}}: {{nombres}}',
```

- [ ] **Step 4: Crear el indicador**

Crear `src/components/workout/SessionCarouselIndicator.tsx`:

```tsx
// Indicador V2 del carrusel: contador «N de M» (slide en reposo) + barra segmentada por grupo.
// Los segmentos solo indican en v1 (no son clickeables): actual resaltado, completados
// encendidos, resto apagado.
import { useTranslation } from 'react-i18next'
import { isGroupComplete, type ExerciseGroup } from '@/domain/sessionGroups'
import type { ActiveExercise } from '@/store/activeWorkoutStore'

interface SessionCarouselIndicatorProps {
  groups: ExerciseGroup<ActiveExercise>[]
  activeIndex: number
}

export const SessionCarouselIndicator = ({ groups, activeIndex }: SessionCarouselIndicatorProps) => {
  const { t } = useTranslation()

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-3 px-1">
        <p className="kicker">{t('session.carruselAria')}</p>
        <p className="text-xs font-medium text-muted" aria-live="polite">
          {t('session.contadorGrupos', { actual: activeIndex + 1, total: groups.length })}
        </p>
      </div>
      <div className="flex gap-1 px-1" aria-hidden>
        {groups.map((group, index) => (
          <span
            key={group.key}
            className={`h-1 flex-1 rounded-full transition-colors ${
              index === activeIndex ? 'bg-cta' : isGroupComplete(group) ? 'bg-success' : 'bg-border'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Crear el carrusel**

Crear `src/components/workout/SessionCarousel.tsx`:

```tsx
// Carrusel horizontal de la sesión activa: un slide por grupo (ejercicio suelto o superserie)
// con indicador y auto-avance al siguiente grupo incompleto. Reemplaza a SessionGroupList:
// el auto-avance pasa de scrollIntoView a scrollTo del contenedor (refs por slide).
// Todos los slides quedan montados (sin virtualización) y `touch-action` deja libres ambos
// ejes, para que el scroll vertical de la página siga funcionando desde dentro del carrusel.
import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckCheck, Link2 } from 'lucide-react'
import { ExerciseBlock } from '@/components/workout/ExerciseBlock'
import { SessionCarouselIndicator } from '@/components/workout/SessionCarouselIndicator'
import {
  clampGroupIndex,
  firstIncompleteGroupIndex,
  groupExercises,
  isGroupComplete,
  nextIncompleteGroupIndex,
} from '@/domain/sessionGroups'
import type { ActiveExercise } from '@/store/activeWorkoutStore'
import type { Units } from '@/domain/settings'
import type { PRRecord, BodyWeightEntry } from '@/domain/types'
import type { SessionSuggestion } from '@/domain/sessionSuggestions'

interface SessionCarouselProps {
  exercises: ActiveExercise[]
  prMap: Map<number, PRRecord>
  showRpe: boolean
  showRir: boolean
  units: Units
  categoryFor: (exerciseId: number) => string | undefined
  slugFor: (exerciseId: number) => string | undefined
  noteFor: (exerciseId: number) => string | undefined
  deloadActive?: boolean
  // Peso corporal de hoy, consultado una sola vez a nivel de página (tarea 91.2).
  bodyWeight?: BodyWeightEntry
  // Promedio de carga reciente por ejercicio (F97.4), leído una sola vez a nivel de página.
  loadAverages?: Map<number, number>
  // Sugerencia en vivo por ejercicio (F98.2): Map estable calculado una vez en la página.
  suggestions?: Map<number, SessionSuggestion>
  onSuggestionApply: (exerciseId: number, amountKg: number) => void
  onSuggestionWarmup: (exerciseId: number, warmupWeightKg: number) => void
  onCompleteExercise: (exerciseId: number) => void
  onSetCompleted: (exerciseId: number, setId: string, completed: boolean) => void
  onRemoveRequest: (exerciseId: number) => void
  onSetRemoveRequest: (exerciseId: number, setId: string) => void
}

// Auto-avance suave salvo con prefers-reduced-motion (misma regla que F34c).
const carouselBehavior = (): ScrollBehavior =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'

export const SessionCarousel = memo(({
  exercises,
  prMap,
  showRpe,
  showRir,
  units,
  categoryFor,
  slugFor,
  noteFor,
  deloadActive,
  bodyWeight,
  loadAverages,
  suggestions,
  onSuggestionApply,
  onSuggestionWarmup,
  onCompleteExercise,
  onSetCompleted,
  onRemoveRequest,
  onSetRemoveRequest,
}: SessionCarouselProps) => {
  const { t } = useTranslation()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const slideRefs = useRef<(HTMLDivElement | null)[]>([])
  const scrollTimer = useRef<number | undefined>(undefined)
  // Estado del render anterior por clave de grupo: el auto-avance solo dispara en la
  // transición incompleto → completo (F34c); agregar un ejercicio al final no salta de slide.
  const completionRef = useRef<Map<string, boolean>>(new Map())
  const groups = useMemo(() => groupExercises(exercises), [exercises])
  const [activeIndex, setActiveIndex] = useState(() => firstIncompleteGroupIndex(groups))
  const groupCount = groups.length

  // Centra un slide en el carrusel. El contenedor es `relative`, así que offsetLeft se mide
  // contra él; el snap mandatory termina de ajustar cualquier diferencia a la posición exacta.
  const scrollToIndex = (index: number, behavior: ScrollBehavior) => {
    const container = containerRef.current
    const slide = slideRefs.current[index]
    if (!container || !slide) return
    container.scrollTo({
      left: slide.offsetLeft - (container.clientWidth - slide.clientWidth) / 2,
      behavior,
    })
  }

  // Arranque en el primer grupo incompleto (o el primero si no hay ninguno). useLayoutEffect
  // para que el salto inicial no se vea como un parpadeo desde el slide 0.
  useLayoutEffect(() => {
    const target = firstIncompleteGroupIndex(groups)
    setActiveIndex(target)
    scrollToIndex(target, 'auto')
    // Solo al montar: las mutaciones de grupos se atienden en los efectos de abajo.
  }, [])

  // Auto-avance (F34c): un grupo que pasa a completo desliza el carrusel al siguiente grupo
  // incompleto; si no queda ninguno después, no se mueve.
  useEffect(() => {
    const previous = completionRef.current
    const current = new Map<string, boolean>()
    let advanced = false
    groups.forEach((group, index) => {
      const complete = isGroupComplete(group)
      current.set(group.key, complete)
      if (advanced || previous.get(group.key) !== false || !complete) return
      const target = nextIncompleteGroupIndex(groups, index)
      if (target !== null) {
        scrollToIndex(target, carouselBehavior())
        advanced = true
      }
    })
    completionRef.current = current
  }, [groups])

  // Mutaciones: si quitar un ejercicio/serie vacía un grupo, el índice activo puede quedar
  // fuera de rango; se reposiciona al grupo válido más cercano (siguiente; si no, anterior).
  useEffect(() => {
    if (activeIndex < groupCount) return
    const target = clampGroupIndex(activeIndex, groupCount)
    setActiveIndex(target)
    scrollToIndex(target, 'auto')
  }, [activeIndex, groupCount])

  // El contador sigue al slide EN REPOSO: el índice se recalcula cuando el scroll se detiene
  // (fin del snap), nunca a mitad de swipe.
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const onScroll = () => {
      window.clearTimeout(scrollTimer.current)
      scrollTimer.current = window.setTimeout(() => {
        const center = container.scrollLeft + container.clientWidth / 2
        let best = 0
        let bestDistance = Number.POSITIVE_INFINITY
        groups.forEach((group, index) => {
          const slide = slideRefs.current[index]
          if (!slide) return
          const distance = Math.abs(slide.offsetLeft + slide.offsetWidth / 2 - center)
          if (distance < bestDistance) {
            bestDistance = distance
            best = index
          }
        })
        setActiveIndex(best)
      }, 90)
    }
    container.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      container.removeEventListener('scroll', onScroll)
      window.clearTimeout(scrollTimer.current)
    }
  }, [groups])

  return (
    <section className="space-y-1">
      <SessionCarouselIndicator groups={groups} activeIndex={activeIndex} />
      <div
        ref={containerRef}
        role="region"
        aria-label={t('session.carruselAria')}
        // pan-x pan-y (no el touch-pan-x de HScroll): el eje vertical queda libre para el
        // scroll de la página desde dentro del carrusel; pinch-zoom no se degrada.
        style={{ touchAction: 'pan-x pan-y pinch-zoom' }}
        className="scrollbar-hidden relative -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4"
      >
        {groups.map((group, index) => {
          const isSuper = group.label !== null
          const complete = isGroupComplete(group)
          return (
            <div
              key={group.key}
              ref={(el) => {
                slideRefs.current[index] = el
              }}
              role="group"
              aria-label={
                isSuper
                  ? t('session.superserieDeGrupos', {
                      actual: index + 1,
                      total: groupCount,
                      nombres: group.exercises.map((ex) => ex.exerciseName).join(', '),
                    })
                  : t('session.ejercicioDeGrupos', {
                      actual: index + 1,
                      total: groupCount,
                      nombre: group.exercises[0]?.exerciseName ?? '',
                    })
              }
              className={`w-[88%] shrink-0 snap-center ${
                isSuper
                  ? `space-y-3 rounded-2xl border p-2 ${
                      complete ? 'border-success/40 bg-success/5' : 'border-cta/40 bg-cta/5'
                    }`
                  : ''
              }`}
            >
              {isSuper && (
                <div className="flex items-center gap-2 px-2 pt-1">
                  <Link2 className="size-4 shrink-0 text-cta" aria-hidden />
                  <span className="font-display text-sm font-semibold uppercase tracking-wide text-accent-soft">
                    {t('session.superserie', { grupo: group.label })}
                  </span>
                  {complete ? (
                    <span className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-full border border-success/40 bg-success/10 px-2 py-0.5 text-[0.6rem] uppercase tracking-wide text-success">
                      <CheckCheck className="size-3" aria-hidden /> {t('session.completada')}
                    </span>
                  ) : null}
                </div>
              )}
              {group.exercises.map((ex) => (
                <ExerciseBlock
                  key={ex.exerciseId}
                  exerciseId={ex.exerciseId}
                  prMap={prMap}
                  showRpe={showRpe}
                  showRir={showRir}
                  units={units}
                  isCardio={categoryFor(ex.exerciseId) === 'cardio'}
                  exerciseSlug={slugFor(ex.exerciseId)}
                  note={noteFor(ex.exerciseId)}
                  deloadActive={deloadActive}
                  bodyWeight={bodyWeight}
                  recentTopSetAvgKg={loadAverages?.get(ex.exerciseId) ?? 0}
                  liveSuggestion={suggestions?.get(ex.exerciseId)}
                  onSuggestionApply={onSuggestionApply}
                  onSuggestionWarmup={onSuggestionWarmup}
                  onCompleteExercise={onCompleteExercise}
                  onSetCompleted={onSetCompleted}
                  onRemoveRequest={onRemoveRequest}
                  onSetRemoveRequest={onSetRemoveRequest}
                />
              ))}
            </div>
          )
        })}
      </div>
    </section>
  )
})
```

- [ ] **Step 6: Correr el test y verificar que pasa (GREEN)**

Run: `npm test -- tests/unit/components/sessionCarousel.test.tsx`
Expected: PASS — 2 tests verdes (con el warning esperado de `useLayoutEffect` en SSR).

- [ ] **Step 7: Verificación completa de la tarea**

Run: `npm run build`
Expected: build limpio (si falta una clave en `en`, el tipo `EsSchema` rompe acá — debe quedar verde).

Run: `npm test`
Expected: suite completa verde.

Run: `npm run lint`
Expected: exit 0, sin hallazgos nuevos.

- [ ] **Step 8: Ciclo de review (RDD)**

Run: `gentle-ai review status --cwd . --contract gentle-ai.review-integration/v2 --agent opencode --next-transition`
Expected: JSON con `next_transition` y `paths` con los 5 archivos de la tarea. Rutear **solo** desde `next_transition`. Si un hallazgo es real: corregir, repetir Step 7 y reintentar el ciclo.

- [ ] **Step 9: Commit**

```bash
git status
git diff
git add src/components/workout/SessionCarousel.tsx src/components/workout/SessionCarouselIndicator.tsx tests/unit/components/sessionCarousel.test.tsx src/i18n/locales/es/workout.ts src/i18n/locales/en/workout.ts
git diff --cached --name-only
git commit -m "feat: carrusel horizontal de la sesión activa con indicador de grupos"
```

---

### Task 3: Integración en `EntrenamientoPage` + barra fija + retiro de `SessionGroupList`

**Files:**
- Modify: `src/pages/EntrenamientoPage.tsx`
- Modify: `src/components/ui/UndoToast.tsx`
- Delete: `src/components/workout/SessionGroupList.tsx`

**Interfaces:**
- Consumes (Task 2): `SessionCarousel` con `SessionCarouselProps` (mismas props que hoy recibe `SessionGroupList`).
- Consumes (modificación de esta tarea): `UndoToast` acepta `offsetClass?: string` (default `bottom-[calc(4.5rem+env(safe-area-inset-bottom)+0.75rem)]`, el actual).
- Produces: la página `/entrenamiento/active` con carrusel + barra fija; `SessionGroupList` deja de existir.

- [ ] **Step 1: Reemplazar el import de la lista por el del carrusel**

En `src/pages/EntrenamientoPage.tsx`:

```tsx
import { SessionGroupList } from '@/components/workout/SessionGroupList'
```

→

```tsx
import { SessionCarousel } from '@/components/workout/SessionCarousel'
```

- [ ] **Step 2: Cambiar el padding inferior del contenido**

```tsx
      <div className="space-y-3 p-4 pb-8">
```

→

```tsx
      {/* Con barra fija, el contenido suma espacio inferior para que no tape el último slide. */}
      <div className={`space-y-3 p-4 ${exercises.length > 0 ? 'pb-40' : 'pb-8'}`}>
```

- [ ] **Step 3: Sustituir `SessionGroupList` por el carrusel (solo con ejercicios)**

Reemplazar:

```tsx
        <SessionGroupList
          exercises={exercises}
          prMap={prMap}
          showRpe={showRpe}
          showRir={showRir}
          units={units}
          categoryFor={categoryFor}
          slugFor={slugFor}
          noteFor={noteFor}
          deloadActive={deloadActive}
          bodyWeight={bodyWeight}
          loadAverages={loadAverages}
          suggestions={suggestions}
          onSuggestionApply={handleApplyWeight}
          onSuggestionWarmup={handleAddWarmup}
          onCompleteExercise={completeExercise}
          onSetCompleted={handleSetCompleted}
          onRemoveRequest={handleRemoveExercise}
          onSetRemoveRequest={handleRemoveSet}
        />
```

por:

```tsx
        {exercises.length > 0 && (
          <SessionCarousel
            exercises={exercises}
            prMap={prMap}
            showRpe={showRpe}
            showRir={showRir}
            units={units}
            categoryFor={categoryFor}
            slugFor={slugFor}
            noteFor={noteFor}
            deloadActive={deloadActive}
            bodyWeight={bodyWeight}
            loadAverages={loadAverages}
            suggestions={suggestions}
            onSuggestionApply={handleApplyWeight}
            onSuggestionWarmup={handleAddWarmup}
            onCompleteExercise={completeExercise}
            onSetCompleted={handleSetCompleted}
            onRemoveRequest={handleRemoveExercise}
            onSetRemoveRequest={handleRemoveSet}
          />
        )}
```

- [ ] **Step 4: Mover los dos botones a la barra fija (y dejar el de flujo solo en sesión vacía)**

Reemplazar el bloque actual:

```tsx
        <button
          onClick={openPicker}
          className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gold/40 bg-bg-elevated/50 text-sm font-medium text-muted transition-colors hover:border-cta hover:text-accent-soft"
        >
          <Plus className="size-5" />
          {t('session.anadirEjercicio')}
        </button>

        {exercises.length > 0 && (
          <Button
            size="lg"
            className="w-full"
            onClick={handleFinish}
            disabled={saving}
          >
            <Save className="size-5" />
            {saving ? t('session.guardando') : t('session.finalizarEntreno')}
          </Button>
        )}
      </div>
```

por:

```tsx
        {/* Sesión vacía: el alta va en flujo (la barra recién aparece con ≥1 ejercicio). */}
        {exercises.length === 0 && (
          <button
            onClick={openPicker}
            className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gold/40 bg-bg-elevated/50 text-sm font-medium text-muted transition-colors hover:border-cta hover:text-accent-soft"
          >
            <Plus className="size-5" />
            {t('session.anadirEjercicio')}
          </button>
        )}
      </div>

      {/* Barra fija sobre la TabBar global (patrón de RutinaDetailPage). */}
      {exercises.length > 0 && (
        <div className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 px-4 pb-3">
          <div className="mx-auto flex max-w-lg flex-col gap-2">
            <button
              onClick={openPicker}
              className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gold/40 bg-bg-elevated/95 text-sm font-medium text-muted backdrop-blur transition-colors hover:border-cta hover:text-accent-soft"
            >
              <Plus className="size-5" />
              {t('session.anadirEjercicio')}
            </button>
            <Button size="lg" className="w-full" onClick={handleFinish} disabled={saving}>
              <Save className="size-5" />
              {saving ? t('session.guardando') : t('session.finalizarEntreno')}
            </Button>
          </div>
        </div>
      )}
```

- [ ] **Step 5: `UndoToast` con offset configurable (no tapar la barra)**

En `src/components/ui/UndoToast.tsx`, reemplazar:

```tsx
export const UndoToast = () => {
```

por:

```tsx
type UndoToastProps = {
  // Offset inferior: por defecto sobre la TabBar global; las páginas con barra fija propia
  // (sesión activa) lo suben para no tapar sus botones.
  offsetClass?: string
}

const DEFAULT_OFFSET = 'bottom-[calc(4.5rem+env(safe-area-inset-bottom)+0.75rem)]'

export const UndoToast = ({ offsetClass = DEFAULT_OFFSET }: UndoToastProps) => {
```

y el contenedor:

```tsx
    <div className="fixed inset-x-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom)+0.75rem)] z-[90]">
```

→

```tsx
    <div className={`fixed inset-x-4 z-[90] ${offsetClass}`}>
```

- [ ] **Step 6: Pasar el offset elevado en la página y eliminar la lista vieja**

En `EntrenamientoPage.tsx`:

```tsx
      <UndoToast />
```

→

```tsx
      {/* Elevado sobre la barra fija (8.25rem de alto + gap) para no tapar sus botones. */}
      <UndoToast offsetClass="bottom-[calc(4.5rem+env(safe-area-inset-bottom)+9.5rem)]" />
```

Eliminar el archivo retirado:

```powershell
Remove-Item -LiteralPath "src\components\workout\SessionGroupList.tsx"
```

- [ ] **Step 7: Verificación**

Run: `npm run build`
Expected: build limpio (ya no existe ninguna referencia a `SessionGroupList`).

Run: `npm test`
Expected: suite completa verde.

Run: `npm run lint`
Expected: exit 0, sin hallazgos nuevos.

Run: `python tests/e2e/scripts/with_server.py tests/e2e/test_f63_suggestions.py`
Expected: `ALL OK` (las sugerencias dentro de los bloques siguen funcionando dentro de los slides; este test es la regresión directa del layout).
Nota: si el auto-scroll de Playwright pelea con `snap-mandatory` (clics que no se estabilizan), cambiar en `SessionCarousel.tsx` `snap-x snap-mandatory` → `snap-x snap-proximity` (la spec lo permite), repetir build/tests y este e2e.

- [ ] **Step 8: Ciclo de review (RDD)**

Run: `gentle-ai review status --cwd . --contract gentle-ai.review-integration/v2 --agent opencode --next-transition`
Expected: JSON con `next_transition` y `paths` con página, `UndoToast`, `SessionGroupList` (borrado) y `SessionCarousel`. Rutear **solo** desde `next_transition`. Si un hallazgo es real: corregir, repetir Step 7 y reintentar el ciclo.

- [ ] **Step 9: Commit**

```bash
git status
git diff
git add src/pages/EntrenamientoPage.tsx src/components/ui/UndoToast.tsx src/components/workout/SessionGroupList.tsx
git diff --cached --name-only
git commit -m "feat: integra el carrusel y la barra fija en la sesión activa"
```

---

### Task 4: e2e — re-scope de t22 + nuevo `test_f113_carrusel.py`

**Files:**
- Modify: `tests/e2e/test_f93_t22_quick.py`
- Create: `tests/e2e/test_f113_carrusel.py`

**Interfaces:**
- Consumes (Task 2/3): contenedor del carrusel `[aria-label="Ejercicios de la sesión"]`, slides `[role="group"]`, contador `p[aria-live="polite"]` dentro del `<section>` que envuelve al carrusel, barra fija con `button:has-text("Añadir ejercicio")` / `button:has-text("Finalizar entreno")`, toggle de serie `button[aria-label="Marcar completada"]`, sesión persistida en `localStorage['gymLab-activeWorkout']`.
- Produces: los dos e2e que valida la Task 5.

- [ ] **Step 1: Actualizar el docstring de t22**

En `tests/e2e/test_f93_t22_quick.py`, reemplazar la línea del docstring:

```python
- Sin scroll horizontal y sin errores de consola.
```

por:

```python
- F113: el carrusel de la sesión mide su propio desborde horizontal (y la página sigue sin
  scroll lateral), el swipe cambia de ejercicio y la barra fija de acciones queda visible.
- Sin errores de consola.
```

- [ ] **Step 2: Re-scopear la assertion horizontal y sumar la cobertura del carrusel**

En `tests/e2e/test_f93_t22_quick.py`, reemplazar:

```python
            # Sin scroll horizontal en la sesión activa
            sw = page.evaluate("() => document.documentElement.scrollWidth")
            cw = page.evaluate("() => document.documentElement.clientWidth")
            if sw > cw + 5:
                errors.append(f"sesión: scroll horizontal {sw} > {cw}")
            else:
                print("OK: sin scroll horizontal en la sesión")
```

por:

```python
            # F113: el carrusel es horizontal de verdad. La assertion mide el CARRUSEL
            # (scrollWidth vs clientWidth), no documentElement, y cubre swipe + barra fija.
            carousel = page.locator('[aria-label="Ejercicios de la sesión"]')
            if carousel.count() == 0:
                errors.append("sesión: no aparece el carrusel ('Ejercicios de la sesión')")
            else:
                slides = carousel.locator('[role="group"]')
                total = slides.count()
                sw = carousel.evaluate("el => el.scrollWidth")
                cw = carousel.evaluate("el => el.clientWidth")
                if total < 2 or sw <= cw + 5:
                    errors.append(f"carrusel: no desborda horizontalmente (slides={total}, {sw} vs {cw})")
                else:
                    print(f"OK: carrusel con {total} slides montados ({sw} > {cw})")

                # La página no gana scroll horizontal: el desborde queda contenido en el carrusel.
                page_sw = page.evaluate("() => document.documentElement.scrollWidth")
                page_cw = page.evaluate("() => document.documentElement.clientWidth")
                if page_sw > page_cw + 5:
                    errors.append(f"sesión: scroll horizontal de página {page_sw} > {page_cw}")
                else:
                    print("OK: sin scroll horizontal de página")

                # Indicador V2: contador «N de M» (arranca en 1) + aria por slide.
                section = page.locator("section").filter(has=carousel)
                counter = section.locator("p[aria-live='polite']")
                if counter.count() != 1 or counter.inner_text() != f"1 de {total}":
                    errors.append(
                        f"carrusel: contador inesperado ({counter.count()}): "
                        f"{counter.inner_text() if counter.count() else '—'}"
                    )
                else:
                    print(f"OK: contador '1 de {total}' visible")
                if not slides.first.get_attribute("aria-label"):
                    errors.append("carrusel: el primer slide no tiene aria-label")

                # Swipe/deslizamiento: el slide 2 entra en el viewport y el contador lo sigue.
                page.evaluate(
                    """() => {
                      const carousel = document.querySelector('[aria-label="Ejercicios de la sesión"]')
                      const slides = carousel.querySelectorAll('[role="group"]')
                      const slide = slides[1]
                      carousel.scrollTo({ left: slide.offsetLeft - (carousel.clientWidth - slide.clientWidth) / 2 })
                    }"""
                )
                page.wait_for_timeout(500)
                if counter.inner_text() != f"2 de {total}":
                    errors.append(f"carrusel: el contador no siguió el swipe ({counter.inner_text()})")
                else:
                    print(f"OK: el contador siguió el swipe ('2 de {total}')")
                box = slides.nth(1).bounding_box()
                carcass = carousel.bounding_box()
                if (
                    not box
                    or not carcass
                    or box["x"] >= carcass["x"] + carcass["width"]
                    or box["x"] + box["width"] <= carcass["x"]
                ):
                    errors.append("carrusel: el slide 2 no quedó visible tras el swipe")
                else:
                    print("OK: el slide 2 quedó visible tras el swipe")

                # Barra fija: añadir + finalizar visibles y sin duplicar el botón en flujo.
                add_btn = page.locator('button:has-text("Añadir ejercicio")')
                finish_btn = page.locator('button:has-text("Finalizar entreno")')
                if add_btn.count() != 1:
                    errors.append(f"barra fija: se esperaba 1 botón 'Añadir ejercicio', hay {add_btn.count()}")
                elif not add_btn.first.is_visible() or not finish_btn.first.is_visible():
                    errors.append("barra fija: añadir/finalizar no están visibles")
                else:
                    print("OK: barra fija con 'Añadir ejercicio' y 'Finalizar entreno'")
```

- [ ] **Step 3: Correr el t22 actualizado**

Run: `python tests/e2e/scripts/with_server.py tests/e2e/test_f93_t22_quick.py`
Expected: `ALL OK` (incluye los `OK:` nuevos del carrusel, el swipe y la barra fija).

- [ ] **Step 4: Crear el e2e específico de F113**

Crear `tests/e2e/test_f113_carrusel.py`:

```python
"""F113: carrusel horizontal de la sesión activa.

Escenarios:
A) Superserie: 2 ejercicios del mismo grupo ocupan UN slide (aria-label «Superserie 1 de 2»)
   y completar el grupo dispara el auto-avance F34c al siguiente grupo incompleto.
B) Arranque en el primer grupo incompleto: con el grupo 1 completo, el carrusel abre en el 2
   (también con prefers-reduced-motion activo).
C) prefers-reduced-motion: cubierto en B (el arranque sigue posicionando en el incompleto).
D) Sesión sin ejercicios: EmptyState + botón «Añadir ejercicio» en flujo, sin barra fija
   ni carrusel.

El seed reutiliza el patrón de test_f63_suggestions.py (localStorage + IndexedDB).
"""
import sys, os, json, datetime
sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"

NOW = datetime.datetime.now(datetime.timezone.utc).isoformat().replace("+00:00", "Z")

SEED_DB_JS = """async () => {
  const openDb = () => new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const db = await openDb();
  await new Promise((res, rej) => {
    const tx = db.transaction(['meta'], 'readwrite');
    tx.objectStore('meta').put({ key: 'onboardingDone', value: 'true' });
    // Pre-desbloquear el catálogo completo evita que un modal de logro tape la página al cargar.
    tx.objectStore('meta').put({ key: 'unlockedAchievements', value: JSON.stringify(['primer-paso', 'inaugural', 'primer-reto', 'racha-4', 'racha-8', 'primera-marca', 'volumen-semanal', 'sesiones-50', 'consistencia-4s', 'primera-cardio', 'ejercicios-100', 'racha-16', 'pr-10kg', 'guias-completas', 'sesiones-500', 'primer-ano']) });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  return true;
}"""


def exercise(exercise_id, name, superset, sets):
    data = {
        "exerciseId": exercise_id,
        "exerciseName": name,
        "sets": [
            {
                "id": set_id,
                "exerciseId": exercise_id,
                "exerciseName": name,
                "setNumber": index + 1,
                "weightKg": 60,
                "reps": 8,
                "completed": completed,
            }
            for index, (set_id, completed) in enumerate(sets)
        ],
    }
    if superset:
        data["supersetGroup"] = superset
    return data


def workout_storage(exercises):
    return json.dumps(
        {
            "state": {
                "workoutId": None,
                "startedAt": NOW,
                "routineId": None,
                "routineDayId": None,
                "exercises": exercises,
                "restSeconds": 90,
                "warmupSeen": True,  # evita el calentamiento guiado (no es el foco de F113)
            },
            "version": 0,
        }
    )


def superset_storage():
    return workout_storage([
        exercise(1, "Press de pecho con barra", "A", [("set-a1", False)]),
        exercise(3, "Remo con barra", "A", [("set-b1", False)]),
        exercise(2, "Sentadilla", None, [("set-c1", False)]),
    ])


def superset_complete_storage():
    return workout_storage([
        exercise(1, "Press de pecho con barra", "A", [("set-a1", True)]),
        exercise(3, "Remo con barra", "A", [("set-b1", True)]),
        exercise(2, "Sentadilla", None, [("set-c1", False)]),
    ])


def wait_for_no_overlay(page, timeout_ms=8000):
    """Espera a que desaparezcan los modales transitorios de hidratación."""
    deadline = timeout_ms
    while deadline > 0:
        if page.locator("div.fixed.inset-0").count() == 0:
            return True
        page.wait_for_timeout(250)
        deadline -= 250
    return page.locator("div.fixed.inset-0").count() == 0


def main():
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 375, "height": 812})
        page = context.new_page()
        console_errors = []
        page.on("console", lambda m: console_errors.append(f"console.{m.type}: {m.text}") if m.type == "error" else None)
        page.on("pageerror", lambda e: console_errors.append(f"pageerror: {e}"))

        try:
            page.add_init_script(f"""
              if (!localStorage.getItem('gymLab-activeWorkout')) {{
                localStorage.setItem('gymLab-activeWorkout', {json.dumps(superset_storage())});
              }}
            """)
            page.goto(BASE, wait_until="networkidle")
            seed = page.evaluate(SEED_DB_JS)
            assert seed is True, f"seed fallo: {seed}"
            page.goto(f"{BASE}/entrenamiento/active", wait_until="networkidle")
            page.wait_for_timeout(1200)
            assert wait_for_no_overlay(page), "un modal persistente bloquea la pantalla"

            carousel = page.locator('[aria-label="Ejercicios de la sesión"]')
            slides = carousel.locator('[role="group"]')
            section = page.locator("section").filter(has=carousel)
            counter = section.locator("p[aria-live='polite']")

            # A1) La superserie es UN slide (2 ejercicios) + suelto = 2 slides.
            if slides.count() != 2:
                errors.append(f"A: se esperaban 2 slides (superserie + suelto), hay {slides.count()}")
            else:
                print("OK A1: 2 slides (superserie + suelto)")

            # A2) aria-label del slide de superserie.
            first_label = slides.first.get_attribute("aria-label") or ""
            if not first_label.startswith("Superserie 1 de 2:") or "Press de pecho con barra" not in first_label:
                errors.append(f"A: aria-label de superserie inesperado: '{first_label}'")
            else:
                print(f"OK A2: aria-label de superserie ('{first_label}')")

            # A3) Badge de superserie visible.
            if page.locator("span", has_text="Superserie A").count() == 0:
                errors.append("A: no se ve el badge 'Superserie A'")
            else:
                print("OK A3: badge 'Superserie A' visible")

            # A4) touch-action con AMBOS ejes (no el pan-x de HScroll).
            touch = carousel.evaluate("el => getComputedStyle(el).touchAction")
            if "pan-x" not in touch or "pan-y" not in touch:
                errors.append(f"A: touch-action sin ambos ejes: {touch}")
            else:
                print(f"OK A4: touch-action '{touch}' permite pan horizontal y vertical")

            # A5) Contador inicial en el primer incompleto.
            if counter.inner_text() != "1 de 2":
                errors.append(f"A: contador inicial inesperado: '{counter.inner_text()}'")
            else:
                print("OK A5: contador inicial '1 de 2'")

            # A6) Completar UNA serie no avanza; completar el grupo entero SÍ (F34c).
            complete_buttons = slides.first.locator('button[aria-label="Marcar completada"]')
            if complete_buttons.count() != 2:
                errors.append(f"A: se esperaban 2 series pendientes en la superserie, hay {complete_buttons.count()}")
            else:
                complete_buttons.first.click(timeout=5000)
                page.wait_for_timeout(400)
                if counter.inner_text() == "2 de 2":
                    errors.append("A: el carrusel avanzó con el grupo AÚN incompleto")
                else:
                    print("OK A6: sin auto-avance con el grupo incompleto")
                # Tras completar la primera serie queda UNA pendiente en el grupo: se vuelve a
                # apuntar al primer botón (el locator es dinámico y su count bajó a 1).
                complete_buttons.first.click(timeout=5000)
                page.wait_for_timeout(1200)  # scroll suave + debounce del contador
                if counter.inner_text() != "2 de 2":
                    errors.append(f"A: el auto-avance F34c no llevó el contador a '2 de 2' (={counter.inner_text()})")
                else:
                    print("OK A7: auto-avance al siguiente grupo incompleto ('2 de 2')")
                box = slides.nth(1).bounding_box()
                carcass = carousel.bounding_box()
                if (
                    not box
                    or not carcass
                    or box["x"] >= carcass["x"] + carcass["width"]
                    or box["x"] + box["width"] <= carcass["x"]
                ):
                    errors.append("A: el slide 2 no quedó visible tras el auto-avance")
                else:
                    print("OK A8: slide 2 visible tras el auto-avance")

            # B) Arranque en el primer grupo incompleto, con reduced-motion activo.
            page.evaluate("(state) => localStorage.setItem('gymLab-activeWorkout', state)", superset_complete_storage())
            page.emulate_media(reduced_motion="reduce")
            page.reload(wait_until="networkidle")
            page.wait_for_timeout(1200)
            if counter.inner_text() != "2 de 2":
                errors.append(f"B: con el grupo 1 completo no abrió en el grupo 2 ('{counter.inner_text()}')")
            else:
                print("OK B1: arranque en el primer grupo incompleto con reduced-motion ('2 de 2')")
            page.emulate_media(reduced_motion="no-preference")

            # D) Sesión sin ejercicios: EmptyState + botón en flujo, sin barra fija ni carrusel.
            page.evaluate("(state) => localStorage.setItem('gymLab-activeWorkout', state)", workout_storage([]))
            page.reload(wait_until="networkidle")
            page.wait_for_timeout(1200)
            if page.locator('button:has-text("Finalizar entreno")').count() != 0:
                errors.append("D: la barra fija aparece sin ejercicios")
            elif page.locator('[aria-label="Ejercicios de la sesión"]').count() != 0:
                errors.append("D: el carrusel aparece sin ejercicios")
            elif page.locator('button:has-text("Añadir ejercicio")').count() != 1:
                errors.append("D: falta el botón 'Añadir ejercicio' en flujo con la sesión vacía")
            else:
                print("OK D: sesión vacía con botón en flujo y sin barra fija")

        except Exception as e:
            errors.append(f"Exception: {e}")
        finally:
            if console_errors:
                errors.extend(console_errors)
            page.close()
            browser.close()

    if errors:
        print("ERRORS:")
        for e in errors:
            print(f"  - {e}")
        sys.exit(1)
    else:
        print("\nALL OK")


if __name__ == "__main__":
    main()
```

- [ ] **Step 5: Correr el e2e nuevo**

Run: `python tests/e2e/scripts/with_server.py tests/e2e/test_f113_carrusel.py`
Expected: `ALL OK` con los `OK` A1–A8, B1 y D.

- [ ] **Step 6: Verificación de la tarea (los tests no cambian el bundle, pero la política del repo lo pide)**

Run: `npm run build`
Expected: build limpio.

Run: `npm test`
Expected: suite completa verde.

Run: `npm run lint`
Expected: exit 0, sin hallazgos nuevos.

- [ ] **Step 7: Ciclo de review (RDD)**

Run: `gentle-ai review status --cwd . --contract gentle-ai.review-integration/v2 --agent opencode --next-transition`
Expected: JSON con `next_transition` y `paths` con los dos archivos e2e. Rutear **solo** desde `next_transition`. Si un hallazgo es real: corregir, repetir Step 5–6 y reintentar el ciclo.

- [ ] **Step 8: Commit**

```bash
git status
git diff
git add tests/e2e/test_f93_t22_quick.py tests/e2e/test_f113_carrusel.py
git diff --cached --name-only
git commit -m "test(e2e): re-scopea el t22 y cubre el carrusel de la sesión activa"
```

---

### Task 5: Verificación completa + emulador + cierre de fase

**Files:**
- Modify: `PLAN.md`
- Modify: `CHANGELOG.md`
- Create (temporal, NO se commitea): `C:\Users\Yves De Faria\AppData\Local\Temp\opencode\f113\cdp_check.py`

**Interfaces:**
- Consumes: todo lo entregado en Tasks 1–4.
- Produces: F113 marcada como implementada en `PLAN.md`, entrada de cierre en `CHANGELOG.md`, evidencia del smoke de emulador. Si el smoke encuentra un defecto real: se corrige acá y se commitea **un commit nuevo** (nunca `amend`), con su propio ciclo de review antes de commitear.

- [ ] **Step 1: Verificación de build, tests y lint**

Run: `npm run build`
Expected: build limpio (`tsc -b` + Vite, exit 0).

Run: `npm test`
Expected: suite completa verde. Anotar el total (archivos/tests) para el CHANGELOG.

Run: `npm run lint`
Expected: exit 0, sin hallazgos nuevos.

- [ ] **Step 2: Regresión e2e de la sesión activa (spec de F113, punto 2)**

Ejecutar la lista completa, un test por corrida:

```powershell
$tests = @(
  'test_f63_suggestions.py',
  'test_f90.py',
  'test_f93_t2_warmup_persist.py',
  'test_f93_t20_technique.py',
  'test_f95.py',
  'test_f96_timer.py',
  'test_f98_enter_chain.py',
  'test_f98_memo_isolation.py',
  'test_f98_notes.py',
  'test_f98_picker_catalog.py',
  'test_f99_home_layout.py'
)
foreach ($t in $tests) {
  Write-Host "== $t =="
  python tests/e2e/scripts/with_server.py "tests/e2e/$t"
  if ($LASTEXITCODE -ne 0) { Write-Host "FALLO: $t" -ForegroundColor Red }
}
```

Expected: cada test imprime `ALL OK`. Si alguno falla: diagnosticar con `systematic-debugging` antes de tocar código.

- [ ] **Step 3: Regresión de rutas multi-segmento contra el bundle de producción**

Run: `python tests/e2e/scripts/with_server.py tests/e2e/test_rutas_multi_segmento.py --mode preview`
Expected: `ALL OK` (incluye `/entrenamiento/active` con carga directa).

- [ ] **Step 4: Emulador — receta de `AGENTS.md`**

```powershell
$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
npm run android:sync
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
.\android\gradlew.bat -p .\android assembleDebug
& $adb install -r android\app\build\outputs\apk\debug\app-debug.apk
& $adb shell am force-stop com.gymlab.app
& $adb shell am start -n com.gymlab.app/.MainActivity
Start-Sleep -Seconds 6
$appPid = (& $adb shell pidof com.gymlab.app).Trim()
& $adb forward tcp:9222 localabstract:webview_devtools_remote_$appPid
```

Expected: APK compilado e instalado; el `am start` abre la app. (Usar timeout largo para Gradle, ~600000 ms.)

- [ ] **Step 5: Smoke por CDP — montaje, ruta multi-segmento y toque**

Crear `C:\Users\Yves De Faria\AppData\Local\Temp\opencode\f113\cdp_check.py`:

```python
# Smoke F113 por CDP sobre el WebView de la app instalada en el emulador.
# Uso: python cdp_check.py  (requiere `adb forward tcp:9222 ...` y la app abierta)
# Criterio: root children > 0, texto visible, 0 pageerror, /entrenamiento/active navegable,
# swipe horizontal táctil y scroll vertical de página desde DENTRO del carrusel.
import json
from playwright.sync_api import sync_playwright

STORAGE = json.dumps({
    "state": {
        "workoutId": None,
        "startedAt": "2026-09-27T12:00:00Z",
        "routineId": None,
        "routineDayId": None,
        "exercises": [
            {"exerciseId": 1, "exerciseName": "Press de pecho con barra", "supersetGroup": "A",
             "sets": [{"id": "set-a1", "exerciseId": 1, "exerciseName": "Press de pecho con barra",
                       "setNumber": 1, "weightKg": 60, "reps": 8, "completed": False}]},
            {"exerciseId": 3, "exerciseName": "Remo con barra", "supersetGroup": "A",
             "sets": [{"id": "set-b1", "exerciseId": 3, "exerciseName": "Remo con barra",
                       "setNumber": 1, "weightKg": 60, "reps": 8, "completed": False}]},
            {"exerciseId": 2, "exerciseName": "Sentadilla", "sets": [
                {"id": "set-c1", "exerciseId": 2, "exerciseName": "Sentadilla",
                 "setNumber": 1, "weightKg": 80, "reps": 8, "completed": False}]},
        ],
        "restSeconds": 90,
        "warmupSeen": True,
    },
    "version": 0,
})

SEED_JS = """async () => {
  const openDb = () => new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const db = await openDb();
  await new Promise((res, rej) => {
    const tx = db.transaction(['meta'], 'readwrite');
    tx.objectStore('meta').put({ key: 'onboardingDone', value: 'true' });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  return true;
}"""

with sync_playwright() as p:
    browser = p.chromium.connect_over_cdp("http://localhost:9222")
    context = browser.contexts[0]
    page = context.pages[0]
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.wait_for_timeout(1500)

    # 1) La app monta (no pantalla negra) y hay texto.
    children = page.evaluate("document.getElementById('root').children.length")
    assert children > 0, "PANTALLA NEGRA: la app no montó"
    body = page.evaluate("document.body.innerText.slice(0, 200)")
    assert body.strip(), "body sin texto"

    # 2) Sembrar sesión activa + onboarding y recargar.
    page.evaluate(SEED_JS)
    page.evaluate("(state) => localStorage.setItem('gymLab-activeWorkout', state)", STORAGE)
    page.reload()
    page.wait_for_timeout(2500)

    # 3) Ruta multi-segmento navegable dentro de la app.
    page.evaluate(
        "window.history.pushState({}, '', '/entrenamiento/active');"
        "window.dispatchEvent(new PopStateEvent('popstate'))"
    )
    page.wait_for_timeout(1500)
    for label in ("Ya entreno aquí", "Cerrar", "Entendido"):
        btn = page.locator("button", has_text=label)
        if btn.count() > 0 and btn.first.is_visible():
            btn.first.click()
            page.wait_for_timeout(500)

    carousel = page.locator('[aria-label="Ejercicios de la sesión"]')
    assert carousel.count() > 0, "el carrusel no aparece en /entrenamiento/active"
    metrics = carousel.evaluate(
        "el => ({ sw: el.scrollWidth, cw: el.clientWidth, touch: getComputedStyle(el).touchAction })"
    )
    assert metrics["sw"] > metrics["cw"], f"el carrusel no es horizontal: {metrics}"
    assert "pan-x" in metrics["touch"] and "pan-y" in metrics["touch"], f"touch-action: {metrics}"
    print({"children": children, "carousel": metrics, "errors": errors})

    # 4) Deja el carrusel centrado en el viewport para los gestos táctiles.
    page.evaluate(
        "() => { const el = document.querySelector('[aria-label=\"Ejercicios de la sesión\"]');"
        " el.scrollIntoView({ block: 'center' }); }"
    )
    page.wait_for_timeout(600)
    box = carousel.bounding_box()
    assert box, "no se pudo medir el carrusel"
    px = int(box["x"] + box["width"] / 2)
    py = int(box["y"] + 40)
    session = context.new_cdp_session(page)

    # 5) Swipe horizontal táctil dentro del carrusel.
    before = carousel.evaluate("el => el.scrollLeft")
    session.send("Input.synthesizeScrollGesture", {
        "x": px, "y": py, "xDistance": -260, "yDistance": 0,
        "gestureSourceType": "touch", "speed": 800,
    })
    page.wait_for_timeout(900)
    after = carousel.evaluate("el => el.scrollLeft")
    assert after > before + 20, f"el swipe horizontal no movió el carrusel ({before} -> {after})"

    # 6) Scroll vertical de la página desde DENTRO del carrusel (pan-y).
    before_y = page.evaluate("window.scrollY")
    has_room_below = page.evaluate(
        "window.scrollY + window.innerHeight < document.documentElement.scrollHeight - 60"
    )
    session.send("Input.synthesizeScrollGesture", {
        "x": px, "y": py, "xDistance": 0, "yDistance": -320 if has_room_below else 320,
        "gestureSourceType": "touch", "speed": 800,
    })
    page.wait_for_timeout(900)
    after_y = page.evaluate("window.scrollY")
    assert abs(after_y - before_y) > 20, f"el scroll vertical de la página no funcionó desde el carrusel ({before_y} -> {after_y})"

    assert not errors, f"pageerrors: {errors}"
    print("SMOKE F113 OK: children=%s, swipe=%s->%s, scrollY=%s->%s" % (children, before, after, before_y, after_y))
```

- [ ] **Step 6: Correr el smoke**

Run: `python C:\Users\Yves De Faria\AppData\Local\Temp\opencode\f113\cdp_check.py`
Expected: `SMOKE F113 OK: children=1, ...` y lista de `errors` vacía. Criterio de aceptación completo: `root.children.length > 0`, texto visible, **0 `pageerror`**, `/entrenamiento/active` navegable, swipe horizontal y scroll vertical con toque.
Nota: si `Input.synthesizeScrollGesture` no estuviera disponible en el WebView, el script falla con excepción: en ese caso, verificar los dos gestos **a mano** en el emulador (swipe horizontal mueve slides; arrastre vertical desde dentro del carrusel scrollea la página) y anotar el resultado en el CHANGELOG como verificación manual; no saltar el criterio.

- [ ] **Step 7: Cerrar la fase en `PLAN.md`**

En `PLAN.md`, cambiar:

```markdown
### Fase 113 — Sesión activa: ejercicios en carrusel horizontal — PENDIENTE
```

por:

```markdown
### Fase 113 — Sesión activa: ejercicios en carrusel horizontal — IMPLEMENTADA ✅
```

y marcar el único checkbox de la fase:

```markdown
- [ ] **113.1 — Apartado de ejercicio como scroll/carrusel horizontal**: timer arriba, carrusel de ejercicios (cada slide = ejercicio + sugerencia adaptativa) en el medio, y debajo los botones que ya hay (añadir ejercicio, finalizar, etc.).
```

por:

```markdown
- [x] **113.1 — Apartado de ejercicio como scroll/carrusel horizontal**: timer arriba, carrusel de ejercicios (cada slide = ejercicio + sugerencia adaptativa) en el medio, y debajo los botones que ya hay (añadir ejercicio, finalizar, etc.).
```

- [ ] **Step 8: Cerrar la fase en `CHANGELOG.md`**

Bajo `## [Unreleased]` → `### Added`, insertar como **primer bullet** (los valores entre `«»` salen de los Steps 1–6; no inventarlos):

```markdown
- **Sesión activa: ejercicios en carrusel horizontal con barra fija (F113, `feat`)**: el apartado de ejercicios de la sesión activa deja de apilarse en vertical y pasa a un carrusel con snap — un slide por grupo (`groupExercises`): ejercicio suelto = un slide; superserie = un slide con sus bloques apilados y su badge, cada bloque con su propia sugerencia (`ExerciseBlock` intacto). Indicador V2 nuevo (`SessionCarouselIndicator`): contador «N de M» sobre el slide en reposo + barra segmentada (actual resaltado, completados encendidos); sin click en segmentos en v1. El auto-avance F34c se conserva en semántica (transición grupo → completo) pero pasa de `scrollIntoView` a `refs` por slide + `scrollTo` del contenedor, con `prefers-reduced-motion` → salto instantáneo y sin auto-salto al agregar un ejercicio al final (solo transiciones). El carrusel arranca en el primer grupo incompleto; al vaciarse un grupo por un borrado se reposiciona al válido más cercano (siguiente; si no, anterior). Los botones «Añadir ejercicio» y «Finalizar» van a una barra fija sobre la TabBar (patrón `RutinaDetailPage`, `z-40`) con `pb-40` de contenido y el `UndoToast` elevado en esa página (`offsetClass` nuevo); con la sesión vacía se mantiene el `EmptyState` y el alta en flujo. Touch con `touch-action: pan-x pan-y` (sin el `touch-pan-x` de `HScroll`) para que el scroll vertical de la página funcione desde dentro; sin virtualización (todos los slides montados) y sin scrollbars visibles; `SessionGroupList` se retira. Dominio puro nuevo en `sessionGroups.ts` (`firstIncompleteGroupIndex`/`nextIncompleteGroupIndex`/`clampGroupIndex`) con tests propios. i18n es/en `session.{carruselAria,contadorGrupos,ejercicioDeGrupos,superserieDeGrupos}`. Verificado: TDD rojo→verde (`tests/unit/domain/sessionGroups.test.ts` «N» tests; render estático «N» en `tests/unit/components/sessionCarousel.test.tsx`), `npm run build` limpio, `npm test` «N archivos / N tests», `npm run lint` exit 0, e2e re-scopeado `test_f93_t22_quick.py` + nuevo `test_f113_carrusel.py` ALL OK (superserie en un slide, swipe con contador, auto-avance al siguiente incompleto, arranque en el primer incompleto con reduced-motion, empty state sin barra fija) y regresión de la sesión activa (`test_f63_suggestions`, `test_f90`, `test_f93_t2_warmup_persist`, `test_f93_t20_technique`, `test_f95`, `test_f96_timer`, `test_f98_enter_chain`, `test_f98_memo_isolation`, `test_f98_notes`, `test_f98_picker_catalog`, `test_f99_home_layout`) ALL OK + rutas multi-segmento ALL OK contra el bundle de producción. Emulador (Pixel_10, CDP): `root.children > 0`, texto visible, 0 `pageerror`, `/entrenamiento/active` navegable, swipe horizontal y scroll vertical de página con toque desde dentro del carrusel.
```

- [ ] **Step 9: Review (excepción de docs) y commit de cierre**

Los cambios de esta tarea son **documentación puramente pasiva**: según `AGENTS.md`, se saltean el ciclo de review (basta un readback estructural). Si el smoke de los Steps 4–6 produjo **cambios de código**, esos van en un commit nuevo **antes** de este, con su propio ciclo RDD completo.

```bash
git status
git diff
git add PLAN.md CHANGELOG.md
git diff --cached --name-only
git commit -m "docs: cierra F113 (carrusel de la sesión activa) en PLAN.md y CHANGELOG"
```

- [ ] **Step 10: Persistir el hito en Engram (mandato del repo)**

`engram_remember` tipo `episodic`: qué se entregó (F113 completa), los hashes y mensajes de los commits de la fase, la verificación (build/test/lint/e2e/emulador) y el próximo paso del `PLAN.md`. No es un commit.

---

## Self-review del plan

**1. Cobertura de la spec** (sección → tarea):

| Requisito de la spec | Tarea |
|---|---|
| Slide = grupo; superserie en un slide con badge; sugerencia por bloque; `ExerciseBlock` sin cambios | Task 2 (render) + Task 4 (e2e A1–A3) |
| Auto-avance F34c al completarse un grupo; `prefers-reduced-motion`; reemplazo de `groupRefs`/`scrollIntoView` por refs + `scrollTo` | Task 1 (helpers) + Task 2 (efectos) + Task 4 (A6–A8, B1) |
| Layout A2: hero/nota/`RestTimer`/calculadora intactos y en flujo; sin scroll anidado vertical | Task 3 (solo cambia la lista y suma padding) |
| Barra fija sobre la TabBar (`bottom-[calc(4.5rem+env(safe-area-inset-bottom))]`, `z-40`), padding inferior, chequeo del `UndoToast` | Task 3 + Task 4 (barra visible) |
| Indicador V2: segmentos (completado/actual/resto) + «N de M» en reposo, no clickeables | Task 2 (`SessionCarouselIndicator`) + Task 4 (contador/swipe) |
| Slides `w-[88%] shrink-0 snap-center`; contenedor `snap-x mandatory`; peek; sin virtualización | Task 2 + Task 4 (desborde y slides montados) |
| Touch `pan-x pan-y` (no copiar `HScroll`); drag de escritorio por patrón global | Task 2 (inline `touchAction`) + Task 4 (A4) + Task 5 (gestos CDP) |
| Empty session: `EmptyState` + botón en flujo; barra solo con ≥1 ejercicio | Task 3 + Task 4 (D) |
| Arranque en el primer grupo incompleto; mutaciones (alta al final sin auto-salto; borrado → válido más cercano) | Task 1 + Task 2 (inicial, transición, clamp) + Task 4 (B1) |
| i18n es/en de «Ejercicios de la sesión», «N de M», «Ejercicio N de M: …» | Task 2 |
| Qué NO cambia: `useActiveSession`, store, dominio existente, `ExerciseBlock`, `RestTimer`, picker, finish, datos | Tasks 2/3 (solo agregan; cero cambios en esos archivos) + Global Constraints |
| e2e: t22 re-scopeado al carrusel + navegación entre ejercicios | Task 4 |
| Retiro de `SessionGroupList` | Task 3 |
| Verificación: build/test/lint, e2e de la lista, emulador, RDD por candidato | Task 5 (y ciclos por tarea) |

Sin requisitos huérfanos.

**2. Placeholder scan:** sin «TBD/TODO»; los valores de evidencia del CHANGELOG se completan desde salidas reales de los Steps 1–6 (indicado), no hay pasos sin código ni referencias a símbolos no definidos. Los únicos corchetes «N» son conteos medidos, no lógica sin escribir.

**3. Consistencia de tipos y nombres:** `firstIncompleteGroupIndex` / `nextIncompleteGroupIndex` / `clampGroupIndex` se definen en Task 1 y se consumen con esas firmas en Task 2; `SessionCarousel` + `SessionCarouselProps` (nombre y props) se definen en Task 2 y se consumen en Task 3; `UndoToast.offsetClass` se define y se usa en Task 3; las 4 claves i18n (`session.carruselAria`, `session.contadorGrupos`, `session.ejercicioDeGrupos`, `session.superserieDeGrupos`) se definen en Task 2 y son las que usan los tests unitarios y los e2e; los selectores e2e (`[aria-label="Ejercicios de la sesión"]`, `[role="group"]`, `p[aria-live='polite']`, `button[aria-label="Marcar completada"]`) coinciden con el markup de Task 2.
