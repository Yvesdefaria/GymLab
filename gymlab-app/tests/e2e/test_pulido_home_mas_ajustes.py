"""Pulido Home/Más/Ajustes: sin hueco muerto al final y textos informativos movidos.

Verifica a 375x812 con onboarding y tour ya completados (seed en IndexedDB):
- / y /ajustes (y /mas si todavía scrollea): el hueco real entre la última hoja
  visible y el final del documento es <= 120 px, y lo que queda visible por
  encima de la tab bar es <= 90 px. Si la página no scrollea, no se evalúa.
- /mas: los textos "free-exercise-db" y "local-first" salen del hub (van a Ajustes).
- /ajustes: el crédito de fotos vive en CRÉDITOS sin duplicar el nombre del dataset.
- 0 errores de consola y de página en las tres rutas.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"
VIEWPORT = {"width": 375, "height": 812}

# Onboarding y tour ya hechos: sin overlays que falseen el layout medido.
SEED_JS = """
async () => {
  const open = () => new Promise((res, rej) => { const r = indexedDB.open('GymLabDB'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  const db = await open();
  const tx = db.transaction('meta', 'readwrite');
  const store = tx.objectStore('meta');
  for (const row of [
    { key: 'onboardingDone', value: 'true' },
    { key: 'tourDone', value: 'true' },
    { key: 'tourPending', value: 'false' },
    { key: 'sectionTipsSeen', value: JSON.stringify({ inicio: true, rutinas: true, estadisticas: true, logros: true, mas: true, perfil: true }) },
  ]) store.put(row);
  await new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = () => rej(tx.error); });
  db.close();
}
"""

# Hueco real: scrollHeight menos el fondo de la hoja visible más baja dentro de
# `main` (el max-bottom sobre todos los elementos siempre devuelve el wrapper).
METRIC_JS = """() => {
  const se = document.scrollingElement;
  const main = document.querySelector('main');
  let leafBottom = 0;
  const walk = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) {
      const b = r.bottom + window.scrollY;
      if (el.children.length === 0 && b > leafBottom) leafBottom = b;
    }
    for (const c of el.children) walk(c);
  };
  walk(main);
  const tabs = document.querySelector('nav');
  const tabTop = tabs ? tabs.getBoundingClientRect().top : null;
  const maxScroll = se.scrollHeight - window.innerHeight;
  return {
    maxScroll,
    leafDead: Math.round(se.scrollHeight - leafBottom),
    leafVisibleGap: tabTop !== null ? Math.round(tabTop - (leafBottom - maxScroll)) : null,
  };
}"""


def open_page(page, path, label, errors, selector=None, settle_ms=1500):
    """Navega, espera contenido real y devuelve (innerText, métricas) de la página.

    Los errores de consola/página se recolectan por ruta y se agregan a `errors`.
    """
    console_errors = []

    def on_console(msg):
        if msg.type == "error":
            console_errors.append(f"console.error: {msg.text}")

    def on_pageerror(exc):
        console_errors.append(f"pageerror: {exc}")

    page.on("console", on_console)
    page.on("pageerror", on_pageerror)
    try:
        page.goto(f"{BASE}{path}", wait_until="networkidle")
        if selector is not None:
            try:
                page.wait_for_selector(selector, state="visible", timeout=8000)
            except Exception:
                errors.append(f"[{label}] no apareció el contenido esperado ({selector})")
                return None, None
        page.wait_for_timeout(settle_ms)
        text = page.locator("main").inner_text()
        metrics = page.evaluate(METRIC_JS)
        return text, metrics
    finally:
        page.remove_listener("console", on_console)
        page.remove_listener("pageerror", on_pageerror)
        errors.extend(f"[{label}] {ce}" for ce in console_errors)


def assert_no_dead_space(metrics, label, errors):
    """Solo evalúa si la página scrollea; una página corta deja blanco natural."""
    if metrics is None or metrics["maxScroll"] <= 0:
        return
    if metrics["leafDead"] > 120:
        errors.append(
            f"[{label}] hueco hoja→fin de documento {metrics['leafDead']}px (> 120px)"
        )
    if metrics["leafVisibleGap"] is not None and metrics["leafVisibleGap"] > 90:
        errors.append(
            f"[{label}] hueco visible sobre la tab bar {metrics['leafVisibleGap']}px (> 90px)"
        )


def main():
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport=VIEWPORT)
        page = context.new_page()
        try:
            # Arranque + seed, y recarga para que la app arranque ya sembrada.
            page.goto(BASE, wait_until="networkidle")
            page.wait_for_timeout(1500)
            page.evaluate(SEED_JS)
            page.reload(wait_until="networkidle")
            page.wait_for_timeout(1500)

            # / — Inicio: sin el pb-32 redundante.
            _, home_metrics = open_page(page, "/", "home", errors)
            assert_no_dead_space(home_metrics, "home", errors)

            # /mas — hub: sin los textos movidos y con el enlace a Ajustes operativo.
            mas_text, mas_metrics = open_page(
                page, "/mas", "mas", errors, selector='main a[href="/ajustes"]'
            )
            if mas_text is not None:
                if "free-exercise-db" in mas_text:
                    errors.append("[mas] el hub todavía muestra 'free-exercise-db'")
                if "local-first" in mas_text:
                    errors.append("[mas] el hub todavía muestra 'local-first'")
                if page.locator('main a[href="/ajustes"]').count() < 1:
                    errors.append("[mas] no queda el enlace a /ajustes (hub roto)")
            assert_no_dead_space(mas_metrics, "mas", errors)

            # /ajustes — crédito de fotos en CRÉDITOS, sin duplicar el nombre.
            ajustes_text, ajustes_metrics = open_page(page, "/ajustes", "ajustes", errors)
            if ajustes_text is not None:
                veces = ajustes_text.count("free-exercise-db")
                if veces != 1:
                    errors.append(
                        f"[ajustes] 'free-exercise-db' aparece {veces} veces (esperado 1)"
                    )
                if "Disponibles para uso comercial" not in ajustes_text:
                    errors.append("[ajustes] falta el texto 'Disponibles para uso comercial'")
            assert_no_dead_space(ajustes_metrics, "ajustes", errors)
        finally:
            page.close()
            context.close()
            browser.close()

    if errors:
        print("ERRORS:")
        for e in errors:
            print(f"  - {e}")
        sys.exit(1)
    print("ALL OK: pulido home/mas/ajustes")


if __name__ == "__main__":
    main()
