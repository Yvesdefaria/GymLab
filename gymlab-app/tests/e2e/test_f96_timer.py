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
import sys, os, json, datetime
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


def main():
    errors = []
    scenario_reload_mid_rest(errors)
    scenario_expired_deadline(errors)

    if errors:
        print("ERRORS:")
        for e in errors:
            print(f"  - {e}")
        sys.exit(1)
    print("ALL OK")


if __name__ == "__main__":
    main()
