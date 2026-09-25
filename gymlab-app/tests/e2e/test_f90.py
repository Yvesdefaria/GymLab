"""F90: ayuda contextual — InfoTip accesible y tips migrados (fase 90.1).

Casos:
 1. Medidas (/calculadoras/medidas): el «?» abre el diálogo; Escape lo cierra y
    devuelve el foco al disparador; la X lo cierra; un tap afuera lo cierra.
 2. Viewport 320x568: el popover queda dentro del viewport.
 3. Perfil (/perfil) con programa sembrado: tip de deload interpolado (10%) y
    el switch de deload sigue funcionando (el hit-area 44px no lo roba).
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"

SEED_APP_JS = """async () => {
  const openDb = () => new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const db = await openDb();
  await new Promise((res, rej) => {
    const tx = db.transaction(['meta'], 'readwrite');
    tx.objectStore('meta').put({ key: 'onboardingDone', value: true });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  return true;
}"""

SEED_PROGRAM_JS = """async () => {
  const openDb = () => new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const db = await openDb();
  const today = new Date().toISOString().slice(0, 10);
  await new Promise((res, rej) => {
    const tx = db.transaction(['activeProgram'], 'readwrite');
    tx.objectStore('activeProgram').clear();
    tx.objectStore('activeProgram').put({
      id: 1,
      routineId: 1,
      startDate: today,
      weekdays: [new Date().getDay()],
      createdAt: `${today}T00:00:00.000Z`,
    });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  return true;
}"""

TITLE_MEDIDAS = "Para qué registrar medidas"
TITLE_DELOAD = "Qué es la semana de deload"


def boot(page):
    page.goto(BASE, wait_until="networkidle")
    page.wait_for_timeout(700)
    assert page.evaluate(SEED_APP_JS) is True, "seed app failed"
    page.reload(wait_until="networkidle")
    page.wait_for_timeout(900)
    skip = page.locator("button", has_text="Ya entreno aquí")
    if skip.count() > 0:
        skip.first.click(timeout=5000)
        page.wait_for_timeout(600)


def open_tip(page, label):
    trigger = page.get_by_role("button", name=label)
    trigger.click(timeout=5000)
    dialog = page.get_by_role("dialog")
    dialog.wait_for(state="visible", timeout=5000)
    return trigger, dialog


def run_info_tip(page, errors):
    """Caso 1 y 2: comportamiento del InfoTip en /calculadoras/medidas."""
    page.goto(f"{BASE}/calculadoras/medidas", wait_until="networkidle")
    page.wait_for_timeout(600)

    # Abrir + Escape cierra y devuelve el foco.
    _, dialog = open_tip(page, TITLE_MEDIDAS)
    assert "Mide siempre" in dialog.inner_text(), "body del tip no visible"
    page.keyboard.press("Escape")
    dialog.wait_for(state="hidden", timeout=5000)
    focused = page.evaluate("document.activeElement?.getAttribute('aria-label')")
    assert focused == TITLE_MEDIDAS, f"foco tras Escape: {focused}"

    # La X cierra.
    _, dialog = open_tip(page, TITLE_MEDIDAS)
    dialog.get_by_role("button", name="Cerrar").click(timeout=5000)
    dialog.wait_for(state="hidden", timeout=5000)

    # Un tap afuera cierra.
    _, dialog = open_tip(page, TITLE_MEDIDAS)
    page.mouse.click(10, 400)
    dialog.wait_for(state="hidden", timeout=5000)

    # Viewport chico: el popover queda dentro del viewport.
    page.set_viewport_size({"width": 320, "height": 568})
    page.wait_for_timeout(300)
    _, dialog = open_tip(page, TITLE_MEDIDAS)
    box = dialog.bounding_box()
    assert box is not None, "popover sin bounding box"
    assert box["x"] >= 0 and box["y"] >= 0, f"popover fuera: {box}"
    assert box["x"] + box["width"] <= 320 and box["y"] + box["height"] <= 568, f"popover fuera: {box}"
    page.keyboard.press("Escape")
    page.set_viewport_size({"width": 375, "height": 812})


def run_deload_tip(page, errors):
    """Caso 3: tip migrado con interpolación + switch intacto."""
    assert page.evaluate(SEED_PROGRAM_JS) is True, "seed program failed"
    page.reload(wait_until="networkidle")
    page.wait_for_timeout(900)
    page.goto(f"{BASE}/perfil", wait_until="networkidle")
    page.wait_for_timeout(600)

    _, dialog = open_tip(page, TITLE_DELOAD)
    assert "reduce el peso (10%)" in dialog.inner_text(), dialog.inner_text()
    page.keyboard.press("Escape")

    sw = page.get_by_role("switch", name="Activar semana de deload")
    assert sw.get_attribute("aria-checked") == "false"
    sw.click(timeout=5000)
    page.wait_for_timeout(400)
    assert sw.get_attribute("aria-checked") == "true"


def main():
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 375, "height": 812})
        page = context.new_page()
        console_errors = []
        page.on(
            "console",
            lambda m: console_errors.append(f"console.{m.type}: {m.text}") if m.type == "error" else None,
        )
        page.on("pageerror", lambda e: console_errors.append(f"pageerror: {e}"))
        try:
            boot(page)
            run_info_tip(page, errors)
            run_deload_tip(page, errors)
        except Exception as e:  # noqa: BLE001
            errors.append(f"Exception: {e}")
        finally:
            errors.extend(console_errors)
            page.close()
            context.close()
            browser.close()
    if errors:
        print("ERRORS:")
        for e in errors:
            print(f"  - {e}")
        return 1
    print("ALL OK: F90.1 (InfoTip accesible, migración y deload)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
