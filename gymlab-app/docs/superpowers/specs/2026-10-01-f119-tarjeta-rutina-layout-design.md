# F119 — Tarjeta de rutina: layout estable con nombres largos (diseño)

> Fecha: 2026-10-01 · Estado: propuesto para revisión · Fuente: reporte del usuario (la estrella de favorito queda inaccesible según la longitud del nombre; layout visualmente inconsistente)
> Directorio: `gymlab-app` (sin worktree; sesión compartida — stage quirúrgico por rutas exactas)

## Contexto

**Reporte**: «El componente de rutina varía según la longitud del nombre: desplaza la estrella y no se puede dar (favorito), y estéticamente es inconsistente.»

**Diagnóstico verificado en vivo** (probe Playwright, viewport 360px, rutinas custom sembradas en IndexedDB):

1. **Causa raíz**: `.routine-card__link` (`src/index.css`) es un flex item **sin `min-width: 0`**. Su tamaño mínimo automático queda dictado por el ancho `min-content` del título (que es `nowrap`), por lo que el link se estira más allá de la tarjeta (medido: 562px dentro de una tarjeta de 328px) y empuja al botón de favorito (`shrink-0`) fuera del área visible.
2. **Efectos medidos (antes)**: estrella 283px fuera de la tarjeta con un nombre largo (hit-test nulo, click no togglea: «no se puede dar»); +55px fuera con un nombre medio («Torso Superior Hipertrofia y Fuerza»); el `truncate` del título **nunca se activa** (scrollWidth = clientWidth = 450; texto cortado a mitad de palabra sin «…»); desborde horizontal de la tarjeta de 62–290px.
3. **Bug extra de la misma familia**: el badge «Basada en {título}» de una rutina clonada no trunca y desborda 182px por sí solo.
4. **La página de detalle no tiene el bug** (verificado: el H1 trunca con ellipsis y `RoutineInfoCard` mantiene su estrella `shrink-0` en posición).

## Decisiones aprobadas por el usuario (brainstorming + prototipo medido en vivo)

1. El título puede bajar a una segunda línea cuando no entra en una; si excede dos líneas, se recorta con «…».
2. La estrella de favorito queda en el mismo sitio en todas las cards.
3. Todas las cards del catálogo tienen el mismo tamaño.
4. Fix mínimo sobre la estructura visual existente (sin rediseño).

## Diseño

### Archivos de producto (2)

**`src/index.css`**

1. `.routine-card__link { min-width: 0 }` — fix raíz del estiramiento.
2. `.routine-card__title` (clase nueva para el título): ocupa el ancho completo de la fila (`flex-basis: 100%`, `min-width: 0`) y clampa a 2 líneas con ellipsis (`display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden`). Reemplaza al `truncate` actual de 1 línea, que además nunca se activaba.
3. `.routine-card__badges` (contenedor nuevo, dentro de `.routine-card__row`, después del título): fila `flex` sin wrap (`flex-wrap: nowrap`), `min-width: 0`, `overflow: hidden`, mismo `gap` que la fila; cada badge con `min-width: 0` + `text-overflow: ellipsis` + `white-space: nowrap` — un badge nunca desborda la tarjeta.
4. `.routine-card { min-height: 7.5rem }` — altura uniforme calibrada con el caso peor (título 2 líneas + fila de badges + línea de metadatos; medido: 120px exactos en los 4 casos de prueba). El contenido queda centrado verticalmente (la fila ya usa `align-items: center` y el botón `my-auto`), así la estrella cae en el mismo punto en todas las cards.
5. `contain-intrinsic-size` de `.routine-card` se actualiza al nuevo alto (`0 7.5rem`) para que el placeholder de `content-visibility` no descuadre la lista.

**`src/components/routines/RoutineCard.tsx`**

6. Reestructura menor del bloque de contenido: `<span className="routine-card__title">` (en lugar del span con `truncate`; conserva `font-display text-base font-semibold text-fg`) + `<span className="routine-card__badges">` que envuelve el badge de objetivo y el de estado (activa / basada en / propia / sesión suelta). El resto del componente y sus props no cambia.

### Comportamiento por caso (medido en el prototipo)

| Caso | Título | Altura card | Estrella | Desborde |
|---|---|---|---|---|
| Nombre corto (1 línea) | 1 línea | 120px | x=297, offset 40px | 0 |
| Nombre medio (2 líneas justas) | 2 líneas | 120px | x=297, offset 40px | 0 |
| Nombre muy largo | 2 líneas + «…» | 120px | x=297, offset 40px | 0 |
| Clon con badge «Basada en …» largo | 1–2 líneas | 120px | x=297, offset 40px | 0 (badge truncado) |

Medición con `elementFromPoint`: hit-target = botón de favorito en las 4 cards; click real togglea `aria-pressed`.

### Accesibilidad

- El texto completo del título y de los badges permanece en el DOM (el clamp/ellipsis es solo visual): lectores de pantalla y búsqueda no pierden información.
- El botón de favorito conserva `aria-pressed`, su `aria-label` dinámico y el área táctil expandida (`after:-inset-1`, ≥44px).
- Sin cambios de foco ni de orden de tabulación.

### Qué NO cambia

- `RutinaDetailPage` / `RoutineInfoCard` (verificados sin el bug).
- Botón de favorito: mismas props, estado y comportamiento.
- Estructura del catálogo (secciones, filtros, búsqueda), foto de fondo y overlays de la tarjeta.
- Sección de favoritas y de predefinidas: usan el mismo `RoutineCard`, quedan cubiertas automáticamente.

## Verificación

1. **e2e nuevo** `tests/e2e/test_f119_rutina_card.py` (TDD: se escribe primero y debe fallar antes del fix). Siembra rutinas (larga / media / corta / clon con badge largo) y congela los criterios de aceptación:
   - todas las cards del catálogo con la misma altura;
   - estrella en la misma posición (x y offset vertical idénticos) en todas y dentro de la tarjeta;
   - hit-test real = botón + click togglea `aria-pressed` en la card de nombre largo;
   - título clampa a ≤2 líneas (con «…» cuando excede);
   - sin desborde horizontal (`card.scrollWidth == card.clientWidth`; página sin scroll horizontal);
   - 0 `pageerror`.
2. `npm test` + `npm run build` (typecheck real vía project references) + `npm run lint`.
3. Regresión e2e de las superficies que usan el catálogo de rutinas (`test_f66_f67_planificador.py` toca `/rutinas`).
4. **Emulador (recomendado, no obligatorio)**: cambio visual web puro; el smoke de cierre en el WebView valida el render real (criterio: app montada, card renderizada, 0 `pageerror`).
5. **Review por candidato** (RDD encendido global) antes de commitear; commits por tarea, sin push.

## Paquetes de trabajo (borrador — el plan detalla)

1. **WP1 — e2e rojo + fix** (`RoutineCard.tsx` + `index.css` + `test_f119_rutina_card.py`).
2. **WP2 — cierre** (`PLAN.md`: sección F119 → implementada; `CHANGELOG.md`; verificación completa).

## Riesgos

- **Altura +10px**: las cards pasan de 110px a 120px (+10) para que la segunda línea y la fila de badges entren con aire. Aceptado por el usuario.
- **`content-visibility: auto`**: si `contain-intrinsic-size` no se alinea con el nuevo alto, la lista puede «saltar» al hacer scroll; se actualiza en el mismo cambio.
- **Badges truncados**: el badge «Basada en …» puede recortarse visualmente; el texto completo sigue en el DOM (accesible). Alternativa futura: acortar el texto del badge.
- **WebKit/Android**: `-webkit-line-clamp` / `-webkit-box` son el mecanismo estándar de facto, soportado hace años; verificación con e2e Chromium y smoke Android.

## Fuera de alcance

- Límite de longitud (`maxLength`) al nombrar rutinas: el layout nuevo es robusto a cualquier longitud; un tope de UX sería una decisión aparte.
- Página de detalle de rutina y otras cards (ejercicios, papers): sin cambios.
- Cambios de dominio/datos: cero.
