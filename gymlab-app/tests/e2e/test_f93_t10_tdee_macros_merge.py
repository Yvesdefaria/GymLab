"""Fase 93 #10: unificación de TDEE y macros en una sola página.

Verifica que /calculadoras/calorias es ahora la página unificada:
- Muestra TDEE (mantenimiento), déficit, superávit.
- Muestra macros: calorías objetivo, proteína, carbohidratos y grasas.
- /calculadoras/macros redirige a /calculadoras/calorias.
- El hub ya no muestra la tarjeta 'Macros' (solo 'Calorías y macros').
- 0 errores de consola.
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"

# Hombre, 80 kg, 180 cm, 30 años, moderado (1.55).
# BMR = 10*80 + 6.25*180 - 5*30 + 5 = 1780; TDEE = round(1780*1.55) = 2759.
# Déficit: 20% = 552 > 500 -> 2759-500 = 2259. Superávit: round(2759*1.15) = 3173.
# Mantenimiento: macros calorias = 2759, proteina = round(80*1.8) = 144.
TDEE = 2759
DEFICIT = 2259
SUPERAVIT = 3173
MACROS_CAL = 2759
PROTEINA = 144


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

            # 1) /calculadoras/calorias es la página unificada (TDEE + macros).
            page.goto(f"{BASE}/calculadoras/calorias", wait_until="networkidle")
            page.wait_for_timeout(1000)
            page.fill("#tdee-edad", "30")
            page.fill("#tdee-peso", "80")
            page.fill("#tdee-altura", "180")
            page.select_option("#tdee-actividad", "moderado")
            page.wait_for_timeout(500)

            body = page.inner_text("body")
            for label, val in [("TDEE", str(TDEE)), ("déficit", str(DEFICIT)), ("superávit", str(SUPERAVIT)), ("calorías objetivo", str(MACROS_CAL)), ("proteína", str(PROTEINA))]:
                if val not in body:
                    errors.append(f"{label} {val} NO visible en /calculadoras/calorias")
                else:
                    print(f"OK: {label} {val} visible")

            # 2) /calculadoras/macros redirige a /calculadoras/calorias.
            page.goto(f"{BASE}/calculadoras/macros", wait_until="networkidle")
            page.wait_for_timeout(800)
            url = page.url
            if url.endswith("/calculadoras/calorias"):
                print("OK: /calculadoras/macros redirige a /calculadoras/calorias")
            else:
                errors.append(f"/calculadoras/macros NO redirige (url={url})")

            # 3) El hub ya no muestra la tarjeta 'Macros' separada.
            page.goto(f"{BASE}/calculadoras", wait_until="networkidle")
            page.wait_for_timeout(1000)
            hub = page.inner_text("body")
            macros_card = page.locator("a[href='/calculadoras/macros']")
            if macros_card.count() > 0:
                errors.append("Hub aún muestra tarjeta enlazando a /calculadoras/macros")
            else:
                print("OK: hub sin tarjeta /calculadoras/macros")
            if "Calorías y macros" not in hub:
                errors.append("Hub sin tarjeta 'Calorías y macros'")
            else:
                print("OK: hub muestra 'Calorías y macros'")

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