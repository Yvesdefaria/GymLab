"""F127: el tour de primer arranque no compite con el modal de logros.

Escenario real: el wizard completa el peso → `cuerpo-primer-peso` se desbloquea
~600 ms después (debounce de useAchievements) → el modal montaba junto al tour.
Dos `aria-modal` a la vez se roban el foco y el velo del logro tapa la app que
el tour está señalando. Regla: mientras el tour está abierto el logro espera;
al cerrar el tour, se celebra.
"""
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"

TOUR = 'div[role="dialog"][aria-label="Tour guiado de la app"]'
ACH = '[role="dialog"][aria-labelledby="achievement-modal-title"]'
ACH_TITLE = "Autoconocimiento"


def complete_wizard_to_summary(page):
    # El default del producto pasó a inglés (F127 corre sobre ese main): el chip
    # se llama "Spanish" o "Español" según el idioma activo al abrir el wizard.
    page.get_by_role("button", name=re.compile("Español|Spanish")).click()
    page.get_by_role("button", name="Continuar").click()
    page.wait_for_timeout(300)
    page.get_by_role("button", name="Fuerza").click()
    page.get_by_role("button", name="Continuar").click()
    page.wait_for_timeout(300)
    page.get_by_role("button", name=re.compile("^3 días")).click()
    page.get_by_role("button", name="Continuar").click()
    page.wait_for_timeout(300)
    page.get_by_role("button", name=re.compile("^Gimnasio")).click()
    page.get_by_role("button", name="Continuar").click()
    page.wait_for_timeout(300)
    page.get_by_role("button", name="Hombre").click()
    page.get_by_label("Nombre", exact=True).fill("Ana")
    page.get_by_role("button", name="Continuar").click()
    page.wait_for_timeout(300)
    page.get_by_label("Fecha de nacimiento").fill("1996-01-15")
    page.get_by_label("Altura en centímetros").fill("175")
    # El peso dispara `cuerpo-primer-peso`: es el logro del escenario.
    page.get_by_label("Peso en kg").fill("80")
    page.get_by_role("button", name="Continuar").click()
    page.wait_for_timeout(400)


def read_meta(page):
    raw = page.evaluate(
        """async () => {
          const db = await new Promise((res, rej) => {
            const r = indexedDB.open('GymLabDB');
            r.onsuccess = () => res(r.result);
            r.onerror = () => rej(r.error);
          });
          const rows = await new Promise((res, rej) => {
            const q = db.transaction('meta', 'readonly').objectStore('meta').getAll();
            q.onsuccess = () => res(q.result);
            q.onerror = () => rej(q.error);
          });
          return Object.fromEntries(rows.map((r) => [r.key, r.value]));
        }"""
    )
    out = {}
    for key in ("unlockedAchievements", "onboardingDone", "tourPending", "tourDone"):
        if key in raw:
            try:
                out[key] = json.loads(raw[key])
            except (TypeError, ValueError):
                out[key] = raw[key]
    return out


def main():
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 375, "height": 812})
        page_errors = []
        page.on("pageerror", lambda e: page_errors.append(f"pageerror: {e}"))

        try:
            page.goto(BASE, wait_until="load")
            page.wait_for_timeout(1000)
            complete_wizard_to_summary(page)
            page.get_by_role("checkbox").check()
            page.get_by_role("button", name="Empezar D1").last.click()

            page.wait_for_selector(TOUR, state="visible", timeout=7000)
            # El logro se evalúa tras el debounce de 600 ms: se le da margen.
            page.wait_for_timeout(1600)

            if page.locator(TOUR).count() != 1:
                errors.append("el tour dejó de estar visible con el logro desbloqueado")
            if page.locator(ACH).count() != 0:
                errors.append("el modal de logros se montó durante el tour")
            meta = read_meta(page)
            if "cuerpo-primer-peso" not in (meta.get("unlockedAchievements") or []):
                errors.append(
                    f"el logro del escenario no se persistió: {meta.get('unlockedAchievements')!r}"
                )

            page.get_by_role("button", name="Saltar tour").click()
            page.wait_for_selector(ACH, state="visible", timeout=4000)
            if ACH_TITLE not in page.locator(ACH).inner_text():
                errors.append("el logro retenido no se celebró al cerrar el tour")
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
    print("OK: F127 el logro espera al tour y se celebra al cerrarlo")
    return 0


if __name__ == "__main__":
    sys.exit(main())
