# Play Store — ficha y assets de la tienda

**Objetivo**: dejar listos los assets y textos de la ficha de Google Play (ES/EN) para subirlos cuando la cuenta esté disponible.
**Rama**: `main` (sin worktree). **Entrega**: `gymlab-app/release/play-store/` + copy en `release/play-store/listing-es.md` / `listing-en.md`; commit local, sin push.
**Runner**: Playwright Python (capturas), build de Vite ya generado en `dist/`.

## Specs

- **S1 — Feature graphic**: PNG exacto **1024×500**, sin alfa, ES y EN, con la marca GymLab (fondo `#121214`, acento `#D9B384`, Oswald/Barlow).
- **S2 — Screenshots**: 6 por idioma, PNG o JPEG, **320–3840 px**, ratio **≤ 2:1**, sin datos personales ni UI de test. Capturas reales de la app a 375×667 (raw 750×1334) y frame editorial 1080×1920.
- **S3 — Textos**: título ≤ 30, descripción corta ≤ 80, descripción larga ≤ 4.000, “Novedades” y categoría/tags en ES/EN. Sin “best/#1/free”, sin emojis, sin promesas médicas.
- **S4 — Verificación**: dimensiones/formato/alfa por script; las 6 rutas capturadas montan (`#root`), sin overlays y con datos de demo; la ficha usa `https://gymlab.dev/privacidad`.

## Tasks

- **T1** — Feature graphic ES/EN. ✅ `release/play-store/feature-graphic-{es,en}.png` 1024×500 RGB.
- **T2** — Capturas reales + frame ES/EN. ✅ 6 por idioma, 1080×1920 RGB; raw 750×1500 en `raw/` (ignorado).
- **T3** — Textos ES/EN + categoría/tags + novedades. ✅ `listing-es.md` / `listing-en.md`; títulos 26/24, cortas 69/68, largas 1400/1329.
- **T4** — Verificación de specs y revisión visual. ✅ `verify_play_store_assets.py`: 2 features, 12 screenshots, ratio ≤2:1, RGB. Revisadas home, stats, rutinas, ejercicios, calculadoras y perfil.
- **T5** — Actualizar `PLAN.md` (Fase 130 / Ficha) y CHANGELOG. ✅

## Log

- **L1 (2026-10-29)** — Pedido del usuario: «ok dale» a la ficha de Play (feature graphic + capturas + textos ES/EN). Se parte de `public/icon-512.png`, `logo_*.svg`, fuentes Barlow/Oswald y la app en `http://localhost:4173`.
- **L2 (2026-10-30)** — Assets generados con `scripts/play_store_assets.py`: features 1024×500 ES/EN; 6 capturas por idioma a 375×750 (raw 750×1500) y frame editorial 1080×1920; datos demo «Alex» (12 entrenos, 4 semanas de racha, 6 PRs). Textos ES/EN con límites verificados. `PLAN.md` Fase 130 marca la ficha como lista; falta subirla a Play Console.

