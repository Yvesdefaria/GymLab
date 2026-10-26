"""F132.7 — Aprender: biblioteca, ficha, guías, papers y calculadoras en Nocturno Minimal.

Parte 1 (T1): /ejercicios — índice editorial sin tarjetas, rail A–Z, búsqueda/filtros
intactos, ficha con media héroe + stat row + técnica y alta a rutina.
Parte 2 (T2): /guias y /papers — guía destacada, índice numerado, artículos y papers
hairline con fuente oficial.
Parte 3 (T3): /calculadoras — hub de tiles y result hero en IMC, calorías, 1RM, agua,
conversor, Navy, medidas y grasa.

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
    page.wait_for_timeout(2500)

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
    page.wait_for_timeout(1800)
    expect(page.locator('[data-testid="exercise-media"]')).to_be_visible()
    expect(page.locator('[data-testid="exercise-stats"]')).to_be_visible()
    expect(page.get_by_role("heading", name="Técnica", exact=True)).to_be_visible()
    expect(page.get_by_role("button", name="Añadir a rutina", exact=True)).to_be_visible()
    assert page.locator(".panel-light").count() == 0, "quedan contenedores panel-light en la ficha"
    assert page.locator(".panel-flush").count() == 0, "quedan contenedores panel-flush en la ficha"

    # Alta a rutina desde la ficha: sheet de destino → rutina → día → undo.
    page.get_by_role("button", name="Añadir a rutina", exact=True).click()
    dialog = page.locator('[role="dialog"]').first
    expect(dialog).to_contain_text("Elegir destino")
    dialog.locator("div.max-h-\\[50vh\\] button").first.click()
    page.wait_for_timeout(400)
    dialog.locator("div.max-h-\\[50vh\\] button").first.click()
    page.wait_for_timeout(600)
    expect(page.locator('[role="dialog"]')).to_have_count(0)
    expect(page.get_by_text("Añadido:", exact=False).first).to_be_visible()
    page.get_by_role("button", name="Deshacer", exact=True).first.click()


def assert_guias(page):
    page.goto(f"{base_url()}/guias", wait_until="domcontentloaded")
    page.wait_for_timeout(1600)

    body = page.inner_text("body")
    assert "destacada" in body.lower(), "falta la guía destacada"
    assert page.locator("a[href^='/guias/']").count() >= 30, "faltan guías en el índice"
    assert page.locator(".panel-light").count() == 0, "quedan panel-light en /guias"

    # La destacada abre el detalle editorial.
    page.locator("a[href^='/guias/']").first.click()
    page.wait_for_timeout(1200)
    expect(page.get_by_role("heading", name="Ideas clave", exact=True)).to_be_visible()
    assert page.locator("article h2").count() >= 2, "faltan secciones en el detalle de guía"
    assert page.locator(".panel-light").count() == 0, "quedan panel-light en el detalle de guía"
    assert page.locator(".panel-flush").count() == 0, "quedan panel-flush en el detalle de guía"


def assert_papers(page):
    page.goto(f"{base_url()}/papers", wait_until="domcontentloaded")
    page.wait_for_timeout(1200)

    expect(page.get_by_role("button", name="Todos los papers", exact=True)).to_be_visible()
    assert page.locator("a[href^='/papers/']").count() >= 4, "faltan papers en el índice"
    assert page.locator(".panel-light").count() == 0, "quedan panel-light en /papers"

    page.locator("a[href^='/papers/']").first.click()
    page.wait_for_timeout(1000)
    expect(page.get_by_role("heading", name="Resumen", exact=True)).to_be_visible()
    expect(page.get_by_role("heading", name="Puntos clave", exact=True)).to_be_visible()
    expect(page.get_by_role("link", name="Ver fuente oficial", exact=True)).to_be_visible()
    assert page.locator(".panel-light").count() == 0, "quedan panel-light en el detalle de paper"


def assert_calculadoras(page):
    page.goto(f"{base_url()}/calculadoras", wait_until="domcontentloaded")
    page.wait_for_timeout(1200)

    assert page.locator(".panel-light").count() == 0, "quedan panel-light en el hub"
    assert page.locator("a[href^='/calculadoras/']").count() >= 8, "faltan calculadoras en el hub"
    expect(page.get_by_text("Calculadoras", exact=True).first).to_be_visible()

    page.goto(f"{base_url()}/calculadoras/imc", wait_until="domcontentloaded")
    page.wait_for_timeout(900)
    page.fill('input[placeholder="70"]', "80")
    page.fill('input[placeholder="175"]', "175")
    page.wait_for_timeout(400)
    body = page.inner_text("body")
    assert "26" in body and "Sobrepeso" in body, "IMC no calcula o no muestra categoría"
    assert page.locator(".panel-light").count() == 0, "quedan panel-light en IMC"

    page.goto(f"{base_url()}/calculadoras/calorias", wait_until="domcontentloaded")
    page.wait_for_timeout(900)
    page.fill('input[placeholder="25"]', "25")
    page.fill('input[placeholder="70"]', "70")
    page.fill('input[placeholder="175"]', "175")
    page.wait_for_timeout(400)
    assert "kcal" in page.inner_text("body").lower(), "calorías no muestra kcal"
    assert page.locator(".panel-light").count() == 0, "quedan panel-light en calorías"

    page.goto(f"{base_url()}/calculadoras/1rm", wait_until="domcontentloaded")
    page.wait_for_timeout(900)
    page.fill('input[placeholder="80"]', "80")
    page.fill('input[placeholder="5"]', "5")
    page.wait_for_timeout(400)
    assert "kg" in page.inner_text("body"), "1RM no muestra kg"
    assert page.locator(".panel-light").count() == 0, "quedan panel-light en 1RM"

    page.goto(f"{base_url()}/calculadoras/agua", wait_until="domcontentloaded")
    page.wait_for_timeout(900)
    page.fill('input[placeholder="70"]', "80")
    page.fill('input[placeholder="30"]', "30")
    page.wait_for_timeout(400)
    assert "2,9" in page.inner_text("body"), "agua no calcula 2,9 L"
    assert page.locator(".panel-light").count() == 0, "quedan panel-light en agua"

    page.goto(f"{base_url()}/calculadoras/conversor", wait_until="domcontentloaded")
    page.wait_for_timeout(900)
    page.fill('input[placeholder="100"]', "100")
    page.wait_for_timeout(400)
    assert "220" in page.inner_text("body"), "conversor no muestra 220 lb"
    assert page.locator(".panel-light").count() == 0, "quedan panel-light en conversor"

    page.goto(f"{base_url()}/calculadoras/navy", wait_until="domcontentloaded")
    page.wait_for_timeout(900)
    page.fill('input[placeholder="175"]', "175")
    page.fill('input[placeholder="38"]', "38")
    page.fill('input[placeholder="80"]', "80")
    page.fill('input[placeholder="75"]', "75")
    page.get_by_role("button", name="Calcular", exact=True).click()
    page.wait_for_timeout(400)
    assert "%" in page.inner_text("body"), "Navy no muestra porcentaje"
    assert page.locator(".panel-light").count() == 0, "quedan panel-light en Navy"

    for route in ("medidas", "grasa"):
        page.goto(f"{base_url()}/calculadoras/{route}", wait_until="domcontentloaded")
        page.wait_for_timeout(1000)
        body = page.inner_text("body")
        assert "Opcional" in body and "Mínimo" in body, f"{route}: faltan badges mín/opcional"
        assert page.locator(".panel-light").count() == 0, f"quedan panel-light en {route}"


def assert_aprender(page, view_name, shot):
    seed(page)
    assert_biblioteca(page)
    assert_guias(page)
    assert_papers(page)
    assert_calculadoras(page)
    page.screenshot(path=shot, full_page=False)


errors = run_views({"iphone": assert_aprender, "ipad": assert_aprender}, __file__, "f132-7")
if errors:
    print("FALLO:", *errors, sep="\n  ")
    sys.exit(1)
print("OK: F132.7 biblioteca + ficha + guías + papers + calculadoras")
