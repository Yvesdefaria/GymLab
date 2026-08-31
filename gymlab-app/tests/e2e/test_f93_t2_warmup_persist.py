"""Fase 93 #2: el calentamiento (warmup) no debe reaparecer si se termina o salta
ni al reentrar/recargar la sesion. El flag warmupSeen persiste en el store.

Flujo: sembrar sesion activa via localStorage del store persistido ->
cargar /entrenamiento/active -> el warmup aparece la 1a vez -> saltarlo ->
recargar -> el warmup NO reaparece.
"""
import sys, os, json, datetime
sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"

NOW = datetime.datetime.now(datetime.timezone.utc).isoformat().replace("+00:00", "Z")


def active_workout_storage(seen):
    """Snapshot persistido del store de sesion activa (zustand persist 'gymLab-activeWorkout')."""
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
                        {
                            "id": "set-1",
                            "exerciseId": 1,
                            "exerciseName": "Press de pecho con barra",
                            "setNumber": 1,
                            "weightKg": 60,
                            "reps": 8,
                            "completed": False,
                        }
                    ],
                }
            ],
            "restSeconds": 90,
            "warmupSeen": seen,
        },
        "version": 0,
    }
    return json.dumps(state)


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
            # 1) Sesion activa SIN warmup visto -> el warmup debe aparecer.
            # Solo se siembra si el store no existe, para no sobrescribir el flag al recargar.
            page.add_init_script(f"""
              if (!localStorage.getItem('gymLab-activeWorkout')) {{
                localStorage.setItem('gymLab-activeWorkout', {json.dumps(active_workout_storage(False))});
              }}
            """)
            page.goto(BASE, wait_until="networkidle")
            # Marcar onboarding como hecho para que no bloquee la sesion.
            page.evaluate("""async () => {
              const r = indexedDB.open('GymLabDB');
              const db = await new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
              await new Promise((res, rej) => {
                const tx = db.transaction('meta', 'readwrite');
                tx.objectStore('meta').put({ key: 'onboardingDone', value: true });
                tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error);
              });
            }""")
            page.goto(f"{BASE}/entrenamiento/active", wait_until="networkidle")
            page.wait_for_timeout(1500)
            warmup_title = page.locator("text=Calentamiento")
            if warmup_title.count() == 0:
                warmup_title = page.locator("p", has_text="Calentamiento")
            first_seen = warmup_title.count() > 0
            if not first_seen:
                errors.append("El warmup no aparece en una sesion activa nueva")
            else:
                print("OK: warmup aparece la primera vez")

            # Saltar el warmup (skipAll).
            skip_all = page.locator("button", has_text="Saltar calentamiento")
            if skip_all.count() == 0:
                skip_all = page.locator("button", has_text="Saltar todo")
            if skip_all.count() > 0:
                skip_all.first.click(timeout=5000)
                page.wait_for_timeout(500)

            # 2) Recargar -> el warmup NO debe reaparecer (flag persistido).
            page.reload(wait_until="networkidle")
            page.wait_for_timeout(1500)
            warmup_after = page.locator("p", has_text="Calentamiento")
            if warmup_after.count() > 0:
                errors.append("BUG: el warmup reaparece tras recargar aunque se salto")
            else:
                print("OK: el warmup no reaparece tras recargar")

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