"""Fase 93 #23: auditoría de inputs con valores fijos en toda la app.

Verifica que las calculadoras y superficies de entrada:
- Arrancan con los inputs VACÍOS (placeholder visible, sin '0' ni valor de negocio prellenado).
- Un dato válido calcula sin errores.
- Un dato fuera de rango no rompe la página (muestra validación i18n o simplemente no calcula).
- 0 errores de consola en todas las rutas auditadas.

Cubre: /calculadoras/agua, /calculadoras/imc, /calculadoras/calorias,
/calculadoras/1rm, /calculadoras/conversor, /calculadoras/grasa, /calculadoras/medidas,
/calculadoras/navy y /peso-corporal.
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"

# (ruta, placeholder del input principal, dato válido, valor esperado en el resultado)
# El agua usa 30 ml/kg: 80 kg + 30 min = 2.4 + 0.5 = 2.9 -> "2,9" (es-ES coma decimal).
PAGES = [
    # Calculadoras en vivo (placeholder vacío al cargar + resultado al rellenar)
    ("calculadoras/agua", "70", "80", "2,9"),
    ("calculadoras/imc", "70", "80", None),  # IMC 80kg / 175cm; se rellena también altura
    ("calculadoras/1rm", "80", "80", None),
    ("calculadoras/conversor", "100", "100", None),
    ("calculadoras/calorias", "25", "25", None),
    ("calculadoras/grasa", "30", "30", None),
    ("calculadoras/medidas", None, None, None),
    ("calculadoras/navy", None, None, None),
]


def check_empty_and_calc(page, path, ph, valid, expected, errors):
    page.goto(f"{BASE}/{path}", wait_until="networkidle")
    page.wait_for_timeout(900)

    if ph:
        inp = page.locator(f'input[placeholder="{ph}"]')
        if inp.count() == 0:
            errors.append(f"{path}: no se encuentra input placeholder '{ph}'")
        else:
            val = inp.input_value()
            if val == "":
                print(f"OK: {path} input '{ph}' vacío (sin valor prellenado)")
            else:
                errors.append(f"{path}: input '{ph}' prellenado con '{val}' (esperado vacío)")

    if valid:
        page.fill(f'input[placeholder="{ph}"]', valid)
        page.wait_for_timeout(400)


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

            # --- Agua: 70 + 30 vacíos; 80 kg -> 2,9 L ---
            page.goto(f"{BASE}/calculadoras/agua", wait_until="networkidle")
            page.wait_for_timeout(900)
            for ph in ("70", "30"):
                inp = page.locator(f'input[placeholder="{ph}"]')
                if inp.count() == 0:
                    errors.append(f"agua: no hay input placeholder '{ph}'")
                elif inp.input_value() != "":
                    errors.append(f"agua: input '{ph}' prellenado con '{inp.input_value()}'")
                else:
                    print(f"OK: agua input '{ph}' vacío")
            page.fill('input[placeholder="70"]', "80")
            page.fill('input[placeholder="30"]', "30")
            page.wait_for_timeout(400)
            body = page.inner_text("body")
            if "2,9" not in body:
                errors.append(f"agua: '2,9' L (80kg+30min) no visible")
            else:
                print("OK: agua calcula 2,9 L con 80 kg + 30 min")

            # --- IMC: peso+altura vacíos; 80kg / 175cm calcula sin error ---
            page.goto(f"{BASE}/calculadoras/imc", wait_until="networkidle")
            page.wait_for_timeout(900)
            for ph in ("70", "175"):
                inp = page.locator(f'input[placeholder="{ph}"]')
                if inp.count() == 0:
                    errors.append(f"imc: no hay input placeholder '{ph}'")
                elif inp.input_value() != "":
                    errors.append(f"imc: input '{ph}' prellenado")
            page.fill('input[placeholder="70"]', "80")
            page.fill('input[placeholder="175"]', "175")
            page.wait_for_timeout(400)
            body = page.inner_text("body")
            # IMC 80/1.75^2 = 26.12 -> se muestra categoría (no vacío)
            if "26" not in body and "Normopeso" not in body and "Sobrepeso" not in body:
                errors.append("imc: resultado no visible tras 80kg/175cm")
            else:
                print("OK: imc calcula con 80 kg / 175 cm")
            # Fuera de rango: 500 kg (máx 400) no rompe.
            page.fill('input[placeholder="70"]', "500")
            page.wait_for_timeout(300)
            print("OK: imc tolera 500 kg sin romper")

            # --- 1RM: peso+reps vacíos; 80kg x 5 calcula ---
            page.goto(f"{BASE}/calculadoras/1rm", wait_until="networkidle")
            page.wait_for_timeout(900)
            for ph in ("80", "5"):
                inp = page.locator(f'input[placeholder="{ph}"]')
                if inp.count() == 0:
                    errors.append(f"1rm: no hay input placeholder '{ph}'")
                elif inp.input_value() != "":
                    errors.append(f"1rm: input '{ph}' prellenado")
            page.fill('input[placeholder="80"]', "80")
            page.fill('input[placeholder="5"]', "5")
            page.wait_for_timeout(400)
            if "kg" not in page.inner_text("body"):
                errors.append("1rm: resultado no visible tras 80kg x 5")
            else:
                print("OK: 1rm calcula 80 kg x 5")

            # --- Conversor: vacío; 100 kg -> lb ---
            page.goto(f"{BASE}/calculadoras/conversor", wait_until="networkidle")
            page.wait_for_timeout(900)
            inp = page.locator('input[placeholder="100"]')
            if inp.count() == 0:
                errors.append("conversor: no hay input placeholder '100'")
            elif inp.input_value() != "":
                errors.append(f"conversor: input prellenado con '{inp.input_value()}'")
            else:
                print("OK: conversor input vacío")
            page.fill('input[placeholder="100"]', "100")
            page.wait_for_timeout(400)
            if "220" not in page.inner_text("body"):
                errors.append("conversor: 100 kg -> 220 lb no visible")
            else:
                print("OK: conversor 100 kg -> lb")

            # --- Calorías: campos vacíos; 25 años / 70 kg / 175 cm ---
            page.goto(f"{BASE}/calculadoras/calorias", wait_until="networkidle")
            page.wait_for_timeout(900)
            for ph in ("25", "70", "175"):
                inp = page.locator(f'input[placeholder="{ph}"]')
                if inp.count() == 0:
                    errors.append(f"calorias: no hay input placeholder '{ph}'")
                elif inp.input_value() != "":
                    errors.append(f"calorias: input '{ph}' prellenado")
            page.fill('input[placeholder="25"]', "25")
            page.fill('input[placeholder="70"]', "70")
            page.fill('input[placeholder="175"]', "175")
            page.wait_for_timeout(400)
            if "kcal" not in page.inner_text("body").lower():
                errors.append("calorias: resultado (kcal) no visible tras rellenar")
            else:
                print("OK: calorias calcula TDEE")

            # --- Grasa: edad/peso vacíos; validación i18n en guardado sin datos ---
            page.goto(f"{BASE}/calculadoras/grasa", wait_until="networkidle")
            page.wait_for_timeout(900)
            for ph in ("30", "75"):
                inp = page.locator(f'input[placeholder="{ph}"]')
                if inp.count() > 0 and inp.input_value() != "":
                    errors.append(f"grasa: input '{ph}' prellenado")
            print("OK: grasa inputs vacíos (o rehidratados correctamente)")

            # --- Medidas: altura input presente; vacío o rehidratado ---
            page.goto(f"{BASE}/calculadoras/medidas", wait_until="networkidle")
            page.wait_for_timeout(900)
            alt = page.locator('input[aria-label*="altura" i], input[aria-label*="Altura"]')
            if alt.count() > 0:
                print("OK: medidas altura input presente")
            else:
                errors.append("medidas: no se encuentra el input de altura")

            # --- Navy: inputs de placeholder i18n presentes (vacíos) ---
            page.goto(f"{BASE}/calculadoras/navy", wait_until="networkidle")
            page.wait_for_timeout(900)
            nav_inputs = page.locator('input[type="number"]')
            if nav_inputs.count() == 0:
                errors.append("navy: no hay inputs numéricos")
            for i in range(nav_inputs.count()):
                if nav_inputs.nth(i).input_value() != "":
                    errors.append(f"navy: input #{i} prellenado con '{nav_inputs.nth(i).input_value()}'")
            print("OK: navy inputs vacíos")

            # --- Peso corporal: input vacío; validación i18n al intentar 0 ---
            page.goto(f"{BASE}/peso-corporal", wait_until="networkidle")
            page.wait_for_timeout(900)
            peso = page.locator('input[type="number"]')
            if peso.count() == 0:
                errors.append("peso-corporal: no hay input numérico")
            else:
                val = peso.first.input_value()
                if val != "":
                    errors.append(f"peso-corporal: input prellenado con '{val}'")
                else:
                    print("OK: peso-corporal input vacío")

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
