"""Seed compartido de los e2e de contenido: onboarding hecho + idioma español.

El default de producto es inglés. Los tests históricos de guías nacieron en español;
este helper fija la preferencia sin tocar la app ni el seed de datos.
"""
SEED_SPANISH_JS = """async () => {
  const openDb = () => new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const db = await openDb();
  await new Promise((res, rej) => {
    const tx = db.transaction('meta', 'readwrite');
    const meta = tx.objectStore('meta');
    meta.put({ key: 'onboardingDone', value: 'true' });
    meta.put({ key: 'settings', value: JSON.stringify({ language: 'es', showSectionTips: false }) });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  return true;
}"""


def seed_spanish(page):
    """Fija español + onboarding y recarga para que i18n lo lea al montar."""
    result = page.evaluate(SEED_SPANISH_JS)
    assert result is True, f"seed español falló: {result}"
    page.reload(wait_until="networkidle")
    page.wait_for_timeout(600)
