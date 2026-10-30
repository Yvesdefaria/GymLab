"""Fase 105 WP2: encaje del bloque de compartir en el resumen y fallback de share web.

Caso 105.2 (layout): a 360x800, en el resumen post-guardado, el bloque de
SessionImageExport ([data-photo-pr]) y el carrusel de stats (SwipeRow) deben
caber en el viewport: root, canvas y botones. Medición del worktree antes del
fix: el bloque de compartir ya se achicaba por shrink-to-fit (20..340), pero el
root del SwipeRow tomaba el max-content del carrusel (384px, -12..372) y
`AppShell` (`overflow-x-clip`) lo recortaba 12px por lado. Se mide con
getBoundingClientRect (NO `scrollWidth` del documento: el clip lo enmascara).

Caso share web sin nativo: con `navigator.share`/`canShare` ausentes, «Compartir»
cae a descarga (evento download del navegador).

Un solo browser context (IndexedDB limpia) con el flujo real de sesión activa.
0 errores de consola.
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"
VIEWPORT = {"width": 360, "height": 800}

# Siembra: solo el catálogo del ejercicio a registrar (id fuera del rango del
# seed del catálogo para evitar carreras) y onboarding hecho. Copiada de F95.2.
SEED_ACTIVE_JS = """async () => {
  const openDb = () => new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const db = await openDb();
  await new Promise((res, rej) => {
    const tx = db.transaction(['exercises', 'meta'], 'readwrite');
    tx.objectStore('exercises').put({ id: 999, slug: 'sentadilla-e2e', name: 'Sentadilla E2E', muscleGroup: 'pierna', equipment: ['barra'], instructions: '', category: 'strength' });
    tx.objectStore('meta').put({ key: 'onboardingDone', value: 'true' });
    tx.objectStore('meta').put({ key: 'settings', value: JSON.stringify({ language: 'es', showSectionTips: false }) });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  return true;
}"""


def boot(page, seed_js):
    """Carga la app, siembra IndexedDB y salta el onboarding si aparece.

    El primer goto es el que despierta al dev server (cold start de Vite): 60s
    de margen para no fallar por optimización de deps en el primer request.
    """
    page.goto(BASE, wait_until="networkidle", timeout=60000)
    page.wait_for_timeout(800)
    seed = page.evaluate(seed_js)
    assert seed is True, f"seed fallo: {seed}"
    page.reload(wait_until="networkidle")
    page.wait_for_timeout(1000)
    skip_ob = page.locator("button", has_text="Ya entreno aquí")
    if skip_ob.count() > 0:
        skip_ob.first.click(timeout=5000)
        page.wait_for_timeout(800)


def close_achievements(page):
    """Cierra la cola de logros del guardado (F95.1): el botón primario avanza
    un ítem por pantalla y cierra al final. Quitar el nodo a mano no sirve:
    React lo re-renderiza con el estado del hook."""
    for _ in range(8):
        dialog = page.locator('[role="dialog"][aria-labelledby="achievement-modal-title"]')
        if dialog.count() == 0:
            return
        dialog.first.locator("button").first.click()
        page.wait_for_timeout(500)
    page.wait_for_timeout(300)


def dismiss_journal_sheet(page):
    """F84: el sheet de bitácora se auto-abre tras finalizar; se descarta para
    poder medir/interactuar con el resumen."""
    sheet = page.locator('[role="dialog"][aria-label="Bitácora"]')
    if sheet.count() > 0:
        sheet.first.locator("button", has_text="Omitir").click()
        page.wait_for_timeout(400)


def rect(locator):
    """Rect del elemento relativo al viewport (left/right son lo que importa acá)."""
    return locator.evaluate(
        "(el) => { const r = el.getBoundingClientRect(); return { left: r.left, right: r.right, width: r.width }; }"
    )


def fits(label, r, viewport_w, errors):
    """Falla si el rect se sale del viewport: izquierda < 0 o derecha > ancho + 1px."""
    if r["left"] < -0.5 or r["right"] > viewport_w + 1:
        errors.append(
            f"layout: {label} fuera del viewport {viewport_w}px "
            f"(left={r['left']:.1f}, right={r['right']:.1f})"
        )


def main():
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(viewport=VIEWPORT, accept_downloads=True)
        page = ctx.new_page()
        console_errors = []
        page.on("console", lambda m: console_errors.append(f"console.{m.type}: {m.text}") if m.type == "error" else None)
        page.on("pageerror", lambda e: console_errors.append(f"pageerror: {e}"))

        try:
            boot(page, SEED_ACTIVE_JS)
            # La ruta activa sin sesión ya no muestra la barra de acciones; arrancar
            # una sesión rápida deja el editor real para el flujo de F105.
            page.goto(BASE, wait_until="networkidle")
            page.locator("button", has_text="Full Body Express").first.click()
            page.wait_for_timeout(1500)

            # La sesión rápida abre el calentamiento encima del editor: saltarlo
            # deja la barra de acciones y la lista de ejercicios interactivas.
            skip_warm = page.locator("button", has_text="Saltar calentamiento")
            if skip_warm.count() > 0:
                skip_warm.first.click()
                page.wait_for_timeout(500)

            # Flujo real hasta el resumen post-guardado (patrón de F95.2).
            page.locator("button", has_text="Añadir ejercicio").first.click()
            page.wait_for_selector('input[aria-label="Buscar ejercicio"]', state="visible", timeout=5000)
            page.fill('input[aria-label="Buscar ejercicio"]', "Sentadilla E2E")
            page.wait_for_timeout(400)
            page.locator('button[aria-label="Agregar Sentadilla E2E"]').first.click()
            page.wait_for_timeout(600)

            page.fill('input[aria-label="Peso en kg"]', "100")
            page.fill('input[aria-label="Repeticiones"]', "5")
            page.locator('button[aria-label="Marcar completada"]').first.click()
            page.wait_for_timeout(500)

            # El descanso automático oculta la barra fija; detenerlo antes de finalizar.
            pause = page.locator('button[aria-label="Pausar"]')
            if pause.count() > 0:
                pause.first.click()
                page.wait_for_timeout(400)

            page.locator("button", has_text="Finalizar entreno").first.click()
            page.wait_for_timeout(1000)
            # Los modales de logros y bitácora tapan el resumen; cerrarlos primero
            # deja visible el bloque de compartir.
            close_achievements(page)
            dismiss_journal_sheet(page)
            # El bloque de compartir vive colapsado tras «Compartir como imagen».
            page.locator("button", has_text="Compartir como imagen").first.click()
            page.wait_for_selector("[data-photo-pr]", state="visible", timeout=15000)
            page.wait_for_timeout(1000)

            # ── Assert 1: el bloque de compartir cabe a 360 ────────────
            block = page.locator("[data-photo-pr]").first
            block.scroll_into_view_if_needed()
            page.wait_for_timeout(300)

            block_rect = rect(block)
            print(f"[medicion] viewport={page.evaluate('window.innerWidth')} bloque={block_rect}")

            fits("bloque de compartir", block_rect, VIEWPORT["width"], errors)

            canvas = block.locator("canvas").first
            if canvas.count() == 0:
                errors.append("layout: sin canvas dentro del bloque de compartir")
            else:
                canvas_rect = rect(canvas)
                print(f"[medicion] canvas={canvas_rect}")
                fits("canvas de la tarjeta", canvas_rect, VIEWPORT["width"], errors)

            dl_btn = block.locator("button", has_text="Descargar").first
            if dl_btn.count() == 0:
                errors.append("layout: sin botón Descargar en el bloque de compartir")
            else:
                dl_rect = rect(dl_btn)
                print(f"[medicion] boton Descargar={dl_rect}")
                fits("botón Descargar", dl_rect, VIEWPORT["width"], errors)

            share_btn = block.locator("button", has_text="Compartir").first
            if share_btn.count() == 0:
                errors.append("layout: sin botón Compartir en el bloque de compartir")
            else:
                share_rect = rect(share_btn)
                print(f"[medicion] boton Compartir={share_rect}")
                fits("botón Compartir", share_rect, VIEWPORT["width"], errors)

            # Grid de stats del resumen (Volumen/Series/Duración/Ejercicios):
            # el rediseño reemplazó el carrusel SwipeRow; se mide el grid actual.
            stats_root = page.locator("div.grid.grid-cols-3").filter(has_text="Duración").first
            if stats_root.count() == 0:
                errors.append("layout: grid de stats no encontrado en el resumen")
            else:
                stats_rect = rect(stats_root)
                print(f"[medicion] grid de stats 360: {stats_rect}")
                fits("grid de stats", stats_rect, VIEWPORT["width"], errors)

            page.screenshot(path=os.path.join(os.path.dirname(__file__), "shots", "f105-resumen-360.png"), full_page=False)

            # ── Assert 2: web sin share nativo → cae a descarga ────────
            support = page.evaluate("({ canShare: typeof navigator.canShare, share: typeof navigator.share })")
            print(f"[share] soporte real en headless: canShare={support['canShare']} share={support['share']}")
            # Simula la ausencia de la Web Share API (el WebView nativo no la expone).
            page.evaluate("""() => {
              for (const key of ['canShare', 'share']) {
                try { Object.defineProperty(navigator, key, { value: undefined, configurable: true }) } catch {}
              }
            }""")
            stubbed = page.evaluate("({ canShare: typeof navigator.canShare, share: typeof navigator.share })")
            if stubbed["canShare"] != "undefined" or stubbed["share"] != "undefined":
                errors.append(f"share: no se pudo simular la ausencia de share nativo: {stubbed}")
            else:
                share_btn = page.locator("[data-photo-pr]").first.locator("button", has_text="Compartir").first
                if share_btn.count() == 0:
                    errors.append("share: sin botón Compartir en el bloque")
                else:
                    try:
                        with page.expect_download(timeout=10000) as dl:
                            share_btn.click()
                        filename = dl.value.suggested_filename
                        print(f"[share] descarga OK: {filename}")
                        if "gymlab" not in filename:
                            errors.append(f"share: descarga con nombre inesperado: {filename}")
                    except Exception as e:
                        errors.append(f"share: Compartir sin share nativo no disparó descarga: {e}")
        except Exception as e:
            errors.append(f"Exception: {e}")
        finally:
            if console_errors:
                errors.extend(console_errors)
            ctx.close()
            browser.close()

    if errors:
        print("ERRORS:")
        for e in errors:
            print(f"  - {e}")
        sys.exit(1)
    else:
        print("ALL OK")


if __name__ == "__main__":
    main()
