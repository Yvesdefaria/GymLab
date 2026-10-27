# F122 — Progresión adaptativa v2: peso de trabajo hacia arriba + freno de tendones (capas 2 y 3)

> Objetivo: prescribir el día como una **escalada** hacia el próximo escalón del **peso de trabajo** (evidencia de doble progresión; RPE opcional afina), aplicable con un toque; **freno de ritmo por ejercicio** que consolida cuando la subida es demasiado rápida para tendones/articulaciones.
> Rama: `main` con commits directos por tarea (convención del repo; sin PRs; push manual del usuario) · Runner: `npm test` (Vitest) + `npm run build` (typecheck real) + e2e Playwright (librería Python)
> Spec: `gymlab-app/docs/superpowers/specs/2026-10-16-f122-progresion-adaptativa-v2-design.md` (commit `3196871`) · Plan: `gymlab-app/docs/superpowers/plans/2026-10-16-f122-progresion-adaptativa-v2.md` (commit `248c5b4`)

## Specs

- **S1** — Doble carril: la prescripción vive del historial de series de reps (`reps ≥ 4`; singles/tests fuera del carril de base y velocidad). El PR es techo de seguridad (`capped`), nunca objetivo del día.
- **S2** — Evidencia: reps al mismo peso (±1 plato) con ≥+2 de promedio sostenido en las últimas 2 sesiones comparables (bucket ≥3 sesiones); sin peso repetido, e1RM al alza ≥2 %; RPE ≤6 adelanta, ≥8 retiene; sin esfuerzo cargado no bloquea.
- **S3** — Escalón: próximo peso ya entrenado (≥2 series en una sesión, ±plato) dentro de ≤15 % → directo; sin conocido → +2,5 % (una placa); conocidos lejanos por escalones sucesivos; cap en el PR.
- **S4** — Propuesta del día = escalada completa por serie (primera = base; distribución uniforme redondeada a placa), aplicada **con un toque** (pesos absolutos sobre pendientes de trabajo; un undo); nunca precarga; se oculta aplicada o igualada; gobernada por «Sugerir carga»; deload suprime (S12 de F118).
- **S5** — Sin evidencia = silencio (el +2,5 % es tamaño de paso, no empuje diario); el chip en vivo deja de empujar subidas (mantiene bajar, descanso, rendimiento, calentamiento).
- **S6** — Freno: velocidad por ejercicio (~2,5 %/semana, ventana 21 días) → consolida (repite, no habilita el próximo escalón); mínimo 3 sesiones en el peso nuevo; desbloqueo al normalizar + mínimo cumplido; NUNCA baja peso (bajar = deload).
- **S7** — Avisos no intrusivos: consolidación = línea inline discreta en el bloque; zona = aviso informativo en la ficha del ejercicio; nada bloquea.
- **S8** — Deload y freno = dos señales de un mismo lugar de decisión; con deload activo se pausa el freno y se suprimen subidas.
- **S9** — Calentamiento: escalera opt-in (apagada de fábrica); NUEVO botón en sesión para una serie a pedido (~45 % del peso de trabajo, editable); la prescripción no inyecta calentamientos.
- **S10** — Bordes: sin historial → silencio; layoff (~3-4 semanas sin el ejercicio) → sin escalones hasta 2 sesiones frescas; la ventana post-layoff ignora datos viejos.
- **S11** — Reglas heredadas F118 intactas: funciona completo sin RPE/RIR; nunca sobrescribir lo que escribió el usuario; acciones absolutas; defaults intactos; calentamientos fuera de cálculos y acciones.

## Tasks

| ID | Specs | Ruta | Estado | Evidencia |
|---|---|---|---|---|
| T1 | S1–S4, S10, S11 | inline | ✅ | commit `7bb73bb` (2 archivos, +315); 20/20 dirigidos + suite 1620/1620 + build/lint limpios; assess RDD: medium / under_budget (sin review) |
| T2 | S6, S10 | inline | ✅ | commit `1de710d` (2 archivos, +208); 34/34 dirigidos + suite 1634/1634 + build/lint limpios; assess slice (248c5b4..1de710d): medium / under_budget (sin review) |
| T3 | S4, S5 | inline | ✅ | commit `5664b20` (12 archivos, +214/−333); 82/82 dirigidos + suite 1624/1624 + build/lint limpios (warnings preexistentes); assess del slice en Log |
| T4 | S4, S5, S7, S9 | inline | ✅ | commit `a7d74d1` (17 archivos, +261/−147; `useLoadSuggestion` eliminado); 69/69 dirigidos + suite 1633/1633 + build/lint limpios (warnings preexistentes); assess slice: medium / under_budget |
| T5 | S7 | inline | ✅ | commit `0934ce9` (5 archivos, +130); 4/4 dirigidos + suite 1637/1637 + build/lint limpios; aviso informativo en la ficha |
| T6 | S2–S10 (e2e/emulador) | inline | ✅ | commit `06456c5` + fix `b26f502` (copia sin «kg» duplicado, TDD e2e RED→GREEN); e2e `test_f122`/`test_f118`/`test_f63` ALL OK; emulador Pixel_10 CDP ALL OK; suite 1637/1637 |

## Log

- **L1 (2026-10-16)** — Pedido original, textual: «vamos a hacer f122, preguntame si es necesario»
- **L2 (2026-10-16)** — Brainstorming (7 rondas): escalada como forma de la propuesta; peso de trabajo protagonista (PR 140 vs entreno 80); evidencia por doble progresión (15×80 vs 10×80) + RPE; freno por tiempo de adaptación de tendones (sin experiencia personal; base en literatura); calentamiento: escalera opt-in + botón de una serie a pedido; propuesta + toque (nunca precarga).
- **L3 (2026-10-16)** — Grilling (2 rondas, todas las recomendaciones aceptadas): evidencia fina, destino/tope del escalón, números del freno, sustitución del «Sugerido», avisos, deload vs freno, alcance; y luego: silencio sin evidencia + chip sin empujes, propuesta completa por serie, layoff, aviso de zona en la ficha.
- **L4 (2026-10-16)** — Spec commiteada (`3196871`) + builder-check (auto; subagente sin permiso en la sesión) con 6 aclaraciones aplicadas.
- **L5 (2026-10-16)** — Plan commiteado (`248c5b4`) y aprobado («dale»); arranca la ejecución inline de T1.
- **L6 (2026-10-16)** — **F122 EJECUTADA COMPLETA (T1–T6)**: commits `7bb73bb` (T1 dominio: base de trabajo, evidencia doble progresión, escalón, escalada), `1de710d` (T2 freno de velocidad + `planDayProposal`), `5664b20` (T3 `applyEscalada` + historial + cableado + silencio del chip), `a7d74d1` (T4 superficies: propuesta, consolidando, botón de calentamiento, i18n; `useLoadSuggestion` eliminado), `0934ce9` (T5 aviso de zona en la ficha), `06456c5` (T6 e2e nuevo + regresiones re-escritas + PLAN/CHANGELOG), `b26f502` (fix de copy). Verificación: suite **1637/1637**, build/lint limpios, e2e `test_f122_progresion_adaptativa.py` ALL OK (escalada+aplicar, silencio, consolidando, calentamiento, sin historial), regresiones `test_f118`/`test_f63` ALL OK, **emulador Pixel_10 por CDP** ALL OK (escalada aplicada en el device, consolidando, calentamiento, 0 pageerror). Assess RDD por hitos: medium/under_budget en todos los cortes (sin review nativo debido). Review final de rama: auto (sin subagentes en la sesión) → encontró y corrigió con TDD la copia con unidad duplicada («80 kg → 90 kg kg»). Rulings: expectativas del sketch recomputadas (base se corre con sesiones pesadas → 92,5/85); T3/T4 sin props sin consumir; `loadProgressionPct` fuera del árbol de props pero vivo como tamaño del micro paso; `useLoadSuggestion`/`buildLoadTargets`/copy de subida eliminados por huérfanos; `escaladaMatches` interno del bloque. Menores diferidos: warnings de lint preexistentes (documentados), escenario «puerta ≥2 series» del e2e f63 retirado por obsoleto, copy de `ajustes.sugerirCargaDesc` sin retocar. Pendiente: **push manual del usuario**; archivo en `COMPLETED.md` al pedido.
- **L7 (2026-10-16)** — **F122 ARCHIVADA en `COMPLETED.md`** (pedido del usuario: «comprueba y documenta que todo esté listo y pasalo a completed»): re-verificación completa post-fix — build exit 0, lint exit 0, suite **1637/1637**, e2e `test_f122`/`test_f118`/`test_f63` ALL OK (el wrapper `with_server.py` falló dos veces por timeout de arranque en la máquina cargada; se corrió con server controlado a mano) y **emulador Pixel_10 por CDP ALL OK con el build corregido** (0 `pageerror`). Fila `122` en la Era 11 de `COMPLETED.md` (commits, verificación y la nota de reviews: assess under_budget, sin review nativo; review final auto con el fix de copy), bloque removido de `PLAN.md` y cabecera de COMPLETED actualizada a 1637 tests. Pendiente único: push manual del usuario.
