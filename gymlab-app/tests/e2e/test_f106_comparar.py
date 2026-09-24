"""F106.2 — comparador de fotos de progreso (web): fechas, ángulos y modos dividida/alternar."""
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
            page.goto(f"{BASE}/progreso-fotos/comparar", wait_until="networkidle")
            page.wait_for_timeout(800)

            # Sembrar 2 fechas: A con frontal + lateral, B solo frontal.
            page.evaluate("""() => new Promise((resolve) => {
              const req = indexedDB.open('GymLabDB');
              req.onsuccess = () => {
                const db = req.result;
                const tx = db.transaction('progressPhotos', 'readwrite');
                const store = tx.objectStore('progressPhotos');
                const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
                store.put({ id: 9901, localDate: '2026-01-01', frontUri: png, sideUri: png, backUri: null, createdAt: new Date().toISOString() });
                store.put({ id: 9902, localDate: '2026-02-01', frontUri: png, sideUri: null, backUri: null, createdAt: new Date().toISOString() });
                tx.oncomplete = () => resolve(true);
              };
            })""")
            page.reload(wait_until="networkidle")
            page.wait_for_timeout(1000)

            assert page.locator("select").count() == 2, "faltan los selects de fecha"
            assert page.locator("img").count() >= 2, "el modo dividido no muestra las dos fotos"
            assert page.locator("text=Dividida").count() > 0

            page.click("text=Lateral")
            page.wait_for_timeout(400)
            assert page.locator("text=Sin foto").count() > 0, "no aparece el placeholder sin foto"

            page.click("text=Alternar")
            page.wait_for_timeout(400)
            page.click('[aria-label="Alternar"]')
            page.wait_for_timeout(300)
            assert page.locator("text=B ·").count() > 0, "el toggle A/B no cambió a B"
            print("OK: comparador (fechas, ángulos, modos)")
        except Exception as e:  # noqa: BLE001
            errors.append(str(e))
        finally:
            browser.close()

    if errors:
        print("ERRORS:")
        for e in errors:
            print(f"  - {e}")
        return 1
    print("ALL OK: F106.2 comparador web")
    return 0


if __name__ == "__main__":
    sys.exit(main())
