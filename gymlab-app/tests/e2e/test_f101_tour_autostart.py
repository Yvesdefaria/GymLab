"""F101 (T1): el tour arranca al cerrar el onboarding en el flujo REAL.

Perfil limpio, SIN sembrar meta: cubre lo que el e2e antiguo simulaba sembrando
`tourPending` a mano. Escenario b (cierre "Ya entreno aquí" del resumen) es la
evidencia RED del bug: antes del fix ese cierre no dejaba el tour pendiente y
ganaba el tip de sección.
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"

TOUR = 'div[role="dialog"][aria-label="Tour guiado de la app"]'
TIP_LABEL = "Primera vez aquí"

READ_META_JS = """async () => {
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


def f101_meta(page):
    raw = page.evaluate(READ_META_JS)
    out = {}
    for key in ("onboardingDone", "tourPending", "tourDone"):
        if key in raw:
            try:
                out[key] = json.loads(raw[key])
            except (TypeError, ValueError):
                out[key] = raw[key]
    return out


def complete_wizard_to_summary(page):
    page.get_by_role("button", name="Español").click()
    page.get_by_role("button", name="Continuar").click()
    page.wait_for_timeout(300)
    page.get_by_role("button", name="Fuerza").click()
    page.get_by_role("button", name="Continuar").click()
    page.wait_for_timeout(300)
    page.get_by_role("button", name="3", exact=True).first.click()
    page.get_by_role("button", name="Gimnasio").click()
    page.get_by_role("button", name="Continuar").click()
    page.wait_for_timeout(300)
    page.get_by_role("button", name="Hombre").click()
    page.get_by_label("Fecha de nacimiento").fill("1996-01-15")
    page.get_by_label("Altura en centímetros").fill("175")
    page.get_by_label("Peso en kg").fill("80")
    page.get_by_role("button", name="Continuar").click()
    page.wait_for_timeout(400)


def tour_visible(page, timeout_ms=7000):
    try:
        page.wait_for_selector(TOUR, state="visible", timeout=timeout_ms)
        return True
    except Exception:  # noqa: BLE001
        return False


def run_scenario_summary(page, errors, button, label):
    page.goto(BASE, wait_until="load")
    page.wait_for_timeout(1000)
    complete_wizard_to_summary(page)
    page.get_by_role("checkbox").check()
    page.get_by_role("button", name=button).last.click()
    if not tour_visible(page):
        errors.append(f"{label}: el tour no abrió al cerrar el resumen con «{button}»")
        return
    if "1 / 13" not in page.locator(TOUR).inner_text():
        errors.append(f"{label}: el tour no arranca en 1 / 13")
    if page.get_by_text(TIP_LABEL).count() != 0:
        errors.append(f"{label}: apareció el tip de sección en lugar del tour")
    meta = f101_meta(page)
    if meta.get("tourPending") is not True:
        errors.append(f"{label}: tourPending no quedó en true ({meta.get('tourPending')!r})")
    if meta.get("onboardingDone") is not True:
        errors.append(f"{label}: onboardingDone no quedó en true")


def run_scenario_escape(page, errors):
    page.goto(BASE, wait_until="load")
    page.wait_for_timeout(1000)
    page.get_by_role("button", name="Español").click()
    # Escape del paso 0: misma etiqueta que el cierre sin rutina del resumen.
    page.get_by_role("button", name="Ya entreno aquí").click()
    page.wait_for_timeout(2000)
    if page.locator(TOUR).count() != 0:
        errors.append("escape: el tour no debe abrir al salir por la X del paso 0")
    meta = f101_meta(page)
    if meta.get("tourPending") is True:
        errors.append("escape: el paso 0 no debe dejar tourPending")
    if meta.get("onboardingDone") is not True:
        errors.append("escape: onboardingDone no quedó en true")


def main():
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        # Escenario a — resumen → "Empezar D1" (con rutina): tour.
        page_a = browser.new_page(viewport={"width": 375, "height": 812})
        console_errors_a = []
        page_a.on(
            "console",
            lambda m: console_errors_a.append(f"console.{m.type}: {m.text}") if m.type == "error" else None,
        )
        page_a.on("pageerror", lambda e: console_errors_a.append(f"pageerror: {e}"))
        try:
            run_scenario_summary(page_a, errors, "Empezar D1", "conRutina")
        except Exception as e:  # noqa: BLE001
            errors.append(f"[escenario a] {e}")
        finally:
            errors.extend(console_errors_a)
            page_a.close()

        # Escenario b — resumen → "Ya entreno aquí" (sin rutina): tour (RED del fix).
        page_b = browser.new_page(viewport={"width": 375, "height": 812})
        console_errors_b = []
        page_b.on(
            "console",
            lambda m: console_errors_b.append(f"console.{m.type}: {m.text}") if m.type == "error" else None,
        )
        page_b.on("pageerror", lambda e: console_errors_b.append(f"pageerror: {e}"))
        try:
            run_scenario_summary(page_b, errors, "Ya entreno aquí", "sinRutina")
        except Exception as e:  # noqa: BLE001
            errors.append(f"[escenario b] {e}")
        finally:
            errors.extend(console_errors_b)
            page_b.close()

        # Escenario c — escape del paso 0: sin tour.
        page_c = browser.new_page(viewport={"width": 375, "height": 812})
        console_errors_c = []
        page_c.on(
            "console",
            lambda m: console_errors_c.append(f"console.{m.type}: {m.text}") if m.type == "error" else None,
        )
        page_c.on("pageerror", lambda e: console_errors_c.append(f"pageerror: {e}"))
        try:
            run_scenario_escape(page_c, errors)
        except Exception as e:  # noqa: BLE001
            errors.append(f"[escenario c] {e}")
        finally:
            errors.extend(console_errors_c)
            page_c.close()

        browser.close()

    if errors:
        print("FALLO:")
        for e in errors:
            print(" -", e)
        return 1
    print("OK: F101 arranque real del tour (Empezar D1, Ya entreno aquí y escape sin tour)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
