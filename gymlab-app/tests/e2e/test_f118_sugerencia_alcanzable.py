"""Fase 118: sugerencia de carga adaptativa alcanzable con settings de fábrica.

Escenarios (settings por defecto: RPE/RIR apagados):
A) La señal la lleva el motor: con historial real (dos sesiones a 60 kg) el botón
   «Sugerido: 62,5» aparece antes de la primera serie de trabajo; al completarla
   aparece el chip con el copy NEUTRO («Tu objetivo para las siguientes series:
   62,5 kg», sin afirmar «margen») y al aplicar escribe el OBJETIVO ABSOLUTO en
   las series pendientes vacías (G5: antes escribía el delta, 2,5).
B) Tope del PR: con PR 60 y precarga 60, el botón se oculta (nada que aplicar)
   pero el aviso del récord se muestra igual (G2) con el copy reformulado.
C) Toggle «Sugerir carga» apagado: no hay botón ni chip de peso (G3).
D) Deload activo: sin propuestas de subir (ni botón ni chip; S12).

Se verifica el estado persistido (zustand → localStorage) porque ese mismo estado
es el que alimenta la sesión en curso.
"""
import sys, os, json, datetime
sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"

TODAY = datetime.date.today().isoformat()
NOW = datetime.datetime.now(datetime.timezone.utc).isoformat().replace("+00:00", "Z")

EXERCISE = "Press de pecho con barra"
EXERCISE_ID = 1


def session_storage(sets):
    """Sesión activa sembrada con un ejercicio y las series dadas."""
    state = {
        "state": {
            "workoutId": None,
            "startedAt": NOW,
            "routineId": None,
            "routineDayId": None,
            "exercises": [{"exerciseId": EXERCISE_ID, "exerciseName": EXERCISE, "sets": sets}],
            "restSeconds": 90,
            "warmupSeen": True,
        },
        "version": 0,
    }
    return json.dumps(state)


def set_row(set_id, weight, completed=False):
    return {
        "id": set_id,
        "exerciseId": EXERCISE_ID,
        "exerciseName": EXERCISE,
        "setNumber": int(set_id.replace("s", "")),
        "weightKg": weight,
        "reps": 8,
        "completed": completed,
    }


# Historial: dos sesiones (hoy y hace 7 días) con top set 60 → promedio reciente 60 → objetivo 62,5.
_a = datetime.date.today()
_b = _a - datetime.timedelta(days=7)
SEED_HISTORY_JS = """async () => {
  const openDb = () => new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const db = await openDb();
  await new Promise((res, rej) => {
    const tx = db.transaction(['meta', 'workouts', 'workoutSets', 'prs'], 'readwrite');
    tx.objectStore('meta').put({ key: 'onboardingDone', value: 'true' });
    // Determinismo entre escenarios: el PR del escenario B no debe filtrarse al D.
    tx.objectStore('prs').delete(1);
    tx.objectStore('meta').put({ key: 'unlockedAchievements', value: JSON.stringify(['primer-paso', 'inaugural', 'primer-reto', 'racha-4', 'racha-8', 'primera-marca', 'volumen-semanal', 'sesiones-50', 'consistencia-4s', 'primera-cardio', 'ejercicios-100', 'racha-16', 'pr-10kg', 'guias-completas', 'sesiones-500', 'primer-ano']) });
    tx.objectStore('workouts').put({ id: 901, startedAt: '%NOW_A%', routineId: null, localDate: '%DAY_A%' });
    tx.objectStore('workouts').put({ id: 902, startedAt: '%NOW_B%', routineId: null, localDate: '%DAY_B%' });
    [901, 902].forEach((wid) => {
      tx.objectStore('workoutSets').put({ id: wid * 10 + 1, workoutId: wid, exerciseId: 1, setNumber: 1, weightKg: 60, reps: 8, completed: true, createdAt: '%NOW_A%' });
    });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  return true;
}""".replace("%NOW_A%", f"{_a.isoformat()}T10:00:00.000Z").replace("%DAY_A%", _a.isoformat())\
   .replace("%NOW_B%", f"{_b.isoformat()}T10:00:00.000Z").replace("%DAY_B%", _b.isoformat())

# PR del ejercicio 1 en 60: el objetivo (62,5) queda recortado al PR.
SEED_PR_JS = """async () => {
  const openDb = () => new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const db = await openDb();
  await new Promise((res, rej) => {
    const tx = db.transaction(['prs'], 'readwrite');
    tx.objectStore('prs').put({ exerciseId: 1, weightKg: 60, reps: 5, date: '2026-08-01', estimated1RM: 60 });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  return true;
}"""

# Ajustes: apagar «Sugerir carga» (se persiste como JSON en meta.settings).
SEED_SETTINGS_OFF_JS = """async () => {
  const openDb = () => new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const db = await openDb();
  await new Promise((res, rej) => {
    const tx = db.transaction(['meta'], 'readwrite');
    tx.objectStore('meta').put({ key: 'settings', value: JSON.stringify({ showLoadSuggestion: false }) });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  return true;
}"""

# Restaura el toggle por defecto (lo usa el escenario D tras apagarlo el C).
SEED_SETTINGS_ON_JS = """async () => {
  const openDb = () => new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const db = await openDb();
  await new Promise((res, rej) => {
    const tx = db.transaction(['meta'], 'readwrite');
    tx.objectStore('meta').put({ key: 'settings', value: JSON.stringify({ showLoadSuggestion: true }) });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  return true;
}"""

# Programa activo en deload (fechas RELATIVAS: el escenario no debe morir con el calendario).
_deload_start = (_a - datetime.timedelta(days=15)).isoformat()
_deload_until = (_a + datetime.timedelta(days=30)).isoformat()
SEED_DELOAD_JS = """async () => {
  const openDb = () => new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const db = await openDb();
  await new Promise((res, rej) => {
    const tx = db.transaction(['activeProgram'], 'readwrite');
    tx.objectStore('activeProgram').put({ id: 1, routineId: 1, startDate: '%START%', deloadActive: true, deloadUntil: '%UNTIL%' });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  return true;
}""".replace("%START%", _deload_start).replace("%UNTIL%", _deload_until)

# Precondición anclada del escenario D: lee la fila real del programa activo.
READ_DELOAD_JS = """async () => {
  const openDb = () => new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const db = await openDb();
  return await new Promise((res, rej) => {
    const tx = db.transaction(['activeProgram'], 'readonly');
    const req = tx.objectStore('activeProgram').get(1);
    req.onsuccess = () =>
      res(req.result ? { deloadActive: req.result.deloadActive === true, deloadUntil: req.result.deloadUntil } : null);
    req.onerror = () => rej(req.error);
  });
}"""


def read_store(page):
    raw = page.evaluate("() => localStorage.getItem('gymLab-activeWorkout')")
    return json.loads(raw)["state"] if raw else None


def wait_for_no_overlay(page, timeout_ms=8000):
    deadline = timeout_ms
    while deadline > 0:
        if page.locator("div.fixed.inset-0").count() == 0:
            return True
        page.wait_for_timeout(250)
        deadline -= 250
    return page.locator("div.fixed.inset-0").count() == 0


def open_session(page, storage):
    """Abre la sesión activa con el estado dado (entrar a la ruta no toca la precarga)."""
    page.evaluate("(state) => localStorage.setItem('gymLab-activeWorkout', state)", storage)
    page.goto(f"{BASE}/entrenamiento/active", wait_until="load")
    page.wait_for_timeout(1200)
    assert wait_for_no_overlay(page), "un modal persistente bloquea la pantalla"
    return page.locator("div.panel-light", has_text=EXERCISE)


def main():
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 375, "height": 812})
        page = context.new_page()
        console_errors = []
        page.on("console", lambda m: console_errors.append(f"console.{m.type}: {m.text}") if m.type == "error" else None)
        page.on("pageerror", lambda e: console_errors.append(f"pageerror: {e}"))

        try:
            # ---------- Escenario A: señal por motor, copy neutro y objetivo absoluto ----------
            page.goto(BASE, wait_until="load")
            assert page.evaluate(SEED_HISTORY_JS) is True, "seed de historial fallo"
            # Serie 1 pendiente a 60; las pendientes 2 y 3 VACÍAS (caso G5).
            open_session(page, session_storage([
                set_row("s1", 60), set_row("s2", 0), set_row("s3", 0),
            ]))

            block = page.locator("div.panel-light", has_text=EXERCISE)
            # El botón formatea con `formatWeight` (separador actual: punto); se toleran ambos.
            if "Sugerido: 62.5" not in block.inner_text() and "Sugerido: 62,5" not in block.inner_text():
                errors.append(f"A: no aparece el botón «Sugerido: 62.5»: {block.inner_text()[:200]}")
            else:
                print("OK A: botón «Sugerido: 62.5» antes de la primera serie (sin RPE)")

            complete = block.locator('button[aria-label="Marcar completada"]')
            if complete.count() == 0:
                errors.append("A: no hay botón para completar la primera serie")
            else:
                complete.first.click(timeout=5000)
                page.wait_for_timeout(700)

            block_text = block.inner_text()
            if "Tu objetivo para las siguientes series: 62,5 kg" not in block_text:
                errors.append(f"A: falta el chip con copy neutro: {block_text[:200]}")
            elif "margen" in block_text:
                errors.append("A: el mensaje afirma «margen» sin datos de esfuerzo")
            else:
                print("OK A: chip neutro «Tu objetivo para las siguientes series: 62,5 kg»")

            apply_btn = block.locator("button", has_text="Aplicar +2,5 kg")
            if apply_btn.count() == 0:
                errors.append("A: no está el botón de aplicar del chip")
            else:
                apply_btn.first.click(timeout=5000)
                page.wait_for_timeout(700)

            store = read_store(page)
            sets = store["exercises"][0]["sets"]
            pendings = [s for s in sets if not s["completed"]]
            pending_weights = [s["weightKg"] for s in pendings]
            if pending_weights != [62.5, 62.5]:
                errors.append(f"A (G5): las pendientes vacías no quedaron en el objetivo: {pendings}")
            else:
                print("OK A (G5): aplicar sobre series vacías escribe el objetivo (62.5), no el delta (2.5)")
            if sets[0]["completed"] and sets[0]["weightKg"] == 60:
                print("OK A: la serie completada conserva su peso")
            else:
                errors.append(f"A: la serie completada cambió: {sets[0]}")
            if block.locator("button", has_text="Aplicar +2,5 kg").count() > 0:
                errors.append("A: el chip sigue visible después de aplicarlo")

            # ---------- Escenario B: tope del PR (sin botón, con aviso) ----------
            assert page.evaluate(SEED_PR_JS) is True, "seed de PR fallo"
            block = open_session(page, session_storage([
                set_row("s1", 60), set_row("s2", 60), set_row("s3", 60),
            ]))
            text_b = block.inner_text()
            if "Estás en tu récord" not in text_b:
                errors.append(f"B (G2): falta el aviso del récord con el objetivo topado: {text_b[:200]}")
            elif "Sugerido:" in text_b:
                errors.append("B: el botón aparece cuando el objetivo coincide con la precarga")
            else:
                print("OK B (G2): aviso del récord visible sin botón (objetivo == precarga)")

            # ---------- Escenario C: toggle «Sugerir carga» apagado ----------
            assert page.evaluate(SEED_SETTINGS_OFF_JS) is True, "seed de settings fallo"
            block = open_session(page, session_storage([
                set_row("s1", 60), set_row("s2", 60), set_row("s3", 60),
            ]))
            text_c = block.inner_text()
            if "Sugerido:" in text_c or "Estás en tu récord" in text_c:
                errors.append(f"C (G3): con el toggle apagado sigue habiendo superficie de peso: {text_c[:200]}")
            else:
                complete = block.locator('button[aria-label="Marcar completada"]')
                complete.first.click(timeout=5000)
                page.wait_for_timeout(700)
                text_c = block.inner_text()
                if "Tu objetivo" in text_c or "Sube" in text_c or "Aplicar" in text_c:
                    errors.append(f"C (G3): chip de peso visible con el toggle apagado: {text_c[:200]}")
                else:
                    print("OK C (G3): toggle apagado sin botón, aviso ni chip de peso")

            # ---------- Escenario D: deload activo ----------
            # Fixture del A (sin PR, pendientes vacías): ahí el botón y el chip SÍ aparecen,
            # así que su ausencia con deload aísla la regla S12 (no la topa el PR).
            assert page.evaluate(SEED_HISTORY_JS) is True, "reset de historial fallo"
            assert page.evaluate(SEED_SETTINGS_ON_JS) is True, "restauración del toggle fallo"
            assert page.evaluate(SEED_DELOAD_JS) is True, "seed de deload fallo"
            deload_row = page.evaluate(READ_DELOAD_JS)
            if not (
                deload_row
                and deload_row.get("deloadActive")
                and (deload_row.get("deloadUntil") or "") > TODAY
            ):
                errors.append(f"D: la precondición de deload no está activa: {deload_row}")
            else:
                block = open_session(page, session_storage([
                    set_row("s1", 60), set_row("s2", 0), set_row("s3", 0),
                ]))
                text_d = block.inner_text()
                # Prueba VISIBLE de que la app resolvió el deload: la fila cargada muestra
                # la sugerencia −10% (60 → 54). Sin esto, la ausencia de propuestas de
                # subir podría pasar aunque la app ignorara el deload.
                if "54" not in text_d:
                    errors.append(f"D: la app no resolvió el deload (sin −10% de 60 → 54): {text_d[:200]}")
                elif "Sugerido:" in text_d:
                    errors.append(f"D (S12): el botón propone subir con deload activo: {text_d[:200]}")
                else:
                    complete = block.locator('button[aria-label="Marcar completada"]')
                    complete.first.click(timeout=5000)
                    page.wait_for_timeout(700)
                    text_d = block.inner_text()
                    if "Tu objetivo" in text_d or "Sube" in text_d:
                        errors.append(f"D (S12): chip de subir visible con deload activo: {text_d[:200]}")
                    else:
                        print("OK D (S12): deload activo sin propuestas de subir (fixture donde sin deload sí aparecen)")

        except Exception as e:
            errors.append(f"Exception: {e}")
        finally:
            if console_errors:
                errors.extend(console_errors)
            page.close()
            browser.close()

    if errors:
        print("ERRORS:")
        for e in errors:
            print(f"  - {e}")
        sys.exit(1)
    print("ALL OK: F118 sugerencia alcanzable (señal por motor, G2/G3/G5/S12)")


if __name__ == "__main__":
    main()
