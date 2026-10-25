"""F132.4 — Actividad: logros, objetivos y wearables en Nocturno Minimal.

Parte 1 (T1): /logros — vitrina de 2 columnas, filtros y sheet de detalle,
sin perder los contratos de F95.3 (data-progress por logro + etiqueta) ni la
medalla metálica de F93 #16.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import expect

from scripts.e2e_utils import run_views, base_url

# Siembra mínima: idioma es, onboarding hecho, un logro bronce desbloqueado ×3
# con su set de sustento (para que la reconciliación no lo re-bloquee) y una
# variante radiant ya concedida. Sin fila en `workouts` para no desbloquear
# `inaugural` y mantener el contador en 1/36.
SEED_JS = """async () => {
  const openDb = () => new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const db = await openDb();
  await new Promise((res, rej) => {
    const tx = db.transaction(['meta', 'workoutSets'], 'readwrite');
    const meta = tx.objectStore('meta');
    meta.put({ key: 'onboardingDone', value: 'true' });
    meta.put({ key: 'settings', value: JSON.stringify({ language: 'es', showSectionTips: false }) });
    meta.put({ key: 'unlockedAchievements', value: JSON.stringify(['primer-paso']) });
    meta.put({ key: 'achievementCounts', value: JSON.stringify({ 'primer-paso': 3 }) });
    meta.put({ key: 'achievementSnapshot', value: JSON.stringify(['primer-paso']) });
    meta.put({ key: 'collectibles', value: JSON.stringify([
      { achievementId: 'primer-paso', variantId: 'radiant' },
    ]) });
    tx.objectStore('workoutSets').put({
      id: 9101,
      workoutId: 9001,
      exerciseId: 999,
      setNumber: 1,
      weightKg: 60,
      reps: 8,
      completed: true,
      createdAt: new Date().toISOString(),
    });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  return true;
}"""


def seed(page):
    page.goto(base_url(), wait_until="networkidle")
    page.wait_for_timeout(600)
    result = page.evaluate(SEED_JS)
    assert result is True, f"seed fallo: {result}"
    page.reload(wait_until="networkidle")
    page.wait_for_timeout(900)


def assert_logros(page, view_name, shot):
    seed(page)
    page.goto(f"{base_url()}/logros", wait_until="networkidle")
    page.wait_for_timeout(700)

    body = page.inner_text("body")
    assert "1/36" in body, f"[{view_name}] contador 1/36 no visible"
    assert "×3" in body, f"[{view_name}] contador ×3 no visible"
    assert "pendientes" in body.lower(), f"[{view_name}] resumen de pendientes ausente"

    general = page.locator('[data-progress="general"]').first
    assert general.get_attribute("aria-valuenow") == "1", f"[{view_name}] general aria-valuenow"
    assert general.get_attribute("aria-valuemax") == "36", f"[{view_name}] general aria-valuemax"
    assert general.get_attribute("role") == "progressbar", f"[{view_name}] general sin role"

    assert page.locator('[data-progress="primer-paso"]').count() == 1, f"[{view_name}] barra de primer-paso"
    assert page.locator('[data-progress="sesiones-50"]').count() == 1, f"[{view_name}] barra de sesiones-50"
    assert "0 de 50" in body, f"[{view_name}] etiqueta «0 de 50» no visible"

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
    assert page.locator('[data-progress="primer-paso"]').count() == 1, f"[{view_name}] barra duplicada en el sheet"

    page.keyboard.press("Escape")
    expect(page.locator('[role="dialog"]')).to_have_count(0)

    page.screenshot(path=shot, full_page=False)


errors = run_views({"iphone": assert_logros, "ipad": assert_logros}, __file__, "f132-4")
if errors:
    print("FALLO:", *errors, sep="\n  ")
    sys.exit(1)
print("OK: F132.4 logros")
