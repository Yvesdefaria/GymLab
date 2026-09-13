"""Fase 98.6 / 91.2: guardia automatizado de aislamiento de memo en la sesión.

Aproxima el método de traces de F91.6 (Chrome Performance, CPU 4x) de forma
reproducible en headless: se estrangula la CPU a 4x con CDP, se registran Long
Tasks (>50 ms) con PerformanceObserver y se teclea una ráfaga en el peso de UN
ejercicio de una sesión con varios ejercicios. Si el chip por bloque o los props
escalares vencieran el memo (91.2), el coste de render crecería de forma medible.

Referencia F91.6 (sesión fluida): ~12 long tasks / 876 ms total / máx 80 ms.
Presupuesto del guard: holgado para detectar regresión gruesa sin ser ruido.
"""
import sys, os, json, datetime
sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"

NOW = datetime.datetime.now(datetime.timezone.utc).isoformat().replace("+00:00", "Z")

# Presupuesto de regresión (no benchmarking absoluto). Los long tasks escalan con el
# número de eventos de input; un storm de memo se delataría por MUCHOS más long tasks
# que eventos (un render por bloque y por tecla) o por tareas muy largas.
KEYSTROKES = 12
INPUT_EVENTS = KEYSTROKES * 4  # fill (limpiar) + 3 dígitos por iteración
BUDGET_COUNT = INPUT_EVENTS + 8
BUDGET_TOTAL_MS = 6000
BUDGET_MAX_MS = 500

SEED_JS = """async () => {
  const openDb = () => new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const db = await openDb();
  await new Promise((res, rej) => {
    const tx = db.transaction(['exercises', 'meta'], 'readwrite');
    tx.objectStore('exercises').put({ id: 999, slug: 'sentadilla-f98-memo', name: 'Sentadilla F98 Memo', muscleGroup: 'pierna', equipment: 'barra', instructions: '', category: 'strength' });
    tx.objectStore('meta').put({ key: 'settings', value: JSON.stringify({ showRpe: true, showRir: true }) });
    tx.objectStore('meta').put({ key: 'onboardingDone', value: 'true' });
    tx.objectStore('meta').put({ key: 'unlockedAchievements', value: '["primera-marca"]' });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  return true;
}"""

OBSERVER_JS = """
window.__perf = { longTasks: [] };
try {
  new PerformanceObserver((list) => {
    for (const e of list.getEntries()) window.__perf.longTasks.push(e.duration);
  }).observe({ entryTypes: ['longtask'] });
} catch (_) {}
"""


def sessions_js():
    """Sesión con 4 ejercicios de fuerza (modo RPE/RIR) para exponer cualquier tormenta de render."""
    exercises = []
    for i, ex_id in enumerate([999, 1, 2, 3], start=1):
        name = f"Ejercicio Memo {i}"
        exercises.append({
            "exerciseId": ex_id,
            "exerciseName": name,
            "sets": [
                {"id": f"set-{i}-1", "exerciseId": ex_id, "exerciseName": name,
                 "setNumber": 1, "weightKg": 50 + i, "reps": 8, "completed": False},
                {"id": f"set-{i}-2", "exerciseId": ex_id, "exerciseName": name,
                 "setNumber": 2, "weightKg": 50 + i, "reps": 8, "completed": False},
            ],
        })
    return json.dumps({
        "state": {
            "workoutId": None, "startedAt": NOW, "routineId": None, "routineDayId": None,
            "exercises": exercises, "sessionNote": "", "restSeconds": 90, "restMode": "auto",
            "routineRestSec": None, "autoRestSeconds": 90, "warmupSeen": True, "restEndsAt": None,
        },
        "version": 0,
    })


def main():
    errors = []
    metrics = {}
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 375, "height": 812})
        context.add_init_script(f"localStorage.setItem('gymLab-activeWorkout', {json.dumps(sessions_js())})")
        page = context.new_page()
        console_errors = []
        page.on("console", lambda m: console_errors.append(f"console.{m.type}: {m.text}") if m.type == "error" else None)
        page.on("pageerror", lambda e: console_errors.append(f"pageerror: {e}"))

        try:
            page.goto(BASE, wait_until="networkidle")
            page.wait_for_timeout(700)
            assert page.evaluate(SEED_JS) is True, "seed fallo"
            # CPU 4x antes de la hydratación de la sesión, como en el método F91.6.
            cdp = context.new_cdp_session(page)
            cdp.send("Emulation.setCPUThrottlingRate", {"rate": 4})
            page.add_init_script(OBSERVER_JS)
            page.reload(wait_until="networkidle")
            page.wait_for_timeout(900)
            skip_ob = page.locator("button", has_text="Ya entreno aquí")
            if skip_ob.count() > 0:
                skip_ob.first.click(timeout=5000)
                page.wait_for_timeout(700)

            page.goto(f"{BASE}/entrenamiento/active", wait_until="networkidle")
            page.wait_for_timeout(1200)

            weights = page.locator('input[aria-label="Peso en kg"]')
            if weights.count() == 0:
                errors.append("memo: no hay inputs de peso en la sesión sembrada")
            else:
                page.evaluate("() => { window.__perf.longTasks = []; }")
                weights.first.click()
                # Ráfaga de tecleo con valores válidos (< MAX_WEIGHT_KG): cada pulsación
                # actualiza el store y re-renderiza el bloque, el escenario del storm 91.2.
                for _ in range(KEYSTROKES):
                    weights.first.fill("")
                    weights.first.press_sequentially("123", delay=45)
                page.wait_for_timeout(800)
                durations = page.evaluate("() => window.__perf.longTasks || []")
                total = sum(durations)
                longest = max(durations) if durations else 0
                avg = total / len(durations) if durations else 0
                metrics = {
                    "count": len(durations),
                    "total_ms": round(total, 1),
                    "max_ms": round(longest, 1),
                    "avg_ms": round(avg, 1),
                    "input_events": INPUT_EVENTS,
                }
                print(
                    "OK métricas: %s (referencia F91.6: 12 long tasks / 876 ms / máx 80 ms)"
                    % metrics
                )
                if len(durations) > BUDGET_COUNT:
                    errors.append(f"memo: demasiadas long tasks ({len(durations)} > {BUDGET_COUNT})")
                if total > BUDGET_TOTAL_MS:
                    errors.append(f"memo: coste de long tasks excesivo ({total:.0f} ms > {BUDGET_TOTAL_MS} ms)")
                if longest > BUDGET_MAX_MS:
                    errors.append(f"memo: long task individual excesiva ({longest:.0f} ms > {BUDGET_MAX_MS} ms)")
        except Exception as e:
            errors.append(f"Exception: {e}")
        finally:
            if console_errors:
                errors.extend(console_errors)
            page.close()
            context.close()
            browser.close()

    if errors:
        print("FALLO:")
        for e in errors:
            print(" -", e)
        return 1
    print(f"OK: F98/91.2 aislamiento de memo verificado con tecleo (CPU 4x) {metrics}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
