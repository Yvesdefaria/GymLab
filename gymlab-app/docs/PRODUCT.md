# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

App web mobile-first (PWA instalable). La futura app nativa Android (Capacitor, fase 30) sería un wrapper de este sitio, no un lenguaje de diseño nativo propio.

## Users

Público amplio/mixto, confirmado con el usuario: aficionados que se auto-entrenan en gimnasio o casa, desde principiantes hasta intermedios-avanzados, hombres y mujeres (el seed incluye rutinas mujer/glúteo y el onboarding pregunta sexo). Su trabajo: planificar el entreno, registrar series/peso/reps, seguir rutinas y un programa activo, y ver su evolución con datos. UI en español (es-ES).

## Product Purpose

Aplicación de entrenamiento local-first (Vite + React + TS + Tailwind + Dexie) para planificar rutinas, registrar sesiones (series, peso, RPE/RIR, calentamientos, superseries, descanso), seguir un programa activo con calendario/racha, medir composición corporal y consultar calculadoras y guías basadas en evidencia. Éxito: el usuario entrena mejor con datos, sin depender de backend ni conexión.

## Positioning

Todo-en-uno, confirmado con el usuario: rutinas (catálogo seed + builder propio), registro de sesión con coach activo (sugerencia de cargas, insights de volumen, PRs), calculadoras (IMC, calorías, macros, 1RM, agua, conversor, discos, medidas corporales, grasa corporal), guías y papers, peso/medidas/grasa corporal y un tab de estadísticas con 8 tipos de gráfico — todo offline y sin cuenta, con backup/restore JSON.

## Operating Context

- Uso en el gimnasio: sesión con rest timer (sonido/vibración), wake lock, precarga de la última carga, sugerencia de carga, calculadora de discos; sin red es imprescindible (offline PWA).
- Pantalla móvil 375×812; touch targets ≥ 44 px; `prefers-reduced-motion` respetado.
- Tema oscuro por defecto con modo día/noche y 5 paletas de acento (gold, energy, crimson, electric, violet, gray).
- Contenido offline: seeds desde `content/training-library/`, media de ejercicios de free-exercise-db (Unlicense) en `public/exercises/`, catálogo JSON versionado en `public/catalog/`.

## Capabilities and Constraints

Confirmado (ver PLAN.md y CHANGELOG.md):

- Registro de sesión: series/reps/peso (display kg/lb, storage siempre kg), RPE/RIR opcional, calentamientos, superseries, notas por ejercicio, rest timer, plate calculator, load suggestion, PRs.
- Rutinas: catálogo seed (fuerza, volumen, definición, mujer/glúteo, 5/3/1, sesiones sueltas de 1 día) + builder custom con CRUD (ids ≥ 10000) y favoritos.
- Programa activo con días de la semana, deload, calendario semana/mes, racha, anillo de progreso.
- Cuerpo: dummy muscular con fatiga, biblioteca de 873 ejercicios con media, peso corporal, medidas corporales (18 zonas) y grasa corporal (Jackson-Pollock + Siri), con historial y gráficos.
- Estadísticas: rachas, frecuencia, volumen por músculo, velas de cargas/volumen, e1RM, IMC, ratios, composición.
- Papers y guías con fuentes reales; calculadoras con disclaimer («informativo, no consejo médico»).
- Onboarding de primera visita, backup export/import JSON, PWA installable, SEO por ruta, virtualización del catálogo.
- Roadmap: solo el MVP core por ahora (confirmado con el usuario). La fase 21+ social (Supabase) y la fase 30 Capacitor quedan fuera de compromiso actual.

Constraints técnicas:

- Stack fijado (AGENTS.md): Vite + React + TypeScript + Tailwind v4 + Dexie + Zustand + Recharts + lucide-react + PWA. Prohibido Next.js, Expo, Redux o backend en el MVP sin acuerdo.
- No editar el prototipo `../GymLab/` (solo referencia visual/marca).
- Arquitectura por capas: `domain/` puro, `data/repositories/` (interfaces; hoy Dexie, mañana API), UI vía hooks; `store/` solo sesión efímera.
- No inventar DOIs/papers; no emojis como iconos; copy de UI en español.
- Fechas de negocio en local `YYYY-MM-DD`; IDs seed < 10000.
- Licencia propietaria (All Rights Reserved, source-available).

## Brand Commitments

- Nombre: **GymLab**. Tagline: «Entrena mejor con datos».
- Identidad visual confirmada en código: fondo oscuro `#121214` / `#242422`, acento dorado `#D9B384` / `#FDDDB4`, tipografías **Oswald** (display/estadísticas) + **Barlow** (texto), logo `public/logo.jpg`; dirección industrial-premium documentada en `.interface-design/system.md`.
- Copy de UI en español (es-ES).

## Evidence on Hand

- Prototipo HTML de marca: `../GymLab/` (referencia, no editar).
- Biblioteca de contenido offline: `content/training-library/` (splits fuerza/volumen, mujer, guías).
- Media de ejercicios: `public/exercises/` (free-exercise-db, Unlicense) + placeholders SVG propios; catálogo JSON en `public/catalog/exercises-vN.json`.
- Generador determinista de datos de prueba: `scripts/generateFakeData.cjs`.
- Papers en seed con fuentes reales; no fabricar referencias ausentes.

## Product Principles

1. **Local-first y privado por defecto**: los datos viven en el dispositivo (Dexie); sin cuenta ni nube en el MVP, con backup export/import.
2. **Los datos proponen, no solo registran**: coach activo (sugerencia de cargas, insights, PRs, deload) sobre bitácora pasiva.
3. **Evidencia antes que modas**: calculadoras, guías y papers basados en ciencia, siempre con disclaimer.
4. **Pensado para el gimnasio**: mobile-first, offline, timers/sonido/vibración, targets ≥ 44 px, modo día/noche con contraste.
5. **Capas limpias y desacopladas**: domain puro, repositorios intercambiables (Dexie → Supabase) sin tocar la UI.

## Accessibility & Inclusion

- UI en español; contraste revisado en modo noche y día (WCAG 2.2, lote A de la fase 39): `focus-visible`, `aria-label`/`aria-pressed`/`role="alert"`, dialogos accesibles, targets ≥ 44 px, `prefers-reduced-motion` respetado.
- No hay requisito de cumplimiento normativo específico establecido.
