"""Test de rendimiento de navegación (Playwright, headless).

Mide en la app real (dev server vía scripts/with_server.py):

1. Cold load de la home (contexto con cache desactivada): LCP, FCP, TTFB,
   DOMContentLoaded y tamaño del JS inicial.
2. Navegación SPA (warm) por las rutas principales: tiempo desde el click en
   la TabBar hasta que el contenido está renderizado (el `<main id="contenido">`
   ya no muestra el fallback `role="status"` del Suspense), suma de Long Tasks
   (>50ms) que bloquean el hilo principal y chunks lazy descargados en esa ruta.

Umbrales pensados para dev server en Chromium headless; el objetivo es
detectar regresiones (navegación lenta), no benchmarking absoluto.

Uso:
    python scripts/with_server.py test_perf.py
"""
import json
import sys

from playwright.sync_api import expect

from scripts.e2e_utils import base_url

# Umbrales (ms). Generosos pero detectores de regresión.
THRESHOLDS = {
    "lcp_ms": 2500,      # cold load home
    "fcp_ms": 2000,
    "ttfb_ms": 800,
    "dcl_ms": 2000,
    "spa_nav_ms": 700,   # transición SPA warm (click -> contenido renderizado)
    "long_task_total_ms": 500,  # suma de long tasks por navegación
}

# Rutas principales en orden de navegación real (TabBar + hub Más / links).
# Cada ruta trae su ruta previa para navegar de vuelta.
ROUTES = ["/", "/rutinas", "/estadisticas", "/mas", "/perfil", "/ejercicios", "/guias", "/calculadoras", "/cuerpo", "/calendario"]

# Selector de cada ruta en la TabBar/hub para navegar sin URL hardcodeada.
TAB_TARGETS = {
    "/": "Entrenar",
    "/rutinas": "Rutinas",
    "/estadisticas": "Estadísticas",
    "/mas": "Más",
}

CONTENT_READY_JS = """() => {
  const main = document.querySelector('#contenido');
  if (!main) return false;
  const h = main.querySelector('h1, h2');
  if (!h) return false;
  const r = h.getBoundingClientRect();
  return r.width > 0 && r.height > 0;
}"""


def setup_observers(page):
    """Registra Long Tasks y LCP (PerformanceObserver) y los deja en window.__perf."""
    page.add_init_script(
        """
        window.__perf = { longTasks: [], lcp: 0 };
        try {
          new PerformanceObserver((list) => {
            for (const e of list.getEntries()) {
              window.__perf.longTasks.push({ start: e.startTime, dur: e.duration });
            }
          }).observe({ entryTypes: ['longtask'] });
        } catch (_) {}
        try {
          new PerformanceObserver((list) => {
            const es = list.getEntries();
            if (es.length) window.__perf.lcp = es[es.length - 1].startTime;
          }).observe({ type: 'largest-contentful-paint', buffered: true });
        } catch (_) {}
        """
    )


def complete_onboarding(page):
    """Completa el onboarding para tener la app sembrada (sin wizard)."""
    page.goto(base_url(), wait_until="networkidle")
    page.get_by_role("button", name="Español").click()
    page.get_by_role("button", name="Continuar").click()
    page.wait_for_timeout(250)
    page.get_by_role("button", name="Fuerza").click()
    page.get_by_role("button", name="Continuar").click()
    page.wait_for_timeout(250)
    page.get_by_role("button", name="3", exact=True).first.click()
    page.get_by_role("button", name="Gimnasio").click()
    page.get_by_role("button", name="Continuar").click()
    page.wait_for_timeout(250)
    page.get_by_role("button", name="Kg").first.click()
    page.get_by_role("button", name="Hombre").click()
    page.get_by_label("Fecha de nacimiento").fill("1996-01-15")
    page.get_by_label("Altura en centímetros").fill("175")
    page.get_by_label("Peso en kg").fill("80")
    page.get_by_role("button", name="Continuar").click()
    page.wait_for_timeout(250)
    page.get_by_role("checkbox").check()
    page.get_by_role("button", name="Empezar D1").click()
    page.wait_for_url(f"{base_url()}/")
    page.wait_for_timeout(500)
    expect(page.locator("#contenido")).not_to_contain_text("Entrenar con un plan")
    expect(page.get_by_role("navigation")).to_be_visible()


def measure_cold_load(page):
    """Reload con cache desactivada y mide nav timing + LCP + tamaño JS."""
    timing = page.evaluate(
        """() => {
          const t = performance.getEntriesByType('navigation')[0];
          const js = performance.getEntriesByType('resource')
            .filter((r) => r.name.endsWith('.js') || r.name.includes('.js?'));
          return {
            dcl: t.domContentLoadedEventEnd,
            load: t.loadEventEnd,
            ttfb: t.responseStart,
            fcp: performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? 0,
            jsCount: js.length,
            jsBytes: js.reduce((s, r) => s + (r.transferSize || 0), 0),
          };
        }"""
    )
    lcp = page.evaluate("() => window.__perf?.lcp ?? 0")
    timing["lcp"] = lcp
    return timing


def wait_content_ready(page):
    page.wait_for_function(CONTENT_READY_JS, timeout=10000)


def nav_to(page, route):
    """Navega a la ruta por la UI (TabBar o hub Más) midiendo solo la transición destino."""
    if route not in TAB_TARGETS:
        # Rutas no-tab: pre-navega al hub sin medir (el t0 empieza en el click destino).
        page.get_by_role("link", name="Más", exact=True).click()
        wait_content_ready(page)
    t0 = page.evaluate("() => performance.now()")
    if route in TAB_TARGETS:
        page.get_by_role("link", name=TAB_TARGETS[route], exact=True).click(force=True)
    else:
        page.get_by_role("link", name=route_targets(route), exact=True).click(force=True)
    wait_content_ready(page)
    elapsed = page.evaluate("(t0) => performance.now() - t0", t0)
    return elapsed


def route_targets(route):
    """Label de la entrada del hub Más para rutas no tab."""
    targets = {
        "/perfil": "Perfil e historial",
        "/ejercicios": "Biblioteca de ejercicios",
        "/guias": "Guías",
        "/calculadoras": "Calculadoras",
        "/cuerpo": "Cuerpo y fatiga",
        "/calendario": "Calendario",
    }
    return targets[route]


def measure_spa_nav(page, route):
    """Mide la transición SPA a la ruta: tiempo + long tasks + chunks lazy."""
    page.evaluate("() => { window.__perf.longTasks = []; window.__perf.lcp = 0; }")
    elapsed = nav_to(page, route)
    perf = page.evaluate(
        """() => {
          const js = performance.getEntriesByType('resource')
            .filter((r) => (r.name.endsWith('.js') || r.name.includes('.js?')) && r.duration > 0)
            .slice(-10);
          return {
            longTotal: window.__perf.longTasks.reduce((s, t) => s + t.dur, 0),
            longCount: window.__perf.longTasks.length,
            chunks: js.map((r) => ({ name: r.name.split('/').pop(), ms: Math.round(r.duration), bytes: r.transferSize || 0 })),
          };
        }"""
    )
    return {"route": route, "nav_ms": round(elapsed, 1), **perf}


def main():
    from playwright.sync_api import sync_playwright

    fails = []
    cold = {}
    spa = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        try:
            # --- Cold load (contexto sin cache) + navegación SPA en la misma sesión ---
            ctx = browser.new_context(
                viewport={"width": 375, "height": 812},
                ignore_https_errors=True,
            )
            page = ctx.new_page()
            setup_observers(page)
            complete_onboarding(page)
            cold = measure_cold_load(page)

            # --- Navegación SPA warm (misma sesión, cache caliente) ---
            wait_content_ready(page)
            # Primera pasada: cargar todos los chunks lazy (calentamiento).
            for route in ROUTES[1:]:
                try:
                    nav_to(page, route)
                except Exception:
                    pass
            wait_content_ready(page)
            nav_to(page, "/")

            # Segunda pasada: mediciones reales.
            for route in ROUTES:
                try:
                    spa.append(measure_spa_nav(page, route))
                except Exception as e:
                    fails.append(f"[{route}] navegación fallida: {e}")
            page.close()
            ctx.close()
        finally:
            browser.close()

    print("\n=== COLD LOAD (home, sin cache) ===")
    print(f"  LCP:        {cold.get('lcp', 0):7.0f} ms  (umbral {THRESHOLDS['lcp_ms']})")
    print(f"  FCP:        {cold.get('fcp', 0):7.0f} ms  (umbral {THRESHOLDS['fcp_ms']})")
    print(f"  TTFB:       {cold.get('ttfb', 0):7.0f} ms  (umbral {THRESHOLDS['ttfb_ms']})")
    print(f"  DOMContent: {cold.get('dcl', 0):7.0f} ms  (umbral {THRESHOLDS['dcl_ms']})")
    print(f"  JS inicial: {cold.get('jsBytes', 0) / 1024:.0f} KB en {cold.get('jsCount', 0)} archivos")

    print("\n=== NAVEGACIÓN SPA (warm) ===")
    print(f"  {'ruta':<14} {'nav ms':>8} {'longTasks':>10} {'ms bloqueo':>11}")
    for m in spa:
        print(f"  {m['route']:<14} {m['nav_ms']:>8} {m['longCount']:>10} {m['longTotal']:>11.0f}")
        slow_chunks = [c for c in m["chunks"] if c["ms"] > 100]
        for c in slow_chunks:
            print(f"    chunk: {c['name']} {c['ms']} ms / {c['bytes'] / 1024:.0f} KB")
        if m["nav_ms"] > THRESHOLDS["spa_nav_ms"]:
            fails.append(f"[{m['route']}] navegación lenta: {m['nav_ms']:.0f} ms (umbral {THRESHOLDS['spa_nav_ms']})")
        if m["longTotal"] > THRESHOLDS["long_task_total_ms"]:
            fails.append(f"[{m['route']}] long tasks excesivas: {m['longTotal']:.0f} ms (umbral {THRESHOLDS['long_task_total_ms']})")

    if cold.get("lcp", 0) > THRESHOLDS["lcp_ms"]:
        fails.append(f"LCP frío alto: {cold['lcp']:.0f} ms")
    if cold.get("fcp", 0) > THRESHOLDS["fcp_ms"]:
        fails.append(f"FCP frío alto: {cold['fcp']:.0f} ms")

    if fails:
        print("\nFALLO:")
        print("\n  ".join(fails))
        return 1
    print("\nPERF PASSED — navegación dentro de umbrales")
    return 0


if __name__ == "__main__":
    sys.exit(main())
