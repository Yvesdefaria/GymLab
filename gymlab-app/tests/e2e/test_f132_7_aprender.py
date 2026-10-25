"""F132.7 — Aprender: biblioteca, ficha, guías, papers y calculadoras en Nocturno Minimal.

Parte 1 (T1): /ejercicios — índice editorial sin tarjetas, rail A–Z, búsqueda/filtros
intactos y ficha con media héroe + stat row + técnica.
Parte 2 (T2): /guias y /papers — guía destacada, índice numerado y filas hairline.
Parte 3 (T3): /calculadoras — hub de tiles + result hero en IMC y calorías.

Se corre en 375 (iPhone) y 768 (iPad): `python tests/e2e/scripts/with_server.py
tests/e2e/test_f132_7_aprender.py --port 5255`.
"""
import os
import re
import sys

sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import expect

from scripts.e2e_utils import run_views, base_url

# Onboarding hecho + idioma español: el default del producto es inglés.
SEED_JS = """async () => {
  const openDb = () => new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const db = await openDb();
  await new Promise((res, rej) => {
    const tx = db.transaction('meta', 'readwrite');
    const meta = tx.objectStore('meta');
    meta.put({ key: 'onboardingDone', value: 'true' });
    meta.put({ key: 'settings', value: JSON.stringify({ language: 'es', showSectionTips: false }) });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  return true;
}"""


def seed(page):
    result = page.evaluate(SEED_JS)
    assert result is True, f"seed fallo: {result}"
    page.reload(wait_until="domcontentloaded")


def assert_biblioteca(page):
    page.goto(f"{base_url()}/ejercicios", wait_until="domcontentloaded")
    page.wait_for_timeout(1600)

    body = page.inner_text("body")
    assert re.search(r"\d+\s+de\s+\d+\s+ejercicios", body), "falta el conteo «X de Y ejercicios»"

    rail = page.locator('[role="navigation"][aria-label="Índice alfabético"]')
    expect(rail).to_be_visible()
    expect(page.locator("div.sticky span[aria-hidden]").first).to_be_visible()

    # Índice editorial: la fila ya no es una tarjeta con panel.
    assert page.locator(".panel-flush").count() == 0, "quedan filas con panel-flush"
    first_link = page.locator("a[href^='/ejercicios/']").first
    expect(first_link).to_be_visible()
    href = first_link.get_attribute("href") or ""
    assert href.startswith("/ejercicios/"), f"fila sin enlace a ficha: {href}"

    # Favorito y «+» siguen siendo los controles de la fila.
    assert page.locator("button[aria-label*='favorito']").count() > 0, "sin botón de favorito"
    assert page.locator("button[aria-label^='Agregar ']").count() > 0, "sin botón de añadir"

    # La ficha: media héroe, stat row y técnica numerada.
    page.goto(f"{base_url()}{href}", wait_until="domcontentloaded")
    page.wait_for_timeout(1400)
    expect(page.locator('[data-testid="exercise-media"]')).to_be_visible()
    expect(page.locator('[data-testid="exercise-stats"]')).to_be_visible()
    expect(page.get_by_role("heading", name="Técnica", exact=True)).to_be_visible()
    expect(page.get_by_role("button", name="Añadir a rutina", exact=True)).to_be_visible()
    assert page.locator(".panel-light").count() == 0, "quedan contenedores panel-light en la ficha"
    assert page.locator(".panel-flush").count() == 0, "quedan contenedores panel-flush en la ficha"


def assert_aprender(page, view_name, shot):
    seed(page)
    assert_biblioteca(page)
    page.screenshot(path=shot, full_page=False)


errors = run_views({"iphone": assert_aprender, "ipad": assert_aprender}, __file__, "f132-7")
if errors:
    print("FALLO:", *errors, sep="\n  ")
    sys.exit(1)
print("OK: F132.7 biblioteca + ficha")
