"""Rediseño del builder de rutinas (F132.3, Nocturno Minimal).

Cubre el formulario hairline, la barra fija de guardado, las filas compactas que se
expanden de a una, la edición de series y el guardado de punta a punta.
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
    const tx = db.transaction(['meta', 'routines', 'routineDays', 'routineItems'], 'readwrite');
    const meta = tx.objectStore('meta');
    meta.put({ key: 'onboardingDone', value: 'true' });
    meta.put({ key: 'settings', value: '{"language":"es","showSectionTips":false}' });
    tx.objectStore('routines').put({ id: 10001, slug: 'custom-test', title: 'Mi rutina de verano', objective: 'volumen', level: 'intermedio', description: 'Rutina propia de prueba.', daysCount: 2, isCustom: true });
    tx.objectStore('routineDays').put({ id: 9001, routineId: 10001, dayIndex: 0, name: 'Empuje' });
    tx.objectStore('routineDays').put({ id: 9002, routineId: 10001, dayIndex: 1, name: 'Jalón' });
    tx.objectStore('routineItems').put({ id: 9101, routineDayId: 9001, exerciseId: 1, targetSets: 4, targetReps: 8, restSec: 120, order: 1 });
    tx.objectStore('routineItems').put({ id: 9102, routineDayId: 9001, exerciseId: 2, targetSets: 3, targetReps: 10, restSec: 90, order: 2 });
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
    shots = os.path.join(tempfile.gettempdir(), "opencode", "rutinas-builder-e2e")
    os.makedirs(shots, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 375, "height": 812})
        page.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))

        boot(page)

        # 1) Rutina nueva: formulario hairline, un día por defecto y guardar deshabilitado.
        page.goto(f"{BASE}/rutinas/nueva", wait_until="load", timeout=60000)
        page.wait_for_timeout(1500)
        save = page.get_by_role("button", name="Crear rutina")
        expect(save).to_be_visible()
        expect(save).to_be_disabled()
        if page.locator("section.panel, .panel-light").count() > 0:
            errors.append("el builder todavía usa paneles como contenedor")
        day_inputs = page.locator('input[id^="day-name-"]')
        expect(day_inputs).to_have_count(1)

        # 2) Título + día extra habilitan el guardado.
        page.locator("#rb-title").fill("Rutina de prueba F132")
        page.get_by_role("button", name="Añadir día").click()
        page.wait_for_timeout(300)
        expect(day_inputs).to_have_count(2)
        expect(save).to_be_enabled()
        page.screenshot(path=os.path.join(shots, "builder-nueva.png"))

        # 3) Guardar crea la rutina y navega a su detalle.
        save.click()
        page.wait_for_timeout(1800)
        print("url after save:", page.url)
        if not re.search(r"/rutinas/[\w-]+$", page.url) or page.url.endswith("/nueva"):
            errors.append(f"guardar no navegó al detalle: {page.url}")
        if page.get_by_text("Rutina de prueba F132").count() == 0:
            print("header:", page.locator("header").first.inner_text())
            print("no encontrada:", page.get_by_text("Rutina no encontrada").count())
            errors.append("el detalle no muestra el título de la rutina creada")

        # 4) Edición: filas colapsadas (sin inputs de series) y expansión de a una.
        page.goto(f"{BASE}/rutinas/custom-test/editar", wait_until="load", timeout=60000)
        page.wait_for_timeout(1500)
        if "Ajusta los días y los ejercicios" not in page.locator("header").first.inner_text():
            errors.append("el subtítulo de edición no cambió respecto de «crear»")
        expect(page.locator('input[id^="day-name-"]')).to_have_count(2)
        rows = page.locator("button[aria-expanded]")
        expect(rows).to_have_count(2)
        if page.locator('input[id^="target-"]').count() != 0:
            errors.append("las filas colapsadas muestran inputs de series/reps")
        rows.nth(0).click()
        page.wait_for_timeout(300)
        sets_input = page.locator("#target-0-0-targetSets")
        expect(sets_input).to_be_visible()
        sets_input.fill("5")
        page.wait_for_timeout(200)
        if rows.nth(0).get_attribute("aria-expanded") != "true":
            errors.append("la fila no quedó expandida tras el toque")

        # 5) Acordeón: abrir otra fila cierra la primera.
        rows.nth(1).click()
        page.wait_for_timeout(300)
        if page.locator("#target-0-0-targetSets").count() != 0:
            errors.append("el acordeón dejó dos filas abiertas en el mismo día")
        expect(page.locator("#target-0-1-targetSets")).to_be_visible()
        page.screenshot(path=os.path.join(shots, "builder-acordeon.png"))

        # 6) Guardar cambios persiste y el detalle muestra la carga nueva.
        page.get_by_role("button", name="Guardar cambios").click()
        page.wait_for_timeout(1800)
        print("url after edit save:", page.url)
        if not re.search(r"/rutinas/[\w-]+$", page.url):
            errors.append(f"guardar cambios no navegó al detalle: {page.url}")
        page.wait_for_timeout(900)
        expect(page.get_by_role("tabpanel")).to_contain_text("5×8")

        browser.close()

    if errors:
        print("FALLOS:")
        for e in errors:
            print(" -", e)
        return 1
    print("OK: builder sin fallos")
    return 0


if __name__ == "__main__":
    sys.exit(main())
