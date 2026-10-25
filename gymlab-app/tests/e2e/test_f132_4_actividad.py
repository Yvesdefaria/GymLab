"""F132.4 — Actividad: logros, objetivos y wearables en Nocturno Minimal.

Parte 1 (T1): /logros — vitrina de 2 columnas, filtros y sheet de detalle,
sin perder los contratos de F95.3 (data-progress por logro + etiqueta) ni la
medalla metálica de F93 #16.
Parte 2 (T2): /objetivos — héroe «próximo hito», alta/edición/borrado en sheet
y estados honestos sin proyección.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import expect

from scripts.e2e_utils import run_views, base_url

EXERCISE_ID = 999
EXERCISE_NAME = "Sentadilla E2E"

# Siembra mínima: idioma es, onboarding hecho, un logro bronce desbloqueado ×3
# con su set de sustento (para que la reconciliación no lo re-bloquee), una
# variante radiant ya concedida y un ejercicio propio con una serie reciente
# (100 kg × 5 → e1RM 112,5) para el flujo de objetivos.
SEED_JS = """async () => {
  const openDb = () => new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const db = await openDb();
  await new Promise((res, rej) => {
    const tx = db.transaction(['meta', 'workoutSets', 'exercises'], 'readwrite');
    const meta = tx.objectStore('meta');
    meta.put({ key: 'onboardingDone', value: 'true' });
    meta.put({ key: 'settings', value: JSON.stringify({ language: 'es', showSectionTips: false }) });
    meta.put({ key: 'unlockedAchievements', value: JSON.stringify(['primer-paso']) });
    meta.put({ key: 'achievementCounts', value: JSON.stringify({ 'primer-paso': 3 }) });
    meta.put({ key: 'achievementSnapshot', value: JSON.stringify(['primer-paso']) });
    meta.put({ key: 'collectibles', value: JSON.stringify([
      { achievementId: 'primer-paso', variantId: 'radiant' },
    ]) });
    tx.objectStore('exercises').put({
      id: 999, slug: 'sentadilla-e2e', name: 'Sentadilla E2E',
      muscleGroup: 'pierna', equipment: ['barra'], instructions: '', category: 'strength',
    });
    const d = new Date(); d.setDate(d.getDate() - 1);
    tx.objectStore('workoutSets').put({
      id: 9101, workoutId: 9001, exerciseId: 999, setNumber: 1,
      weightKg: 100, reps: 5, completed: true, createdAt: d.toISOString(),
    });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  return true;
}"""

# Escenario sin datos recientes: misma serie pero de hace 60 días + objetivo
# en localStorage (el store de zustand persiste con esa forma).
OLD_SEED_JS = """async () => {
  const { db } = await import('/src/data/repositories/dexie/db.ts')
  await db.workoutSets.clear()
  await db.workouts.clear()
  const d = new Date(); d.setDate(d.getDate() - 60)
  await db.workoutSets.add({
    id: 9201, workoutId: 9200, exerciseId: 999, setNumber: 1,
    weightKg: 100, reps: 5, completed: true, createdAt: d.toISOString(),
  })
  localStorage.setItem('gymlab-goals', JSON.stringify({ state: { goals: { '999': 150 } }, version: 0 }))
  return true
}"""


def seed(page):
    page.goto(base_url(), wait_until="networkidle")
    page.wait_for_timeout(600)
    result = page.evaluate(SEED_JS)
    assert result is True, f"seed fallo: {result}"
    page.reload(wait_until="networkidle")
    page.wait_for_timeout(900)


def assert_logros(page):
    page.goto(f"{base_url()}/logros", wait_until="networkidle")
    page.wait_for_timeout(700)

    body = page.inner_text("body")
    assert "1/36" in body, "contador 1/36 no visible"
    assert "×3" in body, "contador ×3 no visible"
    assert "35 pendientes" in body, "resumen de pendientes ausente o con plural roto"

    general = page.locator('[data-progress="general"]').first
    assert general.get_attribute("aria-valuenow") == "1", "general aria-valuenow"
    assert general.get_attribute("aria-valuemax") == "36", "general aria-valuemax"
    assert general.get_attribute("role") == "progressbar", "general sin role"

    assert page.locator('[data-progress="primer-paso"]').count() == 1, "barra de primer-paso"
    assert page.locator('[data-progress="sesiones-50"]').count() == 1, "barra de sesiones-50"
    assert "0 de 50" in body, "etiqueta «0 de 50» no visible"

    # Filtros: Todos → Pendientes → Desbloqueados → Todos.
    page.get_by_role("button", name="Pendientes", exact=True).click()
    expect(page.locator('[data-achievement="primer-paso"]')).to_have_count(0)
    expect(page.locator('[data-achievement="sesiones-500"]')).to_have_count(1)

    page.get_by_role("button", name="Desbloqueados", exact=True).click()
    expect(page.locator('[data-achievement="primer-paso"]')).to_have_count(1)
    expect(page.locator('[data-achievement="sesiones-500"]')).to_have_count(0)

    page.get_by_role("button", name="Todos", exact=True).click()
    expect(page.locator('[data-achievement="primer-paso"]')).to_have_count(1)
    expect(page.locator('[data-achievement="sesiones-500"]')).to_have_count(1)

    # Detalle: sheet de lectura con descripción, condición y variante.
    # El botón estirado es el control accesible de la tarjeta.
    page.get_by_role("button", name="Primer paso", exact=True).click()
    dialog = page.locator('[role="dialog"]').first
    expect(dialog).to_be_visible()
    expect(dialog).to_contain_text("Completaste tu primera serie")
    expect(dialog).to_contain_text("Condición")
    expect(dialog).to_contain_text("Radiante")
    # La barra del tile sigue siendo la única con data-progress (sin duplicar).
    assert page.locator('[data-progress="primer-paso"]').count() == 1, "barra duplicada en el sheet"

    page.keyboard.press("Escape")
    expect(page.locator('[role="dialog"]')).to_have_count(0)


def assert_objetivos(page):
    page.goto(f"{base_url()}/objetivos", wait_until="networkidle")
    page.wait_for_timeout(500)

    # Sin objetivos: héroe vacío honesto.
    expect(page.get_by_text("Sin objetivos todavía", exact=True)).to_be_visible()

    # Alta desde el «+» del header: picker → ejercicio → target → guardar.
    page.get_by_role("button", name="Agregar objetivo", exact=True).first.click()
    sheet = page.locator('[role="dialog"]').first
    expect(sheet).to_be_visible()
    sheet.get_by_role("button", name="Selecciona ejercicio", exact=True).click()
    page.get_by_label("Buscar ejercicio").fill(EXERCISE_NAME)
    page.locator(f'button[aria-label="Agregar {EXERCISE_NAME}"]').first.click()
    page.get_by_label("e1RM objetivo (kg)").fill("150")
    page.get_by_role("button", name="Guardar", exact=True).click()

    # Héroe «próximo hito» con los textos exactos de siempre.
    expect(page.get_by_text(EXERCISE_NAME, exact=True).first).to_be_visible()
    expect(page.get_by_text("150 kg e1RM", exact=True).first).to_be_visible()
    expect(page.get_by_text("112,5 → 150 kg", exact=True).first).to_be_visible()
    expect(page.get_by_text("+0,5 kg/semana", exact=True).first).to_be_visible()
    expect(page.get_by_text("~75 semanas", exact=False).first).to_be_visible()

    # Edición desde la fila.
    page.get_by_role("button", name=f"Editar objetivo de {EXERCISE_NAME}", exact=True).click()
    page.get_by_label("e1RM objetivo (kg)").fill("140")
    page.get_by_role("button", name="Guardar", exact=True).click()
    expect(page.get_by_text("140 kg e1RM", exact=True).first).to_be_visible()

    # Borrado con confirmación → vuelve al estado vacío.
    page.get_by_role("button", name=f"Editar objetivo de {EXERCISE_NAME}", exact=True).click()
    page.get_by_role("button", name="Eliminar objetivo", exact=True).click()
    page.get_by_role("button", name="Aceptar", exact=True).click()
    expect(page.get_by_text("Sin objetivos todavía", exact=True)).to_be_visible()

    # Sin datos recientes: fila visible, sin fecha inventada y héroe honesto.
    assert page.evaluate(OLD_SEED_JS) is True
    page.reload(wait_until="networkidle")
    page.goto(f"{base_url()}/objetivos", wait_until="networkidle")
    page.wait_for_timeout(500)
    expect(page.get_by_text(EXERCISE_NAME, exact=True).first).to_be_visible()
    expect(page.get_by_text("Sin datos recientes", exact=True)).to_be_visible()
    expect(page.get_by_text("Sin proyección todavía", exact=True)).to_be_visible()
    assert page.get_by_text("112,5 → 150 kg", exact=True).count() == 0


def assert_actividad(page, view_name, shot):
    seed(page)
    assert_logros(page)
    assert_objetivos(page)
    page.screenshot(path=shot, full_page=False)


errors = run_views({"iphone": assert_actividad, "ipad": assert_actividad}, __file__, "f132-4")
if errors:
    print("FALLO:", *errors, sep="\n  ")
    sys.exit(1)
print("OK: F132.4 logros + objetivos")


