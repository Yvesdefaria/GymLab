# Spec — 132.7 Aprender: biblioteca, guías, papers y calculadoras (Nocturno Minimal)

> Rama `132.7-aprender` (worktree `.worktrees/132.7-aprender`, multisesión pedida por el usuario).
> Referencia visual aprobada: `.superpowers/brainstorm/132.7-aprender-20261025/content/aprender-direcciones-v1.html`
> (biblioteca A, hub B, guías/papers A, calculadoras result-hero y ficha de ejercicio).
> Diseño base: `docs/design/NOCTURNO-MINIMAL.md` §10.7, §11, §12 y `docs/design/README.md`.

## 1. Objetivo

Migrar las 16 rutas de **Aprender** a Nocturno Minimal sin perder datos, funciones ni contratos e2e:
`/ejercicios` y su ficha, `/guias` y su detalle, `/papers` y su detalle, el hub `/calculadoras` y las ocho
calculadoras. La estructura de información se conserva; cambia la composición visual: un solo héroe por
pantalla, hairline en vez de tarjeta, Oswald liviano para los números y un único acento semántico.

## 2. Decisiones cerradas (2026-10-25)

| # | Decisión | Respuesta del usuario |
|---|---|---|
| Q1 | Biblioteca de ejercicios | **A** — índice editorial: letras A–Z como estructura, filas hairline, rail alfabético, sin cajas por fila. |
| Q2 | Hub de calculadoras | **B** — grilla de tiles hairline (2 columnas) con búsqueda y recientes; sin agrupación por familia. |
| Q3 | Guías y papers | **A** — índice numerado + guía destacada; papers con el mismo lenguaje editorial. |
| Q4 | Interior de calculadoras | **OK** — patrón «result hero» de §10.7: inputs hairline, número héroe, desglose, disclaimer. |
| Q5 | Ficha de ejercicio | **OK** — media como héroe; preparada para que en el futuro la foto sea un **video de ~3 s**. |

## 3. Alcance

**Dentro:** `EjerciciosPage`, `EjercicioDetailPage`, `GuiasPage`, `GuiaDetailPage`, `PapersPage`,
`PaperDetailPage`, `CalculadorasPage`, `ImcPage`, `CaloriasPage`, `OneRepMaxPage`, `AguaPage`,
`ConversorPage`, `MedidasCorporalesPage`, `GrasaCorporalPage`, `NavyPage` + `NavyCalculator`; componentes
compartidos de calculadoras y de la ficha; i18n es/en; tests unitarios y e2e; docs de diseño, `PLAN.md`,
`CHANGELOG.md` y el task doc ODD.

**Fuera:** rutas nuevas, cambios de router, datos, modelos, repositorios, migraciones o tokens. No se toca
`/mas` ni el TabBar (el enlace a `/papers` sigue ausente del hub, como hoy). No se agrega el video: solo se
deja el componente de media listo para recibirlo.

## 4. Biblioteca de ejercicios (`/ejercicios`)

### 4.1 Shell

- `AppHeader` con kicker `Aprender`, título `Ejercicios` y conteo `{count}` a la derecha.
- `BackLink to="/mas"`.
- Búsqueda con debounce de 150 ms y filtros existentes (`ExerciseFilterBar`, `hideEquipment`) sin cambios
  de comportamiento. Chips y búsqueda en una sola banda; sin contenedor de tarjeta.
- Lista virtualizada intacta (ventana, `ROW_HEIGHT`, scroll a letra). Cada sección alfabética abre con la
  letra en Oswald 300 30 px dorada + conteo en muted. Fila: favorito, nombre + meta
  (`músculo · equipo · categoría`), «+» para añadir a rutina. Sin `panel-flush`.
- `AlphaRail` se conserva a la derecha, con el mismo contrato (`data-tour`, aria labels y letras).
- Estados vacíos honestos: sin resultados de búsqueda y catálogo vacío.
- El rail no tapa los botones: la lista reserva el gutter derecho.

## 5. Ficha de ejercicio (`/ejercicios/:slug`)

- Media como héroe: bloque 4:3 a sangre con scrim; controles de volver y favorito flotan arriba.
- `ExerciseMedia` evoluciona a `ExerciseMediaHero` con la misma API de imagen y un `videoUrl?` opcional:
  si existe, renderiza `<video muted loop playsInline poster={imageUrl}>` con `preload="metadata"` y
  `aria-label`; si no, la imagen actual. **Hoy no hay datos de video: se sigue viendo la imagen.**
- Título Oswald 29 px + meta (`músculo · equipo · categoría`), stat row de 3 columnas (1RM estimado, PR
  actual, sesiones), gráfica e1RM de 104 px sin `ChartCard`, técnica numerada, músculos con barras finas de
  color de datos, nota personal y CTA «Añadir a rutina».
- Se preservan `ExercisePrCard`, `E1rmChart`, `ExerciseTechniqueCard`, `ExerciseMuscleCard`,
  `ExerciseNoteCard` y `buildZoneAdvisories`; solo cambia su contenedor visual.
- El PR y el registro de recientes no cambian.

## 6. Guías (`/guias`, `/guias/:slug`)

- Índice: header `Aprender / Guías` + conteo; chips de categoría existentes; **destacada** = primera guía
  del orden canónico de categorías (desempate por orden del repositorio); debajo, «Todas las guías» con
  índice `01`, `02`… en Oswald, eyebrow de categoría dorado, título y resumen de una línea.
- La destacada se excluye de la lista numerada para no duplicar. Con una sola guía, la destacada es esa y
  la lista queda vacía con su propio estado.
- Detalle: título Oswald 31 px, meta (`categoría · min de lectura · actualizado`), «Ideas clave» numeradas,
  secciones con hairlines, cuerpo a 13 px/1.65 y disclaimer final. Sin `panel-light`.
- El texto se sigue renderizando como texto plano (sin HTML). No se agregan campos al modelo.

## 7. Papers (`/papers`, `/papers/:slug`)

- Índice: header `Aprender / Papers` + conteo; disclaimer compacto; chips de tema; filas hairline con tema
  en eyebrow dorado, año a la derecha, título, autores/fuente y «Ver en PubMed» como ghost link (no botón
  lleno). Sin tarjetas.
- Detalle: título, tema + año, autores, DOI si existe, resumen, puntos clave, CTA de fuente oficial como
  ghost y disclaimer. Sin `panel-light`.
- Se conservan los enlaces externos (`target="_blank"`, `rel`) y el literal «PubMed».

## 8. Hub de calculadoras (`/calculadoras`)

- Header `Aprender / Herramientas` + conteo; búsqueda actual; recientes en chips; **grilla 2×2 de tiles
  hairline** con las 8 calculadoras (ícono dorado, nombre y descripción corta). Sin `CalculatorCard` con
  `panel-light`.
- `PlateCalculatorRow` queda como utilidad al final, con su modal intacto.
- Disclaimer informativo al pie. El redirect `/calculadoras/macros` no se enlaza desde el hub.

## 9. Calculadoras (`/calculadoras/*`)

- Primitivas nuevas en `src/components/calculators/`:
  - `CalculatorShell`: header + back a `/calculadoras`, kicker, título, meta opcional y contenido.
  - `CalculatorField`: fila hairline con label, valor y unidad; mantiene `aria` y el foco visible.
  - `CalculatorResult`: eyebrow, número héroe Oswald 300 56–64 px, unidad, clasificación y nota.
  - `CalculatorSection`: header de sección hairline con meta opcional.
  - `CalculatorDisclaimer`: texto muted de 9.5 px.
- Cada calculadora conserva su lógica, prefill, persistencia y textos:
  - **IMC**: altura/peso, héroe `24,1`, clasificación, escala OMS de 4 segmentos y desglose de rango.
  - **Calorías y macros**: sexo/edad/peso/altura/actividad/objetivo, héroe de mantenimiento, rango de
    déficit/superávit, macros con barras finas.
  - **1RM**: selector de ejercicio, peso/reps, héroe, comparación Epley/Brzycki y récord PR.
  - **Agua**: peso/actividad, héroe en ml y vasos como discos.
  - **Conversor**: modo kg→lb / lb→kg, héroe con el valor convertido y el par completo.
  - **Medidas**: `BodyLogLayout` + secciones hairline por zona; guardar hoy; sin `panel-light` interno.
  - **Grasa**: `BodyLogLayout` + héroe de % + clasificación, pliegues, último registro y gráfica.
  - **Navy**: héroe de % + clasificación, inputs hairline.
- **i18n obligatorio:** las etiquetas de dominio que hoy devuelven español (`imcCategoryLabel`,
  `nivelActividadLabel`, `macroObjetivoLabel`, clasificación Navy, zonas corporales y pliegues) se resuelven
  con claves es/en en la UI; el dominio no devuelve copy. El default del producto sigue siendo inglés.

## 10. Accesibilidad y temas

- Touch targets ≥ 44×44 px; foco visible; `aria-label` en iconos y controles.
- `prefers-reduced-motion` respetado: sin animaciones nuevas que no lo consulten.
- Noche + día + las 6 paletas: usar tokens (`text-gold`, `text-success`, `border-border/40`), sin colores
  hardcodeados en clases de UI.
- Escalas, barras y gráficas con `aria-label`/texto, no solo color.
- Estados vacíos honestos; no se inventan datos ni se pintan meses futuros.

## 11. Contratos que no se rompen

- Rutas y redirect `/calculadoras/macros`.
- `localStorage['gymlab.recentCalculators']` (máx. 3), favoritos y recientes de ejercicios, PRs en Dexie.
- Selectores e2e existentes: `a[href^='/ejercicios/']`, `a[href^='/guias/']`, `a[href^='/papers/']`,
  `AlphaRail`, chips `Comunes/Favoritos/Mi equipamiento`, labels de inputs de calculadoras, 44 px.
- Disclaimers de calculadoras y guías/papers.
- `useSeo` vía `AppHeader`; analytics `screen_view` y `calculator_opened` (slugs de un segmento).

## 12. Verificación

1. `npm run build` limpio (typecheck real).
2. `npm test` verde (suite completa).
3. e2e nuevo `tests/e2e/test_f132_7_aprender.py` en 375 y 768, 0 `pageerror`, con capturas en
   `tests/screenshots/`.
4. E2E existentes en verde, comparando contra el baseline de `main`:
   `test_f93_t8_guides_*`, `test_f93_t19_alpha_library`, `test_f93_t20_technique`, `test_f93_t23_inputs`,
   `test_f93_t10_tdee_macros_merge`, `test_f93_t11_b_one_rm`, `test_f93_t12_agua_input`,
   `test_f93_t13_medidas_opcionales`, `test_f103_smoke`, `test_rutas_multi_segmento`, `test_t11`.
   `test_f103_smoke` ya está rojo en `main` (bug de reset de DB): se documenta, no se cuenta como regresión.
5. Review nativo por candidato antes de cada commit; sin push.

## 13. Entrega

Tres work-unit commits + uno de docs, en la rama `132.7-aprender`; merge `--ff-only` a `main` solo cuando
las otras sesiones estén idle. Sin push.
