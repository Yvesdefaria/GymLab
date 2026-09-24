"""F106.2 — guardar en galería (web): descarga de la foto por fecha + toast de confirmación."""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"


def main():
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 375, "height": 812}, accept_downloads=True)
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
            # Sembrar una entrada directa en Dexie para no depender de la captura.
            page.evaluate("""() => new Promise((resolve) => {
              const req = indexedDB.open('GymLabDB');
              req.onsuccess = () => {
                const db = req.result;
                const tx = db.transaction('progressPhotos', 'readwrite');
                tx.objectStore('progressPhotos').put({
                  id: 9901, localDate: '2026-01-01',
                  frontUri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
                  sideUri: null, backUri: null, createdAt: new Date().toISOString(),
                });
                tx.oncomplete = () => resolve(true);
              };
            })""")
            page.reload(wait_until="networkidle")
            page.wait_for_timeout(900)
            with page.expect_download() as dl:
                page.click('[aria-label="Guardar en galería"]')
            download = dl.value
            assert download.suggested_filename.endswith(".jpg"), download.suggested_filename
            page.wait_for_timeout(400)
            assert page.locator("text=Fotos guardadas").count() > 0, "no apareció el toast de guardado"
            print("OK: descarga web + toast")
        except Exception as e:  # noqa: BLE001
            errors.append(str(e))
        finally:
            browser.close()

    if errors:
        print("ERRORS:")
        for e in errors:
            print(f"  - {e}")
        return 1
    print("ALL OK: F106.2 guardar en galería")
    return 0


if __name__ == "__main__":
    sys.exit(main())
