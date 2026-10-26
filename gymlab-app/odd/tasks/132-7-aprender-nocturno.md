# F132.7 — Aprender (biblioteca, guías, papers y calculadoras)

Objetivo: migrar las 16 rutas de Aprender a Nocturno Minimal sin perder datos, funciones ni contratos e2e.
Rama: `132.7-aprender` (worktree `.worktrees/132.7-aprender`, multisesión pedida por el usuario).
Entrega: 3 work-unit commits de código + 1 de docs en la rama; merge `--ff-only` a `main` cuando las otras sesiones estén idle; sin push.
Runner: `npm test` (Vitest) + `python tests/e2e/scripts/with_server.py <test> --port 5255` (Playwright Python).
Spec: `docs/superpowers/specs/2026-10-25-f132-7-aprender-design.md` · Mockup: `.superpowers/brainstorm/132.7-aprender-20261025/content/aprender-direcciones-v1.html`.

## Specs

- **S1 — Biblioteca (A).** `/ejercicios` pasa a índice editorial: letras A–Z en Oswald 300 doradas, filas hairline con favorito + nombre/meta + «+», búsqueda y filtros existentes, rail A–Z y lista virtualizada intactos. Sin `panel-flush`.
- **S2 — Ficha de ejercicio (media hero).** `/ejercicios/:slug` abre con media 4:3 a sangre, controles flotantes, título Oswald, stat row de 3, e1RM de 104 px sin `ChartCard`, técnica numerada, músculos con barras finas, nota y CTA. `ExerciseMediaHero` acepta `videoUrl?` futuro (video ~3 s, muted/loop/playsInline/poster); hoy sigue mostrando la imagen.
- **S3 — Guías (A).** `/guias` con guía destacada (primera del orden canónico), lista numerada `01…`, categoría en eyebrow, título y resumen; chips existentes. `/guias/:slug` con título Oswald 31, meta, ideas clave numeradas, secciones hairline y disclaimer. Sin `panel-light`.
- **S4 — Papers.** `/papers` con chips de tema, filas hairline (tema, año, título, fuente, PubMed ghost) y disclaimer. `/papers/:slug` con título, meta, DOI, resumen, puntos clave, fuente ghost y disclaimer. Sin `panel-light`.
- **S5 — Hub (B).** `/calculadoras` con búsqueda, recientes y grilla 2×2 de tiles hairline para las 8 calculadoras; discos como utilidad al final; disclaimer. Sin `CalculatorCard` panel.
- **S6 — Calculadoras (result hero).** Las 8 calculadoras usan `CalculatorShell`, `CalculatorField`, `CalculatorResult`, `CalculatorSection` y `CalculatorDisclaimer`: inputs como filas hairline, resultado héroe, desglose y disclaimer. Se conservan lógica, prefill, persistencia y el redirect `macros`.
- **S7 — i18n.** Cero copy hardcodeado en UI: categorías IMC, niveles de actividad, objetivos de macros, clasificación Navy, zonas corporales y pliegues salen de claves es/en; el default del producto sigue en inglés.
- **S8 — Accesibilidad y temas.** Touch ≥ 44 px, foco visible, `aria-label` en controles y gráficas, `prefers-reduced-motion`, noche + día + 6 paletas, estados vacíos honestos.
- **S9 — Contratos.** Rutas, redirect `/calculadoras/macros`, `localStorage['gymlab.recentCalculators']`, favoritos/recientes, PRs, selectores e2e, disclaimers, `useSeo` y analytics intactos.
- **S10 — Verificación y cierre.** Build limpio, suite verde, e2e nuevo `test_f132_7_aprender.py` (375 + 768, 0 `pageerror`), e2e existentes comparados con el baseline de `main`, review nativo antes de cada commit, `PLAN.md`/`CHANGELOG.md`/docs de diseño, sin push.

## Tasks

| ID | Tarea | Spec | Ruta | Estado |
|---|---|---|---|---|
| T0 | Spec + task doc ODD + espejo Engram + e2e RED | S10 | inline | [x] |
| T1 | Biblioteca: índice editorial + ficha con media hero (video-ready) + e2e | S1, S2, S7-S9 | inline | [x] |
| T2 | Guías y papers: destacada + índice numerado + detalles + e2e | S3, S4, S7-S9 | inline | [x] |
| T3 | Hub + primitivas + 8 calculadoras + i18n + e2e | S5, S6, S7-S9 | inline | [x] |
| T4 | Docs, PLAN, CHANGELOG, merge y cierre | S10 | inline | [ ] |

## Log

- **L1** (2026-10-25, pedido literal): «activa multisesion, quiero que hagas 132.7 — Aprender (pendiente), si es necesario usa grillme para preguntas importante, ademas usa mockups para mostrarme el resiultado».
- **L2** (2026-10-25, elección de variantes): «1a,2b,3a,4 ok, 5 ok pero es posible que en un futuro en lugar de fotos vaya un pequeño video de 3 seg, tenlo en cuenta para el diseño, listo dale».
- **Decisiones del agente aceptadas con el «dale»:** la destacada de guías es la primera del orden canónico de categorías (desempate por orden del repo) y se excluye de la lista numerada; los papers no se enlazan desde `/mas` (fuera de alcance); el video futuro se modela como `videoUrl?` opcional en la media, sin datos ni UI nuevos hoy.
- **T0 (2026-10-25):** worktree `132.7-aprender` creado desde `main` (`3bc868ca`); mapa read-only de las 16 rutas; mockup aprobado en `.superpowers/brainstorm/132.7-aprender-20261025/content/aprender-direcciones-v1.html`; spec y task doc escritos.
- **T1 (2026-10-25):** `/ejercicios` pasa a índice editorial (letras Oswald 300, filas hairline, rail A–Z sin píldora, búsqueda/filtros/favoritos/alta intactos) y `/ejercicios/:slug` a media héroe + stat row + e1RM minimal + técnica/músculos/nota hairline + CTA «Añadir a rutina». `ExerciseMedia` acepta `videoUrl?` futuro (video muted/loop/playsInline/poster; reduced-motion cae a la foto). Tests: unit `exerciseMediaVideo.test.tsx` (RED→GREEN), e2e `test_f132_7_aprender.py` (375/768), `test_f93_t19`, `test_f93_t20` y `test_t7` actualizados al default inglés y a la técnica dentro del sheet de acciones. Build limpio; `npm test` **193 archivos / 1838 tests**. Review nativo `review-447cc5bcf49b8488` (medium, lente reliability): **approved + acknowledged (authority burned)** con 8 advisories informativos; los más relevantes para una próxima pasada son **R3-SCROLL-BOTTOM** (el atajo de fondo fuerza la última letra en listas filtradas cortas: condicionar a documento scrolleable), **R3-RAIL-TARGETS** (el rail quedó más angosto: devolver 32 px de ancho), **R3-ROUTINE-UNTESTED** (probar el alta desde la ficha) y **R3-E1RM-MINIMAL** (cubrir el branch minimal).
- **T2 (2026-10-25):** helper puro `splitGuides`/`orderGuidesByCategory` (TDD: test unitario RED→GREEN), `/guias` con destacada + índice numerado y chips, `/guias/:slug` como artículo hairline con ideas clave numeradas, `/papers` con chips/tema/año/PubMed ghost y `/papers/:slug` con resumen, puntos clave y fuente ghost. Se arreglan los advisories de T1: fondo del índice solo si el documento scrollea, rail de 32 px, test de fallback/reduced-motion del video y técnica del sheet de sesión solo en español. Test compartido `scripts/seed_locale.py` + 5 e2e de guías actualizados al default inglés (ya estaban rojos en `main`). Build limpio; e2e nuevo y de guías verdes en 375/768. Review y commit de este work unit: pendientes al cerrar T2.
- **T3 (2026-10-25):** hub con búsqueda/recientes y grilla 2×2 de tiles hairline; primitivas `CalculatorShell`, `CalculatorSection`, `CalculatorField` (fila hairline con `id` opcional para conservar `#tdee-*`), `CalculatorResult` y `CalculatorDisclaimer`; las 8 calculadoras migradas (IMC con escala y rango saludable, calorías con TDEE/rangos/macros, 1RM con PR, agua con vasos, conversor, Navy, medidas y grasa). i18n de categorías IMC/grasa, actividades, objetivos, clasificación Navy, zonas, pares y sitios de pliegues; `ChartCard` minimal vía provider en medidas/grasa; `MeasurementField`, `SexSelector`, ratios y último registro hairline. Tests: nuevos e2e de calculadoras en `test_f132_7_aprender.py`; 8 e2e históricos de calculadoras con `seed_spanish` (t9, t10, t11b, t12, t13, t17, t18, t23) y t7/t19/t20 verdes. Build limpio; `npm test` **194 archivos / 1844 tests**. `test_f103_smoke` sigue rojo en `main` por el reset de DB (se documenta, no es regresión). Review y commit de este work unit: pendientes al cerrar T3.
