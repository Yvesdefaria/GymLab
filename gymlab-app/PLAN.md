# GymLab App — Plan de implementación

Stack: **Vite + React 18 + TypeScript + Tailwind + Dexie + Zustand + Recharts + PWA → Capacitor (Android)**

Prototipo HTML en `../GymLab/` = solo referencia de marca. No modificar.

Fuente de contenido offline: `../content/training-library/`.

> **Fases totalmente cerradas → `COMPLETED.md`** (no requieren revisión).
> **Este archivo contiene SOLO lo pendiente o por revisar.**

---

## Estado verificado — 2026-10-04

> Verificación read-only del plan contra el código, git y los worktrees (cada ítem con su evidencia). Foto: 73 casillas abiertas; 7 stale quedaron tildadas en este mismo pase. **Re-verificación 2026-10-08:** los 12 pendientes de la tabla siguen abiertos (evidencia actualizada); **F103/F120** ya archivadas; **F73** pasa a `COMPLETED.md` (solo queda su validación física, abajo); **F81** archivada 2026-10-08 (cierre completo del import); **F83** se cierra como obsoleta el mismo día (decisión del usuario: el panel de técnica queda de referencia, sin persistencia de checks — sale de la tabla y pasa a `COMPLETED.md`). **2026-10-09:** F84d (widget nativo, Android) implementada, revisada y cerrada — sale de la tabla y de este archivo (ver `COMPLETED.md`, Era 7, y `84d.followups` en «Seguimiento de reviews»). **2026-10-10:** F91 (rendimiento y fluidez — 2ª ejecución de F91) cerrada y archivada — su bloque completo (91.1–91.6) y su handoff salen de este archivo hacia `COMPLETED.md` (Era 11); queda acá solo su follow-up de queries de sets.

### En curso
- Nada activo: **F103** (estabilidad, ampliada) y **F120** (re-auditoría F91) quedaron cerradas y archivadas en `COMPLETED.md` (2026-10-07).

### Pendientes reales (verificados en código)
| Ítem | Evidencia |
|------|-----------|
| 102.7 — teclear `12,5` termina en `125` | `numberGuard.ts:54-59` (modo entero: el separador corta y lo tecleado tras él se descarta; sin retención) |
| Reto `pr-1` no completa el conteo de logros | `achievementProgress.ts:354` pasa `pr.date` ISO cruda → `challenges.ts:135` → `dates.ts:37-42` (Invalid Date en `1semana`); la tarjeta de Home sí normaliza (`EntrenarPage.tsx`) |
| 110a — guard del thunk en el logger | `lib/logger.ts:46-50` (`write()` sin try/catch) |
| R3-001 long-press — `mailto:` sigue con menú nativo | `MainActivity.java:18-23` (filtro solo `SRC_ANCHOR_TYPE`/`ANCHOR_TYPE`/`SRC_IMAGE_ANCHOR_TYPE`) |
| 108 follow-ups (a/b/c) | `healthSyncController.ts:52` (dedupe sin modo); `useHealthSync.ts:37-40` (reprograma sin limpiar timer); `:46` (`.finally` sin `.catch`) |
| 112b — falta `persist.clearStorage()` en el reset | `factoryReset.ts:53-58` |
| 113a — clamp del contador solo en efecto | `SessionCarousel.tsx:149-154` (clamp en efecto, no en render); el contador usa `activeIndex` sin acotar en render (`SessionCarouselIndicator.tsx:23-25`) |
| F94 — emojis renderizables sin sustituir | `features.ts:77` es/en (`💪`); `WorkoutExerciseBlock.tsx:80` (`✓`) |
| F118 — gaps G1 + G4 | `sessionSuggestions.ts:147` (RPE por defecto 7) y `:84-96` (no filtra calentamientos) |
### Corregidos en el pase del 2026-10-04 (checkboxes stale tildados)
- F83 «ampliar datos de técnica (curl, fondos, dominadas)» → cumplido por F93 #20 (`459db61`, `819bf89`, `013e877`: checklist ampliada + fallback de pasos para todas las fichas).
- 91.1.1/91.1.2 «verificar con Performance panel» → medición post-fixes realizada en 91.6.
- 91.6 «CHANGELOG por tarea» / «integrar este bloque en PLAN.md commiteado» → sin objeto (convención de commits; PLAN.md commiteado).
- 93 #21 (duplicado de F84) y 93 #15 «verificación + CHANGELOG + commit» → cerrados (F105: `651f350`, `c4debdd`; COMPLETED.md).

### Solo validación física (no verificable en este entorno)
F73 · F84c (frescura real de Health Connect) · F84d (widgets en teléfono real) · F93 #15 (foto en móvil real) · F101 (teclado IME).

### Listas para tu revisión / archivo
Nada pendiente (F81 y F83 archivadas el 2026-10-08).

### Otros abiertos (sin verificación línea a línea)
102.8 (review opcional del rango F102) · 112c–g · 113b–f · 119-2 · 108d · 91.3 (acotar queries de sets — se cruza con el hallazgo 7 de F103) · F114–F117 (deuda con diseño pendiente) · F118 (diseño) · F100 (post-cuentas) · #30/#22/#8 (acciones o validaciones de usuario).

### Anotado para fase futura (pedido del usuario, 2026-10-09)

- [ ] **Firma release propia + APK compartible con actualización limpia** — decisión tomada: clave release **propia** (no la debug). Ejecutar cuando el usuario quiera: (1) crear keystore `android/gymlab-release.jks` (NUNCA commitear; `*.jks` ya está ignorado) + credenciales en `android/keystore.properties` (agregar al `android/.gitignore`; guardar COPIA DE SEGURIDAD del keystore — sin él no hay actualizaciones futuras); (2) cablear `signingConfigs.release` en `android/app/build.gradle` leyendo `keystore.properties` con fallback a debug si no existe (los builds de desarrollo siguen igual); (3) `assembleRelease` → APK firmado para compartir (reemplaza al `GymLab-F84d-debug.apk` del Escritorio); (4) **migración única** (~2 min, datos se conservan): en cada teléfono que tenga la versión actual (debug de esta máquina) → Ajustes → exportar backup (JSON, 28 tablas) → desinstalar → instalar la release → importar backup. De ahí en más: toda versión nueva se instala ENCIMA sin borrar nada (tu teléfono y los que compartas) y la firma queda apta para Play Store. Nota: la build release no es inspeccionable por CDP — el emulador sigue siendo el banco de pruebas con builds debug.

---

## Tareas de Fase 93 pendientes

#### [ ] #30 — Crear correo de la app
- [ ] **Requiere intervención del usuario**: crear la cuenta de correo de la app.
- [x] Añadir el correo como contacto en Ajustes / T&C (`/terminos`) / reporte de errores (#29) — cableado con el placeholder `gymlab@app.gymlab.dev` (`src/config/contact.ts`; usado en Términos, Privacidad y ReportBug). Reemplazar por la cuenta real al crearla.
- [ ] Verificación + CHANGELOG + commit.

#### [ ] #21 — Wearables y contador de pasos (duplicado F84/F84a–f)
- [x] Ejecutar las fases ya planificadas: **F84a** ✅, **F84b** ✅, **F84c** ✅, **F84d** ✅ (widget nativo Android, 2026-10-09), **F84e** ✅, **F84f** ✅ — referencia duplicada; estado real en la sección F84.

#### [ ] #22 — Revisión futura: sesión rápida
- [ ] Validar con el usuario que la sesión rápida mantiene el valor/contexto esperado tras su uso real.

#### [ ] #8 — Guías: imágenes
- [ ] Ranura hero en `GuiaDetailPage`; requiere `imageUrl` opcional en `Guide` + assets.

---

## Seguimiento de reviews (advisories no bloqueantes)

> **Resueltos y archivados en `COMPLETED.md` (2026-10-09, «Seguimiento de reviews — resueltos»): F108 (refresco rápido + followups), 109, 110, 112, 113, 119, long-press-links y 81** — todos con review nativo approved + acknowledged (authority burned). Abajo quedan SOLO los residuales test-only no bloqueantes.
>
> **Lote 9 (consolidación test-only, 2026-10-10, commit `2c38429`, review `review-39fbd3f892a45e3e` approved + acknowledged): resueltos `108.followups-3` (R3-WARNING), `109.followups` (a: helper e2e multi→1 — b ya estaba cubierto en `stepsSync`), `110.followups-2` (R3-WARNING) y `112.followups-2` (a: R3-RESET-CONFIRM-GATE-TEST). El resto sigue abierto (ver cada ítem).**

- [x] **108.followups-3 (residual del review de los residuales)** — de `review-e236815a19b158f9` (WARNING no bloqueante; no reabre el candidato): el test nuevo del rechazo traga el rechazo con `await auto.catch(() => {})` sin asertar que la auto rechazó de verdad — si el setup de las 2 notificaciones no se cumpliera, el test pasaría igual (una auto resuelta también re-ejecuta el interactive); agregar `await expect(auto).rejects.toThrow('listener roto')` antes de esperar el connect. **RESUELTO lote 9: la aserción verifica el rechazo exacto (verificado con sonda: el auto rechaza con 'listener roto').**
- [x] **109.followups (residuales del review del fix)** — de `review-48529c5299db8494` (no bloqueantes; no reabren el candidato): (a) **R3-001 (WARNING)**: la rama sin contador del helper ignora `before` — si el contador desaparece al encogerse la cola a su último ítem (multi→1), el wait esperaba un detach que recién llegaba con el próximo clic y solo lo resolvía el timeout; distinguir «el contador desapareció» (`before !== null` → avance) del caso cola-de-1 (`before === null` → esperar detach); (b) **R3-002 (SUGGESTION)**: el test histórico aserta una cota (`>= 2`) — pinchar el conteo exacto o contrastar el mismo fixture con y sin el PR ISO. **RESUELTO lote 9: (a) resuelto en `test_f109.py` (rama `before is not None` + contador desaparecido = avance; e2e ALL OK en 5207); (b) ya estaba cubierto en `stepsSync.test.ts` (`synced` + `days: 0` asertados en «misma fecha» y «sin días escritos»).**
- [x] **110.followups-2 (residual del review del fix)** — de `review-69a9c1486acfd521` (WARNING no bloqueante; no reabre el candidato): el test del sink que lanza descarta el spy de `console.warn` → no asserta que el mock fue invocado; capturar el spy y asertar `toHaveBeenCalled`. **RESUELTO lote 9: `expect(warn).toHaveBeenCalledTimes(1)`.**
- [ ] **112.followups-2 (residuales del lote y de los reintentos)** — (a) del review del lote `review-fce0a052e4c932db`: **R3-RESET-CONFIRM-GATE-TEST** — **RESUELTO lote 9**: test de auditoría por fuente `resetConfirmSheetGate.test.tsx` (backdrop/Escape vía `requestClose`, botones `disabled` con busy; límite: no ejecuta eventos reales — ver advisory `source-audit-gate`). (b) De los reintentos históricos (advisories informativos; **verificar vigencia en el código actual antes de tocarlos**): T5 — R3-1 (sin test a nivel hook de la persistencia de logros), R3-2 (el test de patch no ejercita `collectibles`); T6 — **R3-NOTIFY-BACKEND** (WARNING: si adquirir el backend de notificaciones rechaza, el reset aborta — hoy sigue igual en `factoryReset.ts`), **R3-PARTIAL-WIPE** (WARNING: stores reseteados sin rollback si falla la transacción), R3-DEFAULT-DEPS-UNPROVED (goalStore.reset sin test), R3-CLEAR-STORAGE-RELOAD (storage-clear sin guarda antes del reload).
 - [ ] **113.followups-2 (residuales del review del fix)** — de `review-3800818cd2cebad0` (advisories no bloqueantes; no reabren el candidato): (a) **R3-001 (WARNING)**: la decisión del skip 113b no la ejerce ningún test — los unit nuevos cubren el helper puro y el clamp del indicador, y los e2e cubren el avance ordinario y la sesión vacía; falta un test de componente que re-renderice `SessionCarousel` con un grupo eliminado y asierte que ese pase no avanza/desplaza; (b) **R3-002 (SUGGESTION)**: `structuralChange` es pass-wide — una completitud commiteada junto con un borrado (mismo commit de store) se consume sin avanzar y no se puede replicar; acotar el skip a los grupos cuya key cambió o re-evaluar con el set de keys estable; (c) **R3-003 (SUGGESTION)**: la rama vacía del offset del `UndoToast` no está probada — extender el escenario D asertando el bounding box del toast (lejos de la TabBar, dentro del viewport).
 - [ ] **source-audit-gate (advisory del lote 9)** — de `review-39fbd3f892a45e3e` (SUGGESTION no bloqueante): el test de auditoría por fuente del gate `!busy` (`resetConfirmSheetGate.test.tsx`) es sensible a refactors (no vincula la guarda al callback real: si `requestClose` llamara a `onClose()` sin condición y la guarda sobreviviera en otro handler, igual pasaría; y refactors inocuos como re-envolver `onClick` lo harían fallar). Evaluar migrar a un test con DOM real (jsdom/testing-library) o acotar los regex; mientras tanto, el e2e de reset sigue siendo la certificación funcional.
 - [ ] **119.followups-3 (residuales del review del fix)** — de `review-494e6e1a10b973fb` (advisories no bloqueantes; no reabren el candidato): (a) **R3-001 (WARNING)**: el retry del click de Guardar atrapa cualquier excepción del primer intento y re-clickea sin verificar si el primer click ya navegó — un click despachado con timeout (o un doble submit) podría clickear en la página nueva o enmascarar un fallo intermitente; acotar el catch al caso interceptado (p. ej. chequear la URL antes de reintentar); (b) **R3-002 (WARNING)**: los timeouts fijos nuevos (2500 ms tip, 5000 ms Guardar) reemplazan el default de 30 s de Playwright — en CI lento un tip/guardar que tarda más falla aunque antes esperaba; evaluar tiempos más laxos o esperas por condición; (c) **R3-003 (SUGGESTION)**: el diagnóstico del seed solo captura excepciones — si `SEED_JS` devuelve no-True sin lanzar, `last_error` queda `None`, y una excepción vieja puede reportarse como la última aunque el intento final haya sido un retorno fallido; registrar también el último resultado no-True.
 - [ ] **long-press-links.followups-2 (residuales del review del fix)** — de `review-c6cd1b9543d6f449` (advisories no bloqueantes; no reabren el candidato): (a) **R3-001 (WARNING)**: los tipos `EMAIL_TYPE`/`PHONE_TYPE`/`GEO_TYPE` de Android clasifican email/teléfono/dirección como contenido, no exclusivamente anclas — consumir el long-press en esos tipos podría suprimir la selección de texto que «parezca» mail/tel/dirección sin ser link; validar en emulador un párrafo con texto tipo email sin `<a>` y, si aplica, acotar el consumo; (b) **R3-002 (WARNING)**: `pen` se trata igual que `touch` — el botón secundario del lápiz (contextmenu) sobre un link queda suprimido también en dispositivos de puntero fino; evaluar distinguir el botón del evento para el lápiz.
 - [ ] **81.followups-2 (residuales del review del fix)** — de `review-61618f1d18a201d6` (advisories no bloqueantes; no reabren el candidato): (a) **R3-001 (WARNING)**: el camino exitoso de `handleImportCSV` no limpia `importMessage` — tras un fallo, un parseo exitoso posterior deja el mensaje de error viejo visible; limpiarlo al inicio o en el éxito; (b) **R3-002 (SUGGESTION)**: el test del repo cubre solo la tabla con filas (`lastRow {id:5}`) — falta el borde de tabla vacía (primer insert → id 1).
 - [ ] **84.unificacion-nota.followups (review candidato 1, advisories)** — de `review-a7f9a2a9cd24ce62` (medium, reliability; **approved + acknowledged**; no reabren el candidato): (a) **R3-1 (WARNING)**: `SessionJournalSheet.handleSave` hace dos escrituras secuenciales sin try/catch — si la segunda falla, los ratings ya quedaron persistidos y el sheet queda colgado en «guardando» sin error visible; (b) **R3-2 (SUGGESTION)**: sin tests del hook `useWorkoutNote` ni del par de guardado del sheet (la unificación se prueba solo en dominio, migración e import); (c) **R3-3 (SUGGESTION)**: la migración guarda el tipo de `journal.note` pero no el de `workout.notes` (`??` solo cubre null/undefined; un valor no-string haría fallar el upgrade/import).
 - [ ] **84.unificacion-nota.followups-2 (review candidato 2, advisories)** — de `review-fb37feb210abd356` (medium, reliability; **approved + acknowledged**): (a) **R3-001 (WARNING)**: `WorkoutNotePanel` sin estado de carga — editar antes de que `note` resuelva deja `draft` vacío y puede pisar la nota existente con cadena vacía; sin `key` por workoutId, cambiar de workout con el editor abierto deja un draft viejo; (b) **R3-002 (WARNING)**: `handleSave` sin catch (rechazo silencioso, sin UI de error); (c) **R3-003 (SUGGESTION)**: el e2e de edición inline usa `has_text="Guardar"` a nivel página — acotar el locator al panel.
- [ ] **84d.followups (batch de endurecimiento del review final de la fase)** — del review final de branch (2026-10-09; 0 críticos; «ready with fixes» con las obligaciones de cierre cumplidas): (a) **matcher permisivo del deep link** (`src/data/widgetDeepLinks.ts`: `includes('pasos')` acepta URLs ajenas; `WIDGET_PASSOS_URL` sin usar en parser/tests; negativos débiles) → `host === 'pasos'` + negativos; (b) **guards de no-finitos** (`src/data/widgetBridge.ts`: NaN/Infinity pasan; goal (0, 0.5) redondea a 0) + tests; (c) **`.catch` faltantes** (`useWidgetSyncHost` fresh read + cleanups de listener en ambos hooks); (d) **gate a debug del broadcast `REFRESH_WIDGETS`** (receivers exportados; efecto acotado a redibujar); (e) **de-duplicar ARGB** de `WidgetRender` contra `colors.xml` (+ `widget_success` sin uso) y clamp de pasos negativos; (f) **test que pinne el nombre `'GymLabWidget'`** en el mock de `registerPlugin`; (g) opcional: debounce líder vs cola si algún día se exige <1 s real.
- [ ] **84d.nota-ambiente** — el emulador API 37 (16 KB pages) crashea el proceso con SIGILL en WebView `onTrimMemory` (3×, mismo fault address; también sin interacción con el widget): pre-existente y sin relación con el feature; no perseguir salvo reproducción en device real.

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
| `💪` Flexed Biceps | `src/i18n/locales/es/features.ts` L77 — `footer: 'Entrena con GymLab 💪'` | Sí — footer de la app | Sustituir por imagen/marca IA o eliminar (marca limpia) |
| `💪` Flexed Biceps | `src/i18n/locales/en/features.ts` L77 — `footer: 'Train with GymLab 💪'` | Sí — footer (EN) | Ídem |
| `✓` Check mark | `src/components/workout/WorkoutExerciseBlock.tsx` L80 | Sí — marca de serie completada | Sustituir por icono lucide (`Check`) o image asset; **decisión pendiente en brainstorm de implementación** |
| `↔` Left Right Arrow | `src/i18n/locales/es/core.ts` L185, L216; `en/core.ts` L185, L216 | Sí — título del conversor (texto, no icono) | **Mantener** — es símbolo tipográfico de texto (flecha), no emoji; no renderiza como glifo emoji |
| `↔` (comentarios) | `src/domain/calculators/converter.ts` L1, `src/lib/duration.ts` L1, `src/pages/ConversorPage.tsx` L1 | No — comentarios | No tocar |

**Re-verificación 2026-10-08:** los 3 puntos renderizables siguen presentes (líneas actualizadas en la tabla); no se agregaron emojis nuevos en `src/`.

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

### Fase 91 — Rendimiento y fluidez (auditoría 2026-09-11) — cerrada ✅ · archivada en `COMPLETED.md` (2026-10-10)

> El bloque completo (91.1–91.6 + handoff, convenciones, decisiones y baseline) pasó al archivo. Queda acá su único pendiente:

- [ ] **Follow-up — acotar queries de sets** (últimos N meses) o agregación DB cuando crezcan los datos — `EstadisticasPage.tsx:35-46` (era 91.4.3; se cruza con el hallazgo 7 de F103).

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
