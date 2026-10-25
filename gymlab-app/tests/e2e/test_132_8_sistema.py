"""F132.8 — Sistema: Ajustes, Términos y Privacidad en Nocturno Minimal.

Contratos que este test protege:
- /ajustes: grupos hairline (un h2 por grupo), cero `panel-*`, switch y filas
  de navegación con área táctil >= 44 px, tema y paleta aplicados a <html> y
  sin scroll horizontal.
- /terminos y /privacidad: índice plegable (`details`/`ol`), secciones
  numeradas `01`..`N`, un único link mailto (el email no se repite en el
  párrafo) y cero tarjetas del lenguaje anterior.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from scripts.e2e_utils import run_views, base_url

TERMINOS_SECCIONES = 8
PRIVACIDAD_SECCIONES = 11

SEED_JS = """async () => {
  const openDb = () => new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const db = await openDb();
  await new Promise((res, rej) => {
    const tx = db.transaction(['meta'], 'readwrite');
    const meta = tx.objectStore('meta');
    meta.put({ key: 'onboardingDone', value: 'true' });
    meta.put({ key: 'settings', value: JSON.stringify({ language: 'es', showSectionTips: false }) });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  localStorage.setItem('gymlab.theme', 'night');
  localStorage.setItem('gymlab.palette', 'gold');
  return true;
}"""

GRUPOS = [
    'Apariencia',
    'Sesión',
    'Series',
    'Notificaciones',
    'General',
    'Datos',
    'Ayuda',
    'Datos de uso anónimos',
    'Reportar un error',
    'Legal',
    'Zona de peligro',
]

FILAS_NAVEGACION = [
    'a[href="/terminos"]',
    'a[href="/privacidad"]',
    'button:has-text("Volver a ver el tour")',
    'button:has-text("Backup y restauración")',
    'button:has-text("Importar datos")',
    'button:has-text("Resetear a estado de fábrica")',
]

MIN_TOUCH = 43.5


def seed(page):
    page.goto(base_url(), wait_until="load")
    page.wait_for_timeout(600)
    assert page.evaluate(SEED_JS) is True, "el seed no escribió la meta de onboarding"
    page.reload(wait_until="load")
    page.wait_for_timeout(700)


def close_overlays(page):
    for text in ("Ya entreno aquí", "I already train here"):
        btn = page.locator("button", has_text=text)
        if btn.count() > 0:
            btn.first.click()
            page.wait_for_timeout(250)


def assert_no_overflow(page, label):
    overflow = page.evaluate(
        "() => document.documentElement.scrollWidth - document.documentElement.clientWidth"
    )
    assert overflow <= 1, f"{label}: scroll horizontal de {overflow}px"


def assert_touch(page, selector, label, view_name):
    target = page.locator(selector).first
    assert target.count() > 0, f"{view_name}: falta la fila {selector}"
    box = target.bounding_box()
    assert box is not None, f"{view_name}: {label} sin caja"
    assert box["height"] >= MIN_TOUCH, f"{view_name}: {label} mide {round(box['height'], 1)} px"


def assert_ajustes(page, view_name, shot):
    seed(page)
    close_overlays(page)
    page.goto(f"{base_url()}/ajustes", wait_until="load")
    page.wait_for_timeout(600)
    close_overlays(page)

    # 1) Un h2 por grupo: el eyebrow es la unidad de sección.
    for grupo in GRUPOS:
        headings = page.get_by_role("heading", level=2, name=grupo, exact=True)
        assert headings.count() == 1, (
            f"{view_name}: el grupo «{grupo}» aparece {headings.count()} veces"
        )

    # 2) Cero tarjetas del lenguaje anterior.
    for panel in ("panel-light", "panel-hero", "panel-chart"):
        count = page.locator(f".{panel}").count()
        assert count == 0, f"{view_name}: {count} contenedor(es) .{panel} en Ajustes"

    # 3) Área táctil en switches y filas de navegación.
    switches = page.locator('button[role="switch"]')
    total = switches.count()
    assert total >= 8, f"{view_name}: se esperaban al menos 8 switches, hay {total}"
    for i in range(total):
        box = switches.nth(i).bounding_box()
        assert box is not None and box["height"] >= MIN_TOUCH, (
            f"{view_name}: switch {i} mide {box and round(box['height'], 1)} px"
        )
    for selector in FILAS_NAVEGACION:
        assert_touch(page, selector, selector, view_name)

    # 4) F101 punto 4: el replay del tour sigue visible sin scroll en 375×812.
    replay = page.get_by_role("button", name="Volver a ver el tour")
    box = replay.bounding_box()
    viewport = page.viewport_size
    assert box is not None, f"{view_name}: «Volver a ver el tour» sin caja"
    assert viewport is not None, f"{view_name}: viewport desconocido"
    assert box["y"] >= 0 and box["y"] + box["height"] <= viewport["height"], (
        f"{view_name}: «Volver a ver el tour» fuera del viewport sin scroll "
        f"(y={round(box['y'])}, alto={round(box['height'])}, viewport={viewport['height']})"
    )

    # 5) Tema y paleta se aplican a <html> y se pueden revertir.
    assert page.evaluate("() => document.documentElement.dataset.theme") == "night", (
        f"{view_name}: el tema inicial no es night"
    )
    page.get_by_role("button", name="Día", exact=True).click()
    page.wait_for_timeout(250)
    assert page.evaluate("() => document.documentElement.dataset.theme") == "day", (
        f"{view_name}: «Día» no aplicó data-theme=day"
    )
    page.get_by_role("button", name="Noche", exact=True).click()
    page.wait_for_timeout(250)
    assert page.evaluate("() => document.documentElement.dataset.theme") == "night", (
        f"{view_name}: «Noche» no volvió a data-theme=night"
    )

    assert page.evaluate("() => document.documentElement.dataset.palette") == "gold", (
        f"{view_name}: la paleta inicial no es gold"
    )
    page.get_by_role("button", name="Energía", exact=True).click()
    page.wait_for_timeout(250)
    assert page.evaluate("() => document.documentElement.dataset.palette") == "energy", (
        f"{view_name}: la paleta Energía no aplicó data-palette=energy"
    )
    page.get_by_role("button", name="Dorado", exact=True).click()
    page.wait_for_timeout(250)
    assert page.evaluate("() => document.documentElement.dataset.palette") == "gold", (
        f"{view_name}: la paleta Dorado no volvió a data-palette=gold"
    )

    # 6) El formulario de reporte sigue accesible.
    for selector in ("#reporte-descripcion", "#reporte-email"):
        assert page.locator(selector).count() == 1, f"{view_name}: falta {selector}"

    assert_no_overflow(page, f"{view_name}/ajustes")
    page.screenshot(path=shot, full_page=True)


def assert_legal(page, view_name, shot, ruta, secciones, nombre):
    page.goto(f"{base_url()}{ruta}", wait_until="load")
    page.wait_for_timeout(600)
    close_overlays(page)

    for panel in ("panel-light", "panel-hero", "panel-chart"):
        count = page.locator(f".{panel}").count()
        assert count == 0, f"{view_name}/{nombre}: {count} contenedor(es) .{panel}"

    assert page.locator("details").count() >= 1, f"{view_name}/{nombre}: falta el índice plegable"
    links = page.locator("details ol a")
    assert links.count() == secciones, (
        f"{view_name}/{nombre}: el índice lista {links.count()} de {secciones} secciones"
    )

    # Cada sección de contenido abre con su número de dos dígitos.
    for indice, sid in enumerate(
        [s for s in page.locator("section[id]").evaluate_all("els => els.map(e => e.id)") if s != "contacto"],
        start=1,
    ):
        texto = page.locator(f"section#{sid}").inner_text().lstrip()
        assert texto.startswith(f"{indice:02d}"), (
            f"{view_name}/{nombre}: la sección #{sid} no abre con «{indice:02d}»"
        )

    # El email del párrafo de contacto es el propio link: no debe duplicarse.
    mailtos = page.locator('a[href^="mailto:"]')
    assert mailtos.count() == 1, (
        f"{view_name}/{nombre}: {mailtos.count()} links mailto (se esperaba 1)"
    )

    # El índice abre y el ancla navega.
    page.locator("details summary").first.click()
    page.wait_for_timeout(250)
    primer = page.locator("details ol a").first
    href = primer.get_attribute("href") or ""
    primer.click()
    page.wait_for_timeout(350)
    assert href.lstrip("#") in page.url, (
        f"{view_name}/{nombre}: el ancla {href} no quedó en la URL ({page.url})"
    )

    assert_no_overflow(page, f"{view_name}/{nombre}")
    page.screenshot(path=shot, full_page=True)


def run(page, view_name, shot):
    assert_ajustes(page, view_name, shot.replace(".png", "-ajustes.png"))
    assert_legal(
        page, view_name, shot.replace(".png", "-terminos.png"),
        "/terminos", TERMINOS_SECCIONES, "terminos",
    )
    assert_legal(
        page, view_name, shot.replace(".png", "-privacidad.png"),
        "/privacidad", PRIVACIDAD_SECCIONES, "privacidad",
    )


def main() -> int:
    errors = run_views({"iphone": run, "ipad": run}, __file__, "f132_8")
    if errors:
        print("FALLO:")
        for error in errors:
            print(" -", error)
        return 1
    print("OK: F132.8 Sistema (Ajustes, Términos y Privacidad) en 375 y 768")
    return 0


if __name__ == "__main__":
    sys.exit(main())
