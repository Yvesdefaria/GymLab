"""Fase 93 #20: técnica visible en las fichas de ejercicio (derivada y propia) + tips/warnings + modal de sesión con fallback.

Verifica que:
- `/ejercicios/exercise-ball-crunch` (id 1242, catálogo ampliado, sin detailedSteps
  en seed) muestra el bloque «Técnica» con la lista numerada derivada de la plantilla
  de instrucción (números 1..n visibles) y al menos un tip o warning renderizado.
- `/ejercicios/press-de-pecho-con-barra` (curado con pasos propios en seed) muestra
  el mismo bloque «Técnica» con lista numerada.
- En una sesión activa sembrada con `press-declinado` (sin checklist propia pero con
  pasos derivados por plantilla), el modal de técnica muestra los pasos numerados
  (no «No hay datos»).
- 0 errores de consola.
"""
import sys, os, json, datetime
sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"

DERIVED_SLUG = "exercise-ball-crunch"
CURATED_SLUG = "press-de-pecho-con-barra"
# Ejercicio sin checklist propia en TECHNIQUE_DATA pero con pasos derivados por plantilla.
NO_CHECKLIST_ID = 41  # press-declinado

# Texto de tip/warning esperado en la ficha del derivado (plantilla 'Flexiona el tronco...').
DERIVED_TIP_OR_WARNING = "No hagas el movimiento a tirones"

NOW = datetime.datetime.now(datetime.timezone.utc).isoformat().replace("+00:00", "Z")


def active_workout_storage(exercise_id, name):
    state = {
        "state": {
            "workoutId": None,
            "startedAt": NOW,
            "routineId": None,
            "routineDayId": None,
            "exercises": [
                {
                    "exerciseId": exercise_id,
                    "exerciseName": name,
                    "sets": [
                        {
                            "id": "set-1",
                            "exerciseId": exercise_id,
                            "exerciseName": name,
                            "setNumber": 1,
                            "weightKg": 60,
                            "reps": 8,
                            "completed": False,
                        }
                    ],
                }
            ],
            "restSeconds": 90,
            "warmupSeen": True,
        },
        "version": 0,
    }
    return json.dumps(state)


def check_technique(page, slug, errors, expect_tip_warning=False, tip_warning_text=None):
    page.goto(f"{BASE}/ejercicios/{slug}", wait_until="networkidle")
    page.wait_for_timeout(1200)

    body = page.inner_text("body")
    if "Técnica" not in body:
        errors.append(f"Ficha de «{slug}» sin bloque «Técnica»")
        return

    numbers = page.locator("ol li > span:first-child").all_inner_texts()
    try:
        numbered = [int(n.strip()) for n in numbers if n.strip().isdigit()]
    except ValueError:
        numbered = []
    if not numbered:
        errors.append(f"Ficha de «{slug}»: la técnica no tiene lista numerada")
    else:
        if numbered != list(range(1, len(numbered) + 1)):
            errors.append(f"Ficha de «{slug}»: números de técnica no correlativos ({numbered})")
        if len(numbered) < 2:
            errors.append(f"Ficha de «{slug}»: pocos pasos numerados ({len(numbered)})")

    if expect_tip_warning:
        if not tip_warning_text:
            errors.append(f"Ficha de «{slug}»: falta texto esperado de tip/warning para la comprobación")
        elif tip_warning_text not in body:
            errors.append(f"Ficha de «{slug}»: no se renderiza ningún tip/warning esperado («{tip_warning_text}»)")


def check_session_modal_fallback(page, errors):
    # Sembrar sesión activa con un ejercicio sin checklist propia (press-declinado).
    page.add_init_script(f"""
      localStorage.setItem('gymLab-activeWorkout', {json.dumps(active_workout_storage(NO_CHECKLIST_ID, 'Press declinado'))});
    """)
    page.goto(BASE, wait_until="networkidle")
    # Marcar onboarding como hecho para que no bloquee la sesión.
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

    # Abrir el modal de técnica del ejercicio.
    tech_btn = page.locator('button[aria-label="Checklist de técnica"]')
    if tech_btn.count() == 0:
        errors.append("Sesión: no hay botón de checklist de técnica en el ejercicio")
        return
    tech_btn.first.click(timeout=5000)
    page.wait_for_timeout(600)

    body = page.inner_text("body")
    no_data_es = "No hay checklist de técnica disponible para este ejercicio."
    no_data_en = "No technique checklist available for this exercise."
    if no_data_es in body or no_data_en in body:
        errors.append("Sesión: el modal de técnica muestra «No hay datos» pese a tener pasos derivados")
        return

    # El modal (fallback) muestra los pasos numerados derivados de la plantilla.
    modal_numbers = page.locator(".fixed.inset-0 .flex.size-6").all_inner_texts()
    try:
        numbered = [int(n.strip()) for n in modal_numbers if n.strip().isdigit()]
    except ValueError:
        numbered = []
    if not numbered:
        errors.append("Sesión: el modal de técnica no muestra pasos numerados (fallback)")
    else:
        if numbered != list(range(1, len(numbered) + 1)):
            errors.append(f"Sesión: números del modal no correlativos ({numbered})")


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
            page.goto(BASE, wait_until="networkidle")
            page.wait_for_timeout(1500)

            skip_ob = page.locator("button", has_text="Ya entreno aquí")
            if skip_ob.count() > 0:
                skip_ob.first.click(timeout=5000)
                page.wait_for_timeout(800)

            check_technique(page, DERIVED_SLUG, errors, expect_tip_warning=True, tip_warning_text=DERIVED_TIP_OR_WARNING)
            check_technique(page, CURATED_SLUG, errors)
            check_session_modal_fallback(page, errors)

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
