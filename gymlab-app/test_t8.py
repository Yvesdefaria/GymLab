"""Test T8: Verificar sombra degradada en routine-cards."""
from playwright.sync_api import sync_playwright, expect

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 375, 'height': 812})
        
        errors = []
        
        print("T8: Navegando a /rutinas...")
        page.goto('http://localhost:5173/rutinas')
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(800)
        
        # 1. Verificar que hay routine-cards
        cards = page.locator('.routine-card')
        count = cards.count()
        print(f"  Cards encontrados: {count}")
        
        if count == 0:
            errors.append("No hay routine-cards")
        else:
            # 2. Verificar box-shadow de los primeros 3 cards
            for i in range(min(3, count)):
                card = cards.nth(i)
                shadow = card.evaluate("el => window.getComputedStyle(el).boxShadow")
                print(f"  Card {i+1} shadow: {shadow[:120]}...")
                
                # Verificar que tiene offset positivo X/Y (sombra top-left)
                # "18px 14px" o similar indica offset desde top-left
                if '18px' in shadow or '12px' in shadow or '10px' in shadow:
                    print(f"  ✓ Card {i+1} tiene sombra direccional top-left")
                else:
                    errors.append(f"Card {i+1} sin sombra direccional")
        
        # 3. Screenshot
        page.screenshot(path='/tmp/t8_rutinas.png', full_page=True)
        print("  Screenshot: /tmp/t8_rutinas.png")
        
        # 4. Verificar que la página home también funciona
        page.goto('http://localhost:5173/')
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(500)
        
        try:
            expect(page.locator('header')).to_be_visible()
            expect(page.locator('nav[aria-label="Navegación principal"]')).to_be_visible()
            print("  ✓ Home OK")
        except Exception as e:
            errors.append(f"Home error: {e}")
        
        page.screenshot(path='/tmp/t8_home.png')
        print("  Screenshot: /tmp/t8_home.png")
        
        browser.close()
        
        # Resultado
        print("\n=== RESULTADO T8 ===")
        if errors:
            print(f"FALLO: {errors}")
            return False
        else:
            print("T8 PASSED — Sombras degradadas aplicadas correctamente")
            return True

if __name__ == '__main__':
    ok = main()
    exit(0 if ok else 1)