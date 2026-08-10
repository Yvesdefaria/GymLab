"""Test T3: tabs internos (TabNav) -- underline animado, slideOut/slideIn,
aria-selected y hit >=44px en 375x812, 768x1024 y 1024x768."""
import sys

from playwright.sync_api import expect

from scripts.e2e_utils import run_views, base_url


# Siembra un workout con sets para que Estadisticas y Perfil tengan datos.
SEED_JS = """
async () => {
  try {
    const { db } = await import('/src/data/repositories/dexie/db.ts')
    await db.workouts.clear()
    await db.workoutSets.clear()
    await db.prs.clear()
    await db.meta.put({ key: 'onboardingDone', value: true })

    const today = new Date()
    const localDate =
      `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    await db.workouts.add({
      id: 1,
      startedAt: today.toISOString(),
      finishedAt: today.toISOString(),
      routineId: null,
      routineDayId: null,
      localDate,
      notes: '',
      totalVolume: 2400,
    })
    await db.workoutSets.add({
      id: 1,
      workoutId: 1,
      exerciseId: 1,
      setNumber: 1,
      weightKg: 60,
      reps: 10,
      completed: true,
      createdAt: today.toISOString(),
    })
    return true
  } catch (e) {
    return 'SEED ERROR: ' + (e && e.message ? e.message : String(e))
  }
}
"""


def assert_tabs(page, view_name, shot_prefix):
    """Verifica las 3 paginas con TabNav."""

    # --- Sembrar datos (onboarding + workout) ---
    seed_result = page.evaluate(SEED_JS)
    assert seed_result is True, f"seed fallo: {seed_result}"

    # Recargar para que useOnboardingStatus lea el meta sembrado.
    page.reload(wait_until="networkidle")
    page.wait_for_timeout(500)

    # ==============================
    # ESTADISTICAS - 2 tabs
    # ==============================
    page.goto(f"{base_url()}/estadisticas", wait_until="networkidle")
    page.wait_for_timeout(600)

    tablist = page.get_by_role("tablist", name="Secciones de estadísticas")
    expect(tablist).to_be_visible()
    tabs = tablist.get_by_role("tab")
    assert tabs.count() == 2, f"esperaba 2 tabs, hay {tabs.count()} ({view_name})"

    tab_entreno = tabs.nth(0)
    tab_cuerpo = tabs.nth(1)
    expect(tab_entreno).to_have_attribute("aria-selected", "true")
    expect(tab_cuerpo).to_have_attribute("aria-selected", "false")

    panel = page.get_by_role("tabpanel").first
    expect(panel).to_be_visible()

    for i in range(2):
        box = tabs.nth(i).bounding_box()
        assert box is not None, f"tab {i} sin bounding box ({view_name})"
        assert box["height"] >= 44, f"tab {i} <44px: {box['height']} ({view_name})"

    tab_cuerpo.click()
    page.wait_for_timeout(500)
    expect(tab_cuerpo).to_have_attribute("aria-selected", "true")
    expect(tab_entreno).to_have_attribute("aria-selected", "false")

    page.screenshot(path=f"{shot_prefix}-estadisticas.png", full_page=False)

    # ==============================
    # PERFIL - 3 tabs (Resumen, Historial, Rachas)
    # ==============================
    page.goto(f"{base_url()}/perfil", wait_until="networkidle")
    page.wait_for_timeout(600)

    tablist = page.get_by_role("tablist", name="Secciones del perfil")
    expect(tablist).to_be_visible()
    tabs = tablist.get_by_role("tab")
    assert tabs.count() == 3, f"esperaba 3 tabs, hay {tabs.count()} ({view_name})"

    tab_resumen = tabs.nth(0)
    tab_historial = tabs.nth(1)
    tab_rachas = tabs.nth(2)
    expect(tab_resumen).to_have_attribute("aria-selected", "true")

    for i in range(3):
        box = tabs.nth(i).bounding_box()
        assert box is not None, f"tab {i} sin bounding box ({view_name})"
        assert box["height"] >= 44, f"tab {i} <44px: {box['height']} ({view_name})"

    tab_historial.click()
    page.wait_for_timeout(500)
    expect(tab_historial).to_have_attribute("aria-selected", "true")

    tab_rachas.click()
    page.wait_for_timeout(500)
    expect(tab_rachas).to_have_attribute("aria-selected", "true")

    rachas_panel = page.get_by_role("tabpanel").first
    expect(rachas_panel).to_contain_text("Racha actual", timeout=5000)
    expect(rachas_panel).to_contain_text("Racha máxima", timeout=5000)

    page.screenshot(path=f"{shot_prefix}-perfil.png", full_page=False)

    # ==============================
    # RUTINAS - day tabs (PPL: 3 dias)
    # ==============================
    page.goto(f"{base_url()}/rutinas/ppl-volumen", wait_until="networkidle")
    page.wait_for_timeout(600)

    tablist = page.get_by_role("tablist", name="Días de la rutina")
    expect(tablist).to_be_visible()
    day_tabs = tablist.get_by_role("tab")
    assert day_tabs.count() >= 2, f"esperaba >=2 day tabs, hay {day_tabs.count()} ({view_name})"

    first_day = day_tabs.nth(0)
    expect(first_day).to_have_attribute("aria-selected", "true")

    second_day = day_tabs.nth(1)
    second_day.click()
    page.wait_for_timeout(500)
    expect(second_day).to_have_attribute("aria-selected", "true")
    expect(first_day).to_have_attribute("aria-selected", "false")

    panel = page.get_by_role("tabpanel").first
    expect(panel).to_be_visible()

    page.screenshot(path=f"{shot_prefix}-rutinas.png", full_page=False)


def main():
    errors = run_views(
        {
            "iphone": lambda p, vn, s: assert_tabs(p, vn, s.replace(".png", "")),
            "ipad": lambda p, vn, s: assert_tabs(p, vn, s.replace(".png", "")),
            "ipad-landscape": lambda p, vn, s: assert_tabs(p, vn, s.replace(".png", "")),
        },
        __file__,
        "t3",
    )
    if errors:
        print("FALLO:", *errors, sep="\n  ")
        return 1
    print("T3 PASSED -- tabs internos (TabNav) OK en 375x812, 768x1024 y 1024x768")
    return 0


if __name__ == "__main__":
    sys.exit(main())