"""F96 · Descanso persistido por deadline y reconciliado tras recargar (D4).

Flujo A (recarga a mitad de descanso):
  sembrar una sesion activa con `restEndsAt = now + 42 s` -> cargar
  /entrenamiento/active -> leer el restante mostrado -> esperar ~3 s ->
  recargar -> el restante volvio a bajar desde el mismo deadline (no se
  reinicia a 42).

Flujo B (deadline ya vencido):
  sembrar `restEndsAt` en el pasado -> cargar -> el descanso NO queda activo
  (el timer muestra el texto de cero y aparece el boton de iniciar descanso).

Requiere el server de Vite; se ejecuta con:
  python3 tests/e2e/scripts/with_server.py tests/e2e/test_f96_timer.py
"""
import sys, os, json, datetime, re
sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"

NOW = datetime.datetime.now(datetime.timezone.utc).isoformat().replace("+00:00", "Z")

# Restante numérico en el centro del anillo de descanso (TimerDisplay).
NUMERIC_TIMER = """
() => {
  const el = document.querySelector('[data-testid="timer-display"]');
  if (!el) return false;
  return /^\\d+$/.test(el.textContent.trim());
}
"""


def seed_script(delta_ms):
    """Init script que siembra el store persistido con un deadline relativo.

    `delta_ms` se evalúa en el navegador contra Date.now(), así la ventana de
    descanso es estable sin depender del reloj del proceso Python. Sólo siembra
    si la clave no existe: así una recarga conserva el deadline original.
    """
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
            "warmupSeen": True,
            "restEndsAt": None,
        },
        "version": 0,
    }
    return f"""
      (() => {{
        if (localStorage.getItem('gymLab-activeWorkout')) return;
        const snapshot = {json.dumps(state)};
        snapshot.state.restEndsAt = Date.now() + ({int(delta_ms)});
        localStorage.setItem('gymLab-activeWorkout', JSON.stringify(snapshot));
      }})();
    """


def mark_onboarding_done(page):
    """Marca el onboarding como hecho para que no intercepte la sesión activa."""
    page.evaluate(
        """async () => {
          const req = indexedDB.open('GymLabDB');
          const db = await new Promise((res, rej) => {
            req.onsuccess = () => res(req.result);
            req.onerror = () => rej(req.error);
          });
          await new Promise((res, rej) => {
            const tx = db.transaction('meta', 'readwrite');
            tx.objectStore('meta').put({ key: 'onboardingDone', value: true });
            tx.oncomplete = () => res();
            tx.onerror = () => rej(tx.error);
          });
        }"""
    )


def read_timer_text(page):
    loc = page.get_by_test_id("timer-display")
    loc.first.wait_for(state="visible", timeout=15000)
    return loc.first.inner_text().strip()


def read_timer_seconds(page):
    page.wait_for_function(NUMERIC_TIMER, timeout=15000)
    text = read_timer_text(page)
    return int(text)


# Valor del temporizador con formato de reloj, "MM:SS" o "H:MM:SS".
CLOCK_TIMER = r"^\d{1,2}:\d{2}(:\d{2})?$"

# Espera el timer en cualquier formato admitido (segundos o reloj).
TIMER_READY = """
() => {
  const el = document.querySelector('[data-testid="timer-display"]');
  if (!el) return false;
  const text = el.textContent.trim();
  return /^\\d+$/.test(text) || /^\\d{1,2}:\\d{2}(:\\d{2})?$/.test(text);
}
"""


def seed_settings(page, settings):
    """Escribe ajustes en el meta store de Dexie (la app ya creó el esquema).

    `metaRepo.getJson` guarda el valor como JSON serializado, así que se
    respeta ese formato para que `useSettings` lo lea al recargar.
    """
    payload = json.dumps(settings)
    page.evaluate(
        """async (payload) => {
          const value = JSON.stringify(JSON.parse(payload));
          const req = indexedDB.open('GymLabDB');
          const db = await new Promise((res, rej) => {
            req.onsuccess = () => res(req.result);
            req.onerror = () => rej(req.error);
          });
          await new Promise((res, rej) => {
            const tx = db.transaction('meta', 'readwrite');
            tx.objectStore('meta').put({ key: 'settings', value });
            tx.oncomplete = () => res();
            tx.onerror = () => rej(tx.error);
          });
        }""",
        payload,
    )


def scenario_timer_format(errors):
    """Flujo D: el ajuste de formato se aplica a los timers (D1, 96.4)."""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 375, "height": 812})
        page = context.new_page()
        console_errors = []
        page.on(
            "console",
            lambda m: console_errors.append(f"console.{m.type}: {m.text}")
            if m.type == "error"
            else None,
        )
        page.on("pageerror", lambda e: console_errors.append(f"pageerror: {e}"))
        try:
            # Descanso en curso con 90 s por delante (nunca llega a 0 durante la prueba).
            page.add_init_script(seed_script(90_000))
            page.goto(BASE, wait_until="networkidle")
            mark_onboarding_done(page)

            # El control de formato existe, ofrece mm:ss y persiste la selección.
            page.goto(f"{BASE}/ajustes", wait_until="networkidle")
            seed_settings(page, {"timerFormat": "mm:ss"})
            page.reload(wait_until="networkidle")
            select = page.get_by_label("Formato del tiempo")
            if select.input_value() != "mm:ss":
                errors.append("el ajuste de formato no quedó en mm:ss tras guardarlo")
            options = select.locator("option").all_inner_texts()
            if not any("01:30" in o for o in options):
                errors.append(f"falta la opción mm:ss en el selector de formato: {options}")

            # El descanso renderiza con el formato elegido (mm:ss), no en segundos.
            page.goto(f"{BASE}/entrenamiento/active", wait_until="networkidle")
            page.wait_for_function(TIMER_READY, timeout=15000)
            text = read_timer_text(page)
            if not re.match(CLOCK_TIMER, text):
                errors.append(f"el descanso no aplicó mm:ss al formato: '{text}'")
            if not errors:
                print(f"OK: formato mm:ss en ajustes y aplicado al descanso ('{text}')")
        except Exception as e:
            errors.append(f"Excepción (flujo D): {e}")
        finally:
            errors.extend(console_errors)
            page.close()
            browser.close()



def scenario_reload_mid_rest(errors):
    """Flujo A: el descanso sobrevive a la recarga y reconcilia el restante."""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 375, "height": 812})
        page = context.new_page()
        console_errors = []
        page.on(
            "console",
            lambda m: console_errors.append(f"console.{m.type}: {m.text}")
            if m.type == "error"
            else None,
        )
        page.on("pageerror", lambda e: console_errors.append(f"pageerror: {e}"))
        try:
            page.add_init_script(seed_script(42_000))
            page.goto(BASE, wait_until="networkidle")
            mark_onboarding_done(page)
            page.goto(f"{BASE}/entrenamiento/active", wait_until="networkidle")

            first = read_timer_seconds(page)
            if not (30 <= first <= 42):
                errors.append(f"restante inicial fuera de rango: {first}s (esperado ~42)")

            page.wait_for_timeout(3000)
            page.reload(wait_until="networkidle")
            second = read_timer_seconds(page)

            if not (second < first):
                errors.append(
                    f"el restante no continuó bajando tras recargar: {first}s -> {second}s"
                )
            delta = first - second
            if not (1 <= delta <= 9):
                errors.append(
                    f"delta inesperado tras recargar: {delta}s (first={first}, second={second})"
                )
            if second <= 0:
                errors.append(f"el descanso debía seguir activo tras recargar: {second}s")
            if not errors:
                print(f"OK: 42s -> {first}s -> recarga -> {second}s (descanso reconciliado)")
        except Exception as e:
            errors.append(f"Excepción (flujo A): {e}")
        finally:
            errors.extend(console_errors)
            page.close()
            browser.close()


def scenario_expired_deadline(errors):
    """Flujo B: un deadline vencido no deja un descanso fantasma."""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 375, "height": 812})
        page = context.new_page()
        try:
            page.add_init_script(seed_script(-5_000))
            page.goto(BASE, wait_until="networkidle")
            mark_onboarding_done(page)
            page.goto(f"{BASE}/entrenamiento/active", wait_until="networkidle")

            # El descanso vencido se asienta en cero: sin número corriendo.
            page.wait_for_timeout(1000)
            text = read_timer_text(page)
            if text.isdigit() and int(text) > 0:
                errors.append(f"descanso vencido aún muestra {text}s")
            start_button = page.locator("button", has_text="Iniciar descanso")
            if start_button.count() == 0:
                errors.append("no aparece el botón de iniciar descanso tras vencer el deadline")
            if not errors:
                print(f"OK: deadline vencido -> descanso terminado (timer='{text}')")
        except Exception as e:
            errors.append(f"Excepción (flujo B): {e}")
        finally:
            page.close()
            browser.close()


# Espera a que el catálogo sembrado esté en IndexedDB: la recomendación necesita
# el muscleGroup del ejercicio, que sólo existe si el catálogo cargó.
WAIT_CATALOG = """
async () => {
  const db = await new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const count = await new Promise((res) => {
    const tx = db.transaction('exercises', 'readonly');
    const req = tx.objectStore('exercises').count();
    req.onsuccess = () => res(req.result);
    req.onerror = () => res(0);
  });
  return count > 0;
}
"""


def seed_workout_no_rest():
    """Sesión activa con una serie pendiente y RPE alto (recomendación fuera de los presets).

    Press de pecho (compuesto) + RPE 9 -> [117, 234] -> recomendado 176, que no
    está en PRESETS = [30, 60, 90, 120, 180].
    """
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
                            "rpe": 9,
                        }
                    ],
                }
            ],
            "restSeconds": 90,
            "warmupSeen": True,
            "restEndsAt": None,
        },
        "version": 0,
    }
    return f"""
      (() => {{
        if (localStorage.getItem('gymLab-activeWorkout')) return;
        localStorage.setItem('gymLab-activeWorkout', {json.dumps(json.dumps(state))});
      }})();
    """


def scenario_auto_vs_preset(errors):
    """Flujo C: Auto es un control distinto y pegajoso; un preset lo desactiva (96.1/96.2)."""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 375, "height": 812})
        page = context.new_page()
        console_errors = []
        page.on(
            "console",
            lambda m: console_errors.append(f"console.{m.type}: {m.text}")
            if m.type == "error"
            else None,
        )
        page.on("pageerror", lambda e: console_errors.append(f"pageerror: {e}"))
        try:
            page.add_init_script(seed_workout_no_rest())
            page.goto(BASE, wait_until="networkidle")
            mark_onboarding_done(page)
            page.goto(f"{BASE}/entrenamiento/active", wait_until="networkidle")
            page.wait_for_function(WAIT_CATALOG, timeout=20000)
            page.wait_for_timeout(500)

            auto = page.get_by_test_id("rest-mode-auto")
            auto.wait_for(state="visible", timeout=15000)
            if auto.get_attribute("aria-pressed") != "true":
                errors.append("Auto debería estar activo por defecto")

            # Completar la serie: aparece la recomendación y arranca el descanso.
            page.get_by_role("button", name="Marcar completada").first.click()
            page.get_by_text("Recomendado", exact=False).first.wait_for(timeout=15000)

            presets = page.get_by_test_id("rest-preset")
            if presets.count() != 5:
                errors.append(
                    f"la fila de presets debe tener 5 botones duros, tiene {presets.count()} "
                    "(el recomendado no puede ser un preset más)"
                )
            if auto.get_attribute("aria-pressed") != "true":
                errors.append("Auto dejó de estar activo tras completar la serie")

            # Elegir un preset explícito desactiva Auto (y lo deja seleccionado).
            page.locator('[data-preset="90"]').click()
            page.wait_for_timeout(200)
            if auto.get_attribute("aria-pressed") != "false":
                errors.append("elegir el preset 90 no desactivó Auto")
            if page.locator('[data-preset="90"]').get_attribute("aria-pressed") != "true":
                errors.append("el preset 90 no quedó seleccionado")

            if not errors:
                print("OK: Auto distinto y pegajoso -> preset 90 desactiva Auto (5 presets duros)")
        except Exception as e:
            errors.append(f"Excepción (flujo C): {e}")
        finally:
            errors.extend(console_errors)
            page.close()
            browser.close()


def main():
    errors = []
    scenario_reload_mid_rest(errors)
    scenario_expired_deadline(errors)
    scenario_auto_vs_preset(errors)
    scenario_timer_format(errors)

    if errors:
        print("ERRORS:")
        for e in errors:
            print(f"  - {e}")
        sys.exit(1)
    print("ALL OK")


if __name__ == "__main__":
    main()
