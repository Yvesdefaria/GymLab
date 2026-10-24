"""Rediseño /rutinas (Nocturno Minimal, tarjeta editorial): flujos principales.

Cubre el modo base (Favoritas / Mis rutinas / grupos colapsados), el modo resultados
(chip de objetivo y búsqueda), el acordeón por objetivo, el sheet de filtros con
borrador y conteo, el sheet de creación y el favorito accesible.
"""
import os
import re
import sys
import tempfile

sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"

SEED_JS = """async () => {
  const openDb = () => new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const db = await openDb();
  await new Promise((res, rej) => {
    const tx = db.transaction(['routines', 'meta'], 'readwrite');
    const meta = tx.objectStore('meta');
    meta.put({ key: 'onboardingDone', value: 'true' });
    meta.put({ key: 'routineFavorites', value: '[1,4]' });
    meta.put({ key: 'settings', value: '{"language":"es","showSectionTips":false}' });
    tx.objectStore('routines').put({ id: 10001, slug: 'custom-push-pull', title: 'Push Pull Legs propio', objective: 'volumen', level: 'intermedio', description: '', daysCount: 3, isCustom: true, basedOnId: 1 });
    tx.objectStore('routines').put({ id: 10002, slug: 'custom-casa', title: 'Rutina de casa', objective: 'general', level: 'principiante', description: '', daysCount: 2, isCustom: true });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  return true;
}"""


def boot(page, errors):
    page.goto(BASE, wait_until="load", timeout=60000)
    page.wait_for_timeout(1000)
    seeded = False
    for _ in range(20):
        try:
            if page.evaluate(SEED_JS) is True:
                seeded = True
                break
        except Exception:
            pass
        page.wait_for_timeout(500)
    assert seeded, "seed fallo: la DB no estuvo lista"
    page.goto(f"{BASE}/rutinas", wait_until="load", timeout=60000)
    page.wait_for_timeout(1200)
    skip = page.locator("button", has_text="Ya entreno aquí")
    if skip.count() > 0:
        skip.first.click(timeout=5000)
        page.wait_for_timeout(600)
    dialog = page.locator('[role="dialog"]')
    if dialog.count() > 0:
        close = dialog.first.locator('button[aria-label="Cerrar"]')
        if close.count() > 0:
            close.first.click()
            page.wait_for_timeout(300)


def main():
    errors = []
    shots = os.path.join(tempfile.gettempdir(), "opencode", "rutinas-e2e")
    os.makedirs(shots, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 390, "height": 844})
        page.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))

        boot(page, errors)

        # 1) Base: header + Favoritas + Mis rutinas + 5 grupos colapsados.
        header_text = page.locator("header").first.inner_text().lower()
        if "70 plantillas y programas" not in header_text:
            errors.append(f"kicker con el conteo total ausente: {header_text[:80]!r}")
        if page.locator(".routine-card").count() != 4:
            errors.append(f"esperaba 4 tarjetas base (2 favoritas + 2 propias), hay {page.locator('.routine-card').count()}")
        groups = page.locator("button[aria-expanded]")
        if groups.count() != 5:
            errors.append(f"esperaba 5 grupos colapsados, hay {groups.count()}")
        for label in ("Favoritas", "Mis rutinas", "Predefinidas"):
            if page.get_by_text(label, exact=True).count() == 0:
                errors.append(f"falta la sección {label}")
        page.screenshot(path=os.path.join(shots, "rutinas-base.png"), full_page=True)

        # 2) Imágenes reales de portada.
        broken = page.evaluate("Array.from(document.images).filter((i) => !i.complete || i.naturalWidth === 0).length")
        if broken:
            errors.append(f"{broken} portadas no cargaron")

        # 3) Acordeón: Fuerza abre 13 tarjetas y vuelve a cerrar.
        groups.filter(has_text="Fuerza").click()
        page.wait_for_timeout(400)
        if page.locator(".routine-card").count() != 17:
            errors.append(f"tras abrir Fuerza esperaba 17 tarjetas, hay {page.locator('.routine-card').count()}")
        if page.locator('button[aria-expanded="true"]').count() != 1:
            errors.append("el acordeón no dejó un solo grupo abierto")

        # 4) Favorito accesible dentro del grupo: togglea aria-pressed y vuelve a su estado.
        # Se usa el ElementHandle para seguir apuntando a la MISMA tarjeta aunque al
        # marcarla aparezca también en Favoritas.
        star = page.locator(".routine-card", has_text="Starting Strength").locator("button[aria-pressed]").first.element_handle()
        if star.get_attribute("aria-pressed") != "false":
            errors.append("la estrella de una rutina no favorita no arranca en false")
        star.click()
        page.wait_for_timeout(400)
        if star.get_attribute("aria-pressed") != "true":
            errors.append("marcar favorita no dejó aria-pressed en true")
        star.click()
        page.wait_for_timeout(400)
        if star.get_attribute("aria-pressed") != "false":
            errors.append("desmarcar favorita no volvió aria-pressed a false")

        groups.filter(has_text="Fuerza").click()
        page.wait_for_timeout(300)

        # 5) Chip de objetivo: modo resultados (sin secciones personales).
        chips = page.locator('[data-tour="rutinas-filters"] button[aria-pressed]')
        chips.filter(has_text="Fuerza").click()
        page.wait_for_timeout(400)
        if page.get_by_text("13 resultados", exact=True).count() == 0:
            errors.append("el modo resultados no muestra «13 resultados»")
        if page.get_by_text("Favoritas", exact=True).count() != 0:
            errors.append("el modo resultados no ocultó Favoritas")
        if page.locator(".routine-card").count() != 13:
            errors.append(f"esperaba 13 tarjetas de Fuerza, hay {page.locator('.routine-card').count()}")
        page.screenshot(path=os.path.join(shots, "rutinas-fuerza.png"), full_page=True)

        # 6) Búsqueda + objetivo → intersección.
        page.get_by_label("Buscar rutina").fill("wendler")
        page.wait_for_timeout(600)
        if page.locator(".routine-card").count() != 1:
            errors.append(f"búsqueda «wendler» con Fuerza esperaba 1 tarjeta, hay {page.locator('.routine-card').count()}")
        if page.get_by_text("5/3/1 Wendler", exact=True).count() == 0:
            errors.append("no aparece 5/3/1 Wendler en los resultados")

        # 6b) Búsqueda sin coincidencias: empty state honesto.
        page.get_by_label("Buscar rutina").fill("zzzz")
        page.wait_for_timeout(600)
        if page.locator(".routine-card").count() != 0:
            errors.append("una búsqueda sin coincidencias dejó tarjetas")
        if page.get_by_text(re.compile("No hay rutinas que coincidan")).count() == 0:
            errors.append("falta el empty state de búsqueda")
        page.screenshot(path=os.path.join(shots, "rutinas-vacio.png"), full_page=True)

        # 7) Todos + búsqueda: sigue en resultados, sin secciones personales.
        chips.filter(has_text="Todos").click()
        page.wait_for_timeout(400)
        if page.get_by_text("Favoritas", exact=True).count() != 0:
            errors.append("con búsqueda activa volvieron las secciones personales")
        page.get_by_label("Buscar rutina").fill("")
        page.wait_for_timeout(600)
        if page.get_by_text("Favoritas", exact=True).count() == 0:
            errors.append("al limpiar la búsqueda no volvieron las secciones")

        # 8) Sheet de filtros: borrador, Limpiar y conteo en vivo.
        page.locator('button[aria-label="Filtros"]').click()
        page.wait_for_timeout(400)
        dialog = page.locator('[role="dialog"]')
        if dialog.count() != 1:
            errors.append("el sheet de filtros no se abrió")
        dialog.get_by_role("button", name="Programa").click()
        dialog.get_by_role("button", name="Avanzado").click()
        page.screenshot(path=os.path.join(shots, "rutinas-filtros.png"), full_page=True)
        preview = dialog.get_by_role("button", name=re.compile(r"^Ver \d+ rutina"))
        if preview.count() != 1:
            errors.append("el botón de aplicar filtros no muestra el conteo")
        preview.click()
        page.wait_for_timeout(500)
        if page.get_by_text("Favoritas", exact=True).count() != 0:
            errors.append("aplicar filtros no entró en modo resultados")
        metas = page.locator(".routine-card__meta").all_inner_texts()
        if not metas or any("Avanzado" not in meta for meta in metas):
            errors.append(f"algún resultado no es Avanzado: {metas[:3]}")

        page.locator('button[aria-label="Filtros"]').click()
        page.wait_for_timeout(300)
        dialog.get_by_role("button", name="Limpiar").click()
        if dialog.get_by_role("button", name="Ver 70 rutinas").count() != 1:
            errors.append("«Limpiar» no dejó el conteo en 70")
        dialog.get_by_role("button", name="Ver 70 rutinas").click()
        page.wait_for_timeout(400)
        if page.get_by_text("Favoritas", exact=True).count() == 0:
            errors.append("al limpiar filtros no volvieron las secciones")

        # 9) Sheet de creación: manual y con ayuda.
        page.locator('button[aria-label="Nueva rutina"]').click()
        page.wait_for_timeout(300)
        dialog = page.locator('[role="dialog"]')
        if dialog.count() != 1:
            errors.append("el sheet de creación no se abrió")
        page.screenshot(path=os.path.join(shots, "rutinas-crear.png"), full_page=True)
        dialog.get_by_role("button", name=re.compile("Crear manualmente")).click()
        page.wait_for_url("**/rutinas/nueva", timeout=8000)
        page.go_back(wait_until="load")
        page.wait_for_timeout(900)
        page.locator('button[aria-label="Nueva rutina"]').click()
        page.wait_for_timeout(300)
        page.locator('[role="dialog"]').get_by_role("button", name=re.compile("Con ayuda")).click()
        page.wait_for_url("**/rutinas/planificador", timeout=8000)

        browser.close()

    print("\n=== RESULTADO ===")
    if errors:
        print("FALLO:")
        for error in errors:
            print(" -", error)
        return False
    print("RUTINAS NOCTURNO: ALL OK (base, acordeón, resultados, filtros y creación)")
    return True


if __name__ == "__main__":
    sys.exit(0 if main() else 1)


