# F122 — Progresión adaptativa v2: peso de trabajo hacia arriba + freno de tendones (capas 2 y 3) — diseño

> Fecha: 2026-10-16 · Estado: propuesto · Fuente: F122 de `PLAN.md` (origen: brainstorming de F118, 2026-10-15; aporte del usuario del 2026-10-16 sobre PR vs entrenamiento normal)
> Antecede: F118 (señal de carga alcanzable, cerrada: G1–G5) · F97 (`recommendLoad`) · F98.2 (chip por bloque) · precarga (`buildWorkoutSets`) · deload (`deload.ts`)
> Proceso: brainstorming + **grilling de 2 rondas** (2026-10-16; todas las recomendaciones aceptadas por el usuario). Frente del grilling: vacío.

## Contexto

### Qué hay hoy (verificado en código, no inferido)

1. **Motor F118** (`src/domain/loadRecommendation.ts`): base = promedio del top set de las últimas 5 sesiones → sesión viva → PR; paso = `loadProgressionPct` global (2,5 %); el PR es techo estricto (`capped`). Superficies: botón «Sugerido» (antes de la 1ª serie de trabajo) y chip en vivo por bloque (desde la 1ª serie). Todo gobernado por «Sugerir carga» (S7); con deload activo no se propone subir (S12); calentamientos fuera del motor (G4/S8) y de las acciones (S9).
2. **La base mezcla todo**: `recentTopSetAverage` promedia el peso máximo por sesión **sin mirar reps** — un test de 1RM (p. ej. 140×1) contamina la base de entrenamiento y produce saltos tipo 200→270.
3. **La acción escribe un solo número**: `applyWeightToRemaining(exerciseId, targetKg)` fija el MISMO objetivo en todas las pendientes de trabajo; una rampa con pesos distintos por serie no encaja — necesita contrato nuevo.
4. **Ya existe**: `estimate1RM` (Brzycki, `prs.ts`), curva de e1RM por ejercicio (`buildE1rmSeries`), `plateauDetector` (e1RM estancado 4+ semanas), redondeo a placa (`roundToNearestPlate`), `addWarmupSet` en el store.
5. **Calentamiento hoy**: escalera opt-in (50/70/90 % del peso de trabajo; `warmupSets: false` de fábrica), aviso contextual en sesión (arranque ≥70 % del e1RM → agrega un set al 45 %).

### El problema (concepto del usuario, textual)

- «yo puedo 1 rm a 140 kg en press banca pero normalmente entreno con 80 kg, no puedo ir a todas las sesiones al maximo, ya que tendria riesgo de lesion, por lo que la app debera verificar los pesos historicos para determinar los pesos, por ejemplo si yo entreno normalmente a 80kg puede ser que me sugiera empezar a entrenar a 90kg, eso tambien me ayudara a mejorar mi pr de 140 a 150kg».
- «los musculos obtienen mas fuerza mas rapido de lo que las articulaciones se pueden adaptar a esta nueva fuerza» (base: literatura; sin experiencia personal). El freno es **preventivo**, por tiempo de adaptación — no por sensación.

## Decisiones aprobadas

1. **Doble carril.** La prescripción vive del historial de **series de reps** (peso de trabajo; singles/tests de ≤3 reps fuera del carril de base y velocidad). El **PR/1RM queda como techo de seguridad**: nunca es el objetivo del día. Día de test de PR: futuro.
2. **Evidencia de margen = doble progresión.** Reps al mismo peso (±1 plato / 2,5 kg por defecto) con promedio **≥ +2 reps** vs las primeras sesiones a ese peso, sostenido en **2 sesiones comparables**. Sin peso repetido → fallback **e1RM al alza**. RPE (si está cargado): **≤6 confirma, ≥8 retiene**; sin datos de esfuerzo no bloquea (regla madre F118).
3. **Escalón.** Destino = **próximo peso ya entrenado** (sesión completa, no un set suelto) si está a **≤ ~10–15 %** del actual → paso directo; sin conocido → **+2,5 %** (una placa); conocidos lejanos → escalones sucesivos, nunca de un salto.
4. **Propuesta del día = escalada** (evolución del botón «Sugerido», mismo lugar). Primera serie moderada (= base), escalones hacia el techo, **mostrada completa por serie** (los pesos exactos que escribirá). Se aplica **con un toque** (pesos absolutos, solo pendientes de trabajo; undo existente); **nunca precarga**. Se oculta aplicada o igualada; gobernada por «Sugerir carga»; con deload activo no propone subir (S12).
5. **Sin evidencia = silencio.** El +2,5 % pasa a ser **tamaño de paso**, no empuje diario. El **chip en vivo deja de empujar subidas** por su cuenta (mantiene bajar, descanso, rendimiento y calentamiento).
6. **Freno de ritmo (capa 3).** Velocidad del peso de trabajo **por ejercicio** (~2,5 %/semana sostenido, ventana de 3 semanas) → **consolida**: repite el peso, no habilita el próximo escalón. **Mínimo 3 sesiones** en el peso nuevo aunque la evidencia esté. Desbloqueo: ventana normalizada + mínimo cumplido. **Nunca baja el peso** (bajar es deload).
7. **Avisos no intrusivos.** Consolidación = **línea inline discreta** en el bloque del ejercicio. Zona/músculo = aviso **informativo en la ficha del ejercicio** (bajo los gráficos); nunca desde la sesión. Nada bloquea, nada interrumpe.
8. **Deload y freno = dos señales de un mismo lugar de decisión.** Caída/fatiga → deload (existente, sin cambios); subida rápida → freno (retiene). Con deload activo se pausa el freno y se suprimen subidas; al terminar se reanuda.
9. **Calentamiento.** La escalera 50/70/90 queda **opt-in** (ya apagada de fábrica; herramienta de día de PR). **NUEVO botón en sesión** para agregar **una serie** a pedido (~45 % del peso de trabajo, redondeado, editable). La prescripción **no inyecta calentamientos**; fuera del motor y de las acciones (heredado).
10. **Bordes.** Sin historial → sin propuesta (silencio). **Layoff** (~3–4 semanas sin el ejercicio) → sin escalones hasta **2 sesiones frescas**; la base sale de la última sesión; la ventana del freno ignora datos pre-layoff.
11. **Reglas heredadas F118 (intactas).** El sistema funciona completo sin RPE/RIR; nunca sobrescribir lo que escribió el usuario; precarga solo al armar; acciones con pesos absolutos; defaults de fábrica intactos; calentamientos fuera de todos los cálculos y acciones (heredado G4/S8/S9).

## Contratos (nivel diseño — nombres y firmas exactos se fijan en el plan)

> Los valores exactos (umbrales, ventanas, tolerancias) se fijan en el plan de implementación y quedan clavados por tests.

### Dominio — evidencia y escalón (módulo puro nuevo, p. ej. `src/domain/workingProgression.ts`)

- «Mismo peso» = ±1 plato al redondeo vigente.
- **Base** = promedio de los tops de trabajo de las últimas ~5 sesiones del ejercicio (misma maquinaria que F118 con el filtro de carril: sin calentamientos y sin ≤3 reps). **Todo el estado (evidencia, velocidad, consolidación, techo vigente) se deriva del historial — sin estado persistido nuevo.**
- `hasMargin(sessions, exerciseId, opts)` → `boolean`: ≥2 sesiones comparables (series de reps al mismo peso ± plato) y promedio de reps ≥ +2 vs la referencia de ese peso; fallback e1RM (Brzycki existente) en alza; RPE en las series comparables: **≤6 adelanta** (habilita con 1 sesión sostenida), **≥8 retiene** aunque las reps hayan subido.
- `decideStep(...)` → `{ targetKg, kind: 'known' | 'micro' }`: «conocido» = peso con **≥2 series de trabajo completadas** (±1 plato) en alguna sesión y dentro de ~10–15 % del actual; si no hay, +2,5 %.
- `buildEscalada(baseKg, targetKg, setCount, plateKg)` → `number[]`: primera serie = base; distribución uniforme hasta el techo; redondeo a placa.

### Dominio — freno (`src/domain/workingVelocity.ts` o dentro del anterior)

- `workingVelocity(sets, exerciseId, windowDays)` → `%/semana`: top de trabajo por sesión (excluye ≤3 reps), ventana de 3 semanas, pendiente simple entre el primer y el último top de la ventana; ignora pre-layoff.
- `consolidationState(...)` → `'open' | 'consolidating'`: consolida si velocidad > umbral (~2,5 %/semana sostenido) o mínimo de sesiones no cumplido; desbloqueo al normalizar la ventana con el mínimo cumplido.

### Acción y store

- Contrato nuevo por serie (tentativo): `{ kind: 'applyEscalada'; weightsKg: number[] }` — el store fija las pendientes de trabajo **en orden** con esos pesos (redondeo 0,5 kg), sin tocar completadas ni calentamientos; **un solo undo** (verificar alcance del snapshot). `weightsKg` se mapea sobre las series pendientes de trabajo **al momento de aplicar** (la UI arma la lista sobre las pendientes actuales).
- Los consumidores actuales de `applyWeightToRemaining` (bajar) se preservan o migran sin romper (el plan lo fija).

### Superficies e integración

- `ExerciseBlock`: la propuesta del día reemplaza al botón «Sugerido» (visible mientras queden pendientes de trabajo y la escalada difiera; se recalcula al completar series sobre las pendientes restantes; se oculta aplicada o igualada); aviso de consolidación inline.
- `sessionSuggestions.ts` / `useBlockSuggestions`: el chip de subir (increase) se silencia; bajar/descanso/rendimiento/calentamiento intactos.
- `EjercicioDetailPage` (ficha): línea de aviso de zona.
- Botón de calentamiento por bloque en sesión (una serie, ~45 % editable) reusando `addWarmupSet`.
- i18n es/en: copy nuevo (propuesta/escalada, consolidación, zona, botón de calentamiento).
- **Sin ajustes nuevos** (gobierna «Sugerir carga» para las propuestas de peso).

## Paquetes de trabajo (borrador — el plan de implementación los fija)

- **WP1 — Dominio: evidencia + escalón** (`hasMargin`, `decideStep`, `buildEscalada`) con tests unitarios RED→GREEN.
- **WP2 — Dominio: freno** (`workingVelocity`, consolidación, layoff) con tests.
- **WP3 — Contrato por serie + store + integración**: acción `applyEscalada`, propuesta del día en `ExerciseBlock` (evolución del «Sugerido»), silencio del chip de subidas; tests de store y componente.
- **WP4 — Superficies**: botón de calentamiento a pedido, aviso de consolidación, aviso de zona en ficha, i18n es/en; tests de componente.
- **WP5 — Cierre (122.3)**: e2e nuevo + regresión (f63/f118) + emulador Pixel_10 + `CHANGELOG`/`PLAN`.

## Riesgos y límites conocidos

- **Evidencia estricta**: exige 2 sesiones comparables; usuarios erráticos caen a e1RM o silencio — deliberado (mejor silencio que inventar).
- **Cambio de semántica de la base** al excluir singles/≤3 reps: verificar con tests que el caso común (todo reps) no se degrada.
- **Contrato por-serie** toca dominio + store + UI en un mismo candidato (contrato de datos: una sola unidad de review).
- **Ventana/umbral del freno** con historial disperso: validar con tests; nunca bloquear por falta de datos.
- **El chip pierde el empuje de subida** — cambio visible; la propuesta del día es la válvula, pero solo con evidencia (consecuencia aceptada).
- **e2e**: seed determinista con fechas relativas, puerto propio, limpia `prs` entre escenarios (lecciones F118); `android:sync` reescribe gradle → no se commitea.

## Fuera de alcance

- **Escalada configurable** (ascendente/descendente/neutra) y **reps iguales/descendentes** por escalón — declarado futuro.
- **Día de test de PR** — futuro (donde la escalera de calentamiento brilla).
- Cambios al modelo de PR (salvo excluir singles del carril de prescripción).
- Notificaciones del sistema, telemetría nueva.
- Unificar deload con el freno; tocar cardio; reescribir la precarga.
