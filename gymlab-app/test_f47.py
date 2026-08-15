"""Test Fase 47 (cierre): smoke E2E tras el refactor DRY R1–R7.

Se siembra una DB mínima y se recorren las páginas cuyos hooks cambiaron:
estadísticas (useLiveList + serie semanal), rutinas (favoritos genéricos y
detalle con items enriquecidos), ejercicios (favoritos genéricos), papers y
guias (listas). Verifica referencias estables y cero errores de consola.
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
    const tx = db.transaction(['workouts', 'workoutSets', 'meta'], 'readwrite');
    const put = (store, row) => tx.objectStore(store).put(row);
    put('workouts', { id: 9001, startedAt: '2026-08-03T17:00:00.000Z', finishedAt: '2026-08-03T18:00:00.000Z', routineId: null, routineDayId: null, localDate: '2026-08-03', notes: '', totalVolume: 6000 });
    put('workouts', { id: 9002, startedAt: '2026-08-05T17:00:00.000Z', finishedAt: '2026-08-05T18:00:00.000Z', routineId: null, routineDayId: null, localDate: '2026-08-05', notes: '', totalVolume: 5400 });
    put('workouts', { id: 9003, startedAt: '2026-08-10T17:00:00.000Z', finishedAt: '2026-08-10T18:00:00.000Z', routineId: null, routineDayId: null, localDate: '2026-08-10', notes: '', totalVolume: 6600 });
    [
      { id: 91001, workoutId: 9001, exerciseId: ids[0], setNumber: 1, weightKg: 60, reps: 10, completed: true, createdAt: '2026-08-03T17:05:00.000Z' },
      { id: 91002, workoutId: 9001, exerciseId: ids[1], setNumber: 1, weightKg: 40, reps: 12, completed: true, createdAt: '2026-08-03T17:20:00.000Z' },
      { id: 91003, workoutId: 9002, exerciseId: ids[0], setNumber: 1, weightKg: 62, reps: 10, completed: true, createdAt: '2026-08-05T17:05:00.000Z' },
      { id: 91004, workoutId: 9003, exerciseId: ids[0], setNumber: 1, weightKg: 65, reps: 10, completed: true, createdAt: '2026-08-10T17:05:00.000Z' },
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


def assert_smoke(page, view_name, shot):
    # Espera al seed del catálogo antes de sembrar datos y cerrar el onboarding.
    page.goto(base_url(), wait_until="networkidle")
    page.evaluate(SEED_JS)
    page.wait_for_timeout(500)
    dismiss_achievement_modal(page)

    # /estadisticas — R5 (serie semanal) + R7 (useLiveList): volumen accesible.
    page.goto(f"{base_url()}/estadisticas", wait_until="networkidle")
    dismiss_achievement_modal(page)
    expect(page.get_by_role("img", name="Volumen de entrenamiento por semana")).to_be_visible()

    # /rutinas — favoritos genéricos (useMetaIdFavorites) + persistencia tras recarga.
    page.goto(f"{base_url()}/rutinas", wait_until="networkidle")
    card = page.locator(".routine-card").first
    expect(card).to_be_visible()
    fav_btn = page.locator('button[aria-pressed="false"][aria-label^="Añadir a favoritas"]').first
    fav_btn.click()
    expect(page.locator('button[aria-pressed="true"][aria-label^="Quitar de favoritas"]').first).to_be_visible()
    page.reload(wait_until="networkidle")
    expect(page.locator('button[aria-pressed="true"][aria-label^="Quitar de favoritas"]').first).to_be_visible()

    # Detalle de rutina — useRoutineDetail/useRoutineDayItems (enrichItems) y favorito persistido.
    page.locator(".routine-card__link").first.click()
    page.wait_for_url(re.compile(r"/rutinas/.+"))
    expect(page.get_by_label("Quitar de favoritas", exact=True)).to_be_visible()
    expect(page.get_by_role("tab").first).to_be_visible()

    # /ejercicios — catálogo (useExerciseCatalog) y favorito (useExerciseFavorites).
    page.goto(f"{base_url()}/ejercicios", wait_until="networkidle")
    exercise_link = page.locator('a[href^="/ejercicios/"]').first
    expect(exercise_link).to_be_visible()
    page.locator('button[aria-pressed="false"][aria-label="Añadir a favoritos"]').first.click()
    expect(page.locator('button[aria-pressed="true"][aria-label="Quitar de favoritos"]').first).to_be_visible()

    # /papers y /guias — listas reactivas (usePapers/useGuides).
    page.goto(f"{base_url()}/papers", wait_until="networkidle")
    expect(page.locator('a[href^="/papers/"]').first).to_be_visible()
    page.goto(f"{base_url()}/guias", wait_until="networkidle")
    expect(page.locator('a[href^="/guias/"]').first).to_be_visible()

    # /perfil — tabs internos y charts (usePRs/useBodyWeight).
    page.goto(f"{base_url()}/perfil", wait_until="networkidle")
    dismiss_achievement_modal(page)
    expect(page.get_by_role("tab", name="Resumen")).to_be_visible()

    page.screenshot(path=shot, full_page=False)


def main():
    errors = run_views({"iphone": assert_smoke, "ipad": assert_smoke}, __file__, "f47")
    if errors:
        print("FALLO:", *errors, sep="\n  ")
        return 1
    print("F47 PASSED — smoke DRY R1–R7 en 375x812 y 768x1024")
    return 0


if __name__ == "__main__":
    sys.exit(main())
