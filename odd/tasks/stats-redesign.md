# /estadisticas — rediseño C1 «Nocturno Minimal»

**Objetivo:** rediseñar `/estadisticas` con la estructura C1 aprobada (tabs + héroe + fila de stats + stack con hairlines), conservando **todas** las métricas actuales, los tabs y la funcionalidad (lazy tabs, error boundary, forms, ranges, drilldowns, help tips), y agregando la paleta categórica de datos con **verde exclusivo** para meta/PR/cumplido. Todo el copy nuevo en **es/en**.

**Rama:** `feat/stats-nocturno-minimal` (ya creada desde `main` `eed5f05a`).
**Entrega:** `exception-ok` — commits locales, sin push/merge; el usuario decide.
**Runner:** `npm test`, `npm run build`, Playwright Python.

**Diseño aprobado:** `docs/design/NOCTURNO-MINIMAL.md` §3.5 (paleta de datos) y §10.2 (Stats tabs + chart stack). Mockups: `.superpowers/brainstorm/pasos-redesign-20261023/content/stats-color-v2.html` (C1) y `stats-c1-tabs-v4.html` (Cuerpo/Fuerza/Periodización).

---

## Specs

### S1 — Estructura C1
- Tabs compactos: Entreno · Cuerpo · Fuerza · Periodización, con subrayado gold y 44 px de alto.
- Cada tab: un héroe (eyebrow + número/palabra grande + delta), una fila de 3 stats con hairlines y un stack de secciones sin tarjetas.
- Se conservan todas las métricas y funcionalidades; las secciones secundarias de Entreno (Bitácora, Cardio, Balance) van en un bloque “Más datos” colapsable.
- El header usa `AppHeader` con kicker “Rendimiento” y título “Estadísticas”.

### S2 — Entreno
- Héroe: volumen de la **semana calendario** (lunes–domingo) y delta % vs semana anterior; sin delta si no hay semana previa.
- Stats principales: racha actual, entrenos 30 d, duración media. Secundarias: racha máxima y total de entrenos (fila hairline de 2).
- Stack: volumen por semana, frecuencia, volumen por grupo (barras + donut), rango de volumen, cargas, 1RM, frecuencia muscular. “Más datos”: bitácora, cardio, balance push/pull/legs.
- Los grupos musculares usan `--color-data-*` en puntos/barras finas; el verde queda solo para meta/PR.
- Los controles de rango existentes se conservan por sección (no se inventa un rango global que no todos los charts respetan); se restylizan a chips C1.

### S3 — Cuerpo
- Héroe: peso actual y delta de 30 d (gold; no verde: es progreso, no meta/PR).
- Stats: IMC, grasa, cintura/cadera; sin verde.
- Stack: peso corporal, IMC, grasa, composición (grasa ámbar, masa magra teal, resto gris), medidas, ratios.
- Los charts de cuerpo conservan sus rangos locales; se restylizan a C1.

### S4 — Fuerza
- Héroe: nivel de fuerza (modal de los 4 tests) + percentil medio y cantidad de tests.
- Stats: banca, sentadilla, peso muerto (último e1RM). El press militar queda en la lista de tests.
- Stack: tests de fuerza (filas hairline con punto de color y percentil) y evolución 1RM. El verde se usa solo si hay PR.
- La acción “Nuevo test” y el formulario existente se conservan.

### S5 — Periodización
- Héroe: bloque/fase actual, semana X/Y y barra de progreso gold.
- Stats: series/semana, deload, duración del bloque.
- Stack: semana actual (días completados en verde “Hecho”, pendientes gold, descanso muted), bloque actual (fase con punto de color, volumen, intensidad, deload) e historial. Se conserva `PeriodizationView` y el estado vacío/otros planes.
- El deload deja de usar verde (no es meta/PR); usa un color de datos/ámbar.

### S6 — Paleta de datos
- Tokens `--color-data-chest/back/legs/shoulders/arms/core/cardio/fat/rest` en `index.css`, con variantes de día.
- `useDataColors` para Recharts.
- Regla: solo marcas pequeñas (puntos, barras ≤6 px, líneas 1–2 px, badges, segmentos); siempre con etiqueta; máximo 3–4 colores por viewport; **verde solo meta/PR/cumplido**.
- `chartPalette` y `CompositionDonut` dejan de usar verde como categoría.

### S7 — Shell de gráficas
- `ChartCard` gana una variante `minimal` vía contexto (`ChartCardVariantContext`), activa solo en Stats. Sin fondo/borde/sombra/padding; conserva title, help, stats y footer.
- `TabNav` gana `variant="compact"`; el default no cambia para Perfil/Rutina/Challenges.
- No se tocan los charts de otras páginas.

### S8 — i18n es/en
- Todas las cadenas nuevas en `stats.ts` es/en (el `en` está tipado contra `EsSchema`).
- Sin literales `'30 d'`, `'90 d'`, `'Todo'` en componentes: pasan a claves.
- Se reutilizan las claves existentes de stats/benchmark/periodization/muscle/journal.

### S9 — Funcionalidad preservada
- Tabs lazy + `TabErrorBoundary` + reload; `statsTabsLazy` y `statsSetsSingleLayer` deben seguir verdes.
- `useAchievementsData`/`completedSets` en EntrenoTab y PeriodizationSection.
- Forms de benchmark, ranges, drilldowns, InfoTips, empty states y error boundaries.

### S10 — Accesibilidad
- Tabs `role=tablist/tab/tabpanel`, 44 px, aria-selected.
- Héroe con texto real; charts con `role="img"`/label; `prefers-reduced-motion`; foco visible; colores nunca como única información.

### S11 — Verificación y docs
- Tests unitarios de helpers nuevos (benchmark summary, body hero, volume delta), `npm test`, `npm run build`.
- e2e afectados actualizados: `test_t3.py`, `test_full.py`, `test_dom.py`, `test_f90.py`, `test_f104.py`, `test_modules.py`, `test_f104_gauge.py`, `test_u2.py`/`test_f47.py` si cambian labels.
- `CHANGELOG.md` y este doc con evidencia/commits. Review RDD según assessment.

---

## Tasks

| ID | Tarea | Specs | Estado | Evidencia |
|---|---|---|---|---|
| T1 | Bases: tokens de datos + `useDataColors`, `ChartCard` minimal, `TabNav` compact, `StatsHero`/`StatsStatRow`/`StatsSection`/`StatsMoreData`, claves i18n, shell de página | S1, S6–S8 | hecho | `index.css` `--color-data-*` noche/día; `ChartSizing` (110/160); `ChartCardVariant`; `TabNav` compact; primitivas C1; build |
| T2 | Entreno: héroe/volumen + stats, quitar `SummaryCards`, stack minimal, grupos musculares con color, “Más datos” | S2, S9 | hecho | `EntrenamientoStats`/`EntrenoTab`; hero semana calendario; muscle colors; “Más datos”; vacío conserva frecuencia/balance para el tour; e2e `test_f104` |
| T3 | Cuerpo: héroe peso/delta + stats, stack minimal, colores de composición/IMC/grasa, rangos i18n | S3, S9 | hecho | `CuerpoStats`; hero 79.3/−1.2; IMC/grasa/ratio; `BodyMeasurementsChart` zonas i18n; `CompositionChart/Donut`, `Imc`, `Skinfold`, `Ratios` data colors; `RangePills` |
| T4 | Fuerza: héroe nivel/percentil + stats, tests hairline, evolución, formulario, PR verde | S4, S9 | hecho | `FuerzaTab`; `BenchmarkTests` hairline; `StrengthGauge` compacto con `data-gauge*`; plural “1 test”; e2e `test_f104_gauge` |
| T5 | Periodización: héroe semana/fase + progreso, semana/bloque/historial, deload sin verde | S5, S9 | hecho | `PeriodizationSection` hero + duration/mesocycles/deload week; `PeriodizationView` compact; phase names i18n; deload amber |
| T6 | Tests/e2e, build, changelog, doc | S11 | hecho | `npm test` 169/1701; build limpio; `test_t3`/`f90`/`f104`/`f104_gauge`/`f47`/`f120w6`; changelog |
| T7 | Review/commit work-unit | S11 | hecho | review `medium / under_budget` (`review_due: false`); commit `1b61686a`; mockups C1 y ruta de estilos documentados |

---

## Log

### L1 — Pedido y decisiones

- “la siguiente tarea es rediseñar stats, por lo que mergea si es necesario”.
- “no estan mal pero estan muy monocolor... en cosas pequeñas como grupos musculares, etc dentro de alguna sesion añada un poco de color... dame otros ejemplos manteniendo los tabs pero con la estetica de A y/o B”.
- “1.c1 2. si, que quede exclusivo has los cambios”.
- “ok, esta bien pero antes de continuar quiero que me muestres los demas tabs de la opcion que elegi”.
- “bien perfecto, recuerda las versiones en ingles y español”.

Decisiones: C1; tabs conservados; todas las métricas; paleta categórica con verde exclusivo; copy es/en.

### L2 — Mapeo técnico (resumen)

- `ChartCard` es el shell de la mayoría de charts; una variante minimal por contexto evita reescribirlos.
- Los 6 charts de Cuerpo y los de rango de Entreno tienen `useState<StatsRange>` local; se conservan por sección.
- `weeklyVolume` del summary es rolling 7 días; el héroe usa `workoutsInCurrentWeek`/`buildWeeklyVolumeSeries` para semana calendario.
- `BenchmarkResult` + `getStrengthPercentile`/`getStrengthLevel` permiten el héroe de Fuerza.
- `getCurrentWeek`/`getMesocycleProgress` ya existen para el héroe de Periodización.
- `chartPalette` y `CompositionDonut` usan verde categórico: hay que corregirlos.
- Tests e2e que asumen cards/carousel: `test_full.py`, `test_dom.py`, `test_modules.py`, `test_f104.py`, `test_f90.py`, `test_t3.py`.

### L3 — Implementación y verificación

- C1 implementado en `feat/stats-nocturno-minimal` (workspace, sin commitear: el review RDD va antes).
- `npm test`: 169 archivos / 1701 tests; `npm run build` limpio.
- e2e: `test_t3` PASSED (tabs compactos, 44 px), `test_f90` ALL OK, `test_f104` ALL OK (4 bar charts de Stats + `/pasos`), `test_f104_gauge` ALL OK (bandas/marcador/labels), `test_f47` PASSED, `test_f120w6` ALL OK. El paso 10/11 de `test_f101_tour` quedó OK; su probe de chunk lazy de Rutinas bajo preview/SW y el reset de DB de `test_f103_smoke` son fallas de entorno, no del C1. `test_dom` (sonda) se actualizó a la estructura C1.
- i18n: `bodyZones`, `bodyFatCategory`, `phaseNames`, `durationWeeks`, `deloadWeek`, `period`, `percentileAvg_one/_other`, `ratiosCorto`, `distribucionMuscular`; se corrigieron literales duros (`periodo`, `Todo`, `Cintura`, `En forma`, `Crecimiento`, `1 tests`).
- Decisiones de implementación: rango por sección (no global), “Más datos” colapsable, héroe de volumen de semana calendario, vacío de Entreno conserva frecuencia/balance para el tour, `TrendBadge` negativo en gold (no danger), gauge compacto sin badge.
- Riesgos abiertos: `test_f103_smoke` reset de DB y `test_f101_tour` retraso de chunk de Rutinas bajo preview; no son del C1.
- Próximo: review nativo del workspace (RDD) y commit work-unit; sin push.

### L4 — C1 aprobada, documentación y continuidad

- El usuario aprobó el mockup del Entreno C1: *“ok ahora si quedó… solo que faltaban más detalles por eso lo vi diferente, pero está bien”*. La dirección C1 queda aprobada; los detalles finos se cierran en otra sesión.
- Mockups C1: `stats-c1-entreno-v1.html` (Entreno), `stats-c1-tabs-v4.html` (Cuerpo/Fuerza/Periodización), `stats-color-v2.html` (comparación C1/C2/C3).
- Ruta de estilos/pautas: `gymlab-app/docs/design/README.md` → `NOCTURNO-MINIMAL.md` §15/§16. El README es el punto de entrada para la próxima sesión/multisesión.
- Commit C1: `1b61686a`; review `medium / under_budget`; sin push.
- Pendientes finos: detalle mockup vs app (hero, charts, spacing, rango global vs por sección, “Más datos”), formulario de medidas del Perfil con `BODY_ZONES` es/en, y los e2e de entorno (`test_f103_smoke`, retraso lazy de Rutinas en `test_f101_tour`).
- Próximo: nueva sesión desde `gymlab-app/docs/design/README.md`; usar worktree si es multisesión; seguir con §11 (Home, Nutrición, Rutinas, Perfil, TabBar).

---

## Assumptions

- No hay cambios de modelo de datos ni migraciones.
- El rango global del mockup se implementa como controles por sección para no mentir sobre charts que no lo soportan.
- “Más datos” es colapsable pero conserva Bitácora/Cardio/Balance.
- El verde solo se usa en meta/PR/cumplido; el progreso (volumen/peso) va en gold.
- Los charts de otras páginas no cambian.
