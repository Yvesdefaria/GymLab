# Spec — Rediseño de `/perfil` con Nocturno Minimal (dirección A)

- **Fecha:** 2026-10-23
- **Rama:** `perfil-redesign` (worktree `.worktrees/perfil-redesign`, base `1b61686a`)
- **Diseño:** `gymlab-app/docs/design/NOCTURNO-MINIMAL.md`
- **Mockup aprobado:** `.superpowers/brainstorm/perfil-redesign-20261023/content/perfil-a-v2.html`
- **Estado:** aprobado por el usuario (2026-10-23)

---

## 1. Objetivo

Reemplazar la pantalla `/perfil` actual (tarjetas + tres tabs) por una composición
Nocturno Minimal con **un solo héroe**: la racha actual en semanas, con una tira de
30 días, la próxima insignia y el conteo de días activos. El resto del perfil pasa a
secciones hairline: marcas, historial reciente, datos, deload y chapas.

Sumar la subpágina `/perfil/historial` con las marcas completas, el timeline de
entrenos paginado y el comparador de sesiones al final.

## 2. Decisiones cerradas (grilling 2026-10-23)

- **D1** — Dirección A: héroe = racha en semanas. Sin tabs, scroll único.
- **D2** — El historial completo vive en `/perfil/historial` (ruta nueva).
- **D3** — El perfil no lleva chart de volumen; eso es de `/estadisticas`.
- **D4** — El comparador de sesiones se muda a `/perfil/historial` y conserva su
  interna (`SessionComparison`); solo se adapta el shell.
- **D5** — “Tus datos”: Edad de lectura (sin chevron), “Altura y sexo” →
  `/calculadoras/medidas`, “Peso” → `/peso-corporal`.
- **D6** — Deload: fila hairline con score, switch e `InfoTip`; sin barras.
- **D7** — 0 entrenos: identidad + un único empty state honesto + CTA. Se ocultan
  héroe, stats, marcas, historial, deload y chapas. “Tus datos” sobrevive. Con
  entrenos previos y racha rota se muestra `0` + el mensaje `rachaRota`.
- **D8** — Pie del héroe: insignia próxima; si no hay, “Último entreno: {fecha}”.
- **D9** — Identidad: “{N} entrenos · desde {mes año}”, nombre inline, avatar en
  sheet, sin engranaje.
- **D10** — Se mantiene el back a `/mas` porque `/perfil` no está en la tab bar.
- **D11** — Base/merge (Q1): fuera de alcance de esta fase; se resuelve al cerrar
  (stats C1 primero).

## 3. Alcance

**Dentro:** `/perfil`, `/perfil/historial`, componentes de perfil, i18n es/en,
tests unitarios/componentes, router, CHANGELOG y README de diseño.

**Fuera:** `/mas`, `/logros`, `/estadisticas`, el interior de `SessionComparison`,
edición de fecha de nacimiento, tema día/paletas (se verifican, no se rediseñan).

## 4. Composición

### 4.1 `/perfil`

Orden vertical, todo `px-4`, `max-w-lg`, secciones `border-t border-border/40`:

1. `AppHeader` con `kicker={t('perfil.kicker')}` y `title={t('perfil.titulo')}`.
   Sin subtítulo y sin acciones.
2. `BackLink to="/mas"`.
3. **Identidad** (`ProfileIdentity`): avatar 64 px (abre `AvatarPicker`), nombre
   editable inline, meta “{N} entrenos · desde {mes año}”.
4. **Héroe** (`ProfileStreakHero`): eyebrow “Racha actual”, número Oswald 300
   62 px, “semanas”, “{max} máx.” a la derecha; tira de 30 días (10×3); pie con
   insignia o último entreno + “{activos} / 30 días”.
5. **Fila de 3** (`StatsStatRow`): volumen semanal con unidad, PRs, entrenos.
6. **Mejores marcas** (`ProfilePrRows`, top 3) + “Ver todas” → `/perfil/historial`.
7. **Historial reciente** (`ProfileWorkoutRows`, top 3) + “Ver todo” →
   `/perfil/historial`.
8. **Tus datos** (`ProfileDataRows`): Edad, Altura y sexo, Peso.
9. **Recuperación** (`ProfileDeloadRow`).
10. **Chapas** (`ProfileChapasRow`): medallas + “Ver todas” → `/logros`.

Sin footer ni engranaje. La página termina en chapas.

### 4.2 `/perfil/historial`

1. `AppHeader` con `kicker={t('perfil.historialKicker')}` y `title={t('perfil.historialTitulo')}`.
2. `BackLink to="/perfil"`.
3. **Mejores marcas**: todas las PRs, filas hairline, contador “{n} marcas”.
   Ocultar la sección si no hay PRs.
4. **Entrenos**: agrupados por mes (eyebrow), filas hairline de 44 px con fecha,
   volumen y duración; 10 por tanda y botón ghost “Ver más entrenos”.
5. **Comparar sesiones**: `BestSessionCard` con shell hairline (sin `panel`).
   Oculto con menos de 2 entrenos.

Si no hay entrenos: empty state honesto y se ocultan marcas/timeline/comparador.

### 4.3 Estados

- **Perfil vacío (0 entrenos):** identidad + empty state (`sinDatosTitulo`,
  `sinDatosTexto`, CTA `empezarEntrenar` → `/`) + “Tus datos” si hay datos.
- **Sin PRs:** ocultar “Mejores marcas”.
- **Sin programa/score de deload:** ocultar la fila (comportamiento actual).
- **Sin chapas:** ocultar la sección (comportamiento actual).
- **Sin peso:** ocultar la fila “Peso”.
- **Sin altura ni sexo:** ocultar la fila combinada.
- **Sin entrenos:** ocultar el héroe (no mostrar “0 semanas” inventado).
- **Racha rota (entrenos > 0, racha 0):** mostrar `0` + `rachaRota`; no ocultar el héroe.

## 5. Datos reales

| Bloque | Dato | Fuente |
|---|---|---|
| Identidad | nombre | `useProfileName` (`meta.profileName`) |
| Identidad | avatar | `useAvatar` (`meta.avatarUri`) |
| Identidad | entrenos | `workouts.length` |
| Identidad | desde | `localDateOf` del workout más antiguo → `formatDate({month:'short', year:'numeric'})` |
| Héroe | racha, máxima | `useAchievementsData().streak` (semanas con ≥3 sesiones) |
| Héroe | tira 30 días | `buildThirtyDayGrid(trainedLocalDates(workouts))` |
| Héroe | insignia | `nextStreakBadge(currentStreak)` |
| Héroe | último entreno | `streak.lastWorkoutDate` |
| Stats | volumen semanal | `weeklyVolume(workouts)` + `applyUnits`/`formatUnits` |
| Stats | PRs | `prs.length` |
| Stats | entrenos | `workouts.length` |
| Marcas | nombre/peso/reps/e1RM/fecha | `prs` + `nameById` + `formatWeight` |
| Historial | fecha, volumen, duración | `workouts` + `workoutDurationMin` + `localDateOf` |
| Datos | edad | `useProfileAge` (`meta.birthDate`), solo lectura |
| Datos | altura/sexo | `useBodyProfile` (`heightCm`, `bodySex`) |
| Datos | peso | `latestWeightKg(bodyWeights)` |
| Deload | score + switch | `useActiveProgram` + `calcDeloadScore` + `activeProgramRepo` |
| Chapas | desbloqueadas | `savedIds`, `counts`, `collectibles` |

**Regla de unidades:** el volumen semanal de la fila de 3 lleva unidad
(`formatUnits`) y separador de miles (`formatNumber`). No usar `formatVolume`
compacto en el héroe ni en la fila.

## 6. Componentes y archivos

**Nuevos**

- `src/domain/profile.ts` — helpers puros: `firstWorkoutDate`, `profileSections`,
  `streakBadgeKey`, `countActiveDays` (los que apliquen).
- `src/components/profile/ProfileStreakHero.tsx`
- `src/components/profile/ProfilePrRows.tsx`
- `src/components/profile/ProfileWorkoutRows.tsx`
- `src/components/profile/ProfileDataRows.tsx`
- `src/components/profile/ProfileDeloadRow.tsx`
- `src/components/profile/ProfileChapasRow.tsx`
- `src/pages/PerfilHistorialPage.tsx`

**Modificados**

- `src/pages/PerfilPage.tsx` — composición nueva.
- `src/components/profile/ProfileUserCard.tsx` — hairline, 64 px, meta con “desde”.
- `src/components/profile/BestSessionCard.tsx` — shell hairline (sin `panel`).
- `src/app/router.tsx` — ruta lazy `perfil/historial`.
- `src/i18n/locales/{es,en}/core.ts` — claves nuevas.

**Eliminados al quedar sin uso**

- `src/components/profile/ResumenTab.tsx`
- `src/components/profile/HistorialTab.tsx`
- `src/components/profile/RachasSection.tsx`
- `src/components/profile/PrListCard.tsx`
- `src/components/profile/RecentHistoryCard.tsx`
- `src/components/profile/VolumeChartCard.tsx`
- `src/components/summary/SummaryCards.tsx`
- `src/components/summary/StatCard.tsx`

Antes de borrar: verificar que no queden imports (grep por nombre).

## 7. i18n (es/en)

Nuevas claves en `perfil`:

- `kicker` — “Tu progreso” / “Your progress”
- `desde` — “desde {{fecha}}” / “since {{fecha}}”
- `datosAlturaSexo` — “Altura y sexo” / “Height and sex”
- `datosAlturaSexoValor` — “{{altura}} · {{sexo}}” / “{{altura}} · {{sexo}}”
- `datosSoloLectura` — ayuda accesible de la fila Edad (opcional)
- `deloadLinea` — “Señal {{score}}/100 · {{estado}}”
- `deloadEstadoBajo` — “sin fatiga” / “no fatigue”
- `deloadEstadoMedio` — “fatiga moderada” / “moderate fatigue”
- `deloadEstadoAlto` — “fatiga alta” / “high fatigue”
- `diasActivos` — “{{activos}} / 30 días” / “{{activos}} / 30 days”
- `historialKicker` — “Tu actividad” / “Your activity”
- `historialTitulo` — “Historial” / “History”
- `marcasCount` — “{{count}} marca” / “{{count}} PR” (+ `_other`)
- `verMasEntrenos` — “Ver más entrenos” / “Load more workouts”
- `compararSesiones` — “Comparar sesiones” / “Compare sessions”
- `verTodasMarcas` — “Ver todas” / “See all”
- `verTodoHistorial` — “Ver todo” / “See all”
- `editarDatos` — “Editar” / “Edit”

Actualizar `entrenosRegistrados` si se cambia el copy (hoy “{{count}} entrenos
registrados”); la identidad nueva usa “{{count}} entrenos”.

## 8. Accesibilidad

- Tira de 30 días: no interactiva; `aria-hidden` en las celdas y un `<span class="sr-only">`
  con “{activos} de los últimos 30 días entrenados”. No crear 30 tab stops.
- Héroe: número y máximo como texto; el eyebrow da contexto.
- Filas: `Link`/`button` con `min-h-11`; Edad sin chevron y sin foco falso.
- Switch de deload: `role="switch"`, `aria-checked`, `aria-label` existentes.
- `InfoTip` conserva foco, Escape y retorno.
- Sin animaciones nuevas; `prefers-reduced-motion` no aplica.
- Tokens únicos; funciona en noche/día y 6 paletas.

## 9. Tests (TDD)

1. `tests/unit/domain/profile.test.ts` — helpers:
   - `firstWorkoutDate` con 0, 1 y varias fechas desordenadas.
   - `profileSections` con 0 entrenos (héroe/stats/marcas/historial/deload/chapas
     ocultos; datos visibles) y con datos.
   - `streakBadgeKey` para 1–3, 4–7, 8–15 y ≥16.
   - `countActiveDays` (30 días) con borde 0/30.
2. `tests/unit/components/profile/profileStreakHero.test.tsx` (jsdom):
   - pinta racha, “semanas”, máximo y “{activos} / 30 días”.
   - con insignia usa el copy `insignia*`; sin insignia cae a “Último entreno”.
   - con racha 0 no se renderiza.
3. `tests/unit/components/profile/profileDataRows.test.tsx`:
   - Edad sin chevron (no es link).
   - Altura y sexo combina “180 cm · Hombre” y apunta a `/calculadoras/medidas`.
   - Peso ausente → fila ausente.
4. `tests/unit/components/profile/profileWorkoutRows.test.tsx`:
   - respeta `limit` y orden.
   - “Ver más” solo cuando hay más ítems.
5. `tests/unit/app/perfilHistorialRoute.test.ts`:
   - el router declara `perfil/historial` con `lazy(() => import(...))`.
6. Verificación manual: screenshot de `/perfil` y `/perfil/historial` con dev server.

## 10. Verificación y entrega

- `npm test` (suite completa) y `npm run build` en el worktree.
- Review RDD antes de cada commit (candidato = diff del workspace).
- Commits work-unit en `perfil-redesign`, sin push:
  1. `docs: spec del rediseño de perfil Nocturno Minimal`
  2. `feat: rediseñar perfil con héroe de racha y secciones hairline`
  3. `feat: agregar historial del perfil como subpágina`
  4. `docs: actualizar changelog y estado del diseño`
- Al cerrar: resolver Q1 (merge de stats C1 primero) y cerrar el worktree.

## 11. Riesgos

- **Tabs eliminados:** `ResumenTab`, `HistorialTab` y `RachasSection` solo los usa
  `PerfilPage`; verificar imports antes de borrar.
- **Comparador:** `SessionComparison` no se toca; el shell de `BestSessionCard` sí.
- **`/mas`:** otra sesión lo está rediseñando; el back a `/mas` se mantiene y no se
  toca ese archivo.
- **Base de rama:** `perfil-redesign` nace de `feat/stats-nocturno-minimal`; no
  mergear a `main` antes que stats (Q1).
- **Datos vacíos:** el empty state no debe mostrar “0 semanas” ni grillas apagadas.
