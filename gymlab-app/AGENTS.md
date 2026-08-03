# AGENTS.md — GymLab App

Instrucciones para agentes de IA que trabajen en este repositorio.

## Proyecto

- **Nombre:** GymLab App
- **Ruta app:** `gymlab-app/` (este directorio)
- **Prototipo legado:** `../GymLab/` — solo referencia visual/marca. **No editar.**
- **Plan maestro:** leer y actualizar `PLAN.md` al completar fases (marcar checkboxes).

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

Tras cambios de UI/lógica relevantes: typecheck + build. No commitear secretos.

## Convenciones de código

- Early returns; funciones cortas; componentes < ~80 líneas cuando sea posible; archivos < ~200 líneas.
- Arrow functions preferidas.
- Sin comentarios innecesarios.
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

- No modificar `../GymLab/` (prototipo).
- No meter auth/backend en MVP sin pedirlo.
- No mezclar lógica de negocio en componentes de presentación.
- No usar emojis como iconos de UI.
- No inventar DOIs/papers falsos: fuentes reales o placeholders claramente marcados.
- No crear PLAN.md duplicados; actualizar el existente.

## Skills del repo

Viven en `../.opencode/skills/`. Usar según tarea: frontend-design, ui-ux-pro-max, site-architecture, software-architecture, accessibility, seo, webapp-testing.

## Commits (obligatorio)

- **Un commit por tarea/modificación completada.** No acumular cambios sin commitear.
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
