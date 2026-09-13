"""Fase 95: verificación e2e de la gamificación (F95.3 + F95.2 + F95.1).

Parte 1 (F95.3): barras de progreso accesibles en /logros.
Parte 2 (F95.2): foto de sesión en dos superficies:
  - Historial (/entrenamiento/:id): PRs derivados por ventana temporal
    ([startedAt, finishedAt], data-photo-pr), nombre de la rutina en el
    aria-label de la tarjeta, plantilla por defecto y switch con re-render.
  - Sesión activa real: tras finalizar el entreno, el resumen post-guardado
    muestra la foto con el prCount exacto del guardado y el fallback de nombre
    «Entreno libre» para sesiones sin rutina.
Parte 3 (F95.1): variantes de chapa y cola del modal:
  - Galería: la variante vigente se pinta en la medalla (data-variant) y un
    reload no duplica concesiones en meta.collectibles.
  - Cola: 4 logros nuevos ⇒ un ítem por pantalla con «1 de 4», avance con
    Escape y con el botón, y cierre al final.
  - Reduced motion: la celebración queda inerte — confeti estático visible
    (opacity .35), sin contador de cola con un solo ítem y con anuncio de
    variante nueva.

Cada parte corre en un browser context propio (IndexedDB limpia) para no
contaminar las aserciones de la otra. 0 errores de consola en todas.
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"

# Siembra F95.3: un entrenamiento, una serie cardio completada y un PR; meta con
# los 4 logros correspondientes ya desbloqueados (estado idempotente).
SEED_LOGROS_JS = """async () => {
  const openDb = () => new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const db = await openDb();
  await new Promise((res, rej) => {
    const tx = db.transaction(['exercises', 'workouts', 'workoutSets', 'prs', 'meta'], 'readwrite');
    tx.objectStore('exercises').put({ id: 10, slug: 'cinta', name: 'Cinta', muscleGroup: 'pierna', equipment: 'maquina', instructions: '', category: 'cardio' });
    tx.objectStore('workouts').put({ id: 1, startedAt: '2026-09-11T10:00:00.000Z', finishedAt: '2026-09-11T11:00:00.000Z', routineId: null, routineDayId: null, localDate: '2026-09-11', notes: '', totalVolume: 0 });
    tx.objectStore('workoutSets').put({ id: 1, workoutId: 1, exerciseId: 10, setNumber: 1, weightKg: 0, reps: 0, completed: true, createdAt: '2026-09-11T10:05:00.000Z', durationSeconds: 1200 });
    tx.objectStore('prs').put({ exerciseId: 10, weightKg: 100, reps: 5, date: '2026-09-11T11:00:00.000Z', estimated1RM: 112 });
    tx.objectStore('meta').put({ key: 'onboardingDone', value: 'true' });
    const ids = ['primer-paso', 'inaugural', 'primera-marca', 'primera-cardio'];
    tx.objectStore('meta').put({ key: 'unlockedAchievements', value: JSON.stringify(ids) });
    tx.objectStore('meta').put({ key: 'achievementCounts', value: JSON.stringify(Object.fromEntries(ids.map((id) => [id, 1]))) });
    tx.objectStore('meta').put({ key: 'achievementSnapshot', value: JSON.stringify(ids) });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  return true;
}"""

# Siembra F95.2 historial: dos sesiones y tres PRs en tabla para ejercitar la
# ventana temporal — solo el PR con date == finishedAt de cada sesión cuenta.
# La sesión 2 viene de la rutina «Fuerza A»; la 1 es un entreno libre.
SEED_HISTORY_JS = """async () => {
  const openDb = () => new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const db = await openDb();
  await new Promise((res, rej) => {
    const tx = db.transaction(['exercises', 'workouts', 'workoutSets', 'prs', 'routines', 'meta'], 'readwrite');
    tx.objectStore('exercises').put({ id: 10, slug: 'cinta', name: 'Cinta', muscleGroup: 'pierna', equipment: 'maquina', instructions: '', category: 'cardio' });
    tx.objectStore('exercises').put({ id: 21, slug: 'sentadilla', name: 'Sentadilla', muscleGroup: 'pierna', equipment: 'barra', instructions: '', category: 'strength' });
    tx.objectStore('exercises').put({ id: 30, slug: 'peso-muerto', name: 'Peso muerto', muscleGroup: 'espalda', equipment: 'barra', instructions: '', category: 'strength' });
    tx.objectStore('workouts').put({ id: 1, startedAt: '2026-09-11T10:00:00.000Z', finishedAt: '2026-09-11T11:00:00.000Z', routineId: null, routineDayId: null, localDate: '2026-09-11', notes: '', totalVolume: 0 });
    tx.objectStore('workoutSets').put({ id: 1, workoutId: 1, exerciseId: 10, setNumber: 1, weightKg: 0, reps: 0, completed: true, createdAt: '2026-09-11T10:05:00.000Z', durationSeconds: 1200 });
    tx.objectStore('workouts').put({ id: 2, startedAt: '2026-09-12T10:00:00.000Z', finishedAt: '2026-09-12T11:00:00.000Z', routineId: 5, routineDayId: null, localDate: '2026-09-12', notes: '', totalVolume: 2000 });
    tx.objectStore('workoutSets').put({ id: 2, workoutId: 2, exerciseId: 21, setNumber: 1, weightKg: 100, reps: 5, completed: true, createdAt: '2026-09-12T10:05:00.000Z' });
    tx.objectStore('workoutSets').put({ id: 3, workoutId: 2, exerciseId: 21, setNumber: 2, weightKg: 100, reps: 5, completed: true, createdAt: '2026-09-12T10:10:00.000Z' });
    tx.objectStore('routines').put({ id: 5, slug: 'fuerza-a', title: 'Fuerza A', objective: 'strength', level: 'beginner', description: '' });
    tx.objectStore('prs').put({ exerciseId: 10, weightKg: 100, reps: 5, date: '2026-09-11T11:00:00.000Z', estimated1RM: 112 });
    tx.objectStore('prs').put({ exerciseId: 21, weightKg: 100, reps: 5, date: '2026-09-12T11:00:00.000Z', estimated1RM: 112.5 });
    tx.objectStore('prs').put({ exerciseId: 30, weightKg: 90, reps: 10, date: '2026-09-12T13:00:00.000Z', estimated1RM: 120 });
    tx.objectStore('meta').put({ key: 'onboardingDone', value: 'true' });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  return true;
}"""

# Siembra F95.2 sesión activa: solo el catálogo del ejercicio a registrar (id
# fuera del rango del seed del catálogo para evitar carreras) y onboarding hecho.
SEED_ACTIVE_JS = """async () => {
  const openDb = () => new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const db = await openDb();
  await new Promise((res, rej) => {
    const tx = db.transaction(['exercises', 'meta'], 'readwrite');
    tx.objectStore('exercises').put({ id: 999, slug: 'sentadilla-e2e', name: 'Sentadilla E2E', muscleGroup: 'pierna', equipment: 'barra', instructions: '', category: 'strength' });
    tx.objectStore('meta').put({ key: 'onboardingDone', value: 'true' });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  return true;
}"""

# Siembra F95.1 galería: mismos 4 logros desbloqueados que la parte 1 pero con
# una variante de chapa ya concedida (primer-paso radiant). Snapshot == unlocked
# ⇒ el hook no detecta logros nuevos al cargar y no re-persiste colectibles.
SEED_VARIANTS_JS = """async () => {
  const openDb = () => new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const db = await openDb();
  await new Promise((res, rej) => {
    const tx = db.transaction(['exercises', 'workouts', 'workoutSets', 'prs', 'meta'], 'readwrite');
    tx.objectStore('exercises').put({ id: 10, slug: 'cinta', name: 'Cinta', muscleGroup: 'pierna', equipment: 'maquina', instructions: '', category: 'cardio' });
    tx.objectStore('workouts').put({ id: 1, startedAt: '2026-09-11T10:00:00.000Z', finishedAt: '2026-09-11T11:00:00.000Z', routineId: null, routineDayId: null, localDate: '2026-09-11', notes: '', totalVolume: 0 });
    tx.objectStore('workoutSets').put({ id: 1, workoutId: 1, exerciseId: 10, setNumber: 1, weightKg: 0, reps: 0, completed: true, createdAt: '2026-09-11T10:05:00.000Z', durationSeconds: 1200 });
    tx.objectStore('prs').put({ exerciseId: 10, weightKg: 100, reps: 5, date: '2026-09-11T11:00:00.000Z', estimated1RM: 112 });
    tx.objectStore('meta').put({ key: 'onboardingDone', value: 'true' });
    const ids = ['primer-paso', 'inaugural', 'primera-marca', 'primera-cardio'];
    tx.objectStore('meta').put({ key: 'unlockedAchievements', value: JSON.stringify(ids) });
    tx.objectStore('meta').put({ key: 'achievementCounts', value: JSON.stringify(Object.fromEntries(ids.map((id) => [id, 1]))) });
    tx.objectStore('meta').put({ key: 'achievementSnapshot', value: JSON.stringify(ids) });
    tx.objectStore('meta').put({ key: 'collectibles', value: JSON.stringify([{ achievementId: 'primer-paso', variantId: 'radiant' }]) });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  return true;
}"""

# Siembra F95.1 cola: los 4 logros se desbloquean SOLO a partir de datos reales
# (la meta de logros no existe) ⇒ al cargar, el hook detecta 4 nuevos y abre el
# modal con cola. Sin collectibles ni variantes.
SEED_QUEUE_JS = """async () => {
  const openDb = () => new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const db = await openDb();
  await new Promise((res, rej) => {
    const tx = db.transaction(['exercises', 'workouts', 'workoutSets', 'prs', 'meta'], 'readwrite');
    tx.objectStore('exercises').put({ id: 10, slug: 'cinta', name: 'Cinta', muscleGroup: 'pierna', equipment: 'maquina', instructions: '', category: 'cardio' });
    tx.objectStore('workouts').put({ id: 1, startedAt: '2026-09-11T10:00:00.000Z', finishedAt: '2026-09-11T11:00:00.000Z', routineId: null, routineDayId: null, localDate: '2026-09-11', notes: '', totalVolume: 0 });
    tx.objectStore('workoutSets').put({ id: 1, workoutId: 1, exerciseId: 10, setNumber: 1, weightKg: 0, reps: 0, completed: true, createdAt: '2026-09-11T10:05:00.000Z', durationSeconds: 1200 });
    tx.objectStore('prs').put({ exerciseId: 10, weightKg: 100, reps: 5, date: '2026-09-11T11:00:00.000Z', estimated1RM: 112 });
    tx.objectStore('meta').put({ key: 'onboardingDone', value: 'true' });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  return true;
}"""

# Siembra F95.1 variante nueva: un entreno real desbloquea primer-paso +
# inaugural, pero inaugural ya está en savedIds ⇒ el modal muestra UN ítem.
# El contador de primer-paso (1) +1 por la transición ⇒ count 2 ⇒ polished es
# la variante nueva (onyx exigiría count 4). Sin collectibles previos.
SEED_VARIANT_NEW_JS = """async () => {
  const openDb = () => new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const db = await openDb();
  await new Promise((res, rej) => {
    const tx = db.transaction(['exercises', 'workouts', 'workoutSets', 'meta'], 'readwrite');
    tx.objectStore('exercises').put({ id: 21, slug: 'sentadilla', name: 'Sentadilla', muscleGroup: 'pierna', equipment: 'barra', instructions: '', category: 'strength' });
    tx.objectStore('workouts').put({ id: 1, startedAt: '2026-09-11T10:00:00.000Z', finishedAt: '2026-09-11T11:00:00.000Z', routineId: null, routineDayId: null, localDate: '2026-09-11', notes: '', totalVolume: 0 });
    tx.objectStore('workoutSets').put({ id: 1, workoutId: 1, exerciseId: 21, setNumber: 1, weightKg: 100, reps: 5, completed: true, createdAt: '2026-09-11T10:05:00.000Z' });
    tx.objectStore('meta').put({ key: 'onboardingDone', value: 'true' });
    tx.objectStore('meta').put({ key: 'unlockedAchievements', value: JSON.stringify(['inaugural']) });
    tx.objectStore('meta').put({ key: 'achievementCounts', value: JSON.stringify({ 'primer-paso': 1, inaugural: 1 }) });
    tx.objectStore('meta').put({ key: 'achievementSnapshot', value: JSON.stringify(['inaugural']) });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  return true;
}"""


def boot(page, seed_js):
    """Carga la app, siembra IndexedDB y salta el onboarding si aparece."""
    page.goto(BASE, wait_until="networkidle")
    page.wait_for_timeout(800)
    seed = page.evaluate(seed_js)
    assert seed is True, f"seed fallo: {seed}"
    page.reload(wait_until="networkidle")
    page.wait_for_timeout(1000)
    skip_ob = page.locator("button", has_text="Ya entreno aquí")
    if skip_ob.count() > 0:
        skip_ob.first.click(timeout=5000)
        page.wait_for_timeout(800)


def check_photo_history(page, errors):
    """F95.2 historial: ventana temporal, nombre de rutina y switch de plantillas."""
    boot(page, SEED_HISTORY_JS)
    page.goto(f"{BASE}/entrenamiento/2", wait_until="networkidle")
    page.wait_for_timeout(1200)

    photo = page.locator("[data-photo-pr]").first
    if photo.count() == 0:
        errors.append("foto: no se renderiza la tarjeta en el detalle del historial")
    else:
        pr = photo.get_attribute("data-photo-pr")
        if pr != "1":
            errors.append(f"foto: PRs derivados por ventana != 1 en sesión de rutina: {pr}")
        if photo.get_attribute("data-photo-template") != "classic":
            errors.append(f"foto: plantilla por defecto != classic: {photo.get_attribute('data-photo-template')}")

        canvas = page.locator("canvas").first
        if canvas.count() == 0:
            errors.append("foto: sin canvas en el detalle del historial")
        else:
            w = canvas.evaluate("(el) => el.width")
            h = canvas.evaluate("(el) => el.height")
            if w != 1080 or h != 1080:
                errors.append(f"foto: tamaño de canvas != 1080x1080: {w}x{h}")
            arial = canvas.get_attribute("aria-label") or ""
            if "Fuerza A" not in arial:
                errors.append(f"foto: aria-label de la tarjeta sin nombre de rutina: {arial}")

        chips = page.locator("[data-template]")
        if chips.count() != 3:
            errors.append(f"foto: selector de plantillas no tiene 3 chips: {chips.count()}")

        # Cambiar de plantilla re-renderiza la misma tarjeta con los mismos datos.
        page.locator('[data-template="hero"]').first.click()
        page.wait_for_timeout(300)
        if photo.get_attribute("data-photo-template") != "hero":
            errors.append("foto: switch de plantilla no re-renderiza la tarjeta")

    # Entreno libre: fallback localizado «Entreno libre» y solo su propio PR cuenta
    # (el del otro workout del día queda fuera de la ventana).
    page.goto(f"{BASE}/entrenamiento/1", wait_until="networkidle")
    page.wait_for_timeout(1200)
    photo1 = page.locator("[data-photo-pr]").first
    if photo1.count() == 0:
        errors.append("foto: sin tarjeta en /entrenamiento/1")
    else:
        if photo1.get_attribute("data-photo-pr") != "1":
            errors.append(f"foto: PRs derivados en /entrenamiento/1 != 1: {photo1.get_attribute('data-photo-pr')}")
        canvas1 = page.locator("canvas").first
        arial = canvas1.get_attribute("aria-label") or ""
        if "Entreno libre" not in arial:
            errors.append(f"foto: fallback de nombre de entreno libre no aplicado: {arial}")

    page.screenshot(path=os.path.join(os.path.dirname(__file__), "shots", "f95-2-foto-historial.png"), full_page=False)


def check_photo_active(page, errors):
    """F95.2 resumen post-guardado: flujo real de sesión activa hasta finalizar."""
    boot(page, SEED_ACTIVE_JS)
    page.goto(f"{BASE}/entrenamiento/active", wait_until="networkidle")
    page.wait_for_timeout(1000)

    # Añadir el ejercicio desde el picker (búsqueda única, sin recientes).
    page.locator("button", has_text="Añadir ejercicio").first.click()
    page.wait_for_selector('input[aria-label="Buscar ejercicio"]', state="visible", timeout=5000)
    page.fill('input[aria-label="Buscar ejercicio"]', "Sentadilla E2E")
    page.wait_for_timeout(400)
    page.locator("button", has_text="Sentadilla E2E").first.click()
    page.wait_for_timeout(600)

    # El calentamiento guiado aparece tras añadir el primer ejercicio: saltarlo.
    skip_warm = page.locator("button", has_text="Saltar calentamiento")
    if skip_warm.count() > 0:
        skip_warm.first.click()
        page.wait_for_timeout(500)

    # Serie 100 kg × 5 completada: dispara la detección de PR en el guardado.
    page.fill('input[aria-label="Peso en kg"]', "100")
    page.fill('input[aria-label="Repeticiones"]', "5")
    page.locator('button[aria-label="Marcar completada"]').first.click()
    page.wait_for_timeout(500)

    page.locator("button", has_text="Finalizar entreno").first.click()
    page.wait_for_selector("[data-photo-pr]", state="visible", timeout=15000)
    page.wait_for_timeout(800)

    photo = page.locator("[data-photo-pr]").first
    if photo.get_attribute("data-photo-pr") != "1":
        errors.append(f"foto: resumen post-guardado prCount != 1: {photo.get_attribute('data-photo-pr')}")
    if photo.get_attribute("data-photo-template") != "classic":
        errors.append(f"foto: resumen plantilla por defecto != classic: {photo.get_attribute('data-photo-template')}")

    canvas = page.locator("canvas").first
    w = canvas.evaluate("(el) => el.width")
    if w != 1080:
        errors.append(f"foto: canvas del resumen != 1080: {w}")
    arial = canvas.get_attribute("aria-label") or ""
    if "Entreno libre" not in arial:
        errors.append(f"foto: resumen sin fallback de nombre de entreno libre: {arial}")

    page.screenshot(path=os.path.join(os.path.dirname(__file__), "shots", "f95-2-foto-resumen.png"), full_page=False)


def check_variants_gallery(page, errors):
    """F95.1 galería: la variante vigente se pinta en la medalla y el reload no
    duplica concesiones en meta.collectibles (idempotencia)."""
    boot(page, SEED_VARIANTS_JS)
    page.goto(f"{BASE}/logros", wait_until="networkidle")
    page.wait_for_timeout(1000)

    medal = page.locator('[data-achievement="primer-paso"]').first
    if medal.count() == 0:
        errors.append("variantes: sin medalla de primer-paso en /logros")
    else:
        if medal.get_attribute("data-variant") != "radiant":
            errors.append(f"variantes: data-variant de primer-paso != radiant: {medal.get_attribute('data-variant')}")

    # La variante se localiza por i18n: el aria-label de la medalla lleva «Radiante».
    arial = medal.get_attribute("aria-label") or ""
    if "Radiante" not in arial:
        errors.append(f"variantes: aria-label sin nombre de variante: {arial}")

    # Reload con el mismo estado: sin doble concesión (collectibles sigue con 1).
    page.reload(wait_until="networkidle")
    page.wait_for_timeout(1000)
    keep = page.evaluate("""async () => {
      const openDb = () => new Promise((res, rej) => {
        const r = indexedDB.open('GymLabDB');
        r.onsuccess = () => res(r.result);
        r.onerror = () => rej(r.error);
      });
      const db = await openDb();
      return new Promise((res, rej) => {
        const tx = db.transaction('meta', 'readonly');
        const get = tx.objectStore('meta').get('collectibles');
        // El valor almacenado ya es el JSON string (setJson); devolverlo tal cual.
        get.onsuccess = () => res(get.result ? get.result.value : null);
        get.onerror = () => rej(get.error);
      });
    }""")
    if keep != '[{"achievementId":"primer-paso","variantId":"radiant"}]':
        errors.append(f"variantes: reload duplicó o alteró collectibles: {keep}")

    page.screenshot(path=os.path.join(os.path.dirname(__file__), "shots", "f95-1-galeria-variantes.png"), full_page=False)


def check_queue_modal(page, errors):
    """F95.1 cola: un ítem por pantalla con «N de 4», avance con Escape y con el
    botón, y cierre al llegar al último."""
    boot(page, SEED_QUEUE_JS)

    dialog = page.locator('[role="dialog"]')
    page.wait_for_selector('[role="dialog"]', state="visible", timeout=15000)
    page.wait_for_timeout(500)

    queue = dialog.locator("[data-queue-progress]")
    if queue.count() == 0:
        errors.append("cola: sin affordance de cola (data-queue-progress)")
    elif queue.first.inner_text().strip() != "1 de 4":
        errors.append(f"cola: progress inicial != «1 de 4»: {queue.first.inner_text().strip()}")

    seen = []
    current = dialog.locator("[data-achievement]").first
    seen.append(current.count() > 0 and current.get_attribute("data-achievement") or "sin-atajo")

    # Escape avanza al segundo ítem.
    page.keyboard.press("Escape")
    page.wait_for_timeout(600)
    queue2 = dialog.locator("[data-queue-progress]").first
    if queue2.count() == 0 or queue2.inner_text().strip() != "2 de 4":
        errors.append(f"cola: Escape no avanzó a «2 de 4»: {queue2.count() and queue2.inner_text().strip()}")
    current2 = dialog.locator("[data-achievement]").first
    seen.append(current2.get_attribute("data-achievement"))

    # El botón avanza por los ítems restantes y cierra en el último. Se captura
    # el logro visible ANTES de cada clic (duplicados los absorbe el set).
    for _ in range(3):
        cur = dialog.locator("[data-achievement]").first
        if cur.count() > 0:
            seen.append(cur.get_attribute("data-achievement"))
        dialog.locator("button").first.click()
        page.wait_for_timeout(600)
    page.wait_for_timeout(400)
    if page.locator('[role="dialog"]').count() != 0:
        errors.append("cola: el modal no se cerró tras el último ítem")

    if len(set(seen)) != 4:
        errors.append(f"cola: no se vieron 4 logros distintos en la cola: {seen}")

    page.screenshot(path=os.path.join(os.path.dirname(__file__), "shots", "f95-1-modal-cola.png"), full_page=False)


def check_reduced_motion_variant(page, errors):
    """F95.1 reduced motion: celebración inerte — confeti estático visible
    (opacity .35), un solo ítem sin contador de cola y anuncio de variante
    nueva (polished por count 2)."""
    boot(page, SEED_VARIANT_NEW_JS)

    dialog = page.locator('[role="dialog"]')
    page.wait_for_selector('[role="dialog"]', state="visible", timeout=15000)
    page.wait_for_timeout(800)

    if dialog.locator("[data-queue-progress]").count() != 0:
        errors.append("reduced: contador de cola visible con un solo ítem")

    variant = dialog.locator("[data-new-variant]")
    if variant.count() == 0:
        errors.append("reduced: sin anuncio de variante nueva")
    medal = dialog.locator('[data-achievement="primer-paso"]').first
    if medal.get_attribute("data-variant") != "polished":
        errors.append(f"reduced: data-variant != polished: {medal.get_attribute('data-variant')}")

    piece_style = dialog.locator(".pointer-events-none span").first.get_attribute("style") or ""
    if "0.35" not in piece_style:
        errors.append(f"reduced: confeti no quedó estático visible (opacity .35): {piece_style}")

    page.screenshot(path=os.path.join(os.path.dirname(__file__), "shots", "f95-1-modal-reduced.png"), full_page=False)


def main():
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        # ── Parte 1 (F95.3): /logros ───────────────────────────────
        page = browser.new_page(viewport={"width": 375, "height": 812})
        console_errors = []
        page.on("console", lambda m: console_errors.append(f"console.{m.type}: {m.text}") if m.type == "error" else None)
        page.on("pageerror", lambda e: console_errors.append(f"pageerror: {e}"))

        try:
            boot(page, SEED_LOGROS_JS)
            page.goto(f"{BASE}/logros", wait_until="networkidle")
            page.wait_for_timeout(1000)

            body = page.inner_text("body")

            if "4/15" not in body:
                errors.append("logros: contador general 4/15 no visible")

            general = page.locator('[data-progress="general"]').first
            if general.count() == 0:
                errors.append("logros: no se renderiza la barra general")
            else:
                if general.get_attribute("aria-valuenow") != "4":
                    errors.append(f"logros: barra general aria-valuenow != 4: {general.get_attribute('aria-valuenow')}")
                if general.get_attribute("aria-valuemax") != "15":
                    errors.append(f"logros: barra general aria-valuemax != 15: {general.get_attribute('aria-valuemax')}")
                if general.get_attribute("role") != "progressbar":
                    errors.append("logros: barra general sin role=progressbar")

            cardio = page.locator('[data-progress="primera-cardio"]').first
            if cardio.count() == 0:
                errors.append("logros: logro completado primera-cardio sin barra de progreso")
            else:
                if cardio.get_attribute("aria-valuenow") != "1":
                    errors.append(f"logros: primera-cardio aria-valuenow != 1: {cardio.get_attribute('aria-valuenow')}")
                if cardio.get_attribute("aria-valuemax") != "1":
                    errors.append(f"logros: primera-cardio aria-valuemax != 1: {cardio.get_attribute('aria-valuemax')}")
                label = cardio.get_attribute("aria-label") or ""
                if "cardio" not in label.lower():
                    errors.append(f"logros: aria-label de primera-cardio sin título: {label}")

            sesiones = page.locator('[data-progress="sesiones-50"]').first
            if sesiones.count() == 0:
                errors.append("logros: sesiones-50 sin barra de progreso")
            else:
                if sesiones.get_attribute("aria-valuenow") != "1":
                    errors.append(f"logros: sesiones-50 aria-valuenow != 1: {sesiones.get_attribute('aria-valuenow')}")
                if sesiones.get_attribute("aria-valuemax") != "50":
                    errors.append(f"logros: sesiones-50 aria-valuemax != 50: {sesiones.get_attribute('aria-valuemax')}")
            if "1 de 50" not in body:
                errors.append("logros: label «1 de 50» de sesiones-50 no visible")

            pr10 = page.locator('[data-progress="pr-10kg"]').first
            if pr10.count() == 0:
                errors.append("logros: pr-10kg sin barra de progreso")
            else:
                if pr10.get_attribute("aria-valuenow") != "0":
                    errors.append(f"logros: pr-10kg aria-valuenow != 0: {pr10.get_attribute('aria-valuenow')}")
                if pr10.get_attribute("aria-valuemax") != "10":
                    errors.append(f"logros: pr-10kg aria-valuemax != 10: {pr10.get_attribute('aria-valuemax')}")

            guias = page.locator('[data-progress="guias-completas"]').first
            if guias.count() == 0:
                errors.append("logros: guias-completas no renderiza su barra declarada")
            else:
                if guias.get_attribute("aria-valuenow") != "0":
                    errors.append(f"logros: guias-completas aria-valuenow != 0: {guias.get_attribute('aria-valuenow')}")
                guias_target = guias.get_attribute("aria-valuemax")
                try:
                    guias_count = int(guias_target)
                except (TypeError, ValueError):
                    guias_count = 0
                if guias_count <= 0:
                    errors.append(f"logros: guias-completas aria-valuemax no es un target > 0: {guias_target}")
                if f"0 de {guias_target}" not in body:
                    errors.append(f"logros: label «0 de {guias_target}» de guias-completas no visible")
                if guias.get_attribute("aria-valuenow") == guias_target:
                    errors.append("logros: guias-completas declarado completo sin señal de guía")

            page.screenshot(path=os.path.join(os.path.dirname(__file__), "shots", "f95-3-logros-progreso.png"), full_page=False)
        except Exception as e:
            errors.append(f"Exception (logros): {e}")
        finally:
            if console_errors:
                errors.extend(console_errors)
            page.close()

        # ── Parte 2a (F95.2): historial con ventana temporal ──────
        ctx2 = browser.new_context(viewport={"width": 375, "height": 812})
        page2 = ctx2.new_page()
        console_errors2 = []
        page2.on("console", lambda m: console_errors2.append(f"console.{m.type}: {m.text}") if m.type == "error" else None)
        page2.on("pageerror", lambda e: console_errors2.append(f"pageerror: {e}"))
        try:
            check_photo_history(page2, errors)
        except Exception as e:
            errors.append(f"Exception (foto historial): {e}")
        finally:
            if console_errors2:
                errors.extend(console_errors2)
            ctx2.close()

        # ── Parte 2b (F95.2): resumen post-guardado real ──────────
        ctx3 = browser.new_context(viewport={"width": 375, "height": 812})
        page3 = ctx3.new_page()
        console_errors3 = []
        page3.on("console", lambda m: console_errors3.append(f"console.{m.type}: {m.text}") if m.type == "error" else None)
        page3.on("pageerror", lambda e: console_errors3.append(f"pageerror: {e}"))
        try:
            check_photo_active(page3, errors)
        except Exception as e:
            errors.append(f"Exception (foto resumen): {e}")
        finally:
            if console_errors3:
                errors.extend(console_errors3)
            ctx3.close()

        # ── Parte 3a (F95.1): galería con variantes e idempotencia ──
        ctx4 = browser.new_context(viewport={"width": 375, "height": 812})
        page4 = ctx4.new_page()
        console_errors4 = []
        page4.on("console", lambda m: console_errors4.append(f"console.{m.type}: {m.text}") if m.type == "error" else None)
        page4.on("pageerror", lambda e: console_errors4.append(f"pageerror: {e}"))
        try:
            check_variants_gallery(page4, errors)
        except Exception as e:
            errors.append(f"Exception (variantes galería): {e}")
        finally:
            if console_errors4:
                errors.extend(console_errors4)
            ctx4.close()

        # ── Parte 3b (F95.1): cola secuencial del modal ────────────
        ctx5 = browser.new_context(viewport={"width": 375, "height": 812})
        page5 = ctx5.new_page()
        console_errors5 = []
        page5.on("console", lambda m: console_errors5.append(f"console.{m.type}: {m.text}") if m.type == "error" else None)
        page5.on("pageerror", lambda e: console_errors5.append(f"pageerror: {e}"))
        try:
            check_queue_modal(page5, errors)
        except Exception as e:
            errors.append(f"Exception (cola modal): {e}")
        finally:
            if console_errors5:
                errors.extend(console_errors5)
            ctx5.close()

        # ── Parte 3c (F95.1): reduced motion con variante nueva ───
        ctx6 = browser.new_context(viewport={"width": 375, "height": 812})
        page6 = ctx6.new_page()
        # Reduced motion debe fijarse antes de la primera navegación (boot).
        page6.emulate_media(reduced_motion="reduce")
        console_errors6 = []
        page6.on("console", lambda m: console_errors6.append(f"console.{m.type}: {m.text}") if m.type == "error" else None)
        page6.on("pageerror", lambda e: console_errors6.append(f"pageerror: {e}"))
        try:
            check_reduced_motion_variant(page6, errors)
        except Exception as e:
            errors.append(f"Exception (reduced mood): {e}")
        finally:
            if console_errors6:
                errors.extend(console_errors6)
            ctx6.close()

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