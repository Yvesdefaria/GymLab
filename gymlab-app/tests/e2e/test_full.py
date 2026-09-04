"""Sonda de diagnóstico: limpia SW + caches, lista los stores de IndexedDB y
recorre las páginas principales verificando charts, overflow, flex-shrink,
bordes dorados, reglas CSS focus-visible y estado vacío."""
import os

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"

DB_NAME = "GymLabDB"


def check(label, condition):
    status = "OK" if condition else "FAIL"
    print(f"  {status} {label}")


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    ctx = browser.new_context(viewport={"width": 390, "height": 844})
    page = ctx.new_page()

    page.goto(BASE + "/")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(1000)

    page.evaluate(
        """async () => {
        const regs = await navigator.serviceWorker.getRegistrations();
        for (const r of regs) await r.unregister();
        const keys = await caches.keys();
        for (const k of keys) await caches.delete(k);
    }"""
    )

    stores = page.evaluate(
        """async (name) => {
        await new Promise(r => setTimeout(r, 500));
        const req = indexedDB.open(name);
        return new Promise(resolve => {
            req.onsuccess = () => resolve(Array.from(req.result.objectStoreNames));
            req.onerror = () => resolve([]);
        });
    }""",
        DB_NAME,
    )
    print(f"Dexie stores: {stores}")

    pages_check = [
        ("/", "HOME"),
        ("/estadisticas", "ESTADISTICAS"),
        ("/peso-corporal", "PESO"),
        ("/grasa-corporal", "GRASA"),
        ("/medidas-corporales", "MEDIDAS"),
        ("/perfil", "PERFIL"),
    ]

    for path, name in pages_check:
        page.goto(BASE + path)
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(1500)

        info = page.evaluate(
            """() => {
            const recharts = document.querySelectorAll('.recharts-wrapper').length;
            const overflowContainers = document.querySelectorAll('[style*="overflow-x-auto"], [class*="overflow-x-auto"]').length;
            const flexShrinkItems = document.querySelectorAll('[class*="flex-shrink-0"]').length;
            const chartCards = document.querySelectorAll('[class*="border-gold"]').length;
            const focusVisibleRules = (() => {
                let count = 0;
                for (const sheet of document.styleSheets) {
                    try {
                        for (const rule of sheet.cssRules) {
                            if (rule.selectorText && rule.selectorText.includes('focus-visible') && rule.selectorText.includes('recharts')) {
                                count++;
                            }
                        }
                    } catch (e) {}
                }
                return count;
            })();
            const bodyText = document.body.innerText;
            const hasEmptyState = bodyText.includes('Todavía no hay datos');
            return { recharts, overflowContainers, flexShrinkItems, chartCards, focusVisibleRules, hasEmptyState };
        }"""
        )

        print(f"\n=== {name} ===")
        check(f"Recharts rendered: {info['recharts']}", info["recharts"] > 0)
        check(f"overflow-x-auto elements: {info['overflowContainers']}", info["overflowContainers"] > 0)
        check(f"flex-shrink-0 items: {info['flexShrinkItems']}", info["flexShrinkItems"] > 0)
        check(f"ChartCard (gold border): {info['chartCards']}", info["chartCards"] > 0)
        check(f"Focus-visible CSS rules for recharts: {info['focusVisibleRules']}", info["focusVisibleRules"] > 0)
        if info["hasEmptyState"]:
            print("    WARN: empty state 'Todavía no hay datos' — no data to render charts")

    print("\n=== CHECKING BUILT CSS ===")
    page.goto(BASE + "/")
    css_check = page.evaluate(
        """async () => {
        const r = await fetch('/src/index.css');
        const text = await r.text();
        return {
            has_recharts_focus: text.includes('.recharts-surface :focus-visible'),
            has_outline_none: text.includes('outline: none'),
        };
    }"""
    )
    check("CSS has recharts focus-visible override", css_check["has_recharts_focus"])
    check("CSS has outline: none", css_check["has_outline_none"])

    print("\n=== CHECKING BUILT COMPONENTS ===")
    sr = page.evaluate(
        """async () => {
        const r = await fetch('/src/components/stats/StatRow.tsx');
        const text = await r.text();
        return {
            has_flex_shrink: text.includes('flex-shrink-0'),
            has_overflow: text.includes('overflow-x-auto'),
            has_scrollbar_none: text.includes('scrollbarWidth'),
        };
    }"""
    )
    check("StatRow has flex-shrink-0", sr["has_flex_shrink"])
    check("StatRow has overflow-x-auto", sr["has_overflow"])
    check("StatRow has scrollbarWidth: none", sr["has_scrollbar_none"])

    ctx.close()
    browser.close()