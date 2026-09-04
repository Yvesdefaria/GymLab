"""Sonda de diagnóstico: inspecciona los scripts servidos, el service worker,
el HTML y el JS/CSS servidos por Vite (busca marcadores de cambios)."""
import json
import os
import re

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 390, "height": 844})

    page.goto(BASE + "/")
    page.wait_for_load_state("networkidle")

    scripts = page.evaluate(
        """() => {
        return Array.from(document.querySelectorAll('script[src]')).map(s => s.getAttribute('src'));
    }"""
    )
    print(f"Scripts: {scripts}")

    sw_check = page.evaluate(
        """async () => {
        const regs = await navigator.serviceWorker.getRegistrations();
        return regs.map(r => ({
            scope: r.scope,
            active: r.active ? r.active.scriptURL : null,
            installing: r.installing ? r.installing.scriptURL : null,
            waiting: r.waiting ? r.waiting.scriptURL : null,
        }));
    }"""
    )
    print(f"Service workers: {json.dumps(sw_check, indent=2)}")

    html = page.content()
    script_tags = re.findall(r'<script[^>]*src="([^"]*)"', html)
    print(f"Script tags in HTML: {script_tags}")

    for src in script_tags:
        if "index" in src.lower() or "estadisticas" in src.lower():
            url = src if src.startswith("http") else BASE + src
            resp = page.evaluate(
                """async ([u]) => {
                const r = await fetch(u);
                const text = await r.text();
                return {
                    has_flex_shrink: text.includes('flex-shrink-0'),
                    has_truncate_home: text.includes('min-w-0 truncate'),
                    has_focus_recharts: text.includes('recharts-surface :focus-visible'),
                    has_bone_formula: text.includes('0.128'),
                    has_carga_media: text.includes('cargaMedia'),
                    len: text.length,
                };
            }""",
                [url],
            )
            print(f"\n{src}: {resp}")

    css_links = page.evaluate(
        """() => {
        return Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map(l => l.href);
    }"""
    )
    print(f"\nCSS links: {css_links}")

    for href in css_links:
        if "index" in href.lower():
            url = href if href.startswith("http") else BASE + href
            resp = page.evaluate(
                """async ([u]) => {
                const r = await fetch(u);
                const text = await r.text();
                return {
                    has_focus_recharts: text.includes('recharts-surface :focus-visible'),
                    len: text.length,
                };
            }""",
                [url],
            )
            print(f"CSS {url}: {resp}")

    browser.close()