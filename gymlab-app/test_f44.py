"""Test Fase 44 (A7): el onboarding escribe los datos utiles al terminar y no escribe nada al saltar.

Dos flujos por viewport (iPhone 375x812 + iPad 768x1024):
1. Completo en libras: al finalizar, `meta` tiene heightCm/bodySex/birthDate/onboardingDone,
   `bodyWeight` el peso de hoy en kg (165 lb -> ~74.84), `profile.weeklyGoal = 3`, hay programa
   activo y el home muestra "Empezar hoy".
2. Skip ("Ya entreno aqui"): no escribe heightCm/bodySex/birthDate/bodyWeight/activeProgram
   y el home queda en "Sin plan hoy" con CTA a rutinas.
"""
import datetime
import json
import sys

from playwright.sync_api import expect

from scripts.e2e_utils import run_views, base_url

READ_DB_JS = """
async (tables) => {
  const r = indexedDB.open('GymLabDB');
  const db = await new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  const out = {};
  for (const t of tables) {
    out[t] = await new Promise((res, rej) => {
      const q = db.transaction(t, 'readonly').objectStore(t).getAll();
      q.onsuccess = () => res(q.result);
      q.onerror = () => rej(q.error);
    });
  }
  return out;
}
"""


def complete_onboarding(page):
    # Paso 1 — Idioma.
    page.get_by_role("button", name="Español").click()
    page.get_by_role("button", name="Continuar").click()
    page.wait_for_timeout(300)
    # Paso 2 — Objetivo.
    page.get_by_role("button", name="Fuerza").click()
    page.get_by_role("button", name="Continuar").click()
    page.wait_for_timeout(300)
    # Paso 3 — Semana (3 dias, gimnasio; duracion/cardio quedan en su default).
    page.get_by_role("button", name="3", exact=True).first.click()
    page.get_by_role("button", name="Gimnasio").click()
    page.get_by_role("button", name="Continuar").click()
    page.wait_for_timeout(300)
    # Paso 4 — Perfil en libras (A5): 165 lb -> 74.84 kg.
    page.get_by_role("button", name="Libras (lb)").click()
    page.get_by_role("button", name="Hombre").click()
    page.get_by_label("Fecha de nacimiento").fill("1996-01-15")
    page.get_by_label("Altura en centímetros").fill("175")
    page.get_by_label("Peso en lb").fill("165")
    page.get_by_role("button", name="Continuar").click()
    page.wait_for_timeout(300)
    # Paso 5 — Resumen: acepta terminos y arranca con la rutina sugerida.
    page.get_by_role("checkbox").check()
    start = page.get_by_role("button", name="Empezar D1")
    expect(start).to_be_enabled()
    start.click()
    page.wait_for_url(f"{base_url()}/")
    page.wait_for_timeout(600)


def skip_onboarding(page):
    page.get_by_role("button", name="Ya entreno aquí").first.click()
    page.wait_for_url(f"{base_url()}/")
    page.wait_for_timeout(600)


def read_db(page, tables):
    return page.evaluate(READ_DB_JS, tables)


def assert_complete(page):
    page.goto(base_url(), wait_until="networkidle")
    complete_onboarding(page)

    data = read_db(page, ["meta", "bodyWeight", "profile", "activeProgram"])
    meta = {m["key"]: m["value"] for m in data["meta"]}
    assert meta.get("heightCm") == "175", f"heightCm inesperado: {meta.get('heightCm')}"
    assert json.loads(meta["bodySex"]) == "male", f"bodySex inesperado: {meta.get('bodySex')}"
    assert json.loads(meta["birthDate"]) == "1996-01-15", f"birthDate inesperado: {meta.get('birthDate')}"
    assert json.loads(meta["onboardingDone"]) is True
    assert len(data["bodyWeight"]) == 1, "deberia haber exactamente un registro de peso de hoy"
    bw = data["bodyWeight"][0]
    assert abs(bw["weightKg"] - (165 / 2.20462)) < 0.01, f"peso en kg inesperado: {bw['weightKg']}"
    assert bw["localDate"] == datetime.date.today().isoformat()
    assert len(data["profile"]) == 1 and data["profile"][0]["weeklyGoal"] == 3
    assert len(data["activeProgram"]) == 1 and data["activeProgram"][0]["routineId"], "falta programa activo"

    # Home con el dia programado y sin onboarding visible.
    expect(page.get_by_role("button", name="Empezar hoy")).to_be_visible()


def assert_skip(page):
    skip_onboarding(page)

    data = read_db(page, ["meta", "bodyWeight", "activeProgram"])
    meta = {m["key"]: m["value"] for m in data["meta"]}
    for key in ("heightCm", "bodySex", "birthDate"):
        assert key not in meta, f"skip no deberia escribir {key}"
    assert json.loads(meta["onboardingDone"]) is True
    assert data["bodyWeight"] == [], "skip no deberia crear registros de peso"
    assert data["activeProgram"] == [], "skip no deberia fijar programa activo"

    # Home en estado vacio (sin plan) con CTA a rutinas.
    expect(page.get_by_text("Sin plan hoy", exact=True)).to_be_visible()


def assert_both(page, view_name, shot):
    stem = shot.rsplit(".", 1)[0]
    assert_complete(page)
    page.screenshot(path=f"{stem}-completo.png", full_page=False)
    # Contexto limpio para el flujo de skip (IndexedDB fresca).
    ctx2 = page.context.browser.new_context(viewport=page.viewport_size)
    try:
        page2 = ctx2.new_page()
        page2.goto(base_url(), wait_until="networkidle")
        assert_skip(page2)
        page2.screenshot(path=f"{stem}-skip.png", full_page=False)
    finally:
        ctx2.close()


def main():
    errors = run_views({"iphone": assert_both, "ipad": assert_both}, __file__, "f44")
    if errors:
        print("FALLO:", *errors, sep="\n  ")
        return 1
    print("F44 PASSED — onboarding escribe datos utiles (completo) y nada (skip) en 375x812 y 768x1024")
    return 0


if __name__ == "__main__":
    sys.exit(main())
