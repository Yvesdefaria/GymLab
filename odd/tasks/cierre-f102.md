# Cierre F102 — Auditoría de inputs (UX, formato y caracteres)

**Objetivo**: cerrar F102 al 100% y archivarla en `COMPLETED.md`: comprobación funcional del estado actual + el review formal del rango completo (102.8, único ítem abierto) + archivo de la fase.

## Contexto (2026-10-11)

- F102 implementada 2026-09-27 (worktree `gymlab-f102`, rebase al mergear: los hashes citados en el PLAN — `a156974`, `9dcabb1`, `bbca971`, `9203629`, `6050f19` — son **pre-rebase** y NO son ancestros de `main`; quedaron colgando).
- **Rango vivo de F102 en `main`** (base `be94c9f` «docs: archivar F99» → `ad02c0b`): `9151648` (sanitizer) → `0489516` (filtro al pintar) → `5024e62` (entero corta en el separador) → `35a7c4d` (migración a `DecimalInput`) → `7621bf7` (duración cardio `:`) → `689d9f5` (e2e locators) → `497de53` (docs PLAN/CHANGELOG) → `ad02c0b` (docs pendientes + AGENTS). 35 archivos, +591/−362.
- El **slice** tuvo review formal el 2026-09-28 (`review-4df3dd70db021eb4`, approved + acknowledged vía CLI): hallazgos R3-1 (WARNING) + R3-2/R3-3 (SUGGESTION). R3-1 se corrigió en 102.7 (`9e733b1`, review `review-51872f455c135a78`, approved + acknowledged).
- **102.8** = review formal del rango COMPLETO (nunca corrido: cap de 32k de OpenCode). Con el tooling v2 ya operativo: candidato = `be94c9f..ad02c0b` vía worktree temporal en `ad02c0b` + `assess`/`status --base-ref be94c9f --committed-only`.

## Tareas

- [x] T1 — Verificación funcional HECHA (2026-10-11): `npm test` **144 archivos / 1455 tests** ✓; `npm run build` **exit 0** ✓; e2e **6/6 OK**: t23 (ALL OK), f98_enter_chain (exit 0; su contrato imprime la línea `OK: F98.4`), t12_agua y t11_b_one_rm (ALL OK), f84b_pasos (ALL OK) y **t27 (walk del wizard reparado, `7fc2d07`; review `review-e2c64f9f9e1e9a95` approved + acknowledged)**. Nota: las corridas en frío fallaban por el `networkidle` de Vite sin pre-calentar → re-verificado con server caliente (puerto 5251).
- [x] T2 — Review 102.8 HECHO (2026-10-11): rango `be94c9f..ad02c0b` congelado en worktree temporal `f102-close` (assess medium: 35 paths / 953 líneas, `slice_budget_reached`); consent del usuario → granted; reviewer reliability → 0 bloqueantes; **approved + acknowledged** (`review-a260684302fb04cc`, authority burned). 4 advisories informativos (R3-001 cubierto por 102.7; R3-002..004 parkeados en `102.followups`).
- [x] T3 — Cierre HECHO (2026-10-11): sección F102 eliminada de PLAN (36 líneas; parking `102.followups` en «Seguimiento de reviews») y archivada en `COMPLETED.md` (Era 10, fila con hashes vivos + ambas revisiones + verificación). Commit docs `63e573f` (sin push).

## Evidencia

- Suite completa: `npm test` 144/1455 PASSED (2026-10-11).
- Build: `npm run build` exit 0 (2026-10-11).
- E2E: 6/6 OK — t23/f98/t12/t11b/f84b verdes; t27 reparado (`7fc2d07`, review `review-e2c64f9f9e1e9a95` approved + acknowledged) y ALL OK.
- Review 102.8: `review-a260684302fb04cc` approved + acknowledged (authority burned; 4 advisories informativos parkeados).

## Convenciones

review nativo ANTES de commit (switch global ON) · commit sin push · stage de rutas exactas · docs-only pasivo sin review · CHANGELOG al día.

## Notas de cierre (2026-10-11)

- **e2e con Vite frío**: las corridas iniciales fallaban con `Page.goto … networkidle` (timeout 30 s) — `with_server.py` solo espera TCP, no la optimización de deps de Vite. Receta verificada: levantar un `npm run dev -- --port 52XX --strictPort` propio, pre-calentar con un goto de timeout largo y correr los tests **directos** con `python -u tests/e2e/test_*.py` (`$env:E2E_PORT`), sin wrapper.
- **Review de un rango viejo (committed)**: worktree temporal anclado en el commit cima + `assess`/`status --base-ref <commit base> --committed-only` → candidato = exactamente el rango F102. Receta reutilizable para fases con hashes pre-rebase.
- **Wizard de onboarding (mapa para futuros e2e)**: `canNext` exige idioma → objetivo → **días** → perfil válido (altura/peso por `input[inputmode="decimal"]`, fecha y sexo); está montado app-wide (`AppShell`) y solo cierra con `finish()`: «Ya entreno aquí» (paso 1, sin tour) / «Ya entreno aquí» del Resumen o «Empezar D1» (ambos con tour); al escribir el perfil salta el logro **Autoconocimiento** (modal z-[130]) → dismiss con `[role="dialog"][aria-labelledby="achievement-modal-title"]` (patrón f98/f99).
- **Hashes pre-rebase** (fases viejas): los del ciclo original no son ancestros de `main` y no aparecen en `git log --all`; los vivos salen por mensaje (`--grep`) o por la cadena del worktree original.
