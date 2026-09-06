"""Test F59: proyecciones de objetivos (F59) -- la tarjeta en Home y /objetivos
muestra una fila por objetivo con fecha estimada y tasa; estado «alcanzado»;
y sin datos en los últimos 28 días no muestra fila de proyección."""

import sys, os
from datetime import date, timedelta

sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import expect

from scripts.e2e_utils import run_views, base_url

# Ejercicio 1 del catálogo: 'Press de pecho con barra'. Serie 100 kg x 5 → e1rm 112.5.
EXERCISE_NAME = "Press de pecho con barra"

# Nombres cortos de mes en es-ES (Intl.DateTimeFormat {day, month:'short', year}).
ES_MONTHS_SHORT = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]


def es_short_date(d):
    return f"{d.day} {ES_MONTHS_SHORT[d.month - 1]} {d.year}"


def seed_js(recent_days, weight_kg, reps, target):
    """Siembra un workout hoy + una serie (opcional) + un objetivo e1rm en localStorage.

    recent_days: int = serie hace N días; None = sin serie reciente.
    """
    sets_js = ""
    if recent_days is not None:
        sets_js = f"""
          const d = new Date(); d.setDate(d.getDate() - {recent_days});
          await db.workoutSets.add({{
            id: 1, workoutId: 1, exerciseId: 1, setNumber: 1,
            weightKg: {weight_kg}, reps: {reps}, completed: true,
            createdAt: d.toISOString(),
          }})
        """
    return f"""
async () => {{
  try {{
    const {{ db }} = await import('/src/data/repositories/dexie/db.ts')
    await db.workouts.clear()
    await db.workoutSets.clear()
    await db.prs.clear()
    await db.meta.put({{ key: 'onboardingDone', value: true }})
    await db.workouts.add({{
      id: 1,
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      routineId: null, routineDayId: null,
      localDate: new Date().toISOString().slice(0, 10),
      notes: '', totalVolume: 0,
    }})
    {sets_js}
    localStorage.setItem('gymlab-goals', JSON.stringify({{ state: {{ goals: {{ '1': {target} }} }}, version: 0 }}))
    return true
  }} catch (e) {{
    return 'SEED ERROR: ' + (e && e.message ? e.message : String(e))
  }}
}}
"""


def reload_seeded(page, js):
    result = page.evaluate(js)
    assert result is True, f"seed fallo: {result}"
    page.reload(wait_until="networkidle")
    page.wait_for_timeout(500)


def assert_proyeccion(page, view_name, shot_prefix):
    # screenshot_path ya añade ".png"; reutilizamos la base sin extensión.
    base_shot = shot_prefix[:-4]
    # --- Escenario A: serie reciente + objetivo alto → fecha estimada y tasa ---
    reload_seeded(page, seed_js(recent_days=1, weight_kg=100, reps=5, target=150))

    page.goto(f"{base_url()}/", wait_until="networkidle")
    page.wait_for_timeout(500)

    expected_date = (date.today() + timedelta(days=75 * 7)).isoformat()
    expect(page.get_by_text(EXERCISE_NAME, exact=True).first).to_be_visible()
    expect(page.get_by_text("112,5 → 150 kg", exact=True)).to_be_visible()
    expect(page.get_by_text(f"~75 semanas · {es_short_date(date.fromisoformat(expected_date))}", exact=True)).to_be_visible()
    expect(page.get_by_text("+0,5 kg/semana", exact=True)).to_be_visible()

    page.screenshot(path=f"{base_shot}-proyeccion.png", full_page=False)

    # El GoalSetter en /objetivos muestra el objetivo guardado y la misma tarjeta.
    page.goto(f"{base_url()}/objetivos", wait_until="networkidle")
    page.wait_for_timeout(500)
    expect(page.get_by_text("150 kg e1RM", exact=True)).to_be_visible()
    expect(page.get_by_text("112,5 → 150 kg", exact=True)).to_be_visible()

    # --- Escenario B: e1rm actual ya supera el objetivo → alcanzado ---
    reload_seeded(page, seed_js(recent_days=1, weight_kg=200, reps=1, target=150))

    page.goto(f"{base_url()}/", wait_until="networkidle")
    page.wait_for_timeout(500)
    expect(page.get_by_text("¡Objetivo alcanzado! 150 kg", exact=True)).to_be_visible()

    page.screenshot(path=f"{base_shot}-alcanzado.png", full_page=False)

    # --- Escenario C: solo datos antiguos (fuera de 28 días) → sin fila de proyección ---
    reload_seeded(page, seed_js(recent_days=60, weight_kg=100, reps=5, target=150))

    page.goto(f"{base_url()}/", wait_until="networkidle")
    page.wait_for_timeout(500)
    # La tarjeta existe (objetivo configurado) pero la serie vieja no genera fila.
    expect(page.get_by_text("Gestionar objetivos", exact=True)).to_be_visible()
    assert page.get_by_text("112,5 → 150 kg", exact=True).count() == 0, (
        "no debería mostrar proyección sin datos de los últimos 28 días"
    )

    page.screenshot(path=f"{base_shot}-sin-datos.png", full_page=False)


errors = run_views({"iphone": assert_proyeccion}, __file__, "f59")
if errors:
    print("FALLO:", *errors, sep="\n  ")
    sys.exit(1)
print("OK: F59 proyecciones de objetivos")
