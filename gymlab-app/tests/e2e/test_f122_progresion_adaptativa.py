"""Fase 122: progresión adaptativa v2 — propuesta del día (escalada) y freno de ritmo.

Escenarios (settings de fábrica: RPE/RIR apagados):
A) Evidencia → escalada: historial con doble progresión sostenida (80 kg: 10 → 14 reps en
   las últimas 2 sesiones) y terreno conocido (90 kg) → la propuesta «Escalada: 80 → 90»
   aparece antes de la primera serie; al aplicarla, las pendientes quedan 80 y 90
   (absolutas, en orden) y la propuesta se oculta. La completada no se toca.
B) Silencio sin evidencia: historial estable (80×8 ×2) → sin propuesta de peso; tras
   completar una serie tampoco aparece ningún chip de subida.
C) Freno de ritmo: subida rápida sostenida (80 → 85 → 90 en 2 semanas = 6,25 %/semana)
   → aviso «Consolidando» visible y sin botón de escalada.
D) Calentamiento a pedido: el botón agrega UNA serie al 45 % del primer peso pendiente
   (80 → 36) al inicio, renumerando el resto.
E) Sin historial: sin propuesta ni avisos.
F) 0 errores de consola o de página.

El estado se verifica en el store persistido (zustand → localStorage), el mismo que
alimenta la sesión en curso. Fechas RELATIVAS (lección F118): las fijas mueren con el
calendario.
"""
import sys, os, json, datetime
sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"

TODAY = datetime.date.today()
NOW = datetime.datetime.now(datetime.timezone.utc).isoformat().replace("+00:00", "Z")

EXERCISE = "Press de pecho con barra"
EXERCISE_ID = 1

ACHIEVEMENTS = ['primer-paso', 'inaugural', 'primer-reto', 'racha-4', 'racha-8', 'primera-marca',
                'volumen-semanal', 'sesiones-50', 'consistencia-4s', 'primera-cardio', 'ejercicios-100',
                'racha-16', 'pr-10kg', 'guias-completas', 'sesiones-500', 'primer-ano']


def days_ago(days):
    return (TODAY - datetime.timedelta(days=days)).isoformat()


def session_rows(wid, day, weight, reps, n=3):
    """Sesión de historial: n series completadas al mismo peso/reps, fechada hace `day` días."""
    date = days_ago(day)
    workouts = [{"id": wid, "startedAt": f"{date}T10:00:00.000Z", "routineId": None, "localDate": date}]
    sets = [
        {"id": wid * 100 + i, "workoutId": wid, "exerciseId": EXERCISE_ID, "setNumber": i,
         "weightKg": weight, "reps": reps, "completed": True, "createdAt": f"{date}T10:00:00.000Z"}
        for i in range(1, n + 1)
    ]
    return workouts, sets


def seed_history(sessions):
    """Limpia el historial (workouts/sets/prs) y siembra las sesiones dadas."""
    workouts = [w for ws, _ in sessions for w in ws]
    sets = [s for _, ss in sessions for s in ss]
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
            .replace("%WORKOUTS%", json.dumps(workouts))
            .replace("%SETS%", json.dumps(sets)))


# Evidencia: 90 kg conocido (2 series en una sesión antigua) + base 80 con 10→14 reps
# sostenidas en las últimas 2 sesiones (raíz: base 80, margen +4, velocidad 0, fresco ✓).
EVIDENCE_SESSIONS = [
    session_rows(901, 60, 90, 8, n=2),
    session_rows(902, 25, 80, 10),
    session_rows(903, 20, 80, 14),
    session_rows(904, 17, 80, 14),
    session_rows(905, 14, 80, 14),
    session_rows(906, 10, 80, 14),
    session_rows(907, 5, 80, 14),
]
# Silencio: dos sesiones estables a 80×8 (sin margen: el peso se repite pero la mejora no).
STABLE_SESSIONS = [session_rows(911, 7, 80, 8), session_rows(912, 0, 80, 8)]
# Freno: 80 → 85 → 90 en dos semanas (6,25 %/semana > 2,5 %).
FAST_SESSIONS = [session_rows(921, 14, 80, 8), session_rows(922, 7, 85, 8), session_rows(923, 0, 90, 8)]


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
            # ---------- Escenario A: evidencia → escalada y aplicación absoluta ----------
            page.goto(BASE, wait_until="load")
            assert page.evaluate(seed_history(EVIDENCE_SESSIONS)) is True, "seed de evidencia falló"
            block = open_session(page, session_storage([
                set_row("s1", 80, completed=True), set_row("s2", 0), set_row("s3", 0),
            ]))

            try:
                block.locator("button", has_text="Escalada").first.wait_for(state="visible", timeout=10000)
            except Exception:
                pass
            text_a = block.inner_text()
            if "Escalada: 80 kg → 90 kg" not in text_a or "kg kg" in text_a:
                errors.append(f"A: la propuesta no muestra el rango exacto (¿unidad duplicada?): {text_a[:200]}")
            else:
                print("OK A: propuesta «Escalada: 80 kg → 90 kg» visible antes de la primera serie")

            apply_btn = block.locator("button", has_text="Escalada")
            if apply_btn.count() == 0:
                errors.append("A: no hay botón de escalada para aplicar")
            else:
                apply_btn.first.click(timeout=5000)
                page.wait_for_timeout(700)

            store = read_store(page)
            sets = store["exercises"][0]["sets"]
            pendings = [s for s in sets if not s["completed"]]
            pending_weights = [s["weightKg"] for s in pendings]
            if pending_weights != [80, 90]:
                errors.append(f"A: las pendientes no quedaron en la escalada absoluta: {pendings}")
            else:
                print("OK A: aplicar la escalada escribió los pesos absolutos en orden (80, 90)")
            if sets[0]["completed"] and sets[0]["weightKg"] == 80:
                print("OK A: la serie completada conserva su peso")
            else:
                errors.append(f"A: la serie completada cambió: {sets[0]}")
            if block.locator("button", has_text="Escalada").count() > 0:
                errors.append("A: la propuesta sigue visible después de aplicarla")

            # ---------- Escenario B: silencio sin evidencia ----------
            assert page.evaluate(seed_history(STABLE_SESSIONS)) is True, "seed estable falló"
            block = open_session(page, session_storage([
                set_row("s1", 80), set_row("s2", 80), set_row("s3", 80),
            ]))
            page.wait_for_timeout(1200)
            text_b = block.inner_text()
            forbidden = ["Escalada", "Consolidando", "Sugerido", "Tu objetivo"]
            found = [f for f in forbidden if f in text_b]
            if found:
                errors.append(f"B: superficies visibles sin evidencia {found}: {text_b[:200]}")
            else:
                complete = block.locator('button[aria-label="Marcar completada"]')
                complete.first.click(timeout=5000)
                page.wait_for_timeout(1200)
                text_b = block.inner_text()
                found = [f for f in forbidden if f in text_b]
                if found:
                    errors.append(f"B: superficies de peso tras completar {found}: {text_b[:200]}")
                else:
                    print("OK B: sin evidencia no hay propuesta ni chip de subida")

            # ---------- Escenario C: freno (consolidando) ----------
            assert page.evaluate(seed_history(FAST_SESSIONS)) is True, "seed rápido falló"
            block = open_session(page, session_storage([
                set_row("s1", 90), set_row("s2", 90), set_row("s3", 90),
            ]))
            try:
                block.locator("p", has_text="Consolidando").first.wait_for(state="visible", timeout=10000)
            except Exception:
                pass
            text_c = block.inner_text()
            if "Consolidando" not in text_c:
                errors.append(f"C: falta el aviso de consolidación: {text_c[:200]}")
            elif "Escalada" in text_c:
                errors.append(f"C: hay propuesta de escalada con el freno activo: {text_c[:200]}")
            else:
                print("OK C: aviso «Consolidando» visible y sin botón con subida acelerada")

            # ---------- Escenario D: calentamiento a pedido ----------
            assert page.evaluate(seed_history(STABLE_SESSIONS)) is True, "seed estable (D) falló"
            block = open_session(page, session_storage([
                set_row("s1", 80), set_row("s2", 80), set_row("s3", 80),
            ]))
            warmup_btn = block.locator('button[aria-label="Agregar una serie de calentamiento"]')
            if warmup_btn.count() == 0:
                errors.append("D: no está el botón de calentamiento")
            else:
                warmup_btn.first.click(timeout=5000)
                page.wait_for_timeout(700)
                sets_d = read_store(page)["exercises"][0]["sets"]
                if not (sets_d and sets_d[0].get("isWarmup") is True and sets_d[0]["weightKg"] == 36):
                    errors.append(f"D: el calentamiento no se insertó al 45 % (36 kg): {sets_d}")
                elif sets_d[0]["setNumber"] != 1 or sets_d[1]["setNumber"] != 2:
                    errors.append(f"D: las series no se renumeraron tras el calentamiento: {sets_d}")
                else:
                    print("OK D: una serie de calentamiento al 45 % (36 kg), insertada y renumerada")

            # ---------- Escenario E: sin historial ----------
            assert page.evaluate(seed_history([])) is True, "limpieza final falló"
            block = open_session(page, session_storage([
                set_row("s1", 80), set_row("s2", 80), set_row("s3", 80),
            ]))
            page.wait_for_timeout(1200)
            text_e = block.inner_text()
            found = [f for f in forbidden if f in text_e]
            if found:
                errors.append(f"E: superficies visibles sin historial {found}: {text_e[:200]}")
            else:
                print("OK E: sin historial no hay propuesta ni avisos")

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
    print("ALL OK: F122 progresión adaptativa v2 (escalada, silencio, freno, calentamiento)")


if __name__ == "__main__":
    main()
