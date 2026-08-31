"""Fase 93 #1: las sugerencias adaptativas muestran el nombre del ejercicio (no el id).

Se siembra un programa activo (rutina 1, dia de hoy lunes) para que la home
ofrezca iniciar la sesion con el dia de la rutina; al entrar, la sugerencia
adaptativa debe mostrar el nombre real del ejercicio y no "Ejercicio #N".
"""
import sys, os, datetime
sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"

TODAY = datetime.date.today()
TODAY_STR = TODAY.isoformat()
TODAY_WD = TODAY.weekday() + 1  # getDay() JS: lunes=1

SEED_JS = f"""async () => {{
  const openDb = () => new Promise((res, rej) => {{
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  }});
  const db = await openDb();
  await new Promise((res, rej) => {{
    const tx = db.transaction(['activeProgram', 'meta'], 'readwrite');
    tx.objectStore('meta').put({{ key: 'onboardingDone', value: true }});
    tx.objectStore('activeProgram').clear();
    tx.objectStore('activeProgram').put({{
      id: 1,
      routineId: 1,
      startDate: '{TODAY_STR}',
      weekdays: [{TODAY_WD}],
      createdAt: '{TODAY_STR}T00:00:00.000Z',
    }});
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  }});
  return true;
}}"""


def main():
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 375, "height": 812})
        console_errors = []
        page.on("console", lambda m: console_errors.append(f"console.{m.type}: {m.text}") if m.type == "error" else None)
        page.on("pageerror", lambda e: console_errors.append(f"pageerror: {e}"))

        try:
            page.goto(BASE, wait_until="networkidle")
            page.wait_for_timeout(800)
            seed_result = page.evaluate(SEED_JS)
            assert seed_result is True, f"seed fallo: {seed_result}"
            page.reload(wait_until="networkidle")
            page.wait_for_timeout(1200)

            # Saltar el onboarding si reaparece.
            skip_ob = page.locator("button", has_text="Ya entreno aquí")
            if skip_ob.count() > 0:
                skip_ob.first.click(timeout=5000)
                page.wait_for_timeout(1000)

            # Iniciar la sesion con el dia de la rutina ("Empezar hoy" o "Iniciar entrenamiento").
            start = page.locator("button", has_text="Empezar hoy")
            if start.count() == 0:
                start = page.locator("button", has_text="Iniciar entrenamiento")
            if start.count() == 0:
                start = page.locator("button", has_text="Empezar")
            if start.count() == 0:
                errors.append("Boton de inicio no encontrado")
            else:
                start.first.click(timeout=5000)
                page.wait_for_url(f"{BASE}/entrenamiento/active", timeout=8000)
                page.wait_for_timeout(1200)

                # Saltar el warmup si aparece.
                skip_all = page.locator("button", has_text="Saltar todo")
                if skip_all.count() > 0:
                    skip_all.first.click(timeout=5000)
                    page.wait_for_timeout(500)

            # Assert: el bloque de sugerencias muestra el nombre, no "Ejercicio #".
            suggestions = page.locator("div", has_text="Sugerencias adaptativas")
            if suggestions.count() == 0:
                errors.append("No aparece el bloque 'Sugerencias adaptativas' (sin ejercicios con datos?)")
            else:
                body_text = page.inner_text("body")
                if "Ejercicio #" in body_text:
                    errors.append("BUG: la sugerencia muestra el id en vez del nombre (Ejercicio #)")
                elif "Press de pecho con barra" in body_text:
                    print("OK: sugerencia adaptativa muestra el nombre del ejercicio")
                else:
                    errors.append("La sugerencia no muestra un nombre de ejercicio reconocible")

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