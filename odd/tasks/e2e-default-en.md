# E2E alineados con el default inglés

**Objetivo**: que la suite Playwright refleje el default del producto (inglés) sin perder la cobertura de la variante español.
**Origen**: cambio `17362c61` (`feat: arranca en ingles por defecto (i18n)`) · **Rama**: `default-en` → `main` · **Verificación**: `npm test`, `npm run build` y cada lote e2e.

## Contexto

- `tests/e2e/test_f45.py` ya quedó actualizado: arranca en `en`, cambia a español en Ajustes y verifica la persistencia tras recargar.
- El resto de `tests/e2e/*.py` usa selectores en español (`Continuar`, `Ajustes`, `Ya entreno aquí`, etc.) y/o siembra `meta.settings` sin `language`. Sobre una DB limpia la app ahora arranca en inglés, así que esos tests fallan por locator, no por producto.

## Enfoque sugerido

1. Helper compartido en `tests/e2e/scripts/e2e_utils.py` que siembre `meta.settings.language = 'es'` antes de navegar cuando el test verifica flujos ajenos al idioma: el test sigue midiendo lo suyo y el default no se duplica en ~80 archivos.
2. Los tests que sí miden idioma/onboarding/primer arranque se actualizan al default `en` explícito.
3. Correr en lotes por área y registrar acá qué archivos quedaron cubiertos.

## Tasks

- [ ] T1 — Helper de idioma para e2e (seed de `settings.language`).
- [ ] T2 — Migrar los e2e de onboarding/primer arranque al default `en`.
- [ ] T3 — Migrar el resto por lotes y correr cada lote.
- [ ] T4 — Registrar el cierre en `CHANGELOG.md` y `PLAN.md`.

## Log

- **L1 — pedido del usuario (2026-10-22)**: «ok, anótalo» → queda registrado el pendiente de alinear los e2e con el default inglés.
