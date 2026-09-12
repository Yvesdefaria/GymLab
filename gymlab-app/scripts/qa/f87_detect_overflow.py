"""F87: Detect horizontal overflow issues programmatically at narrow viewports."""
from playwright.sync_api import sync_playwright
import json, os

VIEWPORTS = {
    "320": {"width": 320, "height": 568},
    "375": {"width": 375, "height": 667},
}

ROUTES = [
    "/", "/rutinas", "/estadisticas", "/mas", "/perfil", "/ajustes",
    "/nutricion", "/suplementacion", "/logros", "/fotos-progreso",
    "/peso-corporal", "/grasa-corporal", "/calculadoras",
    "/calculadoras/imc", "/calculadoras/calorias", "/wearables",
]

DETECT_JS = """() => {
    const vw = window.innerWidth;
    const issues = [];

    // 1. Check if body/document has horizontal scroll
    const docWidth = Math.max(
        document.body.scrollWidth,
        document.documentElement.scrollWidth,
        document.body.offsetWidth,
        document.documentElement.offsetWidth
    );
    if (docWidth > vw + 2) {
        issues.push({type: 'body-overflow', docWidth, vw});
    }

    // 2. Check all visible elements for exceeding viewport
    const els = document.querySelectorAll('*');
    for (const el of els) {
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) continue;
        const style = getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue;

        // Right edge overflow
        if (rect.right > vw + 2) {
            const tag = el.tagName.toLowerCase();
            const cls = el.className?.toString().slice(0, 80) || '';
            const text = el.textContent?.slice(0, 40) || '';
            issues.push({
                type: 'right-overflow',
                tag, cls, text,
                right: Math.round(rect.right),
                width: Math.round(rect.width),
                vw
            });
        }

        // Left edge overflow (shouldn't happen but check)
        if (rect.left < -2) {
            const tag = el.tagName.toLowerCase();
            const cls = el.className?.toString().slice(0, 80) || '';
            issues.push({
                type: 'left-overflow',
                tag, cls,
                left: Math.round(rect.left),
                vw
            });
        }
    }

    // 3. Check for fixed-width elements wider than viewport
    const fixedWidthEls = document.querySelectorAll('[style*="width:"]');
    for (const el of fixedWidthEls) {
        const rect = el.getBoundingClientRect();
        const match = el.style.width.match(/(\\d+)px/);
        if (match && parseInt(match[1]) > vw) {
            issues.push({
                type: 'fixed-width',
                tag: el.tagName.toLowerCase(),
                cls: el.className?.toString().slice(0, 80) || '',
                elWidth: parseInt(match[1]),
                vw
            });
        }
    }

    // 4. Check tab bar for overlap at narrow widths
    const tabBar = document.querySelector('nav, [role="tablist"], .tab-bar');
    if (tabBar) {
        const tabs = tabBar.querySelectorAll('a, button, [role="tab"]');
        for (let i = 0; i < tabs.length - 1; i++) {
            const r1 = tabs[i].getBoundingClientRect();
            const r2 = tabs[i+1].getBoundingClientRect();
            if (r1.right > r2.left + 2) {
                issues.push({
                    type: 'tab-overlap',
                    tab1: tabs[i].textContent?.trim().slice(0, 20),
                    tab2: tabs[i+1].textContent?.trim().slice(0, 20),
                    gap: Math.round(r2.left - r1.right)
                });
            }
        }
    }

    // 5. Check buttons for minimum touch target size (44x44)
    const buttons = document.querySelectorAll('button, a[href], [role="button"]');
    for (const btn of buttons) {
        const rect = btn.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) continue;
        if (rect.width < 40 || rect.height < 36) {
            const text = btn.textContent?.trim().slice(0, 30) || '';
            if (!text) continue; // skip icon-only small elements
            issues.push({
                type: 'small-touch-target',
                tag: btn.tagName.toLowerCase(),
                text,
                w: Math.round(rect.width),
                h: Math.round(rect.height)
            });
        }
    }

    // 6. Check text truncation (elements with overflow hidden + text)
    const textEls = document.querySelectorAll('h1, h2, h3, p, span, label');
    for (const el of textEls) {
        const rect = el.getBoundingClientRect();
        if (rect.right > vw + 2 && el.scrollWidth > el.clientWidth + 2) {
            const text = el.textContent?.trim().slice(0, 40) || '';
            issues.push({
                type: 'text-overflow',
                tag: el.tagName.toLowerCase(),
                text,
                scrollW: el.scrollWidth,
                clientW: Math.round(el.clientWidth)
            });
        }
    }

    return issues;
}"""

all_results = {}

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)

    for vp_name, vp in VIEWPORTS.items():
        all_results[vp_name] = {}
        page = browser.new_page(viewport=vp)

        for route in ROUTES:
            try:
                page.goto(f"http://localhost:5173{route}", wait_until="networkidle", timeout=10000)
                page.wait_for_timeout(500)
                issues = page.evaluate(DETECT_JS)
                if issues:
                    all_results[vp_name][route] = issues
                    print(f"⚠️  {vp_name}px {route}: {len(issues)} issues")
                else:
                    print(f"✅ {vp_name}px {route}: clean")
            except Exception as e:
                print(f"ERR {vp_name}px {route}: {e}")

        page.close()
    browser.close()

# Summary
print("\n" + "="*60)
print("SUMMARY")
print("="*60)
total = 0
for vp_name, routes in all_results.items():
    for route, issues in routes.items():
        total += len(issues)
        types = {}
        for i in issues:
            t = i['type']
            types[t] = types.get(t, 0) + 1
        print(f"\n{vp_name}px {route}:")
        for t, c in sorted(types.items()):
            print(f"  {t}: {c}")

print(f"\nTotal issues: {total}")

# Save full report
report_path = os.path.join(os.path.dirname(__file__), "..", "test-results", "f87-report.json")
os.makedirs(os.path.dirname(report_path), exist_ok=True)
with open(report_path, "w") as f:
    json.dump(all_results, f, indent=2, ensure_ascii=False)
print(f"Report saved to {report_path}")
