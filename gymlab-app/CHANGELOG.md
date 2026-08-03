# Changelog — GymLab App

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).
El versionado sigue [SemVer](https://semver.org/lang/es/) cuando haya releases formales.

---

## [Unreleased]

### Added
- Scaffold **Vite + React + TypeScript** en `gymlab-app/`.
- **PLAN.md** — plan de fases (stack, arquitectura, site map, calculadoras, Capacitor).
- **AGENTS.md** — reglas para agentes (capas, stack, convenciones, rutas, obligación de actualizar changelog).
- **CHANGELOG.md** — este archivo.
- Dependencias: `react-router-dom`, `dexie`, `dexie-react-hooks`, `zustand`, `recharts`, `lucide-react`, Tailwind v4 (`@tailwindcss/vite`), `vite-plugin-pwa`.
- Tema oscuro GymLab (tokens CSS + Barlow / Barlow Condensed).
- **AppShell** + **TabBar** mobile-first: Entrenar · Rutinas · Papers · Más.
- Rutas base: `/`, `/entrenamiento/:id`, `/rutinas`, `/papers`, `/mas`, `/perfil`, `/calculadoras`, `/calculadoras/:calcId`, `/ejercicios`.
- Páginas placeholder con UI de marca para cada sección.
- Hub **Calculadoras** (IMC y TDEE listados; roadmap 1RM, macros, agua, % grasa, conversor).
- PWA mínima (manifest + service worker autoUpdate).
- Alias `@` → `src/` en Vite.
- Repositorio Git inicializado y remoto GitHub (si aplica).

### Changed
- N/A (proyecto nuevo).

### Fixed
- Tipado de `end` en `TabBar` (union `as const` con React Router).
- Warning Vite: `__dirname` sustituido por `import.meta.url`.

---

## Cómo actualizar

Al cerrar una fase o feature:

1. Añadir entradas bajo `[Unreleased]` (`Added` / `Changed` / `Fixed` / `Removed`).
2. Al hacer release: renombrar a `## [x.y.z] - YYYY-MM-DD` y dejar `[Unreleased]` vacío.
3. Marcar checkboxes correspondientes en `PLAN.md`.
