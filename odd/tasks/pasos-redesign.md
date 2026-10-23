# /pasos — rediseño Nocturno Minimal (dirección C)

**Objetivo:** rediseñar `/pasos` con la dirección C aprobada, agregar las cuatro gráficas, el calendario de actividad navegable hacia meses anteriores con datos, el mini calendario semanal con logros, el tiempo caminando y la meta editable; conservar el resto del contenido.

**Rama:** `feat/pasos-nocturno-minimal` (se crea antes del primer commit).
**Entrega:** `exception-ok` — convención del repo: commits locales sin push; el usuario decide PR/merge.
**Runner:** `npm test` (Vitest), `npm run build` (tsc -b + Vite), Playwright Python para e2e visual.

---

## Specs

### S1 — Dirección visual
`/pasos` usa la expresión **Nocturno Minimal** documentada en `gymlab-app/docs/design/NOCTURNO-MINIMAL.md`: un solo héroe circular, hairlines en vez de tarjetas, Oswald liviano para números, verde solo para objetivo cumplido, fondo oscuro y mucho aire.

### S2 — Héroe
El héroe muestra los pasos de hoy, la meta, el link para editarla y el tiempo caminando estimado. Un solo anillo en la pantalla.

### S3 — Meta editable
- Default **7.000** solo si no hay valor persistido; nunca se pisa una meta ya guardada.
- Edición en bottom sheet con input numérico entero.
- Rango válido: **1.000–50.000** pasos, sin decimales.
- Error visible con `role="alert"`; Guardar deshabilitado si el valor es inválido.
- Atajos: 5.000, 7.000, 10.000, 20.000.
- Al guardar se usa `stepRepo.setGoal` y la UI reacciona por `useLiveQuery`.

### S4 — Mini calendario semanal
- 7 días, lunes a domingo, de la semana actual.
- Objetivo cumplido: **círculo verde con estrella centrada**.
- Objetivo no cumplido: anillo dorado cargado hasta el porcentaje.
- Día futuro: círculo vacío, opacidad baja.
- Hoy: número del día en dorado.
- Sin navegación entre semanas en esta versión.

### S5 — Gráfica «Hoy por hora»
- Datos reales de salud (`bucket: 'hour'`) para hoy en Android/iOS.
- Eje 00–23 con marcas escasas (00, 06, 12, 18, 23).
- Sin datos por hora en web o sin permiso: estado vacío honesto, sin inventar horas.
- El alta manual guarda el total del día; no genera detalle horario.
- El gráfico no rompe la página si la consulta nativa falla.

### S6 — Gráfica semanal
Se conserva la gráfica de la semana actual (barras por día, línea de meta), reestilizada a Nocturno Minimal. Estado vacío si no hay pasos.

### S7 — Gráfica mensual
- Barras/área por día del mes seleccionado.
- Línea de meta diaria.
- Sigue al mes elegido en el calendario de actividad.
- Días futuros no se dibujan como cero.
- Estado vacío si el mes no tiene pasos.

### S8 — Gráfica anual
- 12 meses del año calendario actual (enero–diciembre).
- Barras por mes; el mes actual se destaca.
- Meses futuros vacíos.
- Total anual y etiquetas de mes localizadas.

### S9 — Calendario de actividad completo
- Reemplaza el heatmap mensual actual.
- Celdas circulares, intensidad dorada por % de meta, estrella verde si se cumplió.
- Día de hoy con anillo; detalle al tocar una celda.
- Navegación **solo hacia atrás**: en el mes vigente la flecha derecha está deshabilitada.
- Salta al mes anterior que tenga datos; los meses vacíos no se muestran.
- En un mes pasado, la flecha derecha vuelve al siguiente mes con datos, hasta el vigente.
- La flecha izquierda se deshabilita si no hay meses anteriores con datos.
- La gráfica mensual y el calendario comparten el mes seleccionado.
- No se modifica `/calendario` (calendario de entrenos).

### S10 — Fila de stats
Se conservan distancia, calorías y racha en una fila de 3 columnas con separadores hairline. Los pasos ya están en el héroe; no se duplican.

### S11 — Alta manual escondida
- Sin botón protagonista ni formulario visible.
- Entrada desde el menú `⋯` del header → action sheet.
- «Editar pasos de hoy» reemplaza el total del día (no suma), con validación entera 0–100.000.
- No crea detalle por hora.
- Se conserva `recordSteps` (distancia/calorías calculadas).

### S12 — Contenido que se queda
Health sync banner, reto diario, logros, racha, distancia, calorías y el resto del dashboard. Se reestilizan a Nocturno Minimal, no se eliminan.

### S13 — Default y compatibilidad
Cambiar `DEFAULT_STEPS_GOAL` a 7.000. `getGoal()` devuelve el default solo cuando no hay valor guardado; las metas persistidas se respetan. Actualizar el copy del reto diario para usar la meta real, no 10.000 fijo.

### S14 — i18n
Todas las cadenas nuevas en `es` y `en`; claves tipadas por `EsSchema`.

### S15 — Accesibilidad
`role="progressbar"` en el anillo, celdas del calendario como botones con `aria-label`, sheets con `role="dialog"`, `aria-modal`, Escape, foco inicial y devolución del foco, touch targets ≥ 44 px, `prefers-reduced-motion`.

### S16 — Web sin salud
Sin Health Connect/HealthKit, «Hoy por hora» muestra el estado vacío; el resto de gráficas funciona con el total diario de Dexie.

### S17 — Verificación
Tests unitarios de dominio y del bucketing horario, `npm test` verde, `npm run build` limpio, e2e visual de `/pasos` en navegador y smoke en emulador si el cambio nativo lo requiere.

### S18 — Documentación
Actualizar `CHANGELOG.md`, `PLAN.md` si corresponde, y dejar la estética en `docs/design/NOCTURNO-MINIMAL.md`. Registrar commits en este doc.

### S19 — Lo que no se toca
`/calendario` de entrenos, la lógica de logros (umbral fijo de 10k como constante de diseño), la fuente de datos de pasos diarios y el resto de pantallas.

---

## Tasks

| ID | Tarea | Specs | Ruta | Estado | Evidencia |
|---|---|---|---|---|---|
| T1 | Helpers puros de analítica de pasos + tests | S3, S4, S7, S8, S9, S11 | inline | hecho | `tests/unit/domain/stepAnalytics.test.ts` 26/26; RED observado antes de implementar |
| T2 | Bucketing horario del bridge de salud + tests | S5, S16 | inline | hecho | `tests/unit/data/healthBridge.test.ts` 15/15; `fetchStepsByHour` + `groupHourlySamples` |
| T3 | i18n, default 7.000 y copy del reto | S3, S13, S14 | inline | hecho | `DEFAULT_STEPS_GOAL = 7_000`; claves es/en; reto con `{{goal}}` |
| T4 | Primitivas UI: AppHeader actions/kicker, Button flat, StepSheet, ChartSection, EmptyState | S1, S15 | inline | hecho | `AppHeader`, `Button`, `StepSheet`, `StepChartSection`, `StepEmptyState`, `StepSyncStatus` |
| T5 | Componentes del dashboard: héroe, week strip, 3 gráficas nuevas, calendario, stats, logros, reto | S2, S4–S10, S12 | inline | hecho | `StepHero`, `StepWeekStrip`, `StepTodayChart`, `StepMonthChart`, `StepYearChart`, `StepActivityCalendar`, etc. |
| T6 | Reescritura de StepsPage + sheets de meta y alta manual | S2, S3, S11, S16 | inline | hecho | `StepsPage`, `StepGoalSheet`, `StepManualSheet`, `StepOptionsSheet`, `useTodayHourlySteps` |
| T7 | Verificación: test, build, e2e, changelog/PLAN | S17, S18 | inline | hecho | `npm test` 168 archivos / 1.696 tests; build limpio; e2e `test_f84b_pasos.py` ALL OK; CHANGELOG + `docs/design/NOCTURNO-MINIMAL.md` |
| T8 | Review RDD + commit work-unit | S17, S18 | inline | hecho | Commit `21056e6f`; `review assess` **medium / under_budget** (`review_due=false`), sin review obligatorio |

---

## Log

### L1 — Pedido original (verbatim)

> vamos a rediseñar /pasos, ya que esta muy simple, usando estas nuevas graficas:https://bklit.com/docs/skills
> vamos a rediseñarlo, debe contener un chart de la semana(ya esta), otro de hoy separado por hora, otro mensual separado por dias y por ultimo uno anual separado por mes, tambien en el calendario que ya esta en la app, debe haber la opcion de moverse entre los meses con datos, por ejemplo si tienes datos de los ultimos 3 mese se debe mostrar al darle a la flecha viajas a ese mes en concreto, otra cosa, se debe poder mover el objetivo de 10000 paso, validando la entrada, asi si un usuario quiere el objetivo de 20000 pasos puede hacerlo, por defecto estara configurado para 7000 pasos , por lo que el boton de agregar pasos desaparece ya que solo servia para pruebas, tambien debe aparecer un mini calendario como el de home pero en lugar de entrenos se marcara en un circulo en verde con una estrella cuando se logre el objetivo, mientras se completa se ira cargando un circulo hasta completarse, si no se completa se queda como esta, a medio cargar, añade un apartado mas de tiempo, el tiempo de actividad del dia, todo lo que no te he dicho que quites o modifiques se queda, aunque habra un rediseño de eso, mandame diferentes versiones de mockups para poder elegir, añade nuevas graficas con el linke que te di como animaciones si fuera necesario con anime.js, si necesitas preguntarme usa grill me

### L2 — Respuestas de la ronda 1

> q1b vamos a probar como queda, sino tocara ver como queda bklit,
> q2a quita el protagonismo del boton pero deja la opcion de agregar manualmente escondida o poco destacado,
> q3 solo quiero los minutos en los que estoy caminando como actividad, nada que ver con el entreno,
> q4 quiero todo, ya que son varias graficas en una pagina, quiero el calendario completo de activdad que ya esta solo que este solo me deja ver los datos del mes vigente pero en cuanto pase al siguiente mes no puedo ver los datos del mes anterios, no quiero que pueda ir adelante en el tiempo , solo se podra ver el mes vigente y los anteriores con datos, y tambien se debe ver un mini calendario semanal con los dias que muestre si se ha llegado al objetivo, en caso de que si sera con un circulo verde con una estrella en el medio, en caso de que no se vera como el circulo se quedo a media carga,
> q5 ya esta explicado en q4,

### L3 — Elección de dirección

> opcion c

### L4 — B como alternativa

> aunque tambien me gusta la B, asi que guarda el prompt en caso de que cambie de idea, aunque ahora vamos a hacer la C

### L5 — Estética reutilizable

> tambien quiero que guardes la estetica en un .md para poder extenderlo a mas partes de la pp, ya que me ha gustado bantante,ademas de opciones adicionales que sigan esa estetica para ayudarme a la hora de rediseñar otras partes de la app

### L6 — Confirmación de decisiones

> dale con esas

### L7 — Decisiones cerradas (síntesis del orquestador)

- Motor de gráficas: Bklit-look sobre Recharts + anime.js (sin sumar `motion`/`@visx`).
- Hoy por hora: datos nativos reales; web/sin permiso = estado vacío.
- Tiempo caminando: `pasos / 100`, estimado, sin entrenamientos.
- Calendario completo y mini semanal: ambos.
- Navegación del calendario: solo al mes vigente y anteriores con datos; sin futuro.
- Heatmap mensual reemplazado por el calendario de actividad completo.
- Meta sincronizada: el mes del calendario y la gráfica mensual comparten selección.
- Alta manual: reemplaza el total del día.
- Default 7.000 solo sin valor persistido.
- Año calendario enero–diciembre.
- Tira semanal: semana actual.
- Web sin salud: estado vacío con explicación.

---

## Assumptions / Notes

- El umbral de los logros de pasos sigue siendo 10.000 (constante de diseño existente); no se cambia con la meta editable.
- La consulta horaria no se persiste: se lee de salud para hoy. El histórico diario sigue en Dexie.
- Las gráficas usan Recharts + los wrappers animados existentes; no se agrega una segunda librería de charts.
- El `⋯` del header abre un action sheet; no hay botón de alta manual visible.
- Si el mes vigente no tiene datos, se muestra igual (con estado vacío) y la flecha izquierda salta al último mes con datos.

### L8 — Implementación y verificación (síntesis)

- Se implementó C con Recharts + wrappers animados existentes, sin sumar Bklit/Motion/Visx.
- El gráfico «Hoy por hora» consulta salud en nativo (`bucket: 'hour'`); en web muestra estado vacío y el alta manual solo reemplaza el total diario.
- La meta por defecto es 7.000 solo sin valor persistido; el reto diario y los sheets usan la meta real.
- El calendario de actividad reemplaza al heatmap; la gráfica mensual sigue el mes elegido.
- La verificación visual real detectó y corrigió tres detalles: agrupación de miles en 4 cifras (`formatStepNumber`), última etiqueta del eje mensual recortada (márgenes 8 px) y falta del tag «hoy» en la tira semanal.
- Evidencia: `npm test` **168 archivos / 1.696 tests**, `npm run build` limpio, e2e `test_f84b_pasos.py` **ALL OK** (anillo, tiempo caminando, 7 días, celdas del mes, navegación pasada/vuelta, meta 20.000, alta manual, persistencia de logro, overflow 320 px, 0 console errors).

### L9 — Cierre

- Commit work-unit: **`21056e6f`** (`feat: rediseñar /pasos con la dirección Nocturno Minimal`), 42 archivos, +3.288/−470.
- Follow-up de accesibilidad: **`ed745418`** (`fix: incluir la fecha en el aria-label de días sin pasos`), assess **medium / under_budget** (`review_due=false`).
- `gentle-ai review mode status`: RDD **on** (global).
- `gentle-ai review assess --base-ref HEAD~1 --committed-only`: **medium / under_budget**, `review_due=false`. No se abre review; no se inventa PASS.
- Sin push ni merge: quedan a decisión del usuario. La rama `feat/pasos-nocturno-minimal` queda checked out.
