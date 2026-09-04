"""Sonda de diagnóstico: tras limpiar SW + caches, verificar que /estadisticas
sigue renderizando filas, items y charts (regresión de datos cacheados)."""
import os

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    ctx = browser.new_context(viewport={"width": 390, "height": 844})
    page = ctx.new_page()

    page.goto(BASE + "/")
    page.wait_for_load_state("networkidle")

    result = page.evaluate(
        """async () => {
        const regs = await navigator.serviceWorker.getRegistrations();
        for (const reg of regs) {
            await reg.unregister();
        }
        const keys = await caches.keys();
        for (const key of keys) {
            await caches.delete(key);
        }
        return { unregistered: regs.length, cachesCleared: keys.length };
    }"""
    )
    print(f"SW unregistered: {result['unregistered']}, Caches cleared: {result['cachesCleared']}")

    page.reload()
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(2000)

    page.goto(BASE + "/estadisticas")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(1500)

    stat_rows = page.locator("[class*='overflow-x-auto']").count()
    stat_items = page.locator("[class*='flex-shrink-0']").count()
    recharts = page.locator(".recharts-wrapper").count()
    print(f"After cache clear - stat_rows: {stat_rows}, stat_items: {stat_items}, charts: {recharts}")

    scripts = page.evaluate(
        """() => {
        return Array.from(document.querySelectorAll('script[src]'))
            .map(s => s.src)
            .filter(s => s.includes('index'));
    }"""
    )
    print(f"Index script: {scripts}")

    ctx.close()
    browser.close()