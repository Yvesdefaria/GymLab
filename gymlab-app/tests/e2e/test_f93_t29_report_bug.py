"""Fase 93 #29: formulario de reporte de errores en Ajustes.

Verifica en /ajustes que la sección «Reportar un error»:
- Muestra la sección con su título y el selector de tipo (chips con aria-pressed).
- Con descripción corta, al enviar, muestra el error con role="alert".
- Con descripción válida (+ email opcional), al enviar, muestra el mensaje de
  éxito (reporteEnviado) y lanza un mailto a CONTACT_EMAIL con el reporte
  preformateado (el mailto no navega la página: se captura el request y se
  verifica que el mensaje de éxito sigue visible).
- 0 errores de consola.
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from urllib.parse import unquote

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"

CONTACT_EMAIL = "gymlab@app.gymlab.dev"
SHORT_DESC = "corto"
VALID_DESC = "La app se cierra al registrar"
VALID_EMAIL = "user@x.com"


def main():
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 375, "height": 812})
        page = context.new_page()
        console_errors = []
        page.on("console", lambda m: console_errors.append(f"console.{m.type}: {m.text}") if m.type == "error" else None)
        page.on("pageerror", lambda e: console_errors.append(f"pageerror: {e}"))

        # Captura el mailto lanzado por el formulario (la URL del request);
        # un mailto no navega la página, así que el éxito sigue visible.
        mailtos = []
        page.on("request", lambda r: mailtos.append(r.url) if r.url.startswith("mailto:") else None)

        try:
            page.goto(BASE, wait_until="networkidle")
            page.wait_for_timeout(1500)

            skip_ob = page.locator("button", has_text="Ya entreno aquí")
            if skip_ob.count() > 0:
                skip_ob.first.click(timeout=5000)
                page.wait_for_timeout(800)

            # --- Ajustes: sección de reporte visible ---
            page.goto(f"{BASE}/ajustes", wait_until="networkidle")
            page.wait_for_timeout(1200)

            if page.locator("h2", has_text="Reportar un error").count() == 0:
                errors.append("Sección «Reportar un error» no visible en /ajustes")

            chips = page.locator('button[aria-pressed]', has_text="Error")
            if chips.count() == 0:
                errors.append("Chip de tipo «Error» no visible (sin aria-pressed)")

            textarea = page.locator("#reporte-descripcion")
            if textarea.count() == 0:
                errors.append("Textarea de descripción no presente")

            # --- Descripción corta → error role="alert" ---
            textarea.fill(SHORT_DESC)
            page.locator("button", has_text="Enviar reporte").click()
            page.wait_for_timeout(400)
            alert = page.locator('[role="alert"]')
            if alert.count() == 0:
                errors.append("No se mostró el error role=alert con descripción corta")
            elif "al menos 10 caracteres" not in page.locator('[role="alert"]').inner_text():
                errors.append("El texto del error de validación no es el esperado")

            # --- Descripción válida + email opcional → éxito y mailto ---
            textarea.fill(VALID_DESC)
            page.locator("#reporte-email").fill(VALID_EMAIL)
            page.locator("button", has_text="Enviar reporte").click()
            page.wait_for_timeout(400)

            status = page.locator('[role="status"]')
            if status.count() == 0:
                errors.append("No se mostró el mensaje de éxito (reporteEnviado)")
            elif "Gracias" not in status.inner_text():
                errors.append("El texto de éxito no es el esperado")

            last_mailto = mailtos[-1] if mailtos else None
            if not last_mailto:
                errors.append("No se lanzó ningún mailto (sin request mailto: capturado)")
            else:
                if not last_mailto.startswith(f"mailto:{CONTACT_EMAIL}"):
                    errors.append(f"mailto no apunta a {CONTACT_EMAIL}: {last_mailto}")
                if "subject=" not in last_mailto or "body=" not in last_mailto:
                    errors.append(f"mailto sin subject/body: {last_mailto}")
                decoded = unquote(last_mailto)
                if VALID_DESC not in decoded:
                    errors.append(f"El cuerpo del reporte no incluye la descripción: {decoded}")
                if VALID_EMAIL not in decoded:
                    errors.append(f"El cuerpo del reporte no incluye el email de contacto: {decoded}")

        except Exception as e:
            errors.append(f"Exception: {e}")
        finally:
            if console_errors:
                errors.extend(console_errors)
            page.close()
            context.close()
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
