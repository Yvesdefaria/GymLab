# F134 — Estado persistente entre pantallas (memoria de navegación)

Objetivo: que salir de una pantalla y volver no borre búsqueda, filtros, pestaña, día seleccionado, scroll ni un borrador a medio armar.
Rama: `main` (sin worktree; no hay multisesión pedida).
Entrega: 4 work-unit commits en `main`, sin push (convención `AGENTS.md`); el usuario mergea/pushea a mano. Estrategia `ask-on-risk`: al cerrar 134.2 se reporta el conteo real de líneas y se pide decisión sobre slices.
Runner: `npm test` (Vitest) + `npm run build` (typecheck real) + `python tests/e2e/scripts/with_server.py <test> --port 5220` (Playwright Python) + emulador Android para lo nativo.
Resumen en `PLAN.md` → «Fase 134».

## Specs

- **S1 — Back de Android.** Con un overlay abierto (sheet, picker, modal), el back físico cierra **el overlay de arriba** y permanece en la misma pantalla; no navega ni sale de la app. Sin overlays, el back conserva el comportamiento actual (historial → salir). Un único `App.addListener('backButton')` en el shell; la confirmación de salida de la sesión activa se mantiene y sigue teniendo prioridad **después** de los overlays (LIFO).
- **S2 — Borrador de rutina.** El borrador de `/rutinas/nueva` y `/rutinas/:slug/editar` sobrevive a: cambiar de tab, abrir la ficha de un ejercicio desde el picker, el back físico y una recarga de la app. Se restaura con aviso «Retomamos tu borrador» y acción «Descartar». Un borrador de una rutina no se aplica a otra. Se borra al guardar y al descartar.
- **S3 — Planificador.** El wizard recuerda `level`, `objective`, `daysPerWeek` y `sessionDurationMin` entre visitas; vuelve al paso 1 y regenera el plan (el plan generado no se persiste).
- **S4 — Listas en la URL.** Búsqueda, filtros, pestaña, día, mes y vista sobreviven a entrar a un detalle y volver, **y** a recargar/deep link, porque viven en la URL. Valores inválidos caen al default sin romper. La escritura de estado usa `replace` (no crea una entrada de historial por carácter). `BackLink` vuelve al historial interno cuando existe y usa `to` como fallback.
- **S5 — Scroll.** Volver de un detalle restaura la posición de scroll de la lista (incluidos los contenedores internos del detalle de rutina). Sin listeners de `scroll` que disparen estado de React.
- **S6 — Performance.** Prohibido mantener páginas montadas ocultas. Ningún cambio agrega renders por tecla ni por frame respecto de hoy. Escrituras de borrador diferidas 400 ms con flush en `pagehide`/`visibilitychange`.
- **S7 — Verificación.** `npm run build` limpio, `npm test` verde, e2e 375 y 768 sin `pageerror`, y emulador para S1 (el e2e web no prueba el back nativo). Rutas multi-segmento incluidas en el smoke del emulador.
- **S8 — i18n y datos.** Toda cadena nueva en es/en con claves tipadas por `EsSchema`; claves nuevas de `localStorage` añadidas a `RESET_LOCAL_STORAGE_KEYS` (`src/data/factoryReset.ts:19-27`) y a los resets de stores de `performFactoryReset`.

## Tasks

| ID | Tarea | Spec | Ruta | Estado |
|---|---|---|---|---|
| T0 | Task doc ODD + espejo Engram + fase en `PLAN.md` | S8 | inline | [x] |
| T1 | Back de Android: pila de handlers + listener único + migrar sesión + overlays | S1, S7 | inline | [ ] |
| T2 | Borradores: storage debounced compartido + `routineDraftStore` + `plannerStore` + aviso + reset | S2, S3, S6, S8 | inline | [ ] |
| T3 | URL como fuente de verdad: `useUrlState` + `BackLink` + 11 pantallas | S4, S8 | inline | [ ] |
| T4 | Scroll: `scrollMemory` + `useScrollRestoration` + listas + `RoutineDayPanel` | S5, S6 | inline | [ ] |
| T5 | Cierre: build + suite + e2e + emulador + CHANGELOG + PLAN + Engram | S7, S8 | inline | [ ] |

## Evidencia del diagnóstico (2026-11-01)

Verificado leyendo el código, no inferido:

- Desmontaje por ruta: `src/app/router.tsx:63-118` (`<Routes>` sin keep-alive) + `src/components/layout/AppShell.tsx:78-105`.
- Estado de lista local: `EjerciciosPage.tsx:106-107`, `RutinasPage.tsx:41-47`, `RutinaDetailPage.tsx:36`, `EstadisticasPage.tsx:61-62`, `GuiasPage.tsx:22`, `PapersPage.tsx:21`, `CuerpoPage.tsx:21-22`, `StepsPage.tsx:49-50`, `AchievementsPage.tsx:38`, `SupplementsPage.tsx:40`, `CalculadorasPage.tsx:17`.
- Borradores: `useRoutineDraft.ts:1,16-24`, `PlanificadorPage.tsx:99-106`, `ObjetivosPage.tsx:43-44`, `FoodAdder.tsx:31-35`, `OnboardingWizard.tsx:82,175`, `ProfileUserCard.tsx:27`.
- Back atrás como `push`: `BackLink.tsx:21-25`; usos `EjercicioDetailPage.tsx:108,129`, `GuiaDetailPage.tsx:31,49`.
- Back nativo: `useActiveSession.ts:114-136` (único listener) montado solo en `EntrenamientoPage.tsx:94`.
- Scroll: `RoutineDayPanel.tsx:24-31`, `ExercisePicker.tsx:180`, `EjerciciosPage.tsx:274-281` (`useWindowVirtualizer`).
- Sesión que salta al primer grupo incompleto: `SessionCarousel.tsx:99,120-126`.
- Patrón correcto ya presente: `activeWorkoutStore.ts:18-88,219-220,556,593`; `goalStore.ts:13`; `equipmentStore.ts:18`; `usePhotoRestore.ts:17-42` (estado que sobrevive a la muerte del proceso).
- Antipatrón a no repetir: `docs/performance-audit-2026-10-05-features-nuevas.md:129-133` (listener de scroll que re-renderiza).

## Log

- **L1 (2026-11-01, pedido literal):** «quiero que verifiques por que pasa que cuando estoy en la app por ejemplo buscando un rutina entro y salgo , no se mantiene el estado, por ejemplo no vuelve a donde estaba, sino que se resetea y empiezo desde el comienzo, otro caso es cuando estoy creando una rutina y si le doy a otro apartado se borra todo lo que llevaba construyendo, otro caso seria tambien cuando busco un ejercicio y entro para ver, cuando salgo estoy al inicio de la pagina de busqueda, se resume que no guarda el estado donde estaba, dame opciones de como se podria solucionar sin que la optimizacion peligre».
- **L2 (2026-11-01, ampliación de alcance):** «antes de comenzar me gustaria que investigues se se dan mas casos como este en la app de "estado"(aunque internamente pueda ser por diferentes razones, visualmente parecen problemas de estado)».
- **L3 (2026-11-01, aprobación y arranque):** «si en ese orden, crea un fase para esto en plan.md detallado, dale empieza despues de anotarlo». Orden aprobado: back de Android → borradores → URL → scroll.
- **Decisión de arquitectura (L3):** se descarta `KeepAlive`/páginas ocultas montadas por costo de `useLiveQuery` + reputación de las tarjetas del catálogo. El estado se persiste o va a la URL.
- **Alcance diferido a follow-ups (L3):** onboarding parcial, restauración de ruta en arranque en frío, carrusel de sesión (decisión de producto), formularios sueltos (`ObjetivosPage`, `FoodAdder`, `ProfileUserCard`), picker del builder reabierto en el mismo punto.
