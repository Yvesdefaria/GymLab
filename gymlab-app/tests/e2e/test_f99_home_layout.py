"""Fase 99.1: selector de día en el home (Slice A) — A.9, A.10 y A.11.

Escenarios (viewport 375x812), datos sembrados en IndexedDB:
  A.9  Happy path: rutina con 3 días con ejercicios + 1 vacío + programa activo
       (hoy siempre es día de entrenamiento). "Empezar" abre el selector con
       exactamente 3 filas (el día vacío no aparece); elegir un día arranca la
       sesión con su routineDayId (localStorage zustand, persist diferido);
       "Cambiar día" visible; filas >= 44px; locale en sin errores i18n.
  A.10 Negativo R4: rutina con el día 2 sin items; el selector muestra solo los
       días con ejercicios (el vacío es estructuralmente inalcanzable).
  A.11 R5 reduced-motion: emulate_media(reduced_motion=True); al abrir el selector
       la duración de transición queda <= 0.02s (override global index.css con el
       truco de 0.01ms, que el navegador normaliza como 1e-05s) → sin animación
       visible. La ConfirmSheet del flujo vacío comparte la misma regla global,
       pero es estructuralmente inalcanzable por UI (D2); la reducción se verifica
       aquí sobre los elementos del selector y el botón del hero.
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"

# Onboarding done + 3 ejercicios mínimos para el selector (F99.1/D2).
SEED_APP_JS = """async () => {
  const openDb = () => new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const db = await openDb();
  await new Promise((res, rej) => {
    const tx = db.transaction(['exercises', 'meta'], 'readwrite');
    const ex = tx.objectStore('exercises');
    ex.put({ id: 801, slug: 'sentadilla-f99', name: 'Sentadilla F99', muscleGroup: 'pierna', equipment: 'barra', instructions: '', category: 'strength' });
    ex.put({ id: 802, slug: 'press-f99',     name: 'Press F99',     muscleGroup: 'pecho',  equipment: 'barra', instructions: '', category: 'strength' });
    ex.put({ id: 803, slug: 'remo-f99',       name: 'Remo F99',      muscleGroup: 'espalda', equipment: 'barra', instructions: '', category: 'strength' });
    const meta = tx.objectStore('meta');
    meta.put({ key: 'onboardingDone', value: 'true' });
    meta.put({ key: 'settings', value: JSON.stringify({ units: 'kg', showRpe: true, showRir: true }) });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  return true;
}"""

# Rutina 7001: 4 días (3 con items, 1 vacío) + programa activo que mapea hoy al día 0.
# weekdays: [día real de hoy] → scheduledDayIndex = 0 → Día A → "Empezar hoy".
SEED_ROUTINE_7001_JS = """async () => {
  const openDb = () => new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const db = await openDb();
  const now = new Date().toISOString();
  await new Promise((res, rej) => {
    const tx = db.transaction(['routines', 'routineDays', 'routineItems', 'activeProgram'], 'readwrite');
    const routines = tx.objectStore('routines');
    routines.put({ id: 7001, slug: 'rutina-f99', title: 'Rutina F99', objective: 'fuerza', level: 'intermedio', description: '', daysCount: 4 });
    const days = tx.objectStore('routineDays');
    days.put({ id: 7101, routineId: 7001, dayIndex: 0, name: 'Día A' });
    days.put({ id: 7102, routineId: 7001, dayIndex: 1, name: 'Día B' });
    days.put({ id: 7103, routineId: 7001, dayIndex: 2, name: 'Día C' });
    days.put({ id: 7104, routineId: 7001, dayIndex: 3, name: 'Día D' });
    const items = tx.objectStore('routineItems');
    // Día A: ejercicio 801
    items.put({ id: 7201, routineDayId: 7101, exerciseId: 801, targetSets: 4, targetReps: 8, restSec: 120, order: 1 });
    // Día B: ejercicio 802
    items.put({ id: 7202, routineDayId: 7102, exerciseId: 802, targetSets: 3, targetReps: 10, restSec: 90, order: 1 });
    // Día C: ejercicio 803
    items.put({ id: 7203, routineDayId: 7103, exerciseId: 803, targetSets: 3, targetReps: 12, restSec: 90, order: 1 });
    // Día D: SIN ITEMS (objeto vacío en el índice)
    tx.objectStore('activeProgram').put({ id: 1, routineId: 7001, startDate: '2026-09-14', weekdays: [new Date().getDay()], createdAt: now });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  return true;
}"""

# Fijar idioma inglés para el escenario R6 (verificar claves sin errores).
SEED_EN_LOCALE_JS = """async () => {
  const openDb = () => new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const db = await openDb();
  await new Promise((res, rej) => {
    const tx = db.transaction('meta', 'readwrite');
    tx.objectStore('meta').put({ key: 'settings', value: JSON.stringify({ language: 'en', units: 'kg' }) });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  return true;
}"""

# Volver a es tras el escenario en (el idioma queda persistido en settings).
SEED_ES_LOCALE_JS = """async () => {
  const openDb = () => new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const db = await openDb();
  await new Promise((res, rej) => {
    const tx = db.transaction('meta', 'readwrite');
    tx.objectStore('meta').put({ key: 'settings', value: JSON.stringify({ language: 'es', units: 'kg' }) });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  return true;
}"""

# Rutina 7002 (escenario negativo A.10): día B sin items + programa apunta a 7002.
SEED_ROUTINE_7002_JS = """async () => {
  const openDb = () => new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const db = await openDb();
  const now = new Date().toISOString();
  await new Promise((res, rej) => {
    const tx = db.transaction(['routines', 'routineDays', 'routineItems', 'activeProgram'], 'readwrite');
    tx.objectStore('routines').put({ id: 7002, slug: 'rutina-f99-neg', title: 'Rutina F99 Neg', objective: 'fuerza', level: 'intermedio', description: '', daysCount: 3 });
    const days = tx.objectStore('routineDays');
    days.put({ id: 7301, routineId: 7002, dayIndex: 0, name: 'Día A' });
    days.put({ id: 7302, routineId: 7002, dayIndex: 1, name: 'Día B' });
    days.put({ id: 7303, routineId: 7002, dayIndex: 2, name: 'Día C' });
    const items = tx.objectStore('routineItems');
    items.put({ id: 7401, routineDayId: 7301, exerciseId: 801, targetSets: 3, targetReps: 10, restSec: 90, order: 1 });
    // Día B (7302): SIN ITEMS — el selector no debe mostrarlo
    items.put({ id: 7403, routineDayId: 7303, exerciseId: 803, targetSets: 3, targetReps: 10, restSec: 90, order: 1 });
    tx.objectStore('activeProgram').put({ id: 1, routineId: 7002, startDate: '2026-09-14', weekdays: [new Date().getDay()], createdAt: now });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  return true;
}"""


def dismiss_overlays(page, timeout_ms=6000):
    """Avanza la cola de overlays (logros, modales) que puedan interceptar clics."""
    deadline = timeout_ms
    while deadline > 0:
        overlay = page.locator("div.fixed.inset-0.z-50")
        if overlay.count() == 0:
            return
        btn = overlay.locator("button").last
        if btn.count() > 0:
            btn.click(timeout=2000)
        else:
            page.keyboard.press("Escape")
        page.wait_for_timeout(300)
        deadline -= 300


def boot(page):
    page.goto(BASE, wait_until="networkidle")
    page.wait_for_timeout(700)
    assert page.evaluate(SEED_APP_JS) is True, "seed app failed"
    assert page.evaluate(SEED_ROUTINE_7001_JS) is True, "seed routine 7001 failed"
    page.reload(wait_until="networkidle")
    page.wait_for_timeout(900)
    skip_ob = page.locator("button", has_text="Ya entreno aquí")
    if skip_ob.count() > 0:
        skip_ob.first.click(timeout=5000)
        page.wait_for_timeout(600)
    dismiss_overlays(page)


def open_picker(page, start_label="Empezar hoy", dialog_label="Elige el día"):
    """Abre el selector de día y devuelve el localizador del diálogo.

    El primer uso del bundle en (import dinámico) puede tardar unos segundos
    en dev; se espera al botón antes de hacer click.
    """
    page.wait_for_selector(f'button:has-text("{start_label}")', state="visible", timeout=15000)
    page.locator("button", has_text=start_label).first.click(timeout=5000)
    dialog = page.locator('div[role="dialog"]', has_text=dialog_label)
    dialog.wait_for(state="visible", timeout=5000)
    return dialog


def reset_session(page):
    page.evaluate("localStorage.removeItem('gymLab-activeWorkout')")


def main():
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 375, "height": 812})
        console_errors = []
        page.on(
            "console",
            lambda m: console_errors.append(f"console.{m.type}: {m.text}")
            if m.type == "error"
            else None,
        )
        page.on("pageerror", lambda e: console_errors.append(f"pageerror: {e}"))
        try:
            # ---- A.9 Happy path ----
            boot(page)
            reset_session(page)

            # (3) "Cambiar día" visible con programa activo y sin sesión en curso.
            btn_cambiar = page.locator("button", has_text="Cambiar día")
            if not btn_cambiar.is_visible():
                errors.append("A.9(3): 'Cambiar día' no visible sin sesión activa")
            else:
                print("OK A.9(3): 'Cambiar día' visible sin sesión activa")

            # (1) Empezar abre selector con 3 filas, día vacío no aparece.
            dialog = open_picker(page)
            rows = dialog.locator('button', has_text="Día")
            row_count = rows.count()
            if row_count != 3:
                errors.append(f"A.9(1): esperaba 3 filas, hay {row_count}")
            # Día D (vacío) no debe aparecer.
            if dialog.locator('button', has_text="Día D").count() != 0:
                errors.append("A.9(1): el día vacío Día D aparece en el selector")
            else:
                print(f"OK A.9(1): selector con {row_count} filas, día vacío ausente")

            # (4) Filas >= 44px (touch targets).
            first_row = rows.first
            box = first_row.bounding_box()
            if box is None or box["height"] < 44:
                height = box["height"] if box else 0
                errors.append(f"A.9(4): altura de fila {height}px < 44px")
            else:
                print(f"OK A.9(4): fila con altura {box['height']}px >= 44px")

            # (2) Seleccionar Día B → sesión con routineDayId = 7102.
            rows.nth(1).click(timeout=3000)
            page.wait_for_url(f"{BASE}/entrenamiento/active", timeout=6000)
            # El persist de zustand es diferido (400 ms, tarea 91.2): esperar al flush.
            page.wait_for_timeout(800)
            store = json.loads(page.evaluate("localStorage.getItem('gymLab-activeWorkout')") or "{}")
            routine_day_id = (store.get("state") or {}).get("routineDayId")
            if routine_day_id != 7102:
                errors.append(f"A.9(2): routineDayId={routine_day_id}, esperado 7102")
            else:
                print("OK A.9(2): routineDayId correcto tras seleccionar Día B")

            # R6: locale en — volver al home sin sesión persistida, cambiar
            # settings.language a en y recargar.
            reset_session(page)
            page.goto(BASE, wait_until="networkidle")
            page.wait_for_timeout(700)
            # Limpiar errores previos ANTES del reload para aislar el boot en.
            console_errors.clear()
            assert page.evaluate(SEED_EN_LOCALE_JS) is True, "seed en locale failed"
            # Espera a la aplicación real del bundle en (html lang) antes de tocar la UI.
            page.reload(wait_until="networkidle")
            page.wait_for_function(
                "() => document.documentElement.lang === 'en'", timeout=20000
            )
            page.wait_for_timeout(800)
            dismiss_overlays(page)
            # En dev, el primer load pueden tardar por compilación a demanda; un retry
            # (recarga + re-seed) cubre el cold-start del servidor.
            try:
                dialog_en = open_picker(page, start_label="Start today", dialog_label="Pick the day")
            except Exception:  # noqa: BLE001
                reset_session(page)
                page.goto(BASE, wait_until="networkidle")
                page.wait_for_timeout(700)
                assert page.evaluate(SEED_EN_LOCALE_JS) is True, "seed en locale failed (retry)"
                page.reload(wait_until="networkidle")
                page.wait_for_function(
                    "() => document.documentElement.lang === 'en'", timeout=20000
                )
                page.wait_for_timeout(800)
                dismiss_overlays(page)
                dialog_en = open_picker(page, start_label="Start today", dialog_label="Pick the day")
            heading = dialog_en.locator("p", has_text="Pick the day")
            if not heading.is_visible():
                errors.append("R6: el título del selector no muestra 'Pick the day' en locale en")
            else:
                print("OK R6: locale en renderiza el título correctamente")
            # Sin errores de clave faltante en consola (i18next no loguea claves faltantes con debug false,
            # pero se valida que no haya errores inesperados).
            i18n_errors = [e for e in console_errors if "missing" in e.lower() or "i18next" in e.lower()]
            if i18n_errors:
                errors.append(f"R6: errores i18n en consola: {i18n_errors}")

            # ---- A.10 Negativo R4 — día vacío inalcanzable ----
            reset_session(page)
            assert page.evaluate(SEED_ES_LOCALE_JS) is True, "seed es locale failed"
            assert page.evaluate(SEED_ROUTINE_7002_JS) is True, "seed routine 7002 failed"
            page.reload(wait_until="networkidle")
            page.wait_for_timeout(700)
            dismiss_overlays(page)
            dialog_neg = open_picker(page)
            neg_rows = dialog_neg.locator('button', has_text="Día")
            neg_count = neg_rows.count()
            if neg_count != 2:
                errors.append(f"A.10: esperaba 2 filas (sin B vacío), hay {neg_count}")
            elif dialog_neg.locator('button', has_text="Día B").count() != 0:
                errors.append("A.10: Día B (vacío) aparece en el selector")
            else:
                print(f"OK A.10: selector negativo con {neg_count} filas, Día B ausente")

            # ---- A.11 R5 reduced-motion ----
            reset_session(page)
            page.emulate_media(reduced_motion="reduce")
            page.reload(wait_until="networkidle")
            page.wait_for_timeout(700)
            dismiss_overlays(page)
            dialog_rm = open_picker(page)
            first_row_rm = dialog_rm.locator('button', has_text="Día").first
            duration = first_row_rm.evaluate(
                "el => window.getComputedStyle(el).transitionDuration"
            )
            # El navegador normaliza 0.01ms como "1e-05s": aceptar cualquier
            # duración <= 0.02s (override global de reduced-motion).
            reduced_ok = False
            try:
                reduced_ok = float(duration.rstrip("s")) <= 0.02
            except ValueError:
                reduced_ok = False
            if not reduced_ok:
                errors.append(f"A.11: transition-duration={duration}, esperado <= 0.02s")
            else:
                print(f"OK A.11: reduced-motion respetado (transition-duration={duration})")
            # El botón "Cambiar día" también debe respetar reduced-motion.
            hero_btn = page.locator("button", has_text="Cambiar día")
            hero_duration = hero_btn.evaluate(
                "el => window.getComputedStyle(el).transitionDuration"
            )
            hero_ok = False
            try:
                hero_ok = float(hero_duration.rstrip("s")) <= 0.02
            except ValueError:
                hero_ok = False
            if not hero_ok:
                errors.append(f"A.11: hero transition-duration={hero_duration}, esperado <= 0.02s")
            else:
                print(f"OK A.11: reduced-motion en botón del hero (transition-duration={hero_duration})")

        except Exception as e:  # noqa: BLE001
            errors.append(f"Exception: {e}")
        finally:
            errors.extend(console_errors)
            page.close()
            browser.close()

    if errors:
        print("ERRORS:")
        for e in errors:
            print(f"  - {e}")
        return 1
    print("ALL OK: F99.1 selector de día (A.9 happy path + en, A.10 R4, A.11 R5 reduced-motion)")
    return 0


if __name__ == "__main__":
    sys.exit(main())