"""F104.2: el marcador del gauge de fuerza debe caer en la banda de su nivel.

Diagnóstico: el gauge pintaba 4 bandas con límites [p25, p50, p75, p90], pero
getStrengthLevel asigna "intermedio" recién desde p50. Cada banda mostraba el
color del nivel que EMPIEZA en su borde derecho, así que un e1rm en [p25, p50)
(principiante) caía visualmente sobre la banda pintada como "intermedio". La
fila de etiquetas usaba justify-between y no coincidía con ninguna banda.

El test siembra un benchmarkResult de sentadilla con e1rm 100 y peso corporal
80 (umbrales [80, 120, 160, 205] → nivel principiante) y en el tab Fuerza de
/estadisticas verifica:
1. Las 4 bandas miden lo de los umbrales reales sobre maxVal = p90 * 1.1:
   [53.2, 17.7, 20.0, 9.1] % (con el bug eran [35.5, 17.7, 17.7, 20.0] y
   dejaban el 9% final en gris).
2. El marcador (44.3%) cae dentro de la banda cuyo color corresponde al nivel
   del badge (principiante = bg-blue-400/20); con el bug caía en la banda
   intermedia (bg-accent/20).
3. Las 4 etiquetas de nivel ocupan el ancho de su banda (fix del justify-between).

El nivel se identifica por el color de fondo del badge (clase estable), no por
su texto, para que el test no dependa del idioma activo.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"

# e1rm 100 con bw 80 en sentadilla: maxVal = 205 * 1.1 = 225.5.
EXPECTED_WIDTHS = [53.215, 17.738, 19.955, 9.091]
EXPECTED_MARKER = 44.346
# Badge (sólido) → banda (translúcida) del mismo nivel.
BAND_BY_BADGE_COLOR = {
    "bg-blue-400": "bg-blue-400/20",
    "bg-accent": "bg-accent/20",
    "bg-orange-400": "bg-orange-400/20",
    "bg-red-400": "bg-red-400/20",
}

# Seed único: onboarding hecho y logros desbloqueados (evita el modal de
# celebración), más un benchmarkResult conocido.
SEED_DATA_JS = """async () => {
  const openDb = () => new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const db = await openDb();
  await new Promise((res, rej) => {
    const tx = db.transaction(['meta', 'benchmarkResults'], 'readwrite');
    tx.objectStore('meta').put({ key: 'onboardingDone', value: true });
    tx.objectStore('meta').put({
      key: 'unlockedAchievements',
      value: JSON.stringify([
        'primer-paso', 'inaugural', 'primer-reto', 'racha-4', 'racha-8', 'primera-marca',
        'volumen-semanal', 'sesiones-50', 'consistencia-4s', 'primera-cardio', 'ejercicios-100',
        'racha-16', 'pr-10kg', 'guias-completas', 'sesiones-500', 'primer-ano',
      ]),
    });
    tx.objectStore('benchmarkResults').put({
      id: 9901, exercise: 'sentadilla', weightKg: 100, reps: 1, e1rm: 100,
      bodyWeightKg: 80, testedAt: new Date().toISOString(),
    });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  return true;
}"""

# Mide el DOM del gauge: anchos de banda, posición del marcador, banda que lo
# contiene y anchos de la fila de etiquetas. Todo en % del ancho de la barra.
MEASURE_JS = """() => {
  const isLevelBadge = (el) => {
    const c = typeof el.className === 'string' ? el.className : '';
    return /(bg-blue-400|bg-accent|bg-orange-400|bg-red-400)(?![/-])/.test(c)
      && el.textContent.trim().length > 0;
  };
  const badge = [...document.querySelectorAll('span.rounded-full')].find(isLevelBadge);
  if (!badge) return { error: 'badge de nivel no encontrado' };
  const gauge = badge.closest('.rounded-xl');
  const bar = gauge ? gauge.querySelector('.overflow-hidden') : null;
  if (!bar) return { error: 'barra del gauge no encontrada' };
  const rect = bar.getBoundingClientRect();
  const wrapper = bar.firstElementChild;
  const marker = bar.lastElementChild;
  const bands = [...wrapper.children].map((b) => ({
    cls: b.className,
    widthPct: (b.getBoundingClientRect().width / rect.width) * 100,
  }));
  const markerPct = (parseFloat(getComputedStyle(marker).left) / rect.width) * 100;
  // Banda que contiene al marcador (borde start-inclusive, como el dominio).
  let start = 0;
  let markerBand = null;
  for (const b of bands) {
    const end = start + b.widthPct;
    if (markerPct >= start - 0.3 && markerPct < end - 0.3) { markerBand = b.cls; break; }
    start = end;
  }
  if (!markerBand && bands.length) markerBand = bands[bands.length - 1].cls;
  const marksRow = [...gauge.querySelectorAll('div.flex')].find(
    (d) => d.children.length === 4 && [...d.children].every((c) => c.tagName === 'SPAN')
  );
  const marks = marksRow ? [...marksRow.children].map((s) => ({
    text: s.textContent.trim(),
    widthPct: (s.getBoundingClientRect().width / rect.width) * 100,
  })) : [];
  return { badgeCls: badge.className, bands, markerPct, markerBand, marks };
}"""


def boot(page):
    """Arranca la app, siembra la DB y recarga con los datos listos."""
    page.goto(BASE, wait_until="domcontentloaded", timeout=120000)
    page.wait_for_selector("#root > *", timeout=120000)
    page.wait_for_timeout(800)
    assert page.evaluate(SEED_DATA_JS) is True, "seed fallo"
    page.reload(wait_until="domcontentloaded", timeout=120000)
    page.wait_for_selector("#root > *", timeout=120000)
    page.wait_for_timeout(900)
    skip = page.locator("button", has_text="Ya entreno aquí")
    if skip.count() > 0:
        skip.first.click(timeout=5000)
        page.wait_for_timeout(600)


def main():
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 390, "height": 844})
        page = context.new_page()
        console_errors = []
        page.on(
            "console",
            lambda m: console_errors.append(f"console.{m.type}: {m.text}") if m.type == "error" else None,
        )
        page.on("pageerror", lambda e: console_errors.append(f"pageerror: {e}"))
        try:
            boot(page)

            page.goto(f"{BASE}/estadisticas", wait_until="domcontentloaded", timeout=120000)
            page.wait_for_selector('[data-tab="fuerza"]', timeout=30000)
            page.click('[data-tab="fuerza"]')
            page.wait_for_selector("#tabnav-panel-fuerza span.rounded-full", timeout=30000)
            page.wait_for_timeout(700)

            data = page.evaluate(MEASURE_JS)
            if data.get("error"):
                errors.append(f"gauge: {data['error']}")
            else:
                bands = data["bands"]
                badge_cls = data["badgeCls"]
                colors = [k for k in BAND_BY_BADGE_COLOR if k in badge_cls]
                print(f"badge={colors or badge_cls}")
                print(f"bandas={[round(b['widthPct'], 2) for b in bands]}")
                print(f"marcador={data['markerPct']:.2f}% en banda={data['markerBand']}")
                print(f"etiquetas={[m['text'] for m in data['marks']]}")

                if len(bands) != 4:
                    errors.append(f"bandas: {len(bands)} (esperadas 4)")
                else:
                    for i, (band, exp) in enumerate(zip(bands, EXPECTED_WIDTHS)):
                        if abs(band["widthPct"] - exp) > 0.6:
                            errors.append(f"banda {i}: {band['widthPct']:.2f}% (esperada {exp}%)")
                    if abs(data["markerPct"] - EXPECTED_MARKER) > 0.6:
                        errors.append(f"marcador: {data['markerPct']:.2f}% (esperado {EXPECTED_MARKER}%)")

                if len(colors) != 1:
                    errors.append(f"badge sin color de nivel reconocible: {badge_cls}")
                elif BAND_BY_BADGE_COLOR[colors[0]] not in (data["markerBand"] or ""):
                    errors.append(
                        f"marcador en banda {data['markerBand']} pero el badge es {colors[0]} "
                        f"(esperada {BAND_BY_BADGE_COLOR[colors[0]]})"
                    )

                marks = data["marks"]
                if len(marks) != 4:
                    errors.append(f"fila de etiquetas: {len(marks)} spans (esperados 4)")
                else:
                    for i, (mark, band) in enumerate(zip(marks, bands)):
                        if not mark["text"]:
                            errors.append(f"etiqueta {i} vacía")
                        if abs(mark["widthPct"] - band["widthPct"]) > 1.5:
                            errors.append(
                                f"etiqueta {i} ('{mark['text']}'): {mark['widthPct']:.2f}% "
                                f"vs banda {band['widthPct']:.2f}%"
                            )
        except Exception as e:  # noqa: BLE001
            errors.append(f"Exception: {e}")
        finally:
            errors.extend(console_errors)
            page.close()
            context.close()
            browser.close()
    if errors:
        print("ERRORS:")
        for e in errors:
            print(f"  - {e}")
        return 1
    print("ALL OK: F104.2 (marcador en la banda de su nivel y bandas/etiquetas alineadas)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
