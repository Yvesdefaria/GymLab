"""Fase 69: comparativa de sesiones rediseñada (orden cronológico, deltas con signo, tabla a11y).

En /perfil → Historial:
- la tarjeta renderiza los headers de ambas sesiones (rutina + fecha);
- cambiar una selección reordena por fecha y actualiza las métricas;
- la tabla tiene semántica real (th/scope) y los deltas muestran signo explícito (+/−);
- el texto de las métricas mide >= 12px (fix del piso tipográfico);
- las calorías (12ª métrica) se estiman por MET × duración × peso y muestran «—» sin datos;
- viewport mobile y 0 pageerror.

Siembra (idempotente): 3 sesiones en rutinas distintas con series de trabajo, un PR, un
peso corporal (80 kg) y los 15 logros ya desbloqueados (evita el modal de celebración).
El volumen es decreciente en el tiempo (500 → 1000 → 400) para ejercitar un delta negativo.
Las series temporizadas de w2 (2 × 900 s, MET 5) y w3 (450 s, MET 5) dan 200 y 50 kcal.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import sync_playwright

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
    const tx = db.transaction(['exercises', 'workouts', 'workoutSets', 'prs', 'routines', 'meta', 'bodyWeight'], 'readwrite');
    tx.objectStore('exercises').put({ id: 21, slug: 'sentadilla', name: 'Sentadilla', muscleGroup: 'pierna', equipment: ['barra'], instructions: '', category: 'strength' });
    tx.objectStore('exercises').put({ id: 30, slug: 'peso-muerto', name: 'Peso muerto', muscleGroup: 'espalda', equipment: ['barra'], instructions: '', category: 'strength' });

    tx.objectStore('routines').put({ id: 5, slug: 'fuerza-a', title: 'Fuerza A', objective: 'strength', level: 'beginner', description: '' });
    tx.objectStore('routines').put({ id: 6, slug: 'fuerza-b', title: 'Fuerza B', objective: 'strength', level: 'beginner', description: '' });
    tx.objectStore('routines').put({ id: 7, slug: 'fuerza-c', title: 'Fuerza C', objective: 'strength', level: 'beginner', description: '' });

    tx.objectStore('workouts').put({ id: 1, startedAt: '2026-09-01T10:00:00.000Z', finishedAt: '2026-09-01T11:00:00.000Z', routineId: 5, routineDayId: null, localDate: '2026-09-01', notes: '', totalVolume: 500 });
    tx.objectStore('workouts').put({ id: 2, startedAt: '2026-09-08T10:00:00.000Z', finishedAt: '2026-09-08T11:00:00.000Z', routineId: 6, routineDayId: null, localDate: '2026-09-08', notes: '', totalVolume: 1000 });
    tx.objectStore('workouts').put({ id: 3, startedAt: '2026-09-15T10:00:00.000Z', finishedAt: '2026-09-15T11:00:00.000Z', routineId: 7, routineDayId: null, localDate: '2026-09-15', notes: '', totalVolume: 400 });

    // w1 (500 kg) y w2 (1000 kg) en pierna; w3 (400 kg) en espalda.
    // Las series temporizadas de w2/w3 fijan las calorías: sentadilla y peso muerto → MET genérico 5.
    tx.objectStore('workoutSets').put({ id: 1, workoutId: 1, exerciseId: 21, setNumber: 1, weightKg: 100, reps: 5, completed: true, createdAt: '2026-09-01T10:05:00.000Z' });
    tx.objectStore('workoutSets').put({ id: 2, workoutId: 2, exerciseId: 21, setNumber: 1, weightKg: 100, reps: 5, durationSeconds: 900, completed: true, createdAt: '2026-09-08T10:05:00.000Z' });
    tx.objectStore('workoutSets').put({ id: 3, workoutId: 2, exerciseId: 21, setNumber: 2, weightKg: 100, reps: 5, durationSeconds: 900, completed: true, createdAt: '2026-09-08T10:10:00.000Z' });
    tx.objectStore('workoutSets').put({ id: 4, workoutId: 3, exerciseId: 30, setNumber: 1, weightKg: 80, reps: 5, durationSeconds: 450, completed: true, createdAt: '2026-09-15T10:05:00.000Z' });

    // Peso corporal aplicable a las dos sesiones (2026-08-30 <= 09-08 y 09-15).
    tx.objectStore('bodyWeight').put({ id: 1, localDate: '2026-08-30', weightKg: 80, createdAt: '2026-08-30T08:00:00.000Z' });

    tx.objectStore('prs').put({ exerciseId: 30, weightKg: 80, reps: 5, date: '2026-09-15T11:00:00.000Z', estimated1RM: 90 });

    tx.objectStore('meta').put({ key: 'onboardingDone', value: 'true' });
    const ids = ['primer-paso', 'inaugural', 'racha-4', 'racha-8', 'primera-marca', 'volumen-semanal', 'sesiones-50', 'consistencia-4s', 'primera-cardio', 'ejercicios-100', 'racha-16', 'pr-10kg', 'guias-completas', 'sesiones-500', 'primer-ano'];
    tx.objectStore('meta').put({ key: 'unlockedAchievements', value: JSON.stringify(ids) });
    tx.objectStore('meta').put({ key: 'achievementCounts', value: JSON.stringify(Object.fromEntries(ids.map((id) => [id, 1]))) });
    tx.objectStore('meta').put({ key: 'achievementSnapshot', value: JSON.stringify(ids) });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  return true;
}"""

EMPTY_SEED_JS = """async () => {
  const openDb = () => new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const db = await openDb();
  await new Promise((res, rej) => {
    const tx = db.transaction(['exercises', 'workouts', 'routines', 'meta'], 'readwrite');
    tx.objectStore('workouts').put({ id: 1, startedAt: '2026-09-01T10:00:00.000Z', finishedAt: '2026-09-01T11:00:00.000Z', routineId: 5, routineDayId: null, localDate: '2026-09-01', notes: '', totalVolume: 0 });
    tx.objectStore('workouts').put({ id: 2, startedAt: '2026-09-08T10:00:00.000Z', finishedAt: '2026-09-08T11:00:00.000Z', routineId: 5, routineDayId: null, localDate: '2026-09-08', notes: '', totalVolume: 0 });
    tx.objectStore('routines').put({ id: 5, slug: 'fuerza-a', title: 'Fuerza A', objective: 'strength', level: 'beginner', description: '' });
    tx.objectStore('meta').put({ key: 'onboardingDone', value: 'true' });
    const ids = ['primer-paso', 'inaugural', 'racha-4', 'racha-8', 'primera-marca', 'volumen-semanal', 'sesiones-50', 'consistencia-4s', 'primera-cardio', 'ejercicios-100', 'racha-16', 'pr-10kg', 'guias-completas', 'sesiones-500', 'primer-ano'];
    tx.objectStore('meta').put({ key: 'unlockedAchievements', value: JSON.stringify(ids) });
    tx.objectStore('meta').put({ key: 'achievementCounts', value: JSON.stringify(Object.fromEntries(ids.map((id) => [id, 1]))) });
    tx.objectStore('meta').put({ key: 'achievementSnapshot', value: JSON.stringify(ids) });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  return true;
}"""


def boot(page, seed_js):
    """Carga la app, siembra IndexedDB y salta el onboarding si aparece."""
    page.goto(BASE, wait_until="networkidle")
    page.wait_for_timeout(800)
    seed = page.evaluate(seed_js)
    assert seed is True, f"seed fallo: {seed}"
    page.reload(wait_until="networkidle")
    page.wait_for_timeout(1000)
    skip_ob = page.locator("button", has_text="Ya entreno aquí")
    if skip_ob.count() > 0:
        skip_ob.first.click(timeout=5000)
        page.wait_for_timeout(800)
    # Un modal de celebración abierto taparía los selectores.
    dialog = page.locator('[role="dialog"]')
    if dialog.count() > 0:
        page.keyboard.press("Escape")
        page.wait_for_timeout(400)


def open_historial(page):
    page.goto(f"{BASE}/perfil", wait_until="networkidle")
    page.wait_for_timeout(1000)
    page.locator('[data-tab="historial"]').click()
    page.wait_for_selector('[data-testid="session-comparison"]', state="visible", timeout=10000)
    page.wait_for_timeout(500)


def cell_text(page, test_id):
    return page.locator(f'[data-testid="{test_id}"]').first.inner_text().strip()


def check_comparison(page, errors):
    boot(page, SEED_JS)
    open_historial(page)

    # Headers: rutina + fecha, ordenados cronológicamente (anterior → posterior).
    older_header = cell_text(page, "compare-header-older")
    newer_header = cell_text(page, "compare-header-newer")
    if "Fuerza B" not in older_header or "2026-09-08" not in older_header:
        errors.append(f"headers: el anterior no muestra rutina+fecha esperadas: {older_header!r}")
    if "Fuerza C" not in newer_header or "2026-09-15" not in newer_header:
        errors.append(f"headers: el posterior no muestra rutina+fecha esperadas: {newer_header!r}")

    # Métricas iniciales: w2 (1000 kg) anterior vs w3 (400 kg) posterior → delta −60%.
    newer_volume = cell_text(page, "compare-newer-volume")
    if "400" not in newer_volume:
        errors.append(f"metricas: volumen posterior inicial != 400: {newer_volume!r}")
    if "−60%" not in newer_volume:
        errors.append(f"metricas: chip de delta sin signo de caída −60%: {newer_volume!r}")
    if cell_text(page, "compare-newer-newExercises") != "1":
        errors.append(f"metricas: ejercicios nuevos inicial != 1: {cell_text(page, 'compare-newer-newExercises')!r}")

    # Calorías (12ª métrica): w2 = 2 × (5 MET × 80 kg × 900 s) = 200 kcal; w3 = 50 kcal.
    older_calories = cell_text(page, "compare-older-calories")
    if "200 kcal" not in older_calories:
        errors.append(f"calorias: anterior != 200 kcal: {older_calories!r}")
    newer_calories = cell_text(page, "compare-newer-calories")
    if "50 kcal" not in newer_calories:
        errors.append(f"calorias: posterior != 50 kcal: {newer_calories!r}")
    if "−75%" not in newer_calories:
        errors.append(f"calorias: chip de delta sin −75% (50 vs 200): {newer_calories!r}")
    if page.locator('[data-testid="compare-newer-calories"] svg').count() == 0:
        errors.append("calorias: el chip de delta no lleva icono")

    # Semántica de tabla real: columnas, filas y grupos de bloque.
    if page.locator('[data-testid="session-comparison"] table').count() != 1:
        errors.append("a11y: la comparativa no usa una tabla")
    if page.locator('[data-testid="session-comparison"] th[scope="col"]').count() != 3:
        errors.append("a11y: nº de headers de columna != 3")
    if page.locator('[data-testid="session-comparison"] th[scope="colgroup"]').count() != 3:
        errors.append("a11y: nº de bloques (colgroup) != 3")
    row_headers = page.locator('[data-testid="session-comparison"] th[scope="row"]').count()
    if row_headers != 11:
        errors.append(f"a11y: nº de filas de métrica != 11: {row_headers}")

    # Piso tipográfico: el label de una fila debe medir >= 12px.
    label_size = page.locator('[data-testid="session-comparison"] th[scope="row"]').first.evaluate(
        "(el) => parseFloat(getComputedStyle(el).fontSize)"
    )
    if label_size < 12:
        errors.append(f"tipografia: label de métrica {label_size}px < 12px")

    # Barras de grupos musculares con valores visibles por sesión (estado inicial:
    # w2 en pierna = 1.0k y w3 en espalda = 400).
    muscle_rows = page.locator('[data-testid="compare-muscle-groups"] li').count()
    if muscle_rows == 0:
        errors.append("musculos: no se renderizan las barras por grupo muscular")
    else:
        muscle_text = page.locator('[data-testid="compare-muscle-groups"]').first.inner_text()
        for expected in ("Anterior", "Posterior", "1.0k kg", "400 kg"):
            if expected not in muscle_text:
                errors.append(f"musculos: falta {expected!r} en las barras: {muscle_text!r}")

    # El chip de delta siempre lleva icono (no depende solo del color).
    if page.locator('[data-testid="compare-newer-volume"] svg').count() == 0:
        errors.append("deltas: el chip de volumen no lleva icono de tendencia")

    # Cambiar la selección reordena por fecha y actualiza métricas (ahora w1 vs w2).
    page.select_option('[data-testid="compare-select-newer"]', value="1")
    page.wait_for_timeout(600)

    older_header2 = cell_text(page, "compare-header-older")
    newer_header2 = cell_text(page, "compare-header-newer")
    if "Fuerza A" not in older_header2 or "2026-09-01" not in older_header2:
        errors.append(f"seleccion: el anterior no se reordenó a Fuerza A: {older_header2!r}")
    if "Fuerza B" not in newer_header2:
        errors.append(f"seleccion: el posterior no quedó en Fuerza B: {newer_header2!r}")

    newer_volume2 = cell_text(page, "compare-newer-volume")
    if "1.0k" not in newer_volume2:
        errors.append(f"seleccion: volumen posterior no se actualizó a 1.0k: {newer_volume2!r}")
    if "+100%" not in newer_volume2:
        errors.append(f"seleccion: chip de delta sin signo de subida +100%: {newer_volume2!r}")
    if "500" not in cell_text(page, "compare-older-volume"):
        errors.append(f"seleccion: volumen anterior no se actualizó a 500: {cell_text(page, 'compare-older-volume')!r}")
    if cell_text(page, "compare-newer-newExercises") != "0":
        errors.append(f"seleccion: ejercicios nuevos no se actualizó a 0: {cell_text(page, 'compare-newer-newExercises')!r}")

    # w1 no tiene series temporizadas: calorías «—» sin chip (delta null), w2 mantiene 200 kcal.
    if cell_text(page, "compare-older-calories") != "—":
        errors.append(f"seleccion: calorías anteriores sin datos != «—»: {cell_text(page, 'compare-older-calories')!r}")
    if "200 kcal" not in cell_text(page, "compare-newer-calories"):
        errors.append(f"seleccion: calorías posteriores != 200 kcal: {cell_text(page, 'compare-newer-calories')!r}")
    if page.locator('[data-testid="compare-newer-calories"] svg').count() != 0:
        errors.append("seleccion: no debería haber chip de calorías cuando falta un lado")

    # Mobile-first: la tarjeta y sus celdas no deben desbordar en horizontal.
    metrics = page.locator('[data-testid="session-comparison"]').first.evaluate(
        "(el) => ({ sw: el.scrollWidth, cw: el.clientWidth })"
    )
    if metrics["sw"] > metrics["cw"] + 1:
        errors.append(f"layout: la tarjeta desborda en horizontal: {metrics}")
    for side in ("older", "newer"):
        box = page.locator(f'[data-testid="compare-{side}-volume"]').first.evaluate(
            "(el) => ({ sw: el.scrollWidth, cw: el.clientWidth })"
        )
        if box["sw"] > box["cw"] + 1:
            errors.append(f"layout: la celda {side}-volume desborda: {box}")

    comparison = page.locator('[data-testid="session-comparison"]').first
    comparison.evaluate("(el) => el.scrollIntoView({ block: 'start' })")
    page.wait_for_timeout(300)
    comparison.locator("table").first.screenshot(
        path=os.path.join(os.path.dirname(__file__), "shots", "f69-comparativa.png")
    )
    muscles = page.locator('[data-testid="compare-muscle-groups"]').first
    muscles.evaluate("(el) => el.scrollIntoView({ block: 'center' })")
    page.wait_for_timeout(300)
    muscles.screenshot(path=os.path.join(os.path.dirname(__file__), "shots", "f69-grupos-musculares.png"))


def check_empty_state(page, errors):
    boot(page, EMPTY_SEED_JS)
    open_historial(page)
    empty = page.locator('[data-testid="compare-empty"]')
    if empty.count() == 0:
        errors.append("vacio: sesiones sin series deberían mostrar mensaje de vacío")
    elif page.locator('[data-testid="session-comparison"] table').count() != 0:
        errors.append("vacio: no debería renderizarse la tabla de ceros")


def main():
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        page = browser.new_page(viewport={"width": 375, "height": 812})
        page_errors = []
        page.on("pageerror", lambda e: page_errors.append(f"pageerror: {e}"))
        try:
            check_comparison(page, errors)
        except Exception as e:
            errors.append(f"Exception (comparativa): {e}")
        finally:
            errors.extend(page_errors)
            page.close()

        page2 = browser.new_page(viewport={"width": 375, "height": 812})
        page_errors2 = []
        page2.on("pageerror", lambda e: page_errors2.append(f"pageerror: {e}"))
        try:
            check_empty_state(page2, errors)
        except Exception as e:
            errors.append(f"Exception (vacio): {e}")
        finally:
            errors.extend(page_errors2)
            page2.close()

        browser.close()

    if errors:
        print("ERRORS:")
        for e in errors:
            print(f"  - {e}")
        sys.exit(1)
    print("ALL OK")


if __name__ == "__main__":
    main()
