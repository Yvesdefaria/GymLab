# AGENTS.md — GymLab App

Instrucciones para agentes de IA que trabajen en este repositorio.

## Proyecto

- **Nombre:** GymLab App
- **Ruta app:** `gymlab-app/` (este directorio)
- **Plan maestro:** leer y actualizar `PLAN.md` al completar fases (marcar checkboxes).
- **Distribución:** Esta app se publicará en **Google Play Store** y **Apple App Store** via Capacitor. Todo el diseño, rendimiento y UX debe pensarse para producción en tiendas de apps.

## Stack (no cambiar sin acuerdo explícito)

| Capa | Tecnología |
|------|------------|
| Build | Vite + React 18 + TypeScript |
| Estilos | Tailwind CSS v4 + CSS variables tema GymLab |
| Rutas | react-router-dom |
| Persistencia | Dexie (IndexedDB), local-first |
| Estado UI sesión | Zustand |
| Gráficos | Recharts |
| Iconos | lucide-react (nunca emoji como icono) |
| PWA | vite-plugin-pwa |
| App nativa (después) | Capacitor → Android |

**No** introducir Next.js, Expo, Redux, ni backend en el MVP salvo petición explícita.

## Arquitectura obligatoria

```
UI (pages/components) → hooks → repositories (interface) → Dexie impl
                      ↘ domain/ (cálculos puros)
```

1. **domain/** — TypeScript puro. Sin React, sin Dexie, sin imports de UI. Aquí van volumen, PRs, rachas y **calculadoras** (`domain/calculators/`).
2. **data/repositories/** — Interfaces + implementación Dexie. La UI no importa `db` directamente.
3. **store/** — Solo estado efímero (sesión de entrenamiento activa).
4. Al añadir Supabase en el futuro: nueva impl del mismo interface; la UI no cambia.

### Naming

- Preferir nombres de dominio: `WorkoutRepository`, `calculateImc`, `activeWorkoutStore`.
- Evitar cajones genéricos `utils.ts` / `helpers.ts` con funciones no relacionadas.
- Archivos y carpetas en camelCase o kebab según convención del scaffold; componentes React en PascalCase.

## Diseño y UX

- **Mobile-first**, UI tipo app (tab bar inferior).
- Tema oscuro GymLab: `#121214`, `#242422`, acentos `#D9B384` / `#FDDDB4`, CTA `#D9B384`.
- Touch targets ≥ 44×44px; gap ≥ 8px; `touch-action: manipulation`.
- Respetar `prefers-reduced-motion`.
- **Scroll sin barra de scroll**: ningún scrollbar visible en ninguna página (ocultar con `scrollbar-width: none`, `-ms-overflow-style: none` y `::-webkit-scrollbar { display: none }`).
- **Scroll por arrastre**: todo lo que haga scroll (listas, carruseles, contenedores) debe poder desplazarse arrastrando con el dedo/ratón (modo «drag-scrolling» en `body`, ya implementado en `src/index.css`).
- Skills: `frontend-design`, `ui-ux-pro-max`, `site-architecture`, `accessibility`.

## Calculadoras

- Lógica en `src/domain/calculators/` (p.ej. `imc.ts`, `tdee.ts`).
- UI en `src/components/calculators/` + rutas bajo `/calculadoras`.
- Siempre mostrar disclaimer: informativo, no consejo médico.
- Nuevas calculadoras = domain + componente + entrada en hub; no acoplar al resto del app.

## Comandos

```bash
npm run dev          # desarrollo
npm run build        # producción
npm run preview      # preview build
npx tsc --noEmit     # typecheck
```

### Playwright

- **Tests e2e (canal oficial del repo)**: se ejecutan con la **biblioteca de Python** de Playwright (`pip install playwright`, ya instalada, v1.62.0). Patrón: `python tests/e2e/scripts/with_server.py tests/e2e/test_<fase>.py` (arranca el dev server de Vite, corre el test y lo apaga). Los navegadores se instalan con `python -m playwright install`.
- **CLI de Node `@playwright/cli`** (binario `playwright-cli`, instalado globalmente v0.1.18) está disponible si se necesita, pero **NO** es parte del workflow de tests; no usarlo para correr `tests/e2e/*.py` (esos requieren la librería Python). Su versión de `playwright-core` (alpha) puede diferir de la de Python.

Tras cambios de UI/lógica relevantes: typecheck + build. No commitear secretos.

## Convenciones de código

- Early returns; funciones cortas; componentes < ~80 líneas cuando sea posible; archivos < ~200 líneas.
- Arrow functions preferidas.
- Sin comentarios innecesarios, pero **comentar brevemente el código generado**: un comentario corto (línea o bloque pequeño) explicando el «por qué» en lógica no obvia, fórmulas, negocios complejos o decisiones con contexto. Evitar comentarios que solo repitan el código.
- Español en copy de UI; inglés OK en código/identificadores si ya está en inglés el scaffold.
- Textos de UI en español (es-ES).

## Rutas principales

| Ruta | Página |
|------|--------|
| `/` | Entrenar |
| `/entrenamiento/:id` | Sesión activa |
| `/rutinas`, `/rutinas/:slug` | Catálogo / detalle |
| `/papers`, `/papers/:slug` | Papers |
| `/perfil` | Perfil |
| `/calculadoras`, `/calculadoras/imc`, `/calculadoras/calorias` | Calculadoras |
| `/ejercicios/:slug` | Ficha ejercicio |
| `/mas` | Hub Más (perfil, calculadoras…) si se usa tab “Más” |

## Qué no hacer

- No meter auth/backend en MVP sin pedirlo.
- No mezclar lógica de negocio en componentes de presentación.
- No usar emojis como iconos de UI.
- No inventar DOIs/papers falsos: fuentes reales o placeholders claramente marcados.
- No crear PLAN.md duplicados; actualizar el existente.

## Verificación obligatoria antes de commitear

Antes de commitear cualquier tarea, ejecutar verificación completa:
1. **`npx tsc --noEmit`** — sin errores de tipo.
2. **`npm run build`** — build limpio.
3. **Perspectivas de test**: analizar el código desde múltiples ángulos:
   - ¿Qué pasa si no hay datos? (estados vacíos)
   - ¿Qué pasa si hay datos parciales?
   - ¿Qué pasa con fechas límite?
   - ¿Los textos i18n están en ambos idiomas?
   - ¿Las animaciones respetan `prefers-reduced-motion`?
4. Si es necesario usar una skill o MCP para validación, hacerlo.
5. **Commit sin push** — el usuario revisa y hace push manualmente.
6. **Prueba en el EMULADOR — OBLIGATORIA para cambios nativos o de rutas.** El e2e en dev server **NO prueba la app nativa**. Caso real: un `base: './'` en `vite.config.ts` dejó **17 rutas en PANTALLA NEGRA** en el emulador mientras toda la suite daba verde — porque las pruebas usaban rutas de **un solo segmento**, que son justo las que no rompen.
   - Tocás algo nativo (manifest, `strings.xml`, plugins de Capacitor, permisos, notificaciones) → **probarlo en el emulador**.
   - Tocás `vite.config.ts`, el router o las rutas → **probar en el emulador incluyendo SIEMPRE al menos una ruta MULTI-SEGMENTO** (`/entrenamiento/active`, `/calculadoras/imc`, `/rutinas/nueva`). Son las que rompen.
   - Receta (el orden importa):
     ```powershell
     # 1) copiar el build a android/ — DESDE gymlab-app, NO desde android/
     npm run android:sync
     # 2) compilar el APK (gradle necesita JAVA_HOME al JBR de Android Studio;
     #    el `java` del PATH suele ser JDK 23 y NO sirve para el toolchain de Gradle)
     $env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
     .\android\gradlew.bat -p .\android assembleDebug
     # 3) instalar y arrancar
     adb install -r android\app\build\outputs\apk\debug\app-debug.apk
     adb shell am force-stop com.gymlab.app
     adb shell am start -n com.gymlab.app/.MainActivity
     # 4) inspeccionar el WebView por CDP desde un script de Playwright
     adb forward tcp:9222 localabstract:webview_devtools_remote_<(adb shell pidof com.gymlab.app)
     ```
     Con CDP (`playwright.chromium.connect_over_cdp("http://localhost:9222")`) se navega y se lee el DOM real.
   - **Criterio de aceptación**: `document.getElementById('root').children.length > 0`, body con texto, y **0 `pageerror`**. Si `root children === 0` es pantalla negra: la app no montó, aunque el e2e web diga verde.
   - `npm run android:sync` **solo copia los assets** — no recompila ni reinstala. Para probar en un teléfono físico hace falta `npm run android:open` → Run ▶.

## Skills del repo

### Skills de diseño/UX (`.opencode/skills/`)
Usar según tarea de UI/UX:
- **`frontend-design`** — crear componentes, páginas, interfaces web de producción.
- **`ui-ux-pro-max`** — diseñar UI con paletas, tipografía, animaciones, stacks específicos.
- **`site-architecture`** — planificar estructura de sitio, navegación, hierarchy.
- **`accessibility`** — auditoría WCAG 2.2, screen reader, keyboard nav.
- **`seo`** — optimización meta tags, structured data, sitemap.
- **`webapp-testing`** — testing con Playwright, screenshots, browser logs.

### Skills de workflow (`.agents/skills/` — superpowers)

**OBLIGATORIO** usar estas skills en los casos indicados:

| Skill | Cuándo usarla |
|-------|---------------|
| **`brainstorming`** | **SIEMPRE** antes de implementar cualquier feature nueva, componente, funcionalidad o cambio de comportamiento. Flujo: explorar → clarificar → proponer enfoques → diseño → aprobación → spec → commit. No escribir código sin aprobación. |
| **`writing-plans`** | Cuando se necesita un plan de implementación detallado para una tarea multi-paso o feature compleja. |
| **`executing-plans`** | **SIEMPRE** Cuando se tiene un plan escrito (de PLAN.md o de writing-plans) y se va a ejecutar en una sesión con review checkpoints. |
| **`test-driven-development`** | **SIEMPRE** antes de escribir implementación de una feature o bugfix. Escribir tests primero, luego implementar. |
| **`systematic-debugging`** | Cuando se encuentra un bug, test failure o comportamiento inesperado. Diagnosticar antes de proponer fixes. |
| **`verification-before-completion`** | **SIEMPRE** antes de claim que el trabajo está completo, fixed o passing. Verificar con comandos reales antes de asserts. |
| **`requesting-code-review`** | **SIEMPRE** Al completar features, implementar cambios mayores, o antes de merge. Verificar que cumple requisitos. |
| **`receiving-code-review`** | **SIEMPRE** Al recibir feedback de code review. Verificar técnicamente antes de implementar sugerencias. |
| **`finishing-a-development-branch`** | Cuando la implementación está completa, tests pasan, y se necesita decidir cómo integrar el trabajo. |
| **`subagent-driven-development`** | Para ejecutar tareas independientes en paralelo usando subagentes. |
| **`dispatching-parallel-agents`** | Cuando hay 2+ tareas independientes que pueden ejecutarse sin dependencias compartidas. |
| **`using-git-worktrees`** | Cuando se necesita aislamiento de workspace para feature work o antes de ejecutar planes. |
| **`writing-skills`** | Al crear o editar skills nuevas para el repo. |
| **`using-workflow`** | Al crear algo nuevo o iniciar una tarea/feature/componente/modulo/app: orquesta todo el proceso (diseño → plan → TDD → ejecución → review → finish) seleccionando automáticamente la skill de cada momento y las situacionales que hagan falta. |
| **`using-superpowers`** | Al iniciar sesión — establece cómo encontrar y usar skills. Requerido antes de cualquier respuesta. |

### Regla de uso obligatorio

1. **`brainstorming`** → antes de CUALQUIER implementación nueva.
2. **`using-workflow`** → al crear algo nuevo o iniciar cualquier tarea/feature (orquesta el flujo completo; si aplica, sustituye como punto de partida).
3. **`test-driven-development`** → antes de escribir código de features/bugfixes.
4. **`verification-before-completion`** → antes de claim "hecho/completo".
5. **`systematic-debugging`** → antes de fixear bugs sin diagnosticar.
6. **`using-superpowers`** → al inicio de cada sesión.

## Planear antes de implementar (obligatorio)

Usar la skill **`brainstorming`** (ver tabla de skills arriba). Flujo: explorar contexto → preguntar clarificaciones una a una → proponer 2-3 enfoques → presentar diseño → **aprobación del usuario** → escribir spec en `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md` → commit → transición a plan de implementación. No escribir código hasta que el diseño esté aprobado.

## Commits (obligatorio)

- **Un commit por tarea/modificación completada.** No acumular cambios sin commitear.
- **Un commit por cada bloque o tarea**, con un **título descriptivo breve** que resuma qué hace el cambio y su motivo (p. ej. `feat: tab de estadísticas con gráficos de rendimiento`, `fix: resttimer no terminaba el descanso solo`). Evitar títulos genéricos (`update`, `cambios`, `wip`).
- **Cambios de la misma tarea** → un único commit (aunque toquen varios archivos).
- **Cambios de tareas distintas** → commits separados, nunca mezclarlos.
- Mensajes siguiendo el estilo del repo: prefijo convencional (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`) + descripción breve y concreta.
- Al terminar una tarea: revisar `git status`/`git diff`, stagear **solo** lo de esa tarea y commitear antes de pasar a la siguiente.
- No commitear secretos ni artefactos de build (`dist/`, `.env*`).
- Si un commit falla o un hook lo rechaza: corregir y hacer un commit nuevo; no hacer `amend`/force-push sin pedirlo.

## Changelog (obligatorio)

- Mantener **`CHANGELOG.md`** al día (formato Keep a Changelog).
- Tras **cada cambio relevante** (feature, fix, refactor visible, dependencia, fase del plan):
  1. Añadir entradas bajo `[Unreleased]` en la sección correcta: `Added` / `Changed` / `Fixed` / `Removed`.
  2. Ser concreto (qué archivo/área y para qué), en español o inglés consistente con el archivo.
- No dejar el changelog desactualizado al cerrar una tarea o fase.
- Al preparar un release: mover `[Unreleased]` a `## [x.y.z] - YYYY-MM-DD` y dejar `[Unreleased]` vacío.
- El changelog es la fuente de verdad de “qué se ha hecho”; el usuario y otros agentes lo leen primero.

## Al terminar una fase

1. Marcar checkboxes en `PLAN.md`.
2. **Actualizar `CHANGELOG.md`** con lo entregado en esa fase.
3. Dejar el proyecto compilando (`npm run build`).
4. Resumir al usuario qué quedó hecho y el siguiente paso del plan.

## Memoria de proyecto (Engram)

Engram (MCP) persiste el contexto del proyecto entre sesiones. **Uso obligatorio** en este repo:

1. **Inicio de sesión / tras compactación**: consultar `engram_briefing` (o `engram_recall`/`engram_surface` si hace falta) para recuperar hitos activos, pendientes y convenciones antes de trabajar.
2. **Al cerrar cada tarea o fase (landmark)**: `engram_remember` con tipo `episodic`/`semantic` — qué se entregó, commits (hash + mensaje), verificación (tsc/build/lint/tests/smoke) y próximos pasos.
3. **Al aprender cómo se trabaja en el proyecto** (convenciones de flujo, patrones, correcciones del usuario): `engram_remember` tipo `procedural` (p. ej. "commit sin push", "revisión de código vía subagente `general`", "smoke Playwright con `Start-Job`", "stage de archivos exactos, no el árbol sucio").
4. **Final de sesión**: `engram_checkpoint` con resumen del estado actual, decisiones y compromisos pendientes.
5. **Higiene**: borrar memorias de prueba/obsoletas con `engram_forget` cuando proceda; no duplicar hitos ya persistidos.

Regla práctica: si un dato serviría para la *próxima* sesión (estado, hitos, convenciones), persistirlo en el momento, no al final.

## Gentle AI (obligatorio)

Esta máquina tiene **Gentle AI** (`gentle-ai`, v2.6.0) y **el switch de review está ENCENDIDO por scope global**. Eso convierte el review en parte del flujo de trabajo, no en un extra opcional.

### Review por candidato (receipt-driven development)

- **El switch es del usuario, no del agente.** Se lee —nunca se muta— con `gentle-ai review mode status`. **No prenderlo ni apagarlo sin pedido explícito.** `disable` es una decisión deliberada del usuario, no una salida para el agente cuando el review incomoda.
- **Cada cambio de código es un candidato**, y **el candidato es el diff del WORKSPACE, no el commit**. Consecuencia operativa que importa: **hay que correr el ciclo ANTES de commitear.** Si commiteás primero, el review ya no tiene nada que mirar (devuelve `paths: []`) y el cambio quedó sin revisar.
- Orden correcto de cada tarea: **implementar → normalizar → verificar (tests/build) → ciclo de review → commit.**
- Entrada del ciclo (read-only):
  ```powershell
  gentle-ai review status --cwd . --contract gentle-ai.review-integration/v2 --agent opencode --next-transition
  ```
- Se rutea **solo** desde el `next_transition` que devuelve. **Nunca** inferir un comando desde la prosa ni desde el transcript.
- El review es **informativo**: **no autoriza** push, PR ni release. La entrega la sigue decidiendo la convención del repo (commit sin push, el usuario pushea a mano).
- Excepción: un edit de documentación **puramente pasivo** se saltea (un readback estructural alcanza). Todo lo que toque código pasa por el ciclo.

### SDD

- Si se trabaja con SDD, usar el **dispatcher nativo** y rutear por su salida, nunca por inferencia:
  ```powershell
  gentle-ai sdd-status [change] --cwd . --json --instructions
  gentle-ai sdd-continue [change] --cwd .
  ```
- **No determinar el artifact store a mano**: lo resuelve el dispatcher y lo reporta en `artifactStore`. Un actor que lo re-deriva termina leyendo un store que el workspace nunca declaró.
- Si `blockedReasons` no está vacío: **no avanzar** a apply, archive ni trabajo terminal.
- `gentle-ai sdd-attempt acquire|settle` es la **única autoridad** de intentos y presupuesto de una unidad de trabajo. No persistir contadores propios en archivos, topics ni prompts.
- Los agentes `sdd-*` se usan **solo** en una ruta SDD elegida. No son el camino para un cambio chico.

### Delegación

- Lectura y mapeo → agente **`explore`**. Escritura y comandos → agente **`general`**.
- **Un solo escritor.** No correr escritores en paralelo sin worktrees aislados y aprobación explícita del usuario.
- **Lo que SÍ se paraleliza bien**: análisis read-only sobre archivos que no se solapan (varios `explore` en paralelo). Fue el caso del análisis de `banco` sobre los 11 archivos de `exercisesExtra/`.
- Los subagentes arrancan **sin contexto**: pasarles el alcance exacto, las rutas de las skills que deben leer, y qué tienen que devolver. No asumir que heredan esta conversación ni acceso a MCP.
- **No leer imágenes en lote**: el provider corta en **30 imágenes por request** (`Too many images in request`). Para analizar ejercicios alcanza el texto de `instructions`.

### Skills

- El registro se refresca con `gentle-ai skill-registry refresh` (cache-hit fast path) sobre `.atl/skill-registry.md`.

## Aislamiento entre sesiones paralelas (OBLIGATORIO)

Este repo se trabaja con **varias sesiones en paralelo**. Comparten el mismo worktree, y eso ya rompió cosas **reales** — no es teórico.

### Qué se rompe sin aislamiento

1. **El índice es compartido.** Si una sesión stagea sus archivos y otra corre un `git commit` sin rutas, **se barre lo stageado ajeno dentro de su commit**. Caso real (2026-09-17): el WP0b de F66/F67 (12 archivos, 415 líneas) terminó dentro de `430bcb4`, un commit cuyo mensaje dice «docs: spec de F69». El contenido quedó bien; la historia quedó **mal etiquetada**.
2. **El HEAD es compartido.** Un commit ajeno mueve el `base_tree` bajo tus pies e invalida cualquier candidato de review ya congelado.
3. **El candidato del review es el diff del WORKSPACE.** Con archivos ajenos sin commitear, el review evalúa una mezcla que nunca existió como unidad → **falsos positivos**. Caso real: un reviewer marcó como grave que el catálogo v2 no normalizara `equipment`, cuando la migración ya estaba commiteada **fuera de su ventana de evidencia**.

### La regla

**Fase o tarea compleja** (varios archivos, cambio de contrato de datos, o trabajo que va a pasar por review) **→ worktree aislado desde el minuto cero.**

```powershell
git worktree add ..\gymlab-<fase> -b <fase>
# node_modules: junction al de la principal para no reinstalar (Windows)
cmd /c mklink /J "..\gymlab-<fase>\node_modules" "<ruta-abs>\gymlab-app\node_modules"
```

Cada sesión corre su dev server, su review y su commit contra su propio `--cwd`.

**Es desde el minuto cero, no después:** migrar una sesión ya sucia obliga a commitear o stashear primero, y con escritores activos el `stash` es otra carrera.

### Mientras no haya aislamiento (sesiones ya corriendo)

- **Nunca** `git add -A`, `git add .`, ni `git stash`.
- Stagear **solo rutas exactas y nombradas**.
- **Commitear inmediatamente** después de stagear, sin dejar nada en el índice: el índice compartido es una ventana de exposición.
- Verificar con `git diff --cached --name-only` antes de cada commit que no haya archivos ajenos.

### Contratos de datos: un solo candidato

Un cambio que altera la **forma de un dato** (p. ej. `equipment` de string a array) y la migración de sus **consumidores** van **en el mismo candidato de review**. Partirlos hace que el reviewer vea media verdad y produzca hallazgos falsos. Caso real: `c58478a` (tipo + consumidores) quedó fuera del candidato de `404c9f4` (publicación), y el reviewer infirió un riesgo de consumidores **ya resuelto**.
