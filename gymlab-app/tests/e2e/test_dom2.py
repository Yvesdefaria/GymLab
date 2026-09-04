"""Sonda de diagnóstico: vuelca el texto visible y los charts de las páginas
principales, cuenta errores de consola y comprueba elementos 'stat'."""
import os

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 390, "height": 844})

    pages_to_check = [
        (BASE + "/", "HOME"),
        (BASE + "/estadisticas", "ESTADISTICAS"),
        (BASE + "/grasa-corporal", "GRASA CORPORAL"),
        (BASE + "/medidas-corporales", "MEDIDAS"),
        (BASE + "/peso-corporal", "PESO"),
        (BASE + "/perfil", "PERFIL"),
    ]

    for url, name in pages_to_check:
        page.goto(url)
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(1000)

        text = page.evaluate("() => document.body.innerText.substring(0, 2000)")
        print(f"\n=== {name} ({url}) ===")
        print(text[:1500])

        charts = page.evaluate(
            """() => ({
            rechartsWrappers: document.querySelectorAll('.recharts-wrapper').length,
            rechartsAreas: document.querySelectorAll('.recharts-area-area').length,
            rechartsPies: document.querySelectorAll('.recharts-pie').length,
            svgs: document.querySelectorAll('.recharts-surface').length,
        })"""
        )
        print(f"  Charts: {charts}")

        db_check = page.evaluate(
            """() => {
        return { skinfolds: indexedDB.databases ? 'has databases API' : 'no databases API' };
    }"""
        )
        print(f"\nIndexedDB: {db_check}")

    errors = []
    page.on("console", lambda msg: errors.append(f"{msg.type}: {msg.text}") if msg.type == "error" else None)
    page.goto(BASE + "/estadisticas")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(2000)

    if errors:
        print("\nConsole errors:")
        for e in errors[:10]:
            print(f"  {e}")
    else:
        print("\nNo console errors")

    print("\n=== Checking actual StatRow.tsx source ===")

    statrow_check = page.evaluate(
        """() => {
        const all = document.querySelectorAll('[class*="stat"], [class*="Stat"]');
        return {
            count: all.length,
            classes: Array.from(all).map(e => e.className.substring(0, 100)),
        };
    }"""
    )
    print(f"  Elements with 'stat' in class: {statrow_check}")

    browser.close()