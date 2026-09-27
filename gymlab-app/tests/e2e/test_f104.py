"""F104.1: los bar charts no deben pintar el fondo gris del cursor del tooltip.

Al activar el tooltip sobre una barra, Recharts pinta por defecto un rectángulo
gris (fill #ccc, clase `.recharts-tooltip-cursor`) detrás de la barra activa.
El fix lo elimina (cursor={false}) y en su lugar marca la barra activa con un
borde sutil (clase `.recharts-active-bar`).

El test siembra entrenos y pasos por IndexedDB (mismo patrón que test_f90) y
recorre los bar charts de las tres rutas afectadas —/estadisticas (4), /perfil
(1) y /pasos (1)—: click en la primera barra visible de cada uno y verificación
de que no aparece el cursor y sí la barra activa. Los area/line charts no se
tocan: su cursor es una línea vertical y no forma parte del bug.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"

# Seed único: onboarding hecho, logros ya desbloqueados (evita el modal de
# celebración que intercepta clics), 4 entrenos en semanas distintas con series,
# y pasos de los últimos 3 días para que StepWeekChart tenga barras.
SEED_DATA_JS = """async () => {
  const openDb = () => new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const db = await openDb();
  const day = (offset) => {
    const d = new Date();
    d.setDate(d.getDate() - offset);
    return d.toISOString().slice(0, 10);
  };
  await new Promise((res, rej) => {
    const tx = db.transaction(['meta', 'exercises', 'workouts', 'workoutSets', 'dailySteps'], 'readwrite');
    tx.objectStore('meta').put({ key: 'onboardingDone', value: true });
    tx.objectStore('meta').put({
      key: 'unlockedAchievements',
      value: JSON.stringify([
        'primer-paso', 'inaugural', 'primer-reto', 'racha-4', 'racha-8', 'primera-marca',
        'volumen-semanal', 'sesiones-50', 'consistencia-4s', 'primera-cardio', 'ejercicios-100',
        'racha-16', 'pr-10kg', 'guias-completas', 'sesiones-500', 'primer-ano',
      ]),
    });
    tx.objectStore('exercises').put({
      id: 901, slug: 'sentadilla-f104', name: 'Sentadilla F104', muscleGroup: 'pierna',
      equipment: ['barra'], instructions: '', category: 'strength',
    });
    tx.objectStore('exercises').put({
      id: 902, slug: 'remo-f104', name: 'Remo F104', muscleGroup: 'espalda',
      equipment: ['barra'], instructions: '', category: 'strength',
    });
    tx.objectStore('exercises').put({
      id: 903, slug: 'press-banca-f104', name: 'Press banca F104', muscleGroup: 'pecho',
      equipment: ['barra'], instructions: '', category: 'strength',
    });
    for (const [wid, off] of [[9301, 3], [9302, 10], [9303, 17], [9304, 24]]) {
      const d = day(off);
      tx.objectStore('workouts').put({
        id: wid, startedAt: `${d}T17:00:00.000Z`, finishedAt: `${d}T18:00:00.000Z`,
        routineId: null, routineDayId: null, localDate: d, notes: '', totalVolume: 2000 + off * 100,
      });
      // 3 grupos musculares: el chart horizontal necesita varias barras para
      // tener altura útil (con una sola queda un sliver de pocos px).
      for (const [k, exId] of [[1, 901], [2, 902], [3, 903]]) {
        tx.objectStore('workoutSets').put({
          id: wid * 10 + k, workoutId: wid, exerciseId: exId, setNumber: 1,
          weightKg: 80, reps: 10, completed: true, createdAt: `${d}T17:0${k}:00.000Z`,
        });
      }
    }
    const stepRow = (id, date, steps) => ({
      id, localDate: date, steps,
      distanceKm: Math.round(steps * 0.0007 * 100) / 100,
      calories: Math.round(steps * 0.04),
      source: 'manual', syncedAt: `${date}T20:00:00.000Z`,
    });
    tx.objectStore('dailySteps').put(stepRow(9701, day(0), 9200));
    tx.objectStore('dailySteps').put(stepRow(9702, day(1), 7400));
    tx.objectStore('dailySteps').put(stepRow(9703, day(2), 6100));
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  return true;
}"""


def boot(page):
    """Arranca la app, siembra la DB y recarga con los datos listos.

    Con `domcontentloaded` + espera de montaje: el primer load del dev server
    puede tardar por la re-optimización de deps (cache compartido por junction)
    y `load`/`networkidle` se cuelgan en arranque en frío.
    """
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


def close_drilldowns(page):
    """Cierra (best-effort) los paneles de detalle que abre el click en algunas barras.

    El panel anima max-height y queda tapado por header/nav fijos, así que el
    click puede ser interceptado: es limpieza, no una aserción, y no debe frenar
    el test.
    """
    for _ in range(3):
        close = page.locator('button[aria-label="Cerrar detalle"]')
        if close.count() == 0:
            return
        try:
            close.first.click(timeout=2000, force=True)
        except Exception:  # noqa: BLE001
            return
        page.wait_for_timeout(200)


def check_bar_charts(page, page_name, errors, expected_min):
    """Recorre los bar charts de la página y valida cada uno.

    Solo considera wrappers con `.recharts-bar-rectangle` (los area/line/donut
    quedan fuera). Click en la primera barra visible y assert de cursor ausente
    + barra activa marcada.
    """
    tested = 0
    wrappers = page.locator(".recharts-wrapper")
    for i in range(wrappers.count()):
        wrapper = wrappers.nth(i)
        bars = wrapper.locator(".recharts-bar-rectangle")
        if bars.count() == 0:
            continue
        # Elige la barra con mayor área: evita slivers de pocos px y estados
        # transitorios de re-render. Reintenta una vez por si la query vive.
        target = None
        for attempt in range(2):
            best_area = 2
            for j in range(bars.count()):
                box = bars.nth(j).bounding_box()
                if not box:
                    continue
                area = box["width"] * box["height"]
                if area > best_area:
                    target = bars.nth(j)
                    best_area = area
            if target is not None:
                break
            page.wait_for_timeout(500)
        if target is None:
            errors.append(f"[{page_name}] chart #{i}: barras sin caja visible")
            continue
        target.scroll_into_view_if_needed()
        page.wait_for_timeout(250)
        target.click(timeout=5000)

        # La barra activa se monta en una capa z-index tras el click: esperar a
        # que exista (auto-retry) en vez de un timeout fijo.
        active_locator = wrapper.locator(".recharts-active-bar")
        try:
            active_locator.first.wait_for(state="attached", timeout=6000)
        except Exception:  # noqa: BLE001
            # Fallback: el click pudo no activar el tooltip; hover sobre la misma
            # barra lo activa (el bug aplica igual a hover/tap).
            try:
                target.hover(timeout=3000)
            except Exception:  # noqa: BLE001
                pass
            try:
                active_locator.first.wait_for(state="attached", timeout=4000)
            except Exception:  # noqa: BLE001
                pass

        cursor = wrapper.locator(".recharts-tooltip-cursor").count()
        active = active_locator.count()
        if cursor != 0:
            errors.append(f"[{page_name}] chart #{i}: fondo del cursor visible ({cursor})")
        if active < 1:
            errors.append(f"[{page_name}] chart #{i}: barra activa sin borde")
        else:
            # Además de la clase, el borde debe estar pintado (stroke real, no none/0).
            shape = wrapper.locator(".recharts-active-bar path, .recharts-active-bar rect").first
            stroke = shape.evaluate("el => el.getAttribute('stroke') || getComputedStyle(el).stroke")
            stroke_width = shape.evaluate("el => el.getAttribute('stroke-width') || getComputedStyle(el).strokeWidth")
            if not stroke or stroke == "none":
                errors.append(f"[{page_name}] chart #{i}: barra activa sin stroke ({stroke})")
            if stroke_width in ("0px", "0", "", None):
                errors.append(f"[{page_name}] chart #{i}: stroke con ancho 0")
        tested += 1
        close_drilldowns(page)
    if tested < expected_min:
        errors.append(f"[{page_name}] bar charts encontrados: {tested} (< {expected_min})")
    print(f"{page_name}: {tested} bar charts verificados")


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

            # /estadisticas (tab Entreno por defecto): VolumeChart, FrequencyChart,
            # VolumeByMuscleChart y VolumeRangeChart son bar charts.
            page.goto(f"{BASE}/estadisticas", wait_until="domcontentloaded", timeout=120000)
            page.wait_for_selector(".recharts-bar-rectangle", timeout=30000)
            page.wait_for_timeout(800)
            check_bar_charts(page, "/estadisticas", errors, expected_min=4)

            # /perfil (tab Resumen por defecto): VolumeChart.
            page.goto(f"{BASE}/perfil", wait_until="domcontentloaded", timeout=120000)
            page.wait_for_selector(".recharts-bar-rectangle", timeout=30000)
            page.wait_for_timeout(600)
            check_bar_charts(page, "/perfil", errors, expected_min=1)

            # /pasos: StepWeekChart.
            page.goto(f"{BASE}/pasos", wait_until="domcontentloaded", timeout=120000)
            page.wait_for_selector(".recharts-bar-rectangle", timeout=30000)
            page.wait_for_timeout(600)
            check_bar_charts(page, "/pasos", errors, expected_min=1)
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
    print("ALL OK: F104.1 (sin fondo de cursor y barra activa marcada en bar charts)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
