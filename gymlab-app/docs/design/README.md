# Diseño — ruta de estilos y pautas

**Empezá acá.** Este README es el índice y el punto de entrada para una sesión nueva.
La fuente de verdad visual completa es [`NOCTURNO-MINIMAL.md`](./NOCTURNO-MINIMAL.md).

---

## Estado actual

- **Superficies sin ruta (F132.9) implementadas en la rama `132.9-superficies`** el **2026-10-26**
  (commits `c308a0df`, `11ce9ed4`, `04be9c39`; **sin push ni merge**). El onboarding pasa a
  **7 pasos a pantalla completa, una decisión por cada uno** (Idioma, Objetivo, Días, Sesión,
  Identidad, Medidas y Resumen), con barra superior, progreso en puntos + «Paso N de 7», filas
  hairline de 56 px, CTA fija y reduced-motion; el resumen conserva plan, cobertura, intereses,
  términos y telemetría. El **modal de logros** pasa a **celebración contenida** (sin tarjeta,
  medalla 88 px, título Oswald 300, cola en puntos y confeti de 12; reduced-motion estático). El
  **tour** estrena **globo hairline** con eyebrow «Paso» + línea y «Saltar tour» a la izquierda,
  sin tocar los 13 pasos ni las anclas. El resumen post-entreno y los sheets globales solo se
  revalidan (ya migrados en F132.2/F132.6/F132.8). El onboarding sigue siendo de una sola vez;
  el tour se repite desde Ajustes («Volver a ver el tour»). Evidencia: build limpio, **202 archivos
  / 1877 tests**, e2e nuevo `test_132_9_superficies.py` y los tres de onboarding/tour verdes;
  review `review-9d44060d62b5b833` approved + acknowledged. Spec y log:
  `odd/tasks/132-9-superficies-sin-ruta.md`; detalle: `NOCTURNO-MINIMAL.md` §24; mockup:
  `.superpowers/brainstorm/132.9-superficies-20261026/content/01-superficies-direcciones.html`.
- **Sistema (`/ajustes`, `/terminos`, `/privacidad`) mergeado en `main`** el **2026-10-26**
  (rama `132.8-sistema`, worktree cerrado; tip `c287b7f8`; **sin push**). Ajustes deja las 9 tarjetas y
  pasa a grupos hairline: eyebrow por grupo, filas de 48 px, tema segmentado, las 6 paletas como discos
  en una fila y «Zona de peligro» al final en rojo. Términos y Privacidad abandonan el índice en caja:
  secciones numeradas `01`..`N` en Oswald, cuerpo en Barlow y un solo link mailto (el email ya no se
  repite). Se corrige de paso «Permisos del dispositivo» en la versión inglesa de Términos. Evidencia
  post-merge: build limpio y **202 archivos / 1877 tests**; e2e `test_132_8_sistema.py` (375/768, tres
  corridas seguidas) y `test_f101_tour.py` verdes; review `review-67e8784dca857616` approved +
  acknowledged. Detalle: `NOCTURNO-MINIMAL.md` §23; spec y log: `odd/tasks/132-8-sistema.md`; mockup:
  `.superpowers/brainstorm/132.8-sistema/content/01-ajustes-estructura.html` y el resultado real en
  `02-resultado-implementado.html`.
- **Aprender (F132.7) mergeado en `main`** el **2026-10-26** (rama `132.7-aprender`, worktree cerrado;
  tip `71f0cdfa`): biblioteca con índice editorial (A), hub de calculadoras con grilla de tiles (B),
  guías/papers con destacada e índice numerado (A) y las ocho calculadoras con result hero. La ficha
  de ejercicio deja la media lista para un video corto futuro (`videoUrl?`). Se conservan búsqueda,
  filtros, rail A–Z, favoritos, alta a rutina, recientes, redirect `macros`, disclaimers y contratos
  e2e; las etiquetas de dominio pasaron a i18n (incluida la concordancia de género de Navy). Evidencia:
  `npm test` 202 archivos / 1876 tests, e2e `test_f132_7_aprender.py` (375/768) y suites históricas
  verdes; reviews `review-447cc5bcf49b8488`, `review-3f73178a86484730` y
  `review-9ee9c7c648695f43` approved + acknowledged. Commits `be17afe3`, `48e129d5`, `1373838d` y `71f0cdfa` (docs);
  **mergeado en `main` el 2026-10-26 (`71f0cdfa`, ff-only); worktree cerrado; sin push**. Spec `docs/superpowers/specs/2026-10-25-f132-7-aprender-design.md`;
  task `odd/tasks/132-7-aprender-nocturno.md`; detalle `NOCTURNO-MINIMAL.md` §22; mockup
  `.superpowers/brainstorm/132.7-aprender-20261025/content/aprender-direcciones-v1.html`.
- **Nutrición y Suplementos (F132.6) mergeados en `main`** el **2026-10-26**
  (`6c96004a`, fast-forward; worktree `132.6-nutricion` cerrado; **sin push**). `/nutricion`
  estrena héroe de kcal con objetivo real o estado honesto sin TDEE, macros con reparto de kcal, tabs por
  comida, filas hairline y alta en sheet; `/suplementos` estrena héroe de adherencia, chips neutros, filas
  con check verde solo al tomar y alta en sheet. Detalle: `NOCTURNO-MINIMAL.md` §22; spec y log:
  `odd/tasks/132-6-nutricion.md`; mockup:
  `.superpowers/brainstorm/132.6-nutricion-20261025/content/nutricion-suplementos-v1.html`.
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
- **Cuerpo y progreso (F132.5) mergeado en `main`** el **2026-10-25** (tip `49216fb8`;
  worktree cerrado). Migra `/peso-corporal`,
  `/cuerpo`, `/progreso-fotos` y `/progreso-fotos/comparar`: héroe por pantalla, rango 30/90/Todo,
  mapa muscular redibujado con escala de fatiga neutro→dorado→rojo, última sesión de fotos como
  héroe, sheet por fecha y delta de peso A→B en el comparador. Spec y log:
  `odd/tasks/cuerpo-progreso.md`; detalle: `NOCTURNO-MINIMAL.md` §21; mockup:
  `.superpowers/brainstorm/cuerpo-progreso-20261024/content/cuerpo-progreso-v1.html`.
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
| Peso corporal (F132.5) | `src/pages/PesoCorporalPage.tsx` + `src/components/body-log/` (`WeightHero`, `WeightEvolution`, `WeightHistoryTimeline`) |
| Cuerpo (F132.5) | `src/pages/CuerpoPage.tsx` + `src/components/body/` (`MuscleDummy`, `CuerpoSelected`, `CuerpoLinks`, `fatigueLabels`) |
| Fotos de progreso (F132.5) | `src/pages/ProgressPhotosPage.tsx` + `src/components/photos/` (`ProgressPhotosHero`, `ProgressPhotosCapture`, `ProgressPhotosTimeline`, `PhotoDateSheet`) |
| Comparador de fotos (F132.5) | `src/pages/ProgressPhotosComparePage.tsx` + `src/components/photos/CompareWeightDelta.tsx` |
| Nutrición (F132.6) | `src/pages/NutritionPage.tsx` + `src/components/nutrition/` (`NutritionHero`, `MealTabs`, `MealList`, `AddFoodSheet`, `FoodAdder`, `CustomFoodForm`) |
| Suplementos (F132.6) | `src/pages/SupplementsPage.tsx` + `src/components/supplements/` (`SupplementsHero`, `SupplementRow`, `AddSupplementSheet`) |
| Dominio de nutrición y suplementos | `src/domain/nutrition.ts` (`calculateMacroShares`), `src/domain/supplements.ts` (`todayAdherence`) |
| Spec / decisiones de Nutrición y Suplementos | `odd/tasks/132-6-nutricion.md` |
| Dominio de cuerpo y progreso | `src/domain/bodyProgress.ts` |
| Biblioteca y ficha de ejercicio (F132.7) | `src/pages/EjerciciosPage.tsx`, `EjercicioDetailPage.tsx` + `components/exercise/` (`ExerciseMedia`, `ExercisePrCard`, `ExerciseTechniqueCard`, `ExerciseMuscleCard`, `ExerciseNoteCard`) |
| Guías y papers (F132.7) | `src/pages/GuiasPage.tsx`, `GuiaDetailPage.tsx`, `PapersPage.tsx`, `PaperDetailPage.tsx` + `domain/guideIndex.ts` |
| Calculadoras (F132.7) | `src/pages/CalculadorasPage.tsx`, `ImcPage.tsx`, `CaloriasPage.tsx`, `OneRepMaxPage.tsx`, `AguaPage.tsx`, `ConversorPage.tsx`, `MedidasCorporalesPage.tsx`, `GrasaCorporalPage.tsx`, `NavyPage.tsx` + `components/calculators/` (`CalculatorShell`, `Section`, `Field`, `Result`, `Disclaimer`, `NavyCalculator`, `OneRmRecordCard`, `PlateCalculatorRow`, `RecentCalculators`) |
| Spec / decisiones de Aprender | `odd/tasks/132-7-aprender-nocturno.md` · `docs/superpowers/specs/2026-10-25-f132-7-aprender-design.md` |
| Spec / decisiones de Cuerpo y progreso | `odd/tasks/cuerpo-progreso.md` |
| Ajustes (F132.8) | `src/pages/AjustesPage.tsx` + `src/components/settings/` (`SettingsUI`, `AppearanceSection`, `SessionSection`, `SeriesSection`, `NotificationsSection`, `GeneralSection`, `HelpSection`, `DataSection`, `ReportBugSection`, `TelemetrySection`, `DangerZoneSection`) |
| Términos y Privacidad (F132.8) | `src/components/legal/LegalArticle.tsx`, `LegalContact.tsx` + `src/pages/TerminosPage.tsx`, `PrivacidadPage.tsx` |
| Spec / decisiones de Sistema | `odd/tasks/132-8-sistema.md` |
| Onboarding, modal de logros y tour (F132.9) | `src/components/onboarding/` (`OnboardingWizard.tsx`, `steps.tsx`), `src/components/achievements/AchievementModal.tsx` + `AchievementMedal.tsx`, `src/components/tour/TourOverlay.tsx` |
| Spec / decisiones de Superficies sin ruta | `odd/tasks/132-9-superficies-sin-ruta.md` · `docs/superpowers/specs/2026-10-26-f132-9-superficies-sin-ruta-design.md` |
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


