"""Fase 98.3: filas de dos zonas (cuerpo → ficha, «+» → alta) y alta desde catálogo.

Escenarios (viewport 375x812):
  R1a. En el selector de la sesión, el cuerpo de la fila cierra el selector y abre
       `/ejercicios/:slug`.
  R1b/R3. El «+» añade el ejercicio a la sesión (el cuerpo no navega) y el toast
       ofrece deshacer el alta.
  R2a. En el catálogo con sesión activa, el «+» añade a la sesión.
  R2b. En el catálogo sin sesión, el «+» abre el selector de destino de rutina.
  R4. La fila de serie en modo fuerza (RPE/RIR) no desborda a 375 px (sin scroll
      horizontal) y los inputs caben en el viewport.
"""
import sys, os, json, datetime
sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"

NOW = datetime.datetime.now(datetime.timezone.utc).isoformat().replace("+00:00", "Z")

EX_ID = 999
EX_NAME = "Sentadilla F98"
EX_SLUG = "sentadilla-f98"
ADD_ARIA = f'button[aria-label="Agregar {EX_NAME}"]'
INSPECT_ARIA = f'button[aria-label="Ver ficha de {EX_NAME}"]'
SEARCH = 'input[aria-label="Buscar ejercicio"]'

SEED_DB_JS = """async () => {
  const openDb = () => new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const db = await openDb();
  await new Promise((res, rej) => {
    const tx = db.transaction(['exercises', 'meta'], 'readwrite');
    tx.objectStore('exercises').put({ id: 999, slug: 'sentadilla-f98', name: 'Sentadilla F98', muscleGroup: 'pierna', equipment: 'barra', instructions: '', category: 'strength' });
    tx.objectStore('meta').put({ key: 'settings', value: JSON.stringify({ showRpe: true, showRir: true }) });
    tx.objectStore('meta').put({ key: 'onboardingDone', value: 'true' });
    tx.objectStore('meta').put({ key: 'unlockedAchievements', value: '["primera-marca"]' });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  return true;
}"""


def session_storage(exercises):
    """Estado persistido del store de sesión activa con los ejercicios dados."""
    return json.dumps({
        "state": {
            "workoutId": None,
            "startedAt": NOW,
            "routineId": None,
            "routineDayId": None,
            "exercises": exercises,
            "sessionNote": "",
            "restSeconds": 90,
            "restMode": "auto",
            "routineRestSec": None,
            "autoRestSeconds": 90,
            "warmupSeen": True,
            "restEndsAt": None,
        },
        "version": 0,
    })


def exercise_with_set():
    return {
        "exerciseId": EX_ID,
        "exerciseName": EX_NAME,
        "sets": [
            {"id": "set-1", "exerciseId": EX_ID, "exerciseName": EX_NAME,
             "setNumber": 1, "weightKg": 60, "reps": 8, "completed": False},
        ],
    }


def read_store(page):
    raw = page.evaluate("() => localStorage.getItem('gymLab-activeWorkout')")
    return json.loads(raw)["state"] if raw else None


def boot(page):
    """Carga la app, siembra el catálogo/ajustes y salta el onboarding si aparece."""
    page.goto(BASE, wait_until="networkidle")
    page.wait_for_timeout(700)
    assert page.evaluate(SEED_DB_JS) is True, "seed fallo"
    page.reload(wait_until="networkidle")
    page.wait_for_timeout(900)
    skip_ob = page.locator("button", has_text="Ya entreno aquí")
    if skip_ob.count() > 0:
        skip_ob.first.click(timeout=5000)
        page.wait_for_timeout(700)


def wait_for_no_overlay(page, timeout_ms=6000):
    deadline = timeout_ms
    while deadline > 0:
        if page.locator("div.fixed.inset-0").count() == 0:
            return True
        page.wait_for_timeout(250)
        deadline -= 250
    return page.locator("div.fixed.inset-0").count() == 0


def open_picker(page):
    page.locator("button", has_text="Añadir ejercicio").first.click()
    page.wait_for_selector(SEARCH, state="visible", timeout=5000)
    page.fill(SEARCH, EX_NAME)
    page.wait_for_timeout(400)


def main():
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        console_errors = []

        def watch(page):
            page.on("console", lambda m: console_errors.append(f"console.{m.type}: {m.text}") if m.type == "error" else None)
            page.on("pageerror", lambda e: console_errors.append(f"pageerror: {e}"))

        try:
            # ── A/B: sesión activa (vacía) para probar el selector de dos zonas y el undo ──
            ctx_a = browser.new_context(viewport={"width": 375, "height": 812})
            ctx_a.add_init_script(
                f"localStorage.setItem('gymLab-activeWorkout', {json.dumps(session_storage([]))})"
            )
            page_a = ctx_a.new_page()
            watch(page_a)
            boot(page_a)
            page_a.goto(f"{BASE}/entrenamiento/active", wait_until="networkidle")
            page_a.wait_for_timeout(1200)

            # R1a — el cuerpo de la fila abre la ficha.
            open_picker(page_a)
            if page_a.locator(INSPECT_ARIA).count() == 0:
                errors.append("R1a: no hay cuerpo de fila con aria de ficha")
            else:
                page_a.locator(INSPECT_ARIA).first.click(timeout=5000)
                page_a.wait_for_timeout(800)
                if f"/ejercicios/{EX_SLUG}" not in page_a.url:
                    errors.append(f"R1a: el cuerpo no abrió la ficha (url={page_a.url})")
                elif page_a.locator(SEARCH).count() > 0:
                    errors.append("R1a: el selector sigue abierto tras abrir la ficha")
                else:
                    print("OK R1a: cuerpo → ficha, selector cerrado")

            # R1b/R3 — el «+» añade a la sesión y el toast permite deshacer.
            page_a.goto(f"{BASE}/entrenamiento/active", wait_until="networkidle")
            page_a.wait_for_timeout(1000)
            open_picker(page_a)
            if page_a.locator(ADD_ARIA).count() == 0:
                errors.append("R1b: no hay botón «+» en la fila del selector")
            else:
                page_a.locator(ADD_ARIA).first.click(timeout=5000)
                page_a.wait_for_timeout(900)
                if page_a.locator(SEARCH).count() > 0:
                    errors.append("R1b: el selector no se cerró tras el alta")
                store = read_store(page_a)
                if not store or not any(e["exerciseId"] == EX_ID for e in store["exercises"]):
                    errors.append(f"R1b: el «+» no añadió el ejercicio (store={store})")
                else:
                    print("OK R1b: «+» añadió a la sesión sin navegar")
                body = page_a.inner_text("body")
                undo_btn = page_a.locator("button", has_text="Deshacer")
                if "Añadido:" not in body or undo_btn.count() == 0:
                    errors.append("R3: no aparece el toast de alta con deshacer")
                else:
                    undo_btn.first.click(timeout=5000)
                    page_a.wait_for_timeout(600)
                    store = read_store(page_a)
                    if any(e["exerciseId"] == EX_ID for e in store["exercises"]):
                        errors.append("R3: deshacer no reverteó el alta en sesión")
                    else:
                        print("OK R3: deshacer reverteó el alta en sesión")

            # R2a — catálogo con sesión activa: el «+» añade a la sesión.
            page_a.goto(f"{BASE}/ejercicios", wait_until="networkidle")
            page_a.wait_for_timeout(1200)
            page_a.fill(SEARCH, EX_NAME)
            page_a.wait_for_timeout(500)
            if page_a.locator(ADD_ARIA).count() == 0:
                errors.append("R2a: el catálogo no muestra el «+» del ejercicio")
            else:
                page_a.locator(ADD_ARIA).first.click(timeout=5000)
                page_a.wait_for_timeout(900)
                store = read_store(page_a)
                if not store or not any(e["exerciseId"] == EX_ID for e in store["exercises"]):
                    errors.append("R2a: con sesión activa el «+» del catálogo no añadió a la sesión")
                else:
                    print("OK R2a: catálogo con sesión → añade a la sesión")
            page_a.close()
            ctx_a.close()

            # ── C: catálogo sin sesión → abre el selector de destino ──
            ctx_c = browser.new_context(viewport={"width": 375, "height": 812})
            page_c = ctx_c.new_page()
            watch(page_c)
            boot(page_c)
            page_c.goto(f"{BASE}/ejercicios", wait_until="networkidle")
            page_c.wait_for_timeout(1200)
            page_c.fill(SEARCH, EX_NAME)
            page_c.wait_for_timeout(500)
            if page_c.locator(ADD_ARIA).count() == 0:
                errors.append("R2b: el catálogo no muestra el «+» sin sesión")
            else:
                page_c.locator(ADD_ARIA).first.click(timeout=5000)
                page_c.wait_for_timeout(600)
                if page_c.locator('[aria-label="Elegir destino"]').count() == 0:
                    errors.append("R2b: sin sesión el «+» no abrió el selector de destino")
                else:
                    print("OK R2b: catálogo sin sesión → selector de destino")
            page_c.close()
            ctx_c.close()

            # ── D: 375 px sin scroll horizontal en la fila de fuerza ──
            ctx_d = browser.new_context(viewport={"width": 375, "height": 812})
            ctx_d.add_init_script(
                f"localStorage.setItem('gymLab-activeWorkout', {json.dumps(session_storage([exercise_with_set()]))})"
            )
            page_d = ctx_d.new_page()
            watch(page_d)
            boot(page_d)
            page_d.goto(f"{BASE}/entrenamiento/active", wait_until="networkidle")
            page_d.wait_for_timeout(1400)
            assert wait_for_no_overlay(page_d)

            overflow = page_d.evaluate(
                "() => document.documentElement.scrollWidth - window.innerWidth"
            )
            if overflow > 1:
                errors.append(f"R4: desborda horizontalmente a 375 px ({overflow} px)")
            else:
                print(f"OK R4: sin scroll horizontal (desborde={overflow} px)")

            rpe = page_d.locator('input[aria-label="RPE de la serie"]')
            rir = page_d.locator('input[aria-label="RIR de la serie"]')
            if rpe.count() == 0 or rir.count() == 0:
                errors.append(f"R4: faltan inputs RPE/RIR (rpe={rpe.count()} rir={rir.count()})")
            else:
                box = rir.first.bounding_box()
                if box and box["x"] + box["width"] > 376:
                    errors.append(f"R4: RIR fuera del viewport (right={box['x'] + box['width']:.0f})")
                else:
                    print("OK R4: RPE/RIR visibles y dentro del viewport de 375 px")
            page_d.close()
            ctx_d.close()

        except Exception as e:
            errors.append(f"Exception: {e}")
        finally:
            if console_errors:
                errors.extend(console_errors)
            browser.close()

    if errors:
        print("ERRORS:")
        for e in errors:
            print(f"  - {e}")
        sys.exit(1)
    print("ALL OK")


if __name__ == "__main__":
    main()
