# GymLab App

Aplicación de entrenamiento local-first (Vite + React + TypeScript + Dexie).

## Licencia

Propietaria — **All Rights Reserved**. El código es público para consulta (*source-available*), pero **no** es open source: se prohíbe usar, copiar, modificar o redistribuir el software sin permiso escrito. Ver `LICENSE` en la raíz del repo. El material de terceros conserva sus propios términos (ver abajo).

## Fuentes de imágenes

Las fotos de referencia de los ejercicios (`public/exercises/*/0.jpg`, `1.jpg`) provienen de [free-exercise-db](https://github.com/yuhonas/free-exercise-db), dataset publicado bajo **Unlicense (dominio público)**: uso libre, también comercial, sin atribución obligatoria.

El catálogo completo (873 ejercicios, 1.746 fotos) se sembra desde `src/data/seed/exercises.ts` (52 curados) y `src/data/seed/exercisesCatalog.ts` (821 extra). Los nombres del catálogo extra están en español híbrido: los ejercicios con traducción fiable se traducen; los técnicos/complejos se mantienen en inglés.

Los placeholders SVG (`public/exercises/placeholders/`) son propios del proyecto.

---

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
