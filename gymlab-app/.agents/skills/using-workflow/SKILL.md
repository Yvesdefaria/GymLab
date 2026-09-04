---
name: using-workflow
description: Use when the human wants to create something new or start a new project — a task, feature, component, module or whole app — to route the whole process through the workflow automatically, choosing the required skill for each moment in order (design, plan, TDD, execute, review, finish) and selecting the situational skills as they become needed.
---

# Using Workflow — enrutamiento automático de todo el trabajo

## Core principle

Every request that **creates or changes something** runs through a deterministic
workflow. You classify the request once, and the transition rules pick the next
skill automatically. **Proceso primero, implementación después**: process skills
deliveran el enfoque, después las skills de implementación (diseño/UX, testing…)
lo ejecutan.

## The Rule

Invoke the applicable skill **BEFORE any response or action** (including
clarifying questions and exploring the codebase). When this workflow marks a
skill as **REQUIRED**, skipping it is not an option. When in doubt between two
skills, take the heavier one — the ratchet only upgrades, never downgrades.

---

## 1. El flujo completo (crear algo nuevo)

```
petición del usuario
  └─► using-superpowers          gate inicial: comprobar skills ANTES de responder/explorar
       └─► brainstorming          HARD-GATE: NO se escribe código sin aprobación explícita
             ├─ Spike        → explorar + informar recomendación (terminal; nada reutilizable)
             ├─ Bounded      → preguntas + diseño corto EN CHAT → aprobación → TDD directo (sin plan doc)
             └─ Architectural→ preguntas → 2-3 enfoques → diseño por secciones → aprobación
                                     → spec en docs/superpowers/specs/YYYY-MM-DD-<tema>-design.md + commit
                                     → usuario revisa spec → (única skill permitida a continuación)
                         writing-plans  → plan bite-sized con pasos TDD + checkboxes
                                              (docs/superpowers/plans/YYYY-MM-DD-<feature>.md)
                                              → handoff: el plan exige elegir ejecutor
                                              ├─ subagent-driven-development   (misma sesión, recomendada)
                                              │    por tarea: implementer (TDD dentro) → task review
                                              │    (requesting-code-review) → fix loop → final review
                                              └─ executing-plans               (sesión paralela)
                                                   └─ using-git-worktrees (aislar workspace) → ejecutar tareas
                                                       └─ finishing-a-development-branch
                                                            tests verdes → menú 3 opciones (merge/PR/keep)
                                                            → la integración la decide el usuario
```

### Reglas de transición (no negociables)

| Regla | Por qué |
|---|---|
| Ningún código antes de la aprobación del diseño | El gate es la aprobación, no la longitud del diseño |
| Tras un spec aprobado, la ÚNICA skill siguiente es `writing-plans` | El espec fija el alcance; nunca pasas directo a implementar |
| Tras el plan, eliges `subagent-driven-development` o `executing-plans` | Así lo exige el handoff del propio plan |
| La única salida de la ejecución es `finishing-a-development-branch` | La integración (merge/PR/keep) es decisión del usuario |
| Si aparece un bug/rojo/inesperado en cualquier punto → `systematic-debugging` y parar | No hay fixes sin causa raíz |
| Antes de afirmar "hecho/completado/commiteando" → `verification-before-completion` | Evidencia antes que afirmaciones |
| Feature/bugfix/refactor → TDD antes de escribir implementación | Test primero o no es TDD |

---

## 2. Skills de proceso – cuándo y para qué (obligatorias en su momento)

| Skill | Trigger exacto | Qué hace / para qué |
|---|---|---|
| `using-superpowers` | Inicio de cualquier conversación, antes de todo | Gate de descubrimiento: invocar skills antes de responder, explorar o preguntar |
| `brainstorming` | Cualquier trabajo creativo: crear feature, componente, proyecto, o cambiar comportamiento | Explora intención, **clasifica** spike/bounded/architectural y exige aprobación (HARD-GATE) antes de implementar |
| `writing-plans` | Hay spec/requisitos de una tarea multi-paso, antes de tocar código | Escribe plan bite-sized (TDD en cada paso), con rutas de archivos, interfaces y checkboxes; sin placeholders |
| `subagent-driven-development` | Hay plan + tareas independientes + trabajas en esta misma sesión | Dispara un subagente implementador por tarea, revisión por tarea y revisión final; ledger para sobrevivir a compaction |
| `executing-plans` | Hay plan + quieres ejecutarlo en una sesión paralela | Carga el plan, lo revisa críticamente, ejecuta tarea por tarea con verification; termina en finishing-branch |
| `test-driven-development` | Implementar cualquier feature, bugfix o refactor, ANTES del código de producción | Rojo→verde→refactor; si no viste fallar el test, no sabes que prueba lo correcto. Aplica dentro de cada tarea del plan |
| `systematic-debugging` | Bug, test fallando, comportamiento inesperado, build que falla | 4 fases: causa raíz → patrón → hipótesis → test que reproduce + fix. Tras 3+ fixes fallidos: cuestionar la arquitectura |
| `verification-before-completion` | Antes de afirmar "hecho/fixed/pasa", de commitear o abrir PR | Correr el comando de verificación completo y mostrar la evidencia antes del claim |
| `requesting-code-review` | Al completar una feature/tarea, antes de merge, o tras cada tarea en SDD | Despacha un revisor subagente con contexto preciso (SHAs + descripción + requisitos) |
| `receiving-code-review` | Cuando recibes feedback de revisión | Verificar técnicamente antes de implementar; nada de acuerdo performativo; pushback razonado |
| `finishing-a-development-branch` | Implementación completa + tests verdes + hay que integrar | Detecta entorno, presenta el menú (merge local / push+PR / mantener), nunca decide por el usuario |
| `using-git-worktrees` | Antes de ejecutar un plan o en feature work que requiere aislamiento | Crea/verifica workspace aislado (nativo o `git worktree`), setup y baseline de tests |
| `dispatching-parallel-agents` | 2+ fallos o tareas independientes sin estado compartido | Un subagente por dominio problemático, en paralelo, con integración final |
| `dry-refactoring` | Refactor de código duplicado | Flujo guiado jscpd → extraer función/módulo/constante/clase → re-verificar clones |
| `writing-skills` | Crear, editar o verificar una skill | TDD aplicado a documentación: baseline → skill mínima → cerrar huecos de racionalización |
| `software-architecture` | Diseño de arquitectura/DDD/Clean Arch (dentro del brainstorming arquitectural) | Guía de diseño: separación de dominios, naming, evitar cajones genéricos, calidad |

---

## 3. Skills situacionales concretas (se disparan por acción, no por secuencia)

### Técnicas / específicas

| Skill | Trigger exacto | Qué hace / para qué |
|---|---|---|
| `codebase-memory` | Explorar estructura, arquitectura o dependencias del código | Consulta el grafo del proyecto (search_graph, trace_path, get_code_snippet, query_graph) ANTES de grep/glob para descubrimiento estructural |
| `react-performance-optimization` | Uso de memoria, renders lentos o bundle grande en una app React | Patrones de memoización, code-splitting y estrategias de render eficiente |
| `webapp-testing` | Necesitas interactuar/probar una web local o depurar su UI | Toolkit Playwright: verificar frontend, debug UI, screenshots y logs del navegador |
| `chart-visualization` | El usuario pide un gráfico/imagen de datos | Genera gráficos vía API AntV (barras, líneas, tarta, radar, sankey, mindmap, flow) |
| `site-architecture` | Planear/mapear/restructurar el árbol de páginas, navegación o IA del sitio | Información architecture, jerarquías, URL structure, internal linking |
| `seo` | Mejorar visibilidad en buscadores | Meta tags, structured data, sitemap; para auditar SEO técnico usa el flujo de auditoría |
| `accessibility` | Auditar o mejorar accesibilidad | WCAG 2.2: screen reader, teclado, contraste, a11y tree |
| `nextjs-developer` | Solo si se construye con Next.js 14+ (App Router) | Configuración de rutas, server components/actions, metadata, deploy Vercel |
| `agent-development` | Quieres crear/añadir agentes o subagentes (frontmatter, triggers, tools) | Guía de estructura y system prompts de agentes para plugins |
| `find-skills` | No existe una skill para lo que quieres hacer | Busca/instala skills nuevas en lugar de improvisar |

### Diseño y UX (implementación, siempre DESPUÉS del proceso)

| Skill | Trigger exacto | Qué hace / para qué |
|---|---|---|
| `frontend-design` | Construir interfaces web de producción (webs, landing, dashboards, componentes) | Diseño UI creativo y pulido, evita estética genérica de IA |
| `impeccable` | Rediseñar, criticar, pulir, auditar o optimizar una interfaz existente | UX review completa: jerarquía, layout, color, tipografía, microinteracciones, estados vacíos/error, theming |
| `ui-ux-pro-max` | Decidir paletas, tipografías, estilos, animaciones o stacks de UI/UX | Base de datos local de 84 estilos, 192 paletas, 74 pares de fuentes, 98 guías UX, 25 tipos de chart por stack |
| `mobile-app-ui-design` | Diseñar pantallas/flujos/componentes de app móvil (onboarding, navegación, mockups) | Diseño mobile-first de calidad tipo React Native / Flutter / SwiftUI, también prototipos visuales |

---

## 4. Cómo se genera el workflow al empezar (lo que el usuario pide ver)

Cuando empieces una conversación o te pidan crear algo nuevo:

1. **Enuncia la ruta en voz alta.** Clasifica: *"esto es bounded, diseño corto y luego TDD"* o *"es architectural: spec → plan → ejecución"*. El usuario puede corregirte.
2. **Crea un todo por cada etapa del flujo** (clasificar → diseño → aprobación → [spec → plan] → ejecutar tarea N → verificar → revisión → integración).
3. **En cada transición di el siguiente paso con la skill**: *"paso a writing-plans para el plan"*, *"uso systematic-debugging: hay un test rojo"*.
4. **Cierra el gate de aprobación correcto.** Bounded/spike: sí al diseño en chat. Architectural: sí a cada sección + revisión del spec escrito.
5. Para planes grandes: ledger de progreso + `finishing-a-development-branch` al final.

---

## 5. Red flags — parar y volver al flujo

| Pensamiento | Realidad |
|---|---|
| "Es simple, no necesita skill" | Simple = diseño corto, no cero diseño |
| "Lo hago y luego el diseño" | El gate es la aprobación: presentar y esperar sí |
| "Ya probé a mano, no hace falta test" | Manual no re-ejecuta; test primero o no es TDD |
| "Arreglo esto y luego investigo" | Causa raíz antes que fixes (systematic-debugging) |
| "Tengo confianza en que pasa" | Confianza ≠ evidencia (verification-before-completion) |
| "Saltó algo raro pero sigo" | Comportamiento inesperado = parar y diagnosticar |
| "El user aprobó el spike, el resto también" | Cada tarea tiene su propia clasificación y aprobación |

---

## 6. Nota de proyecto (GymLab)

El `AGENTS.md` del repo refuerza este flujo: **1 commit por tarea** con mensaje
convencional, **CHANGELOG.md al día**, verificación `tsc`/`build`/lint antes de
commitar, y arquitectura por capas (`domain` puro, repos por interfaz, UI sin
lógica de negocio). Las skills de proceso de esta skill tienen precedencia; las
de diseño/UX se aplican dentro de la ejecución, nunca antes de la aprobación
del diseño.