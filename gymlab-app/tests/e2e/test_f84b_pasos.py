"""Rediseño de /pasos (dirección C · Nocturno Minimal) con datos sembrados.

Verifica en 375×812 (flujo completo) y 320×700 (overflow) que:
- La página muestra «Pasos», el anillo con la meta y el tiempo caminando estimado.
- La tira semanal tiene 7 días y el calendario de actividad una celda por día.
- El calendario solo navega hacia atrás: en el mes vigente la flecha derecha está
  deshabilitada; al ir a un mes anterior con datos se habilita para volver.
- La meta se edita desde el menú «⋯» → sheet, validando el valor y actualizando el anillo.
- El alta manual vive escondida en el mismo menú y reemplaza el total del día.
- El registro que califica (≥10k) desbloquea y persiste diez-mil-dia.
- No hay overflow horizontal ni errores de consola.
"""
import sys
import os
import calendar
from datetime import date

sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import TimeoutError as PlaywrightTimeoutError
from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"

# Seeds: hoy 7000 pasos, días recientes por encima/debajo de la meta (8000) y un
# día del mes anterior para que el calendario tenga a dónde navegar.
GOAL = 8000
TODAY_STEPS = 7000
RECORD_STEPS = 5000
GOAL_EDIT = 20000
# F109 (C4): segundo registro de hoy, por encima del umbral de diez-mil-dia.
QUALIFYING_STEPS = 10100

MONTHS_ES = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
]

# useAchievements evalúa con 600 ms de debounce: el primer ítem de la cola no
# puede existir antes de este piso (mismo helper que test_f109.py).
MODAL_DEBOUNCE_FLOOR_MS = 800

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
    entry(6, d(-40), 6500),
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
      txn.objectStore('meta').put({ key: 'settings', value: JSON.stringify({ language: 'es' }) });
      // F109.1: primeros-pasos ya persistido (el total sembrado lo cumple) para
      // que el modal de celebración no interfiera con el flujo del test.
      txn.objectStore('meta').put({ key: 'unlockedAchievements', value: JSON.stringify(['primeros-pasos']) });
      txn.objectStore('meta').put({ key: 'achievementCounts', value: JSON.stringify({ 'primeros-pasos': 1 }) });
      txn.objectStore('meta').put({ key: 'achievementSnapshot', value: JSON.stringify(['primeros-pasos']) });
      txn.oncomplete = () => { db.close(); resolve(true); };
      txn.onerror = () => reject(txn.error);
    };
    request.onerror = () => reject(request.error);
  });
})()
"""

# Lectura directa de meta.unlockedAchievements: evidencia de persistencia del
# unlock (no solo del estado en vivo de la UI).
READ_UNLOCKED_JS = """
(async () => {
  const db = await new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const raw = await new Promise((res, rej) => {
    const tx = db.transaction(['meta'], 'readonly');
    const req = tx.objectStore('meta').get('unlockedAchievements');
    req.onsuccess = () => res(req.result ? req.result.value : null);
    req.onerror = () => rej(req.error);
  });
  db.close();
  return raw ? JSON.parse(raw) : [];
})()
"""


def dismiss_achievement_modal(page, timeout_ms=4000, max_items=50):
    """Cierra la cola del modal de logros si aparece (helper de test_f109.py).

    `useAchievements` evalúa con 600 ms de debounce y muestra un logro por
    pantalla, así que sin cerrarla el backdrop intercepta los clics. Se
    sincroniza con ese debounce (piso antes de decidir que no hay cola y
    espera por avance del contador «N de M» tras cada clic). Devuelve True si
    no quedó ningún modal abierto.
    """
    dialog = page.locator('[role="dialog"][aria-labelledby="achievement-modal-title"]')
    btn = page.get_by_role("button", name="¡Genial!")
    counter = page.locator("[data-queue-progress]")

    page.wait_for_timeout(MODAL_DEBOUNCE_FLOOR_MS)
    try:
        dialog.wait_for(state="visible", timeout=timeout_ms)
    except PlaywrightTimeoutError:
        return True

    for _ in range(max_items):
        if dialog.count() == 0:
            return True
        before = counter.inner_text() if counter.count() > 0 else None
        btn.first.click()
        try:
            page.wait_for_function(
                """(before) => {
                    const dialog = document.querySelector(
                        '[role="dialog"][aria-labelledby="achievement-modal-title"]'
                    );
                    if (!dialog) return true;
                    const counter = document.querySelector('[data-queue-progress]');
                    if (!counter) return true;
                    return counter.textContent !== before;
                }""",
                arg=before,
                timeout=2000,
            )
        except PlaywrightTimeoutError:
            pass
    return dialog.count() == 0


def collect_errors(page, errors, tag):
    page.on("console", lambda m: errors.append(f"console.{m.type}: {m.text}") if m.type == "error" else None)
    page.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))


def seed_and_open(page, tag, errors):
    """Carga la app, saltea onboarding si aparece y siembra IndexedDB."""
    page.goto(BASE, wait_until="networkidle")
    page.wait_for_timeout(1500)
    skip_ob = page.locator("button", has_text="Ya entreno aquí")
    if skip_ob.count() == 0:
        skip_ob = page.locator("button", has_text="I already train here")
    if skip_ob.count() > 0:
        skip_ob.first.click(timeout=5000)
        page.wait_for_timeout(800)
    try:
        ok = page.evaluate(SEED_SCRIPT)
        if ok is not True:
            errors.append(f"[{tag}] Seed de IndexedDB no completó (resultado {ok!r})")
    except Exception as e:
        errors.append(f"[{tag}] Seed falló: {e}")


def wait_ring(page, attr, expected, tag, errors):
    """Espera a que el anillo de /pasos refleje un atributo concreto."""
    try:
        page.wait_for_function(
            """([attr, expected]) => {
                const el = document.querySelector(
                    '[role="progressbar"][aria-label^="Hoy:"]'
                );
                return el && el.getAttribute(attr) === String(expected);
            }""",
            arg=[attr, expected],
            timeout=6000,
        )
    except PlaywrightTimeoutError:
        errors.append(f"[{tag}] El anillo no actualizó {attr} a {expected}")


def open_manual_sheet(page):
    page.get_by_role("button", name="Más opciones").click()
    page.get_by_text("Registrar pasos manualmente", exact=True).click()
    page.get_by_label("Total de hoy").wait_for()


def open_goal_sheet(page):
    page.get_by_role("button", name="Más opciones").click()
    page.get_by_text("Editar meta diaria", exact=True).click()
    page.get_by_label("Objetivo").wait_for()


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
        page.get_by_role("heading", name="Pasos", exact=True).wait_for()
        ring = page.locator('[role="progressbar"][aria-label^="Hoy:"]')
        ring.wait_for()
        if ring.get_attribute("aria-valuenow") != str(TODAY_STEPS):
            errors.append(f"[{tag}] Anillo muestra {ring.get_attribute('aria-valuenow')} pasos")
        if ring.get_attribute("aria-valuemax") != str(GOAL):
            errors.append(f"[{tag}] Meta del anillo {ring.get_attribute('aria-valuemax')} (esperaba {GOAL})")

        # Tiempo caminando estimado (7000 / 100 = 70 min = 1 h 10 min).
        page.get_by_text("1 h 10 min", exact=True).wait_for()

        # Stats: racha + unidades.
        for label in ("Racha",):
            if page.get_by_text(label, exact=True).count() == 0:
                errors.append(f"[{tag}] Falta la stat «{label}»")
        for unit in ("km", "kcal"):
            if page.get_by_text(unit).count() == 0:
                errors.append(f"[{tag}] Falta la unidad «{unit}» en las stats")

        # Logros de pasos unificados (F109.1): medallones del logro persistido.
        achievements_section = page.get_by_role("region", name="Logros", exact=True)
        if achievements_section.count() != 1:
            errors.append(f"[{tag}] Sección de logros no única ({achievements_section.count()})")
        achievements_section.wait_for()
        if achievements_section.locator("[data-achievement]").count() < 1:
            errors.append(f"[{tag}] Sin medallones de logro con pasos registrados")

        # Calendario de actividad: una celda por día del mes vigente.
        today = date.today()
        days_in_month = calendar.monthrange(today.year, today.month)[1]
        cells = page.locator("main div.grid.grid-cols-7 button").count()
        if cells != days_in_month:
            errors.append(f"[{tag}] Calendario con {cells} celdas (esperaba {days_in_month})")

        # La tira semanal tiene 7 días.
        week_days = page.locator('[role="list"] [role="listitem"]').count()
        if week_days != 7:
            errors.append(f"[{tag}] Tira semanal con {week_days} días (esperaba 7)")

        # Navegación del calendario: solo hacia atrás y vuelta al mes vigente.
        current_title = f"{MONTHS_ES[today.month - 1].capitalize()} de {today.year}"
        next_btn = page.get_by_role("button", name="Mes siguiente")
        prev_btn = page.get_by_role("button", name="Mes anterior")
        if page.get_by_text(current_title, exact=True).count() == 0:
            errors.append(f"[{tag}] No se encontró el título del mes vigente «{current_title}»")
        if not next_btn.is_disabled():
            errors.append(f"[{tag}] La flecha «Mes siguiente» debería estar deshabilitada en el mes vigente")
        prev_btn.click()
        page.wait_for_timeout(350)
        if next_btn.is_disabled():
            errors.append(f"[{tag}] La flecha «Mes siguiente» no se habilitó en un mes anterior con datos")
        if page.get_by_text(current_title, exact=True).count() > 0:
            errors.append(f"[{tag}] El calendario no cambió de mes al ir hacia atrás")
        next_btn.click()
        page.wait_for_timeout(350)
        if page.get_by_text(current_title, exact=True).count() == 0:
            errors.append(f"[{tag}] El calendario no volvió al mes vigente")
        if not next_btn.is_disabled():
            errors.append(f"[{tag}] La flecha «Mes siguiente» no volvió a deshabilitarse")

        # Alta manual escondida: 5000 reemplaza los 7000 de hoy (upsert).
        open_manual_sheet(page)
        page.get_by_label("Total de hoy").fill(str(RECORD_STEPS))
        page.get_by_text("Guardar", exact=True).click()
        wait_ring(page, "aria-valuenow", RECORD_STEPS, tag, errors)

        # Meta editable: 20.000 con validación y actualización del anillo.
        open_goal_sheet(page)
        page.get_by_label("Objetivo").fill(str(GOAL_EDIT))
        page.get_by_text("Guardar", exact=True).click()
        wait_ring(page, "aria-valuemax", GOAL_EDIT, tag, errors)
        page.get_by_text("meta 20.000 · cambiar", exact=True).wait_for()

        # F109 (C4): un registro que CUALIFICA (≥10k) DESPUÉS de la carga debe
        # desbloquear diez-mil-dia por el camino real (recordSteps → liveQuery →
        # debounce → evaluación → persistencia en meta).
        open_manual_sheet(page)
        page.get_by_label("Total de hoy").fill(str(QUALIFYING_STEPS))
        page.get_by_text("Guardar", exact=True).click()
        wait_ring(page, "aria-valuenow", QUALIFYING_STEPS, tag, errors)
        dismiss_achievement_modal(page)

        unlocked = page.evaluate(READ_UNLOCKED_JS)
        if "diez-mil-dia" not in (unlocked or []):
            errors.append(f"[{tag}] diez-mil-dia no quedó persistido en meta: {unlocked!r}")

        # Persistencia comprobable: tras recargar, el medallón aparece en /pasos.
        page.reload(wait_until="networkidle")
        page.wait_for_timeout(1500)
        achievements_section = page.get_by_role("region", name="Logros", exact=True)
        medal = achievements_section.locator('[data-achievement="diez-mil-dia"]').first
        if medal.count() == 0:
            errors.append(f"[{tag}] Medallón diez-mil-dia ausente tras el unlock")
        else:
            label = medal.get_attribute("aria-label") or ""
            if "chapa desbloqueada" not in label:
                errors.append(f"[{tag}] diez-mil-dia sin estado desbloqueado: {label}")

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
