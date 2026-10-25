"""Rediseño del detalle de rutina (F132.3, Nocturno Minimal).

Cubre la portada editorial, la fila de stats, los tabs por día con nombre corto,
las filas hairline con índice y carga, «seguir programa», la barra fija y la
eliminación de una rutina propia (fila ghost + confirmación).
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
    tx.objectStore('routines').put({ id: 10001, slug: 'custom-test', title: 'Mi rutina de verano', objective: 'volumen', level: 'intermedio', description: 'Rutina propia de prueba.', daysCount: 1, isCustom: true });
    tx.objectStore('routineDays').put({ id: 9001, routineId: 10001, dayIndex: 0, name: 'Empuje' });
    tx.objectStore('routineItems').put({ id: 9101, routineDayId: 9001, exerciseId: 1, targetSets: 4, targetReps: 8, restSec: 120, order: 1 });
    tx.objectStore('routineItems').put({ id: 9102, routineDayId: 9001, exerciseId: 2, targetSets: 3, targetReps: 10, restSec: 90, order: 2 });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  return true;
}"""


def boot(page):
    page.goto(BASE, wait_until="load", timeout=60000)
    page.wait_for_timeout(1000)
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
    shots = os.path.join(tempfile.gettempdir(), "opencode", "rutinas-detalle-e2e")
    os.makedirs(shots, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 375, "height": 812})
        page.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))

        boot(page)

        # 1) Portada editorial: imagen real cargada y kicker objetivo · nivel.
        page.goto(f"{BASE}/rutinas/ppl-volumen", wait_until="load", timeout=60000)
        page.wait_for_timeout(1200)
        hero = page.get_by_test_id("routine-hero")
        expect(hero).to_be_visible()
        expect(hero.locator(".routine-cover img")).to_be_visible()
        broken = page.evaluate(
            "Array.from(document.images).filter((i) => !i.complete || i.naturalWidth === 0).length"
        )
        if broken:
            errors.append(f"{broken} imágenes no cargaron")
        if "VOLUMEN" not in hero.inner_text().upper():
            errors.append("el kicker de la portada no muestra objetivo · nivel")

        # 2) Stats: tres celdas con la fila de ejercicios del día.
        stats = hero.locator("xpath=following-sibling::div[1]")
        values = stats.locator("strong").all_inner_texts()
        if len(values) != 3 or not all(v.strip().isdigit() for v in values):
            errors.append(f"stats inesperadas: {values}")
        stats_text = stats.inner_text().lower()
        if "ejercicios" not in stats_text or "min/día" not in stats_text:
            errors.append("faltan las etiquetas de la fila de stats")

        # 3) Tabs: nombre corto (sin paréntesis) y tres días.
        tabs = page.get_by_role("tab")
        expect(tabs).to_have_count(3)
        if any("(" in tabs.nth(i).inner_text() for i in range(tabs.count())):
            errors.append("los tabs conservan el paréntesis del nombre del día")

        # 4) Filas: índice y carga a la derecha; cambiar de tab cambia el día.
        expect(page.get_by_role("tabpanel")).to_contain_text("01")
        expect(page.get_by_role("tabpanel")).to_contain_text("4×8")
        expect(page.get_by_role("tabpanel")).to_contain_text("120s")
        tabs.nth(1).click()
        page.wait_for_timeout(500)
        expect(page.get_by_role("tabpanel")).not_to_contain_text("Press de pecho con barra")
        page.screenshot(path=os.path.join(shots, "detalle-pull.png"))

        # 5) Seguir programa: 7 días, CTA habilitado con los días sugeridos y estado activo.
        follow = page.locator("section", has=page.get_by_role("heading", name="Seguir programa")).last
        expect(follow.locator("button[aria-pressed]")).to_have_count(7)
        follow.get_by_role("button", name="Seguir esta rutina").click()
        page.wait_for_timeout(600)
        expect(page.get_by_role("button", name="Rutina activa · actualizar días")).to_be_visible()

        # 6) Barra fija: el CTA del día está visible y habilitado.
        play = page.get_by_role("button", name=re.compile(r"Empezar · ~\d+ min"))
        expect(play).to_be_visible()
        expect(play).to_be_enabled()

        # 7) Rutina propia de un solo día: sin tabs, con fila de eliminar.
        page.goto(f"{BASE}/rutinas/custom-test", wait_until="load", timeout=60000)
        page.wait_for_timeout(1000)
        if page.get_by_role("tab").count() != 0:
            errors.append("una rutina de un solo día no debería mostrar tabs")
        expect(page.get_by_role("heading", name="Empuje")).to_be_visible()
        delete = page.get_by_role("button", name="Eliminar rutina")
        delete.scroll_into_view_if_needed()
        delete.click()
        page.wait_for_timeout(400)
        dialog = page.locator('[role="alertdialog"]')
        expect(dialog.first).to_contain_text("Esta acción no se puede deshacer")
        dialog.first.get_by_role("button", name="Cancelar").click()
        page.wait_for_timeout(300)
        if page.locator('[role="alertdialog"]').count() != 0:
            errors.append("el sheet de borrado no se cerró con Cancelar")

        # 8) Portada: las rutinas propias toman una del catálogo (no el fallback roto).
        img_src = page.get_by_test_id("routine-hero").locator(".routine-cover img").first.get_attribute("src")
        if not img_src or img_src.endswith("/default.jpg"):
            errors.append(f"la rutina propia no tomó portada del catálogo: {img_src}")

        # 9) Confirmar el borrado: elimina y vuelve al catálogo.
        page.get_by_role("button", name="Eliminar rutina").click()
        page.wait_for_timeout(400)
        page.locator('[role="alertdialog"]').first.get_by_role("button", name="Eliminar", exact=True).click()
        page.wait_for_url("**/rutinas", timeout=10000)
        page.wait_for_timeout(600)
        if page.get_by_text("Mi rutina de verano", exact=True).count() != 0:
            errors.append("la rutina eliminada sigue en el catálogo")
        page.screenshot(path=os.path.join(shots, "detalle-custom.png"), full_page=True)

        browser.close()

    if errors:
        print("FALLOS:")
        for e in errors:
            print(" -", e)
        return 1
    print("OK: detalle de rutina sin fallos")
    return 0


if __name__ == "__main__":
    sys.exit(main())
