# 132.8 — Sistema (Ajustes, Términos y Privacidad) · Nocturno Minimal

Objetivo: migrar `/ajustes`, `/terminos` y `/privacidad` al lenguaje Nocturno
Minimal sin perder funciones, datos ni cobertura de tests.
Rama: `132.8-sistema` (worktree aislado). Runner: `npm run build`, `npm test`,
e2e Python (`tests/e2e/scripts/with_server.py`).

## Specs

- **S1.** `/ajustes` usa grupos hairline: un `h2` por grupo (eyebrow Barlow 600,
  10 px, mayúsculas, tracking 0.2em, color muted), filas de ≥44 px y una línea
  superior por grupo. Cero `panel-light` / `panel-hero` / `panel-chart` como
  contenedor.
- **S2.** Los controles siguen operativos y accesibles: `role="switch"` con
  `aria-checked` en todas las preferencias booleanas, selectores nativos para
  idioma/unidades/formato, y `#reporte-descripcion` + `#reporte-email` en el
  formulario de reporte.
- **S3.** El tema es un control segmentado (Noche/Día) y las 6 paletas son
  discos en una sola fila; ambos aplican `data-theme` / `data-palette` a
  `<html>` y se revierten.
- **S4.** «Zona de peligro» es el último grupo, en rojo, con el aviso antes de
  la acción destructiva. `Resetear a estado de fábrica` sigue abriendo
  `reset-info-title` → `reset-confirm`.
- **S5.** F101 punto 4 se mantiene: «Volver a ver el tour» queda visible sin
  scroll a 375×812. Por eso Ayuda va justo después de Apariencia.
- **S6.** `/terminos` y `/privacidad` conservan el índice plegable (`details` >
  `summary` + `ol > a`), las secciones `section#{id}` con `h2` y párrafos, y el
  link `mailto:`. El email se renderiza una sola vez: el propio texto
  interpolado es el link.
- **S7.** Las secciones legales se numeran `01`..`N` en Oswald y el cuerpo va
  en Barlow; cero cajas de color.
- **S8.** i18n es/en completo: `ajustes.tema`, `ajustes.paleta`,
  `ajustes.series`, `ajustes.legal`, `ajustes.telemetryActivar`. Todo título
  legal en inglés difiere del español (regresión de «Permisos del dispositivo»).
- **S9.** Sin scroll horizontal en 375 ni en 768; en tablet Ajustes se centra a
  `max-w-xl`.

## Tasks

- **T1 · Primitivas** — `SettingsUI` (eyebrow, fila, switch, select y número
  planos). Route: inline. Commit `a76673ee`.
- **T2 · Grupos de preferencias** — Apariencia (tema segmentado + paleta en
  discos), Sesión, Series (nuevo, separado de Sesión), Notificaciones, General,
  Ayuda, Datos, Sistema (telemetría + reporte), Legal y Zona de peligro.
  Route: inline. Commit `a76673ee`.
- **T3 · Página** — orden final, ancho máximo en tablet, filas legales y pie.
  Route: inline. Commit `a76673ee`.
- **T4 · Legales** — `LegalArticle` hairline con secciones numeradas y
  `LegalContact` que linkea el email sin duplicarlo. Route: inline.
  Commit `a76673ee`.
- **T5 · Fixes de contenido** — EN «Device permissions»; email duplicado.
  Route: inline. Commit `a76673ee`.
- **T6 · Tests** — unit `legal.test.ts` (paridad de títulos es≠en) y e2e
  `test_132_8_sistema.py` en 375 y 768. Route: inline. Commit `a76673ee`.

## Log

**L1 (pedido original, verbatim):**
> activa multisesion, quiero que hagas 132.8 — Sistema (pendiente), si es
> necesario usa grillme para preguntas importante, ademas usa mockups para
> mostrarme el resiultado

**L2 — decisión de estructura.** Tres mockups en el compañero visual
(`.superpowers/brainstorm/132.8-sistema/`): A filas con control inline, B fila
con valor + hoja inferior, C índice + subpáginas. El usuario eligió **A**.
C queda fuera de alcance: agrega rutas que 132.8 no pedía.

**L3 — constraints descubiertos antes de escribir.**
- `test_f93_t27` localiza `section` por el texto «Datos de uso anónimos»: el
  contenedor de página NO puede ser `section` y cada grupo tiene su propio
  `section`.
- `test_f93_t29` exige un `h2` con «Reportar un error» y chips
  `button[aria-pressed]`; el formulario no se puede colapsar.
- `test_f81_import` exige un `button` accesible «Importar datos».
- `test_f93_t26` exige `details`/`summary`/`details ol a`/`section#{id}`/`h2`.
- `legal.test.ts` exige que `contacto.cuerpo` contenga `{{email}}`.

**L4 — regresión encontrada y corregida.** El primer orden movía Ayuda al
puesto 7; `test_f101_tour` falló («queda fuera del viewport sin scroll»). En
`main` el mismo test pasa. Ayuda vuelve al puesto 2 y el e2e nuevo fija la
restricción con una aserción de viewport.

**L5 — baseline honesto (rojo en `main`, no causado por 132.8).**
`test_f93_t26_legal`, `test_f93_t29_report_bug`, `test_f81_import`,
`test_f112_reset` y `test_pulido_home_mas_ajustes` fallan igual en `main`
porque el default de producto es inglés y esos tests buscan copy en español
(el diálogo de idioma del onboarding intercepta el primer click).

**L6 — evidencia.** `npm run build` limpio; `npm test` 202 archivos / 1877
tests verdes (un timeout de `PerfilPage` en una corrida previa que pasa
aislado: flake por carga). `test_132_8_sistema.py` verde en 375 y 768;
`test_f101_tour.py` y `test_f93_t27_telemetry.py` verdes.

**L7 — review nativo `review-67e8784dca857616` (medium, lente reliability).**
Un reviewer, un refuter y un validador dirigido. Encontró 7 hallazgos; solo
R3-1 era bloqueante (CRITICAL, determinista, introducido) y el refuter lo
corroboró. Corrección acotada (52 líneas declaradas, presupuesto 200): el
helper de capturas anunciaba `--port` en el docstring y leía solo `E2E_PORT`.
Ahora usa `argparse` (`--port`, `--out`) y se probó que el flag manda:
`--port 5998` sin server → `ERR_CONNECTION_REFUSED` en 5998 y exit 1, así que
ya no puede reportar `OK` contra el server equivocado. Validador dirigido:
aprobado. **`approved` + `acknowledged`** (authority burned).

Advisories informativos del review (no bloquean, quedan para otra pasada):

- **R3-2** — `LegalContact` parte el texto por `CONTACT_EMAIL` y asume una sola
  aparición; con dos correos se pierde el resto del párrafo. El e2e solo cuenta
  links mailto.
- **R3-3** — el e2e nuevo no pulsa «Resetear a estado de fábrica» ni comprueba
  que abra el sheet; solo mide su altura.
- **R3-4** — esperas fijas (600/700/250/350 ms) en el e2e en vez de condiciones
  observables.
- **R3-5** — `DangerZoneSection` compone `text-danger` sobre `settingsRowClass`,
  que ya trae `text-fg`: Tailwind resuelve por orden de CSS generado, no por
  orden de clase. Conviene una clase de fila destructiva propia.
- **R3-6** — `GRUPOS` no verifica el orden real ni que la zona de peligro sea
  el último grupo.
- **R3-7** — el e2e legal no afirma `section h2` ni párrafos, solo el prefijo
  numérico.




**L8 — rebase, merge y cierre (2026-10-26).** `main` había avanzado con F132.6 y
F132.7 (`968816fd`). El rebase aplicó el commit de código sin conflictos y el de
docs chocó en `CHANGELOG.md` y `docs/design/README.md`: se conservaron las
entradas de 132.6 y 132.7 y la de 132.8 quedó primera (mergea última). F132.6 y
F132.7 ya usaban «§22» en el manual de diseño, así que la sección de esta fase
se renumeró a **§23** (y se corrigieron las referencias).

Tras el rebase el e2e nuevo falló con «Apariencia aparece 0 veces»: el bundle
creció y las esperas fijas de 600 ms dejaban la página sin montar. Se
reemplazaron por condiciones observables (root montado, primer grupo visible,
`data-theme`/`data-palette` aplicados, `details` abierto y hash de la URL), lo
que además cierra el advisory **R3-4**. Verificado con tres corridas seguidas en
verde. Commit `c287b7f8`.

`gentle-ai review assess --base-ref 968816fd --committed-only` sobre el cambio
combinado devolvió `medium / under_budget` (`review_due: false`). Merge
fast-forward a `main` (`c287b7f8`) y worktree cerrado. Post-merge: build limpio
y **202 archivos / 1877 tests**.
