"""Sonda de diagnóstico: verifica que Vite sirve los módulos con las clases
esperadas (tras hot-reload) y que no hay errores de consola en /estadisticas."""
import os

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"

FILES_TO_CHECK = [
    ("/src/components/stats/StatRow.tsx", "flex-shrink-0"),
    ("/src/components/stats/ChartCard.tsx", "font-bold tracking-wide"),
    ("/src/components/body/BodyMeasurementsChart.tsx", "flex-nowrap"),
    ("/src/pages/EntrenarPage.tsx", "min-w-0 truncate"),
    ("/src/components/stats/FrequencyChart.tsx", "Target"),
    ("/src/index.css", "recharts-surface :focus-visible"),
]

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 390, "height": 844})

    page.goto(BASE + "/")
    page.wait_for_load_state("networkidle")

    for filepath, expected in FILES_TO_CHECK:
        url = f"{BASE}{filepath}"
        try:
            content = page.evaluate(
                """async ([u, needle]) => {
                const r = await fetch(u);
                if (!r.ok) return { status: r.status, found: false };
                const text = await r.text();
                return { status: r.status, found: text.includes(needle), len: text.length };
            }""",
                [url, expected],
            )
            status = "OK" if content.get("found") else "MISS"
            print(f"  {status} {filepath} (looking for '{expected}'): {content}")
        except Exception as e:
            print(f"  ERROR {filepath}: {e}")

    result = page.evaluate(
        """async () => {
        try {
            const mod = await import('/src/components/stats/StatRow.tsx');
            return { keys: Object.keys(mod), hasStatRow: 'StatRow' in mod };
        } catch (e) {
            return { error: e.message };
        }
    }"""
    )
    print(f"\nDynamic import StatRow: {result}")

    errors = []
    page.on("console", lambda msg: errors.append(msg.text) if msg.type == "error" else None)
    page.goto(BASE + "/estadisticas")
    page.wait_for_timeout(2000)
    if errors:
        print(f"\nConsole errors: {errors[:5]}")

    browser.close()