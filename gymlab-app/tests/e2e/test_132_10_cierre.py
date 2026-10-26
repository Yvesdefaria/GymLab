"""F132.10 — Cierre Nocturno Minimal: barrido de las 42 rutas con pantalla.

Contratos que protege:
- Cada ruta monta React, tiene texto y no emite `pageerror` al cargar.
- Cero contenedores `.panel-light` / `.panel-chart` / `.panel-hero` renderizados.
- La TabBar global está visible y sin overflow horizontal del documento.
- Captura de viewport a 375 y 768 para la revisión visual de cierre.

Rutas dinámicas con datos reales del seed: rutina `ppl-volumen`, ejercicio
`barbell-full-squat`, guía `progresion-sobrecarga`, paper
`volume-vs-intensity-hypertrophy` y workout `9001` sembrado en IndexedDB.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import sync_playwright

from scripts.e2e_utils import base_url

ARTIFACTS = os.path.join(".tmp", "132.10-audit")

ROUTES = [
    ("/", "home"),
    ("/entrenamiento/active", "entrenamiento-active"),
    ("/entrenamiento/9001", "entrenamiento-9001"),
    ("/rutinas", "rutinas"),
    ("/rutinas/nueva", "rutinas-nueva"),
    ("/rutinas/planificador", "rutinas-planificador"),
    ("/rutinas/ppl-volumen/editar", "rutinas-editar"),
    ("/rutinas/ppl-volumen", "rutinas-detalle"),
    ("/papers", "papers"),
    ("/papers/volume-vs-intensity-hypertrophy", "papers-detalle"),
    ("/mas", "mas"),
    ("/pasos", "pasos"),
    ("/ajustes", "ajustes"),
    ("/wearables", "wearables"),
    ("/perfil/historial", "perfil-historial"),
    ("/perfil", "perfil"),
    ("/peso-corporal", "peso-corporal"),
    ("/calendario", "calendario"),
    ("/cuerpo", "cuerpo"),
    ("/guias", "guias"),
    ("/guias/progresion-sobrecarga", "guias-detalle"),
    ("/calculadoras", "calculadoras"),
    ("/calculadoras/imc", "calculadoras-imc"),
    ("/calculadoras/calorias", "calculadoras-calorias"),
    ("/calculadoras/1rm", "calculadoras-1rm"),
    ("/calculadoras/agua", "calculadoras-agua"),
    ("/calculadoras/conversor", "calculadoras-conversor"),
    ("/calculadoras/medidas", "calculadoras-medidas"),
    ("/calculadoras/grasa", "calculadoras-grasa"),
    ("/calculadoras/navy", "calculadoras-navy"),
    ("/ejercicios", "ejercicios"),
    ("/ejercicios/barbell-full-squat", "ejercicios-detalle"),
    ("/timer", "timer"),
    ("/nutricion", "nutricion"),
    ("/suplementos", "suplementos"),
    ("/progreso-fotos", "progreso-fotos"),
    ("/progreso-fotos/comparar", "progreso-fotos-comparar"),
    ("/logros", "logros"),
    ("/terminos", "terminos"),
    ("/privacidad", "privacidad"),
    ("/objetivos", "objetivos"),
    ("/estadisticas", "estadisticas"),
]

CONTENT = {
    "/": "Entrenar",
    "/entrenamiento/active": "Finalizar entreno",
    "/entrenamiento/9001": "Sentadilla con peso corporal",
    "/rutinas": "Rutinas",
    "/rutinas/nueva": "Nueva rutina",
    "/rutinas/planificador": "Planificador",
    "/rutinas/ppl-volumen/editar": "Solo puedes editar rutinas propias.",
    "/rutinas/ppl-volumen": "PPL Volumen",
    "/papers": "Papers",
    "/papers/volume-vs-intensity-hypertrophy": "Volume vs. Intensity",
    "/mas": "Más",
    "/pasos": "Pasos",
    "/ajustes": "Ajustes",
    "/wearables": "Wearables",
    "/perfil/historial": "Historial",
    "/perfil": "Perfil",
    "/peso-corporal": "Peso corporal",
    "/calendario": "Calendario",
    "/cuerpo": "Cuerpo",
    "/guias": "Guías",
    "/guias/progresion-sobrecarga": "Progresión y sobrecarga",
    "/calculadoras": "Calculadoras",
    "/calculadoras/imc": "IMC",
    "/calculadoras/calorias": "Calorías",
    "/calculadoras/1rm": "1RM",
    "/calculadoras/agua": "Agua",
    "/calculadoras/conversor": "Conversor",
    "/calculadoras/medidas": "Medidas",
    "/calculadoras/grasa": "Grasa",
    "/calculadoras/navy": "Navy",
    "/ejercicios": "Ejercicios",
    "/ejercicios/barbell-full-squat": "Sentadilla completa con barra",
    "/timer": "Temporizador",
    "/nutricion": "Nutrición",
    "/suplementos": "Suplementos",
    "/progreso-fotos": "Fotos de progreso",
    "/progreso-fotos/comparar": "Comparar fotos",
    "/logros": "Logros",
    "/terminos": "Términos",
    "/privacidad": "Privacidad",
    "/objetivos": "Objetivos",
    "/estadisticas": "Estadísticas",
}

SEED_JS = """async () => {
  const openDb = () => new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const db = await openDb();
  const now = new Date();
  const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const startedAt = new Date(now.getTime() - 45 * 60000).toISOString();
  const finishedAt = now.toISOString();
  await new Promise((res, rej) => {
    const tx = db.transaction(['meta', 'workouts', 'workoutSets'], 'readwrite');
    const meta = tx.objectStore('meta');
    meta.put({ key: 'onboardingDone', value: 'true' });
    meta.put({ key: 'settings', value: JSON.stringify({ language: 'es', showSectionTips: false }) });
    tx.objectStore('workouts').put({
      id: 9001, startedAt, finishedAt, routineId: null, routineDayId: null,
      localDate, notes: 'Auditoría 132.10', totalVolume: 1000,
    });
    tx.objectStore('workoutSets').put({
      id: 9001, workoutId: 9001, exerciseId: 1086, setNumber: 1,
      weightKg: 100, reps: 5, completed: true, createdAt: finishedAt,
    });
    tx.objectStore('workoutSets').put({
      id: 9002, workoutId: 9001, exerciseId: 1086, setNumber: 2,
      weightKg: 100, reps: 5, completed: true, createdAt: finishedAt,
    });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  db.close();
  return true;
}"""


def close_overlays(page):
    """Cierra el modal de logros (cola de celebración) antes de capturar."""
    for _ in range(6):
        dialog = page.locator("[role='dialog']")
        if dialog.count() == 0:
            return
        try:
            page.keyboard.press("Escape")
        except Exception:
            return
        page.wait_for_timeout(150)


def start_quick_session(page):
    """Deja una sesión activa real para que /entrenamiento/active no caiga al home."""
    try:
        button = page.locator("button", has_text="Full Body Express").first
        button.wait_for(state="visible", timeout=15000)
        button.click(timeout=5000)
        page.wait_for_timeout(1200)
        return True
    except Exception:
        return False


def audit_route(page, route, errors):
    page.goto(f"{base_url()}{route}", wait_until="load")
    page.wait_for_function(
        "() => document.getElementById('root')?.children.length > 0", timeout=20000
    )
    close_overlays(page)
    # Espera el texto propio de la ruta: evita capturar el shell vacío mientras
    # el chunk lazy de la página todavía está montando.
    page.wait_for_function(
        "(text) => document.body.innerText.toLowerCase().includes(text.toLowerCase())",
        arg=CONTENT[route],
        timeout=15000,
    )
    page.evaluate("() => document.fonts.ready")
    page.wait_for_timeout(200)

    body = page.inner_text("body").strip()
    if not body:
        errors.append(f"{route}: body vacío (pantalla negra)")
    if CONTENT[route].lower() not in body.lower():
        errors.append(f"{route}: falta el contenido «{CONTENT[route]}»")

    panels = page.locator(".panel-light, .panel-chart, .panel-hero").count()
    if panels:
        errors.append(f"{route}: {panels} contenedor(es) panel-* renderizados")

    if not page.locator('nav[data-tour="tabbar"]').is_visible():
        errors.append(f"{route}: TabBar no visible")

    overflow = page.evaluate(
        "() => document.documentElement.scrollWidth - document.documentElement.clientWidth"
    )
    if overflow > 1:
        errors.append(f"{route}: scroll horizontal de {overflow}px")


def run_view(browser, view_name, viewport):
    errors = []
    context = browser.new_context(viewport=viewport)
    page = context.new_page()
    page_errors = []
    page.on("pageerror", lambda e: page_errors.append(str(e)))

    page.goto(base_url(), wait_until="load")
    page.wait_for_function("() => document.getElementById('root')?.children.length > 0")
    assert page.evaluate(SEED_JS) is True, f"{view_name}: seed falló"
    page.reload(wait_until="load")
    page.wait_for_function("() => document.getElementById('root')?.children.length > 0")
    page.wait_for_timeout(1200)
    close_overlays(page)
    start_quick_session(page)

    shot_dir = os.path.join(ARTIFACTS, view_name)
    os.makedirs(shot_dir, exist_ok=True)

    for route, label in ROUTES:
        before = len(page_errors)
        try:
            audit_route(page, route, errors)
        except Exception as exc:  # noqa: BLE001 — el barrido reporta y sigue
            errors.append(f"{route}: excepción {exc}")
        new_errors = page_errors[before:]
        if new_errors:
            errors.append(f"{route}: pageerror(s) {new_errors[:2]}")
        try:
            page.screenshot(path=os.path.join(shot_dir, f"{label}.png"))
            print(f"OK [{view_name}] {route} ({label})", flush=True)
        except Exception as exc:  # noqa: BLE001
            errors.append(f"{route}: screenshot falló {exc}")

    context.close()
    return errors


def main():
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        try:
            errors += run_view(browser, "iphone", {"width": 375, "height": 812})
            errors += run_view(browser, "ipad", {"width": 768, "height": 1024})
        finally:
            browser.close()

    if errors:
        print("ERRORS:")
        for error in errors:
            print(f"  - {error}")
        sys.exit(1)
    print(f"ALL OK — {len(ROUTES)} rutas × 2 viewports")


if __name__ == "__main__":
    main()
