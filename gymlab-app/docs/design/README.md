# Diseño — ruta de estilos y pautas

**Empezá acá.** Este README es el índice y el punto de entrada para una sesión nueva.
La fuente de verdad visual completa es [`NOCTURNO-MINIMAL.md`](./NOCTURNO-MINIMAL.md).

---

## Estado actual

- **Actividad (`/logros`, `/objetivos`, `/wearables`) mergeada en `main`** el **2026-10-25**
  (commit `04a2cfe0`; worktrees y commits de la fase `e2019042`…`04a2cfe0`). Logros: vitrina de
  2 columnas con chips por estado y sheet de detalle (barras `data-progress` preservadas).
  Objetivos: héroe «próximo hito», filas hairline y sheet controlado (el picker desmonta el sheet
  por z-index); `GoalSetter`/`GoalProjectionCard` eliminados. Wearables: estado vacío centrado,
  provisional y solo visual. Detalle: `NOCTURNO-MINIMAL.md` §20; spec
  `docs/superpowers/specs/2026-10-24-f132-4-actividad-design.md`; task `odd/tasks/f132-4-actividad.md`.
- **Home (dirección C · Editorial) mergeado en `main`** el **2026-10-24** (commits `fd2f9368` y
  `353e8a91`). Héroe editorial con la foto de la rutina, week strip, fila racha/semana/volumen,
  rutina de hoy, progreso de 5 semanas, recuperación/journal/alertas en filas hairline, comparación
  compacta, retos y plantillas. Objetivos y último peso salen del home; los bloques sin datos no se
  renderizan. El review nativo quedó bloqueado por el defecto de `intended_untracked_selection` de
  Gentle AI 4.1.1 ([#4311](https://github.com/Gentleman-Programming/gentle-ai/issues/4311)).
- **Subpáginas de Rutinas (detalle, builder y planificador) implementadas en la rama `132.3-rutinas`**
  el **2026-10-25** (commits `7598d185`, `be8bf761`, `2e5bf0ad`, `acd8c008`), **sin push**. El detalle
  abre con la portada editorial del catálogo, fila de stats C1, tabs compactos y «seguir programa» al
  final; el builder pasa a formulario hairline con ejercicios en filas compactas expandibles; el
  planificador es un wizard de una pregunta por pantalla con resultado en secciones hairline. Reviews
  `review-0517425574d8af5b`, `review-3b9dbc6724c78c03`, `review-e81527bfd3d4ffd5` y
  `review-5f5354191860fb83` **approved + acknowledged**. Spec y log:
  `odd/tasks/132-3-rutinas-nocturno.md`; detalle: `NOCTURNO-MINIMAL.md` §19; mockup:
  `.superpowers/brainstorm/132.3-rutinas-20261024/content/direcciones-v1.html`.
- **Rutinas (dirección E · tarjeta editorial) implementado y mergeado en `main`** el **2026-10-24**
  (commits `db3ca05c` y follow-up `c21e5267`). Portada de 146 px con scrim, título Oswald, hairline
  de meta con `N ejercicios`, chips de objetivo con conteo total, grupos colapsables por objetivo,
  modo resultados, sheet de filtros y «+» con creación manual o con ayuda. Review nativo
  `review-7e8bfb2d7c9dbfb2` **approved + acknowledged**; follow-ups R3-5/R3-8/R3-9 anotados.
  Spec y log: `odd/tasks/rutinas-redesign.md`; detalle: `NOCTURNO-MINIMAL.md` §17; mockup:
  `.superpowers/brainstorm/rutinas-redesign-20261024/content/rutinas-e-v2.html`.
- **C1 de `/estadisticas` mergeado en `main`** el **2026-10-23**. La implementación y los detalles
  finos del rango compartido en Cuerpo ya viven en `main` (pase C1, commits `7e14b7f4` y anteriores).
- **Perfil (dirección A) implementado y mergeado en `main`** el **2026-10-23** (commit `0f85b4de`).
  Héroe de racha, secciones hairline y subpágina `/perfil/historial`; worktree `perfil-redesign`
  cerrado. Spec y follow-ups: `odd/tasks/perfil-redesign.md`; mockup:
  `.superpowers/brainstorm/perfil-redesign-20261023/content/perfil-a-v2.html`.
  Quedan 8 hallazgos **no bloqueantes** del review (R3-1..R3-8, tests/robustez) para otra fase.
- El mockup es la **referencia editorial**; la app reutiliza los charts reales de Recharts y los
  datos reales, así que no es pixel-perfect. La diferencia de detalle es esperada: la dirección C1
  está aprobada y los ajustes finos se siguen en otra sesión.
- `/pasos` ya está migrado a Nocturno Minimal (dirección C) y mergeado en `main`.
- **F132.2 — Entrenamiento implementado en la rama `132.2-entrenamiento`** (worktree) el **2026-10-25**: sesión activa B2, detalle guardado A, calendario A y timer A. Spec/plan: `docs/superpowers/specs/2026-10-24-132.2-entrenamiento-design.md` y `docs/superpowers/plans/2026-10-24-132.2-entrenamiento.md`; detalle visual: `NOCTURNO-MINIMAL.md` §18. **Pendiente de revisión del usuario y merge; no push.**
- La guía de **multisesión / worktree** está en [`NOCTURNO-MINIMAL.md`](./NOCTURNO-MINIMAL.md) §16.

---

## Pautas que no se negocian

1. **Un solo héroe por pantalla.** Número/palabra grande + una línea de contexto. El segundo dato
   importante va en fila o barra, no en otro anillo.
2. **Hairline en vez de tarjeta.** Secciones con `border-t border-border/40` y aire; sin grillas de
   tarjetas, sin sombras, sin glows.
3. **Un solo acento semántico.** Dorado = marca/progreso. Verde = meta/PR/cumplido. Rojo = error.
   El acento de la paleta activa no reemplaza al verde.
4. **Color de datos solo en marcas pequeñas.** Puntos, barras finas, líneas de 1–2 px, badges y
   segmentos. Nunca fondos de sección. Siempre con etiqueta; el color no es la única información.
   Tokens: `--color-data-chest/back/legs/shoulders/arms/core/cardio/fat/rest` (noche y día).
5. **Tipografía.** Oswald 300 para héroes y valores; Barlow 600 10 px MAYÚSCULAS con
   `tracking-[0.18em]` para eyebrows; Barlow 400/500 para cuerpo/meta. Máximo dos pesos de Oswald.
6. **Stats C1.** Tabs compactos (44 px) + héroe + fila de 3 stats + stack de secciones. Charts de
   Stats a **110 px** (área/barra) y **160 px** (donut) vía `ChartSizing`; sin grilla/ejes/labels
   salvo la excepción de barras horizontales por músculo. Rangos **por sección** (no global).
   “Más datos” agrupa Bitácora/Cardio/Balance.
7. **i18n es/en obligatorio.** El default del producto es inglés. Nada de literales como `periodo`,
   `Todo`, `Cintura`, `En forma`, `Crecimiento` o `1 tests` en componentes.
8. **Accesibilidad.** Touch targets ≥ 44 px, foco visible, `prefers-reduced-motion`, roles/aria en
   tabs y charts, estados vacíos honestos (no inventar datos futuros ni ceros).
9. **Noche + día + 6 paletas.** Los componentes nuevos deben funcionar con todas.

Checklist completa y plantilla de pedido: [`NOCTURNO-MINIMAL.md`](./NOCTURNO-MINIMAL.md) §12–13.

---

## Dónde está cada cosa

| Qué | Ruta |
|---|---|
| Pautas completas (tokens, recetas, checklist, C1, multisesión) | `gymlab-app/docs/design/NOCTURNO-MINIMAL.md` |
| Design system base (The Iron Lab) | `gymlab-app/docs/DESIGN.md` |
| Tokens reales / paletas / temas | `gymlab-app/src/index.css` |
| Página de Stats C1 | `gymlab-app/src/pages/EstadisticasPage.tsx` |
| Primitivas C1 | `gymlab-app/src/components/stats/StatsHero.tsx`, `StatsStatRow.tsx`, `StatsSection.tsx`, `StatsMoreData.tsx` |
| Shells C1 | `ChartCard.tsx` + `ChartCardVariant.tsx`, `ChartSizing.tsx`, `TabNav.tsx` (variant `compact`) |
| Paleta de datos / helpers | `hooks/useDataColors.ts`, `components/stats/muscleColors.ts`, `domain/statsOverview.ts` |
| Spec / decisiones C1 | `odd/tasks/stats-redesign.md` |
| Página de Rutinas (E) | `src/pages/RutinasPage.tsx` + `src/components/routines/` (`RoutineCard`, `RoutineObjectiveChips`, `RoutineObjectiveGroup`, `RoutineSection`, `NewRoutineSheet`, `RoutineFiltersSheet`) |
| Subpáginas de Rutinas (132.3) | `src/pages/RutinaDetailPage.tsx`, `RutinaBuilderPage.tsx`, `PlanificadorPage.tsx` + `RoutineHero`, `RoutineDayPanel`, `RoutineFollowCard`, `RoutineInfoForm`, `RoutineDayEditor`, `ExerciseItem`, `PlanPreview`, `PlanDayCard` |
| Spec / decisiones de Rutinas | `odd/tasks/rutinas-redesign.md` · subpáginas: `odd/tasks/132-3-rutinas-nocturno.md` |
| Flujo, review, worktree, commits | `gymlab-app/AGENTS.md` |

### Mockups C1 (locales)

Directorio: `.superpowers/brainstorm/pasos-redesign-20261023/content/`

| Mockup | Archivo |
|---|---|
| **Entreno C1 (referencia dedicada)** | `stats-c1-entreno-v1.html` |
| Cuerpo / Fuerza / Periodización C1 | `stats-c1-tabs-v4.html` |
| Comparación original C1/C2/C3 | `stats-color-v2.html` (C1 es la primera) |

Si el server de mockups está vivo: `http://localhost:57898/?key=bf5c618fdec59d930c4ba95784d32847a593460a1caec0de42f8895afbf85025`
(sirve el archivo más nuevo; si no, abrir el HTML directamente).

---

## Diferencia entre mockup e implementación (C1)

El mockup C1 es una composición estática con datos ideales y SVG a medida. La app reutiliza
Recharts, los datos reales y los hooks existentes; por eso el **ritmo visual** cambia: densidad de
datos, alturas, spacing, tipografía y detalles de los charts. La dirección está aprobada; los
detalles finos (hero, labels, spacing, charts custom, “Más datos”, el rango global del mockup vs.
rangos por sección) se cierran en la próxima sesión. Ver §15 del documento completo.

---

## Multisesión — cómo continuar

Regla del repo: **worktree aislado solo cuando se pide explícitamente**; “multisesiones” cuenta
como pedido. Desde la raíz `ProyectoGymLab`:

```powershell
.\scripts\worktree.ps1 open <fase>
# trabajar en .worktrees\<fase>\gymlab-app
# build/test/e2e/review/commit con cwd en el worktree
```

- Un solo escritor; no `git add -A`; stagear rutas exactas; commit inmediato y sin push.
- Review nativo antes de commitear (el switch lo decide el usuario).
- Cierre: `git -C .worktrees\<fase> rebase main` → `git merge --ff-only <fase>` desde el principal
  → `.\scripts\worktree.ps1 close <fase>`.
- La documentación de diseño es compartida; los mockups viven en `.superpowers/...` del checkout
  principal.

Detalle completo: `AGENTS.md` («Sesiones paralelas») y §16 de `NOCTURNO-MINIMAL.md`.

---

## Frase para la próxima sesión

Copiá y pegá:

> **Siguiente:** `gymlab-app/docs/design/README.md` — están los estilos y las pautas. Rediseñá
> `<pantalla>` con C1 / Nocturno Minimal en un worktree `<fase>`; i18n es/en; review antes de
> commit; no push.
