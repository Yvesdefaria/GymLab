"""Rediseño del planificador (F132.3, Nocturno Minimal).

Cubre el wizard de una pregunta por pantalla (progreso, avance automático, paso 3 con
días/duración/equipamiento), el resultado en secciones hairline y la barra fija de guardado.
"""
import os
import re
import sys
import tempfile

sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import expect, sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"

SEED_JS = """async () => {
  const openDb = () => new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const db = await openDb();
  await new Promise((res, rej) => {
    const tx = db.transaction(['meta'], 'readwrite');
    const meta = tx.objectStore('meta');
    meta.put({ key: 'onboardingDone', value: 'true' });
    meta.put({ key: 'settings', value: '{"language":"es","showSectionTips":false}' });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  return true;
}"""


def boot(page):
    page.goto(BASE, wait_until="load", timeout=60000)
    page.wait_for_timeout(1500)
    seeded = False
    for _ in range(20):
        try:
            if page.evaluate(SEED_JS) is True:
                seeded = True
                break
        except Exception:
            pass
        page.wait_for_timeout(500)
    assert seeded, "seed fallo: la DB no estuvo lista"
    skip = page.locator("button", has_text="Ya entreno aquí")
    if skip.count() > 0:
        skip.first.click(timeout=5000)
        page.wait_for_timeout(600)


def main():
    errors = []
    shots = os.path.join(tempfile.gettempdir(), "opencode", "rutinas-planner-e2e")
    os.makedirs(shots, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 375, "height": 812})
        page.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))

        boot(page)
        page.goto(f"{BASE}/rutinas/planificador", wait_until="load", timeout=60000)
        page.wait_for_timeout(1500)

        # 1) Paso 1: progreso, contador y filas hairline (sin paneles).
        expect(page.get_by_text("Paso 1 de 3", exact=True)).to_be_visible()
        expect(page.get_by_role("heading", name="¿Cuál es tu nivel?")).to_be_visible()
        if page.locator(".panel, .panel-light").count() > 0:
            errors.append("el planificador todavía usa paneles como contenedor")
        page.screenshot(path=os.path.join(shots, "planner-paso1.png"))

        # 2) Elegir nivel avanza solo al paso 2.
        page.get_by_role("button", name="Principiante", exact=True).click()
        page.wait_for_timeout(500)
        expect(page.get_by_text("Paso 2 de 3", exact=True)).to_be_visible()
        expect(page.get_by_role("heading", name="¿Cuál es tu objetivo?")).to_be_visible()

        # 3) «Atrás» vuelve al paso 1 y elegir objetivo avanza al paso 3.
        page.get_by_role("button", name="Atrás").click()
        page.wait_for_timeout(400)
        expect(page.get_by_text("Paso 1 de 3", exact=True)).to_be_visible()
        page.get_by_role("button", name="Principiante", exact=True).click()
        page.wait_for_timeout(400)
        page.get_by_role("button", name="Volumen", exact=True).click()
        page.wait_for_timeout(500)
        expect(page.get_by_text("Paso 3 de 3", exact=True)).to_be_visible()

        # 4) Paso 3: días, duración y equipamiento.
        expect(page.get_by_role("button", name="2 días", exact=True)).to_be_visible()
        expect(page.get_by_role("button", name="45 min", exact=True)).to_be_visible()
        page.get_by_role("button", name="3 días", exact=True).click()
        page.get_by_role("button", name="45 min", exact=True).click()
        page.get_by_role("button", name="Barra", exact=True).click()
        page.wait_for_timeout(300)
        page.screenshot(path=os.path.join(shots, "planner-paso3.png"))

        # 5) Generar: resultado con secciones por día y minutos estimados.
        page.get_by_role("button", name="Generar rutina").click()
        page.wait_for_timeout(2500)
        expect(page.get_by_text("Tu rutina semanal", exact=True)).to_be_visible()
        if page.get_by_text(re.compile(r"^≈ \d+ min$")).count() == 0:
            errors.append("el resultado no muestra minutos estimados por día")
        if page.get_by_text(re.compile(r"^Día|^Upper|^Lower|^Full")).count() == 0:
            errors.append("el resultado no muestra los días del plan")
        page.screenshot(path=os.path.join(shots, "planner-resultado.png"), full_page=True)

        # 6) La barra de guardado queda fija al hacer scroll.
        save = page.get_by_role("button", name="Guardar como mi rutina")
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        page.wait_for_timeout(400)
        expect(save).to_be_visible()
        box = save.bounding_box()
        if not box or box["y"] + box["height"] > 812:
            errors.append(f"la barra de guardado no quedó fija en el viewport: {box}")

        # 7) Empezar de nuevo vuelve al paso 1.
        page.get_by_role("button", name="Empezar de nuevo").click()
        page.wait_for_timeout(500)
        expect(page.get_by_text("Paso 1 de 3", exact=True)).to_be_visible()

        browser.close()

    if errors:
        print("FALLOS:")
        for e in errors:
            print(" -", e)
        return 1
    print("OK: planificador sin fallos")
    return 0


if __name__ == "__main__":
    sys.exit(main())
