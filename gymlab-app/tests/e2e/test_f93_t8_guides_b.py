"""Fase 93 #8 (Lote B): técnicas para sesiones cortas + rutinas enriquecidas.

Verifica que tras el reseed (SEED_VERSION 17->18):
- La nueva guía 'Práctica: técnicas para sesiones cortas' aparece en /guias y abre su detalle.
- Las descripciones enriquecidas de las 6 rutinas de un solo día (pecho-15, espalda-casa,
  abs-principiante, pierna-express, gluteo-express, brazos-hombros) se muestran en el detalle.
- 0 errores de consola.
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"

NEW_GUIDE_TITLE = "Práctica: técnicas para sesiones cortas"
GUIDE_DETAIL_HINTS = ["Serie gigante", "15 minutos", "Prioridad en zona muscular"]

# Fragmentos de las descripciones enriquecidas (ES) de las 6 rutinas.
ENRICHED_ROUTINE_HINTS = {
    "pecho-15": "días con poco tiempo",
    "espalda-casa": "mancuernas y peso corporal",
    "abs-principiante": "aumenta las repeticiones",
    "pierna-express": "cuando completes todas las repeticiones",
    "gluteo-express": "hip thrust y zancadas",
    "brazos-hombros": "volumen a los brazos",
}


def main():
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 375, "height": 812})
        page = context.new_page()
        console_errors = []
        page.on("console", lambda m: console_errors.append(f"console.{m.type}: {m.text}") if m.type == "error" else None)
        page.on("pageerror", lambda e: console_errors.append(f"pageerror: {e}"))

        try:
            page.goto(BASE, wait_until="networkidle")
            page.wait_for_timeout(1500)

            skip_ob = page.locator("button", has_text="Ya entreno aquí")
            if skip_ob.count() > 0:
                skip_ob.first.click(timeout=5000)
                page.wait_for_timeout(800)

            # 1) Nueva guía visible y su detalle.
            page.goto(f"{BASE}/guias", wait_until="networkidle")
            page.wait_for_timeout(1200)
            body = page.inner_text("body")
            if NEW_GUIDE_TITLE not in body:
                errors.append(f"Guía '{NEW_GUIDE_TITLE}' NO visible en /guias")
            else:
                print("OK: guía 'Práctica: técnicas para sesiones cortas' visible en /guias")

            page.locator(f"text={NEW_GUIDE_TITLE}").first.click(timeout=5000)
            page.wait_for_timeout(1000)
            detail = page.inner_text("body")
            missing_hints = [h for h in GUIDE_DETAIL_HINTS if h not in detail]
            if missing_hints:
                errors.append(f"Detalle de la guía sin hints: {missing_hints}")
            else:
                print("OK: detalle de la guía incluye serie gigante, 15 minutos y prioridad en zona")

            # 2) Descripciones enriquecidas de las 6 rutinas.
            for slug, hint in ENRICHED_ROUTINE_HINTS.items():
                page.goto(f"{BASE}/rutinas/{slug}", wait_until="networkidle")
                page.wait_for_timeout(900)
                rd = page.inner_text("body")
                if hint not in rd:
                    errors.append(f"Rutina '{slug}': hint enriquecido NO visible -> '{hint}'")
                else:
                    print(f"OK: '{slug}' muestra description enriquecida")

        except Exception as e:
            errors.append(f"Exception: {e}")
        finally:
            if console_errors:
                errors.extend(console_errors)
            page.close()
            browser.close()

    if errors:
        print("ERRORS:")
        for e in errors:
            print(f"  - {e}")
        sys.exit(1)
    else:
        print("ALL OK")


if __name__ == "__main__":
    main()
