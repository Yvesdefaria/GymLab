"""Fase 93 #13: campos mínimos vs opcionales en medidas corporales y grasa.

Verifica que:
- Grasa (Jackson-Pollock): los pliegues del protocolo de 3 se marcan como mínimos y los
  del protocolo de 7 como opcionales, según sexo:
  * Hombre: opcionales = tríceps, subescapular, suprailíaco, axilar (4).
  * Mujer: opcionales = pectoral, subescapular, abdominal, axilar (4).
- Medidas (cinta métrica): cintura y caderas se marcan mínimas; el resto opcional.
- 0 errores de consola.
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"

OPC = "Opcional"
MIN = "Mínimo"


def count_badges(page, text):
    "Cuenta las veces que el text aparece dentro de un span badge."
    return page.locator("span", has_text=text).count()


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

            # --- Página de grasa (défault: hombre) ---
            page.goto(f"{BASE}/calculadoras/grasa", wait_until="networkidle")
            page.wait_for_timeout(1200)
            body = page.inner_text("body")
            if OPC not in body:
                errors.append(f"Badge '{OPC}' NO visible en grasa (hombre)")
            if MIN not in body:
                errors.append(f"Badge '{MIN}' NO visible en grasa (hombre)")
            # El hint de opcionales debe verse.
            if "protocolo de 7" not in body:
                errors.append("Hint de pliegues opcionales NO visible en grasa")

            # Hombre: 4 opcionales (tríceps, subescapular, suprailíaco, axilar) y 3 mínimos.
            opc_male = page.locator("label", has=page.locator("span", has_text=OPC)).count()
            min_male = page.locator("label", has=page.locator("span", has_text=MIN)).count()
            if opc_male != 4:
                errors.append(f"Grasa hombre: esperaba 4 opcionales, vi {opc_male}")
            if min_male != 3:
                errors.append(f"Grasa hombre: esperaba 3 mínimos, vi {min_male}")

            # --- Cambiar sexo a mujer y recargar (el SexSelector persiste en meta) ---
            # El selector usa botones/chips de texto "Mujer".
            mujer = page.locator("button", has_text="Mujer")
            if mujer.count() > 0:
                mujer.first.click()
                page.wait_for_timeout(600)
            body = page.inner_text("body")
            opc_female = page.locator("label", has=page.locator("span", has_text=OPC)).count()
            min_female = page.locator("label", has=page.locator("span", has_text=MIN)).count()
            if opc_female != 4:
                errors.append(f"Grasa mujer: esperaba 4 opcionales, vi {opc_female}")
            if min_female != 3:
                errors.append(f"Grasa mujer: esperaba 3 mínimos, vi {min_female}")

            # --- Página de medidas corporales ---
            page.goto(f"{BASE}/calculadoras/medidas", wait_until="networkidle")
            page.wait_for_timeout(1200)
            body = page.inner_text("body")
            if OPC not in body:
                errors.append(f"Badge '{OPC}' NO visible en medidas")
            if MIN not in body:
                errors.append(f"Badge '{MIN}' NO visible en medidas")
            if "Cintura y caderas" not in body:
                errors.append("Hint de medidas mínimas NO visible en medidas")

            # Cintura y caderas mínimas (2); el resto (16) opcionales.
            min_count = page.locator("label", has=page.locator("span", has_text=MIN)).count()
            opc_count = page.locator("label", has=page.locator("span", has_text=OPC)).count()
            if min_count != 2:
                errors.append(f"Medidas: esperaba 2 mínimas (cintura, caderas), vi {min_count}")
            if opc_count != 16:
                errors.append(f"Medidas: esperaba 16 opcionales, vi {opc_count}")

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