# GymLab App — Plan de implementación

Stack: **Vite + React 18 + TypeScript + Tailwind + Dexie + Zustand + Recharts + PWA → Capacitor (Android)**

Prototipo HTML en `../GymLab/` = solo referencia de marca. No modificar.

Fuente de contenido offline: `../content/training-library/`.

> **Fases totalmente cerradas → `COMPLETED.md`** (no requieren revisión).
> **Este archivo contiene SOLO lo pendiente o por revisar.**

---

## Estado verificado — 2026-10-04

> Verificación read-only del plan contra el código, git y los worktrees (cada ítem con su evidencia). Foto: 73 casillas abiertas; 7 stale quedaron tildadas en este mismo pase. **Siguiente paso recomendado: F103** — aprobar los fixes de la auditoría de lentitud y cerrar el worktree `f103`.

### En curso
- **F103 (estabilidad) — AMPLIADA (2026-10-05)**: fixes de la auditoría **aprobados** (los 11 hallazgos, priorizados) + **re-auditoría F91 de features nuevas** (solo informe, altamente documentado — decisión del usuario). Trabajo en `.worktrees/f103` (worktree al día con main). Detalle en «Fases en curso» y `odd/tasks/f103-rendimiento-ampliado.md`.

### Pendientes reales (verificados en código)
| Ítem | Evidencia |
|------|-----------|
| 102.7 — teclear `12,5` termina en `125` | `numberGuard.ts:54-60` (modo entero corta en el separador) |
| Reto `pr-1` nunca completa | `achievementProgress.ts:282` pasa fecha ISO cruda → `challenges.ts:135/82` → `dates.ts:37-42` (Invalid Date) |
| 110a — guard del thunk en el logger | `lib/logger.ts:46-50` (`write()` sin try/catch) |
| R3-001 long-press — `mailto:` sigue con menú nativo | `MainActivity.java:20-22` (sin `EMAIL_TYPE`/`PHONE_TYPE`/`GEO_TYPE`) |
| 108 follow-ups (a/b/c) | `healthSyncController.ts:52` (dedupe sin modo); `useHealthSync.ts:37-40` (reprograma sin limpiar timer); `:46` (`.finally` sin `.catch`) |
| 112b — falta `persist.clearStorage()` en el reset | `factoryReset.ts:53-58` |
| 113a — clamp del contador solo en efecto | `SessionCarousel.tsx:130-134` |
| F94 — emojis renderizables sin sustituir | `features.ts:77` es/en (`💪`); `WorkoutExerciseBlock.tsx:80` (`✓`) |
| F118 — gaps G1 + G4 | `sessionSuggestions.ts:147` (RPE por defecto 7) y `:84-96` (no filtra calentamientos) |
| F83 — persistir puntos completados por sesión | El panel de técnica no tiene estado de completado |
| 84e — auto-log de pasos en bitácora | Pendiente de decisión de diseño (no existe bitácora diaria) |
| 84d — widget nativo | Bloqueado por toolchain (sin ANDROID_HOME/macOS) |

### Corregidos en este pase (checkboxes stale tildados)
- F83 «ampliar datos de técnica (curl, fondos, dominadas)» → cumplido por F93 #20 (`459db61`, `819bf89`, `013e877`: checklist ampliada + fallback de pasos para todas las fichas).
- 91.1.1/91.1.2 «verificar con Performance panel» → medición post-fixes realizada en 91.6.
- 91.6 «CHANGELOG por tarea» / «integrar este bloque en PLAN.md commiteado» → sin objeto (convención de commits; PLAN.md commiteado).
- 93 #21 (duplicado de F84) y 93 #15 «verificación + CHANGELOG + commit» → cerrados (F105: `651f350`, `c4debdd`; COMPLETED.md).

### Solo validación física (no verificable en este entorno)
F73 · F84c (frescura real de Health Connect) · F93 #15 (foto en móvil real) · F101 (teclado IME).

### Listas para tu revisión / archivo
Fase 81 (implementada; falta tu revisión para archivarla) · F73 (validar en dispositivo físico y archivar).

### Otros abiertos (sin verificación línea a línea)
102.8 (review opcional del rango F102) · 112c–g · 113b–f · 119-2 · 108d · 91.3 (acotar queries de sets — se cruza con el hallazgo 7 de F103) · F114–F117 (deuda con diseño pendiente) · F118 (diseño) · F100 (post-cuentas) · #30/#22/#8 (acciones o validaciones de usuario).

## Fases en curso

### Fase 103 — Estabilidad: lentitud, cuelgues y crashes — EN CURSO (ampliada 2026-10-05)

Notas origen: **#2, #4, #8**

**Overlap:** F91 (rendimiento 2026-09-11, mayormente implementada) + F93 #24 (baseline, “sin optimización necesaria”). El usuario **sigue** viendo lentitud y cuelgues. F77 suplementos está cerrada; hay que investigar si entrar a `/suplementos` (u otras rutas) rompe la app.

**Estado (2026-10-05):** fase **ampliada por pedido del usuario** («haz lo que pide + repetimos F91 ampliando a las features nuevas»). Worktree `.worktrees/f103` reseteado a main (el commit previo `5581641` quedó superseded); auditoría aprobada → fixes en ejecución. Detalle operativo y tareas: `odd/tasks/f103-rendimiento-ampliado.md`.

**103.2/103.3 — sin reproducción con el código actual (monitoreado)**: el cuelgue coincide con el bug histórico de `/suplementos` (`ReadOnlyError` de Dexie) corregido el 15/09 (`b3ce311` + ErrorBoundary `117714f`); barrido de las 43 rutas del router: 0 crashes; emulador: arranques 8,9 s → 2,7/2,9 s, 0 ANR. Validación en teléfono físico: resuelta (2026-10-05).

**103.1 — 11 hallazgos de la auditoría; fixes aprobados (2026-10-05), priorizados:**
- *Arranque/update*: (1) reseed bloqueante en install/update (~2.294 filas + 520 KB de chunks + JSON de 218 KB sin precachear; `providers.tsx`); (2) Google Fonts `@import` render-blocking (`index.css`); (3) precache SW ~100 MB con SW también en el WebView nativo (`vite.config.ts`); (4) splash fijo 800 ms (`capacitor.config.ts`); (5) preload incondicional de `home-hero.jpg` (`index.html`); (6) trabajo post-paint (logros/notificaciones/telemetría).
- *Uso diario*: (7) `workoutSets` 2× full scan por navegación + por guardado (`useAchievements.ts` + `EntrenarPage.tsx`); (8) home: 8 tarjetas recomputando sobre el historial crudo por visita; (9) rest timer persistiendo toda la sesión a localStorage ~1×/s (`RestTimer.tsx` + `activeWorkoutStore.ts`); (10) `/estadisticas` sin lazy por tab (recharts + 4 tabs en el chunk de ruta); (11) `workouts.getAll()` ×3-5 en shell + N+1 del selector de día (F99).
- **Direcciones aprobadas**: reseed → shell al instante + seeding en background con loader por superficie; fuentes → self-host (woff2, `@font-face` swap); precache → podar a shell (~4-5 MB) + caché de imágenes on-demand + sin SW en nativo; splash → quitar mínimo; hero → quitar preload incondicional; post-paint → deferral compartido; resto → fixes técnicos directos. Todo con TDD + review + commit en `f103`.

- [ ] **103.1 — Rendimiento de la app en general**: va un poco lento. → auditoría completa; fixes aprobados, en ejecución.
- [ ] **103.2 — Investigar por qué se cuelga la app a veces**: ¿rendimiento? → investigado: sin reproducción; monitoreado.
- [ ] **103.3 — Entrar en suplementos rompe la app? o en otros lados**. → investigado: no rompe (43/43 rutas OK; web y emulador).
- [ ] **103.4 — Fixes de los 11 hallazgos de la auditoría** (4 de mayor impacto primero; después arranque/update y uso diario restantes).
- [ ] **103.5 — Re-auditoría F91 de features nuevas (F94–F119)**: auditoría completa de superficies nuevas/cambiadas → informe accionable por hallazgo (sin fixes en esta fase; decisión del usuario), para la sesión que los arregle.

---

## Fases por revisar (el usuario debe revisarlas antes de archivar)

### [x] Fase 73 — Frecuencia muscular vs objetivo (PENDIENTE UX → solo falta validación en dispositivo físico)
- [x] `domain/muscleFrequency.ts` + sección con barras + alerta >20%
- [x] **Revisión UX entregada**: tamaños de fuente, barras y espaciado agrandados ya aplicados en `src/components/frequency/MuscleFrequencyView.tsx` (`text-sm` línea 45, `text-xs` línea 49, `h-2.5` línea 60, `px-4` líneas 25 y 43). **Único resto**: validar en dispositivo físico (no verificable en este entorno).
- [x] Keys es/en + `tsc` + build + tests + CHANGELOG + commit

### Fase 81 — Importar datos de otras apps (POR REVISAR)
- [x] Parsers CSV Strong/Hevy/JEFIT + mapeo a sesiones
- [x] Validación/resumen + deduplicación + panel en Ajustes
- [x] i18n + mobile-app-ui + verificación + CHANGELOG + commit

### [x] Fase 83 — Checklist de técnica (PENDIENTE)
- [x] `TechniqueChecklist.tsx` + datos en catálogo + botón flotante en sesión
- [x] Persistir última sesión mostrada
- [x] Ampliar datos de técnica a más ejercicios (curl, fondos, dominadas, etc.) — cumplido por F93 #20 (`459db61`, `819bf89`, `013e877`).
- [ ] Persistir puntos completados por sesión en Dexie
- [x] Keys es/en + `tsc` + build + tests + CHANGELOG + commit

---

## Fase 84 — Wearables / contador de pasos (completa salvo 84d y 84e-journal)

> **84a–84c, 84e (resto), 84f, 84g están implementados y verificados** (commits recientes en el log). Ver `COMPLETED.md` no aplica: 84a–84g tienen pendientes puntuales que quedan aquí.

### [x] Fase 84a — Domain + Data ✅
- [x] `dailySteps` (v13) + `domain/stepsTracker.ts` + `domain/stepAchievements.ts` + repo + hook + i18n

### [x] Fase 84b — UI Dashboard ✅
- [x] `/pasos` con anillo SVG, stats, gráfico semanal, heatmap, badges, ruta + link + mobile-app-ui

### [x] Fase 84c — Background Sync ✅
- [x] `capacitor-health` + `stepsFusion` + `healthBridge` + `stepsSync` (backfill 90 días / incremental) + sync al abrir y al primer plano + refresco rápido (3 s) con /pasos visible (F108, `b7b588c`)

### [ ] Fase 84d — Widget Nativo (BLOQUEADO por toolchain)
> **Bloqueado por herramientas**: sin ANDROID_HOME/gradle en este entorno y WidgetKit requiere macOS. No se implementa hoy.
- [ ] iOS: WidgetKit extension (Swift) + Shared data via App Groups
- [ ] Android: AppWidgetProvider (Kotlin) + RemoteViews layout XML
- [ ] Configuración de estilo desde la app
- [ ] Tap → abrir `/pasos`
- [ ] tsc + build + commit

### [x] Fase 84e — Integraciones (PENDIENTE menor)
- [x] Recovery Score con factor pasos + reto diario "Camina 10k" + calorías ajustadas + logros en `/logros`
- [ ] Integrar con journal existente (auto-log de pasos en bitácora del día) — **pendiente de decisión de diseño**: no existe bitácora diaria hoy; requiere decisión del usuario.

### [x] Fase 84f — Achievements ✅
- [x] 8 logros de pasos integrados en `/logros` (galería independiente del modal de entrenamiento)

### [x] Fase 84g — Limpieza de código ✅
- [x] Dead code eliminado, cards unificadas, `clampPercent` compartido, `getByDate` indexado

---

## Tareas de Fase 93 pendientes

#### [ ] #30 — Crear correo de la app
- [ ] **Requiere intervención del usuario**: crear la cuenta de correo de la app.
- [ ] Añadir el correo como contacto en Ajustes / T&C (`/terminos`) / reporte de errores (#29).
- [ ] Verificación + CHANGELOG + commit.

#### [ ] #15 — Cámara en móvil real + foto shareable (F79/F75 archivadas; validación móvil diferida acá)
- [ ] Probar la captura de fotos en **móvil real** (validación que F79 dejó diferida al archivarse) y reportar resultados.
- [x] (F93 #15) Card de sesión con foto de fondo estilo Strava: chip **Foto** (cámara/galería en nativo, archivo en web), tarjeta D2 1080×1080 y share/guardado nativo integrados (F105: `51a6a87`; F93 #15: `651f350`). Review aprobado (`review-7fe52e973f2b281a`); follow-ups menores anotados en el plan. Pendiente: validación en móvil real.
- [x] Verificación + CHANGELOG + commit. — cerrado (F105/F93 #15: `651f350`, `c4debdd`; review aprobado).

#### [ ] #21 — Wearables y contador de pasos (duplicado F84/F84a–f)
- [x] Ejecutar las fases ya planificadas: **F84a** ✅, **F84b** ✅, **F84c** ✅, **F84d** ⛔ (widget, bloqueado), **F84e** ✅, **F84f** ✅ — referencia duplicada; estado real en la sección F84.

#### [ ] #22 — Revisión futura: sesión rápida
- [ ] Validar con el usuario que la sesión rápida mantiene el valor/contexto esperado tras su uso real.

#### [ ] #8 — Guías: imágenes
- [ ] Ranura hero en `GuiaDetailPage`; requiere `imageUrl` opcional en `Guide` + assets.

---

## Seguimiento de reviews (advisories no bloqueantes)

- [ ] **108.R3-002 (review, follow-up)** — dedupe de `runSync` sin distinguir modo: un `connectHealthSync` (reintento del banner) puede coalescerse con un `auto` en vuelo y no llega a pedir permiso; evaluar dedupe por modo o espera + re-ejecución como en el arranque (hallazgo WARNING del review de F108; el tick de 3 s del refresco rápido — `108.refresco-rapido` — amplía esta ventana).
- [x] **108.refresco-rapido (mejora F108)** — RESUELTO en `b7b588c`: con `/pasos` visible el contador re-sincroniza cada 3 s (loop nativo encadenado con `setTimeout`, nunca `setInterval`; constantes `HEALTH_FAST_REFRESH_MS`/`HEALTH_SLOW_RETRY_MS` ajustables en un solo lugar; pausa al ocultarse la página; backoff a 30 s en `error`/`denied`/`unavailable`; refresh silencioso sin parpadeo del banner; sin reescrituras si el día no cambió). Review nativo `review-849aa77ac2535884` (medium, lente reliability) **approved + acknowledged (authority burned)**. Verificado: `npm test` 111 archivos / 1239 tests, `npm run build` exit 0, e2e `test_f84b_pasos.py` ALL OK. Pendiente: validación en dispositivo físico (frescura real de Health Connect; el emulador no tiene pasos en vivo).
- [ ] **108.refresco-rapido-followups (review, follow-up)** — de `review-849aa77ac2535884` (advisory no bloqueante; no reabre el candidato): (a) R3-001: el dedupe por modo de `108.R3-002` se vuelve más probable con el tick de 3 s (un tap del banner durante una sync auto en vuelo se traga, sin diálogo); (b) R3-002: `schedule` no limpia un timer pendiente antes de reasignar (doble cadena posible si `visible` llega con timer vivo); (c) R3-003: tick sin `.catch` (el controlador ya captura; teórico); (d) R3-004/005: test del loop con refresh lento y asserts no vacuos en `stepsSync.test.ts`.
- [ ] **109.prsInPeriod (bug preexistente)** — `prsInPeriod` (`challenges.ts`) pasa fecha ISO cruda a `weekStartKey` → `NaN` en periodos de 1 semana → el reto `pr-1` nunca completa; al corregirlo, el seed del e2e de F109 pasará de 11/36 a 12/36.
- [ ] **109.R3-001 (review, follow-up)** — helper de dismiss del modal de logros en `test_f109.py`: con cola de 1 ítem puede re-clickear antes de que React desmonte el diálogo (esperar el detach cuando no hay contador). WARNING del review del fix.
- [ ] **110.followups (review final, follow-up)** — del review final de F110 (non-blocking, no bloqueó el merge): (a) guard en `write()` de `src/lib/logger.ts` ante un `data` thunk que lance (hoy ningún call site pasa thunk; cierra la familia «si el logger lanza, se saltea el cleanup» de T4/T5 de una vez); (b) tests del logger para fallo de storage (`getItem` lanza → `'auto'`; `setItem`/`removeItem` lanzan → el estado en memoria igual aplica); (c) e2e en `--mode preview` que ejercite `enable()` en build de producción (hoy corre en dev, donde `enable()` es indistinguible de `auto`) — de paso cubriría `status()` tras `reset()` y el silencio total de `[gymlab:*]` con `disable()`.
- [ ] **112.followups (review final, follow-up)** — del review final de F112 (non-blocking, no bloqueó el merge): (a) `ResetConfirmSheet`: el cierre por backdrop/Escape durante `busy` puede tragarse el error del wipe en la próxima apertura (gatear con `!busy` o no limpiar el error en `onClose`); (b) `useActiveWorkoutStore.persist.clearStorage()` en `resetStores()` para que `gymLab-activeWorkout` no pueda recrearse vacía tras el wipe; (c) `achievementReconcile`: `snapshot` es input muerto (quitarlo del shape o comentarlo); (d) `ResetInfoSheet`: el `aria-label` pisa el label visible y el sheet informativo usa `role="alertdialog"` (probar `dialog`); (e) tipar `RESET_ITEM_KEYS` como `I18nKey[]` para recuperar el chequeo estático de claves; (f) borrar el JSON del Cache tras `Share.share` resuelto y `JSON.stringify` compacto si los backups con fotos crecen; (g) comentarios de `EXPECTED_TABLES` sobre el orden de declaración. Además: reintentar los reviews nativos cuando el transporte esté sano (lineages abiertos `review-3dfa69d4f362d721` y `review-dbeeb4b540eb5645`) y smoke del share del backup en dispositivo físico si va a release.
- [ ] **113.followups (review final, follow-up)** — del review final de F113 (non-blocking, no bloqueó el merge): (a) clamp en render del contador (`activeIndex` sin acotar → «N+1 de N» por un frame al borrar el último grupo) y guard del offset elevado del `UndoToast` cuando la sesión queda vacía; (b) `uniqueGroupKeys`: al borrar un grupo colisionante anterior el superviviente se renombra («A#2»→«A») → remount + posible mis-atribución de la transición (preferir «saltar la transición cuando una key desaparece» + test de borrado con duplicados); (c) `pb-40`/offset codifican el alto asumido de la barra (8.25rem, 28 px de holgura) — constante/variable compartida si la barra crece; (d) e2e: caminos de error con diagnóstico degradado en t22/f113 (early-return en precondiciones, assert de `EmptyState` en D); (e) assert unitario «1 de 2» subsumido por el aria-label (cubierto igual a nivel e2e); (f) validación de entrada en los helpers de índices (JSDoc de precondición si se exponen).
- [x] **119.followups (review, follow-up)** — RESUELTOS en `385b41f`: (a) locator exacto por título en `MEASURE_JS` y en el click del e2e (la card «clon» ya no puede capturar la medición); (b) reintento acotado del seed cuando la DB no está lista; (c) `.routine-card__badges > span:first-child { flex-shrink: 0 }` (el badge de objetivo no se recorta) + aserción nueva en el e2e. Review de los fixes: `review-cbb8039e9d3b5b20` (approved; residuales en `119.followups-2`).
- [ ] **119.followups-2 (residual de la review de los fixes)** — de `review-cbb8039e9d3b5b20` (advisory no bloqueante; no reabre el candidato): (a) el retry del seed traga la última excepción → capturarla en el assert (o esperar señal de readiness); (b) el descarte del tip en `test_f66_f67_planificador` usa `count()>0` sin esperar visibilidad → un tip oculto puede colgar el click y uno tardío colarse (esperar visible/accionable o que «Guardar» sea clickeable); (c) `badgeObjectiveTruncated` null pasa la aserción → exigir no-null cuando el badge existe.
- [x] **test_f66_f67_planificador (rojo pre-existente, detectado en F119)** — ARREGLADO en `385b41f`: se descarta el tip «Entendido» y se hace `scrollIntoView(block: 'center')` del botón de guardar (probe de diagnóstico: el tip quedaba montado justo sobre el botón); e2e `ALL OK` verificado.
- [ ] **long-press-links.followups (review, follow-up)** — del fix del bocadillo de URL (lineage `review-891ec3b1101185b2`, approved; advisories informativos que NO reabren el candidato): (a) R3-001 (WARNING): el filtro nativo (`MainActivity`) no cubre `EMAIL_TYPE`/`PHONE_TYPE`/`GEO_TYPE` → los links `mailto:` de `PrivacidadPage.tsx:23` y `TerminosPage.tsx:22` podrían seguir mostrando el menú nativo (con el mail, no la URL interna); sumarlos al filtro (requiere review nuevo); (b) R3-002 (SUGGESTION): la capa web gatea por media query del dispositivo (`pointer: coarse`), no por el puntero del evento — en híbridos mouse+táctil el clic derecho sobre links podría cancelarse; evaluar el tipo del evento.

---

## Fase 94 — Imágenes generadas por IA (sustituir emojis y símbolos de la UI) — PENDIENTE

**Objetivo**: eliminar de la UI renderizable todos los emojis/símbolos decorativos y sustituirlos por **assets estáticos generados con IA**, coherentes con el design system GymLab, manteniendo la app 100% offline-first (sin backend, sin API keys en runtime, sin costo por llamada).

**Decisión de pipeline (aprobada)**: assets estáticos en build. Las imágenes se generan fuera de la app (herramienta/prompt de IA), se guardan en `public/`, y se bundlan con Vite. La app nunca llama a una API de imágenes en runtime.

### Inventario (evidencia recolectada 2026-09-12)

Escaneo de `src/` + `public/` con rango Unicode de emojis/símbolos (fé1f0–fé1faff, 2600–27bf, 2b00–2bff, fe0f, etc.):
- Archivos escaneados: **474** (src) — archivos con emoji: **8** — total emojis: **10**
- `src/data/**` (seeds de ejercicios, rutinas, guías, logros): **0 emojis**

| Emoji/símbolo | Dónde | Renderiza | Acción propuesta |
|---|---|---|---|
| `💪` Flexed Biceps | `src/i18n/locales/es/features.ts` L74 — `footer: 'Entrena con GymLab 💪'` | Sí — footer de la app | Sustituir por imagen/marca IA o eliminar (marca limpia) |
| `💪` Flexed Biceps | `src/i18n/locales/en/features.ts` L74 — `footer: 'Train with GymLab 💪'` | Sí — footer (EN) | Ídem |
| `✓` Check mark | `src/components/workout/WorkoutExerciseBlock.tsx` L77 | Sí — marca de serie completada | Sustituir por icono lucide (`Check`) o image asset; **decisión pendiente en brainstorm de implementación** |
| `↔` Left Right Arrow | `src/i18n/locales/es/core.ts` L185, L216; `en/core.ts` L185, L216 | Sí — título del conversor (texto, no icono) | **Mantener** — es símbolo tipográfico de texto (flecha), no emoji; no renderiza como glifo emoji |
| `↔` (comentarios) | `src/domain/calculators/converter.ts` L1, `src/lib/duration.ts` L1, `src/pages/ConversorPage.tsx` L1 | No — comentarios | No tocar |

### Contexto de la convención

- `AGENTS.md` ya exige **"Iconos: lucide-react (nunca emoji como icono)"** — esta fase ejecuta esa regla donde aún hay huecos.
- El resto de la UI usa iconos lucide (la norma); no se reemplazan iconos lucide, solo emojis/símbolos residuales.
- **No confundir**: los 431 emojis que aparecen globalmente en el repo viven en `PLAN.md`, docs de auditoría y skills (`.agents/`, `.opencode/`) — **no son UI** y **no** entran en esta fase.

### Tareas

- [ ] **94.1 — Inventario definitivo por componente** (detalle fino)
  - [ ] Verificar con grep/script el estado de los 3 puntos de emoji reales (footer es/en, check set), confirmando que no haya nuevos emojis añadidos desde este inventario.
  - [ ] Decidir caso a caso: (a) sustituir por asset IA, (b) sustituir por icono lucide, (c) mantener (símbolo tipográfico).
  - [ ] Documentar la lista final en esta sección (checkboxes).

- [ ] **94.2 — Generación de assets IA** (fuera de la app, una sola vez)
  - [ ] Definir prompt y estilo: coherente con tema GymLab (`#121214`, acento `#D9B384`/`#FDDDB4`), trazo simple, fondo transparente o SVG, para uso en icono de footer y check.
  - [ ] Generar los assets necesarios (mínimo: marca/footer + check de set), formato WebP/SVG, nombres descriptivos en `public/images/` (p. ej. `public/images/brand/footer-mark.webp`).
  - [ ] Registrar en esta sección qué herramienta/prompt se usó (reproducibilidad) y licencia de uso.

- [ ] **94.3 — Integración en la UI**
  - [ ] Footer: reemplazar `💪` en los strings i18n (`features.ts` es/en) por el componente de imagen/marca (con `alt` accesible o `aria-hidden` según sea decorativo).
  - [ ] Check de set (`WorkoutExerciseBlock.tsx`): sustituir `✓` por icono lucide `Check` (alineado con la norma del repo) o por el asset IA según decisión de 94.1.
  - [ ] i18n: si el emoji vive en strings, mover el asset fuera del texto traducible (la imagen no se traduce).
  - [ ] Accesibilidad: `alt` descriptivo para imágenes informativas; `aria-hidden` + rol decorativo si es puramente decorativo; preservar estados `aria-pressed`/`aria-live` existentes.

- [ ] **94.4 — Verificación y cierre**
  - [ ] `npx tsc --noEmit` → 0 errores.
  - [ ] `npm run build` → exit 0.
  - [ ] Escaneo de regresión: repetir el inventario de emojis y confirmar 0 emojis/símbolos residuales renderizables (salvo los decididos como tipográficos tipo `↔`).
  - [ ] Playwright (Python): smoke visual del footer y de la sesión activa (check de set) según `tests/e2e/` — sin regresiones, 0 errores de consola.
  - [ ] `CHANGELOG.md` bajo `[Unreleased] → Added/Changed`.
  - [ ] Commit sin push (`feat: imágenes IA sustituyen emojis de footer y check (F94)` o similar; separado por tarea según convención).

### Criterio de aceptación

1. **0 emojis renderizables** en la app (escaneo fuente repetible, excluyendo símbolos tipográficos acordados).
2. Accesibilidad preservada o mejorada (alt/aria correctos, touch targets intactos).
3. Peso acotado: assets pequeños (< 50 KB cada uno salvo justificación), sin afectar el bundle crítico (lazy/`preload` según criterio de 91).
4. Offline-first intacto: sin llamadas de red en runtime para imágenes; todo en `public/` bundlado.
5. CHANGELOG al día y build limpio.

### Riesgos / decisiones abiertas

- Decidir si el footer conserva alguna marca visual IA o queda texto limpio (la marca «GymLab 💪» es copy histórica — validar con el usuario si quiere mantener el gesto visual).
- Decidir el reemplazo del `✓`: probablemente lucide `Check` es lo correcto (norma del repo), y el asset IA se reserva para elementos de marca — confirmar en el brainstorm de implementación.
- Los `↔` del conversor son flechas tipográficas en strings (no iconos); mantenerlos salvo que el usuario pida pasarlos a icono lucide `ArrowLeftRight`.
- Herramienta de generación IA: elegir y fijar en 94.2 (reproducibilidad) — fuera de este repo, no requiere backend.

---

## Fase 100 — Con cuentas: telemetría + sync nube (post-cuentas)

*(Origen: 26 notas de prueba ordenadas y agrupadas en 6 clusters. La exploración de cada fase puede reestructurar estos ítems en tareas concretas; cuando una fase se cierra, marcar sus checkboxes y actualizar CHANGELOG.md.)*

**NOTA: hacerlo más adelante.** Depende de crear cuentas/backend (hoy la app es 100% local-first: Dexie/IndexedDB, PWA, Capacitor; AGENTS.md prohíbe backend en MVP — Supabase futuro sería "nueva impl del mismo interface"). Esta fase se retoma cuando exista el modelo de cuentas.

Notas origen: **#3, #5**

- [ ] **100.1 — Mapa de calor de uso (#3)**: telemetría de qué usan los usuarios para saber en qué mejorar/enfocarse.
- [ ] **100.2 — Sync local ↔ nube (#5)**: al crear la cuenta real, sincronizar la base local con la nube (Supabase) manualmente o periodizado (tipo WhatsApp).

---

## Fase 102 — Auditoría de inputs (UX, formato y caracteres) — implementada; quedan 102.7 y 102.8

*(Origen: 20 notas agrupadas por conexión. Hasta acá se copia la idea tal cual; el detalle de subtareas se desarrolla fase por fase. Reutilizar código/datos que ya recoge la app; crear de cero solo si no hay nada reutilizable.)*

Notas origen: **#1**

**Overlap:** F93 #23 (auditoría e2e de inputs, cerrada) + F97.5 (`parseDecimal` / `DecimalInput`) + F98.4 (cadena Enter). Hecho a nivel de kilos/sesión; **no cubre** el resto de inputs ni “si es molesto” / caracteres que rompen.

**Alcance (aprobado 2026-09-20):** solo campos **numéricos/formato** — peso, reps, medidas, pasos, timers, calculadoras. Quedan **fuera**: nombres, notas, búsquedas, archivos, selects y una pasada UX completa.

**Contrato (aprobado 2026-09-20):**
- Filtro **al teclear** (no al validar al confirmar): el draft inválido **no entra** al input, se descarta antes de pintarse; reutiliza el parser existente (`numberGuard` + `DecimalInput`).
- Solo pasan dígitos y **un** separador decimal (`,` o `.`). Modo **entero** (pasos, reps, semanas) = solo dígitos.
- **Vacío sigue válido**: se limpia, nunca se escribe un `0` mentiroso (mantiene el contrato de `resolveDraftCommit` / `NumberField`).
- **Sin mensajes de error**: la entrada inválida se ignora silenciosamente.
- **Dosis de suplementos queda fuera**: sigue como texto libre (`"5 g"`, `"1 cápsula"`).
- **Caso especial — duración cardio (`0:00`)**: el usuario escribe **solo dígitos** y el `:` se agrega automáticamente al editar (reusa `parseDuration`/`formatDuration`): más fácil que escribir `m:ss` a mano.

**Implementación (TDD, en worktree aislado `gymlab-f102`, rama `f102`):**
1. `sanitizeDecimalDraft` como función **pura** en `src/domain/numberGuard.ts` (modo decimal e entero + formateo de duración con `:` automático) con tests en `tests/unit/domain/numberGuard.test.ts`.
2. `DecimalInput` **filtra el draft antes de pintarlo**; los usos actuales (kilos/sesión, distancia, settings) ganan el filtro sin tocarlos.
3. **Migrar los numéricos sueltos a `DecimalInput`**: pasos, medidas corporales, calculadoras (IMC/calorías/grasa/conversor), benchmark, timer, comida en gramos, onboarding peso/altura — con modo entero/decimal según el campo.
4. Duración cardio en `SetRow` (y donde aplique): solo dígitos + `:` automático.
5. Verificación: tests del sanitizer + suite `numberGuard` + `npm run build` + `npm test`; el e2e F93 #23 no debería romperse.

**Estado (2026-09-27) — implementada y verificada**: `sanitizeDecimalDraft` y `resolveSanitizedDraft` (puras, en `src/domain/numberGuard.ts`) filtran el borrador **antes de pintarlo**: `DecimalInput` descarta lo inválido al teclear (la basura no limpia el valor guardado; el vacío real sí) con modo **entero** (solo dígitos, corta en el primer separador para no convertir `12,5` en `125`) o **decimal** (un único `,`/`.`) según el campo, con 12 casos nuevos en `tests/unit/domain/numberGuard.test.ts`. La migración suma **32 usos de `DecimalInput`** en 27 archivos tocados —varios vía `CalculatorField`—: calculadoras, agua/1RM, peso corporal, medidas, pasos, benchmark, timer, comida, onboarding, discos, periodización, peso objetivo, target de rutina y ajustes) y la duración cardio de `SetRow` sanea con el modo `duration`: se teclea solo dígitos y el `:` se inserta automático (`0:00`). Commits de la fase: `a156974` (sanitizer + tests), `9dcabb1` (filtro al pintar), `bbca971` (entero corta en el separador), `9203629` (migración a `DecimalInput`), `6050f19` (duración cardio). Verificación: `npm test` **96 archivos / 1083 tests** ✅, `npm run build` limpio (exit 0, PWA v1.3.0) ✅ y los **6 e2e prioritarios ALL OK** (`test_f93_t23_inputs.py`, `test_f98_enter_chain.py`, `test_f93_t12_agua_input.py`, `test_f93_t11_b_one_rm.py`, `test_f84b_pasos.py`, `test_f93_t27_telemetry.py`), con los locators `type="number"` sincronizados a `input[inputmode="decimal"]` (peso-corporal y paso Perfil del onboarding). **Review del slice completado (approved + acknowledged) vía CLI**: el transporte fallaba por el **cap de 32.000 tokens de salida de OpenCode** (el reviewer necesitaba hasta ~131k); fix permanente con `OPENCODE_EXPERIMENTAL_OUTPUT_TOKEN_MAX` (activo al reiniciar OpenCode) y workaround CLI validado — doc: `C:\Users\Yves De Faria\.gentle-ai\opencode-output-cap-fix.md`. Verificado además por auditores independientes + e2e. Limitación conocida: duraciones ≥1h en cardio (borrador `120:00` vs reposo `2:00:00`).

- [x] **102.1 — Comprobar todos los input y el funcionamiento**: si es molesto para el usuario, etc.; también si puede generar errores algunos caracteres; si el input espera algún dato o formato se debe restringir para su buen funcionamiento.
- [x] **102.2 — `sanitizeDecimalDraft` (TDD)**: función pura en `numberGuard` + tests (decimal, entero, separador único, vacío, duración con `:` auto).
- [x] **102.3 — `DecimalInput` filtra al teclear**: descartar draft inválido antes de pintar; los usos actuales quedan cubiertos gratis.
- [x] **102.4 — Migrar inputs numéricos sueltos a `DecimalInput`**: pasos, medidas, calculadoras, benchmark, timer, comida, onboarding.
- [x] **102.5 — Duración cardio con `:` automático**: solo dígitos al escribir.
- [x] **102.6 — Verificación**: tests del sanitizer + suite existente + build + e2e F93 #23 sin regresiones.
- [ ] **102.7 — Fix R3-1 (WARNING del review)**: en modo entero, teclear `12,5` dígito a dígito termina en `125` (el separador no sobrevive en el draft y el siguiente dígito se concatena). Propuesta: retener el primer separador en el draft del modo entero (`sanitizeDecimalDraft`), actualizar tests y pasar el review del fix (método CLI o tras reiniciar OpenCode).
- [ ] **102.8 — (Opcional) Review del rango completo de F102**: el slice quedó aprobado, pero el rango completo (incluye 102.5/102.6, docs y e2e) no tiene review formal — correrlo por el método CLI (doc `C:\Users\Yves De Faria\.gentle-ai\opencode-output-cap-fix.md`) o tras reiniciar.

## Fases 114–117 — Deuda declarada del pulido de F66/F67 (sesión 2026-09-26)

> Al cerrar el diseño del pulido (`docs/superpowers/specs/2026-09-26-f66-f67-pulido-design.md`, commit `87a4f9c`) se declararon límites explícitos. Para que no se pierdan ni se cuelen como trabajo suelto, quedan acá como fases propias: cada una necesita su diseño (brainstorming → spec) cuando se tome. Los límites que ya estaban cubiertos quedaron anotados en su fase de origen (F88: i18n del seed; F97: recomendación de pesos).

### Fase 114 — Re-autoría del contenido de las rutinas predefinidas — PENDIENTE

**Objetivo**: rediseñar el **contenido** de las rutinas del seed más allá de mover ítems: alinear día↔nombre cuando el nombre promete algo que el día no cumple (p. ej. r26 «Full Body 3 días» que no es full-body por día), rebalancear los días que el pulido dejó grandes o flacos (r43/r64) y elegir mejores ejercicios por patrón. Incluye decidir qué hacer con la cobertura de la matriz objetivo×nivel×días (hoy 30/75 con días exactos).

**Overlap:** el pulido de F66/F67 solo **mueve** ítems entre días (Anexo A de su spec) y elimina copias exactas: no agrega/quita contenido, no cambia series/reps/descanso ni renombra días. F88 clona predefinidas para editarlas, no las reescribe. Esta fase es curación de contenido, con su propio criterio y review.

- [ ] **114.1 — Criterio de calidad de programa** (bloques coherentes, balance de días, progresión) + medición del estado actual.
- [ ] **114.2 — Re-balanceo de las rutinas tocadas por el pulido** (días de 2 ítems / días de 9-13 ítems) sin perder la identidad de cada rutina.
- [ ] **114.3 — (Decisión) Cobertura de la matriz 30/75**: ¿autoría de rutinas nuevas o se acepta el gap?

### Fase 115 — Equipamiento v2: re-clasificar `otro` y ampliar la taxonomía — PENDIENTE

**Objetivo**: dejar de perder señal de equipamiento. `EQUIPMENT_OPTIONS` tiene 9 valores y ~237 ejercicios (29%, medido el 2026-09-16) están taggeados `otro` (estiramientos, movilidad, máquinas raras); fitball / pelota medicinal / rodillo no existen como valores.

**Overlap:** el pulido de F66/F67 excluyó explícitamente reclasificar `otro` y ampliar el enum (WP0 solo agregó `banco`). Consumidores a tocar: chips de `EquipmentFilter`, `filterExercises` (regla de subconjunto), i18n es/en y seed (reclasificación + `SEED_VERSION`).

- [ ] **115.1 — Medir de nuevo `otro`** y decidir los valores nuevos del enum con criterio de uso real (sin taxonomía infinita).
- [ ] **115.2 — Reclasificar los ejercicios afectados** + consumidores + migración/re-siembra.
- [ ] **115.3 — Test de cobertura** que fije que no quedan ejercicios sin clasificación real donde aplique.

### Fase 116 — Sustitución automática de ejercicios por equipamiento faltante — PENDIENTE

**Objetivo**: cuando el equipamiento declarado no cubre un grupo, hoy el generador **omite y reporta** (`coverage.omittedGroups`). Decidir e implementar si se ofrece una **sustitución** por un ejercicio equivalente disponible (mismo grupo muscular/subzona, categoría strength, equipamiento ⊆ disponible) en vez de omitir — y con qué UX (automática o sugerida en el plan).

**Overlap:** declarado fuera de alcance desde la spec original de F66/F67 y repetido en la del pulido. Toca `src/domain/routineResolution.ts` (contratos de `RoutinePlan`/cobertura) y las superficies del plan (planificador + resumen del onboarding).

- [ ] **116.1 — Decisión de producto**: automática vs sugerida; qué se reporta al usuario.
- [ ] **116.2 — Contrato de dominio + tests**: sustituto determinista, mismo grupo, sin repetir en el día.
- [ ] **116.3 — UI + e2e.**

### Fase 117 — Rediseño de flujo del planificador y onboarding (más allá de lo visual) — PENDIENTE

**Objetivo**: repensar la **estructura** del wizard del planificador y del resumen del onboarding — menos pasos, todo en una pantalla, otra secuencia de decisión — no solo su piel.

**Overlap:** el pulido de F66/F67 es **solo visual** (dirección A: cards de día, pill de duración, encabezado con músculos) y mantiene el flujo de 3 pasos. Esta fase cambia la estructura y necesita su propio diseño (con mockups en el navegador) y e2e del flujo nuevo.

- [ ] **117.1 — Diseño del flujo** (brainstorming + mockups).
- [ ] **117.2 — Implementación + e2e.**

---

## Fase 118 — Sugerencia de carga adaptativa alcanzable (gaps G1–G4) — PENDIENTE

**Origen**: reporte del usuario (2026-09-29, emulador API 37): «no veo el peso sugerido adaptativo mientras entreno una rutina». Investigación + test en vivo (memorias Engram `187f3b23`, `cb591b8b`): **el motor funciona** — con historial real el botón «Sugerido» aparece (seed de 2 sesiones de Press de pecho 60/70 kg → «Sugerido: 67.5 kg», exacto a la cuenta del motor) y desaparece luego de completar la primera serie (gate `!hasWorkingSet`). El problema es la **alcanzabilidad en settings default** y varios gates, no el motor.

**Overlap:** F97 (motor `recommendLoad` + ajuste `showLoadSuggestion`), F98.2 (chip por bloque `useBlockSuggestions`/`SuggestionChip`), F63 (sugerencias originales con RPE/RIR), F113 (el carrusel espera «sugerencia adaptativa» en cada ejercicio — decidir si este acomodo va antes o junto).

**Gaps confirmados en código:**
- **G1 (el grave)**: con `showRpe=false` (**default**), la señal «increase» del chip nunca puede dispararse (`avgRpe ?? 7` > 6) → la sugerencia adaptativa por chip es inalcanzable para un usuario default.
- **G2**: si la recomendación == peso precargado (caso típico cuando la progresión topa con el PR) se oculta todo, incluido el aviso «Limitado por tu PR».
- **G3**: apagar «Sugerir carga» (`showLoadSuggestion`) no oculta el chip, solo el botón — semántica inconsistente.
- **G4**: las series de calentamiento completadas entran en `completedSetsForSuggestions` (rompen la igualdad first/last y ensucian avgRpe/RIR).
- Extras observados: la precarga de peso solo corre al **iniciar** la sesión (no se re-aplica al recargar) — decidir si es esperado; la visibilidad del botón usa `suggestion !== nextSet.weightKg` como único criterio.

**Decisiones abiertas (necesita brainstorming → spec):** qué señal debe mostrar la sugerencia con settings default (pesos/progresión sin RPE vs. exigir RPE y cambiar defaults), qué hacer en el caso tope-PR == precarga, la semántica del toggle y el filtro de calentamientos (G4 es bugfix directo).

- [ ] **118.1 — Diseño (brainstorming + spec)**: UX de la sugerencia alcanzable con settings default + arreglos G2–G4.
- [ ] **118.2 — Implementación + tests** (G4 es un fix chico; G1/G2 dependen del diseño).
- [ ] **118.3 — Re-verificación en emulador** repitiendo el test en vivo (seed de historial → «Sugerido» visible).

---

## Subtareas opcionales (P3) en fases cerradas

- [ ] **39.D (opc, P3)** — Split archivos >200 líneas: `AjustesPage` (489), `EntrenamientoPage` (449), `EntrenarPage` (415), `RutinaBuilderPage` (379).
- [ ] **46.U3 (opc, P3)** — Virtualizar listado de `RutinasPage` con `@tanstack/react-virtual`

## Mejoras identificadas (sin fase asignada)

- **Notificaciones — permiso bloqueado sin salida**: en Ajustes, con el permiso denegado («no volver a preguntar») sólo se muestra el aviso; falta un botón «Abrir ajustes del sistema» (requiere un plugin nativo de settings). Identificada en la verificación de F111 (2026-09-27); sin implementar.

---

## Registro histórico — fases cerradas con pendientes menores

### Fase 91 — Rendimiento y fluidez (auditoría 2026-09-11)

Objetivo: la app se siente **fluida en uso real, sin bajones de frames** (prioridad del usuario), en todas las páginas. Diagnóstico completo en `docs/performance-audit-2026-09-11.md` (evidencia archivo:línea + métricas medidas del build). Plan detallado con checkboxes en `docs/performance-tasks.md` (este bloque es la versión oficial en PLAN.md). ⚡ = quick win (esfuerzo S, alto impacto). Cada tarea: implementar → `npx tsc --noEmit` + `npm run build` + prueba de la página → commit por tarea (sin push).

#### 91.1 — RUTINAS (especial atención: mayor impacto de jank)

- [x] **91.1.1 — Builder: drag & drop sin jank (CRITICAL, peor caso 1050 items)**
  - [x] ⚡ rAF-throttle del `onDragMove` de `useDragReorder` (aplicar una vez por frame) — `useDragReorder.ts:30-43`
  - [x] ⚡ Bailout temprano: no llamar `setDragOver` si `(dayIndex, toIndex)` no cambió (hoy objeto nuevo por pointermove rompe el bailout de React)
  - [x] Cachear rects (`getBoundingClientRect`) al inicio del drag / al cambiar conteo, no por evento
  - [x] Verificar con Performance panel (CPU 4x): arrastrar en la rutina clonada grande — medición post-fixes en 91.6.
- [x] **91.1.2 — Carga de datos: eliminar N+1 (HIGH, ~1055 GETs → ~2-3)**
  - [x] ⚡ `exerciseRepo.getByIds(ids)` → `where('id').anyOf(ids).toArray()`
  - [x] ⚡ Usar `getByIds` en `enrichItems` (`useRoutines.ts:17-28`)
  - [x] ⚡ Usar `getByIds` en `useRoutineDraft.ts` (builder en edición)
  - [x] ⚡ `Promise.all` sobre días en `handleClone` y en el load de detalle
  - [x] Verificar: detalle + edición de la rutina grande cargan sin bloqueo visible — cubierta por la medición de 91.6.
- [x] **91.1.3 — Guardado: bulkAdd (LOW, S)**
  - [x] ⚡ `routineRepo.addDaysAndItems` → `bulkAdd` por tandas — `routineRepo.ts:62-80`
- [x] **91.1.4 — Render de listas: virtualización (HIGH, M)**
  - [x] Virtualizar lista de items del builder con `@tanstack/react-virtual` (patrón `ExercisePicker.tsx:158`) — `RutinaBuilderPage.tsx`
  - [x] Virtualizar `RoutineDayPanel` (detalle, 350+ filas por día)
- [x] **91.1.5 — Memoización de componentes (MEDIUM, M)**
  - [x] `memo` en `ExerciseItem` + key por id (hoy key = index) — `ExerciseItem.tsx`
  - [x] `memo` en `RoutineDayEditor`, key por day id, callbacks `useCallback` — `RoutineDayEditor.tsx`, `RutinaBuilderPage.tsx`
  - [x] Hoistear callbacks del builder fuera del render
- [x] **91.1.6 — Lista del catálogo: cards (HIGH)**
  - [x] `memo` en `RoutineCard` — `RoutineCard.tsx:40-47`
  - [x] `onToggleFav` estable (`useCallback`) — `RutinasPage.tsx`
  - [x] Cachear/hoistear `badgeFor` (hoy `routines.find()` por card = O(n·m))
  - [x] ⚡ `content-visibility: auto` + `contain` en `.routine-card` — `index.css:403-534`

#### 91.2 — SESIÓN ACTIVA (`/entrenamiento/active`)

- [x] **91.2.1 — Keystroke storm (CRITICAL: cada tecla re-renderiza todo + localStorage síncrono)** — `3798d63`, `ce49b49`
  - [x] Subscripciones finas al store: cada `SetRow`/selector por ejercicio selecciona solo su set; la página deja de subscribirse a `s.exercises` — `useActiveSession.ts:55`, `SessionGroupList.tsx`, `SetRow.tsx:40`
  - [x] Defer del persist: escritura debounced (400 ms) con flush en `pagehide`/`beforeunload`/`visibilitychange`, mismo formato y `partialize` — `activeWorkoutStore.ts` (perf-only, sin cambio de formato ni pérdida de datos)
  - [x] ⚡ `useCallback` por set + `memo` en `SessionGroupList` (hoy closures frescos en `ExerciseBlock.tsx:207-214`)
  - [x] Hoistear `useBodyWeight()` a nivel de página (hoy 1 liveQuery por bloque) — `ExerciseBlock.tsx:73`

#### 91.3 — PÁGINAS CONCRETAS (página a página; cada página = brainstorming + aprobación antes de tocar)

- [x] **Página: Estadísticas (`/estadisticas`)** — lazy por tab (enfoque A, aprobado)
  - [x] Cada tab monta sus hooks solo cuando está activo: `EntrenoTab`, `CuerpoTab`, `FuerzaTab` (tab cuerpo ya no paga sets/ejercicios/journals; tab fuerza solo benchmarks)
  - [x] Verificado: Recharts 337 kB aislado en la ruta lazy, nunca en el bundle principal
  - [x] `CuerpoTab` conserva el booleano global original vía `useWorkouts()` (paridad de empty state)
  - [x] Cambio aceptado por el usuario: tab `entreno` con datos corporales pero cero entrenos muestra el empty state con CTA (antes: panel lleno de ceros)
  - [ ] Follow-up futuro: acotar queries de sets (últimos N meses) o agregación DB cuando crezcan los datos — `EstadisticasPage.tsx:35-46` (era 91.4.3)
- [x] **Página: Entrenar home (`/`)** — auditoría ✅ (explore, 2026-09-11) · diseño A aprobado · **✅ implementado `157e2df`**
  - [x] **F1 MEDIUM — ~17 live queries duplicadas**: workouts ×6 (`EntrenarPage.tsx:65`, `useRecoveryScore.ts:14`, `ProgressDashboard.tsx:155`, `useStreak.ts:9` ×2, `PastSelfView.tsx:68`), workoutSets ×3 (`PlateauAlerts.tsx:14`, `PastSelfView.tsx:69`, `GoalProjectionCard.tsx:17`), exercises ×3, prs ×2, journals ×2, meta ×4, bodyWeight ×2, routines ×2 (`useActiveProgram.ts:11` + `DeloadBanner.tsx:9`), routineItems ×2 (`useRoutines.ts:77` + `:94`). Cada useLiveQuery hace su propia lectura IDB y clona el array.
  - [x] **F2 MEDIUM — `detectPlateaus` casi cuadrático**: hasta 24 escaneos completos de sets por ejercicio (`plateauDetector.ts:45-67` + `setStats.ts:19-30`); ~0,5–1,5M evaluaciones con 2.000+ sets.
  - [x] **F3 LOW — re-escaneos por ventana** (`goalProjection.ts:37-38,65-66`, `pastComparison.ts:76,83`).
  - [x] **F4 LOW — N+1 `getById`** en `useRoutineDayMuscleGroups` (`useRoutines.ts:80`) + `getItems(dayId)` duplicado (`:77`+`:94`).
  - [x] **F5 LOW — `useActiveProgram` escaneo full de routines** (`useActiveProgram.ts:10-13`; falta `routineRepo.getById`).
  - [x] **F6 NONE — limpio**: selectores Zustand finos, memoizaciones lineales, components prop-driven puros.
  - [x] **F1 fix**: hoistear `workouts`/`sets`/`prs`/`journals`/`settings` a `EntrenarPage` y pasar como props a `ProgressDashboard`, `PastSelfView`, `PlateauAlerts`, `GoalProjectionCard`, `QuickTemplates`, `DeloadBanner`, `LastWeightLink`, `useRecoveryScore` (kills ~17 lecturas duplicadas + clones). `GoalProjectionCard` → `Inner` (props) + `Self` (self-fetch): home pasa props, `ObjetivosPage` intacta.
  - [x] **F2 fix**: reescribir `detectPlateaus` agrupando sets por `exerciseId` con promedios semanales por ventana — O(S+E·W) en vez de O(E×24×S), mismo output (filtro laxo e orden preservados → paridad byte-idéntica).
  - [x] **F3 fix (cascada)**: group-once en `buildGoalProjections`/`buildPastComparison` (`goalProjection.test.ts` valores exactos 95.7/11.23 PASS).
  - [x] **F4 fix (cascada)**: `useRoutineDay(dayId)` → `{groups, items}` con UN `getItems` + `getByIds` batch; `exerciseMuscleGroup` en `RoutineItemWithNames`; hooks viejos como wrappers finos; reactividad preservada.
  - [x] **F5 fix (cascada)**: `RoutineRepository.getById` (interfaz + Dexie impl `db.routines.get`) usado en `useActiveProgram`.
  - [x] Verificación: tsc 0 · build EXIT=0 · 54 files/556 tests PASS · PWA 178 precache entries 3712 KiB (sin regresión de tamaño)
- [x] **Página: Fichas de detalle (`/rutinas/:slug`, `/ejercicios/:slug`, `/guias/:slug`, `/papers/:slug`)** — auditoría ✅ (explore, 2026-09-11) · diseño A aprobado · **✅ implementado `9d7b6c9`**
  - [x] Auditoría: guías/papers ✅ limpias (single indexed read); ejercicio limpia con 1 LOW (scan full de `prs`); rutina/detalle de sesión con LOWs ligeros (scans acotados)
  - [x] **D1**: `WorkoutDetail.tsx:28-29` — reemplazar `useExerciseCatalog()` + `usePRs()` por `exerciseRepo.getByIds(ids del set)` + PR por ejercicio (mata 2 full-table scans; cero cambio de comportamiento; patrón establecido en `useRoutines.ts:17-31`)
  - [x] **D2**: `EjercicioDetailPage.tsx:44` — `usePRs()` → `prRepo.getByExercise(exercise.id)` (ya existe indexado)
  - [x] Verificación: tsc 0 · build EXIT=0 · 54 files/556 tests PASS · PWA 178 entries 3713 KiB (sin regresión)
- [x] **Página: Histórico de sesión (`/entrenamiento/:id`)** — auditoría ✅ (explore, 2026-09-11) · **limpia**: `SesionPage`/`WorkoutHistoryTimeline` sin hallazgos; `WorkoutDetail` limpio tras D1 (`9d7b6c9`). Rendimiento hereda las mejoras de la ficha de detalle.
- [x] **Página: Biblioteca de ejercicios (`/ejercicios` + `/ejercicios/:slug`)** — auditoría ✅ (explore, 2026-09-11) · **limpia, sin fixes**: búsqueda debounced 150 ms + filter/sort/sections memoizados; lista virtualizada (`useWindowVirtualizer`, overscan 6, ~10-20 filas DOM); sin imágenes raster en filas; cero N+1; única lectura del catálogo; D2 verificado en la ficha (`prRepo.getByExercise`). `ExerciseFilterBar`/`AlphaRail`/`MuscleGroupIcon` presentacionales puros.
- [x] **Página: Calendario (`/calendario`)** — auditoría ✅ (explore, 2026-09-11) · **limpia** (decisión A del usuario: sin fixes): 1 LOW aceptado — `workoutRepo.getAll()` una vez por mount; navegación de mes 100% estado (`MonthCalendar`); la query acotada `where('localDate').between(...)` (índice en `db.ts:87`) se descarta por UX (agregaría loading por flip). Grid memoizado, ≤37 celdas, cero N+1, cero re-consulta.
- [x] **Página: Más / Perfil / Ajustes (`/mas`, `/perfil`, `/ajustes`)** — auditoría ✅ (explore, 2026-09-11) · diseño A aprobado · **✅ implementado `b3361ed`**
  - [x] Auditoría: MasPage ✅ limpia; logros ✅ limpios; Perfil 2 MEDIUM (DeloadCard scan full `workoutSets`; 3× scans `workouts`); **NUEVO MEDIUM** `AchievementsHost` global (`AppShell.tsx:59`) — 3 full-table scans por mount (`workouts`, `prs`, `workoutSets` completo)
  - [x] LOWs cargados: Ajustes 5× `useSettings`; Perfil 2ª lectura `prs` + scan catálogo para `nameById`; progress photos base64 (fuera de alcance F91)
  - [x] **M1**: `DeloadCard` — windowing por `localDate` de workouts (índice `db.ts:87`) → `getByWorkoutIds` de sets (índice `workoutId` `db.ts:74`): solo ~14 días en vez del clon completo de la tabla más grande. Cutoff −16 días con `above()` (proba: `createdAt` = `localDate` del workout, paridad exacta)
  - [x] **M2**: Perfil — 3× scans `workouts` → **1×**: `useWorkoutSummary` deriva streak del array ya cargado (`calcStreak`), expone `StreakResult` completo; `useStreak` de página borrado. `useStreak` intacto (lo usan `useActiveSession`, `useNotifications`)
  - [x] **M3**: `AchievementsHost` — `toCollection().filter(completed)` streaming (Dexie no materializa la tabla completa); guardas debounce + firma primitiva intactas
  - [x] Verificación: tsc 0 · build EXIT=0 · 54 files/556 tests PASS (+ 5 files dominio deload/streak/achievements 58 tests) · PWA 178 entries 3713 KiB
- [x] **Página: Calculadoras (`/calculadoras/*`)** — auditoría ✅ (explore, 2026-09-11) · **limpia** (decisión A del usuario: sin fixes): hub 0 lecturas Dexie (recents localStorage); IMC/Agua/Conversor/Navy puras (0 lecturas); Calorías 1 meta (age prefill); sin MEDIUM, sin N+1, sin recomputación sobre arrays de datos. LOWs aceptados: `OneRmExerciseSelector` carga catálogo 821 para buscador opcional (resultados capped a 12, memoizado) y `BODY_SEX_KEY` leído 2× en Medidas/Grasa (`SexSelector`). Series de charts memoizadas; mediciones/pliegues O(1) en el último entry.
- [x] **Página: Papers / Guías (`/papers*`, `/guias*`)** — auditoría ✅ (explore, 2026-09-11) · **limpia, sin fixes** — NONE en toda la superficie: 1 lectura seed por lista (papers ≈6, guías ≈30), 1 `getBySlug` indexado por detalle (`db.ts:75,90`), sin N+1, filtros chip O(6)/O(30) sin search input, hooks con stable-empty y guards por slug. Solo paga el host global de logros (ya M3).
- [x] **Página: Nutrición / Suplementos / Timer (`/nutricion`, `/suplementos`, `/timer`)** — auditoría ✅ (explore, 2026-09-11) · diseño A aprobado · **✅ implementado `98487e5`**
  - [x] Auditoría: Suplementos ✅ limpia (1 tabla pequeña, sin historial); Timer ✅ limpia (cero Dexie, estado puro); Nutrición 3 LOWs (meals full scan para hoy, bodyWeight full scan para hoy, `useFoods` montado 2×)
  - [x] **N1**: `useTodayMeals` (nuevo) — `mealRepo.getByDate(toLocalDateStr())` (índice `db.ts:231`); filtro JS eliminado de la página
  - [x] **N2**: peso de hoy vía `bodyWeightRepo.getByDate(toLocalDateStr())`; `useBodyWeight` NO tocado (otros consumidores necesitan historial)
  - [x] **N3**: 1 `useFoods` hoisteado a `NutritionPage` → props a `FoodAdder`; `foodsWithNames` memoizado `[customFoods, lang]`
  - [x] **DECISIÓN (usuario, opción 1): convención de fecha unificada a `toLocalDateStr()`** — nutrición escribía meals con fecha UTC (`toISOString().split('T')[0]`); alineada lectura Y escritura a fecha local (igual que steps/peso/workouts). Corrige desfase UTC (~21-24h en AR); cambio de comportamiento aceptado explícitamente para homogeneizar datos en toda la app. Nota: `useMeals.ts` quedó como dead code (borrar en pase futuro)
  - [x] Verificación: tsc 0 · build EXIT=0 · 54 files/556 tests PASS (+ nutrition domain 24/24) · lint 0 errores

#### 91.4 — SHELL / GLOBAL (pase final; afecta las 37 páginas a la vez — no es una página puntual)

- [x] **Pase Shell/Global** — auditoría ✅ (explore, 2026-09-11) · paquete completo aprobado (usuario) · **✅ implementado `4f8ce7f`**
  - [x] Auditoría: AppShell ✅ limpio (settings 1 read, telemetry tras consent, transiciones GPU); telemetry/init ✅ (pasa a 91.5); M3 streaming **verificado aplicado** (`useAchievements.ts:33-34`); 2 MEDIUM + 4 LOW
  - [x] **G1 (MEDIUM)**: `background-attachment: fixed` eliminado de body (`index.css:667`) — gradientes ahora scrollean con contenido (5-9% tint, imperceptible)
  - [x] **G2 (LOW)**: routine-card — `backdrop-filter: blur(4px)` eliminado (`:517`); `::after` pasa de `mix-blend-mode: soft-light` a overlay plano con el mismo `color-mix(cta 22%)`; velo `::before`, z-index, shadows y hero-atmosphere intactos
  - [x] **G3 (LOW)**: `.app-grain` — `mix-blend-mode: overlay` eliminado (`:697`); noise a `opacity: 0.05` conservado; elemento intacto (`AppShell.tsx:39`)
  - [x] **G4 (LOW)**: `useGlobalDragScroll` — rAF-coalesce (`pending {dx,dy,raf}` ref + 1 write/frame; cancel en mouseup/cleanup); early-exit, umbral 4px, `passive: false`+preventDefault, ancestor-walk y classList intactos
  - [x] **G5 (LOW)**: preconnect `fonts.googleapis.com` + `fonts.gstatic.com crossorigin` en `index.html`; `@import`+`display=swap` intactos
  - [x] **G6 (MEDIUM, decisión usuario: precachear)**: `jpg` en `globPatterns` + `maximumFileSizeToCacheInBytes: 5_000_000` (max jpg 0.88 MB, nada se descarta). **Precache 178 → 1995 entries; 3713 → 102707 KiB (~100 MB)** — 1817 jpgs (69 rutinas + 1746 ejercicios + hero + logo; el conteo real excede el estimado "~70" de la auditoría pero el tamaño coincide con lo aprobado). Offline visual completo web; Capacitor no afectado
  - [x] Verificación: tsc 0 · build EXIT=0 (precache 1995/102707 KiB confirmado) · 54 files/556 tests PASS

_(Los ítems 91.4.1–91.4.4 del plan original quedaron absorbidos por G1–G6 arriba: 91.4.1=G1+G2+G3, 91.4.2=G4, 91.4.3=G5, 91.4.4=G6. Todos implementados en `4f8ce7f`.)_

#### 91.5 — LOAD / STARTUP

- [x] **Pase Load/Startup** — auditoría ✅ (explore, 2026-09-11) · diseño A aprobado · **✅ implementado `c87534d`**
  - [x] Auditoría: telemetry ✅ diferida (SDKs lazy + consent-gated, post-first-paint, implementación de referencia); index.html ✅ (hero preload + anti-flash inline); boot síncrono ✅ sin bloat; **1 MEDIUM + 1 LOW**
  - [x] **L1 (MEDIUM)**: reseeder gateado — `ensureSeeded` inline en `providers.tsx` (fast path: `metaRepo.get('seedVersion')` + `SEED_VERSION` de `db.ts` + `profileRepo.ensure()`; mismatch → dynamic `import('@/data/seed/reseeder')` → `ensureSeeded()` byte-idéntico). **Boot frío pierde ~239 kB JS** (reseeder 232 kB + logros ya no se fetch-ean en versión al día; `reseeder-CNi-vY42.js` ahora solo dep lazy, ausente del modulepreload inicial)
  - [x] **L2 (LOW)**: `AchievementsHost` → `lazy()` + `<Suspense fallback={null}>` igual que `Onboarding` (`AppShell.tsx:10-12,61-63`); liveQueries reactivas + debounce 600 ms garantizan todos los unlocks; sin delay artificial
  - [x] Verificación: tsc 0 · build EXIT=0 (precache 1998 entries, +3 chunks) · 54 files/556 tests PASS (procesos globales de arranque, no páginas)

_(Los ítems 91.5.1–91.5.2 del plan original quedaron absorbidos por L1–L2 arriba: 91.5.1=L1 reseeder gateado, 91.5.2=telemetry ya era diferida — la auditoría confirmó SDKs lazy + consent-gated, sin trabajo pendiente.)_

#### 91.6 — Cierre del bloque rendimiento

- [x] Medir antes/después con Performance panel (CPU 4x, device low-end si hay) en los 2 flujos peores: builder con rutina grande y keystrokes en sesión — **✅ medido post-fixes (traces Chrome JSONL, CPU 4x)**: builder 35 long tasks/3.36 s total/max 250 ms (drag-reorder; script 2.75 s, layout 114 ms); sesión **suave** 12 long tasks/876 ms/max 80 ms (script 588 ms, layout 64 ms). Sin jank perceptible en sesión; builder OK con pico esperable en drag-reorder sobre 20 items.
- [x] Actualizar `CHANGELOG.md` bajo `[Unreleased]` por cada tarea relevante — cubierto: se actualiza por commit.
- [x] Integrar este bloque en `PLAN.md` commiteado — hecho: PLAN.md está commiteado y limpio.

---

### Fase 101 — Onboarding guiado de la app (tour + replayable) — cerrada ✅ (2026-10-02)

> **Pedido del usuario (2026-09-15).** El onboarding actual (`src/components/onboarding/Onboarding.tsx`) es un **wizard de configuración** (idioma/objetivo/días/perfil/resumen), no un tour que enseñe a usar la app; además es **irrecuperable** (`Onboarding.tsx:97` lo oculta tras el primer entreno y `:139` se niega a correr si ya está hecho) y no tiene tests. Objetivo: convertirlo en un **tour guiado** que enseñe a usar la app y que se pueda **re-ver desde Ajustes**. Reutiliza el catálogo de ayudas de la Fase 90 (esa fase NO persiste "ya visto": la ayuda es on-demand; el tour sí necesita su propio flag de completado en `meta`).

- [x] **101.1 — Tour guiado**: recorrido por los flujos clave (día/rutina del home, sesión activa, historial/estadísticas, logros, ajustes) explicando qué hace cada uno, sin bloquear el uso. — Implementado (commits `1dc041f`, `102c0c4`): overlay con spotlight, 8 pasos guiados, Skip/Escape y arranque único; unit + recorrido e2e verificados.
- [x] **101.2 — Separar wizard de tour**: el wizard de setup y el tour son cosas distintas; el tour no condiciona el arranque de la app. — Implementado (commit `1dc041f`): `tourPending` solo en la ruta «Empezar D1»; gate `onboardingDone && tourPending && !tourDone`.
- [x] **101.3 — Replayable desde Ajustes**: re-ver el tour cuando el usuario quiera (flag en `meta`, patrón 90.5). — Implementado (commit `09b2959`): Ajustes → Ayuda con «Volver a ver el tour» + toggle de consejos; replay verificado por e2e.
- [x] **101.4 — Tests**: unit del gate/estado + e2e del flujo completo. — e2e `tests/e2e/test_f101_tour.py` ALL OK (2 escenarios: recorrido completo con tips/replay y salto con `tourPending` sembrado); el e2e destapó dos carreras de `SectionTipHost` (marcas de secciones cubiertas pisadas al Terminar y tip visible con el tour abierto) que se corrigieron en T8: merge con lo último persistido antes de escribir + gate imperativo del store del tour.
- [x] **101.5 — Onboarding por apartado (nota 15)**: hacer un onboarding que te enseñe a utilizar la app cuando entras en un apartado por primera vez; se debe poder desactivar en ajustes y tener un skip. — Implementado (commit `cac0111`): 6 secciones + toggle en Ajustes; el fix de T8 garantiza «una vez por sección». Verificado por e2e web y smoke nativo.
- [x] **101.6 — Scroll del wizard existente (nota 18)**: el onboarding existente no hace scroll, por lo que en pantallas pequeñas no se puede dar a los botones porque desaparecen de la pantalla (se ve más abajo). — Implementado (commit `5885e98`): scroller con gesto real + `overscroll-contain`; e2e `test_f101_wizard_scroll.py` ALL OK (375×812 y 360×640); smoke nativo parcial (IME flotante del emulador).

**Estado de cierre (2026-09-28, worktree aislado `f101`, rama `f101` rebasada sobre `ad02c0b`):** fase entregada completa en 10 commits — `28a9f12` (spec), `e86d133` (plan), `1dc041f`, `5885e98`, `2c8c36e`, `db39df3`, `102c0c4`, `09b2959`, `cac0111`, `6ca19c3` (cierre). **Verificación:** `npm test` 99 archivos / 1097 tests (F101 sobre F102), `npm run build` limpio, e2e `test_f101_tour.py` + `test_f101_wizard_scroll.py` + `test_f44.py` ALL OK (con `--port 5179`, para no chocar con los dev servers de otras sesiones) y smoke nativo en emulador-5554 (0 `pageerror`, rutas multi-segmento montan, tour abre/salta). **Reviews nativos: 8/8 aprobados y acknowledged** (uno por tarea): T1–T3, T6 y T7 en sesión; **T5 y T8 completados por la vía CLI** del fix-doc del cap de 32k (`C:\Users\Yves De Faria\.gentle-ai\opencode-output-cap-fix.md`, sin reiniciar OpenCode); **T4** quedó en `operation_timeout` por contención del store compartido (12 worktrees activos), se commiteó `[no revisado]` por decisión del usuario y **al cierre el lineage revivió: aprobado con 0 findings**. El e2e de T8 hizo su trabajo: destapó dos carreras reales de `SectionTipHost`/`TourOverlay` (el cierre del tour pisaba las secciones cubiertas y el tip podía verse con el tour abierto) → corregidas con merge-latest antes de escribir + gate imperativo del store. **Pendientes:** validación completa del teclado IME en dispositivo real (el Gboard del AVD es flotante y `MainActivity` no tiene `adjustResize`) → encolada a validación de release; advisories parkeados para triage (frontera de segmento en `sectionForPath`, write opcional de `tourPending` dentro del try de `finish`, robustez del e2e del wizard, exhaustividad/mapping del catálogo del tour, `waitForAnchor` sin re-arm, `void update` en toggles) — ninguno bloqueante. **Lecciones de entorno (multisesión):** el reviewer en sesión falla vacío con candidatos grandes (cap 32k de OpenCode): ir directo a la vía CLI; el preflight selectorless puede devolver un target `base-diff` anómalo bajo contención (reencauzar con `--base-ref <HEAD> --workspace-overlay`); y un status de lineage puede dar `operation_timeout` con el store saturado — el lineage queda intacto y revive al reintentar más tarde (no forzar reintentos inmediatos).

**Pulido cerrado (2026-10-02, commits `1a42cee`..`2eb0e84`, review nativo por candidato ✅):**

1. **Copy neutro ✅** — tour y tips reescritos a es-ES neutro (12 pasos + 6 tips), espejo `en` completo y aserciones del e2e actualizadas.
2. **Barrido de voseo app-wide ✅** — además de los dos casos detectados (ErrorBoundary en `es/core.ts`, guardado en `es/routines.ts`), el barrido completo del locale `es` neutralizó 27 strings (core/features/routines/nutrition); «entrenos» queda como término de dominio.
3. **Foco del tour ✅** — anclas re-scopeadas para que el spotlight calque lo descrito (logros→barra de progreso; rutinas→acciones+filtros; estadísticas→tablist; más→enlaces; `home-start` estable en las 4 ramas del hero) + hardening de `useTourAnchor` (poll persistente sin timeout terminal, guarda `isConnected`, rearme por ruta, re-medición tras animaciones/fuentes y medición diferida). El e2e verifica **geometría del spotlight por paso** (±2px) y un caso determinista de ancla tardía (chunk lazy de Rutinas retardado 2,5 s).
4. **Ayuda visible ✅** — `HelpSection` sube en Ajustes (después de Apariencia); aserción e2e de visibilidad sin scroll en 375×812.
5. **Tour ampliado ✅** — 8→12 pasos: calendario semanal y plantillas rápidas en Inicio, catálogo/filtros en Rutinas, frecuencia muscular en Estadísticas.
6. **Re-test ✅** — e2e F101 completo (arranque real sin seed, 12 pasos, replay, tips, skip), `npm run build` limpio + `npm test` 111 archivos / 1227 tests y **smoke nativo en emulador-5554**: tour 1/12→12/12 con `Terminar` (flags correctos), ruta multi-segmento monta, 0 `pageerror`.

**Advisories parkeados (no bloqueantes):** T1-R3-1 (pending residual si falla una escritura y luego se cierra por el escape), T1-R3-2 (el e2e no cubre la ventana de carrera previa del tip), T2-R3-001 (rama disconnect sin test dedicado; no hay jsdom en el proyecto), T2-R3-002 (pre-existing: el rect no se limpia si el ancla desaparece sin reemplazo).

**Ronda 2 — feedback del usuario (2026-10-02, commit `79cd2b6`):** el tour pasa a **13 pasos** con la parada nueva de **objetivos** en el home (`home-goals`) y el foco de **Logros** movido de la barra general de progreso a la **primera medalla** de la lista (`logros-medalla`; remonte por `key` cuando el ancla cambia de dueño al resolver Dexie). Deck completo revisado para principiantes (fuera jerga: RIR, volumen, PRs, periodización; el paso de Estadísticas gana una explicación de para qué sirve) y tip de estadísticas simplificado. E2E actualizado a 13 pasos con geometría por paso. Review nativo `review-5b5dc48469c55308` aprobado; advisories: el e2e no simula el cambio de dueño del ancla de medalla y no verifica el texto del paso nuevo.

---

### HANDOFF — Estado de sesión (2026-09-11, histórico)

> **LEER PRIMERO por la próxima sesión.** Cómo retomar sin lagunas.

### Qué se completó (Fase 91, SIN push, commits en `main` local)

| Bloque | Estado | Commits |
|---|---|---|
| 91.1 Rutinas (rAF+bailout, getByIds N+1→batch, bulkAdd, virtualización builder+day panel, memo ExerciseItem/day, memo RoutineCard+badges+content-visibility) | ✅ PLAN.md marcado | `a96c32e`, `89a52bb`, `5bba29d`, `46762bf`, `f138438`, `3b2400c` |
| 91.2 Sesión activa (suscripciones finas por set, memo SetRow, persist debounced 400ms+flush, callbacks estables, bodyWeight hoisted) | ✅ PLAN.md marcado | `3798d63` (5 archivos limpios), `ce49b49` (hunk-split de 3 archivos compartidos) |
| 91.3 Estadísticas — lazy por tab (enfoque A aprobado) | ✅ PLAN.md marcado | `64862e7` |

### Estado del worktree (CRÍTICO)

- **WIP F63 sin commitear ni stagear** (lo tocan fases futuras; NUNCA stagear estos archivos, son de otro trabajo):
  - `.gitignore`, `gymlab-app/CHANGELOG.md`, `gymlab-app/PLAN.md`
  - `src/components/session/SessionSuggestions.tsx`, `src/domain/sessionSuggestions.ts`
  - `src/hooks/useActiveSession.ts`, `src/store/activeWorkoutStore.ts`, `src/pages/EntrenamientoPage.tsx` (quedan solo los hunks F63 tras `ce49b49`)
  - `src/i18n/locales/{en,es}/workout.ts`
- **Checkboxes de PLAN.md viven en el worktree sucio** (no se commitean hasta resolver el rewrite F63/F93).
- **Compromiso adquirido**: mientras exista WIP F63, cada tarea 91.x se commitea con **solo los archivos de código de esa tarea** (stage explícito por archivo, nunca `git add -A`). Si una tarea toca archivos compartidos con F63 → **hunk-split con `git apply --cached`** con patches filtrados en `%TEMP%\opencode\*-*.patch` (patrón usado en `ce49b49`).

### Convenciones del bloque (obligatorias)

1. **Restricción dura**: solo performance; patrones de render idénticos; si un fix cambia comportamiento → STOP y preguntar al usuario (con opciones y tradeoffs, una sola pregunta).
2. **Proceso por página**: explorar → **diseño corto en chat + aprobación del usuario** (skill `brainstorming`, ya acordada con el usuario: "página a página con brainstorming") → delegar a sub-agente `general` con handoff (skills `software-architecture` + `verification-before-completion` inyectadas) → verificar → commit solo código, sin push.
3. **Gates de verificación** (todos antes de commitear): `npx tsc --noEmit` (0 errores) + `npm run build` (exit 0) + `npm test` (54 files / 556 tests) + si aplica e2e `python tests/e2e/scripts/with_server.py tests/e2e/test_f88.py` (ALL OK).
4. **Commits**: `perf:` conventional (ver log: `perf: ... (F91.x)`), un commit por tarea, sin push (el usuario hace push manualmente).
5. **CHANGELOG.md**: NO tocarlo mientras sea WIP ajeno; se integra en el rewrite F63/F93.
6. **Engram**: guardar hitos al cerrar cada página (`engram_remember`, topic `fase91-rendimiento`), briefing al arrancar la sesión.
7. **Rate limit del provider al delegar**: puede fallar el primer intento de sub-agente; reintentar una vez con la misma tarea.

### Decisiones tomadas (no re-preguntar)

- Estrategia frente al choque WIP F63 ↔ 91.x: **stage por hunks** (elegida por el usuario).
- Shell/global (91.4) NO es página → **pase final** después de las páginas concretas (elegido por el usuario: "Páginas primero, shell al final").
- Tab `entreno` con datos corporales pero cero entrenos → mostrar **empty state con CTA** en vez del panel lleno de ceros (aceptado por el usuario).
- Rechazado por el usuario el bloque 91.3 "GLOBAL/SHELL muy general" → reorganizado **página a página** (esta sección 91.3).
- `using-workflow` NO se usa en este bloque (es para crear algo nuevo); se usa `brainstorming`.
- "Verificar con Performance panel" de 91.1.1/91.1.2 **sin marcar** → medición manual diferida a 91.6.

### Baseline (auditoría 2026-09-11, `docs/performance-audit-2026-09-11.md`)

JS inicial ~557 kB raw/~182 kB gz · posthog 274 kB y Sentry 475 kB gated · reseeder 232 kB por boot · PWA precache 3.7 MB, `.jpg` ejercicios 97.5 MB sin cachear (offline roto) · Google Fonts `@import` render-blocking.

### Próximos pasos (orden del checklist 91.3)

1. **Entrenar home (`/`)** — auditoría de hot paths y hooks compartidos (chunk lazy 42.21 kB).
2. Fichas de detalle (`/rutinas/:slug`, `/ejercicios/:slug`, `/guias/:slug`, `/papers/:slug`).
3. Histórico de sesión (`/entrenamiento/:id`).
4. Biblioteca de ejercicios (`/ejercicios` + ficha).
5. Calendario (`/calendario`).
6. Más / Perfil / Ajustes.
7. Calculadoras · Papers/Guías · Nutrición/Suplementos/Timer (probablemente solo confirmar limpio).
   Luego 91.4 Shell (4 items), 91.5 Load/startup, 91.6 cierre (medición + CHANGELOG + integrar PLAN commiteado).

---

## Referencia del proyecto

## Producto

App web mobile-first de entrenamiento:
- Seguimiento de series/reps/peso
- Catálogo de rutinas + programa activo
- Calendario (días hechos vs programados)
- Anillo de progreso (sesión + programa)
- Dummy muscular con fatiga
- Papers científicos + **Guías** (nutrición/entrenamiento)
- Perfil, calculadoras, biblioteca de ejercicios con media
- Offline PWA → Capacitor Android
- **Cimiento** de red social (schema/repos; UI feed futura)

Datos: **local-first (Dexie)**. Repositorios desacoplados → Supabase en fase social.

---

## Arquitectura de carpetas

```
ProyectoGymLab/
├── content/training-library/   # fuente offline seeds/guías
└── gymlab-app/
    ├── PLAN.md, AGENTS.md, CHANGELOG.md
    ├── public/exercises/     # media free-exercise-db + SVG
    └── src/
        ├── domain/           # puro: dates, streak, calendar, fatigue, progress, social types
        ├── data/seed + repositories/
        ├── store/            # sesión activa
        ├── pages/ components/
        └── ...
```

### Capas

| Capa | Regla |
|------|-------|
| `domain/` | Sin React/Dexie |
| `data/repositories/` | Interfaces; hoy Dexie, mañana API |
| `pages/` + `components/` | Cero queries Dexie directas preferible (hooks OK) |
| `store/` | Solo sesión efímera |

---

## Site map

```
/
├── Entrenar (/)                         # stats, anillo programa, mini-calendario bajo racha, CTA
│   ├── Sesión (/entrenamiento/active)   # anillo % sesión, finalizar ejercicio
│   └── Calendario (/calendario)         # vista mes completa (comparte MonthCalendar)
├── Rutinas (/rutinas)                   # Mis rutinas (custom) + Predefinidas
│   ├── Nueva (/rutinas/nueva)           # builder rutina custom
│   ├── Editar (/rutinas/:slug/editar)   # solo custom
│   └── Detalle (/rutinas/:slug)         # play, ETA, seguir programa
├── Papers (/papers)
├── Más (/mas)
│   ├── Ajustes (/ajustes)               # toggle modo noche/día
│   ├── Perfil (/perfil)
│   ├── Guías (/guias, /guias/:slug)
│   ├── Cuerpo (/cuerpo)                 # dummy + fatiga
│   ├── Calculadoras (/calculadoras/*)
│   ├── Ejercicios (/ejercicios/*)
│   └── [futuro] Comunidad
```

Tab bar: `Entrenar · Rutinas · Papers · Más`

---

## Design system

Tema **dual** (modo noche/día), acento dorado en ambos:

| Token | Noche | Día |
|-------|-------|-----|
| `--bg` | `#121214` | `#FFFFFF` |
| `--bg-elevated` | `#242422` | `#F5F3EE` |
| `--fg` | `#F8FAFC` | `#17171A` |
| `--accent` / `--cta` | `#D9B384` | `#B07F2E` (dorado oscuro p/ contraste) |
| `--accent-soft` | `#FDDDB4` | `#8A6620` |
| `--success` | `#22C55E` | `#15803D` |
| `--danger` | `#EF4444` | `#B91C1C` |
| `--border` | `#3A352B` | `#E3DACB` |

- Se aplica vía `data-theme="night|day"` en `<html>`; gold-gradient/text se mantienen dorados.
- Persistencia: `localStorage` (primer paint sin flash) + `meta.theme` (Dexie).

Oswald + Barlow · Lucide · motion 150–300ms · `prefers-reduced-motion`

---

## Modelo Dexie (v2+)

```
meta, exercises, routines, routineDays, routineItems,
workouts, workoutSets, papers, guides, profile, activeProgram, prs,
socialProfiles, posts, postMedia   # social stub
dailySteps, mealEntries, progressPhotos, benchmarkResults   # fases 76/79/82 + F84
```

- Fechas de negocio en **local** `YYYY-MM-DD`.
- Seed versionado (`meta.seedVersion`).
- IDs seed < 10000; user/custom ≥ 10000 o UUID en social.

### Media ejercicios

- Fuente primaria: **free-exercise-db** (Unlicense).
- Campos: `imageUrls[]`, `externalId`, fallback SVG por grupo.
- Componente `ExerciseMedia` (2 frames inicio/fin).

---

## Verificación

| Check | Método |
|-------|--------|
| Dev | `npm run dev` |
| Build | `npm run build` |
| Types | `npx tsc --noEmit` |
| Streak/calendario | fechas locales correctas |
| Media | offline en public/exercises |
| Mobile | 375×812 |

---

## Skills

`.opencode/skills/`: frontend-design, ui-ux-pro-max, site-architecture, software-architecture, accessibility, seo, webapp-testing.

Skills remota (*installed on demand*): **`mobile-app-ui-design`** (https://github.com/ceorkm/mobile-app-ui-design) — metodología de UI/UX móvil (paleta 60/30/10, grid 8-pt, sombras tintadas, Peak-End, Trojano Horse/Vanity Mirror/Comfort Trap). Referenciada desde la Fase 31.
