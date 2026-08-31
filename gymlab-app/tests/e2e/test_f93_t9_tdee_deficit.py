"""Fase 93 #9: tope de déficit calórico a 500 kcal.

Verifica que la calculadora de calorías (/calculadoras/calorias) aplica el tope:
- Con un TDEE alto (hombre 100 kg, 190 cm, 30 años, muy activo) el déficit
  mostrado es TDEE - 500 (no el 20% que superaría el tope).
- El hint refleja el tope ('~20% menos (máx. 500 kcal)').
- 0 errores de consola.
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"

# Mifflin-St Jeor hombre: BMR = 10*100 + 6.25*190 - 5*30 + 5 = 2042.5
# TDEE muy activo (1.9) = round(2042.5 * 1.9) = 3881
TDEE = 3881
EXPECTED_DEFICIT = TDEE - 500  # 3381
HINT_ES = "~20% menos (máx. 500 kcal)"


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

            page.goto(f"{BASE}/calculadoras/calorias", wait_until="networkidle")
            page.wait_for_timeout(1000)

            page.fill("#tdee-edad", "30")
            page.fill("#tdee-peso", "100")
            page.fill("#tdee-altura", "190")
            page.select_option("#tdee-actividad", "muy_intenso")
            page.wait_for_timeout(500)

            body = page.inner_text("body")
            if str(TDEE) not in body:
                errors.append(f"TDEE {TDEE} NO visible en la página")
            else:
                print(f"OK: TDEE {TDEE} visible")

            if str(EXPECTED_DEFICIT) not in body:
                errors.append(f"Déficit tope {EXPECTED_DEFICIT} NO visible (TDEE-500)")
            else:
                print(f"OK: déficit con tope {EXPECTED_DEFICIT} visible")

            if HINT_ES not in body:
                errors.append(f"Hint '{HINT_ES}' NO visible")
            else:
                print(f"OK: hint '{HINT_ES}' visible")

            # El superávit debe ser ~15%: round(3881 * 1.15) = 4463.
            if "4463" not in body:
                errors.append("Superávit 4463 NO visible (15%)")
            else:
                print("OK: superávit 15% visible")

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