# F90 — Ayuda contextual: catálogo, InfoTip accesible, estadísticas y RIR/RPE — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Completar F90: catálogo central de ayudas + `InfoTip` accesible (44 px, foco, botón cerrar, copy por id), ayuda en las métricas no obvias de estadísticas y en RIR/RPE (sesión y Ajustes).

**Architecture:** Namespace i18n `help.*` (es/en con paridad forzada por `EsSchema`) + registro tipado `HELP`/`HelpId` en `src/i18n/help.ts`. `InfoTip` migra a API por `id` (+ `values` de interpolación) conservando la vía legada `label` + children solo para `MeasurementField`. Los gráficos exponen `help`/`helpValues` vía `ChartCard`; todo umbral que aparezca en el copy se interpola desde constantes del dominio.

**Tech Stack:** React 18 + Vite + TypeScript · i18next · Tailwind v4 · Recharts · Vitest (node env, sin jsdom) · Playwright Python (e2e).

**Spec:** `docs/superpowers/specs/2026-09-25-f90-tooltips-ayuda-contextual-design.md`

## Global Constraints

- **Regla de copy:** todo número de un `body` se interpola desde constantes del dominio (existentes o exportadas en T2). Prohibido escribir umbrales a mano en los textos.
- **Paridad es/en:** `en/index.ts` está tipado `EsSchema` → si falta una clave, `npm run build` falla. Toda clave nueva va en ambos idiomas.
- **Sin dependencias nuevas.** Sin jsdom/testing-library: unit tests = lógica pura; comportamiento UI = e2e Playwright.
- **Copy UI:** es-ES con tuteo (como el resto de la app); inglés natural en `en`.
- **Verificación por tarea:** `npm run build` (typecheck REAL vía `tsc -b`; NUNCA `npx tsc --noEmit`) + `npm test` + e2e de la fase. Comandos con cwd `gymlab-app`.
- **Review Gentle AI antes de cada commit** (candidato = diff del workspace; ver AGENTS.md). **Commit sin push.**
- **Índice compartido:** stagear solo rutas exactas; nunca `git add -A`, `git add .` ni `git stash`.
- **Emulador: N/A** — no se toca código nativo ni router ni `vite.config.ts`.

---

## Task 1 (Commit 1 — F90.1): Catálogo central + InfoTip accesible + migración

**Files:**
- Create: `src/i18n/locales/es/help.ts`, `src/i18n/locales/en/help.ts`, `src/i18n/help.ts`, `src/components/ui/popoverPosition.ts`
- Create tests: `tests/unit/i18n/helpCatalog.test.ts`, `tests/unit/components/ui/popoverPosition.test.ts`
- Create e2e: `tests/e2e/test_f90.py`
- Modify: `src/i18n/locales/es/index.ts`, `src/i18n/locales/en/index.ts`, `src/components/ui/InfoTip.tsx`
- Modify (migración): `src/components/home/RecoveryScoreCard.tsx:125-131`, `src/components/profile/DeloadCard.tsx:88-90`, `src/components/insights/InsightCard.tsx:27-29/50-52/72-74`, `src/pages/GrasaCorporalPage.tsx:147-149`, `src/pages/MedidasCorporalesPage.tsx:113-115`
- Modify (limpieza i18n): `src/i18n/locales/es/core.ts` (322-323, 405-406, 480-481, 500-502), `src/i18n/locales/en/core.ts` (ídem), `src/i18n/locales/es/features.ts` (21-22, 25-26, 29-30), `src/i18n/locales/en/features.ts` (ídem)

**Interfaces (produce para Task 2 y 3):**
- `HELP_IDS: readonly HelpId[]`, `HelpId`, `HELP: Record<HelpId, { label: I18nKey; body: I18nKey }>`, `HelpValues = Record<string, string | number>` — desde `@/i18n/help`
- `<InfoTip id="…" values={…} />` | `<InfoTip label="…">children</InfoTip>` — desde `@/components/ui/InfoTip`
- `computePopoverPos(anchor, viewport): { top: number; left: number; maxHeight: number }` — desde `@/components/ui/popoverPosition`
- Claves i18n `help.<id>.label|body` para los 17 ids (los de stats y RIR/RPE se consumen en Tasks 2-3).

- [ ] **Step 1: Escribir el test de integridad del catálogo (debe fallar)**

Crear `tests/unit/i18n/helpCatalog.test.ts`:

```ts
// Integridad del catálogo central de ayudas (F90): cada id debe resolver
// label/body no vacíos en es y en (la paridad de claves la exige el compilador;
// esto valida además que el contenido no quede vacío).
import { describe, expect, it } from 'vitest'
import { HELP, HELP_IDS } from '@/i18n/help'
import { es } from '@/i18n/locales/es'
import { en } from '@/i18n/locales/en'

const getByPath = (obj: unknown, path: string): unknown =>
  path
    .split('.')
    .reduce<unknown>(
      (acc, part) => (acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[part] : undefined),
      obj,
    )

describe('catálogo de ayudas', () => {
  it.each(HELP_IDS)('«%s» tiene label y body no vacíos en es y en', (id) => {
    for (const locale of [es, en]) {
      for (const kind of ['label', 'body'] as const) {
        const value = getByPath(locale, HELP[id][kind])
        expect(typeof value).toBe('string')
        expect((value as string).trim().length).toBeGreaterThan(0)
      }
    }
  })
})
```

Run: `npx vitest run tests/unit/i18n/helpCatalog.test.ts`
Expected: FAIL — no existe `@/i18n/help`.

- [ ] **Step 2: Crear `src/i18n/locales/es/help.ts` (17 ids, literales completos)**

```ts
// Catálogo central de ayudas contextuales (F90). Cada entrada se consume con
// <InfoTip id="..."/>; el registro tipado vive en src/i18n/help.ts.
export const help = {
  recovery: {
    label: 'Cómo se calcula el score de recuperación',
    body: 'El score combina tu último entreno (días de descanso), el sueño, las agujetas y tu racha. Cada señal puntúa de 0 a 100 y se pondera según los datos disponibles. Rangos: 0–{{restMax}}, mejor descansa; {{maybeMin}}–{{maybeMax}}, podrías entrenar; {{readyMin}}–100, listo para entrenar.',
  },
  deload: {
    label: 'Qué es la semana de deload',
    body: 'Semana con menos carga para recuperarte y volver más fuerte: reduce el peso ({{pct}}%) manteniendo series y frecuencia. La marca se apaga sola a los 7 días; no cambia pesos ni series de tus rutinas.',
  },
  insightAlza: {
    label: 'Qué significa el volumen al alza',
    body: 'El volumen es la carga total semanal (kg: serie × peso). Subir más de un 5% frente a la semana anterior es buena señal; mantén la técnica y el descanso para sostenerlo.',
  },
  insightDescenso: {
    label: 'Qué significa el volumen en descenso',
    body: 'El volumen es la carga total semanal (kg: serie × peso). Una caída de más del 10% frente a la semana anterior puede indicar fatiga o menos constancia; es orientativo, escucha a tu cuerpo.',
  },
  insightEstable: {
    label: 'Qué significa el volumen estable',
    body: 'El volumen es la carga total semanal (kg: serie × peso). Se considera estable cuando varía menos de un ±10% frente a la semana anterior. Es solo informativo, no cambia tu plan.',
  },
  grasa: {
    label: 'Cómo se calcula el % de grasa',
    body: 'El % se estima con el protocolo Jackson-Pollock (7 pliegues, o 3 si faltan datos) y la ecuación de Siri. Es orientativo: depende de la técnica de la pinza, la hidratación y el observador.',
  },
  medidasCorporales: {
    label: 'Para qué registrar medidas',
    body: 'Mide siempre en los mismos puntos y a horas similares para que la evolución sea fiable. La app guarda un registro por día y calcula ratios de salud (cintura/altura, cintura/cadera) y simetría izquierda-derecha.',
  },
  volumen: {
    label: 'Cómo se calcula el volumen',
    body: 'El volumen es la suma de peso × repeticiones de tus series completadas. La app lo agrupa por semana (de lunes a domingo) para que veas si sube o baja frente a las semanas anteriores.',
  },
  volumenMuscular: {
    label: 'Cómo se reparte el volumen por músculo',
    body: 'Cada serie suma su peso × repeticiones al grupo muscular principal del ejercicio. El gráfico muestra qué proporción del volumen se llevó cada grupo en el periodo elegido.',
  },
  carga: {
    label: 'Qué es la carga por sesión',
    body: 'Cada punto resume una sesión: la línea sigue el peso máximo levantado en el ejercicio graficado (sin contar calentamientos). El punto dorado marca tu PR (mejor marca) en ese ejercicio.',
  },
  e1rm: {
    label: 'Qué es el 1RM estimado',
    body: 'Es el peso máximo que podrías levantar una sola vez, estimado con la fórmula de Brzycki (peso × 36 ÷ (37 − repeticiones)) a partir de tu mejor serie de cada sesión. El punto dorado resalta tu último registro.',
  },
  frecuencia: {
    label: 'Cómo se calcula la frecuencia',
    body: 'Cuenta cuántas veces entrenaste cada grupo muscular y lo compara con su objetivo semanal. Si te desvías más de un {{pct}}% del objetivo, aparece como alerta.',
  },
  pushPull: {
    label: 'Cómo se calcula el balance',
    body: 'Reparte tu volumen entre empuje (pecho, tríceps, hombro), tirón (espalda, bíceps, trapecios, antebrazo) y pierna (pierna, glúteo, abdomen). Si la diferencia entre empuje y tirón supera {{pct}} puntos, la app te avisa para equilibrar.',
  },
  imc: {
    label: 'Qué es el IMC',
    body: 'Relaciona tu peso y tu altura (peso ÷ altura²). Referencias: por debajo de {{bajo}}, bajo peso; de {{bajo}} a {{normal}}, normal; de {{normal}} a {{sobrepeso}}, sobrepeso; de {{sobrepeso}} en adelante, obesidad. Es orientativo, no reemplaza una valoración médica.',
  },
  ratios: {
    label: 'Qué significan los ratios',
    body: 'Cintura/altura: hasta {{whtrOk}} se considera saludable y por encima de {{whtrMedio}} el riesgo es alto. Cintura/cadera: por debajo de {{whrHombre}} en hombres y de {{whrMujer}} en mujeres se considera bajo. Son orientativos.',
  },
  rpe: {
    label: 'Qué es el RPE',
    body: 'Esfuerzo percibido de la serie: 10 es el máximo (no podías hacer ni una repetición más). La app lo usa para ajustar el descanso sugerido.',
  },
  rir: {
    label: 'Qué es el RIR',
    body: 'Repeticiones en reserva: cuántas repeticiones más podías haber hecho al terminar la serie. 0 significa que fuiste al fallo. Con RIR 0–1, la app suaviza el salto de peso que sugiere para la próxima serie.',
  },
} as const
```

- [ ] **Step 3: Crear `src/i18n/locales/en/help.ts` (mismos ids, textos en inglés)**

```ts
export const help = {
  recovery: {
    label: 'How the recovery score is calculated',
    body: 'The score combines your last workout (rest days), sleep, soreness and your streak. Each signal scores 0 to 100 and weighs in according to the data available. Ranges: 0–{{restMax}}, better rest; {{maybeMin}}–{{maybeMax}}, could train; {{readyMin}}–100, ready to train.',
  },
  deload: {
    label: 'What is a deload week',
    body: 'A week with less load to recover and come back stronger: reduce the weight ({{pct}}%) keeping sets and frequency. The marker turns off by itself after 7 days; it does not change weights or sets of your routines.',
  },
  insightAlza: {
    label: 'What higher volume means',
    body: 'Volume is the total weekly load (kg: sets × weight). Going up more than 5% versus last week is a good sign; keep your technique and rest to sustain it.',
  },
  insightDescenso: {
    label: 'What lower volume means',
    body: 'Volume is the total weekly load (kg: sets × weight). A drop of more than 10% versus last week may point to fatigue or less consistency; it is a reference, listen to your body.',
  },
  insightEstable: {
    label: 'What steady volume means',
    body: 'Volume is the total weekly load (kg: sets × weight). It is considered steady when it varies less than ±10% versus last week. It is only informative, it does not change your plan.',
  },
  grasa: {
    label: 'How body fat % is calculated',
    body: 'The % is estimated with the Jackson-Pollock protocol (7 skinfolds, or 3 if data is missing) and the Siri equation. It is a reference: it depends on caliper technique, hydration and the observer.',
  },
  medidasCorporales: {
    label: 'Why record measurements',
    body: 'Always measure at the same points and at similar times so the trend stays reliable. The app keeps one record per day and computes health ratios (waist/height, waist/hip) and left-right symmetry.',
  },
  volumen: {
    label: 'How volume is calculated',
    body: 'Volume is the sum of weight × reps across your completed sets. The app groups it by week (Monday to Sunday) so you can see whether it goes up or down versus previous weeks.',
  },
  volumenMuscular: {
    label: 'How volume is split by muscle',
    body: 'Each set adds its weight × reps to the main muscle group of the exercise. The chart shows how much of the volume each group took in the selected period.',
  },
  carga: {
    label: 'What session load means',
    body: 'Each point summarizes a session: the line follows the highest weight lifted on the charted exercise (warm-up sets excluded). The golden dot marks your PR (best mark) on that exercise.',
  },
  e1rm: {
    label: 'What estimated 1RM means',
    body: 'The maximum weight you could lift once, estimated with the Brzycki formula (weight × 36 ÷ (37 − reps)) from your best set of each session. The golden dot highlights your latest record.',
  },
  frecuencia: {
    label: 'How frequency is calculated',
    body: 'It counts how often you trained each muscle group and compares it with its weekly target. If you deviate more than {{pct}}% from the target, it shows up as an alert.',
  },
  pushPull: {
    label: 'How the balance is calculated',
    body: 'It splits your volume into push (chest, triceps, shoulder), pull (back, biceps, traps, forearms) and legs (legs, glutes, abs). If the push–pull difference is over {{pct}} points, the app flags it so you can balance it.',
  },
  imc: {
    label: 'What BMI means',
    body: 'It relates your weight and height (weight ÷ height²). Reference ranges: below {{bajo}}, underweight; from {{bajo}} to {{normal}}, normal; from {{normal}} to {{sobrepeso}}, overweight; from {{sobrepeso}} up, obesity. It is a reference, not a medical assessment.',
  },
  ratios: {
    label: 'What the ratios mean',
    body: 'Waist/height: up to {{whtrOk}} is considered healthy, and above {{whtrMedio}} the risk is high. Waist/hip: under {{whrHombre}} for men and {{whrMujer}} for women is considered low. They are references.',
  },
  rpe: {
    label: 'What RPE means',
    body: 'Rate of perceived exertion of the set: 10 is the maximum (you could not do another rep). The app uses it to adjust the suggested rest.',
  },
  rir: {
    label: 'What RIR means',
    body: 'Reps in reserve: how many more reps you could have done when you finished the set. 0 means you went to failure. With RIR 0–1, the app softens the weight jump it suggests for the next set.',
  },
} as const
```

- [ ] **Step 4: Crear el registro `src/i18n/help.ts`**

```ts
// Registro central de ayudas (F90): mapea cada id al par de claves i18n.
// Si un id no tiene claves reales en el esquema es, no compila (I18nKey).
import type { I18nKey } from '@/i18n'

export const HELP_IDS = [
  'recovery',
  'deload',
  'insightAlza',
  'insightDescenso',
  'insightEstable',
  'grasa',
  'medidasCorporales',
  'volumen',
  'volumenMuscular',
  'carga',
  'e1rm',
  'frecuencia',
  'pushPull',
  'imc',
  'ratios',
  'rpe',
  'rir',
] as const

export type HelpId = (typeof HELP_IDS)[number]

export type HelpValues = Record<string, string | number>

export const HELP: Record<HelpId, { label: I18nKey; body: I18nKey }> = {
  recovery: { label: 'help.recovery.label', body: 'help.recovery.body' },
  deload: { label: 'help.deload.label', body: 'help.deload.body' },
  insightAlza: { label: 'help.insightAlza.label', body: 'help.insightAlza.body' },
  insightDescenso: { label: 'help.insightDescenso.label', body: 'help.insightDescenso.body' },
  insightEstable: { label: 'help.insightEstable.label', body: 'help.insightEstable.body' },
  grasa: { label: 'help.grasa.label', body: 'help.grasa.body' },
  medidasCorporales: { label: 'help.medidasCorporales.label', body: 'help.medidasCorporales.body' },
  volumen: { label: 'help.volumen.label', body: 'help.volumen.body' },
  volumenMuscular: { label: 'help.volumenMuscular.label', body: 'help.volumenMuscular.body' },
  carga: { label: 'help.carga.label', body: 'help.carga.body' },
  e1rm: { label: 'help.e1rm.label', body: 'help.e1rm.body' },
  frecuencia: { label: 'help.frecuencia.label', body: 'help.frecuencia.body' },
  pushPull: { label: 'help.pushPull.label', body: 'help.pushPull.body' },
  imc: { label: 'help.imc.label', body: 'help.imc.body' },
  ratios: { label: 'help.ratios.label', body: 'help.ratios.body' },
  rpe: { label: 'help.rpe.label', body: 'help.rpe.body' },
  rir: { label: 'help.rir.label', body: 'help.rir.body' },
}
```

- [ ] **Step 5: Montar el namespace en los índices de locales**

`src/i18n/locales/es/index.ts` — agregar import y clave:

```ts
import { help } from './help'
// …
export const es = {
  ...core,
  ...workout,
  ...stats,
  ...routines,
  ...nutrition,
  ...features,
  help,
} as const
```

`src/i18n/locales/en/index.ts` — ídem:

```ts
import { help } from './help'
// …
export const en: EsSchema = {
  ...workout,
  ...stats,
  ...routines,
  ...nutrition,
  ...features,
  ...core,
  help,
}
```

- [ ] **Step 6: Correr el test del catálogo (debe pasar)**

Run: `npx vitest run tests/unit/i18n/helpCatalog.test.ts`
Expected: PASS (17 ids × 2 locales × 2 campos).

- [ ] **Step 7: Escribir el test de `computePopoverPos` (debe fallar)**

Crear `tests/unit/components/ui/popoverPosition.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { computePopoverPos } from '@/components/ui/popoverPosition'

const VIEWPORT = { width: 375, height: 812 }

describe('computePopoverPos', () => {
  it('abre a la derecha y debajo cuando hay espacio', () => {
    expect(computePopoverPos({ top: 100, right: 64, bottom: 124, left: 40 }, VIEWPORT)).toEqual({
      top: 132,
      left: 72,
      maxHeight: 320,
    })
  })

  it('voltea a la izquierda cerca del borde derecho', () => {
    expect(computePopoverPos({ top: 100, right: 300, bottom: 124, left: 276 }, VIEWPORT)).toEqual({
      top: 132,
      left: 12,
      maxHeight: 320,
    })
  })

  it('clampa horizontalmente cuando ningún lado entra', () => {
    expect(computePopoverPos({ top: 100, right: 224, bottom: 124, left: 200 }, VIEWPORT)).toEqual({
      top: 132,
      left: 111,
      maxHeight: 320,
    })
  })

  it('voltea arriba cerca del borde inferior', () => {
    expect(computePopoverPos({ top: 700, right: 64, bottom: 724, left: 40 }, VIEWPORT)).toEqual({
      top: 372,
      left: 72,
      maxHeight: 320,
    })
  })

  it('clampa en un viewport chico (320×568)', () => {
    expect(computePopoverPos({ top: 250, right: 150, bottom: 274, left: 126 }, { width: 320, height: 568 })).toEqual({
      top: 240,
      left: 56,
      maxHeight: 320,
    })
  })

  it('recorta maxHeight cuando el viewport es más bajo que el popover + bordes', () => {
    expect(computePopoverPos({ top: 100, right: 150, bottom: 124, left: 126 }, { width: 320, height: 300 })).toEqual({
      top: 8,
      left: 56,
      maxHeight: 284,
    })
  })
})
```

Run: `npx vitest run tests/unit/components/ui/popoverPosition.test.ts`
Expected: FAIL — módulo inexistente.

- [ ] **Step 8: Crear `src/components/ui/popoverPosition.ts`**

```ts
// Geometría pura del popover de InfoTip: calcula top/left (fixed) y la altura
// máxima para que quepa dentro del viewport, con flip y clamp. Extraído para
// poder testearlo sin DOM (el repo no tiene jsdom).
export const POPOVER_WIDTH = 256
export const POPOVER_MAX_HEIGHT = 320
export const POPOVER_GAP = 8
export const POPOVER_EDGE = 8

type Anchor = { top: number; right: number; bottom: number; left: number }
type Viewport = { width: number; height: number }

export type PopoverPosition = { top: number; left: number; maxHeight: number }

export const computePopoverPos = (anchor: Anchor, viewport: Viewport): PopoverPosition => {
  const { width: vw, height: vh } = viewport
  const maxHeight = Math.min(POPOVER_MAX_HEIGHT, vh - 2 * POPOVER_EDGE)
  const left =
    anchor.right + POPOVER_GAP + POPOVER_WIDTH <= vw - POPOVER_EDGE
      ? anchor.right + POPOVER_GAP
      : anchor.left - POPOVER_GAP - POPOVER_WIDTH >= POPOVER_EDGE
        ? anchor.left - POPOVER_GAP - POPOVER_WIDTH
        : Math.min(Math.max(anchor.left, POPOVER_EDGE), vw - POPOVER_WIDTH - POPOVER_EDGE)
  const top =
    anchor.bottom + POPOVER_GAP + maxHeight <= vh - POPOVER_EDGE
      ? anchor.bottom + POPOVER_GAP
      : anchor.top - POPOVER_GAP - maxHeight >= POPOVER_EDGE
        ? anchor.top - POPOVER_GAP - maxHeight
        : Math.min(Math.max(anchor.top, POPOVER_EDGE), vh - maxHeight - POPOVER_EDGE)
  return { top, left, maxHeight }
}
```

Run: `npx vitest run tests/unit/components/ui/popoverPosition.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 9: Reescribir `src/components/ui/InfoTip.tsx`**

```tsx
// Botón «?» que abre un popover flotante con una breve explicación.
// Dos vías: `id` del catálogo central (HELP) con `values` para interpolar, o
// `label` + children para contenido dinámico (guías por zona/pliegue).
// Se posiciona con `position: fixed` y se recalcula al hacer scroll/resize para
// que quepa siempre dentro del viewport. Al abrir, el foco pasa al botón de
// cerrar; al cerrar con Escape o con la X, vuelve al disparador.
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { CircleHelp, X } from 'lucide-react'
import { useCloseOnEscape } from '@/hooks/useCloseOnEscape'
import { HELP, type HelpId, type HelpValues } from '@/i18n/help'
import { computePopoverPos } from './popoverPosition'

type CatalogProps = { id: HelpId; values?: HelpValues }
type LegacyProps = { label: string; children: ReactNode }

type InfoTipProps = { className?: string } & (CatalogProps | LegacyProps)

export const InfoTip = (props: InfoTipProps) => {
  const { t } = useTranslation()
  const { className = '' } = props
  const isCatalog = 'id' in props
  const label = isCatalog ? t(HELP[props.id].label) : props.label
  const body = isCatalog ? t(HELP[props.id].body, props.values) : props.children

  const popoverId = useId()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number; maxHeight: number } | null>(null)

  // Cierra el popover; `restoreFocus` solo cuando el cierre fue por teclado o X
  // (un tap afuera ya movió el foco a donde el usuario tocó).
  const close = (restoreFocus: boolean) => {
    if (restoreFocus && open) triggerRef.current?.focus()
    setOpen(false)
  }

  useCloseOnEscape(() => close(true), 'document')

  // Mientras está abierto: recalcula la posición (scroll/resize) y cierra con clic fuera.
  useEffect(() => {
    if (!open) return
    const update = () => {
      const rect = rootRef.current?.getBoundingClientRect()
      if (rect) setPos(computePopoverPos(rect, { width: window.innerWidth, height: window.innerHeight }))
    }
    update()
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close(false)
    }
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [open])

  // Al abrir, el foco entra al diálogo (el lector de pantalla lo anuncia).
  useEffect(() => {
    if (!open) return
    const id = requestAnimationFrame(() => closeRef.current?.focus())
    return () => cancelAnimationFrame(id)
  }, [open])

  return (
    <div ref={rootRef} className="relative inline-flex shrink-0">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={open ? popoverId : undefined}
        aria-label={label}
        className={`relative inline-flex size-6 items-center justify-center rounded-full border border-border text-muted transition-colors after:absolute after:-inset-2.5 after:content-[''] hover:border-cta hover:text-accent-soft ${className}`}
      >
        <CircleHelp className="size-4" aria-hidden />
      </button>
      {open && pos && (
        <div
          id={popoverId}
          role="dialog"
          aria-label={label}
          style={{ top: pos.top, left: pos.left, maxHeight: pos.maxHeight }}
          className="fixed z-50 w-64 scrollbar-hidden overflow-y-auto rounded-xl border border-border bg-bg-elevated p-3 pr-11 text-xs leading-relaxed text-muted shadow-lg shadow-black/30"
        >
          <button
            ref={closeRef}
            type="button"
            onClick={() => close(true)}
            aria-label={t('layout.confirm.close')}
            className="absolute right-1 top-1 inline-flex size-11 items-center justify-center rounded-full text-muted transition-colors hover:text-fg"
          >
            <X className="size-4" aria-hidden />
          </button>
          {body}
        </div>
      )}
    </div>
  )
}
```

Notas:
- El área táctil de 44 px se logra con `after:-inset-2.5` (24 + 10×2), sin cambiar el footprint.
- La X usa `size-11` (44 px). `aria-label` reusa `layout.confirm.close` (ya existe).
- Si `t(HELP[props.id].body, props.values)` protesta por tipos, ampliar el segundo argumento con `props.values as Record<string, unknown>` y volver a compilar.

- [ ] **Step 10: Migrar los 5 consumidores fijos**

`src/components/home/RecoveryScoreCard.tsx` (reemplaza 125-131):

```tsx
        <InfoTip
          id="recovery"
          values={{
            restMax: RECOVERY_MAYBE_MIN - 1,
            maybeMin: RECOVERY_MAYBE_MIN,
            maybeMax: RECOVERY_READY_MIN - 1,
            readyMin: RECOVERY_READY_MIN,
          }}
        />
```

`src/components/profile/DeloadCard.tsx` (reemplaza 88-90):

```tsx
            <InfoTip id="deload" values={{ pct: DELOAD_REDUCTION_PCT }} />
```

`src/components/insights/InsightCard.tsx` (3 usos):

```tsx
            <InfoTip id="insightAlza" />      // reemplaza 27-29
            <InfoTip id="insightDescenso" />  // reemplaza 50-52
          <InfoTip id="insightEstable" />    // reemplaza 72-74 (respetar indentación real)
```

`src/pages/GrasaCorporalPage.tsx` (reemplaza 147-149):

```tsx
          <InfoTip id="grasa" />
```

`src/pages/MedidasCorporalesPage.tsx` (reemplaza 113-115):

```tsx
          <InfoTip id="medidasCorporales" />
```

`MeasurementField.tsx` NO se toca (sigue con `label` + children).

- [ ] **Step 11: Eliminar las claves viejas movidas (es y en)**

- `es/core.ts`: borrar 322-323 (`infoTipLabel/infoTipCuerpo`), 405-406 (`comoSeCalcula/comoSeCalculaDesc`), 480-481 (`deloadTipLabel/deloadTipCuerpo`), 500-502 (`tipLabel/tipCuerpo` de `home.recovery`). NO borrar `comoMedir` (324 y 404).
- `en/core.ts`: mismas claves en las mismas zonas relativas.
- `es/features.ts`: borrar 21-22, 25-26, 29-30 (`*Tip*` de insights). Conservar `alzaCuerpo/descensoCuerpo/estableCuerpo` (23, 27, 31).
- `en/features.ts`: ídem.

- [ ] **Step 12: Compilar y correr la suite completa**

Run: `npm run build`
Expected: EXIT 0 (si falla por claves faltantes, revisar pasos 2-5 y 11).

Run: `npm test`
Expected: verde (incluye los 2 tests nuevos).

- [ ] **Step 13: Crear `tests/e2e/test_f90.py` (InfoTip + migrados) y correrlo**

```python
"""F90: ayuda contextual — InfoTip accesible y tips migrados (fase 90.1).

Casos:
 1. Medidas (/calculadoras/medidas): el «?» abre el diálogo; Escape lo cierra y
    devuelve el foco al disparador; la X lo cierra; un tap afuera lo cierra.
 2. Viewport 320x568: el popover queda dentro del viewport.
 3. Perfil (/perfil) con programa sembrado: tip de deload interpolado (10%) y
    el switch de deload sigue funcionando (el hit-area 44px no lo roba).
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"

SEED_APP_JS = """async () => {
  const openDb = () => new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const db = await openDb();
  await new Promise((res, rej) => {
    const tx = db.transaction(['meta'], 'readwrite');
    tx.objectStore('meta').put({ key: 'onboardingDone', value: true });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  return true;
}"""

SEED_PROGRAM_JS = """async () => {
  const openDb = () => new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const db = await openDb();
  const today = new Date().toISOString().slice(0, 10);
  await new Promise((res, rej) => {
    const tx = db.transaction(['activeProgram'], 'readwrite');
    tx.objectStore('activeProgram').clear();
    tx.objectStore('activeProgram').put({
      id: 1,
      routineId: 1,
      startDate: today,
      weekdays: [new Date().getDay()],
      createdAt: `${today}T00:00:00.000Z`,
    });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  return true;
}"""

TITLE_MEDIDAS = "Para qué registrar medidas"
TITLE_DELOAD = "Qué es la semana de deload"


def boot(page):
    page.goto(BASE, wait_until="networkidle")
    page.wait_for_timeout(700)
    assert page.evaluate(SEED_APP_JS) is True, "seed app failed"
    page.reload(wait_until="networkidle")
    page.wait_for_timeout(900)
    skip = page.locator("button", has_text="Ya entreno aquí")
    if skip.count() > 0:
        skip.first.click(timeout=5000)
        page.wait_for_timeout(600)


def open_tip(page, label):
    trigger = page.get_by_role("button", name=label)
    trigger.click(timeout=5000)
    dialog = page.get_by_role("dialog")
    dialog.wait_for(state="visible", timeout=5000)
    return trigger, dialog


def run_info_tip(page, errors):
    """Caso 1 y 2: comportamiento del InfoTip en /calculadoras/medidas."""
    page.goto(f"{BASE}/calculadoras/medidas", wait_until="networkidle")
    page.wait_for_timeout(600)

    # Abrir + Escape cierra y devuelve el foco.
    _, dialog = open_tip(page, TITLE_MEDIDAS)
    assert "Mide siempre" in dialog.inner_text(), "body del tip no visible"
    page.keyboard.press("Escape")
    dialog.wait_for(state="hidden", timeout=5000)
    focused = page.evaluate("document.activeElement?.getAttribute('aria-label')")
    assert focused == TITLE_MEDIDAS, f"foco tras Escape: {focused}"

    # La X cierra.
    _, dialog = open_tip(page, TITLE_MEDIDAS)
    dialog.get_by_role("button", name="Cerrar").click(timeout=5000)
    dialog.wait_for(state="hidden", timeout=5000)

    # Un tap afuera cierra.
    _, dialog = open_tip(page, TITLE_MEDIDAS)
    page.mouse.click(10, 400)
    dialog.wait_for(state="hidden", timeout=5000)

    # Viewport chico: el popover queda dentro del viewport.
    page.set_viewport_size({"width": 320, "height": 568})
    page.wait_for_timeout(300)
    _, dialog = open_tip(page, TITLE_MEDIDAS)
    box = dialog.bounding_box()
    assert box is not None, "popover sin bounding box"
    assert box["x"] >= 0 and box["y"] >= 0, f"popover fuera: {box}"
    assert box["x"] + box["width"] <= 320 and box["y"] + box["height"] <= 568, f"popover fuera: {box}"
    page.keyboard.press("Escape")
    page.set_viewport_size({"width": 375, "height": 812})


def run_deload_tip(page, errors):
    """Caso 3: tip migrado con interpolación + switch intacto."""
    assert page.evaluate(SEED_PROGRAM_JS) is True, "seed program failed"
    page.reload(wait_until="networkidle")
    page.wait_for_timeout(900)
    page.goto(f"{BASE}/perfil", wait_until="networkidle")
    page.wait_for_timeout(600)

    _, dialog = open_tip(page, TITLE_DELOAD)
    assert "reduce el peso (10%)" in dialog.inner_text(), dialog.inner_text()
    page.keyboard.press("Escape")

    sw = page.get_by_role("switch", name="Activar semana de deload")
    assert sw.get_attribute("aria-checked") == "false"
    sw.click(timeout=5000)
    page.wait_for_timeout(400)
    assert sw.get_attribute("aria-checked") == "true"


def main():
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 375, "height": 812})
        page = context.new_page()
        console_errors = []
        page.on(
            "console",
            lambda m: console_errors.append(f"console.{m.type}: {m.text}") if m.type == "error" else None,
        )
        page.on("pageerror", lambda e: console_errors.append(f"pageerror: {e}"))
        try:
            boot(page)
            run_info_tip(page, errors)
            run_deload_tip(page, errors)
        except Exception as e:  # noqa: BLE001
            errors.append(f"Exception: {e}")
        finally:
            errors.extend(console_errors)
            page.close()
            context.close()
            browser.close()
    if errors:
        print("ERRORS:")
        for e in errors:
            print(f"  - {e}")
        return 1
    print("ALL OK: F90.1 (InfoTip accesible, migración y deload)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

Run: `python tests/e2e/scripts/with_server.py tests/e2e/test_f90.py`
Expected: `ALL OK: F90.1 …` (si el tap afuera no cierra, revisar el listener `pointerdown`; si el foco no vuelve, revisar `close(true)`).

- [ ] **Step 14: Regresión de e2e existente (el switch del deload y el home)**

Run: `python tests/e2e/scripts/with_server.py tests/e2e/test_f93_t3_deload.py`
Expected: ALL OK.

- [ ] **Step 15: Review de Gentle AI + commit**

1. Ciclo de review (candidato = diff del workspace, ANTES de commitear):
   `gentle-ai review status --cwd . --contract gentle-ai.review-integration/v2 --agent opencode --next-transition`
   y seguir SOLO el `next_transition` devuelto (no inferir comandos).
2. Stagear exacto y verificar: `git add src/i18n/help.ts src/i18n/locales/es/help.ts src/i18n/locales/en/help.ts src/i18n/locales/es/index.ts src/i18n/locales/en/index.ts src/components/ui/InfoTip.tsx src/components/ui/popoverPosition.ts src/components/home/RecoveryScoreCard.tsx src/components/profile/DeloadCard.tsx src/components/insights/InsightCard.tsx src/pages/GrasaCorporalPage.tsx src/pages/MedidasCorporalesPage.tsx src/i18n/locales/es/core.ts src/i18n/locales/en/core.ts src/i18n/locales/es/features.ts src/i18n/locales/en/features.ts tests/unit/i18n/helpCatalog.test.ts tests/unit/components/ui/popoverPosition.test.ts tests/e2e/test_f90.py`; `git diff --cached --name-only`.
3. `git commit -m "feat: catálogo central de ayudas e InfoTip accesible (F90.1)"` (sin push).

---

## Task 2 (Commit 2 — F90.2): Ayuda en las métricas de estadísticas

**Files:**
- Modify: `src/domain/muscleFrequency.ts`, `src/domain/pushPullBalance.ts`, `src/domain/calculators/bodyComposition.ts`
- Modify tests: `tests/unit/domain/muscleFrequency.test.ts`, `tests/unit/domain/pushPullBalance.test.ts`
- Create test: `tests/unit/domain/bodyComposition.test.ts`
- Modify: `src/components/stats/ChartCard.tsx`
- Modify charts: `src/components/stats/VolumeRangeChart.tsx`, `VolumeByMuscleChart.tsx`, `VolumeByMuscleDonut.tsx`, `LoadRangeChart.tsx`, `ImcChart.tsx`, `RatiosChart.tsx`, `src/components/body/SkinfoldChart.tsx`, `src/components/profile/E1rmChart.tsx`
- Modify: `src/components/stats/EntrenamientoStats.tsx`, `src/components/frequency/MuscleFrequencyView.tsx`, `src/components/balance/PushPullBalanceView.tsx`
- Modify: `src/i18n/locales/es/stats.ts`, `src/i18n/locales/en/stats.ts`
- Modify e2e: `tests/e2e/test_f90.py`

**Interfaces que consume:** `HelpId`, `HelpValues`, `InfoTip id/values` (Task 1).

**Nota de precisión (decidida en implementación):** el punto dorado de `E1rmChart` marca el ÚLTIMO registro (`E1rmChart.tsx:82`), no el PR; su leyenda dice «Último registro». El de `LoadRangeChart` sí es el PR (`maxIdx` por `high`, línea 62).

- [ ] **Step 1: Pins de constantes (deben fallar)**

`tests/unit/domain/muscleFrequency.test.ts` — agregar al final (y sumar `FREQUENCY_ALERT_PCT` al import existente):

```ts
describe('FREQUENCY_ALERT_PCT', () => {
  it('el umbral de alerta es 20%', () => {
    expect(FREQUENCY_ALERT_PCT).toBe(20)
  })
})
```

`tests/unit/domain/pushPullBalance.test.ts` — ídem con `PUSH_PULL_ALERT_PCT`:

```ts
describe('PUSH_PULL_ALERT_PCT', () => {
  it('el umbral de desbalance es 20 puntos', () => {
    expect(PUSH_PULL_ALERT_PCT).toBe(20)
  })
})
```

Crear `tests/unit/domain/bodyComposition.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { WHTR_LIMITS, WHR_LIMITS, whtrCategory, whrCategory } from '@/domain/calculators/bodyComposition'

describe('umbrales de ratios', () => {
  it('WHTR_LIMITS y WHR_LIMITS son la fuente única', () => {
    expect(WHTR_LIMITS).toEqual({ healthy: 0.5, medium: 0.6 })
    expect(WHR_LIMITS).toEqual({ male: { low: 0.9, high: 1.0 }, female: { low: 0.8, high: 0.9 } })
  })

  it('whtrCategory usa los umbrales', () => {
    expect(whtrCategory(0.5)).toBe('saludable')
    expect(whtrCategory(0.51)).toBe('riesgo_aumentado')
    expect(whtrCategory(0.61)).toBe('riesgo_alto')
  })

  it('whrCategory usa los umbrales por sexo', () => {
    expect(whrCategory(0.89, 'male')).toBe('bajo')
    expect(whrCategory(0.95, 'male')).toBe('moderado')
    expect(whrCategory(0.79, 'female')).toBe('bajo')
  })
})
```

Run: `npx vitest run tests/unit/domain/muscleFrequency.test.ts tests/unit/domain/pushPullBalance.test.ts tests/unit/domain/bodyComposition.test.ts`
Expected: FAIL (constantes inexistentes).

- [ ] **Step 2: Exportar/usar las constantes en el dominio**

`src/domain/muscleFrequency.ts` — antes de `compareFrequency`:

```ts
// Umbral de desviación (en %) a partir del cual se marca alerta.
export const FREQUENCY_ALERT_PCT = 20
```

y en `compareFrequency` (línea 37): `alert: Math.abs(deviation) > FREQUENCY_ALERT_PCT`.

`src/domain/pushPullBalance.ts` — arriba del archivo:

```ts
// Diferencia (en puntos porcentuales) entre push y pull que marca desbalance.
export const PUSH_PULL_ALERT_PCT = 20
```

y en `detectImbalance` (línea ~54): `if (diff > PUSH_PULL_ALERT_PCT) {`.

`src/domain/calculators/bodyComposition.ts` — antes de `whtrCategory` (línea 165):

```ts
// Umbrales de ratios (fuente única para dominio, gráfico y ayudas).
export const WHTR_LIMITS = { healthy: 0.5, medium: 0.6 } as const
export const WHR_LIMITS = { male: { low: 0.9, high: 1.0 }, female: { low: 0.8, high: 0.9 } } as const
```

y usar en las funciones:

```ts
export const whtrCategory = (whtr: number): WhtrCategory => {
  if (whtr <= WHTR_LIMITS.healthy) return 'saludable'
  if (whtr <= WHTR_LIMITS.medium) return 'riesgo_aumentado'
  return 'riesgo_alto'
}
// …
export const whrCategory = (whr: number, sex: Sex): WhrCategory => {
  const { low, high } = WHR_LIMITS[sex]
  if (whr < low) return 'bajo'
  if (whr < high) return 'moderado'
  return 'alto'
}
```

Run: los 3 archivos de test del Step 1.
Expected: PASS.

- [ ] **Step 3: `ChartCard` gana `help` + `helpValues`**

`src/components/stats/ChartCard.tsx` — nuevo código completo:

```tsx
// ChartCard: shell premium glassmorphic que envuelve gráficos con stats, filtros y tendencias.
import { type ReactNode } from 'react'
import { InfoTip } from '@/components/ui/InfoTip'
import type { HelpId, HelpValues } from '@/i18n/help'

type Props = {
  title?: string
  subtitle?: string
  stats?: ReactNode
  actions?: ReactNode
  help?: HelpId
  helpValues?: HelpValues
  children: ReactNode
  footer?: ReactNode
}

export const ChartCard = ({ title, subtitle, stats, actions, help, helpValues, children, footer }: Props) => {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-gold/30 bg-gradient-to-br from-gold/8 via-bg-elevated to-bg-elevated shadow-[0_4px_24px_-4px_rgba(217,179,132,0.12)]">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-gold/5 to-transparent" />
      <div className="relative p-4">
        {(title || actions) && (
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              {title && (
                <div className="flex min-w-0 items-center gap-1.5">
                  <h3 className="min-w-0 truncate text-sm font-bold tracking-wide text-fg">{title}</h3>
                  {help && <InfoTip id={help} values={helpValues} />}
                </div>
              )}
              {subtitle && (
                <p className="mt-0.5 text-xs text-muted">{subtitle}</p>
              )}
            </div>
            {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
          </div>
        )}

        {stats && <div className="mb-3">{stats}</div>}

        <div className="relative">{children}</div>

        {footer && <div className="mt-3">{footer}</div>}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Props `help` en los 8 gráficos (ambas ramas: datos y empty state)**

En cada archivo, agregar la prop al `<ChartCard …>` de la rama de datos **y** al de la rama vacía:

- `src/components/stats/VolumeRangeChart.tsx` (líneas ~64-68 vacía, ~94-98 datos): `help="volumen"`.
- `src/components/stats/VolumeByMuscleChart.tsx` (~40-44, ~62-65): `help="volumenMuscular"`.
- `src/components/stats/VolumeByMuscleDonut.tsx` (~50-54, ~58-61): `help="volumenMuscular"`.
- `src/components/body/SkinfoldChart.tsx` (~66-72, ~79-84): `help="grasa"`.
- `src/components/stats/LoadRangeChart.tsx` (~55-59, ~65-68): `help="carga"` (la leyenda va en el Step 5).
- `src/components/profile/E1rmChart.tsx` (~54-58, ~62-66): `help="e1rm"` (leyenda en el Step 5).

Ejemplo de forma (VolumeRangeChart, rama de datos):

```tsx
    <ChartCard
      title={t('stats.rangoVolumen')}
      help="volumen"
      stats={<StatRow stats={stats} />}
      footer={trendPct !== 0 ? <TrendBadge value={trendPct} label={`vs ${t('stats.periodoAnterior')}`} /> : undefined}
    >
```

Con `helpValues`:

- `src/components/stats/ImcChart.tsx` (~51-55, ~62-66): `help="imc"` +
  `helpValues={{ bajo: IMC_THRESHOLDS[0]!, normal: IMC_THRESHOLDS[1]!, sobrepeso: IMC_THRESHOLDS[2]! }}`; agregar `import { IMC_THRESHOLDS } from '@/domain/calculators/imc'`.
- `src/components/stats/RatiosChart.tsx` (~57-61, ~65-69): `help="ratios"` +
  `helpValues={{ whtrOk: WHTR_LIMITS.healthy, whtrMedio: WHTR_LIMITS.medium, whrHombre: WHR_LIMITS.male.low, whrMujer: WHR_LIMITS.female.low }}`; agregar `import { WHTR_LIMITS, WHR_LIMITS } from '@/domain/calculators/bodyComposition'` (junto al import de tipo existente).

Refactor del gráfico a las constantes (RatiosChart):

```tsx
  const whrLimit = WHR_LIMITS[sex].low          // antes: sex === 'male' ? 0.9 : 0.8
```
```tsx
        <ReferenceLine y={WHTR_LIMITS.healthy} stroke={colors.danger} strokeDasharray="6 4" strokeWidth={1} label={{ value: String(WHTR_LIMITS.healthy), position: 'right', fill: colors.danger, fontSize: 10 }} />
```

- [ ] **Step 5: Leyendas del punto dorado + claves i18n**

`src/i18n/locales/es/stats.ts` — después de `sinSeries1rm` (línea 52):

```ts
    prLeyenda: 'PR (mejor marca)',
    ultimoLeyenda: 'Último registro',
```

`src/i18n/locales/en/stats.ts` — misma posición relativa:

```ts
    prLeyenda: 'PR (best mark)',
    ultimoLeyenda: 'Latest record',
```

`src/components/stats/LoadRangeChart.tsx` — reemplazar la línea 83 por:

```tsx
      <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-muted">
        <span className="size-2 rounded-full bg-cta" aria-hidden />
        {t('stats.prLeyenda')}
      </p>
      <p className="mt-1 text-center text-xs text-muted">{t('stats.cargasPie')}</p>
```

`src/components/profile/E1rmChart.tsx` — después de `</AnimatedAreaChart>` (línea 83):

```tsx
      <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-muted">
        <span className="size-2 rounded-full bg-cta" aria-hidden />
        {t('stats.ultimoLeyenda')}
      </p>
```

- [ ] **Step 6: Colocaciones manuales (sin `ChartCard`)**

`src/components/stats/EntrenamientoStats.tsx` (~91-96) — agregar import de `InfoTip` y el `?` en el `h2`:

```tsx
        <h2 className="mb-2 flex items-center gap-1.5 font-display text-sm font-semibold uppercase tracking-wider text-accent">
          {t('stats.volumenSemana')}
          <InfoTip id="volumen" />
        </h2>
```

`src/components/frequency/MuscleFrequencyView.tsx` (~18-21) — imports `InfoTip` y `FREQUENCY_ALERT_PCT`; el título queda:

```tsx
      <div className="flex items-center gap-2">
        <AlertTriangle className="size-4 text-accent" aria-hidden />
        <p className="kicker">{t('frequency.title')}</p>
        <InfoTip id="frecuencia" values={{ pct: FREQUENCY_ALERT_PCT }} />
      </div>
```

`src/components/balance/PushPullBalanceView.tsx` (~32-39) — imports `InfoTip` y `PUSH_PULL_ALERT_PCT`; agregar tras el `<p className="kicker">…</p>`:

```tsx
        <InfoTip id="pushPull" values={{ pct: PUSH_PULL_ALERT_PCT }} />
```

- [ ] **Step 7: Compilar y suite**

Run: `npm run build` → EXIT 0.
Run: `npm test` → verde.

- [ ] **Step 8: Extender `tests/e2e/test_f90.py` con el escenario de stats**

IMPORTANTE: sin datos, los tabs muestran su empty state genérico y los charts con `?` no se montan (`EntrenoTab.tsx:76-107`, `CuerpoTab.tsx:23-39`). El escenario necesita seed de workouts/sets (patrón de `test_f47.py`/`test_f69.py`/`test_u2.py`). Agregar el seed junto a los otros seeds:

```python
SEED_STATS_JS = """async () => {
  const openDb = () => new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const db = await openDb();
  const day = (offset) => {
    const d = new Date();
    d.setDate(d.getDate() - offset);
    return d.toISOString().slice(0, 10);
  };
  await new Promise((res, rej) => {
    const tx = db.transaction(['exercises', 'workouts', 'workoutSets'], 'readwrite');
    tx.objectStore('exercises').put({ id: 901, slug: 'sentadilla-f90', name: 'Sentadilla F90', muscleGroup: 'pierna', equipment: ['barra'], instructions: '', category: 'strength' });
    tx.objectStore('workouts').put({ id: 9301, startedAt: `${day(3)}T17:00:00.000Z`, finishedAt: `${day(3)}T18:00:00.000Z`, routineId: null, routineDayId: null, localDate: day(3), notes: '', totalVolume: 2400 });
    tx.objectStore('workouts').put({ id: 9302, startedAt: `${day(10)}T17:00:00.000Z`, finishedAt: `${day(10)}T18:00:00.000Z`, routineId: null, routineDayId: null, localDate: day(10), notes: '', totalVolume: 2100 });
    tx.objectStore('workoutSets').put({ id: 9401, workoutId: 9301, exerciseId: 901, setNumber: 1, weightKg: 80, reps: 10, completed: true, createdAt: `${day(3)}T17:05:00.000Z` });
    tx.objectStore('workoutSets').put({ id: 9402, workoutId: 9301, exerciseId: 901, setNumber: 2, weightKg: 85, reps: 8, completed: true, createdAt: `${day(3)}T17:10:00.000Z` });
    tx.objectStore('workoutSets').put({ id: 9403, workoutId: 9302, exerciseId: 901, setNumber: 1, weightKg: 80, reps: 10, completed: true, createdAt: `${day(10)}T17:05:00.000Z` });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  return true;
}"""
```

Y la función (el seed hace que ambos tabs rendericen; el IMC queda sin altura → su empty state dentro de `CuerpoStats`, que también lleva `help`):

```python
def run_stats_tips(page, errors):
    """Caso 4: tips en /estadisticas (IMC en tab Cuerpo, volumen y carga en Entreno)."""
    assert page.evaluate(SEED_STATS_JS) is True, "seed stats failed"
    page.goto(f"{BASE}/estadisticas", wait_until="networkidle")
    page.wait_for_timeout(900)

    # Tab Cuerpo: IMC.
    page.get_by_role("tab", name="Cuerpo").click(timeout=5000)
    page.wait_for_timeout(600)
    _, dialog = open_tip(page, "Qué es el IMC")
    assert "18.5" in dialog.inner_text(), dialog.inner_text()
    page.keyboard.press("Escape")

    # Tab Entreno: volumen y carga.
    page.get_by_role("tab", name="Entrenamiento").click(timeout=5000)
    page.wait_for_timeout(600)
    _, dialog = open_tip(page, "Cómo se calcula el volumen")
    assert "lunes a domingo" in dialog.inner_text(), dialog.inner_text()
    page.keyboard.press("Escape")
    _, dialog = open_tip(page, "Qué es la carga por sesión")
    assert "PR" in dialog.inner_text(), dialog.inner_text()
    page.keyboard.press("Escape")
```

Cambio en `main()`:

```python
            boot(page)
            run_info_tip(page, errors)
            run_stats_tips(page, errors)
            run_deload_tip(page, errors)
```

Run: `python tests/e2e/scripts/with_server.py tests/e2e/test_f90.py`
Expected: `ALL OK` (si el tab se llama distinto, verificar `src/pages/EstadisticasPage.tsx`).

- [ ] **Step 9: Review + commit**

1. Ciclo de review de Gentle AI (candidato = workspace, ANTES de commitear), como en Task 1 Step 15.1.
2. `git add` de las rutas exactas tocadas + `git diff --cached --name-only`.
3. `git commit -m "feat: ayuda contextual en las métricas de estadísticas (F90.2)"` (sin push).

---

## Task 3 (Commit 3 — F90, añadido RIR/RPE): Ayuda de RIR y RPE

**Files:**
- Modify: `src/components/settings/SettingsUI.tsx` (Toggle), `src/components/settings/SessionSection.tsx:102-103`
- Modify: `src/components/workout/ExerciseBlock.tsx:289-294`
- Modify e2e: `tests/e2e/test_f90.py`

**Interfaces que consume:** `InfoTip id/values`, `HelpId` (Task 1).

- [ ] **Step 1: `Toggle` con slot de ayuda (`SettingsUI.tsx`)**

Agregar imports (`import { InfoTip } from '@/components/ui/InfoTip'`, `import type { HelpId } from '@/i18n/help'`) y el componente:

```tsx
export const Toggle = ({
  checked,
  onChange,
  label,
  description,
  help,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  description?: string
  help?: HelpId
}) => (
  <div className="flex items-center justify-between gap-3 py-3">
    <div className="min-w-0">
      <div className="flex items-center gap-1.5">
        <p className="text-sm font-medium text-fg">{label}</p>
        {help && <InfoTip id={help} />}
      </div>
      {description && (
        <p className="mt-0.5 text-xs text-muted">{description}</p>
      )}
    </div>
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-11 w-14 shrink-0 rounded-full transition-colors ${
        checked ? 'bg-cta' : 'bg-border'
      }`}
    >
      <span
        className={`absolute left-1 top-1/2 size-6 -translate-y-1/2 rounded-full bg-bg shadow transition-transform duration-200 ${
          checked ? 'translate-x-6' : 'translate-x-0'
        }`}
      />
    </button>
  </div>
)
```

- [ ] **Step 2: Usar `help` en los toggles de sesión**

`src/components/settings/SessionSection.tsx` (líneas 102-103):

```tsx
      <Toggle checked={settings.showRpe} onChange={(v) => void update({ showRpe: v })} label={t('ajustes.showRpe')} description={t('ajustes.showRpeDesc')} help="rpe" />
      <Toggle checked={settings.showRir} onChange={(v) => void update({ showRir: v })} label={t('ajustes.showRir')} description={t('ajustes.showRirDesc')} help="rir" />
```

- [ ] **Step 3: Tips en la cabecera de columnas de la sesión (`ExerciseBlock.tsx`)**

Agregar import de `InfoTip` y reemplazar el bloque 289-294:

```tsx
            {!isCardio && (showRpe || showRir) && (
              <div className="mt-2 flex items-center gap-2 pl-9">
                {showRpe && (
                  <span className="flex min-w-0 flex-1 items-center justify-center gap-1 text-center">
                    {t('workout.rpe')}
                    <InfoTip id="rpe" />
                  </span>
                )}
                {showRir && (
                  <span className="flex min-w-0 flex-1 items-center justify-center gap-1 text-center">
                    {t('workout.rir')}
                    <InfoTip id="rir" />
                  </span>
                )}
              </div>
            )}
```

- [ ] **Step 4: Compilar y suite**

Run: `npm run build` → EXIT 0.
Run: `npm test` → verde.

- [ ] **Step 5: Extender el e2e (Ajustes + sesión) y correrlo**

Agregar imports/seeds al inicio del archivo (tras `SEED_PROGRAM_JS`):

```python
SEED_SESSION_JS = """async () => {
  const openDb = () => new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const db = await openDb();
  const now = new Date().toISOString();
  await new Promise((res, rej) => {
    const tx = db.transaction(['exercises', 'meta'], 'readwrite');
    tx.objectStore('exercises').put({ id: 901, slug: 'sentadilla-f90', name: 'Sentadilla F90', muscleGroup: 'pierna', equipment: ['barra'], instructions: '', category: 'strength' });
    tx.objectStore('meta').put({ key: 'settings', value: JSON.stringify({ units: 'kg', showRpe: true, showRir: true }) });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  await new Promise((res, rej) => {
    const tx = db.transaction(['routines', 'routineDays', 'routineItems'], 'readwrite');
    tx.objectStore('routines').put({ id: 9001, slug: 'rutina-f90', title: 'Rutina F90', objective: 'fuerza', level: 'intermedio', description: '', daysCount: 1 });
    tx.objectStore('routineDays').put({ id: 9101, routineId: 9001, dayIndex: 0, name: 'Día A' });
    tx.objectStore('routineItems').put({ id: 9201, routineDayId: 9101, exerciseId: 901, targetSets: 3, targetReps: 8, restSec: 90, order: 1 });
    tx.objectStore('activeProgram').put({ id: 1, routineId: 9001, startDate: now.slice(0, 10), weekdays: [new Date().getDay()], createdAt: now });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  return true;
}"""
```

Y la función:

```python
def run_rpe_rir_tips(page, errors):
    """Caso 5: tips de RPE/RIR en Ajustes y en la cabecera de la sesión activa."""
    # Ajustes: los toggles tienen «?».
    page.goto(f"{BASE}/ajustes", wait_until="networkidle")
    page.wait_for_timeout(700)
    _, dialog = open_tip(page, "Qué es el RPE")
    assert "descanso" in dialog.inner_text(), dialog.inner_text()
    page.keyboard.press("Escape")
    _, dialog = open_tip(page, "Qué es el RIR")
    assert "reserva" in dialog.inner_text(), dialog.inner_text()
    page.keyboard.press("Escape")

    # Sesión activa: cabecera de columnas con «?» (con RPE/RIR activados por seed).
    assert page.evaluate(SEED_SESSION_JS) is True, "seed session failed"
    page.goto(BASE, wait_until="networkidle")
    page.wait_for_timeout(900)
    page.wait_for_selector('button:has-text("Empezar hoy")', state="visible", timeout=15000)
    page.locator("button", has_text="Empezar hoy").first.click(timeout=5000)
    dialog_sheet = page.locator('div[role="dialog"]', has_text="Elige el día")
    dialog_sheet.wait_for(state="visible", timeout=5000)
    dialog_sheet.locator("button", has_text="Día A").first.click(timeout=5000)
    page.wait_for_url(f"{BASE}/entrenamiento/active", timeout=8000)
    page.wait_for_timeout(800)

    _, dialog = open_tip(page, "Qué es el RPE")
    assert "esfuerzo" in dialog.inner_text().lower(), dialog.inner_text()
    page.keyboard.press("Escape")
    _, dialog = open_tip(page, "Qué es el RIR")
    assert "reserva" in dialog.inner_text().lower(), dialog.inner_text()
    page.keyboard.press("Escape")
```

Cambio en `main()`:

```python
            boot(page)
            run_info_tip(page, errors)
            run_stats_tips(page, errors)
            run_deload_tip(page, errors)
            run_rpe_rir_tips(page, errors)
```

Run: `python tests/e2e/scripts/with_server.py tests/e2e/test_f90.py`
Expected: `ALL OK`.
(Si el sheet usa otro nombre de fila, inspeccionar `DaySelectorSheet`; la fila del día se localiza por texto «Día A».)

- [ ] **Step 6: Review + commit**

1. Ciclo de review de Gentle AI (candidato = workspace, antes de commitear), como en Task 1 Step 15.1.
2. `git add` rutas exactas + `git diff --cached --name-only`.
3. `git commit -m "feat: ayuda contextual de RIR y RPE en sesión y ajustes (F90)"` (sin push).

---

## Task 4 (Commit 4): Cierre documental de F90

**Files:**
- Modify: `PLAN.md` (bloque F90, líneas 223-231), `CHANGELOG.md`

- [ ] **Step 1: Tildar F90 en `PLAN.md`**

- Línea 227 (`90.1`), 228 (`90.2`), 229 (`90.3`), 230 (`90.4`): cambiar `- [ ]` por `- [x]`.
- Después de la línea 231 (90.5 descartado), agregar:

```md
- [x] **90.6 — Ayuda de RIR y RPE (añadido del usuario, 2026-09-25)**: `?` en la cabecera de columnas de la sesión (`ExerciseBlock`) y en los toggles de Ajustes (`Toggle.help`), reutilizando el catálogo de la 90.1.
```

- [ ] **Step 2: `CHANGELOG.md` bajo `[Unreleased]` → `Added`**

```md
- **Catálogo central de ayudas y `InfoTip` accesible (F90.1)**: los textos de ayuda pasan a un catálogo tipado por id (`src/i18n/help.ts` + namespace `help.*` es/en) y `InfoTip` gana API `id`/`values`, área táctil ≥44 px, botón de cerrar, manejo de foco (al abrir entra al diálogo; Escape/X lo devuelven al disparador) y matemática de posición extraída a `computePopoverPos` con tests. Los 7 tips existentes (recovery, deload, insights, grasa, medidas) migran al catálogo.
- **Ayuda contextual en estadísticas (F90.2)**: `?` en las métricas no obvias (volumen, volumen por músculo, carga, 1RM estimado, frecuencia, balance push/pull, IMC, ratios y % de grasa) vía `ChartCard.help` + `helpValues`, con umbrales interpolados desde constantes del dominio (nuevas: `WHTR_LIMITS`, `WHR_LIMITS`, `FREQUENCY_ALERT_PCT`, `PUSH_PULL_ALERT_PCT`) y leyendas del punto dorado (PR en cargas; último registro en 1RM).
- **Ayuda de RIR y RPE (F90)**: `?` en la cabecera de columnas de la sesión activa y en los toggles de Ajustes (nuevo slot `Toggle.help`).
```

- [ ] **Step 3: Verificación final y commit**

Run: `npm run build` → EXIT 0.
Run: `npm test` → verde.
`git add PLAN.md CHANGELOG.md`; `git diff --cached --name-only`; `git commit -m "docs: cierre de F90 (PLAN + CHANGELOG)"` (sin push).

---

## Notas de ejecución

- Si otro proceso dejó archivos ajenos sin commitear, stagear SOLO las rutas listadas; nunca `git add -A`.
- El review de Gentle AI es informativo: no autoriza push/PR. La entrega queda a criterio del usuario.
- Fuera de alcance (no tocar): Periodización, home salvo lo indicado, calculadoras, traducción de las guías de `MeasurementField`, tour F101.
