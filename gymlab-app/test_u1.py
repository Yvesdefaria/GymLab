"""Test U1: touch targets >= 44px efectivos en botones solo-icono.

Verifica el area de pulsacion efectiva (box + inset del ::after usado para
ampliar el hit-area a 44px) en botones con aria-label y sin texto visible.
Dual: iPhone 375x812 + iPad 768x1024.
"""
import sys

from scripts.e2e_utils import run_views, base_url

# Paginas con botones solo-icono (favoritos, cerrar, descartar, toggles).
PAGES = ["/ejercicios", "/calculadoras/conversor", "/mas"]


def effective_hit_areas(page):
    """Devuelve [{label, w, h}] de botones solo-icono visibles con hit-area < 44px."""
    return page.evaluate(
        """() => {
        const small = [];
        document.querySelectorAll('button').forEach((btn) => {
            const r = btn.getBoundingClientRect();
            const after = getComputedStyle(btn, '::after');
            const inset = after && after.left ? Math.abs(parseFloat(after.left) || 0) : 0;
            const effW = r.width + inset * 2;
            const effH = r.height + inset * 2;
            const hasText = (btn.textContent || '').trim().length > 0;
            const hasLabel = btn.hasAttribute('aria-label');
            // Solo botones icon-only (sin texto) con nombre accesible o aria-pressed.
            if (!hasText && (hasLabel || btn.hasAttribute('aria-pressed'))) {
                if (effW < 44 || effH < 44) {
                    small.push({ label: btn.getAttribute('aria-label') || btn.getAttribute('aria-pressed') || '?', w: Math.round(effW), h: Math.round(effH) });
                }
            }
        });
        return small;
    }"""
    )


def assert_touch_targets(page, view_name, shot):
    for path in PAGES:
        page.goto(f"{base_url()}{path}", wait_until="networkidle")
        page.wait_for_timeout(600)

        close_btn = page.get_by_role("button", name="Ya entreno aquí")
        if close_btn.count():
            close_btn.first.click()
            page.wait_for_timeout(300)
            page.goto(f"{base_url()}{path}", wait_until="networkidle")
            page.wait_for_timeout(600)

        small = effective_hit_areas(page)
        assert not small, f"{path}: botones solo-icono con hit-area < 44px: {small}"

    page.screenshot(path=shot, full_page=False)


def main():
    errors = run_views({"iphone": assert_touch_targets, "ipad": assert_touch_targets}, __file__, "u1")
    if errors:
        print("FALLO:", *errors, sep="\n  ")
        return 1
    print("U1 PASSED — touch targets >=44px en 375x812 y 768x1024")
    return 0


if __name__ == "__main__":
    sys.exit(main())
