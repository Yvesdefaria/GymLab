"""Fase 84b: dashboard de pasos (/pasos) con datos sembrados en IndexedDB.

Verifica en 375×812 (flujo completo) y 320×700 (overflow) que:
- La página muestra «Tus Pasos Hoy» y el anillo de progreso refleja meta y pasos.
- El registro manual reemplaza los pasos del día (upsert) y confirma con «Pasos guardados».
- Las tarjetas de stats muestran las etiquetas Pasos / km / kcal / Racha.
- El heatmap mensual dibuja una celda por día del mes actual.
- Con un día por encima de la meta se desbloquea al menos un logro.
- No hay overflow horizontal ni errores de consola.
"""
import sys
import os
import calendar
from datetime import date

sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"

# Seeds: hoy 7000 pasos, ayer y anteayer por encima/debajo de la meta (8000).
GOAL = 8000
TODAY_STEPS = 7000
RECORD_STEPS = 5000

SEED_SCRIPT = """
(async () => {
  const d = (offset) => {
    const dt = new Date();
    dt.setDate(dt.getDate() + offset);
    const p = (n) => String(n).padStart(2, '0');
    return `${dt.getFullYear()}-${p(dt.getMonth() + 1)}-${p(dt.getDate())}`;
  };
  const entry = (id, localDate, steps) => ({
    id,
    localDate,
    steps,
    distanceKm: Math.round(steps * 0.75) / 1000,
    calories: Math.round(steps * 0.02),
    source: 'manual',
    syncedAt: new Date().toISOString(),
  });
  const rows = [
    entry(1, d(0), 7000),
    entry(2, d(-1), 9840),
    entry(3, d(-2), 5230),
    entry(4, d(-3), 4120),
    entry(5, d(-7), 8820),
  ];
  const request = indexedDB.open('GymLabDB');
  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      const db = request.result;
      const txn = db.transaction(['dailySteps', 'meta'], 'readwrite');
      for (const row of rows) txn.objectStore('dailySteps').put(row);
      txn.objectStore('meta').put({ key: 'stepsGoal', value: '8000' });
      txn.objectStore('meta').put({ key: 'strideLengthCm', value: '75' });
      txn.objectStore('meta').put({ key: 'onboardingDone', value: 'true' });
      txn.oncomplete = () => { db.close(); resolve(true); };
      txn.onerror = () => reject(txn.error);
    };
    request.onerror = () => reject(request.error);
  });
})()
"""


def collect_errors(page, errors, tag):
    page.on("console", lambda m: errors.append(f"console.{m.type}: {m.text}") if m.type == "error" else None)
    page.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))


def seed_and_open(page, tag, errors):
    """Carga la app, sierne onboarding si aparece y siembra IndexedDB."""
    page.goto(BASE, wait_until="networkidle")
    page.wait_for_timeout(1500)
    skip_ob = page.locator("button", has_text="Ya entreno aquí")
    if skip_ob.count() > 0:
        skip_ob.first.click(timeout=5000)
        page.wait_for_timeout(800)
    try:
        ok = page.evaluate(SEED_SCRIPT)
        if ok is not True:
            errors.append(f"[{tag}] Seed de IndexedDB no completó (resultado {ok!r})")
    except Exception as e:
        errors.append(f"[{tag}] Seed falló: {e}")


def check_main_flow(browser, errors):
    tag = "375x812"
    context = browser.new_context(viewport={"width": 375, "height": 812})
    page = context.new_page()
    collect_errors(page, errors, tag)
    try:
        seed_and_open(page, tag, errors)

        page.goto(f"{BASE}/pasos", wait_until="networkidle")
        page.wait_for_timeout(1500)

        # Cabecera y anillo con meta.
        page.get_by_text("Tus Pasos Hoy", exact=True).wait_for()
        # El anillo se distingue del reto diario (también progressbar) por su aria-label "Hoy:".
        ring = page.locator('[role="progressbar"][aria-label^="Hoy:"]')
        ring.wait_for()
        now = ring.get_attribute("aria-valuenow")
        mx = ring.get_attribute("aria-valuemax")
        if now != str(TODAY_STEPS):
            errors.append(f"[{tag}] Anillo muestra {now} pasos (esperaba {TODAY_STEPS})")
        if mx != str(GOAL):
            errors.append(f"[{tag}] Meta del anillo {mx} (esperaba {GOAL})")

        # Stats: pasos + racha + unidades.
        page.get_by_text("Pasos", exact=True).wait_for()
        for label in ("Racha",):
            if page.get_by_text(label, exact=True).count() == 0:
                errors.append(f"[{tag}] Falta la stat «{label}»")
        for unit in ("km", "kcal"):
            if page.get_by_text(unit).count() == 0:
                errors.append(f"[{tag}] Falta la unidad «{unit}» en las stats")

        # Gráfico semanal y logros (ayer > meta => al menos 1 desbloqueado).
        achievements_section = page.locator("main section:has-text('Logros')")
        achievements_section.wait_for()
        achievements = achievements_section.locator("li").count()
        if achievements < 1:
            errors.append(f"[{tag}] Sin badges de logro con un día > meta")

        # Heatmap: una celda por día del mes actual.
        today = date.today()
        days_in_month = calendar.monthrange(today.year, today.month)[1]
        cells = page.locator("main div.grid.grid-cols-7 button").count()
        if cells != days_in_month:
            errors.append(f"[{tag}] Heatmap con {cells} celdas (esperaba {days_in_month})")

        # Registro manual: 5000 reemplaza los 7000 de hoy (upsert).
        page.get_by_text("Registrar pasos", exact=True).click()
        page.fill("#step-record", str(RECORD_STEPS))
        page.get_by_text("Guardar", exact=True).click()
        page.get_by_text("Pasos guardados", exact=True).wait_for(timeout=5000)
        page.wait_for_timeout(800)
        now = ring.get_attribute("aria-valuenow")
        if now != str(RECORD_STEPS):
            errors.append(f"[{tag}] Tras registrar, el anillo muestra {now} (esperaba {RECORD_STEPS})")

    except Exception as e:
        errors.append(f"[{tag}] Exception: {e}")
    finally:
        page.close()
        context.close()


def check_no_overflow(browser, errors):
    tag = "320x700"
    context = browser.new_context(viewport={"width": 320, "height": 700})
    page = context.new_page()
    collect_errors(page, errors, tag)
    try:
        seed_and_open(page, tag, errors)
        page.goto(f"{BASE}/pasos", wait_until="networkidle")
        page.wait_for_timeout(1500)
        page.locator('[role="progressbar"][aria-label^="Hoy:"]').wait_for()
        if page.evaluate("document.documentElement.scrollWidth > window.innerWidth"):
            sw = page.evaluate("document.documentElement.scrollWidth")
            iw = page.evaluate("window.innerWidth")
            errors.append(f"[{tag}] Overflow horizontal: scrollWidth={sw} > innerWidth={iw}")
    except Exception as e:
        errors.append(f"[{tag}] Exception: {e}")
    finally:
        page.close()
        context.close()


def main():
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        check_main_flow(browser, errors)
        check_no_overflow(browser, errors)
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