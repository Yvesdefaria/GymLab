# Actualización de tooling y dependencias — oct 2026

**Estado:** COMPLETO (2026-10-11). Único pendiente: **reinicio de OpenCode**.
**Autorización del usuario:** «…v4 de gentle ai y engram, skills, etc» · «ya puedes continuar» · «saltate el paso de comprobar… dedicate a actualizar todo lo que dijimos antes» (2026-10-11) → verificación pesada y review nativo del lote npm OMITIDOS a pedido del usuario.
**Ámbito:** directorio principal, sin worktree. Stage de rutas exactas; commits sin push.

## Bloques

- [x] **A — Lote WIP (advisories)**: cerrado por otra sesión antes de empezar (lote 10: `0a3a048` + `00dbf04` + `1524bb8`, review `review-651d1fe508f2c023` approved + ack). Nada que hacer.
- [x] **B — npm minors/patches**: `npm update` → commit `10adb68` (package-lock 1548+/1463−, ~25 paquetes; added 24 / removed 20 / audited 676). Verificado: build OK, lint OK, suite **1452/1452**, smoke F103 **43/43**, `assembleDebug` OK (emulador). Emulador CDP + review nativo: omitidos (pedido del usuario). Majors restantes → PLAN **Fase 121**.
- [x] **C — Skills**: superpowers **v6.3.0 → v7.0.0** → commit `b07bf9e` (repo `.opencode/skills` 7 dirs con contenido nuevo + app `gymlab-app/.agents/skills` + ambos locks + `/.agents/` al gitignore; las 5 "sin cambios" verificadas byte-idénticas a v7). Marketing skills re-sync a main → commit `815d7c7` (472 archivos). Global/home actualizado con `npx skills update -g` (12 skills). Nota: `npx skills update` sin `-g` crashea al salir (assert libuv, cosmético — posterior al trabajo).
- [x] **D — Docs**: commit `8e7abf8` — `AGENTS.md`: sección SDD → **ODD** (según repo gentle-ai v4) + versión v4.0.0; `CHANGELOG` (deps + tooling + F121); `PLAN.md`: **Fase 121** (mayores una por una).
- [x] **E — gentle-ai v4.0.0**: `go install .../gentle-ai/v4/cmd/gentle-ai@v4.0.0` + `gentle-ai sync` (29 archivos; backup automático en `~/.gentle-ai/backups/20261011082502.441721300`). `gentle-ai doctor` → **8/8 healthy**.
- [x] **F — engram**: core Go v2.0.0 → **v3.3.2** (`go install .../engram/v3/cmd/engram@v3.3.2`; sin lock, el MCP real no usa ese binario). Backup del vault en `~/.engram-backups/2026-10-11-pre-v3` (file-copy de `~/.engram`; el `export` lógico dio vacío por store distinto — el CLI Go usa `engram.db`, las 649 memorias viven en `default.db` del SDK). **El sync de v4 pisó la entrada MCP del `opencode.json` del proyecto** (quedó como `node.exe mcp --tools=agent`, sin apuntar a ningún script) → **restaurada la entrada probada**: `node …engram-sdk\dist\mcp.js` + env (model/key), validada con parse JSON. El MCP real del proyecto = `engram-sdk@0.7.1` (npm, ya en latest) sobre `~/.engram/default.db`.
- [ ] **G — Cierre**: **reiniciar OpenCode** (carga prompts/plugins v4 + assets synced). Post-reinicio esperado: engram con las 649 memorias (`default.db`), skills v7, doctor healthy.

## Notas operativas

- `gentle-ai sync` futuro puede volver a pisar la entrada engram del proyecto → revisar post-sync. Receta de restauración: extraer el bloque de `~/.gentle-ai/backups/<ts>/snapshot.tar.gz` → `files/Users/.../ProyectoGymLab/opencode.json`.
- El binario Go de engram quedó v3.3.2 pero su store (`engram.db`) NO es el del MCP: no confundir al leer `engram stats`.
- Skills: la ubicación canónica del CLI es `<raíz>/.agents/skills` (ignorada en git); las copias versionadas viven en `.opencode/skills` (raíz) y `gymlab-app/.agents/skills` (app), ambas actualizadas a v7.
