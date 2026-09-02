"""Fase 93 #22: sesión rápida del home (QuickTemplates) enlazada a catálogo real.

Verifica:
- En /, el bloque 'Sesión rápida' está presente con los chips de categoría.
- Al arrancar 'Full Body Express', se navega a /entrenamiento/activo.
- La sesión activa muestra los ejercicios con nombres REALES del catálogo
  (p.ej. 'Flexiones', 'Plancha', 'Sentadillas') y NO ids sintéticos
  (sin 'Ejercicio -1', sin nombres de la forma 'quickTemplates.').
- Sin scroll horizontal y sin errores de consola.
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"


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
            page.wait_for_timeout(1200)
            skip = page.locator("button", has_text="Ya entreno aquí")
            if skip.count() > 0:
                skip.first.click(timeout=5000)
                page.wait_for_timeout(800)

            kicker = page.locator("p.kicker", has_text="Sesión rápida")
            if kicker.count() > 0:
                print("OK: bloque 'Sesión rápida' presente en /")
            else:
                errors.append("home: no se ve el bloque 'Sesión rápida'")

            # Chips de categoría
            for label in ("Express", "Stretch", "Movilidad"):
                chip = page.locator("button", has_text=label)
                if chip.count() > 0:
                    print(f"OK: chip de categoría '{label}' presente")
                else:
                    errors.append(f"home: falta el chip de categoría '{label}'")

            # Arrancar Full Body Express
            fb = page.locator("button", has_text="Full Body Express").first
            if fb.count() == 0:
                errors.append("home: no se encuentra la tarjeta 'Full Body Express'")
            else:
                fb.click(timeout=5000)
                page.wait_for_timeout(1500)
                if "/entrenamiento/activo" in page.url:
                    print("OK: navegó a /entrenamiento/activo")
                else:
                    errors.append(f"home: no navegó a sesión activa (url={page.url})")

                # Nombres reales del catálogo visibles en la sesión activa
                active_body = page.inner_text("body")
                expected = ["Flexiones", "Plancha", "Sentadilla con peso corporal"]
                for name in expected:
                    if name in active_body:
                        print(f"OK: ejercicio real '{name}' visible en la sesión")
                    else:
                        errors.append(f"sesión: no se ve el ejercicio real '{name}'")

                # Sin ids sintéticos
                for bad in ("Ejercicio -1", "quickTemplates."):
                    if bad in active_body:
                        errors.append(f"sesión: se ve id sintético/fallback '{bad}'")

            # Sin scroll horizontal en la sesión activa
            sw = page.evaluate("() => document.documentElement.scrollWidth")
            cw = page.evaluate("() => document.documentElement.clientWidth")
            if sw > cw + 5:
                errors.append(f"sesión: scroll horizontal {sw} > {cw}")
            else:
                print("OK: sin scroll horizontal en la sesión")

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
        print("\nALL OK")


if __name__ == "__main__":
    main()
