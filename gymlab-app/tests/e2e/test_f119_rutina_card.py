"""F119: la tarjeta de rutina es estable con nombres largos.

Fija los criterios del diseño (spec 2026-10-01-f119-tarjeta-rutina-layout-design.md)
midiendo /rutinas a 360x800 con 4 rutinas sembradas (larga / media / corta / clon):

- todas las cards miden lo mismo (altura uniforme);
- la estrella de favorito está adentro de la card y en la MISMA posición en todas;
- el título clampa a <= 2 líneas y muestra «...» cuando excede;
- ni la card ni el badge «Basada en ...» desbordan en horizontal;
- click real en la estrella togglea aria-pressed;
- 0 pageerror.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"

TITLES = {
    "larga": "Full Body Hipertrofia Avanzada con Fuerza y Volumen Extremo Semanal",
    "media": "Torso Superior Hipertrofia y Fuerza",
    "corta": "Pierna A",
    "clon": "Pierna B",
}

SEED_JS = """async () => {
  const openDb = () => new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const db = await openDb();
  await new Promise((res, rej) => {
    const tx = db.transaction(['routines', 'meta'], 'readwrite');
    tx.objectStore('meta').put({ key: 'onboardingDone', value: 'true' });
    tx.objectStore('routines').put({ id: 10001, slug: 'custom-larga', title: 'Full Body Hipertrofia Avanzada con Fuerza y Volumen Extremo Semanal', objective: 'fuerza', level: 'intermedio', description: '', daysCount: 3, isCustom: true });
    tx.objectStore('routines').put({ id: 10002, slug: 'custom-corta', title: 'Pierna A', objective: 'fuerza', level: 'principiante', description: '', daysCount: 3, isCustom: true });
    tx.objectStore('routines').put({ id: 10003, slug: 'custom-clon', title: 'Pierna B', objective: 'fuerza', level: 'principiante', description: '', daysCount: 3, isCustom: true, basedOnId: 10001 });
    tx.objectStore('routines').put({ id: 10004, slug: 'custom-media', title: 'Torso Superior Hipertrofia y Fuerza', objective: 'fuerza', level: 'intermedio', description: '', daysCount: 4, isCustom: true });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  return true;
}"""

# Mide la card que contiene `title`: geometria de card/boton, clamp del titulo y desbordes.
# El titulo se localiza como primer hijo de la fila (existe antes y despues del fix).
MEASURE_JS = """(title) => {
  const cards = [...document.querySelectorAll('.routine-card')];
  const card = cards.find((c) => c.textContent.includes(title));
  if (!card) return { found: false };
  const q = (sel) => card.querySelector(sel);
  const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return { x: +b.x.toFixed(1), y: +b.y.toFixed(1), h: +b.height.toFixed(1), right: +b.right.toFixed(1) }; };
  const link = q('.routine-card__link');
  const titleEl = q('.routine-card__row > span:first-child');
  const btn = q('button[aria-pressed]');
  const cardBox = r(card);
  const btnBox = r(btn);
  const line = titleEl ? parseFloat(getComputedStyle(titleEl).lineHeight) : 0;
  return {
    found: true,
    cardH: cardBox.h,
    cardRight: cardBox.right,
    cardOverflowX: card.scrollWidth - card.clientWidth,
    starX: btnBox.x,
    starRight: btnBox.right,
    starRelY: +(btnBox.y - cardBox.y).toFixed(1),
    titleLines: line ? +(titleEl.getBoundingClientRect().height / line).toFixed(2) : null,
    titleClamped: titleEl.scrollHeight > titleEl.clientHeight + 1,
    linkOverflowX: link.scrollWidth - link.clientWidth,
  };
}"""


def boot(page):
    # `load` + esperas explicitas: networkidle puede colgarse con el websocket de HMR en frio.
    page.goto(BASE, wait_until="load", timeout=60000)
    page.wait_for_timeout(1000)
    assert page.evaluate(SEED_JS) is True, "seed fallo"
    page.reload(wait_until="load", timeout=60000)
    page.wait_for_timeout(1200)
    skip = page.locator("button", has_text="Ya entreno aquí")
    if skip.count() > 0:
        skip.first.click(timeout=5000)
        page.wait_for_timeout(600)
    dialog = page.locator('[role="dialog"]')
    if dialog.count() > 0:
        page.keyboard.press("Escape")
        page.wait_for_timeout(300)


def main() -> int:
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 360, "height": 800})
        page_errors = []
        page.on("pageerror", lambda e: page_errors.append(str(e)))

        boot(page)
        page.goto(f"{BASE}/rutinas", wait_until="load", timeout=60000)
        page.wait_for_timeout(1200)
        # El tip de seccion ("Entendido") tapa las cards de abajo: cerrarlo antes de medir.
        tip = page.locator("button", has_text="Entendido")
        if tip.count() > 0:
            tip.first.click()
            page.wait_for_timeout(400)

        data = {}
        for key, title in TITLES.items():
            data[key] = page.evaluate(MEASURE_JS, title)
            if not data[key].get("found"):
                errors.append(f"{key}: no se encontro la card de «{title}»")

        if not errors:
            heights = [d["cardH"] for d in data.values()]
            if max(heights) - min(heights) > 1:
                errors.append("alturas desiguales: " + str({k: v["cardH"] for k, v in data.items()}))
            for key, d in data.items():
                if d["cardH"] < 108 or d["cardH"] > 140:
                    errors.append(f"{key}: altura de card fuera de rango: {d['cardH']}px")
                if d["starRight"] > d["cardRight"] + 0.5:
                    errors.append(f"{key}: la estrella desborda la card (right {d['starRight']} > {d['cardRight']})")
                if d["cardOverflowX"] > 0:
                    errors.append(f"{key}: desborde horizontal de la card: {d['cardOverflowX']}px")
                if d["linkOverflowX"] > 0:
                    errors.append(f"{key}: el link desborda: {d['linkOverflowX']}px")
                if d["titleLines"] is None or d["titleLines"] > 2.01:
                    errors.append(f"{key}: el titulo supera 2 lineas ({d['titleLines']})")

            xs = {d["starX"] for d in data.values()}
            ys = {d["starRelY"] for d in data.values()}
            if max(xs) - min(xs) > 0.5 or max(ys) - min(ys) > 0.5:
                errors.append(f"la estrella no esta en el mismo punto en todas: x={sorted(xs)} y={sorted(ys)}")

            if not data["larga"]["titleClamped"]:
                errors.append("larga: el titulo largo no activa la elipsis (clamp inactivo)")

            # Click real en la estrella de la card larga: togglea aria-pressed.
            btn = page.locator('.routine-card', has_text=TITLES["larga"]).locator('button[aria-pressed]').first
            before = btn.get_attribute("aria-pressed")
            btn.click(timeout=5000)
            page.wait_for_timeout(500)
            after = btn.get_attribute("aria-pressed")
            if before == after:
                errors.append(f"click en la estrella no togglea aria-pressed ({before} -> {after})")

        if page_errors:
            errors.append(f"pageerror: {page_errors}")

        browser.close()

    if errors:
        print(f"FALLO ({len(errors)}):")
        for err in errors:
            print(" -", err)
        return 1
    print("ALL OK: F119 tarjeta de rutina estable con nombres largos")
    return 0


if __name__ == "__main__":
    sys.exit(main())
