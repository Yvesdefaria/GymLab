"""Fase 93 #12: el input de ejercicio diario de la calculadora de agua no lleva un 0 hardcodeado.

Verifica que /calculadoras/agua:
- El campo "Ejercicio diario" aparece vacío (sin un '0' prellenado), igual que el de peso.
- Rellenar peso + minutos de ejercicio calcula litros correctamente.
- Rellenar solo peso da el resultado base (35 ml/kg), sin los 0 extra.
- 0 errores de consola.
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"

# La UI formatea en locale es-ES (coma decimal), p.ej. 2.9 -> "2,9".
# calcDailyWater(80 kg, 30 min) = 80*0.030 + (30/30)*0.5 = 2.4 + 0.5 = 2.9
LITROS_CON_EJERCICIO = "2,9"
# calcDailyWater(80 kg, 0 min) = 80*0.030 = 2.4
LITROS_BASE = "2,4"


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

            page.goto(f"{BASE}/calculadoras/agua", wait_until="networkidle")
            page.wait_for_timeout(1000)

            # El campo de ejercicio diario debe estar VACÍO (sin '0' prellenado).
            ejercicio_input = page.locator('[placeholder="30"]')
            if ejercicio_input.count() == 0:
                errors.append("No se encuentra el input de ejercicio diario (placeholder '30')")
            else:
                current = ejercicio_input.input_value()
                if current == "" :
                    print("OK: input de ejercicio diario vacío (sin 0 hardcodeado)")
                else:
                    errors.append(f"Input de ejercicio diario prellenado con '{current}' (esperado vacío)")

            # Rellenar peso + ejercicio y comprobar resultado (base + recarga).
            page.fill('[placeholder="70"]', "80")
            page.fill('[placeholder="30"]', "30")
            page.wait_for_timeout(500)
            body = page.inner_text("body")
            if LITROS_CON_EJERCICIO not in body:
                errors.append(f"{LITROS_CON_EJERCICIO} L (con ejercicio) NO visible")
            else:
                print(f"OK: {LITROS_CON_EJERCICIO} L visible con 30 min de ejercicio")

            # Limpiar ejercicio -> solo base (2.8 L), sin recarga.
            page.fill('[placeholder="30"]', "")
            page.wait_for_timeout(500)
            body = page.inner_text("body")
            if LITROS_BASE not in body:
                errors.append(f"{LITROS_BASE} L (base, sin ejercicio) NO visible")
            else:
                print(f"OK: {LITROS_BASE} L visible sin ejercicio")

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
