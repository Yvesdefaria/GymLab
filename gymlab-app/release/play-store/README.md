# Play Store — upload kit

Generado por `scripts/play_store_assets.py` (Playwright + HTML/CSS). Las capturas
crudas quedan en `raw/` y **no se suben**; Play usa los frames de `screenshots/`.

## Assets

| Archivo | Spec | Uso |
|---|---|---|
| `feature-graphic-es.png` | 1024×500, RGB | Feature graphic ES |
| `feature-graphic-en.png` | 1024×500, RGB | Feature graphic EN |
| `screenshots/es/01-home.png` … `06-perfil.png` | 1080×1920, RGB | 6 capturas ES |
| `screenshots/en/01-home.png` … `06-perfil.png` | 1080×1920, RGB | 6 capturas EN |
| `listing-es.md` | — | Título, corta, larga, novedades |
| `listing-en.md` | — | Título, corta, larga, novedades |

- Ratio de capturas: 1080/1920 = **0.5625** (≤ 2:1).
- Icono de la app: `public/icon-512.png` (512×512), ya existe.
- Datos de demo: perfil «Alex», entrenos y pesos ficticios. No hay datos reales.
- En las capturas EN, los nombres de ejercicios/rutinas del catálogo siguen en
  español porque el contenido de datos está en español; la interfaz sí está en inglés.

## Orden recomendado en Play Console

1. `01-home` — plan de hoy, racha y semana.
2. `02-estadisticas` — volumen, racha y progreso.
3. `03-rutinas` — planificador y rutinas.
4. `04-ejercicios` — catálogo y técnica.
5. `05-calculadoras` — 8 calculadoras.
6. `06-perfil` — marcas, historial y datos.

## Cómo regenerar

```powershell
cd "C:\Users\Yves De Faria\Desktop\ProyectoGymLab\gymlab-app"
npm run preview -- --port 4173   # en otra terminal
python scripts/play_store_assets.py
```

El script limpia el estado del navegador (contexto nuevo), recorre el onboarding,
siembra datos de demo, captura ES/EN y valida dimensiones/formato.

## Antes de subir

- [ ] Desplegar WebGymLab con la política 29/10 (pseudónimos y OFF por defecto).
- [ ] Subir `android/app/build/outputs/bundle/release/app-release.aab` al testing interno.
- [ ] Completar Data Safety y Health apps (`docs/PLAY-STORE-DATA-SAFETY.md`).
- [ ] Revisar la ficha en ES/EN y el orden de capturas.
- [ ] Confirmar que el keystore y `keystore.properties` están respaldados.
