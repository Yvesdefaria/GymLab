# GymLab — Fases Completadas (Archivo)

> Solo fases **100% cerradas** (todos los checkboxes marcados, sin ítems pendientes ni revisión pendiente).
> Las fases con pendientes o por revisar están en `PLAN.md`.
> Última actualización: 2026-09-27 | Tests: 1071 | Build: limpio

---

## Era 1 — MVP (Fase 0–7)

| Fase | Nombre | Entregable clave |
|------|--------|-----------------|
| 0–7 | MVP completo | Arquitectura modular, domain puro, DX excellence, TDD, PWA, 60+ tests |
| 8 | Capacitor Android | Build Android con hot-reload |
| 9 | Content archive | Archivos de contenido estático |
| 10 | Domain v2 | Modelos de dominio extendidos |
| 11 | Catálogo ampliado | +500 ejercicios, seeds importados |
| 12 | Guías | Guías de ejercicio con texto |
| 13 | Calendario | Vista de calendario de sesiones |
| 14 | Anillo de progreso | Visualización circular de stats |
| 15 | Dummy + fatiga | Señales de fatiga y dummy data |
| 16 | UX sesión | Mejoras UX en sesión de entrenamiento |
| 17 | Rutinas custom | Creación y edición de rutinas |
| 18 | Cimiento red social | Base para funciones sociales |
| 19 | Mini-calendario | Calendario compacto en home |
| 20 | Modo noche/día | Tema claro/oscuro completo |

## Era 2 — Utilidad (Fase 22–30)

| Fase | Nombre | Entregable clave |
|------|--------|-----------------|
| 22 | Ajustes, unidades | Sistema de ajustes con unidades métricas/imperiales |
| 23 | Catálogo búsqueda | Búsqueda y filtros en catálogo de ejercicios |
| 24 | Sesión inteligente | Sugerencias y autocompletado en sesión |
| 25 | Builder avanzado | Editor de rutinas drag-and-drop |
| 26 | Progreso, PRs | Tab de progreso y récords personales |
| 27 | Backup + PWA | Exportación de datos y Progressive Web App |
| 28 | Catálogo JSON | Catálogo basado en archivos JSON |
| 29 | Dummy rojo + a11y | Estados de error y accesibilidad |
| 30 | Capacitor Android (v2) | Build Android mejorado |

## Era 3 — Calidad UI/UX (Fase 31–37)

| Fase | Nombre | Entregable clave |
|------|--------|-----------------|
| 31 | Pasadas mobile-app-ui-design | Auditoría con metodología mobile-app-ui-design |
| 32 | Tier S restante | Pantallas prioritarias pulidas |
| 33 | Tier A content→seeds | Contenido movido a seeds reutilizables |
| 34 | Tier B utilidad media | Pantallas de utilidad media mejoradas |
| 35 | 5 paletas | Sistema de 5 paletas de color |
| 36 | Asistente de carga | Sugerencia de peso automática |
| 37 | Insights de progreso | Panel de insights y tendencias |

## Era 4 — Auditoría + Performance (Fase 40–50, parcial)

| Fase | Nombre | Entregable clave |
|------|--------|-----------------|
| 40 | Pulido sesión | UX de sesión refinada |
| 41 | Medidas corporales | Tracking de medidas corporales |
| 42 | Tab Estadísticas | Pestaña de estadísticas completa |
| 43 | Animaciones + mejoras UX | Animaciones fluidas y micro-interacciones |
| 44 | Onboarding datos útiles | Onboarding que captura datos relevantes |
| 45 | i18n completa | Internacionalización es/en completa |
| 47 | DRY | Eliminación de código duplicado |
| 48 | Muñeco 3D | Visualización 3D del cuerpo humano |
| 49 | Clean UI | Limpieza visual general |
| 50 | Premium Chart System | Sistema de gráficos premium con Recharts |

> Excluidas aquí: **39** (Lote D opcional pendiente) y **46** (U3 opcional pendiente) → ver PLAN.md.

## Era 5 — Funciones Premium (Fase 51–62)

| Fase | Nombre | Entregable clave |
|------|--------|-----------------|
| 51 | Journal de sesión | Diario de notas por sesión |
| 52 | Recovery Score | Score de recuperación post-entrenamiento |
| 53 | Notificaciones push | Push notifications con Capacitor |
| 54 | Vista semanal | Vista semanal de entrenamiento |
| 55 | Resumen semanal | Resumen automático semanal |
| 56 | Dashboard progreso | Dashboard completo de progreso |
| 57 | Detección estancamiento | Detección automática de plateau |
| 58 | Comparación yo del pasado | Benchmark contra rendimiento pasado |
| 59 | Proyección objetivos | Proyección de alcanzar objetivos |
| 60 | Workout timer | Cronómetro de entrenamiento |
| 61 | Rest timer | Timer de descanso configurable |
| 62 | Calentamiento guiado | Flujo de calentamiento guiado |

## Era 6 — Cerradas sin pendientes (63, 64, 65, 66, 67, 68, 69, 70, 72, 74, 75, 77, 79, 82)

| Fase | Nombre | Entregable clave |
|------|--------|-----------------|
| 63 | Sugerencias inteligentes en sesión | Sugerencia por serie con auto-apply de peso; e2e `test_f63_suggestions.py` (ALL OK) |
| 64 | Repetir último workout | Reutilizar la última sesión rápida |
| 65 | Templates de sesión rápida | 5 plantillas built-in con flujo guiado, enlazadas a ejercicios reales del catálogo (F93 #22) y verificadas en emulador (33/33 checks, 0 pageerror). **Crear/editar/eliminar templates custom: NO HECHO** — removido de la UX en `0e28071` (el formulario no funcionaba en PWA) y no se rehízo; la persistencia Dexie `workoutTemplates` (v11) y 11 claves i18n quedan sin uso. Cierre por decisión del usuario (2026-09-22) |
| 66 | Selector por equipamiento | «Mi equipamiento» multi-selección que filtra el catálogo; e2e `test_f66_equipamiento.py` (ALL OK) |
| 67 | Planificador por objetivo + equipamiento | Equipamiento derivado, plan generado contra el catálogo, `PlanificadorPage` + ruta `/rutinas/planificador`; verificado en emulador por CDP y con review **APROBADO** (lineage `review-336782e7c5d7f7e2`) |
| 68 | Retos dinámicos adaptativos | 10 retos predefinidos (frecuencia, volumen, PR, consistencia) con barra de progreso, duración por reto y tabs accesibles; recompensa con el logro «Primera meta» (`primer-reto`) al completar un reto — conteo histórico `countEverCompletedChallenges`; 3 fixes reales tras revisión a fondo en emulador. Sin e2e propio; commits sin ciclo de review (tooling RDD bloqueado + declinación explícita del usuario) |
| 69 | Comparativa de sesiones (rediseño) | Orden cronológico anterior→posterior, 11 métricas + calorías estimadas (MET × peso × duración) como 12ª métrica; e2e `test_f69.py` ALL OK y emulador por CDP (107→160 kcal); review del rediseño **APROBADO** (lineage `review-e263f790da52d942`); el incremento de calorías quedó sin review por un defecto de runtime del transporte de review |
| 70 | Benchmark tests de fuerza | 4 compuestos (sentadilla, banca, peso muerto, press militar) con 1RM estimado (Brzycki) + percentil/nivel/gauge (F71) y tracking de mejora; tabla Dexie `benchmarkResults` (v6) + `BenchmarkTests`/`BenchmarkEvolutionChart`. Revisión 2026-09-22 en emulador por CDP (ALL OK: 0 chips en vacío, 1 con test vencido, stat del gráfico 123.8 kg, 0 pageerror) + 3 cierres de revisión (chip sin datos, redondeo del stat y 37 tests de dominio nuevos) con review **APROBADO** (lineage `review-1d0f3c1ece671c3c`; 2 advisory no bloqueantes). Sin e2e propio; fixes en `b9ca2fd` |
| 72 | Periodización visual | Mesociclos con drag & drop + auto-sugerencia (`autoPeriodization.ts`) |
| 74 | Balance push/pull/pierna | Análisis de balance entre patrones de movimiento |
| 75 | Exportar sesión como imagen | Resumen de sesión en canvas 1080×1080 con 3 plantillas (classic/hero/compact), nombre del entrenamiento y PRs reales por ventana; share nativo con fallback a descarga; e2e `test_f75.py` ALL OK (2026-09-25). La validación en teléfono físico queda encolada en F93 #15 |
| 77 | Suplementación | Tracking de suplementos |
| 79 | Fotos de progreso | Captura por ángulo (frente/lateral/espalda, resize 800 px), timeline y eliminación; tabla Dexie `progressPhotos`; evolucionada por F106 (cámara/galería nativas + comparador en página propia). La validación en teléfono físico queda encolada en F93 #15 |
| 82 | Calculadora Navy | Calculadora de grasa corporal (método Navy) |

> **73, 81, 83** tienen pendientes o revisión pendiente → ver PLAN.md.

## Era 7 — Cerradas (85, 86, 87)

| Fase | Nombre | Entregable clave |
|------|--------|-----------------|
| 85 | Drag-and-drop builder | Builder de rutinas con drag-and-drop |
| 86 | Limpieza DRY split | Segunda pasada DRY post-reestructuración |
| 87 | Testing pantallas estrechas | Tests E2E en 375×812 (mobile-first) |

> **84 (84a–84g)** tiene pendientes (84d widget, 84e journal) → ver PLAN.md.

## Era 8 — Legal + Auditing (89, 91, 92)

| Fase | Nombre | Entregable clave |
|------|--------|-----------------|
| 89 | Términos y condiciones | T&C + Privacidad con legal.ts compartido |
| 91 | Reestructuración datos | Reorganización del domain layer |
| 92 | Auditoría páginas | Auditoría completa de todas las páginas |

## Era 9 — Fotos de progreso (106)

| Fase | Nombre | Entregable clave |
|------|--------|-----------------|
| 106 | Fotos de progreso: cámara + comparador | Cámara y galería nativas (`@capacitor/camera@8.2.4` + sheet de fuente) en fotos de progreso y avatar; «Guardar en galería» con álbum propio (`@capacitor-community/media@9.1.0`; web = descarga); comparador en página propia `/progreso-fotos/comparar` (vista dividida A/B + alternar, i18n es/en). e2e `test_f106_camara/guardar/comparar.py` ALL OK y emulador (la ruta multi-segmento monta; foto verificada en la galería del dispositivo). Reviews nativos APROBADOS: `review-b630ad191031c12c` (T1), `review-8a38b0487553b6fd` (T2), `review-c6c44ed570fff762` (T3), `review-11e11256c0cf5b0e` (fix e2e). Commits `253f898`, `bf51738`, `e1282f2`, `2e16eba` |

## Era 10 — Cierres 2026-09 (66/67-pulido, 71, 76, 78, 80, 88, 90, 95, 96, 97, 98, 99, 107)

| Fase | Nombre | Entregable clave |
|------|--------|-----------------|
| 66/67 · pulido | Pulido de la rutina guiada por equipamiento (duración, días coherentes, rediseño visual) | Duración elegible (estimador + ajuste ±5 min aplicado siempre; chips 30/45/60/90 con default del onboarding), seed curado sin grupos en días consecutivos (test de coherencia con 32 exenciones documentadas, `SEED_VERSION '23'`), generador con split de 2 días / reorder de 4 / dedupe cross-day, dirección A en planificador y resumen (cards de día con músculos y `≈ N min`), advisories R3-001/002/003. SDD completo: 7 tareas + review final de fase (1 Critical corregido en fix wave). Verificado: `npm test` 96 archivos / 1071 tests, build limpio, e2e `test_f66_f67_planificador.py` + `test_f66_f67_rutina_guiada.py` ALL OK. Commits `6e8d7bb`…`229fc65` |
| 71 | Estándares de fuerza (percentiles) | `strengthStandards.ts` con datos reales (IPF/USAPL) + `StrengthGauge` (percentil por peso/sexo/edad), i18n es/en. Sin test dedicado propio: su percentil/gauge ya se integra en los benchmarks de F70 (archivada). Aprobada por el usuario (2026-09-26) |
| 76 | Nutrición | Domain `nutrition.ts` + tabla `mealEntries` + repo/hook + `/nutricion` (resumen diario, formulario, historial, integración TDEE); revisión UX mobile (Playwright 390×844). Tests: `nutrition.test.ts` + e2e `test_f76.py`. Aprobada por el usuario (2026-09-26) |
| 78 | Logros extendidos | +15 logros (cardio, volumen, rachas, metas) + `/logros` + chapas en el perfil; cobertura por las suites de logros (`achievements`/`achievementProgress`) y los e2e de chapas (F93 #16 / F95). Aprobada por el usuario (2026-09-26) |
| 80 | Smart Routines (rutinas adaptativas) | Toggle «Adaptativa» + sugerencias de peso al iniciar día + conexión con la periodización. **Superseded por F97**: el motor `adaptiveRoutine` fue retirado al unificar la carga en `recommendLoad`. Aprobada por el usuario (2026-09-26) |
| 88 | Rutinas predefinidas clonables | UI de edición (clonar → editor), editor de días y de ejercicios (drag & drop), guardado como «mi rutina», badge «Basada en…», persistencia en el mismo esquema, tests de dominio + flujo. Convención: i18n EN del seed verificada al 100% (`ROUTINES_EN` 68/68, `ROUTINE_DAYS_EN` 220/220; cada rutina/día nuevo suma su clave EN). Aprobada por el usuario (2026-09-26) |
| 90 | Tooltips de ayuda contextuales | `InfoTip` accesible (foco, cierre, 44 px) + catálogo central de ayudas (`help.*`) + tooltips en estadísticas, Recovery Score (rangos reales 0–39/40–69/70–100), Deload (copy corregido al 10%) y RIR/RPE (90.6; 90.5 descartado por decisión). Cadena `9591af3`…`c83b2e1` con verificación y emulador; el review RDD no completó (transporte roto) — cierre explícito del usuario |
| 95 | Gamificación y celebración | Celebración ampliada + variantes de chapa por re-logro (F95.1), foto de sesión estilo Strava con 3 plantillas (F95.2) y progreso de logros con barras accesibles (F95.3; hoy 16 ids, F68 sumó `primer-reto`). Commits `a6e4e0f`…`7111fe0` (+ `5ca6675` seeds e2e). Re-verificada (2026-09-27) en worktree aislado (`f95-verificacion`, HEAD `deb7ca4`): `npm test` 96 archivos / 1071 tests, `npm run build` limpio y e2e `test_f95.py` ALL OK (6 contextos, 0 errores de consola). Salvedades: haptics y confeti animado en modo normal sin aserción automatizada directa (cobertura estructural; reduced-motion sí cubierta por e2e); chapas del perfil sin cobertura e2e (solo `/logros`); arte IA de F94 diferido (no bloqueante, variantes CSS-first); `guias-completas` incompleta hasta que exista señal de guía completada (target dinámico, por diseño). Cierre con salvedades aceptado por el usuario (2026-09-27) |
| 96 | Timer, descanso y feedback físico: deadline, modo Auto, formato y alerta nativa | Cuenta atrás por deadline absoluto (`src/domain/countdown.ts`), descanso en curso persistido y reconciliación al volver (`visibilitychange`/`appStateChange`/rehidratación); modo **Auto** pegajoso (`src/domain/restSelection.ts`: preset explícito > `restSec` de rutina > heurística); formato `TimeFormat` (`clock`/`mm:ss`/`seconds` + ajuste en Ajustes) y haptics unificados (`src/lib/haptics.ts`); alerta nativa del SO vía `@capacitor/local-notifications` (id 9601; en web no-op con techo declarado). Re-verificada (2026-09-27) en worktree aislado: `npm test` 96 archivos / 1071 tests, `npm run build` limpio y e2e `test_f96_timer.py` ALL OK (5 escenarios). **Alerta nativa verificada en emulador API 37 (2026-09-27) con el proceso muerto** (`am kill`): el SO arranca el proceso solo para entregar la alarma (`Start proc … for broadcast TimedNotificationPublisher`) y publica la notificación (`id=9601`, «Rest finished»); dispara exacta (2 ms) con `SCHEDULE_EXACT_ALARM` allow y con el appop default cae al fallback inexacto (+29,5 s), sin duplicados al reanudar. Queda el smoke en dispositivo físico (F111 / validación de release) |
| 97 | Data unificada y sugerencias de carga | Parser decimal compartido `parseDecimal`/`DecimalInput` (coma y punto, nunca coacciona a 0) en sesión, calculadoras, medidas, ajustes e importación CSV; mensajería de descanso unificada (`restAdviceMinutes` sobre `calcRestRecommendation`); motor único de carga `recommendLoad` (media del top-set de las últimas 5 sesiones → sesión viva → PR; RIR que sólo des-amplifica; redondeo a placa y PR como techo estricto con `capped`). Re-verificada (2026-09-27) en worktree aislado: `npm test` 96 archivos / 1071 tests, `npm run build` limpio, 8 archivos unit de F97 (85 tests), e2e `test_f63_suggestions.py` ALL OK (13 checks, incl. F97.2/97.3/97.5) y regresión `test_f96_timer.py` ALL OK; seed del e2e reparado (el modal de F68 lo bloqueaba) con review nativo APROBADO `review-a8b86485703429f9`. **Smoke del teclado decimal en WebView (dispositivo real) y de la importación CSV con archivos reales sin verificar**: encolado a la validación de release |
| 98 | UX de la sesión activa: notas, sugerencia por bloque, picker de dos zonas, Enter y borrado con recálculo de PRs | Notas de sesión (`SessionHeaderNote`; debounce 400 ms + flush en `pagehide`, snapshot `notes`), chip de sugerencia por bloque (`useBlockSuggestions` + `SuggestionChip`; retiro del overlay y del gate de ≥2 series), filas selectoras de dos zonas (`ExercisePicker` en sesión/builder/GoalSetter + alta desde catálogo con `RoutineDestinationSheet` y undo), cadena de foco con Enter (`DecimalInput` + `setInputChain` puro + `resolveDraftCommit`, sin ceros), `SetRow` en dos líneas dentro de 343 px sin scroll horizontal, y borrado de sesión con `ConfirmSheet` + cascada transaccional (`workouts`/`workoutSets`/`sessionJournals`/`prs`) + recálculo idempotente de PRs (`bestPRFromSets`). Re-verificada (2026-09-27) en worktree aislado: `npm test` 96 archivos / 1071 tests, `npm run build` limpio y e2e F98 5/5 ALL OK (notas, cadena de foco, picker, borrado, memo). **Smoke en dispositivo real sin verificar** (teclado real con `enterKeyHint`, ergonomía de la cadena y fila en force-mode a 375 px): encolado a la validación de release; sdd-verify formal no ejecutado. Commits `7248bed`…`5ca6675` |
| 99 | Home y layout | Selector de día en el hero (99.1): «Empezar» abre siempre `DaySelectorSheet` (patrón `RoutineDestinationSheet`, filas de 44 px, cierre por backdrop/X/Escape) y botón «Cambiar día» solo sin sesión activa; días sin ejercicios filtrados en dominio puro (`selectableDays`/`resolveDayStart` + `useRoutineDaysWithItems`) y flujo de día vacío con `ConfirmSheet` + `EmptyDayToast` sin crear sesión. Landscape (99.2): manifest PWA `orientation: 'any'` + escalera del shell `max-w-lg`→`2xl:max-w-7xl` (`overflow-x-clip`) + hero `landscape:p-4`. Re-verificada (2026-09-27) en worktree aislado: `npm test` 96 archivos / 1071 tests, `npm run build` limpio (PWA v1.3.0), `check_manifest.py` OK y e2e `test_f99_home_layout.py` ALL OK (A.9/A.10/A.11 + 6 buckets landscape + TabBar). **Smoke nativo en emulador Pixel_10 (API 37)**: rotación real a landscape 923×411 con shell 768 px (md) centrado, sin overflow y hero p-4; selector de día (3 filas, día vacío ausente, fila de 44 px, cierre por Escape) y ruta multi-segmento `/calculadoras/imc` OK; 0 pageerror. sdd-verify formal no ejecutado (la change nunca se persistió; la verificación local + smoke es la evidencia de cierre). **Smoke en teléfono físico y PWA standalone instalada: encolados a la validación de release.** Commits `53c77dd`…`f1291e1`. Aprobada por el usuario (2026-09-27) |
| 107 | Icono y splash Android sin zoom, en negro y nítidos | Icono adaptativo con inset restaurado y foregrounds a 108dp regenerados desde `logo.svg`; splash de arranque 100% negro `#121214` (theme de launch + 11 PNG). Verificado en emulador API 37 (CDP: `root_children 1`, 0 pageerror). Commit `4dba4cf`. Aprobada por el usuario (2026-09-26) |

> **73** (solo validación física) y **81** también siguen en PLAN.md.

## Fase 93 — ítems cerrados

| # | Nombre | Estado |
|---|--------|--------|
| #1–#12, #14, #16–#19 | Auditoría + fixes | Cerrados (formularios, rachas, búsqueda, categorías, calculadora agua) |
| #20 | Guías de técnica | Cobertura completa ES+EN para 873 ejercicios |
| #23 | Auditoría de inputs | E2E `test_f93_t23_inputs.py` (9 rutas), 297 tests |
| #24 | Auditoría rendimiento | Baseline medido, sin optimización necesaria |
| #25 | Limpieza código muerto | Dead code eliminado + unificación DRY, 411 tests |
| #26 | Términos y condiciones | Expansión y rediseño de T&C |
| #27 | Mapa de calor de uso | Telemetría local Sentry + PostHog con consentimiento |
| #28 | Grid «Más» 3 columnas | Grid de 2→3 columnas optimizado |
| #29 | Formulario reporte errores | Formulario en Ajustes con validación |
| #31 | Rediseño deload | DeloadCard con score y barras |

> **93 #8 (imágenes guías), #15, #21, #22 (revisión futura), #30** tienen pendientes → ver PLAN.md.

---

## Notas

- **Tests**: 458 (42 archivos) + E2E 48/45 (10 scripts)
- **Build**: `tsc` limpio, `vite build` limpio, lint warnings preexistentes
- **Commits recientes**: `4a9c4c6` (auditoría), `20b7914` (F35-F46), `31c90d7` (F91-F92), `3f625df` (i18n), `31c90d7` (codebase graph)
- **Última auditoría**: 2026-09-09 — el catálogo, dominio, utils y hooks están en excelente estado

---

*Este archivo es un registro de referencia. Las fases activas, pendientes y por revisar están en `PLAN.md`.*