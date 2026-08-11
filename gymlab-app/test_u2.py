"""Test U2: charts accesibles (role="img" + aria-label) en /estadisticas y /perfil.

El contexto de Playwright arranca sin datos; se siembra una DB mínima en
IndexedDB (workouts, series, peso, medidas, pliegues y altura) para que los
charts se rendericen y el onboarding desaparezca (usa liveQuery sobre workouts).
"""
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
    const tx = db.transaction(['workouts', 'workoutSets', 'bodyWeight', 'bodyMeasurements', 'skinfolds', 'meta'], 'readwrite');
    const put = (store, row) => tx.objectStore(store).put(row);
    put('meta', { key: 'heightCm', value: 175 });
    put('workouts', { id: 9001, startedAt: '2026-08-03T17:00:00.000Z', finishedAt: '2026-08-03T18:00:00.000Z', routineId: null, routineDayId: null, localDate: '2026-08-03', notes: '', totalVolume: 6000 });
    put('workouts', { id: 9002, startedAt: '2026-08-05T17:00:00.000Z', finishedAt: '2026-08-05T18:00:00.000Z', routineId: null, routineDayId: null, localDate: '2026-08-05', notes: '', totalVolume: 5400 });
    put('workouts', { id: 9003, startedAt: '2026-08-10T17:00:00.000Z', finishedAt: '2026-08-10T18:00:00.000Z', routineId: null, routineDayId: null, localDate: '2026-08-10', notes: '', totalVolume: 6600 });
    [
      { id: 91001, workoutId: 9001, exerciseId: ids[0], setNumber: 1, weightKg: 60, reps: 10, completed: true, createdAt: '2026-08-03T17:05:00.000Z' },
      { id: 91002, workoutId: 9001, exerciseId: ids[1], setNumber: 1, weightKg: 40, reps: 12, completed: true, createdAt: '2026-08-03T17:20:00.000Z' },
      { id: 91003, workoutId: 9002, exerciseId: ids[0], setNumber: 1, weightKg: 62, reps: 10, completed: true, createdAt: '2026-08-05T17:05:00.000Z' },
      { id: 91004, workoutId: 9003, exerciseId: ids[0], setNumber: 1, weightKg: 65, reps: 10, completed: true, createdAt: '2026-08-10T17:05:00.000Z' },
    ].forEach((row) => put('workoutSets', row));
    put('bodyWeight', { id: 92001, localDate: '2026-07-20', weightKg: 80.5, createdAt: '2026-07-20T08:00:00.000Z' });
    put('bodyWeight', { id: 92002, localDate: '2026-07-27', weightKg: 79.8, createdAt: '2026-07-27T08:00:00.000Z' });
    put('bodyWeight', { id: 92003, localDate: '2026-08-03', weightKg: 79.2, createdAt: '2026-08-03T08:00:00.000Z' });
    put('bodyWeight', { id: 92004, localDate: '2026-08-10', weightKg: 78.5, createdAt: '2026-08-10T08:00:00.000Z' });
    put('bodyMeasurements', { id: 93001, localDate: '2026-08-03', values: { cintura: 85, caderas: 98 }, createdAt: '2026-08-03T09:00:00.000Z' });
    put('bodyMeasurements', { id: 93002, localDate: '2026-08-10', values: { cintura: 84, caderas: 98 }, createdAt: '2026-08-10T09:00:00.000Z' });
    put('skinfolds', { id: 94001, localDate: '2026-08-03', sex: 'male', age: 30, weightKg: 79.2, sites: { triceps: 12, subescapular: 14, suprailiaco: 16, abdominal: 18, muslo: 14, pectoral: 10, axilar: 13 }, createdAt: '2026-08-03T10:00:00.000Z' });
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


def assert_chart(page, view_name, shot):
    # El context arranca en base_url: espera al seed del catálogo antes de sembrar datos.
    page.goto(base_url(), wait_until="networkidle")
    page.evaluate(SEED_JS)
    page.wait_for_timeout(500)
    dismiss_achievement_modal(page)

    # /estadisticas — pestaña Entrenamiento: VolumeChart (barra) accesible.
    page.goto(f"{base_url()}/estadisticas", wait_until="networkidle")
    dismiss_achievement_modal(page)
    expect(page.get_by_role("img", name="Volumen de entrenamiento por semana")).to_be_visible()

    # Pestaña Cuerpo: BodyWeightChart e ImcChart accesibles.
    page.get_by_role("tab", name="Cuerpo").click()
    page.wait_for_timeout(400)
    expect(page.get_by_role("img", name="Evolución del peso corporal")).to_be_visible()
    expect(page.get_by_role("img", name="Evolución del índice de masa corporal")).to_be_visible()

    # /perfil — pestaña Resumen: VolumeChart accesible.
    page.goto(f"{base_url()}/perfil", wait_until="networkidle")
    dismiss_achievement_modal(page)
    expect(page.get_by_role("img", name="Volumen de entrenamiento por semana")).to_be_visible()

    page.screenshot(path=shot, full_page=False)


def main():
    errors = run_views({"iphone": assert_chart, "ipad": assert_chart}, __file__, "u2")
    if errors:
        print("FALLO:", *errors, sep="\n  ")
        return 1
    print("U2 PASSED — charts accesibles (role=img + aria-label) en 375x812 y 768x1024")
    return 0


if __name__ == "__main__":
    sys.exit(main())
