"""Fase 93 #7: filtro jerárquico de ejercicios por zona específica.

Verifica que (paso 4 del Task 8 — smoke manual automatizado):
- `/ejercicios` muestra la fila de grupos musculares y, al tocar «Pierna»,
  aparece la 2.ª fila con las zonas Cuádriceps/Femoral/Gemelo/Abductor/Aductor.
- Al filtrar por «Cuádriceps» el catalogo se restringe a un subconjunto exacto
  (13 de 873) e incluye las sentadillas, extensión, prensa y zancadas.
- Cambiar de grupo (p. ej. a «Pecho») limpia la zona seleccionada (sin fila de
  zonas residual inválida).
- En la ficha de «Sentadilla con barra» aparecen los badges de zona
  «Cuádriceps», «Femoral» y «Glúteo mayor».
- 0 errores de consola.
"""
import re
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"

# Curated cuádriceps exercises that must appear when filtering Pierna → Cuádriceps.
QUADRICEPS_CURATED = {
    "sentadilla-con-barra",
    "sentadilla-goblet",
    "prensa-de-piernas",
    "extension-de-piernas",
    "zancadas",
}

# Nº de resultados esperado al filtrar Pierna → Cuádriceps (curated + inferidos).
QUADRICEPS_EXPECTED = 13

# Ficha en la que se verifican los badges de zona.
ZONES_PAGE_EXERCISE = ("sentadilla-con-barra", ["Cuádriceps", "Femoral", "Glúteo mayor"])


def parse_count(body: str):
    m = re.search(r"(\d+)\s*de\s*(\d+)\s+ejercicios", body)
    return (int(m.group(1)), int(m.group(2))) if m else (None, None)


def collect_exercise_links(page, target: int):
    # La lista está virtualizada: hace falta hacer scroll para cargar todos los resultados.
    seen = set()
    for _ in range(60):
        for h in page.locator("a[href^='/ejercicios/']").all():
            href = h.get_attribute("href")
            if href:
                seen.add(href.removeprefix("/ejercicios/"))
        if len(seen) >= target:
            break
        page.mouse.wheel(0, 2000)
        page.wait_for_timeout(200)
    return seen


def main():
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 375, "height": 812})
        page = context.new_page()
        console_errors = []
        page.on("console", lambda m: console_errors.append(f"console.{m.type}: {m.text}") if m.type == "error" else None)
        page.on("pageerror", lambda e: console_errors.append(f"pageerror: {e}"))

        try:
            page.goto(BASE, wait_until="networkidle")
            page.wait_for_timeout(1500)

            skip_ob = page.locator("button", has_text="Ya entreno aquí")
            if skip_ob.count() > 0:
                skip_ob.first.click(timeout=5000)
                page.wait_for_timeout(800)

            # --- Biblioteca de ejercicios: filtro jerárquico ---
            page.goto(f"{BASE}/ejercicios", wait_until="networkidle")
            page.wait_for_timeout(1200)

            body = page.inner_text("body")
            _, total = parse_count(body)
            if not total or total <= 100:
                errors.append(f"Total de ejercicios inesperado: {total}")

            # 1) Tocar «Pierna» → aparece la 2.ª fila con las zonas del grupo.
            pierna = page.locator("button", has_text=re.compile(r"^Pierna$"))
            if pierna.count() == 0:
                errors.append("Chip «Pierna» no visible en /ejercicios")
            else:
                pierna.first.click()
                page.wait_for_timeout(600)
                zona_row = page.locator("button", has_text=re.compile(r"^Zona$"))
                if zona_row.count() == 0:
                    errors.append("No aparece la fila de zonas al seleccionar «Pierna»")
                else:
                    zona_text = page.inner_text("body")
                    for label in ["Cuádriceps", "Femoral", "Gemelo", "Abductor", "Aductor"]:
                        if label not in zona_text:
                            errors.append(f"Falta la zona «{label}» en la fila de Pierna")

            # 2) Filtrar por Cuádriceps → subconjunto exacto con los curados.
            cuad = page.locator("button", has_text=re.compile(r"^Cuádriceps$"))
            if cuad.count() == 0:
                errors.append("Chip «Cuádriceps» no visible tras seleccionar Pierna")
            else:
                cuad.first.click()
                page.wait_for_timeout(600)
                body = page.inner_text("body")
                count, t2 = parse_count(body)
                if not (count == QUADRICEPS_EXPECTED and t2 == total):
                    errors.append(f"Filtrar Cuádriceps: esperaba {QUADRICEPS_EXPECTED} de {total}, vi {count} de {t2}")
                hrefs = collect_exercise_links(page, QUADRICEPS_EXPECTED)
                missing = QUADRICEPS_CURATED - hrefs
                if missing:
                    errors.append(f"Ejercicios curados de cuádriceps no presentes tras filtrar: {sorted(missing)}")

            # 3) Cambiar de grupo («Pecho») limpia la zona y no deja zona residual.
            pecho = page.locator("button", has_text=re.compile(r"^Pecho$"))
            if pecho.count() == 0:
                errors.append("Chip «Pecho» no visible")
            else:
                pecho.first.click()
                page.wait_for_timeout(600)
                active_cuad = page.locator('button[aria-pressed="true"]', has_text="Cuádriceps")
                if active_cuad.count() > 0:
                    errors.append("La zona «Cuádriceps» quedó activa al cambiar a «Pecho»")
                if "Cuádriceps" in page.inner_text("body"):
                    errors.append("La zona «Cuádriceps» sigue visible con «Pecho» seleccionado")

            # 4) Ficha de ejercicio: badges de zona.
            slug, expected = ZONES_PAGE_EXERCISE
            page.goto(f"{BASE}/ejercicios/{slug}", wait_until="networkidle")
            page.wait_for_timeout(900)
            zona_ul = page.locator('ul[aria-label="Zonas trabajadas"]')
            if zona_ul.count() == 0:
                errors.append(f"Sin bloque de zonas en /ejercicios/{slug}")
            else:
                labels = zona_ul.inner_text().splitlines()
                for exp in expected:
                    if exp not in labels:
                        errors.append(f"Ficha {slug}: falta badge «{exp}» (vi {labels})")

        except Exception as e:
            errors.append(f"Exception: {e}")
        finally:
            if console_errors:
                errors.extend(console_errors)
            page.close()
            browser.close()

    if errors:
        print("ERRORS:")
        for e in errors:
            print(f"  - {e}")
        sys.exit(1)
    else:
        print("ALL OK")


if __name__ == "__main__":
    main()
