# F93 #7 — Filtro por grupo muscular + zona específica (diseño)

> Fecha: 2026-09-03 · Estado: aprobado · Fuente: tarea #7 de F93 · «separar pierna en cuadriceps/femoral y facilitar la búsqueda»

## Contexto

Hoy cada ejercicio del catálogo (`src/domain/types.ts`) tiene **un único** grupo muscular: `Exercise.muscleGroup: MuscleGroup`. El grupo `'pierna'` engloba cuádriceps, femoral, gemelos, abductores, aductores, etc., por lo que el usuario no puede filtrar con precisión (p. ej. «solo cuádriceps» o «solo femoral»).

El usuario pide poder separar pierna en cuádriceps y femoral, y —en la conversación— ampliarlo a un **filtro jerárquico de dos niveles**:
1. **Grupo principal** (Pierna, Pecho, Espalda, …) — como hoy.
2. **Zona específica** (Cuádriceps, Pecho medio, Femoral, …) — nuevo.

Un mismo ejercicio puede trabajar **varias zonas** a la vez (press banca = pecho medio + pecho alto; sentadilla = cuádriceps + femoral + glúteo mayor). El filtro específico debe mostrar el ejercicio si incluye la zona seleccionada.

## Decisiones (aprobadas por el usuario)

1. **Modelo de datos**: `Exercise.muscleGroup` (grupo principal) **se mantiene** tal cual (mínimo impacto en stats/fatiga/rutinas que ya lo consumen). Se añade `Exercise.muscleZones: MuscleZone[]` (nuevo, opcional) para las zonas específicas.
2. **Filtro jerárquico en 2 filas**: fila 1 = grupos principales (actual); fila 2 = zonas del grupo seleccionado (nueva, solo visible cuando hay un grupo principal activo y ese grupo tiene zonas).
3. **Varias zonas por ejercicio** (array). Al filtrar por una zona, el ejercicio sale si alguna de sus zonas coincide.
4. **Todos los grupos** tienen zonas específicas definidas en el vocabulario.
5. **Etiquetado**: los ~52 ejercicios curados (`src/data/seed/exercises.ts`) y los ~30 «comunes» (`COMMON_EXERCISE_SLUGS`) se etiquetan a mano; el resto del catálogo ampliado (free-exercise-db, cientos) se etiqueta con una **heurística** por nombre/slug/externalId (`inferZones`, dominio puro).
6. **`pierna`** como grupo principal **se mantiene**, y las zonas específicas de pierna son `cuadriceps, femoral, gemelo, abductor, aductor` (glúteo es grupo separado con sus propias zonas).

## Vocabulario de zonas (`domain/catalog.ts`)

Nuevo `MUSCLE_ZONES` (lista plana con prefijo de grupo para desambiguar, o mapa grupo→zonas). Propuesta:

| Grupo principal | Zonas |
|---|---|
| `pierna` | cuadriceps, femoral, gemelo, abductor, aductor |
| `gluteo` | mayor, medio |
| `pecho` | superior, medio, inferior |
| `espalda` | dorsal, lumbar, romboides |
| `hombro` | anterior, lateral, posterior |
| `biceps` | larga, corta, braquial |
| `triceps` | larga, lateral, medial |
| `abdomen` | superior, inferior, oblicuos |
| `trapecios` | superior, medio, inferior |
| `antebrazo` | flexor, extensor |

Definición canónica de `MuscleZone` como string literal keyof-un-mapa `MuscleGroup → MuscleZone[]`. Labels ES/EN (`MUSCLE_ZONE_LABELS_ES/EN`). `localizeMuscleZone(zone, lang)` en `src/i18n/catalog`.

## Paquetes de trabajo

### WP1 — Vocabulario y tipo
- `src/domain/catalog.ts`: definir `MUSCLE_ZONES` (mapa o lista prefijada), `MUSCLE_ZONE_LABELS_ES/EN`.
- `src/domain/types.ts`: `type MuscleZone = ...` derivado; añadir `muscleZones?: MuscleZone[]` a `Exercise`.
- `src/i18n/catalog/en.ts`: `localizeMuscleZone(value, lang)` (ya existe patrón `localizeMuscleGroup`).
- Icons: `src/components/exercises/MuscleGroupIcon.tsx` se usa para grupos; para zonas basta label (sin icono nuevo) salvo que se decida.

### WP2 — Inferencia de zonas (dominio puro, TDD)
- Nuevo `src/domain/muscleZoneInference.ts`: `inferZones(ex)` heurística por `name`/`slug`/`externalId` → `MuscleZone[]` (ej. "curl femoral"/"leg curl" → femoral; "gemelo/calf" → gemelo; "press inclinado/incline" → pecho superior…). Devuelve `[]` si no puede inferir.
- `withCategory` no se toca; se llama `inferZones` en `catalogLoader.normalize` y se aplica a los curados manualmente en `exercises.ts`.

### WP3 — Filtro jerárquico (UI + hook)
- `src/hooks/useExerciseCatalog.ts`: `ExerciseCatalogFilters` gana `zone: MuscleZone | null`. `filterExercises`: al filtrar por zona, un ejercicio sale si `ex.muscleZones?.includes(zone)`. Se resetea `zone` al cambiar de grupo principal.
- `src/components/exercises/ExerciseFilterBar.tsx`: añadir 2.ª fila `HScroll` con chips de zonas del grupo seleccionado (solo si `filters.muscle` tiene zonas definidas). Estilo `Chip` idéntico.

### WP4 — Re-etiquetado del seed
- `src/data/seed/exercises.ts` (52 curados): añadir `muscleZones` a mano (p. ej. id 27 sentadilla → `['cuadriceps','femoral','gluteo:mayor']`; id 30 extensión → `['cuadriceps']`; id 31 curl femoral → `['femoral']`; id 48 gemelo → `['gemelo']`; id 23 press mancuernas → `['pecho:superior','pecho:medio']`…).
- `src/data/seed/exercisesExtra/*`: no se toca manualmente; la inferencia se aplica en `catalogLoader.normalize`. Los ejercicios extra que no se infieren quedan con `muscleZones` vacío.
- `src/data/seed/reseeder.ts`: `SEED_VERSION` ↔ se bumpa (en `db.ts`) para re-sembrar con las zonas.
- `src/data/catalogLoader.ts`: `normalize` llama a `inferZones` sobre cada fila.

### WP5 — Detalle/ficha
- `EjercicioDetailPage.tsx`: mostrar las zonas como badges/tags junto al grupo principal.

### WP6 — Verificación
- `npx tsc --noEmit`, `npm run build`. Tests de dominio `inferZones` + `filterExercises` con zona + coherencia vocabulario (cada zona pertenece a su grupo, sin claves duplicadas ES/EN).

## Consideraciones

- `muscleGroup` sigue siendo el índice Dexie; `muscleZones` **no** se indexa (no hace falta para el filtrado en memoria).
- Un ejercicio sin `muscleZones` no aparece al filtrar por una zona (comportamiento esperado hasta etiquetarse).
- La heurística debe evitar falsos positivos claros (no marcar "sentadilla" como solo cuádriceps cuando es compuesta → en los curados se corrige a mano).
- Backward-compatible: los datos existentes no pierden `muscleGroup`; el re-seed añade `muscleZones`.
