"""Fase 81: cierre del import de otras apps desde Ajustes (flujo real).

Verifica en 375×812:
- /ajustes → sección «Importar datos» → CSV de Strong con 2 fechas y 2 ejercicios
  del catálogo → resumen «2 sesiones · 3 series» → «2 sesiones importadas».
- IndexedDB: 2 workouts y 3 series, TODAS enlazadas al id real de su sesión
  (regresión del bug crítico que dejaba el placeholder del parser).
- Reimportar el MISMO archivo → «0 sesiones importadas · 2 duplicadas» y el
  estado en IndexedDB no cambia (sin sesiones ni series nuevas).
- Sin errores de consola/página.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"

# Strong export: 2 fechas, 2 ejercicios del catálogo seed, 3 series.
CSV = "\n".join(
    [
        "Date,Exercise Name,Weight,Reps,Completed",
        "2024-01-02,Press de pecho con barra,60,10,Yes",
        "2024-01-02,Press de pecho con barra,65,8,Yes",
        "2024-01-03,Sentadilla con barra,80,5,Yes",
    ]
)

# Lee workouts/workoutSets directo de IndexedDB: evidencia de la persistencia
# real (no solo del mensaje de UI) y del enlace serie→sesión con ids reales.
READ_IMPORT_JS = """
(async () => {
  const open = () => new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const all = (db, store) => new Promise((res, rej) => {
    const tx = db.transaction([store], 'readonly');
    const req = tx.objectStore(store).getAll();
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
  const db = await open();
  const workouts = await all(db, 'workouts');
  const sets = await all(db, 'workoutSets');
  db.close();
  const ids = new Set(workouts.map((w) => w.id));
  return {
    workouts: workouts.length,
    sets: sets.length,
    linked: sets.every((s) => ids.has(s.workoutId)),
    dates: workouts.map((w) => w.localDate).sort(),
  };
})()
"""

# El catálogo se siembra en segundo plano al arrancar: esperar a que exista
# antes de importar para que el matcher resuelva los ejercicios reales.
WAIT_CATALOG_JS = """
(async () => {
  const db = await new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const count = await new Promise((res, rej) => {
    const tx = db.transaction(['exercises'], 'readonly');
    const req = tx.objectStore('exercises').count();
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
  db.close();
  return count > 10;
})()
"""


def collect_errors(page, errors):
    page.on("console", lambda m: errors.append(f"console.{m.type}: {m.text}") if m.type == "error" else None)
    page.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))


def confirm_import(page):
    """Clic en el botón de confirmar DENTRO del resumen (el toggle se llama igual)."""
    summary = page.get_by_text("Resumen de importación", exact=True)
    summary.wait_for()
    summary.locator("xpath=..").get_by_role("button", name="Importar datos").click()


# 81.R3-001: el error de lectura previo no debe quedar visible si el parseo siguiente sale bien.
READ_ERROR = "No se pudo importar el archivo. Intenta de nuevo."


def run_flow(browser, errors):
    context = browser.new_context(viewport={"width": 375, "height": 812})
    page = context.new_page()
    collect_errors(page, errors)
    try:
        page.goto(BASE, wait_until="networkidle")
        page.wait_for_timeout(1500)
        skip_ob = page.locator("button", has_text="Ya entreno aquí")
        if skip_ob.count() > 0:
            skip_ob.first.click(timeout=5000)
            page.wait_for_timeout(800)

        page.goto(f"{BASE}/ajustes", wait_until="networkidle")
        page.wait_for_timeout(1000)
        page.wait_for_function(WAIT_CATALOG_JS, timeout=15000)

        # Abrir la sección y subir el CSV por el input oculto.
        page.get_by_role("button", name="Importar datos", exact=True).click()

        # 81.R3-001: un fallo de lectura muestra el error; el parseo exitoso posterior DEBE
        # limpiarlo (antes el mensaje viejo quedaba visible al lado del resumen nuevo).
        page.evaluate(
            "() => { window.__origFileText = File.prototype.text;"
            " File.prototype.text = () => Promise.reject(new Error('lectura fallida (test)')); }"
        )
        page.set_input_files(
            "#import-csv-input",
            {"name": "strong.csv", "mimeType": "text/csv", "buffer": CSV.encode("utf-8")},
        )
        page.get_by_text(READ_ERROR, exact=True).wait_for(timeout=5000)
        print("OK 81.R3-001a: el fallo de lectura muestra el error")
        page.evaluate("() => { File.prototype.text = window.__origFileText; }")
        page.set_input_files(
            "#import-csv-input",
            {"name": "strong.csv", "mimeType": "text/csv", "buffer": CSV.encode("utf-8")},
        )
        page.get_by_text("2 sesiones · 3 series", exact=True).wait_for()
        if page.get_by_text(READ_ERROR, exact=True).count() > 0:
            errors.append("81.R3-001: el error de lectura viejo sigue visible tras un parseo exitoso")
        else:
            print("OK 81.R3-001b: el parseo exitoso limpia el mensaje de error viejo")

        confirm_import(page)

        page.get_by_text("2 sesiones importadas", exact=True).wait_for(timeout=5000)
        state = page.evaluate(READ_IMPORT_JS)
        if state["workouts"] != 2:
            errors.append(f"Tras importar: {state['workouts']} workouts (esperaba 2)")
        if state["sets"] != 3:
            errors.append(f"Tras importar: {state['sets']} series (esperaba 3)")
        if not state["linked"]:
            errors.append("Hay series enlazadas a un workoutId inexistente (placeholder sin resolver)")
        if state["dates"] != ["2024-01-02", "2024-01-03"]:
            errors.append(f"Fechas de los workouts: {state['dates']}")

        # Reimportar el mismo archivo: todo duplicado, nada nuevo en IndexedDB.
        page.set_input_files(
            "#import-csv-input",
            {"name": "strong.csv", "mimeType": "text/csv", "buffer": CSV.encode("utf-8")},
        )
        page.get_by_text("2 sesiones · 3 series", exact=True).wait_for()
        confirm_import(page)

        page.get_by_text("0 sesiones importadas · 2 duplicadas", exact=True).wait_for(timeout=5000)
        state = page.evaluate(READ_IMPORT_JS)
        if state["workouts"] != 2 or state["sets"] != 3:
            errors.append(f"Tras reimportar cambió el estado: {state}")
    except Exception as e:
        errors.append(f"Exception: {e}")
    finally:
        page.close()
        context.close()


def main():
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        run_flow(browser, errors)
        browser.close()

    if errors:
        print("ERRORS:")
        for e in errors:
            print(f"  - {e}")
        sys.exit(1)
    print("ALL OK: import F81 (2 sesiones importadas; reimport = 0 importadas · 2 duplicadas sin tocar IndexedDB)")


if __name__ == "__main__":
    main()
