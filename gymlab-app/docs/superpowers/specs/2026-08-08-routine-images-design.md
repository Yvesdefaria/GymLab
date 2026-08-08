# Fotos de rutinas — Spec de diseño

Fecha: 2026-08-08
Estado: Aprobado por el usuario (vía Q&A en sesión)

## Contexto

El catálogo de rutinas (23 plantillas en `src/data/seed/routines.ts`) no tiene
imágenes: las tarjetas muestran un icono por objetivo y el hero de Home usa una
foto fija (`/images/home-hero.jpg`). Objetivo: dar identidad visual a cada rutina
con fotografía real (Pexels, licencia libre) y que el hero muestre la rutina
activa.

## Decisiones acordadas

1. **Imágenes locales** en `public/images/routines/<slug>.jpg` (local-first/offline).
2. **Tarjeta de rutina**: la foto es el fondo de la tarjeta, con gradiente oscuro
   encima para legibilidad. **Los colores del overlay usan variables CSS del tema**
   (`--color-bg`, `--color-cta`, `color-mix`) para adaptarse a las 6 paletas × 2
   temas; nunca colores hardcodeados.
3. **Hero de Home**: muestra la foto de la rutina activa. **Sin rutina activa →
   se queda como está ahora** (conserva `home-hero.jpg`). Rutina custom sin foto
   → imagen predeterminada (`default.jpg`).
4. **Sin imagen en la página de detalle** (`/rutinas/:slug`); alcance limitado a
   tarjeta + hero.
5. **Sin CREDITS.md** (la licencia Pexels no exige atribución).
6. Fuente: CDN de Pexels, patrón
   `https://images.pexels.com/photos/<id>/pexels-photo-<id>.jpeg?auto=compress&cs=tinysrgb&w=1200`;
   si la fuente es PNG se fuerza `&fm=jpg`.

## Datos

- Añadir `imageUrl?: string` al tipo `Routine` (`src/domain/types.ts`).
- Seed: cada rutina lleva `imageUrl: '/images/routines/<slug>.jpg'`.
- Bump `SEED_VERSION` → `'13'` en `src/data/repositories/dexie/db.ts` para
  re-sembrar el catálogo en instalaciones existentes (el reseeder preserva rutinas
  custom y metadatos).
- Las rutinas custom no tienen `imageUrl` → `default.jpg` como fallback.

## Mapeo rutina → foto (Pexels)

| Rutina | Foto |
|--------|------|
| ppl-volumen | 6389886 (mancuernas hexagonales) |
| 5x5-stronglifts | 19025673 (barra y pesas) |
| ppl-definicion | 5327556 (press banca oscuro) |
| bro-split | 10152554 (curl de bíceps) |
| starting-strength | 12890944 (peso muerto) |
| torso-pierna | 35376432 (torso muscular B/N) |
| volumen-4-dias | 3837781 (press banca pesado) |
| casa-3-dias | 18112393 (mujer con mancuernas) |
| tiron-empuje | 7672097 (dominadas) |
| mujer-full-3d | 32317373 (mujer con barra) |
| mujer-2d | 29259727 (mujer en sentadilla) |
| mujer-3d | 36387528 (mujer con barra) |
| mujer-4d | 13588102 (mujer en sentadillas) |
| gluteos-3d | 8611295 (rack de mancuernas) |
| 531-wendler | 19025671 (rack de barras) |
| pecho-15 | 3837743 (press banca) |
| espalda-casa | 3025027 (remo con barra; PNG → jpg) |
| abs-principiante | 5000226 (plancha) |
| pierna-express | 5327530 (hombre en sentadilla) |
| gluteo-express | 6516221 (mujer con banda de resistencia) |
| fullbody-20 | 16513601 (pesas rusas) |
| brazos-hombros | 35376431 (torso muscular) |
| cardio-core | 1954524 (cinta de correr) |
| default | 3916762 (press banca con barra) |

Nota: Pexels no tiene fotos de hip thrust; para `gluteos-3d` y `gluteo-express` se
usan las más cercanas (rack de mancuernas y banda de resistencia).

## Implementación

- `src/components` / `src/pages/RutinasPage.tsx`: `RoutineCard` pasa a tarjeta con
  `<img>` de fondo (absoluto) + overlay de gradiente con variables CSS + contenido
  en `relative z-10`; botón favorito y chevron intactos.
- `src/index.css`: clases `.routine-card` (o similares) dentro de `@layer
  components`, con overlay `linear-gradient` usando `color-mix` de `--color-bg` y
  tinte `--color-cta` (patrón del hero actual).
- `src/pages/EntrenarPage.tsx`: la atmósfera del hero elige `src` según la rutina
  activa (`routine.imageUrl` → rutina custom sin foto → `default.jpg` → sin rutina
  → `home-hero.jpg`).
