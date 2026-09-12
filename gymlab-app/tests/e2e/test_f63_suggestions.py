"""Fase 63: sugerencias de sesión con acciones de un toque.

Escenarios:
1) Calentamiento: con un PR conocido (e1RM 100) y la primera serie de trabajo
   al 80% de ese máximo, aparece la sugerencia warmup y al pulsar el botón se
   inserta un set isWarmup (~45% del peso) al inicio, renumerando el resto.
2) Aplicar peso: con series completadas a RPE bajo, la sugerencia increase
   trae el botón "Aplicar +2.5 kg" que actualiza las series pendientes.

Se verifica el estado persistido (zustand → localStorage) porque ese mismo
estado es el que se guarda al finalizar y alimenta la precarga de la próxima
sesión vía historial (workoutSetRepo.getLastSets).
"""
import sys, os, json, datetime
sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"

NOW = datetime.datetime.now(datetime.timezone.utc).isoformat().replace("+00:00", "Z")


def active_workout_storage():
    """Sesión activa sembrada: 2 ejercicios (aumento + calentamiento)."""
    state = {
        "state": {
            "workoutId": None,
            "startedAt": NOW,
            "routineId": None,
            "routineDayId": None,
            "exercises": [
                {
                    "exerciseId": 1,
                    "exerciseName": "Press de pecho con barra",
                    "sets": [
                        {"id": "set-a1", "exerciseId": 1, "exerciseName": "Press de pecho con barra",
                         "setNumber": 1, "weightKg": 60, "reps": 8, "completed": True, "rpe": 5, "rir": 3},
                        {"id": "set-a2", "exerciseId": 1, "exerciseName": "Press de pecho con barra",
                         "setNumber": 2, "weightKg": 60, "reps": 8, "completed": True, "rpe": 5, "rir": 3},
                        {"id": "set-a3", "exerciseId": 1, "exerciseName": "Press de pecho con barra",
                         "setNumber": 3, "weightKg": 60, "reps": 8, "completed": False},
                    ],
                },
                {
                    "exerciseId": 2,
                    "exerciseName": "Sentadilla",
                    "sets": [
                        {"id": "set-b1", "exerciseId": 2, "exerciseName": "Sentadilla",
                         "setNumber": 1, "weightKg": 80, "reps": 8, "completed": True, "rpe": 7, "rir": 2},
                        {"id": "set-b2", "exerciseId": 2, "exerciseName": "Sentadilla",
                         "setNumber": 2, "weightKg": 80, "reps": 8, "completed": False},
                    ],
                },
            ],
            "restSeconds": 90,
            "warmupSeen": True,  # evitar el calentamiento guiado (ya cubierto en t2).
        },
        "version": 0,
    }
    return json.dumps(state)


SEED_DB_JS = """async () => {
  const openDb = () => new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const db = await openDb();
  await new Promise((res, rej) => {
    const tx = db.transaction(['meta', 'prs'], 'readwrite');
    tx.objectStore('meta').put({ key: 'onboardingDone', value: 'true' });
    // Sin PR previo el hook de logros muestra el modal «Primera marca» al detectar
    // los PRs del seed; lo marcamos como ya desbloqueado (string JSON, como setJson).
    tx.objectStore('meta').put({ key: 'unlockedAchievements', value: '["primera-marca"]' });
    // PRs por ejercicio: e1RM 100 -> Press 60 es 60% (sin warmup) y Sentadilla 80 es 80% (warmup).
    tx.objectStore('prs').put({ exerciseId: 1, weightKg: 100, reps: 5, date: '2026-08-01', estimated1RM: 100 });
    tx.objectStore('prs').put({ exerciseId: 2, weightKg: 80, reps: 5, date: '2026-08-01', estimated1RM: 100 });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  return true;
}"""


def read_store(page):
    """Devuelve el estado persistido del store de sesión activa (parsed)."""
    raw = page.evaluate("() => localStorage.getItem('gymLab-activeWorkout')")
    return json.loads(raw)["state"] if raw else None


def wait_for_no_overlay(page, timeout_ms=8000):
    """Espera a que desaparezcan los modales transitorios de hidratación (p.ej. novedades/onboarding)."""
    deadline = timeout_ms
    while deadline > 0:
        overlays = page.locator("div.fixed.inset-0")
        if overlays.count() == 0:
            return True
        for k in range(min(overlays.count(), 2)):
            print(f"OVERLAY {k}:", overlays.nth(k).inner_text()[:200].replace("\n", " | "))
        page.wait_for_timeout(250)
        deadline -= 250
    return page.locator("div.fixed.inset-0").count() == 0


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
            page.add_init_script(f"""
              if (!localStorage.getItem('gymLab-activeWorkout')) {{
                localStorage.setItem('gymLab-activeWorkout', {json.dumps(active_workout_storage())});
              }}
            """)
            page.goto(BASE, wait_until="networkidle")
            seed_result = page.evaluate(SEED_DB_JS)
            assert seed_result is True, f"seed fallo: {seed_result}"
            page.goto(f"{BASE}/entrenamiento/active", wait_until="networkidle")
            page.wait_for_timeout(1500)
            assert wait_for_no_overlay(page), "un modal persistente bloquea la pantalla tras la carga"

            body = page.inner_text("body")

            # 1) Sugerencia de calentamiento (80% del e1RM) con su botón.
            if "Empiezas al 80% de tu máximo" not in body:
                errors.append("No aparece la sugerencia de calentamiento (Empiezas al 80%...)")
            else:
                print("OK: sugerencia de calentamiento visible (80% del e1RM)")
            add_warmup_btn = page.locator("button", has_text="Añadir set de calentamiento")
            if add_warmup_btn.count() == 0:
                errors.append("No aparece el botón 'Añadir set de calentamiento'")
            else:
                assert wait_for_no_overlay(page)
                add_warmup_btn.first.click(timeout=5000)
                page.wait_for_timeout(800)

            # El set de calentamiento (~45% de 80 = 36) se inserta al inicio, isWarmup y renumerado.
            store = read_store(page)
            sets_b = store["exercises"][1]["sets"]
            if not (sets_b and sets_b[0].get("isWarmup") is True and sets_b[0]["weightKg"] == 36):
                errors.append(f"El set de calentamiento no se insertó bien: {sets_b}")
            elif sets_b[0]["setNumber"] != 1 or sets_b[1]["setNumber"] != 2:
                errors.append(f"Las series no se renumeraron tras el warmup: {sets_b}")
            else:
                print("OK: set de calentamiento 36 kg insertado al inicio y renumerado")

            # La sugerencia aplicada desaparece (estado applied).
            page.wait_for_timeout(400)
            if page.locator("button", has_text="Añadir set de calentamiento").count() > 0:
                errors.append("La sugerencia de warmup sigue visible tras aplicarla")
            else:
                print("OK: la sugerencia de warmup desaparece al aplicarla")

            # 2) Aplicar +2.5 kg a las series pendientes.
            apply_btn = page.locator("button", has_text="Aplicar +2.5 kg")
            if apply_btn.count() == 0:
                errors.append("No aparece el botón 'Aplicar +2.5 kg' (sugerencia increase)")
            else:
                assert wait_for_no_overlay(page)
                apply_btn.first.click(timeout=5000)
                page.wait_for_timeout(800)
                store = read_store(page)
                sets_a = store["exercises"][0]["sets"]
                pending = [s for s in sets_a if not s["completed"]]
                if pending and pending[0]["weightKg"] != 62.5:
                    errors.append(f"El peso pendiente no subió a 62.5: {pending}")
                else:
                    print("OK: serie pendiente actualizada a 62.5 kg (aplicar +2.5)")
                page.wait_for_timeout(400)
                if page.locator("button", has_text="Aplicar +2.5 kg").count() > 0:
                    errors.append("La sugerencia increase sigue visible tras aplicarla")
                else:
                    print("OK: la sugerencia increase desaparece al aplicarla")

            # 3) Las completadas y el warmup no se tocaron al aplicar peso.
            store = read_store(page)
            sets_a = store["exercises"][0]["sets"]
            if any(s["completed"] and s["weightKg"] != 60 for s in sets_a):
                errors.append("Se modificó una serie completada al aplicar peso")
            else:
                print("OK: las series completadas conservan su peso")

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
    else:
        print("ALL OK")


if __name__ == "__main__":
    main()