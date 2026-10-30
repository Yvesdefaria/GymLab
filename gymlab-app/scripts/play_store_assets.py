"""Genera la ficha de Play Store: feature graphics y screenshots.

Requiere:
  - `npm run preview -- --port 4173` sirviendo `dist/`
  - Playwright Python instalado

Salida:
  - release/play-store/feature-graphic-es.png (1024x500)
  - release/play-store/feature-graphic-en.png (1024x500)
  - release/play-store/screenshots/{es,en}/01..06-*.png (1080x1920)
  - release/play-store/raw/{es,en}/... (capturas crudas 750x1334)
"""

from __future__ import annotations

import base64
import os
import re
from pathlib import Path

from PIL import Image
from playwright.sync_api import Page, sync_playwright

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
OUT = ROOT / "release" / "play-store"
BASE = os.environ.get("PLAY_STORE_BASE", "http://localhost:4173")

SCREENS = [
    ("01-home", "/", {
        "es": ("Tu plan de hoy, claro.", "Rutina, semana y progreso en una sola vista."),
        "en": ("Today's plan, ready.", "Routine, week and progress in one view."),
    }),
    ("02-estadisticas", "/estadisticas", {
        "es": ("Progreso real, sin humo.", "Volumen, fuerza y evolución de tus entrenos."),
        "en": ("Real progress, no guesswork.", "Volume, strength and how your training evolves."),
    }),
    ("03-rutinas", "/rutinas", {
        "es": ("Rutinas que se adaptan a vos.", "Elegí objetivo, nivel y días. El plan se arma solo."),
        "en": ("Routines that adapt to you.", "Pick a goal, level and days. The plan builds itself."),
    }),
    ("04-ejercicios", "/ejercicios", {
        "es": ("873 ejercicios con técnica.", "Músculos, alternativas y guía paso a paso."),
        "en": ("873 exercises with technique.", "Muscles, alternatives and step-by-step guidance."),
    }),
    ("05-calculadoras", "/calculadoras", {
        "es": ("Números que podés entender.", "IMC, calorías, 1RM, grasa y composición."),
        "en": ("Numbers you can understand.", "BMI, calories, 1RM, body fat and composition."),
    }),
    ("06-perfil", "/perfil", {
        "es": ("Todo tu progreso, en un lugar.", "Racha, marcas, historial y datos corporales."),
        "en": ("All your progress in one place.", "Streak, PRs, history and body data."),
    }),
]


def data_uri(path: Path, mime: str) -> str:
    return f"data:{mime};base64,{base64.b64encode(path.read_bytes()).decode()}"


def font_face(family: str, weight: int, file: Path) -> str:
    uri = data_uri(file, "font/woff2")
    return (
        f"@font-face{{font-family:'{family}';font-style:normal;font-weight:{weight};"
        f"src:url({uri}) format('woff2');}}"
    )


def fonts_css() -> str:
    return "\n".join(
        [
            font_face("Barlow", 400, PUBLIC / "fonts" / "barlow-400.woff2"),
            font_face("Barlow", 500, PUBLIC / "fonts" / "barlow-500.woff2"),
            font_face("Barlow", 600, PUBLIC / "fonts" / "barlow-600.woff2"),
            font_face("Barlow", 700, PUBLIC / "fonts" / "barlow-700.woff2"),
            font_face("Oswald", 500, PUBLIC / "fonts" / "oswald-500.woff2"),
            font_face("Oswald", 600, PUBLIC / "fonts" / "oswald-600.woff2"),
        ]
    )


def dismiss_overlays(page: Page) -> None:
    for _ in range(4):
        if page.locator("[role='dialog']").count() == 0:
            return
        page.keyboard.press("Escape")
        page.wait_for_timeout(150)


def complete_onboarding(page: Page) -> None:
    page.goto(BASE, wait_until="load")
    page.wait_for_timeout(1200)
    if page.get_by_role("button", name=re.compile("Español|Spanish")).count() == 0:
        return
    page.get_by_role("button", name=re.compile("Español|Spanish")).click()
    page.get_by_role("button", name="Continuar").click()
    page.get_by_role("button", name="General", exact=True).click()
    page.get_by_role("button", name="Principiante", exact=True).click()
    page.get_by_role("button", name="Continuar").click()
    page.get_by_role("button", name=re.compile(r"^4 días")).click()
    page.get_by_role("button", name="Continuar").click()
    page.get_by_role("button", name=re.compile(r"^Gimnasio")).click()
    page.get_by_role("button", name="Continuar").click()
    # Paso 5 — Identidad.
    page.get_by_role("button", name="Hombre").click()
    page.get_by_label("Nombre", exact=True).fill("Alex")
    page.get_by_role("button", name="Continuar").click()
    # Paso 6 — Medidas.
    page.get_by_label("Fecha de nacimiento").fill("1992-05-12")
    page.get_by_label("Altura en centímetros").fill("178")
    page.get_by_label("Peso en kg").fill("78")
    page.get_by_role("button", name="Continuar").click()
    page.wait_for_timeout(400)
    # Paso 7 — Resumen: aceptar términos y crear rutina.
    page.locator('input[type="checkbox"]').last.check()
    page.get_by_role("button", name=re.compile(r"^Empezar D1")).click()
    page.wait_for_timeout(1600)


SEED_DEMO = """async () => {
  const open = () => new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const db = await open();
  const iso = (d) => d.toISOString();
  const localDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const now = new Date();
  const workouts = [
    { daysAgo: 0, sets: [[1, 82.5, 8], [1, 82.5, 8], [1, 82.5, 7], [27, 102.5, 5], [27, 102.5, 5], [8, 62.5, 10]] },
    { daysAgo: 1, sets: [[22, 47.5, 8], [22, 47.5, 8], [7, 0, 8], [7, 0, 7], [12, 122.5, 5]] },
    { daysAgo: 2, sets: [[1, 80, 8], [1, 80, 8], [27, 100, 5], [8, 60, 10]] },
    { daysAgo: 5, sets: [[1, 80, 8], [1, 80, 8], [1, 80, 7], [27, 100, 5], [27, 100, 5], [8, 60, 10]] },
    { daysAgo: 6, sets: [[22, 45, 8], [22, 45, 8], [7, 0, 8], [7, 0, 7], [12, 120, 5]] },
    { daysAgo: 7, sets: [[1, 77.5, 8], [1, 77.5, 8], [27, 97.5, 6], [8, 57.5, 10]] },
    { daysAgo: 12, sets: [[1, 77.5, 8], [1, 77.5, 8], [27, 95, 6], [8, 57.5, 10], [13, 30, 12]] },
    { daysAgo: 13, sets: [[22, 42.5, 8], [7, 0, 7], [12, 115, 5], [27, 92.5, 6]] },
    { daysAgo: 14, sets: [[1, 75, 8], [1, 75, 8], [8, 55, 10], [13, 27.5, 12]] },
    { daysAgo: 19, sets: [[1, 75, 8], [1, 75, 8], [27, 92.5, 6], [8, 55, 10]] },
    { daysAgo: 20, sets: [[22, 40, 8], [7, 0, 6], [12, 112.5, 5], [27, 90, 6]] },
    { daysAgo: 21, sets: [[1, 72.5, 8], [1, 72.5, 8], [8, 52.5, 10], [13, 25, 12]] },
  ];
  await new Promise((res, rej) => {
    const tx = db.transaction(['workouts', 'workoutSets'], 'readwrite');
    const wStore = tx.objectStore('workouts');
    const sStore = tx.objectStore('workoutSets');
    workouts.forEach((w, wi) => {
      const date = new Date(now);
      date.setDate(now.getDate() - w.daysAgo);
      date.setHours(18, 15, 0, 0);
      const started = new Date(date.getTime() - 52 * 60000);
      const id = 9001 + wi;
      wStore.put({
        id, startedAt: iso(started), finishedAt: iso(date), routineId: null,
        routineDayId: null, localDate: localDate(date), notes: '',
      });
      w.sets.forEach(([exerciseId, weightKg, reps], si) => {
        sStore.put({
          id: id * 10 + si, workoutId: id, exerciseId, setNumber: si + 1,
          weightKg, reps, completed: true, createdAt: iso(date), rpe: 8,
        });
      });
    });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  await new Promise((res, rej) => {
    const tx = db.transaction('bodyWeight', 'readwrite');
    const store = tx.objectStore('bodyWeight');
    [[0, 78.2], [7, 78.6], [14, 79.0], [21, 79.4], [28, 79.8], [35, 80.1]].forEach(([daysAgo, weightKg], i) => {
      const date = new Date(now);
      date.setDate(now.getDate() - daysAgo);
      date.setHours(8, 0, 0, 0);
      store.put({ id: 7001 + i, localDate: localDate(date), weightKg, createdAt: iso(date) });
    });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  await new Promise((res, rej) => {
    const tx = db.transaction('prs', 'readwrite');
    const store = tx.objectStore('prs');
    [
      [1, 82.5, 8], [27, 102.5, 5], [8, 62.5, 10],
      [22, 47.5, 8], [12, 122.5, 5], [13, 30, 12],
    ].forEach(([exerciseId, weightKg, reps]) => {
      store.put({ exerciseId, weightKg, reps, date: localDate(now) });
    });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  await new Promise((res, rej) => {
    const tx = db.transaction('activeProgram', 'readwrite');
    const store = tx.objectStore('activeProgram');
    const get = store.getAll();
    get.onsuccess = () => {
      const program = get.result?.[0];
      if (program) store.put({ ...program, weekdays: [1, 2, 3, 4, 5] });
    };
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  await new Promise((res, rej) => {
    const tx = db.transaction('meta', 'readwrite');
    const store = tx.objectStore('meta');
    store.put({ key: 'tourDone', value: 'true' });
    store.put({ key: 'tourPending', value: 'false' });
    store.put({ key: 'avatarUri', value: JSON.stringify('/avatars/avatar-01.jpg') });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  db.close();
  return true;
}"""


SET_LANGUAGE = """async (lang) => {
  const open = () => new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const db = await open();
  const settings = await new Promise((res, rej) => {
    const tx = db.transaction('meta', 'readonly');
    const req = tx.objectStore('meta').get('settings');
    req.onsuccess = () => res(req.result?.value ?? '{}');
    req.onerror = () => rej(req.error);
  });
  let parsed = {};
  try { parsed = JSON.parse(settings); } catch {}
  parsed.language = lang;
  parsed.showSectionTips = false;
  await new Promise((res, rej) => {
    const tx = db.transaction('meta', 'readwrite');
    tx.objectStore('meta').put({ key: 'settings', value: JSON.stringify(parsed) });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  db.close();
  return true;
}"""


def capture_raw(page: Page, language: str) -> None:
    raw_dir = OUT / "raw" / language
    raw_dir.mkdir(parents=True, exist_ok=True)
    for name, route, _captions in SCREENS:
        page.goto(f"{BASE}{route}", wait_until="load")
        page.wait_for_timeout(1400)
        page.wait_for_function(
            "() => document.getElementById('root')?.children.length > 0",
            timeout=15000,
        )
        dismiss_overlays(page)
        page.wait_for_timeout(200)
        page.screenshot(path=str(raw_dir / f"{name}.png"), full_page=False)
        print(f"raw {language} {name}")


def render_feature(page: Page, language: str) -> None:
    icon = data_uri(PUBLIC / "icon-512.png", "image/png")
    if language == "es":
        kicker = "GYMLAB · ENTRENAMIENTO Y SALUD"
        title = "Entrena con un plan.<br>Mira tu progreso."
        subtitle = "Rutinas, fuerza, nutrición y salud.<br>Todo local, sin cuentas."
    else:
        kicker = "GYMLAB · TRAINING AND HEALTH"
        title = "Train with a plan.<br>See your progress."
        subtitle = "Workouts, strength, nutrition and health.<br>All local, no account."
    html = f"""<!doctype html><html><head><meta charset="utf-8"><style>
    {fonts_css()}
    *{{box-sizing:border-box}} html,body{{margin:0;width:1024px;height:500px;overflow:hidden}}
    body{{background:#121214;color:#e8e4de;font-family:Barlow,Arial,sans-serif;position:relative}}
    .glow{{position:absolute;right:-150px;top:-190px;width:680px;height:680px;border-radius:50%;
      background:radial-gradient(circle,rgba(217,179,132,.22),transparent 64%)}}
    .grain{{position:absolute;inset:0;background:
      linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px) 0 0/64px 64px,
      linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px) 0 0/64px 64px;
      mask-image:linear-gradient(90deg,#000,transparent 70%)}}
    .left{{position:absolute;left:72px;top:88px;width:620px}}
    .kicker{{font-weight:600;font-size:18px;letter-spacing:.22em;color:#D9B384}}
    h1{{font-family:Oswald,Arial,sans-serif;font-weight:500;font-size:58px;line-height:1.02;
      letter-spacing:.01em;margin:18px 0 0;color:#fff}}
    p{{font-size:23px;line-height:1.35;color:#b8b1a5;margin:18px 0 0}}
    .line{{position:absolute;left:72px;top:424px;width:600px;height:1px;background:linear-gradient(90deg,#D9B384,transparent)}}
    .icon{{position:absolute;right:82px;top:92px;width:280px;height:280px;border-radius:64px;
      overflow:hidden;border:1px solid rgba(217,179,132,.35);box-shadow:0 30px 80px rgba(0,0,0,.45)}}
    .icon img{{width:100%;height:100%;object-fit:cover;display:block}}
    </style></head><body>
    <div class="glow"></div><div class="grain"></div>
    <div class="left"><div class="kicker">{kicker}</div><h1>{title}</h1><p>{subtitle}</p></div>
    <div class="line"></div><div class="icon"><img src="{icon}"></div>
    </body></html>"""
    page.set_viewport_size({"width": 1024, "height": 500})
    page.set_content(html, wait_until="load")
    page.evaluate("document.fonts.ready")
    page.wait_for_timeout(300)
    path = OUT / f"feature-graphic-{language}.png"
    page.screenshot(path=str(path), scale="css")
    normalize_png(path, (1024, 500))
    print(f"feature {language}")


def render_frame(page: Page, raw: Path, language: str, name: str, captions: dict[str, tuple[str, str]]) -> None:
    title, subtitle = captions[language]
    image = data_uri(raw, "image/png")
    font_size = 64 if len(title) < 36 else 56
    html = f"""<!doctype html><html><head><meta charset="utf-8"><style>
    {fonts_css()}
    *{{box-sizing:border-box}} html,body{{margin:0;width:1080px;height:1920px;overflow:hidden}}
    body{{background:#0e0e10;color:#e8e4de;font-family:Barlow,Arial,sans-serif;position:relative}}
    .glow{{position:absolute;right:-220px;top:-260px;width:820px;height:820px;border-radius:50%;
      background:radial-gradient(circle,rgba(217,179,132,.16),transparent 66%)}}
    .top{{position:absolute;left:130px;top:108px;width:820px}}
    .kicker{{font-weight:600;font-size:25px;letter-spacing:.24em;color:#D9B384}}
    h1{{font-family:Oswald,Arial,sans-serif;font-weight:500;font-size:{font_size}px;line-height:1.03;
      margin:16px 0 0;color:#fff;letter-spacing:.01em}}
    .sub{{font-size:27px;line-height:1.4;color:#9a9489;margin:16px 0 0}}
    .phone{{position:absolute;left:180px;top:380px;width:720px;height:1412px;border-radius:50px;
      padding:14px;background:#1c1c1e;border:1px solid #2c2c2f;box-shadow:0 40px 110px rgba(0,0,0,.55)}}
    .screen{{width:100%;height:100%;border-radius:40px;overflow:hidden;background:#121214}}
    .screen img{{width:100%;height:100%;object-fit:cover;display:block}}
    .footer{{position:absolute;left:150px;bottom:38px;font-weight:600;font-size:22px;
      letter-spacing:.2em;color:#D9B384}}
    </style></head><body>
    <div class="glow"></div>
    <div class="top"><div class="kicker">GYMLAB</div><h1>{title}</h1><div class="sub">{subtitle}</div></div>
    <div class="phone"><div class="screen"><img src="{image}"></div></div>
    <div class="footer">GYMLAB · LOCAL-FIRST</div>
    </body></html>"""
    page.set_viewport_size({"width": 1080, "height": 1920})
    page.set_content(html, wait_until="load")
    page.evaluate("document.fonts.ready")
    page.wait_for_timeout(250)
    out_dir = OUT / "screenshots" / language
    out_dir.mkdir(parents=True, exist_ok=True)
    page.screenshot(path=str(out_dir / f"{name}.png"), scale="css")
    normalize_png(out_dir / f"{name}.png", (1080, 1920))


def normalize_png(path: Path, size: tuple[int, int]) -> None:
    img = Image.open(path)
    if img.size != size:
        raise SystemExit(f"{path}: {img.size} != {size}")
    if img.mode != "RGB":
        img.convert("RGB").save(path)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 375, "height": 750},
            device_scale_factor=2,
            reduced_motion="reduce",
        )
        page = context.new_page()
        errors: list[str] = []
        page.on("pageerror", lambda e: errors.append(str(e)))

        complete_onboarding(page)
        page.evaluate(SEED_DEMO)
        page.evaluate(SET_LANGUAGE, "es")
        page.reload(wait_until="load")
        page.wait_for_timeout(1600)
        dismiss_overlays(page)
        capture_raw(page, "es")

        page.evaluate(SET_LANGUAGE, "en")
        page.reload(wait_until="load")
        page.wait_for_timeout(1600)
        dismiss_overlays(page)
        capture_raw(page, "en")

        for language in ("es", "en"):
            render_feature(page, language)
            for name, _route, captions in SCREENS:
                render_frame(
                    page, OUT / "raw" / language / f"{name}.png", language, name, captions
                )

        browser.close()
        if errors:
            print("pageerrors:", errors)
            raise SystemExit(1)
        print("OK: feature graphics + screenshots generados")


if __name__ == "__main__":
    main()
