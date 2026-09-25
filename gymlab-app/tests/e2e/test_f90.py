"""F90: ayuda contextual — InfoTip accesible y tips migrados (fase 90.1).

Casos:
 1. Medidas (/calculadoras/medidas): el «?» abre el diálogo; Escape lo cierra y
    devuelve el foco al disparador; la X lo cierra; un tap afuera lo cierra.
 2. Viewport 320x568: el popover queda dentro del viewport.
 3. Perfil (/perfil) con programa sembrado: tip de deload interpolado (10%) y
    el switch de deload sigue funcionando (el hit-area 44px no lo roba).
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"

SEED_APP_JS = """async () => {
  const openDb = () => new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const db = await openDb();
  await new Promise((res, rej) => {
    const tx = db.transaction(['meta'], 'readwrite');
    tx.objectStore('meta').put({ key: 'onboardingDone', value: true });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  return true;
}"""

SEED_PROGRAM_JS = """async () => {
  const openDb = () => new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const db = await openDb();
  const today = new Date().toISOString().slice(0, 10);
  await new Promise((res, rej) => {
    const tx = db.transaction(['activeProgram'], 'readwrite');
    tx.objectStore('activeProgram').clear();
    tx.objectStore('activeProgram').put({
      id: 1,
      routineId: 1,
      startDate: today,
      weekdays: [new Date().getDay()],
      createdAt: `${today}T00:00:00.000Z`,
    });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  return true;
}"""

SEED_SESSION_JS = """async () => {
  const openDb = () => new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const db = await openDb();
  const now = new Date().toISOString();
  await new Promise((res, rej) => {
    const tx = db.transaction(['exercises', 'meta'], 'readwrite');
    tx.objectStore('exercises').put({ id: 901, slug: 'sentadilla-f90', name: 'Sentadilla F90', muscleGroup: 'pierna', equipment: ['barra'], instructions: '', category: 'strength' });
    tx.objectStore('meta').put({ key: 'settings', value: JSON.stringify({ units: 'kg', showRpe: true, showRir: true }) });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  await new Promise((res, rej) => {
    const tx = db.transaction(['routines', 'routineDays', 'routineItems', 'activeProgram'], 'readwrite');
    tx.objectStore('routines').put({ id: 9001, slug: 'rutina-f90', title: 'Rutina F90', objective: 'fuerza', level: 'intermedio', description: '', daysCount: 1 });
    tx.objectStore('routineDays').put({ id: 9101, routineId: 9001, dayIndex: 0, name: 'Día A' });
    tx.objectStore('routineItems').put({ id: 9201, routineDayId: 9101, exerciseId: 901, targetSets: 3, targetReps: 8, restSec: 90, order: 1 });
    tx.objectStore('activeProgram').put({ id: 1, routineId: 9001, startDate: now.slice(0, 10), weekdays: [new Date().getDay()], createdAt: now });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  return true;
}"""

TITLE_MEDIDAS = "Para qué registrar medidas"
TITLE_DELOAD = "Qué es la semana de deload"

SEED_STATS_JS = """async () => {
  const openDb = () => new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const db = await openDb();
  const day = (offset) => {
    const d = new Date();
    d.setDate(d.getDate() - offset);
    return d.toISOString().slice(0, 10);
  };
  await new Promise((res, rej) => {
    const tx = db.transaction(['exercises', 'workouts', 'workoutSets', 'meta'], 'readwrite');
    // Logros ya desbloqueados: sembrar entrenos dispara el modal de celebración,
    // que se monta sobre la UI e intercepta los clics. metaRepo.getJson guarda
    // JSON serializado, así que el valor va como string.
    tx.objectStore('meta').put({ key: 'unlockedAchievements', value: JSON.stringify(['primer-paso', 'inaugural', 'primer-reto', 'racha-4', 'racha-8', 'primera-marca', 'volumen-semanal', 'sesiones-50', 'consistencia-4s', 'primera-cardio', 'ejercicios-100', 'racha-16', 'pr-10kg', 'guias-completas', 'sesiones-500', 'primer-ano']) });
    tx.objectStore('exercises').put({ id: 901, slug: 'sentadilla-f90', name: 'Sentadilla F90', muscleGroup: 'pierna', equipment: ['barra'], instructions: '', category: 'strength' });
    tx.objectStore('workouts').put({ id: 9301, startedAt: `${day(3)}T17:00:00.000Z`, finishedAt: `${day(3)}T18:00:00.000Z`, routineId: null, routineDayId: null, localDate: day(3), notes: '', totalVolume: 2400 });
    tx.objectStore('workouts').put({ id: 9302, startedAt: `${day(10)}T17:00:00.000Z`, finishedAt: `${day(10)}T18:00:00.000Z`, routineId: null, routineDayId: null, localDate: day(10), notes: '', totalVolume: 2100 });
    tx.objectStore('workoutSets').put({ id: 9401, workoutId: 9301, exerciseId: 901, setNumber: 1, weightKg: 80, reps: 10, completed: true, createdAt: `${day(3)}T17:05:00.000Z` });
    tx.objectStore('workoutSets').put({ id: 9402, workoutId: 9301, exerciseId: 901, setNumber: 2, weightKg: 85, reps: 8, completed: true, createdAt: `${day(3)}T17:10:00.000Z` });
    tx.objectStore('workoutSets').put({ id: 9403, workoutId: 9302, exerciseId: 901, setNumber: 1, weightKg: 80, reps: 10, completed: true, createdAt: `${day(10)}T17:05:00.000Z` });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  return true;
}"""


def boot(page):
    page.goto(BASE, wait_until="networkidle")
    page.wait_for_timeout(700)
    assert page.evaluate(SEED_APP_JS) is True, "seed app failed"
    page.reload(wait_until="networkidle")
    page.wait_for_timeout(900)
    skip = page.locator("button", has_text="Ya entreno aquí")
    if skip.count() > 0:
        skip.first.click(timeout=5000)
        page.wait_for_timeout(600)


def open_tip(page, label):
    # `.first`: la ayuda «volumen» se monta dos veces en el tab Entreno (título
    # de la sección y ChartCard del rango); ambas abren el mismo cuerpo.
    trigger = page.get_by_role("button", name=label).first
    trigger.click(timeout=5000)
    dialog = page.get_by_role("dialog")
    dialog.wait_for(state="visible", timeout=5000)
    return trigger, dialog


def run_info_tip(page, errors):
    """Caso 1 y 2: comportamiento del InfoTip en /calculadoras/medidas."""
    page.goto(f"{BASE}/calculadoras/medidas", wait_until="networkidle")
    page.wait_for_timeout(600)

    # Abrir + Escape cierra y devuelve el foco.
    _, dialog = open_tip(page, TITLE_MEDIDAS)
    assert "Mide siempre" in dialog.inner_text(), "body del tip no visible"
    page.keyboard.press("Escape")
    dialog.wait_for(state="hidden", timeout=5000)
    focused = page.evaluate("document.activeElement?.getAttribute('aria-label')")
    assert focused == TITLE_MEDIDAS, f"foco tras Escape: {focused}"

    # La X cierra.
    _, dialog = open_tip(page, TITLE_MEDIDAS)
    dialog.get_by_role("button", name="Cerrar").click(timeout=5000)
    dialog.wait_for(state="hidden", timeout=5000)

    # Un tap afuera cierra.
    _, dialog = open_tip(page, TITLE_MEDIDAS)
    page.mouse.click(10, 400)
    dialog.wait_for(state="hidden", timeout=5000)

    # Viewport chico: el popover queda dentro del viewport.
    page.set_viewport_size({"width": 320, "height": 568})
    page.wait_for_timeout(300)
    _, dialog = open_tip(page, TITLE_MEDIDAS)
    box = dialog.bounding_box()
    assert box is not None, "popover sin bounding box"
    assert box["x"] >= 0 and box["y"] >= 0, f"popover fuera: {box}"
    assert box["x"] + box["width"] <= 320 and box["y"] + box["height"] <= 568, f"popover fuera: {box}"
    page.keyboard.press("Escape")
    page.set_viewport_size({"width": 375, "height": 812})


def run_stats_tips(page, errors):
    """Caso 4: tips en /estadisticas (IMC en tab Cuerpo, volumen y carga en Entreno)."""
    assert page.evaluate(SEED_STATS_JS) is True, "seed stats failed"
    page.goto(f"{BASE}/estadisticas", wait_until="networkidle")
    page.wait_for_timeout(900)

    # Tab Cuerpo: IMC.
    page.get_by_role("tab", name="Cuerpo").click(timeout=5000)
    page.wait_for_timeout(600)
    _, dialog = open_tip(page, "Qué es el IMC")
    assert "18.5" in dialog.inner_text(), dialog.inner_text()
    page.keyboard.press("Escape")

    # Tab Entreno: volumen y carga.
    page.get_by_role("tab", name="Entrenamiento").click(timeout=5000)
    page.wait_for_timeout(600)
    _, dialog = open_tip(page, "Cómo se calcula el volumen")
    assert "lunes a domingo" in dialog.inner_text(), dialog.inner_text()
    page.keyboard.press("Escape")
    _, dialog = open_tip(page, "Qué es la carga por sesión")
    assert "PR" in dialog.inner_text(), dialog.inner_text()
    page.keyboard.press("Escape")


def run_deload_tip(page, errors):
    """Caso 3: tip migrado con interpolación + switch intacto."""
    assert page.evaluate(SEED_PROGRAM_JS) is True, "seed program failed"
    page.reload(wait_until="networkidle")
    page.wait_for_timeout(900)
    page.goto(f"{BASE}/perfil", wait_until="networkidle")
    page.wait_for_timeout(600)

    _, dialog = open_tip(page, TITLE_DELOAD)
    assert "reduce el peso (10%)" in dialog.inner_text(), dialog.inner_text()
    page.keyboard.press("Escape")

    sw = page.get_by_role("switch", name="Activar semana de deload")
    assert sw.get_attribute("aria-checked") == "false"
    sw.click(timeout=5000)
    page.wait_for_timeout(400)
    assert sw.get_attribute("aria-checked") == "true"


def run_rpe_rir_tips(page, errors):
    """Caso 5: tips de RPE/RIR en Ajustes y en la cabecera de la sesión activa."""
    # Ajustes: los toggles tienen «?».
    page.goto(f"{BASE}/ajustes", wait_until="networkidle")
    page.wait_for_timeout(700)
    _, dialog = open_tip(page, "Qué es el RPE")
    assert "descanso" in dialog.inner_text(), dialog.inner_text()
    page.keyboard.press("Escape")
    _, dialog = open_tip(page, "Qué es el RIR")
    assert "reserva" in dialog.inner_text(), dialog.inner_text()
    page.keyboard.press("Escape")

    # Sesión activa: cabecera de columnas con «?» (con RPE/RIR activados por seed).
    assert page.evaluate(SEED_SESSION_JS) is True, "seed session failed"
    page.goto(BASE, wait_until="networkidle")
    page.wait_for_timeout(900)
    page.wait_for_selector('button:has-text("Empezar hoy")', state="visible", timeout=15000)
    page.locator("button", has_text="Empezar hoy").first.click(timeout=5000)
    dialog_sheet = page.locator('div[role="dialog"]', has_text="Elige el día")
    dialog_sheet.wait_for(state="visible", timeout=5000)
    dialog_sheet.locator("button", has_text="Día A").first.click(timeout=5000)
    page.wait_for_url(f"{BASE}/entrenamiento/active", timeout=8000)
    page.wait_for_timeout(800)

    # El calentamiento guiado tapa la UI al abrir la sesión por primera vez.
    skip_warm = page.locator("button", has_text="Saltar calentamiento")
    if skip_warm.count() > 0:
        skip_warm.first.click(timeout=5000)
        page.wait_for_timeout(500)

    _, dialog = open_tip(page, "Qué es el RPE")
    assert "esfuerzo" in dialog.inner_text().lower(), dialog.inner_text()
    page.keyboard.press("Escape")
    _, dialog = open_tip(page, "Qué es el RIR")
    assert "reserva" in dialog.inner_text().lower(), dialog.inner_text()
    page.keyboard.press("Escape")


def main():
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 375, "height": 812})
        page = context.new_page()
        console_errors = []
        page.on(
            "console",
            lambda m: console_errors.append(f"console.{m.type}: {m.text}") if m.type == "error" else None,
        )
        page.on("pageerror", lambda e: console_errors.append(f"pageerror: {e}"))
        try:
            boot(page)
            run_info_tip(page, errors)
            run_stats_tips(page, errors)
            run_deload_tip(page, errors)
            run_rpe_rir_tips(page, errors)
        except Exception as e:  # noqa: BLE001
            errors.append(f"Exception: {e}")
        finally:
            errors.extend(console_errors)
            page.close()
            context.close()
            browser.close()
    if errors:
        print("ERRORS:")
        for e in errors:
            print(f"  - {e}")
        return 1
    print("ALL OK: F90 (InfoTip accesible, deload, estadísticas y RPE/RIR)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
