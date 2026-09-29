"""Fase 109: e2e del catálogo unificado de medallas y de los retos nuevos.

Casos:
1. /logros unificado: contador X/36, sin bloque aparte «Logros de pasos», la
   medalla de pasos diez-mil-dia desbloqueada con su barra y una medalla nueva
   bloqueada (nutricion-semana) con su barra de progreso.
2. /pasos: los medallones de pasos desbloqueados (diez-mil-dia) se pintan.
3. Home: los 4 retos nuevos aparecen por título en Disponibles (seed nivel
   avanzado: 150 sesiones ⇒ vol-pierna-5000 también disponible).
4. Cola retro: con el historial sembrado y sin logros persistidos, el modal
   celebra al menos un logro y se cierra completo con el helper de dismiss.

Los seeds simulan el flujo real: pasos (10k+/día y ≥50 km), comidas de 3 días,
series con delta de PR ≥10 kg, peso y una foto.
"""
import os
import re
import sys

sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import TimeoutError as PlaywrightTimeoutError
from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"

# Catálogo unificado F109: 16 de entreno + 8 de pasos + 12 familias nuevas.
CATALOG_SIZE = 36

# Historial sembrado (casos 1, 2 y 4): dos sesiones con series de trabajo y un
# pico de 100 kg (delta de 20 kg), 8 días de pasos ≥10k (64 km totales),
# comidas de 3 días (racha < 7), un peso y una foto. Desbloquea paso a paso
# logros de todos los orígenes; nutricion-semana queda bloqueada.
SEED_HISTORY_JS = """async () => {
  const openDb = () => new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const db = await openDb();
  const localDate = (offset) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  };
  const isoAt = (offset, hour) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    d.setHours(hour, 0, 0, 0);
    return d.toISOString();
  };
  await new Promise((res, rej) => {
    const tx = db.transaction(
      ['exercises', 'workouts', 'workoutSets', 'prs', 'dailySteps', 'mealEntries',
       'bodyWeight', 'progressPhotos', 'meta'],
      'readwrite'
    );
    const put = (store, row) => tx.objectStore(store).put(row);
    // Ejercicio propio (id alto, fuera del catálogo) para el delta de PR.
    put('exercises', { id: 9001, slug: 'sentadilla-f109', name: 'Sentadilla F109', muscleGroup: 'pierna', equipment: ['barra'], instructions: '', category: 'strength' });
    // Dos sesiones: base 80 kg y pico 100 kg ⇒ pr-10kg desbloqueado.
    put('workouts', { id: 9001, startedAt: isoAt(-8, 10), finishedAt: isoAt(-8, 11), routineId: null, routineDayId: null, localDate: localDate(-8), notes: '', totalVolume: 1500 });
    put('workoutSets', { id: 9001, workoutId: 9001, exerciseId: 9001, setNumber: 1, weightKg: 80, reps: 5, completed: true, createdAt: isoAt(-8, 10) });
    put('workoutSets', { id: 9002, workoutId: 9001, exerciseId: 9001, setNumber: 2, weightKg: 95, reps: 5, completed: true, createdAt: isoAt(-8, 10) });
    put('workouts', { id: 9002, startedAt: isoAt(-2, 10), finishedAt: isoAt(-2, 11), routineId: null, routineDayId: null, localDate: localDate(-2), notes: '', totalVolume: 500 });
    put('workoutSets', { id: 9003, workoutId: 9002, exerciseId: 9001, setNumber: 1, weightKg: 100, reps: 5, completed: true, createdAt: isoAt(-2, 10) });
    put('prs', { exerciseId: 9001, weightKg: 100, reps: 5, date: isoAt(-2, 11), estimated1RM: 113 });
    // Pasos: 8 días ≥10k y 8 km/día ⇒ diez-mil-dia y pasos-50km desbloqueados.
    for (let i = 1; i <= 8; i++) {
      put('dailySteps', { id: i, localDate: localDate(-i), steps: 10500, distanceKm: 8, calories: 210, source: 'manual', syncedAt: isoAt(-i, 8) });
    }
    // Comidas de 3 días: nutricion-primera sí, nutricion-semana (7) no.
    for (let i = 1; i <= 3; i++) {
      put('mealEntries', { id: i, localDate: localDate(-i), mealType: 'almuerzo', items: [{ foodId: 1, foodKey: 'chickenBreast', grams: 200, kcal: 330, proteinG: 62, carbsG: 0, fatG: 7.2 }], createdAt: isoAt(-i, 13) });
    }
    put('bodyWeight', { id: 9001, localDate: localDate(-5), weightKg: 80, createdAt: isoAt(-5, 8) });
    put('progressPhotos', { id: 9001, localDate: localDate(-5), frontUri: 'data:image/png;base64,', sideUri: null, backUri: null, note: '', createdAt: isoAt(-5, 9) });
    put('meta', { key: 'onboardingDone', value: 'true' });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  return true;
}"""

# Seed de la Home (caso 3): 150 sesiones ⇒ deriveLevel = avanzado y todos los
# retos (incluido vol-pierna-5000) disponibles. Sin series/PRs/pasos: los 4
# retos nuevos quedan sin arrancar. Todos los logros persistidos ⇒ sin modal.
SEED_RETOS_JS = """async () => {
  const openDb = () => new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const db = await openDb();
  const localDate = (offset) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  };
  const isoAt = (offset, hour) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    d.setHours(hour, 0, 0, 0);
    return d.toISOString();
  };
  const { ACHIEVEMENTS } = await import('/src/domain/achievements.ts');
  const ids = ACHIEVEMENTS.map((a) => a.id);
  await new Promise((res, rej) => {
    const tx = db.transaction(['workouts', 'meta'], 'readwrite');
    const put = (store, row) => tx.objectStore(store).put(row);
    // Sesiones cada 3 días terminando 10 días atrás: las semanas previas tienen
    // sesión (cons-4/cons-8 activos) y la semana en curso queda vacía (dias-4 = 0).
    for (let i = 0; i < 150; i++) {
      const offset = -(10 + i * 3);
      put('workouts', { id: 9100 + i, startedAt: isoAt(offset, 18), finishedAt: isoAt(offset, 19), routineId: null, routineDayId: null, localDate: localDate(offset), notes: '', totalVolume: 0 });
    }
    put('meta', { key: 'onboardingDone', value: 'true' });
    put('meta', { key: 'unlockedAchievements', value: JSON.stringify(ids) });
    put('meta', { key: 'achievementCounts', value: JSON.stringify(Object.fromEntries(ids.map((id) => [id, 1]))) });
    put('meta', { key: 'achievementSnapshot', value: JSON.stringify(ids) });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  return true;
}"""


def boot(page, seed_js):
    """Carga la app, siembra IndexedDB y salta el onboarding si aparece."""
    page.goto(BASE, wait_until="networkidle")
    page.wait_for_timeout(800)
    seed = page.evaluate(seed_js)
    assert seed is True, f"seed fallo: {seed}"
    page.reload(wait_until="networkidle")
    page.wait_for_timeout(1000)
    skip_ob = page.locator("button", has_text="Ya entreno aquí")
    if skip_ob.count() > 0:
        skip_ob.first.click(timeout=5000)
        page.wait_for_timeout(800)


def dismiss_achievement_modal(page, timeout_ms=2500, max_items=40):
    """Cierra la cola del modal de logros si aparece (helper existente de f47/u2).

    `useAchievements` evalúa con 600 ms de debounce y muestra un logro por
    pantalla, así que sin cerrarla el backdrop intercepta los clics del test.
    Devuelve True si no quedó ningún modal abierto.
    """
    btn = page.get_by_role("button", name="¡Genial!")
    try:
        btn.first.wait_for(state="visible", timeout=timeout_ms)
    except PlaywrightTimeoutError:
        return True
    for _ in range(max_items):
        if btn.count() == 0:
            return True
        btn.first.click()
        page.wait_for_timeout(250)
    return btn.count() == 0


def check_logros(page, errors):
    """Caso 1: /logros unificado con 36 medallas, una de pasos y una bloqueada."""
    boot(page, SEED_HISTORY_JS)
    dismiss_achievement_modal(page)
    page.goto(f"{BASE}/logros", wait_until="networkidle")
    page.wait_for_timeout(1200)

    body = page.inner_text("body")
    if not re.search(r"\d{1,2}/36", body):
        errors.append("logros: contador X/36 no visible")

    general = page.locator('[data-progress="general"]').first
    if general.count() == 0:
        errors.append("logros: falta la barra general del catálogo")
    elif general.get_attribute("aria-valuemax") != str(CATALOG_SIZE):
        errors.append(
            f"logros: aria-valuemax general != {CATALOG_SIZE}: "
            f"{general.get_attribute('aria-valuemax')}"
        )

    if page.get_by_text("Logros de pasos", exact=True).count() > 0:
        errors.append("logros: aparece el bloque aparte «Logros de pasos»")

    diez = page.locator('[data-achievement="diez-mil-dia"]').first
    if diez.count() == 0:
        errors.append("logros: no se renderiza la medalla diez-mil-dia")
    else:
        label = diez.get_attribute("aria-label") or ""
        if "chapa desbloqueada" not in label:
            errors.append(f"logros: diez-mil-dia no figura desbloqueada: {label}")
    bar = page.locator('[data-progress="diez-mil-dia"]').first
    if bar.count() == 0:
        errors.append("logros: diez-mil-dia sin barra de progreso")
    elif (bar.get_attribute("aria-valuenow"), bar.get_attribute("aria-valuemax")) != ("10000", "10000"):
        errors.append(
            "logros: barra diez-mil-dia != 10000/10000: "
            f"{bar.get_attribute('aria-valuenow')}/{bar.get_attribute('aria-valuemax')}"
        )

    nutri = page.locator('[data-achievement="nutricion-semana"]').first
    if nutri.count() == 0:
        errors.append("logros: no se renderiza la medalla nueva nutricion-semana")
    else:
        label = nutri.get_attribute("aria-label") or ""
        if "chapa bloqueada" not in label:
            errors.append(f"logros: nutricion-semana no figura bloqueada: {label}")
    nbar = page.locator('[data-progress="nutricion-semana"]').first
    if nbar.count() == 0:
        errors.append("logros: nutricion-semana sin barra de progreso")
    else:
        if nbar.get_attribute("aria-valuemax") != "7":
            errors.append(
                f"logros: barra nutricion-semana max != 7: {nbar.get_attribute('aria-valuemax')}"
            )
        if nbar.get_attribute("aria-valuenow") != "3":
            errors.append(
                f"logros: barra nutricion-semana now != 3 (3 días sembrados): "
                f"{nbar.get_attribute('aria-valuenow')}"
            )

    page.screenshot(path=os.path.join(os.path.dirname(__file__), "shots", "f109-logros-unificado.png"), full_page=False)


def check_pasos(page, errors):
    """Caso 2: /pasos pinta los medallones de logros de pasos desbloqueados."""
    boot(page, SEED_HISTORY_JS)
    dismiss_achievement_modal(page)
    page.goto(f"{BASE}/pasos", wait_until="networkidle")
    page.wait_for_timeout(1500)

    section = page.locator("main section:has-text('Logros')")
    section.wait_for()
    medal = section.locator('[data-achievement="diez-mil-dia"]').first
    if medal.count() == 0:
        errors.append("pasos: falta el medallón de diez-mil-dia")
    else:
        label = medal.get_attribute("aria-label") or ""
        if "chapa desbloqueada" not in label:
            errors.append(f"pasos: medallón diez-mil-dia sin estado desbloqueado: {label}")

    section.scroll_into_view_if_needed()
    page.wait_for_timeout(500)
    page.screenshot(path=os.path.join(os.path.dirname(__file__), "shots", "f109-pasos-medallones.png"), full_page=False)


def check_retos_home(page, errors):
    """Caso 3: los 4 retos nuevos aparecen por título en Disponibles."""
    boot(page, SEED_RETOS_JS)
    dismiss_achievement_modal(page)
    page.wait_for_timeout(800)

    tablist = page.locator('[role="tablist"][aria-label="Retos"]')
    try:
        tablist.wait_for(state="visible", timeout=15000)
    except PlaywrightTimeoutError:
        errors.append("retos: no se renderiza la sección de retos en Home")
        return

    available = tablist.locator('[data-tab="available"]')
    if available.get_attribute("aria-selected") != "true":
        available.click()
        page.wait_for_timeout(700)

    panel = page.locator("#tabnav-panel-available")
    if panel.count() == 0:
        errors.append("retos: no se renderiza el panel de Disponibles")
        return
    for title in ("100.000 pasos", "Cardio constante", "Pierna de acero", "Cuatro al hilo"):
        item = panel.get_by_text(title, exact=True).first
        if item.count() == 0 or not item.is_visible():
            errors.append(f"retos: «{title}» no aparece visible en Disponibles")

    panel.scroll_into_view_if_needed()
    # Encuadra las 4 tarjetas nuevas (van juntas al final del catálogo).
    panel.get_by_text("Cuatro al hilo", exact=True).first.scroll_into_view_if_needed()
    page.wait_for_timeout(500)
    page.screenshot(path=os.path.join(os.path.dirname(__file__), "shots", "f109-home-retos.png"), full_page=False)


def check_queue_retro(page, errors):
    """Caso 4: la cola del modal celebra al menos un logro y cierra completa."""
    boot(page, SEED_HISTORY_JS)

    dialog = page.locator('[role="dialog"][aria-labelledby="achievement-modal-title"]')
    try:
        dialog.wait_for(state="visible", timeout=15000)
    except PlaywrightTimeoutError:
        errors.append("cola retro: el modal no apareció con el historial sembrado")
        return
    page.wait_for_timeout(400)

    if dialog.locator("[data-achievement]").count() < 1:
        errors.append("cola retro: el modal no muestra ninguna medalla de logro")

    # Evidencia de la celebración ANTES de dismisear la cola.
    page.screenshot(path=os.path.join(os.path.dirname(__file__), "shots", "f109-modal-retro.png"), full_page=False)

    dismiss_achievement_modal(page)
    page.wait_for_timeout(400)
    if page.locator('[role="dialog"][aria-labelledby="achievement-modal-title"]').count() != 0:
        errors.append("cola retro: el modal no se cerró al dismisear la cola")


def main():
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        cases = (
            ("logros", check_logros),
            ("pasos", check_pasos),
            ("retos home", check_retos_home),
            ("cola retro", check_queue_retro),
        )
        for name, check in cases:
            context = browser.new_context(viewport={"width": 375, "height": 812})
            page = context.new_page()
            console_errors = []
            page.on("console", lambda m: console_errors.append(f"console.{m.type}: {m.text}") if m.type == "error" else None)
            page.on("pageerror", lambda e: console_errors.append(f"pageerror: {e}"))
            try:
                check(page, errors)
            except Exception as e:  # noqa: BLE001
                errors.append(f"Exception ({name}): {e}")
            finally:
                errors.extend(console_errors)
                context.close()
        browser.close()

    if errors:
        print("ERRORS:")
        for e in errors:
            print(f"  - {e}")
        sys.exit(1)
    print("ALL OK")


if __name__ == "__main__":
    main()
