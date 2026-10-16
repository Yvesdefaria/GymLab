# GymLab App — Plan de implementación

Stack: **Vite + React 18 + TypeScript + Tailwind + Dexie + Zustand + Recharts + PWA → Capacitor (Android)**

Prototipo HTML en `../GymLab/` = solo referencia de marca. No modificar.

Fuente de contenido offline: `../content/training-library/`.

> **Fases totalmente cerradas → `COMPLETED.md`** (no requieren revisión).
> **Este archivo contiene SOLO lo pendiente o por revisar.**

---

## Pendientes de release (validación física + firma)

> El snapshot «Estado verificado — 2026-10-04» se archivó en `COMPLETED.md` (2026-10-11): sus pendientes quedaron resueltos o con hogar propio; los únicos abiertos de su tabla final (F94 y F118) viven en sus secciones de este plan. Acá quedan los parkings de release:

### Solo validación física (no verificable en este entorno)
F73 · F84c (frescura real de Health Connect) · F84d (widgets en teléfono real) · F93 #15 (foto en móvil real) · F101 (teclado IME).

### Anotado para fase futura (pedido del usuario, 2026-10-09)

- [ ] **Firma release propia + APK compartible con actualización limpia** — decisión tomada: clave release **propia** (no la debug). Ejecutar cuando el usuario quiera: (1) crear keystore `android/gymlab-release.jks` (NUNCA commitear; `*.jks` ya está ignorado) + credenciales en `android/keystore.properties` (agregar al `android/.gitignore`; guardar COPIA DE SEGURIDAD del keystore — sin él no hay actualizaciones futuras); (2) cablear `signingConfigs.release` en `android/app/build.gradle` leyendo `keystore.properties` con fallback a debug si no existe (los builds de desarrollo siguen igual); (3) `assembleRelease` → APK firmado para compartir (reemplaza al `GymLab-F84d-debug.apk` del Escritorio); (4) **migración única** (~2 min, datos se conservan): en cada teléfono que tenga la versión actual (debug de esta máquina) → Ajustes → exportar backup (JSON, 28 tablas) → desinstalar → instalar la release → importar backup. De ahí en más: toda versión nueva se instala ENCIMA sin borrar nada (tu teléfono y los que compartas) y la firma queda apta para Play Store. Nota: la build release no es inspeccionable por CDP — el emulador sigue siendo el banco de pruebas con builds debug.

---

## Tareas de Fase 93 pendientes

#### [ ] #30 — Crear correo de la app
- [ ] **Requiere intervención del usuario**: crear la cuenta de correo de la app.
- [x] Añadir el correo como contacto en Ajustes / T&C (`/terminos`) / reporte de errores (#29) — cableado con el placeholder `gymlab@app.gymlab.dev` (`src/config/contact.ts`; usado en Términos, Privacidad y ReportBug). Reemplazar por la cuenta real al crearla.
- [ ] Verificación + CHANGELOG + commit.

#### [ ] #22 — Revisión futura: sesión rápida
- [ ] Validar con el usuario que la sesión rápida mantiene el valor/contexto esperado tras su uso real.

#### [ ] #8 — Guías: imágenes
- [ ] Ranura hero en `GuiaDetailPage`; requiere `imageUrl` opcional en `Guide` + assets.

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

## Fase 118 — Sugerencia de carga adaptativa alcanzable (gaps G1–G5) — IMPLEMENTADA ✅

> **Alcance acordado (brainstorming 2026-10-15)**: esta fase es la **capa 1** — hacer **alcanzable y correcta la señal que ya existe** con settings de fábrica. Las capas 2 (objetivo de sesión hacia el PR) y 3 (freno de ritmo/adaptación por tendones) se separaron en la **Fase 122**.

**Origen**: reporte del usuario (2026-09-29, emulador API 37): «no veo el peso sugerido adaptativo mientras entreno una rutina». Investigación + test en vivo (memorias Engram `187f3b23`, `cb591b8b`): **el motor funciona** — con historial real el botón «Sugerido» aparece (seed de 2 sesiones de Press de pecho 60/70 kg → «Sugerido: 67.5 kg», exacto a la cuenta del motor) y desaparece luego de completar la primera serie (gate `!hasWorkingSet`). El problema es la **alcanzabilidad en settings default** y varios gates, no el motor.

**Overlap:** F97 (motor `recommendLoad` + ajuste `showLoadSuggestion`), F98.2 (chip por bloque `useBlockSuggestions`/`SuggestionChip`), F63 (sugerencias originales con RPE/RIR). F113 (carrusel) ya cerró: cada bloque monta su chip — no queda dependencia pendiente con esa fase.

**Regla de diseño aprobada (brainstorming 2026-10-15)** — el motor debe funcionar **completo** con RPE/RIR desactivados (default de fábrica); con RPE/RIR cargados la sugerencia es más fina, pero **en ningún caso la app puede comportarse mal ni bloquear sugerencias por falta de esfuerzo**:
- **No bloquear lo que sí se puede saber**: sin RPE/RIR, el historial (pesos/reps) y el PR alcanzan para decir «podés subir» y cuánto → la señal de subir deja de pedir permiso al RPE; se dispara con el motor (objetivo > lo último levantado en la sesión, con series consistentes). RPE/RIR, cuando existen, solo modulan el tamaño del paso.
- **No afirmar lo que no se puede saber**: sin esfuerzo cargado no se inventa fatiga — los chips de descanso/bajar construidos sobre un RPE ficticio no se muestran con defaults. No es «funcionar mal»: es no afirmar de más.
- Queda **cerrada** la rama «exigir RPE y cambiar defaults»: los defaults **no se tocan**; el par inventado actual (`rpe ?? 7` con `rir ?? 2`, además incoherente entre sí) no puede ser fuente de permiso para decidir chips.
- Corregir la descripción del ajuste en Ajustes («según tu PR y RIR» hoy es engañoso: sin RPE/RIR el motor ya calcula con historial + PR).

**Gaps confirmados en código:**
- **G1 (el grave)**: con `showRpe=false` (**default**), la señal «increase» del chip nunca puede dispararse (`avgRpe ?? 7` > 6) → la sugerencia adaptativa por chip es inalcanzable para un usuario default.
- **G2**: si la recomendación == peso precargado (caso típico cuando la progresión topa con el PR) se oculta todo, incluido el aviso «Limitado por tu PR».
- **G3**: apagar «Sugerir carga» (`showLoadSuggestion`) no oculta el chip, solo el botón — semántica inconsistente.
- **G4**: las series de calentamiento completadas entran en `completedSetsForSuggestions` (rompen la igualdad first/last y ensucian avgRpe/RIR). Bugfix directo, sin decisión de producto.
- **G5 (bug reportado en uso real, 2026-10-15 — prensa de cuádriceps)**: el botón «Aplicar +X kg» del chip **suma el delta al peso de cada serie pendiente** (`activeWorkoutStore.ts:390`, `s.weightKg + amountKg`) en vez de aplicar el **objetivo absoluto del motor**: con series pendientes vacías (precarga apagada, ejercicio sin historial o series nuevas) escribe solo el delta — caso real: prensa a 200 kg, chip «+70» → dejó **70** en lugar de 270. Mismo agujero en «Baja −2,5 kg» (sobre 0 es no-op). Sin cobertura: ningún test referencia `applyWeightToRemaining`. Arreglo: la acción lleva el objetivo absoluto del motor (principio F97.2 — la sugerencia no calcula su propio peso) y rellena las pendientes con él; el mensaje del chip sigue mostrando el delta.
- Extras observados: la precarga de peso solo corre al **iniciar** la sesión (no se re-aplica al recargar) — decidir si es esperado; la visibilidad del botón usa `suggestion !== nextSet.weightKg` como único criterio.

**Decisiones ya aprobadas (brainstorming 2026-10-15):**
- **G2**: el aviso del récord se muestra **siempre** que el PR recorte el objetivo —aunque el peso sugerido coincida con el precargado y no haya nada que aplicar— y se reformula para informar en vez de sonar a veto (que estás en tu récord y superarlo es decisión tuya; copy final en la spec).
- **G3**: el toggle «Sugerir carga» gobierna **toda propuesta de peso** del motor (botón «Sugerido» y chips de subir/bajar con su acción); calentamiento, descanso y rendimiento quedan fuera y conservan su lógica. Actualizar también la descripción del ajuste.
- **Extra de precarga**: la precarga corre al **armar la sesión** (y al agregar un ejercicio nuevo, que es el armado de ese ejercicio); recargar en medio de una sesión **no toca nada** — los pesos quedan como los dejaste. El autocompletado solo ocurre cuando **el usuario lo pide** (botón «Sugerido» / chip). Regla dura: **nunca sobrescribir un valor que el usuario escribió**.

**Sin decisiones de producto abiertas**: 118.1 queda solo de redacción (el criterio de visibilidad del botón queda cubierto por G2).

- [x] **118.1 — Diseño (spec)**: redactar la spec con las decisiones aprobadas y congelar la UX de la señal alcanzable → spec `docs/superpowers/specs/2026-10-16-f118-sugerencia-carga-alcanzable-design.md` (`177dd85`), plan `8513c13`, grilling en dos rondas.
- [x] **118.2 — Implementación + tests (TDD)**: señal de subir por motor (G1), aviso PR desacoplado y reformulado (G2), semántica del toggle + copy del ajuste (G3), filtro de calentamientos (G4), acción del chip con objetivo absoluto (G5). Commits `8057051` (dominio + acción absoluta) y `062678f` (superficies + freno de deload); reviews RDD `review-f2fc0272d84fcd16` y `review-d3e23330a543b04c` approved + acknowledged.
- [x] **118.3 — Re-verificación en emulador** con settings de fábrica (RPE/RIR off): seed de historial → botón «Sugerido» antes de la primera serie, chip tras ella y aplicar sobre series vacías escribe el objetivo (no el delta) → **verificado en Pixel_10 por CDP** + e2e nuevo `test_f118_sugerencia_alcanzable.py` (160 archivos / 1600 tests; 0 `pageerror`); e2e endurecido en `b1d4161` (fechas relativas + escenario de deload discriminante; 2 follow-ups pre-existentes del e2e anotados en `odd/tasks/f118-sugerencia-carga-alcanzable.md`).

---

## Fase 122 — Progresión adaptativa v2: objetivo de sesión hacia el PR + freno de ritmo (capas 2 y 3) — PENDIENTE

**Origen**: brainstorming de F118 (2026-10-15). Al acotar F118 a la señal alcanzable quedó explícito que el motor actual solo **corrige el próximo paso** (base = promedio de top sets recientes, paso = % de progresión global, PR de techo): no **prescribe la sesión** ni protege contra subidas demasiado rápidas. Concepto del usuario (números solo ilustrativos): primera serie de trabajo moderada y desde ahí escalar hacia el PR anterior; subir más cuando hay margen según ejercicio/músculo; y **fase de adaptación** cuando la subida es rápida, porque los tendones no progresan al ritmo del músculo (riesgo de lesión).

**Overlap:** F118 (capa 1: la señal alcanzable), F97 (`recommendLoad`), F98.2 (`SuggestionChip`), precarga (`buildWorkoutSets` + ajustes), deload (`deload.ts`: hoy reacciona a fatiga/caída — es la otra mitad de la señal de ritmo). El catálogo ya tiene músculo/zona y las series ya guardan fecha/peso/reps: se calcula sin modelo de datos nuevo.

**Concepto (dos capas):**
- **Capa 2 — objetivo del día (prescribir)**: al abrir el ejercicio, en vez de copiar el último peso uniforme a todas las series, proponer el **techo del día relativo al PR** (escalones para acercarse cuando venís lejos; atacar el PR cuando venís cerca) y una **rampa de trabajo** opcional (series con pesos distintos — hoy la rampa solo existe como escalera de calentamiento, marcada y excluida del motor).
- **Capa 3 — ritmo y adaptación (frenar)**: medir la velocidad de progresión por ejercicio (agrupable por músculo) — subida más rápida de lo sostenible → **consolidar** la carga antes de habilitar el próximo paso; caída sostenida → deload (ya existe). Prescribir el camino al PR sin este freno es, literalmente, el riesgo de tendones del origen.

**Decisiones abiertas (necesita brainstorming → spec cuando se tome):** qué es «demasiado rápido» y en qué se mide (top set/e1RM por ejercicio, músculo, experiencia); si la rampa es por defecto u opt-in; cómo convive con la precarga (¿el objetivo del día reemplaza a la precarga?); si deload y adaptación son la misma máquina con dos señales o dos máquinas; y qué pasa con ejercicios sin historial suficiente.

- [ ] **122.1 — Diseño (brainstorming + spec)**.
- [ ] **122.2 — Implementación + tests**.
- [ ] **122.3 — Re-verificación en emulador**.

---

## Subtareas opcionales (P3) en fases cerradas

- [ ] **39.D (opc, P3)** — Split archivos >200 líneas: `AjustesPage` (489), `EntrenamientoPage` (449), `EntrenarPage` (415), `RutinaBuilderPage` (379).
- [ ] **46.U3 (opc, P3)** — Virtualizar listado de `RutinasPage` con `@tanstack/react-virtual`

## Mejoras identificadas (sin fase asignada)

- **Notificaciones — permiso bloqueado sin salida**: en Ajustes, con el permiso denegado («no volver a preguntar») sólo se muestra el aviso; falta un botón «Abrir ajustes del sistema» (requiere un plugin nativo de settings). Identificada en la verificación de F111 (2026-09-27); sin implementar.

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
