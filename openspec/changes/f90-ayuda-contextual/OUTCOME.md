# Resultado de `f90-ayuda-contextual` — ALCANCE REDUCIDO (cerrado)

> **Este documento es la fuente de verdad del estado final.** Los archivos `proposal.md`,
> `design.md` y `specs/contextual-help/spec.md` describen el alcance **grande** que se
> propuso y que **el usuario rechazó**: se conservan como registro de la exploración,
> **NO** como lo entregado. `exploration.md`, `research.md` y `preproposal.md` siguen siendo
> válidos (el terreno y las decisiones de producto no cambiaron).

## Qué pasó

Durante la revisión del proposal, el usuario rechazó el alcance amplio (catálogo de ayuda
tipado, componente `HelpHint`, upgrade de `InfoTip`) y eligió el **mínimo útil**: corregir
los textos que mienten y agregar el `?` explicativo en la tarjeta de Recovery.

## Qué se entregó (commit `1b26abc`)

| Cambio | Detalle |
|---|---|
| Tip del deload | Decía 40–50%; el código recorta **10%**. Ahora interpola `DELOAD_REDUCTION_PCT` desde el dominio |
| `?` en Recovery Score | Explica en qué se basa el score y sus **rangos reales** (0–39 / 40–69 / 70–100), interpolados desde `RECOVERY_MAYBE_MIN` / `RECOVERY_READY_MIN` |
| `SuggestionChip` / `InfoTip` | El `?` se monta como **hermano superpuesto** (`absolute`) del botón de la tarjeta, sin anidar botones, conservando el tap en toda la tarjeta |
| `EntrenarPage` + `.reveal` | La clase pasó de envolver la tarjeta a envolver **solo el `<button>`**: `animation-fill-mode: both` deja un `transform` residual que vuelve al elemento *containing block* de sus descendientes `position: fixed` (el popover aparecía fuera de pantalla) |

Verificación: **829 tests** (827 base + 2), `npm run build` limpio, e2e
`test_f93_t3_deload.py` y `test_f99_home_layout.py` ALL OK, más comprobación empírica del
overlay a 375×812 y 320×568.

## Qué quedó DESCARTADO (no entregado)

- Catálogo de ayuda tipado (`domain/help.ts` + constantes) — rechazado por el usuario.
- Componente `HelpHint` envolviendo `InfoTip` — rechazado.
- Upgrade de `InfoTip` (44px, gestión de foco, cierre) — rechazado.
- Estado «ya visto» y auto-apertura — descartados ya en las decisiones de producto (D1, D2).
- **Onboarding guiado (tour + replayable)** → movido a **Fase 101** en `PLAN.md`.

## Nota sobre `design.md`

Sus decisiones D1–D8 documentan la solución pensada para el alcance grande. La **única** que
se materializó fue el gotcha de `.reveal` (**D3**), que resultó ser real y obligó a mover la
clase. El resto —disclosure con `aria-expanded`, un disclosure abierto a la vez, reestructura
de `RecoveryScoreCard` con el tap de tarjeta descartado, `domain/help.ts`, `HelpHint`— **no se
implementó**. No leerlas como estado del código.
