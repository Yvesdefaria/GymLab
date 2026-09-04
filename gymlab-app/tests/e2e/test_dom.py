"""Sonda de diagnóstico DOM: truncación de títulos, scroll/flex de StatRow,
focus-visible en recharts, leyendas de composición, botones de zonas y donut."""
import os

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"


def check(name, result):
    status = "OK" if result else "FAIL"
    print(f"  {status} {name}")


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 390, "height": 844})

    print("\n=== HOME ===")
    page.goto(BASE + "/")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(1000)

    h2 = page.locator("h2.font-display").first
    if h2.count() > 0:
        classes = h2.get_attribute("class") or ""
        check("h2 has truncate class", "truncate" in classes)
        check("h2 has min-w-0 class", "min-w-0" in classes)
        overflow = h2.evaluate(
            "el => ({ scrollWidth: el.scrollWidth, clientWidth: el.clientWidth, text: el.textContent })"
        )
        print(f"    h2 text: '{overflow['text']}'")
        print(f"    scrollWidth={overflow['scrollWidth']}, clientWidth={overflow['clientWidth']}")
        if overflow["scrollWidth"] > overflow["clientWidth"]:
            check("h2 is truncated (scrollWidth > clientWidth with truncate class)", True)
        else:
            print("    (text fits, truncation not needed or already fitting)")
    else:
        check("h2 found", False)

    print("\n=== ESTADISTICAS ===")
    page.goto(BASE + "/estadisticas")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(1500)

    stat_rows = page.locator("[class*='overflow-x-auto']")
    count = stat_rows.count()
    check(f"Found {count} overflow-x-auto containers", count > 0)

    stat_items = page.locator("[class*='flex-shrink-0'][class*='rounded-xl']")
    item_count = stat_items.count()
    check(f"Found {item_count} stat items with flex-shrink-0", item_count > 0)

    has_outline_none = page.evaluate(
        """() => {
        const rules = [];
        for (const sheet of document.styleSheets) {
            try {
                for (const rule of sheet.cssRules) {
                    if (rule.selectorText && rule.selectorText.includes('recharts') && rule.selectorText.includes('focus')) {
                        rules.push(rule.selectorText + ' -> ' + rule.style.outline);
                    }
                }
            } catch (e) {}
        }
        return rules;
    }"""
    )
    check(f"CSS focus-visible override for recharts: {has_outline_none}", len(has_outline_none) > 0)

    print("\n=== GRASA CORPORAL (CompositionChart) ===")
    page.goto(BASE + "/grasa-corporal")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(1000)

    areas = page.evaluate(
        """() => {
        const areas = document.querySelectorAll('.recharts-area-area');
        return Array.from(areas).map(a => a.getAttribute('name') || a.getAttribute('data-name') || 'NO NAME');
    }"""
    )
    print(f"  Area names: {areas}")

    legends = page.evaluate(
        """() => {
        const items = document.querySelectorAll('.recharts-legend-item-text');
        return Array.from(items).map(i => i.textContent);
    }"""
    )
    print(f"  Legend texts: {legends}")
    print(f"  All legends on page: {legends}")

    print("\n=== MEDIDAS CORPORALES ===")
    page.goto(BASE + "/medidas-corporales")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(1000)

    zone_btns = page.evaluate(
        """() => {
        const container = document.querySelector('[class*="flex-nowrap"][class*="overflow-x-auto"]');
        if (!container) return { found: false };
        const btns = container.querySelectorAll('button');
        return {
            found: true,
            count: btns.length,
            labels: Array.from(btns).map(b => b.textContent),
            containerWidth: container.clientWidth,
            scrollWidth: container.scrollWidth,
            canScroll: container.scrollWidth > container.clientWidth,
            containerClasses: container.className,
        };
    }"""
    )
    if zone_btns["found"]:
        check("Zone buttons container found", True)
        check(f"{zone_btns['count']} zone buttons: {zone_btns['labels']}", zone_btns["count"] > 3)
        print(f"    containerWidth={zone_btns['containerWidth']}, scrollWidth={zone_btns['scrollWidth']}")
        print(f"    canScroll: {zone_btns['canScroll']}")
        print(f"    classes: {zone_btns['containerClasses']}")
    else:
        check("Zone buttons container found", False)

    print("\n=== PESO CORPORAL ===")
    page.goto(BASE + "/peso-corporal")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(1000)

    has_chart = page.locator(".recharts-wrapper").count()
    check("BodyWeightChart rendered", has_chart > 0)

    print("\n=== COMPOSITION DONUT ===")
    page.goto(BASE + "/grasa-corporal")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(1000)

    donut_info = page.evaluate(
        """() => {
        const pies = document.querySelectorAll('.recharts-pie-sector');
        const legends = document.querySelectorAll('.recharts-legend-item-text');
        return {
            pieSectors: pies.length,
            legendTexts: Array.from(legends).map(l => l.textContent),
        };
    }"""
    )
    print(f"  Pie sectors: {donut_info['pieSectors']}")
    print(f"  Legend texts: {donut_info['legendTexts']}")

    browser.close()
    print("\n=== DONE ===")