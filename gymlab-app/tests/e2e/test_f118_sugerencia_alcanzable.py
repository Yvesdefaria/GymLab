"""Fase 118 (regresión bajo F122): superficies del motor F118 dentro del flujo nuevo.

Con F122 la propuesta del día (escalada) reemplaza al botón «Sugerido» y el chip de subida
se retiró; esta regresión fija lo que sigue vigente de F118, con settings de fábrica
(RPE/RIR apagados) y fechas relativas:
A) G5 (objetivo absoluto): con evidencia (doble progresión 80: 10 → 14 reps y 90 conocido),
   aplicar la escalada escribe los pesos ABSOLUTOS en orden sobre series VACÍAS (no deltas),
   las completadas no se tocan y la propuesta se oculta al aplicarla.
B) G2 (aviso del récord): con PR 82 y pendientes YA en la escalada recortada (80/80/82),
   el aviso «Estás en tu récord» se muestra aunque el botón no aparezca.
C) G3 (toggle): apagado «Sugerir carga», ninguna superficie de peso (ni escalada ni aviso).
D) S12 (deload): con la semana de deload activa no hay propuesta de subir aunque el fixture
   sin deload sí la muestra; la app resuelve el deload (la fila muestra el −10 %: 80 → 72).

El estado se verifica contra el store persistido (zustand → localStorage), el mismo que
alimenta la sesión en curso.
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

ACHIEVEMENTS = ['primer-paso', 'inaugural', 'primer-reto', 'racha-4', 'racha-8', 'primera-marca',
                'volumen-semanal', 'sesiones-50', 'consistencia-4s', 'primera-cardio', 'ejercicios-100',
                'racha-16', 'pr-10kg', 'guias-completas', 'sesiones-500', 'primer-ano']


def days_ago(days):
    return (datetime.date.today() - datetime.timedelta(days=days)).isoformat()


def session_rows(wid, day, weight, reps, n=3):
    date = days_ago(day)
    workouts = [{"id": wid, "startedAt": f"{date}T10:00:00.000Z", "routineId": None, "localDate": date}]
    sets = [
        {"id": wid * 100 + i, "workoutId": wid, "exerciseId": EXERCISE_ID, "setNumber": i,
         "weightKg": weight, "reps": reps, "completed": True, "createdAt": f"{date}T10:00:00.000Z"}
        for i in range(1, n + 1)
    ]
    return workouts, sets


def seed_history(sessions, pr_weight=None):
    """Limpia el historial y siembra las sesiones dadas (y opcionalmente un PR)."""
    workouts = [w for ws, _ in sessions for w in ws]
    sets = [s for _, ss in sessions for s in ss]
    pr_put = (
        f"tx.objectStore('prs').put({{ exerciseId: 1, weightKg: {pr_weight}, reps: 5, "
        f"date: '{days_ago(30)}T10:00:00.000Z', estimated1RM: {pr_weight} }});"
        if pr_weight is not None else ""
    )
    return ("""async () => {
  const openDb = () => new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const db = await openDb();
  await new Promise((res, rej) => {
    const tx = db.transaction(['meta', 'workouts', 'workoutSets', 'prs'], 'readwrite');
    tx.objectStore('meta').put({ key: 'onboardingDone', value: 'true' });
    tx.objectStore('meta').put({ key: 'unlockedAchievements', value: %ACH% });
    tx.objectStore('prs').clear();
    tx.objectStore('workouts').clear();
    tx.objectStore('workoutSets').clear();
    %PR%
    const workouts = %WORKOUTS%;
    const sets = %SETS%;
    workouts.forEach((w) => tx.objectStore('workouts').put(w));
    sets.forEach((s) => tx.objectStore('workoutSets').put(s));
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  return true;
}"""
            .replace("%ACH%", json.dumps(json.dumps(ACHIEVEMENTS)))
            .replace("%PR%", pr_put)
            .replace("%WORKOUTS%", json.dumps(workouts))
            .replace("%SETS%", json.dumps(sets)))


# Evidencia: 90 conocido + base 80 con 10→14 sostenido (la misma raíz que test_f122).
EVIDENCE_SESSIONS = [
    session_rows(901, 60, 90, 8, n=2),
    session_rows(902, 25, 80, 10),
    session_rows(903, 20, 80, 14),
    session_rows(904, 17, 80, 14),
    session_rows(905, 14, 80, 14),
    session_rows(906, 10, 80, 14),
    session_rows(907, 5, 80, 14),
]


def session_storage(rows):
    state = {
        "state": {
            "workoutId": None,
            "startedAt": NOW,
            "routineId": None,
            "routineDayId": None,
            "exercises": [{"exerciseId": EXERCISE_ID, "exerciseName": EXERCISE, "sets": rows}],
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
_deload_start = days_ago(15)
_deload_until = (datetime.date.today() + datetime.timedelta(days=30)).isoformat()
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
            # ---------- Escenario A: G5 — la escalada escribe objetivos absolutos ----------
            page.goto(BASE, wait_until="load")
            assert page.evaluate(seed_history(EVIDENCE_SESSIONS)) is True, "seed de evidencia falló"
            block = open_session(page, session_storage([
                set_row("s1", 80, completed=True), set_row("s2", 0), set_row("s3", 0),
            ]))
            try:
                block.locator("button", has_text="Escalada").first.wait_for(state="visible", timeout=10000)
            except Exception:
                pass
            if block.locator("button", has_text="Escalada").count() == 0:
                errors.append(f"A: no aparece la propuesta de escalada: {block.inner_text()[:200]}")
            else:
                block.locator("button", has_text="Escalada").first.click(timeout=5000)
                page.wait_for_timeout(700)
                store = read_store(page)
                sets = store["exercises"][0]["sets"]
                pendings = [s for s in sets if not s["completed"]]
                pending_weights = [s["weightKg"] for s in pendings]
                if pending_weights != [80, 90]:
                    errors.append(f"A (G5): las pendientes vacías no quedaron en los objetivos absolutos: {pendings}")
                else:
                    print("OK A (G5): aplicar escribe los objetivos absolutos (80, 90), no deltas")
                if sets[0]["completed"] and sets[0]["weightKg"] == 80:
                    print("OK A: la serie completada conserva su peso")
                else:
                    errors.append(f"A: la serie completada cambió: {sets[0]}")
                if block.locator("button", has_text="Escalada").count() > 0:
                    errors.append("A: la propuesta sigue visible después de aplicarla")

            # ---------- Escenario B: G2 — aviso del récord sin botón (pendientes == escalada) ----------
            assert page.evaluate(seed_history(EVIDENCE_SESSIONS, pr_weight=82)) is True, "seed de PR falló"
            block = open_session(page, session_storage([
                set_row("s1", 80), set_row("s2", 80), set_row("s3", 82),
            ]))
            try:
                block.locator("p", has_text="Estás en tu récord").first.wait_for(state="visible", timeout=10000)
            except Exception:
                pass
            text_b = block.inner_text()
            if "Estás en tu récord" not in text_b:
                errors.append(f"B (G2): falta el aviso del récord con el objetivo topado: {text_b[:200]}")
            elif "Escalada" in text_b:
                errors.append("B: el botón aparece cuando las pendientes ya son la escalada")
            else:
                print("OK B (G2): aviso del récord visible sin botón (pendientes == escalada recortada)")

            # ---------- Escenario C: G3 — toggle «Sugerir carga» apagado ----------
            assert page.evaluate(SEED_SETTINGS_OFF_JS) is True, "seed de settings falló"
            block = open_session(page, session_storage([
                set_row("s1", 80), set_row("s2", 80), set_row("s3", 80),
            ]))
            # Aserciones de AUSENCIA: se deja asentar la cadena async (liveQuery de ajustes).
            page.wait_for_timeout(1200)
            text_c = block.inner_text()
            if "Escalada" in text_c or "Estás en tu récord" in text_c:
                errors.append(f"C (G3): con el toggle apagado sigue habiendo superficie de peso: {text_c[:200]}")
            else:
                print("OK C (G3): toggle apagado sin propuesta ni aviso de peso")

            # ---------- Escenario D: S12 — deload activo ----------
            assert page.evaluate(SEED_SETTINGS_ON_JS) is True, "restauración del toggle falló"
            assert page.evaluate(SEED_DELOAD_JS) is True, "seed de deload falló"
            deload_row = page.evaluate(READ_DELOAD_JS)
            if not (
                deload_row
                and deload_row.get("deloadActive")
                and (deload_row.get("deloadUntil") or "") > TODAY
            ):
                errors.append(f"D: la precondición de deload no está activa: {deload_row}")
            else:
                block = open_session(page, session_storage([
                    set_row("s1", 80), set_row("s2", 0), set_row("s3", 0),
                ]))
                try:
                    block.get_by_text("72", exact=False).first.wait_for(state="visible", timeout=10000)
                except Exception:
                    pass
                text_d = block.inner_text()
                # Prueba VISIBLE de que la app resolvió el deload: la fila muestra −10 % (80 → 72).
                if "72" not in text_d:
                    errors.append(f"D: la app no resolvió el deload (sin −10 % de 80 → 72): {text_d[:200]}")
                elif "Escalada" in text_d:
                    errors.append(f"D (S12): hay propuesta de subir con deload activo: {text_d[:200]}")
                else:
                    print("OK D (S12): deload activo sin propuesta de subir (fixture que sin deload sí la muestra)")

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
    print("ALL OK: F118 regresión bajo F122 (G5 absoluto, G2, G3, S12)")


if __name__ == "__main__":
    main()
