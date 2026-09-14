"""B.5: Verificar que el build producido incluye orientation:"any" en el manifest.

Invocación:  python tests/e2e/scripts/check_manifest.py
(Requiere `npm run build` previo.)
"""
import json
import sys
from pathlib import Path

MANIFEST = Path("dist/manifest.webmanifest")

if not MANIFEST.exists():
    print(f"FAIL: {MANIFEST} no existe — ejecutar npm run build primero")
    sys.exit(1)

m = json.loads(MANIFEST.read_text())
orientation = m.get("orientation")
if orientation != "any":
    print(f"FAIL: orientation={orientation!r}, esperado 'any'")
    sys.exit(1)
print("OK B.5: manifest orientation = any")
