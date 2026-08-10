# Fase 43 — Animaciones (anime.js) + Mejoras UX + Seguridad

- Fecha: 2026-08-10
- Estado: aprobado por el usuario (diseño validado en conversación)
- Alcance: 11 tareas (F43 + T10…T1) sobre la base en `2cd8604` (origin/main)

## Contexto

GymLab App (Vite + React 18 + TS + Tailwind + Dexie) necesita una capa de animación coherente y mejoras de UX que hoy no tiene, más una auditoría de seguridad integrada (app local-first: XSS y validación de inputs son los vectores principales). La base es `origin/main` (`2cd8604`); los commits locales T10/T8 previos se descartaron por decisión del usuario y se re-ejecutan dentro de esta fase.

## Decisiones confirmadas

1. Librería de animaciones: **anime.js v3** (`animejs@3`), local vía npm, sin CDN.
2. Numeración: el setup de anime.js es **Fase 43** (la Fase 42 ya existe: tab Estadísticas, ✅).
3. Avatares predefinidos (T5): **12 URLs HTTPS (Pexels/Unsplash)** con allowlist de host al renderizar; el upload de foto se valida MIME + tamaño ≤ 2 MB.
4. Orden de implementación: F43 → T10 → T8 → T9 → T5 → T7 → T11 → T2 → T3 → T4+T6 → T1.
5. Base git: reset `--hard 2cd8604` (ya ejecutado); `origin/main` alineado.

## Arquitectura

- `src/lib/animations.ts`: helpers reutilizables (fadeIn/out, slideIn/out, staggerFade, staggerSlide, confetti, drawOn, popScale, pulse) con guard `prefers-reduced-motion`. Selectores DOM seguros (nunca interpolar input de usuario).
- Clase CSS `.anime-ready { opacity: 0 }` como estado base controlado por las animaciones.
- Capas respetadas: `domain/` puro (achievements, onboarding, settings), repos via meta, UI solo consume hooks.
- T5 y T1 escriben en tabla `meta` (Dexie), sin migraciones de stores; no se toca el schema de tablas (solo `meta.avatarUri`, `meta.unlockedAchievements` y las keys del onboarding).

## Detalle por tarea

| ID | Tarea | Tamaño | Entregables |
|----|-------|--------|-------------|
| F43 | Setup anime.js + helpers | S | `animejs@3` + `@types/animejs`, `src/lib/animations.ts`, `.anime-ready` |
| T10 | Ocultar Papers | XS | Quitar entrada Papers de `MasPage` (TabBar ya no lo tiene) |
| T8 | Sombra degradada cards | S | `box-shadow` top-left en `.routine-card` + `.panel-elevated` con transición hover |
| T9 | Modo grip/lista en Más | S | `hubLayout: 'grip'\|'list'` en `AppSettings`, toggle `LayoutGrid`/`List`, `staggerFade` |
| T5 | Avatar en Perfil | S | `meta.avatarUri`, `useAvatar`, `AvatarPicker` (upload + 12 URLs), `popScale`, fallback `User` |
| T7 | Instrucciones ejercicios | M | `detailedSteps?: ExerciseStep[]` (~20 ejercicios), lista numerada + tip/warning en ficha, `staggerSlide` |
| T11 | Extender Guías | M | `sections?: GuideSection[]`, expandir 4–6 guías, render con tipografía diferenciada, `staggerFade` |
| T2 | Sistema de Logros | M | `domain/achievements.ts`, `AchievementModal` (confetti + pulse), `useAchievements` (meta.unlockedAchievements) |
| T3 | Tabs internos | M | `TabNav` (underline animado, aria-selected, slideOut/slideIn), montaje en Estadísticas / Perfil / días rutina |
| T4+T6 | Gráficos mejorados | L | Sustituir velas por área/barras/donut animados (Recharts + `drawOn`) |
| T1 | Onboarding expandido | L | 5 pasos, `aria-current`, slideIn/out, T&C obligatorio, guardar en meta + sugerencia rutina |

## Seguridad (auditoría integrada)

- `textContent` para cualquier dato de usuario (notas, guías); nunca `innerHTML`.
- Upload de imagen: validar MIME (`image/jpeg|png|webp|gif`), tamaño ≤ 2 MB, convertir a base64 verificando prefijo `data:image/`.
- Avatares predefinidos: solo HTTPS de dominios en allowlist.
- anime.js: nunca interpolar input de usuario en selectores.
- Onboarding: fecha nacimiento 14–99 años; material contra lista blanca; T&C booleano.
- Sanitizar datos leídos de IndexedDB/localStorage antes de renderizar.

## Criterio de hecho por tarea

- `npx tsc --noEmit` 0 errores
- `npm run build` sin errores
- `npm run lint` (oxlint) sin warnings
- Entrada en `CHANGELOG.md` ([Unreleased])
- **1 commit por tarea** (mensaje convencional `feat:`/`fix:`/`refactor:`)
- Verificación Playwright 375×812 con `scripts/with_server.py`
- Respeto `prefers-reduced-motion` (anime.js no debe animar en `reduce`)

## Fuera de alcance

- Social UI, Capacitor, backend/auth.
- Skills remotas de security-lint (opcionales, solo bajo petición).
- OmniRoute/OpenCode (gestión aparte, no toca este repo).
