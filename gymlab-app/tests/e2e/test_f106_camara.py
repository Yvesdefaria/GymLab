"""F106.1 — captura web: el input file sigue funcionando tras el refactor a plugin Camera."""
import base64
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"

# PNG 1x1 válido para set_input_files.
PNG_1X1 = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
)


def main():
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 375, "height": 812})
        page.on(
            "console",
            lambda m: errors.append(f"console.{m.type}: {m.text}") if m.type == "error" else None,
        )
        page.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))
        try:
            page.goto(BASE, wait_until="networkidle")
            page.wait_for_timeout(700)
            skip_ob = page.locator("button", has_text="Ya entreno aquí")
            # En arranque frío el wizard puede montar después del primer wait.
            try:
                skip_ob.first.wait_for(state="visible", timeout=15000)
            except Exception:  # noqa: BLE001 — ya onboarded: no hay botón que pulsar
                pass
            if skip_ob.count() > 0:
                skip_ob.first.click(timeout=5000)
                # El cierre persiste el flag de forma asíncrona (import del locale en frío):
                # esperar a que el wizard desaparezca evita navegar en medio de la escritura
                # y que el onboarding vuelva a abrirse y tape los clics siguientes.
                page.locator('[role="dialog"][aria-label="Idioma"]').wait_for(
                    state="detached", timeout=20000
                )
                page.wait_for_timeout(300)
            page.goto(f"{BASE}/progreso-fotos", wait_until="networkidle")
            page.wait_for_timeout(800)

            assert page.locator("text=Frente").count() > 0, "no está la captura de Frente"

            page.locator('input[type="file"]').first.set_input_files(
                {"name": "frente.png", "mimeType": "image/png", "buffer": PNG_1X1}
            )
            page.wait_for_timeout(800)

            assert page.locator("img").count() > 0, "la foto capturada no apareció en el timeline"
            print("OK: captura web por input file")
        except Exception as e:  # noqa: BLE001
            errors.append(str(e))
        finally:
            browser.close()

    if errors:
        print("ERRORS:")
        for e in errors:
            print(f"  - {e}")
        return 1
    print("ALL OK: F106.1 captura web")
    return 0


if __name__ == "__main__":
    sys.exit(main())
