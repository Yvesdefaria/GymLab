"""Test T8: Sombra degradada + foco de luz en routine-cards y .panel-elevated."""
from playwright.sync_api import sync_playwright, expect


def check_phone(page, errors):
    print("  Viewport 375x812 (iPhone)...")
    page.goto('http://localhost:5173/rutinas')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(800)

    cards = page.locator('.routine-card')
    count = cards.count()
    print(f"  Cards encontrados: {count}")
    if count == 0:
        errors.append("No hay routine-cards")
        return

    for i in range(min(3, count)):
        card = cards.nth(i)
        shadow = card.evaluate("el => window.getComputedStyle(el).boxShadow")
        before = card.evaluate("el => window.getComputedStyle(el, '::before').backgroundImage")
        transition = card.evaluate("el => window.getComputedStyle(el).transitionProperty")
        print(f"  Card {i+1} shadow: {shadow[:100]}...")
        print(f"  Card {i+1} ::before bg: {before[:100]}...")
        print(f"  Card {i+1} transition: {transition}")

        if 'rgb(0, 0, 0)' not in shadow and 'rgba(0, 0, 0' not in shadow:
            errors.append(f"Card {i+1} sin sombra negra degradada")
        if 'radial-gradient' not in before:
            errors.append(f"Card {i+1} sin foco de luz radial en ::before")
        if 'box-shadow' not in transition:
            errors.append(f"Card {i+1} sin transición de box-shadow")

    page.screenshot(path='C:/Users/Yves De Faria/Desktop/ProyectoGymLab/gymlab-app/t8_rutinas_phone.png', full_page=True)

    page.goto('http://localhost:5173/rutinas/ppl-volumen')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(800)
    elevated = page.locator('.panel-elevated')
    if elevated.count() == 0:
        errors.append("No hay .panel-elevated en RutinaDetailPage")
    else:
        shadow = elevated.first.evaluate("el => window.getComputedStyle(el).boxShadow")
        bg = elevated.first.evaluate("el => window.getComputedStyle(el).backgroundImage")
        print(f"  .panel-elevated shadow: {shadow[:100]}...")
        print(f"  .panel-elevated bg: {bg[:100]}...")
        if 'rgba(0, 0, 0' not in shadow and 'rgb(0, 0, 0)' not in shadow:
            errors.append(".panel-elevated sin sombra profunda")
        if 'radial-gradient' not in bg:
            errors.append(".panel-elevated sin foco de luz radial")
    page.screenshot(path='C:/Users/Yves De Faria/Desktop/ProyectoGymLab/gymlab-app/t8_detail_phone.png', full_page=True)


def check_tablet(page, errors):
    print("  Viewport 768x1024 (iPad)...")
    page.goto('http://localhost:5173/rutinas')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(800)

    cards = page.locator('.routine-card')
    count = cards.count()
    print(f"  Cards encontrados: {count}")
    if count > 0:
        card = cards.first
        box = card.bounding_box()
        viewport_w = page.evaluate("window.innerWidth")
        shell = page.locator('main').bounding_box()
        print(f"  Card box: {box}")
        print(f"  Viewport: {viewport_w}, main box: {shell}")
        if box and shell:
            center_card = box['x'] + box['width'] / 2
            center_shell = shell['x'] + shell['width'] / 2
            if abs(center_card - center_shell) > 4:
                errors.append("Cards no centradas respecto al shell en tablet")

    page.screenshot(path='C:/Users/Yves De Faria/Desktop/ProyectoGymLab/gymlab-app/t8_rutinas_tablet.png', full_page=True)


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        errors = []
        phone = browser.new_page(viewport={'width': 375, 'height': 812})
        tablet = browser.new_page(viewport={'width': 768, 'height': 1024})
        check_phone(phone, errors)
        check_tablet(tablet, errors)
        phone.close()
        tablet.close()
        browser.close()

        print("\n=== RESULTADO T8 ===")
        if errors:
            print(f"FALLO: {errors}")
            return False
        print("T8 PASSED — Sombra degradada, foco de luz y panel-elevated OK (375x812 + 768x1024)")
        return True


if __name__ == '__main__':
    ok = main()
    exit(0 if ok else 1)
