# F101 — Onboarding guiado (tour + tips de primera vez + fix del wizard) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tour guiado de bienvenida (híbrido con spotlight), re-ver desde Ajustes, tips de primera vez por apartado y fix del scroll del wizard.

**Architecture:** Un motor de tour único montado en `AppShell` (sin portals, convención del repo): overlay `z-[140]` con spotlight (`box-shadow` gigante sobre el ancla `data-tour`), globo con controles y navegación guiada por `react-router`. Estado efímero en un store zustand; persistencia en la tabla `meta` (`tourDone`, `tourPending`, `sectionTipsSeen`) y un setting nuevo (`showSectionTips`). El mismo lenguaje visual sirve a los tips de primera vez (tarjeta breve arriba de la TabBar).

**Tech Stack:** Vite + React 18 + TypeScript, Tailwind v4, react-router-dom, Dexie (metaRepo), Zustand, vitest (unit), Playwright Python (e2e).

**Spec:** `docs/superpowers/specs/2026-09-27-f101-tour-onboarding-design.md`

## Global Constraints

- **Sin dependencias nuevas.** Stack fijo del repo.
- **Worktree aislado `f101`.** TODO comando corre con cwd `C:\Users\Yves De Faria\Desktop\ProyectoGymLab\.worktrees\f101\gymlab-app`. Un solo escritor. Stagear **rutas exactas** (nunca `git add -A` / `git add .` / `git stash`).
- **Antes de cada commit:** `npm run build` (typecheck real) + `npm test` (+ e2e de la tarea si aplica) y el **ciclo de review del candidato** (workspace diff) con `gentle-ai review status --cwd . --contract gentle-ai.review-integration/v2 --agent opencode --next-transition`, ruteando solo por el `next_transition` devuelto. Commits convencionales, **sin push**.
- **Copy de UI en es y en.** Agregar primero en `es` (el tipado `I18nKey` = `ParseKeys` lo exige); espejo obligatorio en `en` (paridad por compilador).
- Touch targets ≥ 44 px, respetar `prefers-reduced-motion`, nunca emoji como icono, sin scrollbars visibles.
- **Cronómetro de review:** mantener cada candidato ≤ ~400 líneas autoradas. Si un task se pasa, partirlo antes de commitear.
- Archivos < ~200 líneas cuando sea posible; funciones cortas; early returns.

**Mapa de tareas ↔ spec:**

| Task | WP | Ítems del plan | Spec |
|------|----|----------------|------|
| T1 | WP1a | dominio del tour + pending del wizard + setting | §1, §2 |
| T2 | WP1b | fix de scroll del wizard | §6 |
| T3 | WP2a | catálogo i18n del tour y tips | §3, §4 |
| T4 | WP2b | store efímero | §3 |
| T5 | WP2c | motor + overlay + anclas + gate | §2, §3 |
| T6 | WP3 | Ajustes → Ayuda (replay + toggle) | §5 |
| T7 | WP4 | tips de primera vez | §4 |
| T8 | WP5 | e2e completo + emulador + cierre | §7, §8 |

---

### Task 1: Dominio del tour + `tourPending` al terminar el onboarding

**Files:**
- Create: `src/domain/tour.ts`
- Create: `tests/unit/domain/tour.test.ts`
- Modify: `src/domain/settings.ts` (AppSettings + DEFAULT_SETTINGS)
- Modify: `src/components/onboarding/Onboarding.tsx` (import ~línea 26; write en `finish`, tras la línea 245)

**Interfaces:**
- Consumes: nada (es la base).
- Produces (para T5/T6/T7): `TOUR_DONE_META_KEY = 'tourDone'`, `TOUR_PENDING_META_KEY = 'tourPending'`, `SECTION_TIPS_SEEN_META_KEY = 'sectionTipsSeen'`, `SECTION_IDS`, `type SectionId`, `type SectionTipsSeen = Partial<Record<SectionId, true>>`, `TOUR_COVERED_SECTIONS: SectionId[]`, `shouldAutoStartTour({ onboardingDone, tourPending, tourDone }): boolean`, `sectionForPath(pathname: string): SectionId | null`, `markSectionsSeen(seen: SectionTipsSeen, ids: SectionId[]): SectionTipsSeen`; setting `showSectionTips: boolean` (default `true`).

- [ ] **Step 1: Escribir los tests que fallan**

`tests/unit/domain/tour.test.ts` (nuevo):

```ts
import { describe, expect, it } from 'vitest'
import {
  markSectionsSeen,
  sectionForPath,
  shouldAutoStartTour,
  TOUR_COVERED_SECTIONS,
} from '@/domain/tour'
import { DEFAULT_SETTINGS } from '@/domain/settings'

describe('shouldAutoStartTour', () => {
  it('arranca solo con setup completo, pending y sin ver', () => {
    expect(shouldAutoStartTour({ onboardingDone: true, tourPending: true, tourDone: false })).toBe(true)
  })
  it('no arranca sin setup completo (evita solaparse con el wizard)', () => {
    expect(shouldAutoStartTour({ onboardingDone: false, tourPending: true, tourDone: false })).toBe(false)
  })
  it('no arranca sin pending (usuarios existentes)', () => {
    expect(shouldAutoStartTour({ onboardingDone: true, tourPending: false, tourDone: false })).toBe(false)
  })
  it('no re-arranca si ya se vio', () => {
    expect(shouldAutoStartTour({ onboardingDone: true, tourPending: true, tourDone: true })).toBe(false)
  })
})

describe('sectionForPath', () => {
  it('mapea las raíces y sus subrutas', () => {
    expect(sectionForPath('/')).toBe('inicio')
    expect(sectionForPath('/rutinas')).toBe('rutinas')
    expect(sectionForPath('/rutinas/nueva')).toBe('rutinas')
    expect(sectionForPath('/estadisticas')).toBe('estadisticas')
    expect(sectionForPath('/logros')).toBe('logros')
    expect(sectionForPath('/mas')).toBe('mas')
    expect(sectionForPath('/perfil')).toBe('perfil')
  })
  it('no mapea secciones sin tip', () => {
    expect(sectionForPath('/calculadoras/imc')).toBeNull()
    expect(sectionForPath('/entrenamiento/active')).toBeNull()
  })
})

describe('markSectionsSeen', () => {
  it('marca sin mutar el mapa original', () => {
    const before = { inicio: true as const }
    const after = markSectionsSeen(before, ['rutinas', 'logros'])
    expect(after).toEqual({ inicio: true, rutinas: true, logros: true })
    expect(before).toEqual({ inicio: true })
  })
  it('el tour cubre las cinco secciones que explica', () => {
    expect(TOUR_COVERED_SECTIONS).toEqual(['inicio', 'rutinas', 'estadisticas', 'logros', 'mas'])
  })
})

describe('defaults de F101', () => {
  it('showSectionTips viene encendido', () => {
    expect(DEFAULT_SETTINGS.showSectionTips).toBe(true)
  })
})
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `npx vitest run tests/unit/domain/tour.test.ts`
Expected: FAIL — no existe `@/domain/tour` (y `DEFAULT_SETTINGS.showSectionTips` es `undefined`).

- [ ] **Step 3: Implementación mínima**

`src/domain/tour.ts` (nuevo):

```ts
// F101: tour guiado y tips de primera vez — claves de meta y helpers puros.
export const TOUR_DONE_META_KEY = 'tourDone'
export const TOUR_PENDING_META_KEY = 'tourPending'
export const SECTION_TIPS_SEEN_META_KEY = 'sectionTipsSeen'

export const SECTION_IDS = ['inicio', 'rutinas', 'estadisticas', 'logros', 'mas', 'perfil'] as const
export type SectionId = (typeof SECTION_IDS)[number]

export type SectionTipsSeen = Partial<Record<SectionId, true>>

// Secciones que el tour ya explica: al completarlo no repetimos sus tips.
export const TOUR_COVERED_SECTIONS: SectionId[] = ['inicio', 'rutinas', 'estadisticas', 'logros', 'mas']

// El tour automático corre una sola vez, después del setup (las tres condiciones juntas).
export const shouldAutoStartTour = ({
  onboardingDone,
  tourPending,
  tourDone,
}: {
  onboardingDone: boolean
  tourPending: boolean
  tourDone: boolean
}): boolean => onboardingDone && tourPending && !tourDone

// Ruta → sección de tips (por prefijo; `/` exacto es Inicio).
export const sectionForPath = (pathname: string): SectionId | null => {
  if (pathname === '/') return 'inicio'
  if (pathname.startsWith('/rutinas')) return 'rutinas'
  if (pathname.startsWith('/estadisticas')) return 'estadisticas'
  if (pathname.startsWith('/logros')) return 'logros'
  if (pathname.startsWith('/mas')) return 'mas'
  if (pathname.startsWith('/perfil')) return 'perfil'
  return null
}

export const markSectionsSeen = (seen: SectionTipsSeen, ids: SectionId[]): SectionTipsSeen => {
  const next: SectionTipsSeen = { ...seen }
  for (const id of ids) next[id] = true
  return next
}
```

`src/domain/settings.ts`:
- En `AppSettings` (junto a `showWeightHint`):

```ts
  showSectionTips: boolean
```

- En `DEFAULT_SETTINGS` (junto a `showWeightHint: false,`):

```ts
  showSectionTips: true,
```

`src/components/onboarding/Onboarding.tsx` — dos ediciones:
1. Import nuevo (después del bloque `} from '@/domain/onboarding'`):

```ts
import { TOUR_PENDING_META_KEY } from '@/domain/tour'
```

2. Dentro de `finish`, después de `await metaRepo.setJson(ONBOARDING_DONE_META_KEY, true)` y antes de `track('onboarding_completed', { withRoutine })`:

```ts
      // F101: el tour guiado se ofrece una sola vez al terminar el setup con rutina.
      if (withRoutine) await metaRepo.setJson(TOUR_PENDING_META_KEY, true)
```

- [ ] **Step 4: Correr los tests y verificar que pasan**

Run: `npx vitest run tests/unit/domain/tour.test.ts`
Expected: PASS (10 tests).

- [ ] **Step 5: Verificación completa + review del candidato**

Run: `npm run build` → limpio. `npm test` → suite verde.
Ciclo de review del candidato (workspace) antes de commitear, ruteando solo por el `next_transition` devuelto:

```powershell
gentle-ai review status --cwd . --contract gentle-ai.review-integration/v2 --agent opencode --next-transition
```

- [ ] **Step 6: Commit**

```bash
git add src/domain/tour.ts src/domain/settings.ts tests/unit/domain/tour.test.ts src/components/onboarding/Onboarding.tsx
git commit -m "feat(tour): dominio del tour y pending al terminar el onboarding (F101)"
```

---

### Task 2: Fix del scroll del wizard (101.6)

**Files:**
- Modify: `src/components/onboarding/Onboarding.tsx:278` (scroller) y `:283-285` (wrapper)
- Test: `tests/e2e/test_f101_wizard_scroll.py`

**Interfaces:**
- Consumes: nada.
- Produces: el wizard scrollea con gesto real sobre el fondo (la base del e2e completo de T8).

- [ ] **Step 1: Escribir el e2e que falla**

`tests/e2e/test_f101_wizard_scroll.py` (nuevo):

```python
"""F101 (101.6): el wizard del onboarding scrollea con gesto real sobre el fondo.

Causa original: el contenedor con overflow tenía `pointer-events-none`, así que un
wheel/touch fuera de la tarjeta no scrolleaba. Este test NO usa el auto-scroll de
Playwright: hace wheel sobre el fondo y exige que el contenedor scrollee y que el
CTA quede alcanzable y clickeable en 360x640.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"

SCROLLER_SELECTOR = 'div[role="dialog"][aria-modal="true"]'


def fill_generic_steps(page):
    # Paso 1 — Idioma.
    page.get_by_role("button", name="Español").click()
    page.get_by_role("button", name="Continuar").click()
    page.wait_for_timeout(300)
    # Paso 2 — Objetivo.
    page.get_by_role("button", name="Fuerza").click()
    page.get_by_role("button", name="Continuar").click()
    page.wait_for_timeout(300)
    # Paso 3 — Semana.
    page.get_by_role("button", name="3", exact=True).first.click()
    page.get_by_role("button", name="Gimnasio").click()
    page.get_by_role("button", name="Continuar").click()
    page.wait_for_timeout(300)
    # Paso 4 — Perfil válido (default kg; si la etiqueta difiere, ajustarla al label real).
    page.get_by_role("button", name="Hombre").click()
    page.get_by_label("Fecha de nacimiento").fill("1996-01-15")
    page.get_by_label("Altura en centímetros").fill("175")
    page.get_by_label("Peso en kg").fill("80")
    page.get_by_role("button", name="Continuar").click()
    page.wait_for_timeout(400)


def scroll_top(page):
    return page.evaluate("(sel) => document.querySelector(sel).scrollTop", SCROLLER_SELECTOR)


def main():
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 360, "height": 640})
        console_errors = []
        page.on(
            "console",
            lambda m: console_errors.append(f"console.{m.type}: {m.text}")
            if m.type == "error"
            else None,
        )
        page.on("pageerror", lambda e: console_errors.append(f"pageerror: {e}"))
        try:
            page.goto(BASE, wait_until="load")
            page.wait_for_timeout(1000)
            fill_generic_steps(page)
            page.wait_for_selector('input[type="checkbox"]', timeout=5000)

            # El paso Resumen debe desbordar este viewport: si no, el test no prueba nada.
            metric = page.evaluate(
                """(sel) => { const el = document.querySelector(sel); return { sh: el.scrollHeight, ch: el.clientHeight, top: el.scrollTop }; }""",
                SCROLLER_SELECTOR,
            )
            if metric["sh"] <= metric["ch"] + 40:
                errors.append(
                    f"wizard: el paso Resumen no desborda el viewport (scrollHeight={metric['sh']}, clientHeight={metric['ch']})"
                )

            # Gesto REAL de wheel sobre el fondo (x=6 está fuera de la tarjeta).
            page.mouse.move(6, 320)
            page.mouse.wheel(0, 500)
            page.wait_for_timeout(300)
            if scroll_top(page) <= metric["top"]:
                errors.append("wizard: el wheel sobre el fondo no scrollea (¿volvió pointer-events-none?)")

            # Rueda hasta que el CTA final quede alcanzable SIN auto-scroll de Playwright.
            for _ in range(12):
                box = page.get_by_role("button", name="Ya entreno aquí").last.bounding_box()
                if box and box["y"] >= 0 and box["y"] + box["height"] <= 640.5:
                    break
                page.mouse.wheel(0, 300)
                page.wait_for_timeout(150)
            else:
                errors.append("wizard: el CTA final no quedó alcanzable a 360x640 con gesto real")

            # Clic real tras el gesto (sin auto-scroll): cierra el wizard.
            page.get_by_role("button", name="Ya entreno aquí").last.click(timeout=3000)
            page.wait_for_url(f"{BASE}/", timeout=5000)
        except Exception as e:  # noqa: BLE001
            errors.append(str(e))
        finally:
            errors.extend(console_errors)
            page.close()
            browser.close()

    if errors:
        print("FALLO:")
        for e in errors:
            print(" -", e)
        return 1
    print("OK: F101.6 scroll del wizard alcanzable con gesto real a 360x640")
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

- [ ] **Step 2: Correr el e2e y verificar que falla**

Run: `python tests/e2e/scripts/with_server.py tests/e2e/test_f101_wizard_scroll.py`
Expected: FALLO — «el wheel sobre el fondo no scrollea (¿volvió pointer-events-none?)».

- [ ] **Step 3: Implementación mínima**

`src/components/onboarding/Onboarding.tsx` — scroller (línea 278), quitar `pointer-events-none` y agregar `overscroll-contain`:

```tsx
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto overscroll-contain bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t('onboarding.stepIdioma')}
    >
```

Wrapper (línea 285): quitar el `pointer-events-auto` ya redundante y actualizar el comentario:

```tsx
      {/* my-auto (no items-center solo) para que con contenido más alto que la pantalla
          el inicio sea alcanzable al hacer scroll; F101: el scroller recibe el gesto
          (antes pointer-events-none lo bloqueaba fuera de la tarjeta). */}
      <div className="my-auto w-full max-w-md">
```

- [ ] **Step 4: Correr el e2e y verificar que pasa**

Run: `python tests/e2e/scripts/with_server.py tests/e2e/test_f101_wizard_scroll.py`
Expected: `OK: F101.6 scroll del wizard alcanzable con gesto real a 360x640`

- [ ] **Step 5: Verificación completa + review del candidato**

Run: `npm run build` y `npm test` → limpios. Regresión del wizard: `python tests/e2e/scripts/with_server.py tests/e2e/test_f44.py` → sigue OK. Review del candidato (comando de T1, paso 5) antes de commitear.

- [ ] **Step 6: Commit**

```bash
git add src/components/onboarding/Onboarding.tsx tests/e2e/test_f101_wizard_scroll.py
git commit -m "fix(onboarding): el wizard scrollea con gesto real sobre el fondo (F101.6)"
```

**Pendiente de esta tarea (se verifica en T8):** teclado/IME nativo en el emulador. Si el IME tapa el CTA en el paso Perfil, aplicar el fix mínimo con evidencia (p. ej. `scrollIntoView` del campo enfocado); no antes.

---

### Task 3: Catálogo i18n del tour y los tips

**Files:**
- Create: `src/i18n/tour.ts`
- Create: `src/i18n/locales/es/tour.ts`
- Create: `src/i18n/locales/en/tour.ts`
- Modify: `src/i18n/locales/es/index.ts`, `src/i18n/locales/en/index.ts`
- Test: `tests/unit/i18n/tourCatalog.test.ts`

**Interfaces:**
- Consumes: `SectionId` de `@/domain/tour` (T1).
- Produces (para T5/T6/T7): `TOUR_STEPS: TourStep[]` (`{ id, route, anchor?, bodyKey }`), `type TourStepId`, `SECTION_TIPS: Record<SectionId, { bodyKey: I18nKey }>`, y el namespace `tour.*` (ui/steps/tips) en es y en.

- [ ] **Step 1: Escribir el test que falla**

`tests/unit/i18n/tourCatalog.test.ts` (nuevo):

```ts
import { describe, expect, it } from 'vitest'
import { SECTION_TIPS, TOUR_STEPS } from '@/i18n/tour'
import { SECTION_IDS } from '@/domain/tour'
import { es } from '@/i18n/locales/es'
import { en } from '@/i18n/locales/en'

const getByPath = (obj: unknown, path: string): unknown =>
  path
    .split('.')
    .reduce<unknown>(
      (acc, part) => (acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[part] : undefined),
      obj,
    )

describe('catálogo del tour', () => {
  it('cada paso tiene id único, ruta absoluta y copy no vacío en es y en', () => {
    const ids = new Set(TOUR_STEPS.map((s) => s.id))
    expect(ids.size).toBe(TOUR_STEPS.length)
    for (const step of TOUR_STEPS) {
      expect(step.route.startsWith('/')).toBe(true)
      for (const locale of [es, en]) {
        const value = getByPath(locale, step.bodyKey)
        expect(typeof value).toBe('string')
        expect((value as string).trim().length).toBeGreaterThan(0)
      }
    }
  })

  it('todas las secciones con tip tienen copy no vacío en es y en', () => {
    for (const id of SECTION_IDS) {
      for (const locale of [es, en]) {
        const value = getByPath(locale, SECTION_TIPS[id].bodyKey)
        expect(typeof value).toBe('string')
        expect((value as string).trim().length).toBeGreaterThan(0)
      }
    }
  })
})
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `npx vitest run tests/unit/i18n/tourCatalog.test.ts`
Expected: FAIL — no existe `@/i18n/tour`.

- [ ] **Step 3: Implementación**

`src/i18n/tour.ts` (nuevo):

```ts
// F101: catálogo del tour guiado y de los tips de primera vez.
// Igual que help.ts: si una clave no existe en el esquema `es`, no compila.
import type { I18nKey } from '@/i18n'
import type { SectionId } from '@/domain/tour'

export type TourStepId =
  | 'bienvenida'
  | 'dia'
  | 'empezar'
  | 'tabbar'
  | 'rutinas'
  | 'estadisticas'
  | 'logros'
  | 'cierre'

export interface TourStep {
  id: TourStepId
  route: string
  // Ancla `data-tour` a resaltar; sin ancla el paso cae a globo centrado.
  anchor?: string
  bodyKey: I18nKey
}

export const TOUR_STEPS: TourStep[] = [
  { id: 'bienvenida', route: '/', bodyKey: 'tour.steps.bienvenida' },
  { id: 'dia', route: '/', anchor: 'home-hero', bodyKey: 'tour.steps.dia' },
  { id: 'empezar', route: '/', anchor: 'home-start', bodyKey: 'tour.steps.empezar' },
  { id: 'tabbar', route: '/', anchor: 'tabbar', bodyKey: 'tour.steps.tabbar' },
  { id: 'rutinas', route: '/rutinas', anchor: 'rutinas-main', bodyKey: 'tour.steps.rutinas' },
  { id: 'estadisticas', route: '/estadisticas', anchor: 'stats-tabs', bodyKey: 'tour.steps.estadisticas' },
  { id: 'logros', route: '/logros', anchor: 'logros-progress', bodyKey: 'tour.steps.logros' },
  { id: 'cierre', route: '/mas', anchor: 'mas-list', bodyKey: 'tour.steps.cierre' },
]

// Tips breves por sección: qué podés conseguir ahí (una sola vez).
export const SECTION_TIPS: Record<SectionId, { bodyKey: I18nKey }> = {
  inicio: { bodyKey: 'tour.tips.inicio' },
  rutinas: { bodyKey: 'tour.tips.rutinas' },
  estadisticas: { bodyKey: 'tour.tips.estadisticas' },
  logros: { bodyKey: 'tour.tips.logros' },
  mas: { bodyKey: 'tour.tips.mas' },
  perfil: { bodyKey: 'tour.tips.perfil' },
}
```

`src/i18n/locales/es/tour.ts` (nuevo):

```ts
// F101: copy del tour guiado y de los tips de primera vez (es).
export const tour = {
  ui: {
    aria: 'Tour guiado de la app',
    skip: 'Saltar tour',
    prev: 'Atrás',
    next: 'Siguiente',
    finish: 'Terminar',
    step: '{{current}} / {{total}}',
    tipLabel: 'Primera vez acá',
    tipDismiss: 'Entendido',
  },
  steps: {
    bienvenida: 'Bienvenido/a a GymLab. Te muestro la app en 1 minuto; podés saltearlo cuando quieras.',
    dia: 'Este es tu día: la rutina lista para entrenar.',
    empezar: 'Tocá Empezar y arranca la sesión: series, pesos, RIR, notas y descanso automático.',
    tabbar: 'Te movés desde acá: Entrenar, Rutinas, Estadísticas y Más.',
    rutinas: 'Tus rutinas: la activa, el catálogo y las tuyas. Podés editar días, ejercicios y descansos.',
    estadisticas: 'Tus números: volumen, PRs, medidas y periodización. Se llena con tus entrenos.',
    logros: 'Medallas por constancia y récords. Acá ves cuánto te falta para la próxima.',
    cierre: 'En Más: perfil, calculadoras, ajustes e informes. Listo, eso es la app.',
  },
  tips: {
    inicio: 'Tu día de hoy, el calendario de la semana y tu resumen. Todo lo importante, de un vistazo.',
    rutinas: 'La rutina activa, el catálogo y tus rutinas propias: editá días, ejercicios y descansos.',
    estadisticas: 'Tu progreso: volumen, PRs, medidas y periodización. Se llena solo con tus entrenos.',
    logros: 'Medallas y retos por constancia y récords. Mirá lo que te falta para la próxima.',
    mas: 'El hub: tu perfil, calculadoras, informes, ajustes e importación de datos.',
    perfil: 'Tu historial de entrenos, medidas corporales y datos personales.',
  },
}
```

`src/i18n/locales/en/tour.ts` (nuevo):

```ts
// F101: guided tour and first-time tips copy (en).
export const tour = {
  ui: {
    aria: 'App guided tour',
    skip: 'Skip tour',
    prev: 'Back',
    next: 'Next',
    finish: 'Done',
    step: '{{current}} / {{total}}',
    tipLabel: 'First time here',
    tipDismiss: 'Got it',
  },
  steps: {
    bienvenida: 'Welcome to GymLab. A one-minute tour of the app; you can skip it anytime.',
    dia: 'This is your day: your routine ready to train.',
    empezar: 'Tap Start and the session begins: sets, weights, RIR, notes and automatic rest.',
    tabbar: 'Navigate from here: Train, Routines, Stats and More.',
    rutinas: 'Your routines: the active one, the catalog and your own. Edit days, exercises and rests.',
    estadisticas: 'Your numbers: volume, PRs, measurements and periodization. It fills up as you train.',
    logros: 'Medals for consistency and records. See how far you are from the next one.',
    cierre: 'More holds your profile, calculators, settings and reports. That is the app.',
  },
  tips: {
    inicio: "Today's workout, the week calendar and your summary. Everything important at a glance.",
    rutinas: 'The active routine, the catalog and your own routines: edit days, exercises and rests.',
    estadisticas: 'Your progress: volume, PRs, measurements and periodization. Fills up as you train.',
    logros: 'Medals and challenges for consistency and records. See what the next one takes.',
    mas: 'The hub: your profile, calculators, reports, settings and data import.',
    perfil: 'Your workout history, body measurements and personal data.',
  },
}
```

`src/i18n/locales/es/index.ts` — agregar `import { tour } from './tour'` arriba y la clave `tour,` después de `help,` en el objeto `es`.

`src/i18n/locales/en/index.ts` — agregar `import { tour } from './tour'` y `tour,` después de `help,` en el objeto `en`.

- [ ] **Step 4: Correr los tests y verificar que pasan**

Run: `npx vitest run tests/unit/i18n/tourCatalog.test.ts tests/unit/i18n/helpCatalog.test.ts`
Expected: PASS ambos (la paridad es/en de tipos la valida `npm run build`).

- [ ] **Step 5: Verificación completa + review del candidato**

Run: `npm run build` (falla si el espejo `en` no compila) y `npm test`. Review del candidato (comando de T1, paso 5) antes de commitear.

- [ ] **Step 6: Commit**

```bash
git add src/i18n/tour.ts src/i18n/locales/es/tour.ts src/i18n/locales/en/tour.ts src/i18n/locales/es/index.ts src/i18n/locales/en/index.ts tests/unit/i18n/tourCatalog.test.ts
git commit -m "feat(tour): catálogo de pasos y tips con copy es/en (F101)"
```

---

### Task 4: Store efímero del tour

**Files:**
- Create: `src/store/tourStore.ts`
- Test: `tests/unit/store/tourStore.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces (para T5/T6/T7): `useTourStore` con `{ source: 'auto' | 'replay' | null; start(source): void; close(): void }`; `type TourSource = 'auto' | 'replay'`.

- [ ] **Step 1: Escribir el test que falla**

`tests/unit/store/tourStore.test.ts` (nuevo):

```ts
import { beforeEach, describe, expect, it } from 'vitest'
import { useTourStore } from '@/store/tourStore'

describe('tourStore', () => {
  beforeEach(() => useTourStore.getState().close())

  it('arranca cerrado', () => {
    expect(useTourStore.getState().source).toBeNull()
  })

  it('start registra el origen (auto/replay)', () => {
    useTourStore.getState().start('auto')
    expect(useTourStore.getState().source).toBe('auto')
    useTourStore.getState().start('replay')
    expect(useTourStore.getState().source).toBe('replay')
  })

  it('close lo apaga', () => {
    useTourStore.getState().start('replay')
    useTourStore.getState().close()
    expect(useTourStore.getState().source).toBeNull()
  })
})
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `npx vitest run tests/unit/store/tourStore.test.ts`
Expected: FAIL — no existe `@/store/tourStore`.

- [ ] **Step 3: Implementación mínima**

`src/store/tourStore.ts` (nuevo):

```ts
// F101: estado efímero del tour guiado (auto tras el setup o repetido desde Ajustes).
// La persistencia (meta) la escriben los componentes que usan el store, no el store.
import { create } from 'zustand'

export type TourSource = 'auto' | 'replay'

export interface TourState {
  source: TourSource | null
  start: (source: TourSource) => void
  close: () => void
}

export const useTourStore = create<TourState>()((set) => ({
  source: null,
  start: (source) => set({ source }),
  close: () => set({ source: null }),
}))
```

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `npx vitest run tests/unit/store/tourStore.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Verificación completa + review del candidato**

Run: `npm run build` y `npm test`. Review del candidato antes de commitear.

- [ ] **Step 6: Commit**

```bash
git add src/store/tourStore.ts tests/unit/store/tourStore.test.ts
git commit -m "feat(tour): store efímero del tour (F101)"
```

---

### Task 5: Motor del tour — overlay, spotlight, gate y anclas

**Files:**
- Create: `src/components/tour/useTourAnchor.ts`
- Create: `src/components/tour/TourOverlay.tsx`
- Create: `src/components/tour/TourHost.tsx`
- Modify: `src/components/layout/AppShell.tsx` (import + montaje)
- Modify (anclas `data-tour`): `src/components/home/HeroCard.tsx`, `src/components/layout/TabBar.tsx`, `src/pages/RutinasPage.tsx`, `src/pages/EstadisticasPage.tsx`, `src/pages/AchievementsPage.tsx`, `src/pages/MasPage.tsx`

**Interfaces:**
- Consumes: T1 (`shouldAutoStartTour`, claves meta, `markSectionsSeen`, `TOUR_COVERED_SECTIONS`, `SectionTipsSeen`), T3 (`TOUR_STEPS`), T4 (`useTourStore`).
- Produces (para T7/T8): `<TourHost />` montado en AppShell (arranque automático + overlay); atributos `data-tour` en `home-hero`, `home-start`, `tabbar`, `rutinas-main`, `stats-tabs`, `logros-progress`, `mas-list`; `data-testid="tour-spotlight"` para el e2e.

- [ ] **Step 1: Implementar el hook de ancla**

`src/components/tour/useTourAnchor.ts` (nuevo):

```ts
// F101: espera el ancla del paso (data-tour) y devuelve su rect en viewport.
import { useEffect, useState } from 'react'

export type AnchorRect = { top: number; left: number; width: number; height: number } | null

const waitForAnchor = (anchor: string, timeoutMs = 1000): Promise<HTMLElement | null> =>
  new Promise((resolve) => {
    const started = Date.now()
    const tick = () => {
      const el = document.querySelector<HTMLElement>(`[data-tour="${anchor}"]`)
      if (el) return resolve(el)
      if (Date.now() - started > timeoutMs) return resolve(null)
      requestAnimationFrame(tick)
    }
    tick()
  })

// null = globo centrado: paso sin ancla, o ancla que no aparece (degradación elegante).
export const useTourAnchor = (anchor: string | undefined, stepId: string, active: boolean): AnchorRect => {
  const [rect, setRect] = useState<AnchorRect>(null)

  useEffect(() => {
    setRect(null)
    if (!active) return
    let el: HTMLElement | null = null
    let alive = true
    const measure = () => {
      if (!el) return
      const r = el.getBoundingClientRect()
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
    }
    const start = async () => {
      el = anchor ? await waitForAnchor(anchor) : null
      if (!alive || !el) return
      el.scrollIntoView({ block: 'center', behavior: 'auto' })
      measure()
    }
    void start()
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      alive = false
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [anchor, stepId, active])

  return rect
}
```

- [ ] **Step 2: Implementar el overlay**

`src/components/tour/TourOverlay.tsx` (nuevo):

```tsx
// F101: tour guiado de la app — atenúa la pantalla, resalta el ancla del paso
// (data-tour) y muestra el globo con la explicación. Navega solo entre secciones.
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { useCloseOnEscape } from '@/hooks/useCloseOnEscape'
import { useMetaValue } from '@/hooks/useMetaValue'
import { metaRepo } from '@/data/repositories'
import {
  markSectionsSeen,
  SECTION_TIPS_SEEN_META_KEY,
  TOUR_COVERED_SECTIONS,
  TOUR_DONE_META_KEY,
  TOUR_PENDING_META_KEY,
  type SectionTipsSeen,
} from '@/domain/tour'
import { TOUR_STEPS } from '@/i18n/tour'
import { useTourStore } from '@/store/tourStore'
import { useTourAnchor } from './useTourAnchor'

// Alto estimado del globo para decidir si va arriba o abajo del ancla.
const BUBBLE_EST_HEIGHT = 210
const BUBBLE_WIDTH = 320
const GAP = 12
const EDGE = 16

export const TourOverlay = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const source = useTourStore((s) => s.source)
  const close = useTourStore((s) => s.close)
  const seen = useMetaValue<SectionTipsSeen>(SECTION_TIPS_SEEN_META_KEY, {})
  const [stepIndex, setStepIndex] = useState(0)
  const bubbleRef = useRef<HTMLDivElement>(null)
  const restoreRef = useRef<HTMLElement | null>(null)

  const open = source !== null
  const step = TOUR_STEPS[Math.min(stepIndex, TOUR_STEPS.length - 1)]
  const isLast = stepIndex === TOUR_STEPS.length - 1
  const rect = useTourAnchor(step.anchor, step.id, open)

  // Al abrir: recuerda el foco previo y arranca del paso 1.
  useEffect(() => {
    if (!open) return
    restoreRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    setStepIndex(0)
  }, [open])

  // Foco devuelto al cerrar (una sola vez por apertura).
  useEffect(() => {
    if (!open) return
    return () => restoreRef.current?.focus?.()
  }, [open])

  // Guiado: cada paso navega a su ruta; el ancla se espera en useTourAnchor.
  useEffect(() => {
    if (open) navigate(step.route)
  }, [open, step.route, navigate])

  // Foco al globo en cada paso (el texto se anuncia por aria-live).
  useEffect(() => {
    if (open) bubbleRef.current?.focus()
  }, [open, stepIndex])

  // Cerrar es terminal: marcado visto y el pendiente se apaga (idempotente en replay).
  // Saltar no marca secciones cubiertas; terminar el recorrido sí.
  const endTour = async (markCovered: boolean) => {
    await metaRepo.setJson(TOUR_DONE_META_KEY, true)
    await metaRepo.setJson(TOUR_PENDING_META_KEY, false)
    if (markCovered) {
      await metaRepo.setJson(SECTION_TIPS_SEEN_META_KEY, markSectionsSeen(seen, TOUR_COVERED_SECTIONS))
    }
    close()
  }

  const handleSkip = () => {
    if (open) void endTour(false)
  }
  useCloseOnEscape(handleSkip, 'document')

  const handleFinish = () => {
    void endTour(true).then(() => navigate('/'))
  }

  // Globo debajo del ancla si hay espacio; si no, arriba; clamp lateral.
  const bubbleStyle = useMemo(() => {
    if (!rect) return undefined
    const width = Math.min(BUBBLE_WIDTH, window.innerWidth - EDGE * 2)
    const below = rect.top + rect.height + GAP + BUBBLE_EST_HEIGHT <= window.innerHeight - EDGE
    const top = below ? rect.top + rect.height + GAP : Math.max(EDGE, rect.top - GAP - BUBBLE_EST_HEIGHT)
    const left = Math.min(Math.max(rect.left, EDGE), Math.max(EDGE, window.innerWidth - width - EDGE))
    return { top, left, width }
  }, [rect])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[140]" role="dialog" aria-modal="true" aria-label={t('tour.ui.aria')}>
      {rect ? (
        // Spotlight: rect transparente con una sombra gigante que oscurece el resto.
        <div
          aria-hidden
          data-testid="tour-spotlight"
          className="pointer-events-none absolute rounded-2xl transition-[top,left,width,height] duration-200 ease-out"
          style={{
            top: rect.top - 8,
            left: rect.left - 8,
            width: rect.width + 16,
            height: rect.height + 16,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7)',
            outline: '2px solid rgba(217, 179, 132, 0.85)',
          }}
        />
      ) : (
        <div aria-hidden className="absolute inset-0 bg-black/70" />
      )}

      <div
        ref={bubbleRef}
        tabIndex={-1}
        className={`absolute outline-none ${rect ? '' : 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2'}`}
        style={bubbleStyle ?? { width: 'min(20rem, calc(100vw - 2rem))' }}
      >
        <div className="panel rounded-2xl border border-border p-4 shadow-2xl">
          <p aria-live="polite" className="text-sm leading-relaxed text-fg">
            {t(step.bodyKey)}
          </p>
          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="text-xs text-muted">
              {t('tour.ui.step', { current: stepIndex + 1, total: TOUR_STEPS.length })}
            </span>
            <div className="flex items-center gap-2">
              {stepIndex > 0 && (
                <Button variant="outline" size="sm" onClick={() => setStepIndex((i) => i - 1)}>
                  {t('tour.ui.prev')}
                </Button>
              )}
              <Button size="sm" onClick={isLast ? handleFinish : () => setStepIndex((i) => i + 1)}>
                {isLast ? t('tour.ui.finish') : t('tour.ui.next')}
              </Button>
            </div>
          </div>
          <div className="mt-1 text-right">
            <button
              type="button"
              onClick={handleSkip}
              className="min-h-[44px] px-2 text-xs text-muted underline transition-colors hover:text-accent-soft"
            >
              {t('tour.ui.skip')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Implementar el host con el gate y montarlo**

`src/components/tour/TourHost.tsx` (nuevo):

```tsx
// F101: host del tour — dispara el arranque automático (una vez, tras el setup) y monta el overlay.
import { useEffect } from 'react'
import { useMetaValue } from '@/hooks/useMetaValue'
import { ONBOARDING_DONE_META_KEY } from '@/domain/onboarding'
import { shouldAutoStartTour, TOUR_DONE_META_KEY, TOUR_PENDING_META_KEY } from '@/domain/tour'
import { useTourStore } from '@/store/tourStore'
import { TourOverlay } from './TourOverlay'

export const TourHost = () => {
  const onboardingDone = useMetaValue<boolean>(ONBOARDING_DONE_META_KEY, false)
  const pending = useMetaValue<boolean>(TOUR_PENDING_META_KEY, false)
  const done = useMetaValue<boolean>(TOUR_DONE_META_KEY, false)
  const start = useTourStore((s) => s.start)

  useEffect(() => {
    if (shouldAutoStartTour({ onboardingDone, tourPending: pending, tourDone: done })) {
      start('auto')
    }
  }, [onboardingDone, pending, done, start])

  return <TourOverlay />
}
```

`src/components/layout/AppShell.tsx`:
- Import: `import { TourHost } from '@/components/tour/TourHost'`
- Montar después del bloque `<Suspense>` con `<Onboarding />`:

```tsx
      <Suspense fallback={null}>
        <Onboarding />
      </Suspense>
      <TourHost />
```

- [ ] **Step 4: Agregar las anclas `data-tour`**

1. `src/components/home/HeroCard.tsx` — al `<section className="panel-hero reveal overflow-hidden rounded-3xl p-5 landscape:p-4">` agregar `data-tour="home-hero"`. Envolver **cada** botón de arranque (`onClick={onStart}`, ramas `todayDay` y `program`) en un `<div data-tour="home-start">` (el `Button` no acepta props `data-*` por tipos; el div mantiene el layout dentro de `space-y-3`):

```tsx
          ) : todayDay ? (
            <div data-tour="home-start">
              <Button size="md" className="w-full" onClick={onStart}>
                <Play className="size-5" fill="currentColor" />
                {todayDone ? t('home.entrenarOtraVez') : t('home.empezarHoy')}
              </Button>
            </div>
          ) : program ? (
            <div data-tour="home-start">
              <Button size="md" className="w-full" onClick={onStart}>
                <Play className="size-5" fill="currentColor" />
                {t('home.iniciarEntrenamiento')}
              </Button>
            </div>
```

2. `src/components/layout/TabBar.tsx` — al `<nav ...>` agregar `data-tour="tabbar"` (antes de `className`).
3. `src/pages/RutinasPage.tsx:84` — `<div className="overflow-hidden space-y-4 p-4 pb-8" data-tour="rutinas-main">`.
4. `src/pages/EstadisticasPage.tsx` — envolver el `<TabNav ...>…</TabNav>` en `<div data-tour="stats-tabs">`.
5. `src/pages/AchievementsPage.tsx` — envolver la fila `<div className="flex items-center justify-between">…</div>` + la barra `role="progressbar"` (líneas 44–68) en `<div data-tour="logros-progress">`.
6. `src/pages/MasPage.tsx:128` — `<div className="space-y-2 p-4" data-tour="mas-list">`.

- [ ] **Step 5: Verificación**

Run: `npm run build` (limpio) y `npm test` (verde). Smoke manual con `npm run dev`: completar el wizard → el tour abre solo en `/`, navega con Siguiente por `/rutinas` → `/estadisticas` → `/logros` → `/mas`, y Terminar vuelve a `/`. (El e2e automatizado llega en T8.)
Review del candidato antes de commitear.

- [ ] **Step 6: Commit**

```bash
git add src/components/tour/useTourAnchor.ts src/components/tour/TourOverlay.tsx src/components/tour/TourHost.tsx src/components/layout/AppShell.tsx src/components/home/HeroCard.tsx src/components/layout/TabBar.tsx src/pages/RutinasPage.tsx src/pages/EstadisticasPage.tsx src/pages/AchievementsPage.tsx src/pages/MasPage.tsx
git commit -m "feat(tour): motor guiado con spotlight, arranque único y anclas (F101.1/F101.2)"
```

---

### Task 6: Ajustes → Ayuda (repetir tour + toggle de tips) (101.3)

**Files:**
- Create: `src/components/settings/HelpSection.tsx`
- Modify: `src/components/settings/index.ts`, `src/pages/AjustesPage.tsx`, `src/i18n/locales/es/core.ts` (namespace `ajustes`), `src/i18n/locales/en/core.ts`

**Interfaces:**
- Consumes: T4 (`useTourStore.start('replay')`), T1 (`showSectionTips` en settings), T5 (`<TourHost />` escucha el store).
- Produces: sección «Ayuda» en Ajustes con la fila de replay y el toggle.

- [ ] **Step 1: i18n (es primero, espejo en)**

En `src/i18n/locales/es/core.ts`, dentro del bloque `ajustes` (junto a `general`/`datos`):

```ts
    ayuda: 'Ayuda',
    repetirTour: 'Volver a ver el tour',
    consejosPrimeraVez: 'Consejos de primera vez',
    consejosPrimeraVezDesc: 'Se muestran al entrar por primera vez a cada sección.',
```

En `src/i18n/locales/en/core.ts`, mismo lugar:

```ts
    ayuda: 'Help',
    repetirTour: 'Replay the tour',
    consejosPrimeraVez: 'First-time tips',
    consejosPrimeraVezDesc: 'Shown the first time you open each section.',
```

- [ ] **Step 2: Implementar la sección**

`src/components/settings/HelpSection.tsx` (nuevo):

```tsx
// F101: sección Ayuda — repetir el tour guiado y activar/desactivar los tips de primera vez.
import { useTranslation } from 'react-i18next'
import { LifeBuoy, ChevronRight } from 'lucide-react'
import { useSettings } from '@/hooks/useSettings'
import { useTourStore } from '@/store/tourStore'
import { SectionLabel, Toggle } from './SettingsUI'

export const HelpSection = () => {
  const { t } = useTranslation()
  const { settings, update } = useSettings()
  const startTour = useTourStore((s) => s.start)

  return (
    <section className="panel-light rounded-2xl p-4">
      <div className="flex items-center gap-2">
        <LifeBuoy className="size-4 text-accent" aria-hidden />
        <SectionLabel>{t('ajustes.ayuda')}</SectionLabel>
      </div>
      <button
        type="button"
        onClick={() => startTour('replay')}
        className="mt-2 flex min-h-[48px] w-full items-center justify-between rounded-xl border border-border bg-bg px-3 text-sm text-fg"
      >
        <span>{t('ajustes.repetirTour')}</span>
        <ChevronRight className="size-4 text-muted" />
      </button>
      <Toggle
        checked={settings.showSectionTips}
        onChange={(v) => void update({ showSectionTips: v })}
        label={t('ajustes.consejosPrimeraVez')}
        description={t('ajustes.consejosPrimeraVezDesc')}
      />
    </section>
  )
}
```

`src/components/settings/index.ts` — agregar:

```ts
export { HelpSection } from './HelpSection'
```

`src/pages/AjustesPage.tsx` — importar `HelpSection` del barrel y renderizarla entre `<GeneralSection />` y `<DataSection />`:

```tsx
        <GeneralSection />
        <HelpSection />
        <DataSection />
```

- [ ] **Step 3: Verificación**

Run: `npm run build` y `npm test`. Smoke manual: en `/ajustes`, «Volver a ver el tour» abre el tour desde el paso 1 (navega a `/`); el toggle apaga la aparición de tips al instante (a fondo en T8).
Review del candidato antes de commitear.

- [ ] **Step 4: Commit**

```bash
git add src/components/settings/HelpSection.tsx src/components/settings/index.ts src/pages/AjustesPage.tsx src/i18n/locales/es/core.ts src/i18n/locales/en/core.ts
git commit -m "feat(ajustes): sección Ayuda con repetir tour y toggle de tips (F101.3)"
```

---

### Task 7: Tips de primera vez por apartado (101.5)

**Files:**
- Create: `src/components/tour/SectionTipHost.tsx`
- Modify: `src/components/layout/AppShell.tsx` (montaje)

**Interfaces:**
- Consumes: T1 (`sectionForPath`, `markSectionsSeen`, `SECTION_TIPS_SEEN_META_KEY`, `SectionId`, `SectionTipsSeen`), T3 (`SECTION_TIPS`), T4 (`useTourStore`), T6 (`showSectionTips`), `useSettings`, `useMetaValue`.
- Produces: `<SectionTipHost />` montado en AppShell; la sección se marca vista al mostrarse.

- [ ] **Step 1: Implementar el host de tips**

`src/components/tour/SectionTipHost.tsx` (nuevo):

```tsx
// F101: tips de primera vez por apartado — tarjeta breve, una vez por sección.
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { metaRepo } from '@/data/repositories'
import { useMetaValue } from '@/hooks/useMetaValue'
import { useSettings } from '@/hooks/useSettings'
import { ONBOARDING_DONE_META_KEY } from '@/domain/onboarding'
import {
  markSectionsSeen,
  sectionForPath,
  SECTION_TIPS_SEEN_META_KEY,
  type SectionId,
  type SectionTipsSeen,
} from '@/domain/tour'
import { SECTION_TIPS } from '@/i18n/tour'
import { useTourStore } from '@/store/tourStore'

export const SectionTipHost = () => {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const { settings, loaded } = useSettings()
  const seen = useMetaValue<SectionTipsSeen>(SECTION_TIPS_SEEN_META_KEY, {})
  const onboardingDone = useMetaValue<boolean>(ONBOARDING_DONE_META_KEY, false)
  const tourOpen = useTourStore((s) => s.source !== null)
  const [activeTip, setActiveTip] = useState<SectionId | null>(null)

  const section = sectionForPath(pathname)

  // Al cambiar de ruta se oculta el tip anterior.
  useEffect(() => {
    setActiveTip(null)
  }, [pathname])

  // Entrada a una sección: si es la primera vez, se muestra y queda marcada
  // (mostrado = visto: no reaparece si te vas sin tocar «Entendido»). Nunca con el
  // wizard abierto (onboardingDone) ni con el tour en curso.
  useEffect(() => {
    if (!loaded || !onboardingDone || !settings.showSectionTips || !section || seen[section] || tourOpen) return
    setActiveTip(section)
    void metaRepo.setJson(SECTION_TIPS_SEEN_META_KEY, markSectionsSeen(seen, [section]))
  }, [pathname, loaded, onboardingDone, settings.showSectionTips, section, seen, tourOpen])

  if (!activeTip) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-[95] flex justify-center px-4">
      <div className="pointer-events-auto w-full max-w-lg rounded-2xl border border-border bg-bg-elevated p-4 shadow-xl">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent">{t('tour.ui.tipLabel')}</p>
        <p className="mt-1 text-sm leading-relaxed text-fg">{t(SECTION_TIPS[activeTip].bodyKey)}</p>
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={() => setActiveTip(null)}
            className="min-h-[44px] rounded-xl px-3 text-sm font-semibold text-accent-soft"
          >
            {t('tour.ui.tipDismiss')}
          </button>
        </div>
      </div>
    </div>
  )
}
```

`src/components/layout/AppShell.tsx`:
- Import: `import { SectionTipHost } from '@/components/tour/SectionTipHost'`
- Montar debajo del `<TourHost />`:

```tsx
      <TourHost />
      <SectionTipHost />
```

- [ ] **Step 2: Verificación**

Run: `npm run build` y `npm test`. Smoke manual: con `sectionTipsSeen` vacío, entrar a `/rutinas` muestra la tarjeta; «Entendido» la cierra; volver a entrar no la repite; con el toggle apagado no aparece.
Review del candidato antes de commitear.

- [ ] **Step 3: Commit**

```bash
git add src/components/tour/SectionTipHost.tsx src/components/layout/AppShell.tsx
git commit -m "feat(tour): tips de primera vez por apartado (F101.5)"
```

---

### Task 8: E2E del flujo completo + smoke de emulador + cierre de fase (101.4)

**Files:**
- Create: `tests/e2e/test_f101_tour.py`
- Modify: `PLAN.md`, `CHANGELOG.md`, `COMPLETED.md`

**Interfaces:**
- Consumes: todo lo anterior.
- Produces: cierre documental de F101 con evidencia.

- [ ] **Step 1: Escribir el e2e completo**

`tests/e2e/test_f101_tour.py` (nuevo):

```python
"""F101 (101.1–101.4): tour guiado — arranque único tras el setup, recorrido guiado,
replay desde Ajustes, tips de primera vez con toggle y salto sin marcar secciones."""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"

TOUR = 'div[role="dialog"][aria-label="Tour guiado de la app"]'
TIP_LABEL = "Primera vez acá"

SEED_PENDING_JS = """async () => {
  const db = await new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  await new Promise((res, rej) => {
    const tx = db.transaction('meta', 'readwrite');
    tx.objectStore('meta').put({ key: 'onboardingDone', value: 'true' });
    tx.objectStore('meta').put({ key: 'tourPending', value: 'true' });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  return true;
}"""

READ_META_JS = """async () => {
  const db = await new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const rows = await new Promise((res, rej) => {
    const q = db.transaction('meta', 'readonly').objectStore('meta').getAll();
    q.onsuccess = () => res(q.result);
    q.onerror = () => rej(q.error);
  });
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}"""


def f101_meta(page):
    raw = page.evaluate(READ_META_JS)
    out = {}
    for key in ("tourDone", "tourPending", "sectionTipsSeen"):
        if key in raw:
            try:
                out[key] = json.loads(raw[key])
            except (TypeError, ValueError):
                out[key] = raw[key]
    return out


def complete_wizard(page):
    page.get_by_role("button", name="Español").click()
    page.get_by_role("button", name="Continuar").click()
    page.wait_for_timeout(300)
    page.get_by_role("button", name="Fuerza").click()
    page.get_by_role("button", name="Continuar").click()
    page.wait_for_timeout(300)
    page.get_by_role("button", name="3", exact=True).first.click()
    page.get_by_role("button", name="Gimnasio").click()
    page.get_by_role("button", name="Continuar").click()
    page.wait_for_timeout(300)
    page.get_by_role("button", name="Hombre").click()
    page.get_by_label("Fecha de nacimiento").fill("1996-01-15")
    page.get_by_label("Altura en centímetros").fill("175")
    page.get_by_label("Peso en kg").fill("80")
    page.get_by_role("button", name="Continuar").click()
    page.wait_for_timeout(300)
    page.get_by_role("checkbox").check()
    page.get_by_role("button", name="Empezar D1").click()


def run_scenario_full_tour(page, errors):
    complete_wizard(page)
    page.wait_for_selector(TOUR, state="visible", timeout=6000)
    if "Te muestro la app en 1 minuto" not in page.locator(TOUR).inner_text():
        errors.append("tour: no muestra el paso de bienvenida")
    if "1 / 8" not in page.locator(TOUR).inner_text():
        errors.append("tour: el contador no arranca en 1 / 8")

    # Paso 2 — Tu día (spotlight sobre el hero).
    page.get_by_role("button", name="Siguiente").click()
    page.wait_for_timeout(500)
    if page.locator('[data-testid="tour-spotlight"]').count() != 1:
        errors.append("tour: el paso «tu día» no muestra spotlight sobre el hero")
    page.screenshot(path=os.path.join(os.path.dirname(__file__), "shots", "f101-tour-paso2.png"))

    # Pasos 3–4 (Empezar, TabBar) y salto a Rutinas.
    page.get_by_role("button", name="Siguiente").click()
    page.wait_for_timeout(300)
    page.get_by_role("button", name="Siguiente").click()
    page.wait_for_timeout(300)
    page.get_by_role("button", name="Siguiente").click()
    page.wait_for_url("**/rutinas", timeout=5000)
    page.wait_for_timeout(500)
    if page.get_by_text(TIP_LABEL).count() != 0:
        errors.append("tour: el tip de sección apareció durante el tour")

    # Pasos 6–8 (Estadísticas, Logros, Más) y Terminar.
    page.get_by_role("button", name="Siguiente").click()
    page.wait_for_url("**/estadisticas", timeout=5000)
    page.wait_for_timeout(400)
    page.get_by_role("button", name="Siguiente").click()
    page.wait_for_url("**/logros", timeout=5000)
    page.wait_for_timeout(400)
    page.get_by_role("button", name="Siguiente").click()
    page.wait_for_url("**/mas", timeout=5000)
    page.wait_for_timeout(400)
    page.get_by_role("button", name="Terminar").click()
    page.wait_for_url(f"{BASE}/", timeout=5000)
    page.wait_for_timeout(600)
    if page.locator(TOUR).count() != 0:
        errors.append("tour: no se cerró al terminar el recorrido")

    meta = f101_meta(page)
    if meta.get("tourDone") is not True:
        errors.append(f"tour: tourDone no quedó en true ({meta.get('tourDone')!r})")
    if meta.get("tourPending") is not False:
        errors.append(f"tour: tourPending no quedó en false ({meta.get('tourPending')!r})")
    seen = meta.get("sectionTipsSeen") or {}
    for section in ("inicio", "rutinas", "estadisticas", "logros", "mas"):
        if not seen.get(section):
            errors.append(f"tour: la sección {section} no quedó marcada como vista")

    # No re-arranca al recargar.
    page.reload(wait_until="load")
    page.wait_for_timeout(1500)
    if page.locator(TOUR).count() != 0:
        errors.append("tour: volvió a abrirse solo tras recargar")

    # Toggle OFF: /perfil (sección sin tip visto) no muestra tarjeta.
    page.goto(f"{BASE}/ajustes", wait_until="load")
    page.wait_for_timeout(800)
    page.get_by_role("switch", name="Consejos de primera vez").click()
    page.wait_for_timeout(400)
    page.goto(f"{BASE}/perfil", wait_until="load")
    page.wait_for_timeout(1000)
    if page.get_by_text(TIP_LABEL).count() != 0:
        errors.append("tips: apareció con el toggle apagado")

    # Toggle ON: /perfil muestra la tarjeta; Entendido la cierra y no vuelve.
    page.goto(f"{BASE}/ajustes", wait_until="load")
    page.wait_for_timeout(800)
    page.get_by_role("switch", name="Consejos de primera vez").click()
    page.goto(f"{BASE}/perfil", wait_until="load")
    page.wait_for_timeout(1000)
    if page.get_by_text(TIP_LABEL).count() == 0:
        errors.append("tips: no apareció la primera vez en /perfil")
    else:
        page.get_by_role("button", name="Entendido").click()
        page.wait_for_timeout(300)
        if page.get_by_text(TIP_LABEL).count() != 0:
            errors.append("tips: no se cerró con Entendido")
    page.reload(wait_until="load")
    page.wait_for_timeout(1000)
    if page.get_by_text(TIP_LABEL).count() != 0:
        errors.append("tips: reapareció en la segunda visita a /perfil")

    # Una sección cubierta por el tour no muestra tip (estadísticas quedó marcada).
    page.goto(f"{BASE}/estadisticas", wait_until="load")
    page.wait_for_timeout(1000)
    if page.get_by_text(TIP_LABEL).count() != 0:
        errors.append("tips: apareció en /estadisticas (ya cubierta por el tour)")

    # Replay desde Ajustes: abre de nuevo desde el paso 1 (navega a /).
    page.goto(f"{BASE}/ajustes", wait_until="load")
    page.wait_for_timeout(800)
    page.get_by_role("button", name="Volver a ver el tour").click()
    page.wait_for_selector(TOUR, state="visible", timeout=5000)
    page.wait_for_timeout(600)
    if "1 / 8" not in page.locator(TOUR).inner_text():
        errors.append("replay: no arranca en el paso 1")
    page.get_by_role("button", name="Saltar tour").click()
    page.wait_for_timeout(400)
    if page.locator(TOUR).count() != 0:
        errors.append("replay: Saltar no cerró el tour")


def run_scenario_skip(page, errors):
    page.goto(BASE, wait_until="load")
    page.wait_for_timeout(800)
    if page.evaluate(SEED_PENDING_JS) is not True:
        errors.append("skip: no se pudo sembrar el estado pendiente")
        return
    page.reload(wait_until="load")
    page.wait_for_timeout(1500)
    if page.locator(TOUR).count() == 0:
        errors.append("skip: el tour no arrancó con tourPending sembrado")
        return
    page.get_by_role("button", name="Saltar tour").click()
    page.wait_for_timeout(500)
    if page.locator(TOUR).count() != 0:
        errors.append("skip: Saltar no cerró el tour")
    meta = f101_meta(page)
    if meta.get("tourDone") is not True:
        errors.append("skip: tourDone no quedó en true")
    if (meta.get("sectionTipsSeen") or {}).get("inicio"):
        errors.append("skip: saltar el tour no debe marcar secciones como vistas")
    page.reload(wait_until="load")
    page.wait_for_timeout(1500)
    if page.locator(TOUR).count() != 0:
        errors.append("skip: volvió a abrirse tras saltar y recargar")
    # Tras saltar, el tip de una sección sí aparece en la primera visita.
    page.goto(f"{BASE}/rutinas", wait_until="load")
    page.wait_for_timeout(1000)
    if page.get_by_text(TIP_LABEL).count() == 0:
        errors.append("skip: /rutinas no mostró su tip tras saltar el tour")


def main():
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        # Escenario A — perfil limpio: wizard → tour → tips → replay.
        page_a = browser.new_page(viewport={"width": 375, "height": 812})
        console_errors_a = []
        page_a.on(
            "console",
            lambda m: console_errors_a.append(f"console.{m.type}: {m.text}") if m.type == "error" else None,
        )
        page_a.on("pageerror", lambda e: console_errors_a.append(f"pageerror: {e}"))
        try:
            page_a.goto(BASE, wait_until="load")
            page_a.wait_for_timeout(1200)
            run_scenario_full_tour(page_a, errors)
        except Exception as e:  # noqa: BLE001
            errors.append(f"[escenario A] {e}")
        finally:
            errors.extend(console_errors_a)
            page_a.close()

        # Escenario B — contexto nuevo: gate con flags sembrados y salto sin marcar.
        context_b = browser.new_context()
        page_b = context_b.new_page()
        console_errors_b = []
        page_b.on(
            "console",
            lambda m: console_errors_b.append(f"console.{m.type}: {m.text}") if m.type == "error" else None,
        )
        page_b.on("pageerror", lambda e: console_errors_b.append(f"pageerror: {e}"))
        try:
            run_scenario_skip(page_b, errors)
        except Exception as e:  # noqa: BLE001
            errors.append(f"[escenario B] {e}")
        finally:
            errors.extend(console_errors_b)
            page_b.close()
            context_b.close()

        browser.close()

    if errors:
        print("FALLO:")
        for e in errors:
            print(" -", e)
        return 1
    print("OK: F101 tour guiado completo (arranque, recorrido, replay, tips y skip)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

- [ ] **Step 2: Correr el e2e completo (y regresiones)**

Run:
```powershell
python tests/e2e/scripts/with_server.py tests/e2e/test_f101_tour.py
python tests/e2e/scripts/with_server.py tests/e2e/test_f101_wizard_scroll.py
python tests/e2e/scripts/with_server.py tests/e2e/test_f44.py
```
Expected: los tres `OK`. Si el e2e destapa un bug, corregirlo en su task de origen (nuevo commit) — no parchear en el e2e.

- [ ] **Step 3: Smoke en el emulador (teclado nativo + montaje nativo)**

Requisito del repo: la UI nativa no se da por probada con e2e web. Receta (AGENTS.md, el orden importa):

```powershell
# 0) adb no está en el PATH
$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
# 1) build web + copia a android/ (desde gymlab-app)
npm run android:sync
# 2) APK (JAVA_HOME al JBR de Android Studio)
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
.\android\gradlew.bat -p .\android assembleDebug
# 3) instalar y arrancar
& $adb install -r android\app\build\outputs\apk\debug\app-debug.apk
& $adb shell pm clear com.gymlab.app   # perfil limpio para ver el wizard (solo emulador de desarrollo)
& $adb shell am start -n com.gymlab.app/.MainActivity
# 4) inspeccionar el WebView por CDP
& $adb forward tcp:9222 localabstract:webview_devtools_remote_$(& $adb shell pidof com.gymlab.app)
```

Chequeos por CDP (`playwright.chromium.connect_over_cdp("http://localhost:9222")`):
1. `document.getElementById('root').children.length > 0`, body con texto y **0 `pageerror`**.
2. Navegar a una ruta **multi-segmento** (`/entrenamiento/active`) y repetir el chequeo (criterio anti-pantalla-negra).
3. Wizard a paso Perfil → enfocar «Peso en kg» → verificar que el CTA (`Continuar`) sigue alcanzable con el IME abierto; si el IME lo tapa, aplicar el fix mínimo con evidencia (p. ej. `scrollIntoView` al enfocar) en Onboarding y repetir.
4. Completar el wizard → el tour abre; navegar 2–3 pasos; Saltar; captura de pantalla.

Si el emulador no está disponible en el entorno: documentar explícitamente «pendiente de validación de release» — **no** marcar verificado solo con e2e web.

- [ ] **Step 4: Cerrar documentación**

- `PLAN.md`: marcar `[x]` 101.1–101.6 con una anotación breve cada uno y actualizar el encabezado de la fase (espejar cómo quedaron las fases cerradas recientes, p. ej. F98/F97).
- `CHANGELOG.md` (`[Unreleased]` → `### Added`), entradas propuestas:
  - `Tour guiado de bienvenida (F101): recorrido híbrido por Inicio, Rutinas, Estadísticas, Logros y Más, con navegación guiada, spotlight sobre la UI real y arranque único tras completar el onboarding.`
  - `Tips de primera vez por apartado (F101.5): tarjeta breve la primera vez que entrás a Inicio, Rutinas, Estadísticas, Logros, Más y Perfil; desactivables en Ajustes.`
  - `Ajustes → Ayuda (F101.3): «Volver a ver el tour» para repetirlo cuando quieras.`
  - `### Fixed` → `Wizard del onboarding: el paso Resumen se puede scrollear con gesto real sobre el fondo en pantallas chicas (F101.6).`
- `COMPLETED.md`: agregar la fila de la fase 101 con el resumen, commits y verificación (mismo formato que F95–F98).

- [ ] **Step 5: Verificación final + review del candidato + commit**

Run: `npm run build` + `npm test` + los tres e2e del Step 2. Review del candidato antes de commitear.

```bash
git add tests/e2e/test_f101_tour.py PLAN.md CHANGELOG.md COMPLETED.md
git commit -m "test(tour): e2e completo de F101 y cierre de fase (F101.4)"
```

---

## Cierre de fase (fuera del plan de tareas)

Con T1–T8 mergeados en la rama `f101`, el cierre multisesión del repo (AGENTS.md → «Ciclo de vida del worktree») queda a cargo del orquestador cuando las demás sesiones estén idle:

```powershell
git -C .worktrees\f101 rebase main
git merge --ff-only f101          # desde el repo principal
.\scripts\worktree.ps1 close f101
```
