# Trabajo multiplataforma — GymLab (Linux ↔ Windows)

Guía para alternar entre dos dispositivos (por ejemplo Pop!_OS y Windows) con las
mismas condiciones de desarrollo. Sigue la convención del repo: sin push automático
de fases, `gh` opcional, `openspec/` local.

---

## 1. Clonar el repo en el segundo dispositivo

```bash
git clone https://github.com/Yvesdefaria/GymLab.git
cd GymLab
```

Las ramas de fase están apiladas (F96 → F97 → F98 → F99). Tráelas todas:

```bash
git fetch origin
git branch -r          # ver todas las ramas remotas
git checkout feat/f99-home-layout-02-landscape   # la más reciente
```

Dependencias de la app (equivalente en ambos SO):

```bash
cd gymlab-app
npm install
npm test               # 75 files / 827 tests
npm run build          # tsc -b && vite build
```

---

## 2. Dependencias por SO (equivalentes)

| Herramienta | Linux (Pop!_OS) | Windows | Notas |
|---|---|---|---|
| Node.js + npm | apt/volta/asdf | winget/volta/nvm-windows | Usar la misma versión de Node en ambos (ver `package.json` engines si existe) |
| Python 3 (e2e) | ya incluido | winget install Python.Python.3.12 | Necesario para `tests/e2e/scripts/with_server.py` |
| Playwright (e2e) | `pip install playwright && playwright install chromium` | `pip install playwright && playwright install chromium` | Idéntico en ambos |
| Git | `sudo apt install git` | winget/git-scm | `.gitattributes` ya normaliza saltos de línea |
| GitHub CLI (`gh`) | `sudo apt install gh` / snap | winget install GitHub.cli | Opcional; sin él no hay PR automático |

Verificación e2e en ambos SO (idéntico):

```bash
cd gymlab-app
python3 tests/e2e/scripts/with_server.py tests/e2e/test_f99_home_layout.py
```

> Si Playwright no está en el PATH de Windows, usar `python -m playwright` o el
> ejecutable instalado; los tests no dependen de rutas Unix.

---

## 3. Configuración de git (equivale en ambos)

El remote se usa por **SSH** (configurado en este repo: `git@github.com:Yvesdefaria/GymLab.git`).
La clave pública `~/.ssh/id_rsa.pub` de este Linux ya está autorizada en GitHub
(2026-09-14, título «gymlab linux»). Para el segundo dispositivo, reutilizar **la misma
clave**: copiar `id_rsa` + `id_rsa.pub` (o subir de nuevo la `.pub` en GitHub → Settings →
SSH and GPG keys). No crear una clave nueva si se quiere usar la misma identidad.

El repo incluye `.gitattributes` que fuerza `eol=lf` en el repositorio y adapta el
`working tree` a cada SO. Configura además el autocrlf:

**Linux:**
```bash
git config --global core.autocrlf input
# SSH no necesita credential.helper (usa las claves)
```

**Windows:**
```bash
git config --global core.autocrlf true
# Si usás SSH en Windows: claves en %USERPROFILE%\.ssh\ en vez de token HTTP
```

Con `.gitattributes` + estas configs, los commits de ambos dispositivos quedan
byte-idénticos en línea nueva y no generan conflictos falsos CRLF/LF.

**Si ya existe un working tree antiguo en el segundo dispositivo** después de añadir
`.gitattributes`, normalizar de una vez:

```bash
git add --renormalize .
```

---

## 4. Lo que NO se sincroniza (por diseño o por convención)

| Elemento | Por qué | Equivalente en el otro dispositivo |
|---|---|---|
| `node_modules/` | gitignore | `npm install` |
| `openspec/` | convención del repo: **untracked a propósito** | Copiar/rsync manualmente si se quiere el rastro OpenSpec en ambos (o iniciarlo de nuevo con `sdd-init`); **no se envía con `git clone`** |
| `android/` + `ios/` (Capacitor) | gitignore (`.gitignore:42-43`) | `npx cap sync android` tras instalar Android Studio / SDK; iOS solo en macOS |
| `.config/`, `.opencode/skills/`, `.gentle-ai-default-agent.json` | estado local de la AI | Copiar manualmente si quieres la misma config de agentes |
| `gymlab-app/docs/performance-*.md`, `COMPLETED.md`, `shots/` | archivos de trabajo local | Copiar manualmente si se necesitan |

---

## 5. Comandos específicos de SO con equivalente

| Acción | Linux | Windows | Iguales |
|---|---|---|---|
| Sincronizar ramas | `git pull` | `git pull` | ✅ |
| Subir rama local | `git push origin <rama>` | `git push origin <rama>` | ✅ |
| Tests | `npm test` | `npm test` | ✅ |
| Build PWA | `npm run build` | `npm run build` | ✅ |
| Sync Capacitor Android | `npm run android:sync` | `npm run android:sync` | Requiere Android Studio/SDK en ambos |
| Abrir Android Studio | `npm run android:open` | `npm run android:open` | ✅ (abre el IDE del SO) |
| Crear rama de fase | `git switch -c feat/fXXX-...` | `git switch -c feat/fXXX-...` | ✅ |
| Limpiar shots e2e | `rm -rf tests/e2e/shots/*` | `del /q tests\e2e\shots\*` | ⚠️ solo difieren rutas/espacios |

---

## 6. Flujo recomendado al alternar dispositivos

1. **Antes de cambiar de dispositivo:** `git status` limpio o commits hechos; si hay
   ramas nuevas locales: `git push origin <rama>`.
2. **En el otro dispositivo:** `git fetch origin && git checkout <rama>`.
3. **Nunca** fuerces `git push --force` salvo que estés reparando un commit propio
   reciente en tu propia rama.
4. Las ramas de fase **no se mergean a `main`** sin decisión explícita; en GitHub se
   abren los PR encadenados (F96 → F97 → F98 → F99) cuando exista `gh`.

---

## 7. Solución de problemas frecuentes

- **`fatal: LF will be replaced by CRLF`** → normal: git avisa; no es error. Si molesta,
  `git config core.autocrlf true` (Windows) o `input` (Linux).
- **Tests e2e fallan con permisos/port** → el puerto base lo elige `with_server.py`;
  en Windows desactivar el firewall del perfil privado si bloquea localhost.
- **`PORT` ocupado** → matar el proceso Vite/Python anterior:
  - Linux: `kill $(lsof -ti:5173)`
  - Windows: `netstat -ano | findstr :5173` → `taskkill /PID <pid> /F`
- **Playwright no arranca Chromium en Windows** → `python -m playwright install
  chromium` y verificar que la carpeta cache no esté en OneDrive (mover a local).

---

## 8. Estado al momento de escribir esta guía

- Rama más reciente: `chore/cross-platform` @ `b9f8098` (REQUISITOS-SO + compat).
- **Todas las ramas pusheadas a origin por SSH (2026-09-14)**: 14 `feat/*` (F96–F99)
  + `chore/cross-platform`. `main` en sync con `origin/main` (F95).
- `gh` no instalado → PRs manuales/automáticos pendientes hasta instalarlo.