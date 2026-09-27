# GymLab — Fases Completadas (Archivo)

> Solo fases **100% cerradas** (todos los checkboxes marcados, sin ítems pendientes ni revisión pendiente).
> Las fases con pendientes o por revisar están en `PLAN.md`.
> Última actualización: 2026-09-29 | Tests: 1148 | Build: limpio

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
| 53 | Notificaciones push | «Push» de la PWA con la Web Notifications API — nunca funcionó en el WebView nativo; reemplazada por las notificaciones locales del SO (F96/F111). No hay push remoto |
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

## Era 10 — Cierres 2026-09 (66/67-pulido, 71, 76, 78, 80, 88, 90, 95, 96, 97, 98, 99, 101, 104, 105, 107, 108)

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
| 104 | Gráficos: selección de barras + test de fuerza | Bar charts: fuera el fondo gris del cursor del tooltip de Recharts (`cursor={false}` en los 5) y barra activa con borde de alto contraste (`activeBar` con `colors.fg`, 2.5px — claro en tema noche / oscuro en día; ajustado tras feedback visual; verificado a 390 y 320 px sin overflow). Gauge de fuerza: bandas alineadas a los umbrales reales de nivel (helper puro `gaugeLayout.ts`: `[0,p50) [p50,p75) [p75,p90) [p90,maxVal]` + etiquetas centradas sobre su banda; el dominio `getStrengthLevel` era correcto) con e2e `test_f104_gauge.py`. e2e `test_f104.py` ALL OK; `npm test` 97 files / 1075 tests. Reviews APROBADOS: `review-4af04f03fc14f377` y `review-2234e3f2f02cab1e` (3 findings no bloqueantes cada uno; completados vía CLI con `OPENCODE_EXPERIMENTAL_OUTPUT_TOKEN_MAX=200000`). Commits `4a5094d`…`18167ed` (7; borde final `0ccac21`+`18167ed`) |
| 105 | Compartir sesión: share nativo real, guardar en galería y resumen sin recorte | El botón Compartir deja de ser un no-op en nativo: `@capacitor/share` + `@capacitor/filesystem` (v8) escriben el PNG de la tarjeta al `Directory.Cache` (base64 sin `encoding` — el camino binario documentado de v8, confirmado contra la doc oficial, la impl web y los issues del plugin) y abren el chooser de Android; en web `canShare` + fallback a descarga con `AbortError` distinguido de fallo real; «Descargar» pasa a «Guardar en galería» reusando `saveToGallery` (álbum «GymLab»); lógica pura en `src/lib/shareImage.ts` (13 tests). Layout: el recorte a 360 px era el `SwipeRow` del carrusel de stats (desbordaba 12 px por lado, medido) → `max-w-full` en su root + `w-full` en el bloque de compartir, con e2e nuevo `test_f105.py` (encaje a 360 + fallback a descarga). Verificado: `npm test` 101 files / 1114 tests (post-rebase sobre main), `npm run build` limpio, e2e F105/F75/F95 ALL OK (`--port 5181`) y **emulador Pixel_10**: chooser real con la tarjeta renderizada, `gymlab-<fecha>.png` en la galería del dispositivo (MediaStore), 0 `pageerror` y `navigator.share`=undefined en el WebView (confirma el diagnóstico). Review: 4/4 lentes capturados; cierre parkeado en `correction_required` por un falso positivo verificado del lente reliability (R3-001: el enum v8 no expone `Encoding.Base64`) con delta honesto aplicado (comentario + test de regresión del contrato) y decisión explícita del usuario ante la infra flaky. Commits `34c067f`, `51a6a87`, `9d83baa`, `0baf5fd`, `0881cf0`. |
| 107 | Icono y splash Android sin zoom, en negro y nítidos | Icono adaptativo con inset restaurado y foregrounds a 108dp regenerados desde `logo.svg`; splash de arranque 100% negro `#121214` (theme de launch + 11 PNG). Verificado en emulador API 37 (CDP: `root_children 1`, 0 pageerror). Commit `4dba4cf`. Aprobada por el usuario (2026-09-26) |
| 101 | Onboarding guiado: tour, tips de primera vez y fix del wizard | Tour guiado híbrido (overlay con spotlight sobre la UI real, 8 pasos con navegación guiada, Skip/Escape y arranque único tras «Empezar D1»; `1dc041f`/`102c0c4`), replay desde Ajustes → Ayuda con toggle de consejos (`09b2959`), tips de primera vez por apartado con sellado «visto» (`cac0111`) y wizard con scroll por gesto real en pantallas chicas (`5885e98`). El e2e de cierre destapó dos carreras de `SectionTipHost`/`TourOverlay` (el cierre del tour pisaba las secciones cubiertas y el tip aparecía con el tour abierto), corregidas en T8 con merge de lo último persistido + gate imperativo del store. Verificado: `npm test` 99 archivos / 1097 tests, `npm run build` limpio, e2e `test_f101_tour.py` + `test_f101_wizard_scroll.py` + `test_f44.py` ALL OK (`--port 5179`) y smoke nativo en emulador-5554 (0 pageerror; tip=0 durante el tour; las 5 secciones cubiertas marcadas; rutas multi-segmento montan; el IME flotante del AVD deja la validación completa del teclado para release). Commits `1dc041f`…`cac0111` + `6ca19c3` (cierre T8) |
| 108 | Pasos: permiso al inicio y sync al abrir | El permiso de Health Connect se pide **una sola vez** en el primer arranque usable (wizard de onboarding fuera de pantalla) con `checkPermission()` sin diálogo; controlador global `healthSyncController` (estado único + dedupe `inFlight`) compartido por `AppShell` y `/pasos`; sync `auto` al abrir y al volver a primer plano (una consulta incremental por evento, sin timers ni batería extra — Health Connect ya acumula con la app cerrada); flag `meta.healthPermissionAskedAt` y reintento manual por el banner de `/pasos`; web degrada a `unavailable` como antes. Review de Gentle AI (linaje `review-b6ff2fbb2fa54c21`): el reviewer **completó** con el workaround sin reinicio documentado (cap de 32k de OpenCode; `OPENCODE_EXPERIMENTAL_OUTPUT_TOKEN_MAX=200000`) y emitió hallazgos — **R3-001 (CRITICAL, corregido en `949319a`)**: posible segundo diálogo de consentimiento si un reintento manual concluye durante la espera del arranque (ahora se re-chequean permiso y flag tras la espera y el reintento manual persiste el flag); **R3-002 (WARNING, follow-up en PLAN)**. **Cierre parkeado en `correction_required`**: el re-entry del STATUS exact-lineage resuelve 'unrelated' de forma determinista (defecto de infra del store compartido en multisesión; misma clase que F104) — linaje preservado y retomable tras reiniciar OpenCode. Verificado: TDD rojo→verde, `npm test` **97 archivos / 1096 tests**, `npm run build` limpio, e2e `test_f84b_pasos.py` ALL OK. Commits `9587753`, `ee6f292`, `8fc3d09`, `6e0f306`, `949319a` (+ spec `f32a949`). **Validación en dispositivo físico** (diálogo único al arrancar + pasos al abrir/volver sin entrar a `/pasos`): encolada a la validación de release |
| 111 | Verificar notificaciones | Sistema de notificaciones **locales** (no hay push remoto) verificado de punta a punta en **emulador API 37** (2026-09-27): toggle en Ajustes + diálogo de permiso reales; recordatorio de entrenamiento (**9602**) entregado por el SO con el proceso muerto (`HOME` + `am kill`; **`am force-stop` cancela las alarmas** — no sirve para simular el cierre) y reprogramación por id sin duplicados; descanso (**9601**) a ~7 s del deadline; racha (**9603**) e inactividad (**9604**) con datos sembrados y gate diario; apagado del toggle cancela el 9602; estado denegado correcto. Alarmas exactas denegadas por defecto en API 37 → entrega inexacta (9602 +4m37s; aviso en UI). **Fix de copy nativo** (`8d3f90e`: sin «push» ni «configuración del sitio») + limpieza de la rama muerta `training_reminder`/`isReminderDue` (`b6c123b`); review nativo **APROBADO** (`review-d5b7982b3720ee78`; 1 advisory informativo R3-001). `npm test` 96 archivos / 1068 tests, build limpio. **Smoke en dispositivo físico: pendiente para la validación de release** (decidido en sesión). Mejora futura anotada en PLAN (botón «Abrir ajustes del sistema») |

> **73** (solo validación física) y **81** también siguen en PLAN.md.

## Fase 93 — ítems cerrados

| # | Nombre | Estado |
|---|--------|--------|
| #1–#12, #14, #16–#19 | Auditoría + fixes | Cerrados (formularios, rachas, búsqueda, categorías, calculadora agua) |
| #15 (entregable principal) | Card de sesión con foto de fondo estilo Strava | `SessionImageExport` gana el chip **Foto** (primero en `[Foto][Clásica][Hero][Compacta]`, `data-template="photo"`) que convierte la tarjeta 1080×1080 en un hero sobre la foto elegida: en nativo abre el `PhotoSourceSheet` de F106 (`capturePhoto` → `resizeImageToDataUrl` ~1080) y en web un input file; atajo «Cambiar foto / Quitar foto» (44 px) visible solo en modo foto, preview en vivo y foto que queda en memoria al cambiar de plantilla (se descarta con Quitar). Contrato puro nuevo `src/domain/sessionPhotoCard.ts` (`computeCoverCrop` cover centrado + `buildStatsLine` con PRs condicional/plural inyectado) y renderer nuevo `src/components/session/sessionPhotoTemplate.ts` (`drawPhotoHero`: degradado D2, fecha dorada en mayúsculas, duración héroe, línea volumen·PRs bicolor, GYMLAB con `letterSpacing` nativo + fallback por carácter). **Sin duplicar share/guardado**: se integra por rebase sobre F105 (`src/lib/shareImage.ts` + chooser nativo + Guardar en galería — el "Descargar" del card usa lo de F105). i18n es/en `share.photo|changePhoto|removePhoto|statsVolume|prsOne|prsMany`; e2e nuevo `tests/e2e/test_f93_15_card_foto.py` + ajuste `test_f95.py` (3→4 chips). Verificado: TDD rojo→verde (`tests/unit/domain/sessionPhotoCard.test.ts`, 9 casos), `npm run build` limpio, `npm test` **102 archivos / 1123 tests**, `npm run lint` exit 0, e2e `f93_15`/`f95`/`f75`/`f105` ALL OK. Review nativo **aprobado** vía CLI (`review-7fe52e973f2b281a`, lens reliability, authority burned; 3 findings informativos R3-001 WARNING / R3-002 / R3-003 anotados como follow-ups en el plan y **resueltos** en el fix de robustez posterior (`0709eb6`; review del fix aprobado `review-646812e73a075783`, 3 findings informativos en el plan)). Commits `3a4f89f` (spec), `1396287` (plan), `651f350` (T1), `c4debdd` (docs de cierre); merge ff `949f11c..c4debdd`. **Pendiente: validación en móvil real** (cubre fotos + card shareable) |
| #20 | Guías de técnica | Cobertura completa ES+EN para 873 ejercicios |
| #23 | Auditoría de inputs | E2E `test_f93_t23_inputs.py` (9 rutas), 297 tests |
| #24 | Auditoría rendimiento | Baseline medido, sin optimización necesaria |
| #25 | Limpieza código muerto | Dead code eliminado + unificación DRY, 411 tests |
| #26 | Términos y condiciones | Expansión y rediseño de T&C |
| #27 | Mapa de calor de uso | Telemetría local Sentry + PostHog con consentimiento |
| #28 | Grid «Más» 3 columnas | Grid de 2→3 columnas optimizado |
| #29 | Formulario reporte errores | Formulario en Ajustes con validación |
| #31 | Rediseño deload | DeloadCard con score y barras |

> **93 #8 (imágenes guías), #15 (solo validación en móvil real), #21, #22 (revisión futura), #30** tienen pendientes → ver PLAN.md.

---

## Notas

- **Tests**: 458 (42 archivos) + E2E 48/45 (10 scripts)
- **Build**: `tsc` limpio, `vite build` limpio, lint warnings preexistentes
- **Commits recientes**: `4a9c4c6` (auditoría), `20b7914` (F35-F46), `31c90d7` (F91-F92), `3f625df` (i18n), `31c90d7` (codebase graph)
- **Última auditoría**: 2026-09-09 — el catálogo, dominio, utils y hooks están en excelente estado

---

*Este archivo es un registro de referencia. Las fases activas, pendientes y por revisar están en `PLAN.md`.*
