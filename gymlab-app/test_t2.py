"""Test T2: sistema de logros — modal centrado con confeti/pulse, botón
«¡Genial!» en thumb-zone, persistencia (se muestra una vez) y accesibilidad
del diálogo en 375x812 y 768x1024."""
import sys

from playwright.sync_api import expect

from scripts.e2e_utils import run_views, base_url


SEED_JS = """
async () => {
  try {
    const { db } = await import('/src/data/repositories/dexie/db.ts')
  // Estado limpio y determinista para cada viewport.
  await db.workouts.clear()
  await db.workoutSets.clear()
  await db.prs.clear()
  await db.meta.delete('unlockedAchievements')

  // 7 sesiones consecutivas (hoy y 6 días atrás) → logros de racha 7 días,
  // primera sesión y primer paso; cada una con una serie completada.
  const today = new Date()
  for (let i = 0; i < 7; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - (6 - i))
    const localDate =
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-` +
      `${String(d.getDate()).padStart(2, '0')}`
    const id = await db.workouts.add({
      id: i + 1,
      startedAt: d.toISOString(),
      finishedAt: d.toISOString(),
      routineId: null,
      routineDayId: null,
      localDate,
      notes: '',
      totalVolume: 1200,
    })
    await db.workoutSets.add({
      id: i + 1,
      workoutId: id,
      exerciseId: 1,
      setNumber: 1,
      weightKg: 40,
      reps: 10,
      completed: true,
      createdAt: d.toISOString(),
    })
  }
  // Un PR → logro «Primera marca».
    await db.prs.add({
      exerciseId: 2,
      weightKg: 100,
      reps: 5,
      date: today.toISOString(),
      estimated1RM: 112,
    })
    return true
  } catch (e) {
    return 'SEED ERROR: ' + (e && e.message ? e.message : String(e))
  }
}
"""


def assert_achievements(page, view_name, shot):
    page.wait_for_timeout(400)

    close_btn = page.get_by_role("button", name="Ya entreno aquí")
    if close_btn.count():
        close_btn.first.click()
        page.wait_for_timeout(300)

    # Siembra datos de logros; el host reactivo detecta el cambio y abre el modal.
    seed_result = page.evaluate(SEED_JS)
    assert seed_result is True, f"seed falló: {seed_result}"

    # 1. Modal de logro: diálogo accesible y visible (debounce de evaluación).
    dialog = page.get_by_role("dialog", name="¡Logro desbloqueado!")
    expect(dialog).to_be_visible(timeout=6000)
    expect(dialog).to_have_attribute("aria-modal", "true")
    assert "¡Logro desbloqueado!" in dialog.inner_text()

    # 2. Contenido: logros esperados tras sembrar 7 sesiones + PR.
    text = dialog.inner_text()
    for expected in ["Primer paso", "Inaugural", "Racha de 7 días", "Primera marca"]:
        assert expected in text, f"falta logro: {expected}"

    # 3. Botón «¡Genial!» dentro de la thumb-zone (≥44px, dentro del viewport).
    ok_btn = dialog.get_by_role("button", name="¡Genial!")
    expect(ok_btn).to_be_visible()
    box = ok_btn.bounding_box()
    assert box is not None, "botón sin bounding box"
    assert box["height"] >= 44, f"botón <44px en {view_name}: {box['height']}"

    # 4. Modal centrado y dentro del viewport (usable en mobile y tablet).
    db = dialog.bounding_box()
    vp = page.viewport_size
    assert db["width"] <= vp["width"], "modal más ancho que el viewport"
    assert db["x"] >= 0 and db["x"] + db["width"] <= vp["width"]

    page.screenshot(path=shot, full_page=False)

    # 5. Cerrar con «¡Genial!» oculta el modal.
    ok_btn.click()
    expect(dialog).to_be_hidden()

    # 6. Persistencia: IDs guardados en meta → tras recargar NO reaparece.
    ids = page.evaluate(
        """async () => {
          const { db } = await import('/src/data/repositories/dexie/db.ts')
          const row = await db.meta.get('unlockedAchievements')
          return row ? row.value : null
        }"""
    )
    assert ids is not None, "meta.unlockedAchievements no persistido"
    for ach in ["primer-paso", "inaugural", "racha-7", "primera-marca"]:
        assert ach in ids, f"falta id en meta: {ach}"

    page.reload(wait_until="networkidle")
    page.wait_for_timeout(800)
    assert page.get_by_role("dialog", name="¡Logro desbloqueado!").count() == 0, (
        f"modal reapareció tras recargar ({view_name})"
    )


def main():
    errors = run_views({"iphone": assert_achievements, "ipad": assert_achievements}, __file__, "t2")
    if errors:
        print("FALLO:", *errors, sep="\n  ")
        return 1
    print("T2 PASSED — logros (modal, confeti, persistencia) OK en 375x812 y 768x1024")
    return 0


if __name__ == "__main__":
    sys.exit(main())
