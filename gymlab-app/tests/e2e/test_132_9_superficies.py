"""F132.9 — superficies sin ruta: globo del tour y replay desde Ajustes.

Cubre lo que el rediseño no debe romper:
- el tour sigue arrancando solo con `tourPending` y muestra el contador `1 / 13`;
- el globo tiene el eyebrow «Paso» y el spotlight;
- «Volver a ver el tour» de Ajustes lo reabre sin tocar el onboarding.
"""
import os
import re
import sys

sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"

TOUR = (
    'div[role="dialog"][aria-label="App guided tour"], '
    'div[role="dialog"][aria-label="Tour guiado de la app"]'
)
SPOTLIGHT = '[data-testid="tour-spotlight"]'
SKIP = re.compile("Skip tour|Saltar tour")
NEXT = re.compile("Next|Siguiente")
REPLAY = re.compile("Replay the tour|Volver a ver el tour")

SEED = """async () => {
  const db = await new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  await new Promise((res, rej) => {
    const tx = db.transaction(['meta'], 'readwrite');
    tx.objectStore('meta').put({ key: 'onboardingDone', value: true });
    tx.objectStore('meta').put({ key: 'tourPending', value: true });
    tx.objectStore('meta').put({ key: 'tourDone', value: false });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  return true;
}"""


def main():
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 375, "height": 812})
        page_errors = []
        page.on("pageerror", lambda e: page_errors.append(f"pageerror: {e}"))

        try:
            page.goto(BASE, wait_until="load")
            page.wait_for_timeout(1200)
            page.evaluate(SEED)
            page.reload(wait_until="load")
            page.wait_for_timeout(1200)

            page.wait_for_selector(TOUR, state="visible", timeout=7000)
            text = page.locator(TOUR).inner_text()
            if "1 / 13" not in text:
                errors.append(f"el tour no arranca en 1 / 13: {text!r}")
            if "PASO" not in text.upper() and "STEP" not in text.upper():
                errors.append("el globo no muestra el eyebrow de paso")

            # El primer paso no tiene ancla (bienvenida); el spotlight aparece desde el 2.
            page.get_by_role("button", name=NEXT).click()
            page.wait_for_timeout(500)
            if page.locator(SPOTLIGHT).count() == 0:
                errors.append("el spotlight del tour no se montó en el paso con ancla")

            page.get_by_role("button", name=SKIP).click()
            page.wait_for_timeout(500)
            if page.locator(TOUR).count() != 0:
                errors.append("el tour no se cerró con «Saltar tour»")

            page.goto(f"{BASE}/ajustes", wait_until="load")
            page.wait_for_timeout(900)
            replay = page.get_by_role("button", name=REPLAY)
            if replay.count() == 0:
                errors.append("Ajustes no muestra la fila de replay del tour")
            else:
                replay.click()
                page.wait_for_selector(TOUR, state="visible", timeout=5000)
                if "1 / 13" not in page.locator(TOUR).inner_text():
                    errors.append("el replay del tour no arranca en 1 / 13")
                page.get_by_role("button", name=SKIP).click()
        except Exception as e:  # noqa: BLE001
            errors.append(str(e))
        finally:
            errors.extend(page_errors)
            page.close()
            browser.close()

    if errors:
        print("FALLO:")
        for e in errors:
            print(" -", e)
        return 1
    print("OK: F132.9 tour hairline, spotlight y replay desde Ajustes")
    return 0


if __name__ == "__main__":
    sys.exit(main())
