"""Test U2: charts accesibles (role="img" + aria-label) en /estadisticas y /perfil.

El contexto de Playwright arranca sin datos; se siembra una DB mínima en
IndexedDB (workouts, series, peso, medidas, pliegues y altura) para que los
charts se rendericen y el onboarding desaparezca (usa liveQuery sobre workouts).

Las fechas del seed son RELATIVAS a hoy: los charts de Cuerpo filtran por defecto
los últimos 30 días (`inRange` en src/domain/dates.ts), así que un fixture con
fechas fijas deja de renderizar charts en cuanto pasa el calendario. El seed
también marca los logros como ya desbloqueados para que el modal de celebración
no intercepte los clics.
"""

import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import TimeoutError as PlaywrightTimeoutError, expect

from scripts.e2e_utils import run_views, base_url

SEED_JS = """
async () => {
  const openDb = () => new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const db = await openDb();

  // Fechas relativas a hoy (offset en días): mantienen los datos dentro de la
  // ventana por defecto de 30 días de los charts, sin rotar con el calendario.
  const localDate = (offset) => {
    const d = new Date();
    d.setDate(d.getDate() - offset);
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  };
  const isoAt = (offset, hour) => {
    const d = new Date();
    d.setDate(d.getDate() - offset);
    d.setHours(hour, 0, 0, 0);
    return d.toISOString();
  };

  const ids = await new Promise((res, rej) => {
    const tx = db.transaction('exercises', 'readonly');
    const q = tx.objectStore('exercises').getAll();
    q.onsuccess = () => res(q.result.slice(0, 2).map((e) => e.id));
    q.onerror = () => rej(q.error);
  });
  await new Promise((res, rej) => {
    const tx = db.transaction(['workouts', 'workoutSets', 'bodyWeight', 'bodyMeasurements', 'skinfolds', 'meta'], 'readwrite');
    const put = (store, row) => tx.objectStore(store).put(row);
    // Logros ya desbloqueados: evita la cola del modal de celebración, que si no
    // se monta sobre la UI e intercepta los clics del test.
    put('meta', { key: 'unlockedAchievements', value: ['primer-paso', 'inaugural', 'racha-4', 'racha-8', 'primera-marca', 'volumen-semanal', 'sesiones-50', 'consistencia-4s', 'primera-cardio', 'ejercicios-100', 'racha-16', 'pr-10kg', 'guias-completas', 'sesiones-500', 'primer-ano'] });
    put('meta', { key: 'heightCm', value: 175 });
    put('workouts', { id: 9001, startedAt: isoAt(12, 17), finishedAt: isoAt(12, 18), routineId: null, routineDayId: null, localDate: localDate(12), notes: '', totalVolume: 6000 });
    put('workouts', { id: 9002, startedAt: isoAt(10, 17), finishedAt: isoAt(10, 18), routineId: null, routineDayId: null, localDate: localDate(10), notes: '', totalVolume: 5400 });
    put('workouts', { id: 9003, startedAt: isoAt(5, 17), finishedAt: isoAt(5, 18), routineId: null, routineDayId: null, localDate: localDate(5), notes: '', totalVolume: 6600 });
    [
      { id: 91001, workoutId: 9001, exerciseId: ids[0], setNumber: 1, weightKg: 60, reps: 10, completed: true, createdAt: isoAt(12, 17) },
      { id: 91002, workoutId: 9001, exerciseId: ids[1], setNumber: 1, weightKg: 40, reps: 12, completed: true, createdAt: isoAt(12, 17) },
      { id: 91003, workoutId: 9002, exerciseId: ids[0], setNumber: 1, weightKg: 62, reps: 10, completed: true, createdAt: isoAt(10, 17) },
      { id: 91004, workoutId: 9003, exerciseId: ids[0], setNumber: 1, weightKg: 65, reps: 10, completed: true, createdAt: isoAt(5, 17) },
    ].forEach((row) => put('workoutSets', row));
    put('bodyWeight', { id: 92001, localDate: localDate(25), weightKg: 80.5, createdAt: isoAt(25, 8) });
    put('bodyWeight', { id: 92002, localDate: localDate(18), weightKg: 79.8, createdAt: isoAt(18, 8) });
    put('bodyWeight', { id: 92003, localDate: localDate(11), weightKg: 79.2, createdAt: isoAt(11, 8) });
    put('bodyWeight', { id: 92004, localDate: localDate(4), weightKg: 78.5, createdAt: isoAt(4, 8) });
    put('bodyMeasurements', { id: 93001, localDate: localDate(11), values: { cintura: 85, caderas: 98 }, createdAt: isoAt(11, 9) });
    put('bodyMeasurements', { id: 93002, localDate: localDate(4), values: { cintura: 84, caderas: 98 }, createdAt: isoAt(4, 9) });
    put('skinfolds', { id: 94001, localDate: localDate(5), sex: 'male', age: 30, weightKg: 79.2, sites: { triceps: 12, subescapular: 14, suprailiaco: 16, abdominal: 18, muslo: 14, pectoral: 10, axilar: 13 }, createdAt: isoAt(5, 10) });
    tx.onerror = () => rej(tx.error);
    tx.oncomplete = () => res();
  });
}
"""


def dismiss_achievement_modal(page, timeout_ms=1500):
    """Cierra la cola del modal de logros si aparece.

    `useAchievements` evalúa con 600 ms de debounce y el modal muestra un logro
    por pantalla, así que si no esperamos a que se monte el backdrop intercepta
    los clics. Se cierra hasta vaciar la cola.
    """
    btn = page.get_by_role("button", name="¡Genial!")
    try:
        btn.first.wait_for(state="visible", timeout=timeout_ms)
    except PlaywrightTimeoutError:
        return
    for _ in range(10):
        btn.first.click()
        page.wait_for_timeout(250)
        if btn.count() == 0:
            return


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
