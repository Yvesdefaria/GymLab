"""Test Fase 48: smoke E2E del maniquí anatómico 3D (Three.js).

Verifica en 375x812 y 768x1024 (ipad con prefers-reduced-motion) que:
- /cuerpo monta el canvas WebGL y no cae a fallback SVG,
- los chips accesibles seleccionan/deseleccionan (misma selección que el lienzo),
- tocar el vacío del lienzo deselecciona y arrastrar rota sin romper nada,
- el botón reset funciona,
- /ejercicios/:slug muestra el maniquí con resaltado.
Cero errores de consola (lo valida run_views).
"""
import re
import sys

from playwright.sync_api import expect

from scripts.e2e_utils import run_views, base_url

SEED_JS = """
async () => {
  const openDb = () => new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const db = await openDb();
  const ids = await new Promise((res, rej) => {
    const tx = db.transaction('exercises', 'readonly');
    const q = tx.objectStore('exercises').getAll();
    q.onsuccess = () => res(q.result.slice(0, 2).map((e) => e.id));
    q.onerror = () => rej(q.error);
  });
  await new Promise((res, rej) => {
    const tx = db.transaction(['workouts', 'workoutSets'], 'readwrite');
    const put = (store, row) => tx.objectStore(store).put(row);
    put('workouts', { id: 9001, startedAt: '2026-08-14T17:00:00.000Z', finishedAt: '2026-08-14T18:00:00.000Z', routineId: null, routineDayId: null, localDate: '2026-08-14', notes: '', totalVolume: 6000 });
    put('workouts', { id: 9002, startedAt: '2026-08-12T17:00:00.000Z', finishedAt: '2026-08-12T18:00:00.000Z', routineId: null, routineDayId: null, localDate: '2026-08-12', notes: '', totalVolume: 5400 });
    [
      { id: 91001, workoutId: 9001, exerciseId: ids[0], setNumber: 1, weightKg: 60, reps: 10, completed: true, createdAt: '2026-08-14T17:05:00.000Z' },
      { id: 91002, workoutId: 9002, exerciseId: ids[0], setNumber: 1, weightKg: 62, reps: 10, completed: true, createdAt: '2026-08-12T17:05:00.000Z' },
      { id: 91003, workoutId: 9002, exerciseId: ids[1], setNumber: 1, weightKg: 40, reps: 12, completed: true, createdAt: '2026-08-12T17:20:00.000Z' },
    ].forEach((row) => put('workoutSets', row));
    tx.onerror = () => rej(tx.error);
    tx.oncomplete = () => res();
  });
}
"""


def dismiss_achievement_modal(page):
    """Cierra el modal de logros que aparece al sembrar el primer entreno."""
    btn = page.get_by_role("button", name="¡Genial!")
    if btn.count():
        btn.click()
        page.wait_for_timeout(300)


def assert_smoke(page, view_name, shot, reduced_motion=False):
    if reduced_motion:
        page.emulate_media(reduced_motion="reduce")
    # Espera al seed del catálogo antes de sembrar datos y cerrar el onboarding.
    page.goto(base_url(), wait_until="networkidle")
    page.evaluate(SEED_JS)
    page.wait_for_timeout(500)
    dismiss_achievement_modal(page)

    # /cuerpo — el maniquí 3D monta un canvas WebGL (no el SVG de fallback).
    page.goto(f"{base_url()}/cuerpo", wait_until="networkidle")
    dismiss_achievement_modal(page)
    canvas = page.locator('div[role="img"][aria-label="Mapa muscular"] canvas').first
    expect(canvas).to_be_visible()

    # Chips accesibles: seleccionar «Pecho» muestra el detalle; deseleccionar lo oculta.
    pecho = page.get_by_role("button", name="Pecho", exact=True)
    expect(pecho).to_have_attribute("aria-pressed", "false")
    pecho.click()
    expect(pecho).to_have_attribute("aria-pressed", "true")
    expect(page.locator("h2", has_text="pecho")).to_be_visible()

    # Tocar el vacío del lienzo (esquina superior derecha) deselecciona.
    box = canvas.bounding_box()
    page.mouse.click(box["x"] + box["width"] - 12, box["y"] + 12)
    expect(pecho).to_have_attribute("aria-pressed", "false")

    # Arrastre: rota el maniquí sin romper la escena ni seleccionar por accidente.
    cx, cy = box["x"] + box["width"] / 2, box["y"] + box["height"] / 2
    page.mouse.move(cx, cy)
    page.mouse.down()
    page.mouse.move(cx + 90, cy + 20, steps=6)
    page.mouse.up()
    expect(canvas).to_be_visible()

    # Botón reset: vuelve a centrar la cámara sin errores.
    page.get_by_role("button", name="Centrar").click()
    expect(canvas).to_be_visible()

    # /ejercicios/:slug — maniquí con resaltado del grupo muscular.
    page.goto(f"{base_url()}/ejercicios", wait_until="networkidle")
    dismiss_achievement_modal(page)
    page.locator('a[href^="/ejercicios/"]').first.click()
    page.wait_for_url(re.compile(r"/ejercicios/.+"))
    dismiss_achievement_modal(page)
    detail_canvas = page.locator('div[role="img"][aria-label="Mapa muscular"] canvas').first
    expect(detail_canvas).to_be_visible()

    page.screenshot(path=shot, full_page=False)


def main():
    errors = run_views(
        {
            "iphone": lambda page, name, shot: assert_smoke(page, name, shot),
            "ipad": lambda page, name, shot: assert_smoke(page, name, shot, reduced_motion=True),
        },
        __file__,
        "f48",
    )
    if errors:
        print("FALLO:", *errors, sep="\n  ")
        return 1
    print("F48 PASSED — maniquí 3D en /cuerpo y ficha de ejercicio (375x812 y 768x1024)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
