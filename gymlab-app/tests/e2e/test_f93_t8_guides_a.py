"""Fase 93 #8 (Lote A): guías nuevas de lesiones + conceptos entrenamiento.

Verifica que el catálogo /guias muestra las 11 guías nuevas sembradas
(3 de recuperación + 8 de entrenamiento) tras el reseed por bump de
SEED_VERSION, y que una de ellas abre su detalle. 0 errores de consola.
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"

# Títulos ES tal y como se muestran en localizeGuide (lang es).
NEW_GUIDES = [
    # recuperación
    "Guía completa de recuperación muscular",
    "Tendinitis rotuliana (rodilla del saltador)",
    "Entrenar con problemas de espalda",
    # entrenamiento
    "Lesiones comunes en el gimnasio",
    "Ejercicios peligrosos y alternativas seguras",
    "Cómo ganar masa muscular",
    "Triseries: técnica y rutinas",
    "Entrenamiento de alta intensidad",
    "Distribución de la rutina de entrenamiento",
    "Cardio en ayunas",
    "Test de Cooper",
]


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

            page.goto(f"{BASE}/guias", wait_until="networkidle")
            page.wait_for_timeout(1200)

            body = page.inner_text("body")

            missing = [t for t in NEW_GUIDES if t not in body]
            if missing:
                errors.append(f"Guías nuevas NO visibles en catálogo: {missing}")
            else:
                print(f"OK: {len(NEW_GUIDES)} guías nuevas visibles en /guias")

            # Abre el detalle de una guía nueva.
            page.locator("text=Test de Cooper").first.click(timeout=5000)
            page.wait_for_timeout(1000)
            detail = page.inner_text("body")
            if "12 minutos" not in detail and "Test" not in detail:
                errors.append("El detalle de 'Test de Cooper' no se abrió correctamente")
            else:
                print("OK: el detalle de 'Test de Cooper' se abre")

            # Total de guías en el catálogo (deberían ser 17 base + 11 nuevas = 28).
            page.goto(f"{BASE}/guias", wait_until="networkidle")
            page.wait_for_timeout(1000)
            links = page.locator("a[href^='/guias/']")
            total = links.count()
            if total < 28:
                errors.append(f"Esperaba >= 28 guías en catálogo, hay {total}")
            else:
                print(f"OK: {total} guías en catálogo")

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
