<#
  worktree.ps1 — ciclo de vida de los worktrees de multisesión.
  Regla y contexto: gymlab-app/AGENTS.md -> "Sesiones paralelas".

  Uso (desde cualquier carpeta del repo):
    .\scripts\worktree.ps1 open  <fase>
    .\scripts\worktree.ps1 close <fase>

  open   Crea .worktrees\<fase>, la rama <fase> y la junction de node_modules.
         Valida que .worktrees/ esté ignorado y muestra los worktrees ya vivos.

  close  Audita el worktree: si no quedó nada importante, elimina junction,
         worktree, rama y prune. Si queda algo (archivos sin commitear,
         untracked que existen solo ahí o commits sin mergear), NO borra nada:
         lo muestra y frena. Nunca usa --force.

  El merge a main NO lo hace este script (requiere las otras sesiones idle):
    git -C .worktrees\<fase> rebase main
    git merge --ff-only <fase>        # desde el repo principal
#>
[CmdletBinding()]
param(
  [string]$Command = '',
  [string]$Fase = ''
)

$ErrorActionPreference = 'Stop'

function Fail([string]$Message, [int]$Code = 1) {
  Write-Host "FRENA: $Message" -ForegroundColor Red
  exit $Code
}
function Ok([string]$Message) { Write-Host "OK: $Message" -ForegroundColor Green }
function Warn([string]$Message) { Write-Host "AVISO: $Message" -ForegroundColor Yellow }

if ($Command -notin @('open', 'close') -or [string]::IsNullOrWhiteSpace($Fase)) {
  Write-Host 'Uso: .\scripts\worktree.ps1 open|close <fase>'
  exit 2
}
if ($Fase -notmatch '^[A-Za-z0-9._-]+$') {
  Fail "Nombre de fase inválido: '$Fase'. Permitido: letras, números, punto, guion y guion bajo."
}

# Raíz del repo PRINCIPAL: funciona desde el repo principal o desde cualquier worktree.
$common = git rev-parse --path-format=absolute --git-common-dir 2>$null
if ($LASTEXITCODE -ne 0 -or -not $common) { Fail 'No estoy dentro de un repositorio git.' }
$Root = Split-Path ($common | Select-Object -First 1) -Parent

$WtRel = ".worktrees\$Fase"
$WtAbs = Join-Path $Root $WtRel
$Branch = $Fase
$Junction = Join-Path $WtAbs 'gymlab-app\node_modules'
$MainNodeModules = Join-Path $Root 'gymlab-app\node_modules'

function Test-BranchExists {
  git -C $Root show-ref --verify --quiet "refs/heads/$Branch"
  return ($LASTEXITCODE -eq 0)
}

function Test-WorktreeRegistered {
  $target = $WtAbs.Replace('\', '/').TrimEnd('/').ToLowerInvariant()
  $lines = git -C $Root worktree list --porcelain | Where-Object { $_ -like 'worktree *' }
  foreach ($line in $lines) {
    $candidate = $line.Substring(9).Replace('\', '/').TrimEnd('/').ToLowerInvariant()
    if ($candidate -eq $target) { return $true }
  }
  return $false
}

switch ($Command) {
  'open' {
    Write-Host 'Worktrees vivos ahora:'
    git -C $Root worktree list

    if (Test-WorktreeRegistered) { Fail "Ya hay un worktree registrado en $WtRel. Revisá 'git worktree list'." }
    if (Test-Path -LiteralPath $WtAbs) { Fail "La carpeta $WtRel ya existe en disco." }
    if (Test-BranchExists) { Fail "La rama '$Branch' ya existe. Elegí otra fase o borrala si es basura." }

    # .worktrees/ DEBE estar ignorado antes de crear nada adentro.
    $wtHome = Join-Path $Root '.worktrees'
    [System.IO.Directory]::CreateDirectory($wtHome) | Out-Null
    git -C $Root check-ignore -q -- ".worktrees/$Fase"
    if ($LASTEXITCODE -ne 0) { Fail "'.worktrees/' no está ignorado en git: agregá la entrada a .gitignore antes de crear worktrees." }

    git -C $Root worktree add $WtRel -b $Branch
    if ($LASTEXITCODE -ne 0) { Fail 'git worktree add falló.' }

    # node_modules: junction al de la principal para no reinstalar (Windows).
    if (-not (Test-Path -LiteralPath $MainNodeModules)) {
      Warn "No existe ${MainNodeModules}: el worktree quedó creado pero SIN junction. Corré npm install en gymlab-app o creá la junction a mano."
      Write-Host "Worktree: $WtRel (rama $Branch)"
      exit 3
    }
    cmd /c mklink /J "$Junction" "$MainNodeModules" | Out-Null
    if ($LASTEXITCODE -ne 0) {
      Warn 'mklink /J falló: el worktree quedó creado pero SIN junction de node_modules.'
      exit 3
    }

    Ok "Worktree listo: $WtRel (rama $Branch)"
    Write-Host "   cwd para trabajar: $WtRel\gymlab-app"
  }

  'close' {
    $registered = Test-WorktreeRegistered
    $onDisk = Test-Path -LiteralPath $WtAbs
    $branchExists = Test-BranchExists

    if (-not $registered -and -not $onDisk -and -not $branchExists) {
      Ok "No hay nada para cerrar en '$Fase' (ni worktree, ni carpeta, ni rama)."
      git -C $Root worktree prune
      exit 0
    }

    if ($onDisk) {
      # Audit 1: algo sin commitear, o untracked que existe solo acá.
      $dirty = git -C $WtAbs status --porcelain -uall
      if ($dirty) {
        Write-Host 'FRENA: queda algo SIN COMMITEAR en el worktree:' -ForegroundColor Red
        $dirty | ForEach-Object { Write-Host "   $_" }
        Fail 'Resolvé a mano: commitear, mover o descartar. No se borró nada (el script nunca usa --force).'
      }
    }

    # Audit 2: commits que no llegaron a main.
    if ($branchExists) {
      $unmerged = git -C $Root log --oneline "main..$Branch"
      if ($unmerged) {
        Write-Host "FRENA: hay commits sin mergear a main en '$Branch':" -ForegroundColor Red
        $unmerged | ForEach-Object { Write-Host "   $_" }
        Fail "Cerrá el merge primero: rebase en el worktree + 'git merge --ff-only $Branch' desde el principal (otras sesiones idle) y volvé a correr close."
      }
    }

    if ($onDisk) {
      # Sacar la junction ANTES de borrar: git worktree remove borra A TRAVÉS de la junction; rmdir solo borra el link.
      $item = Get-Item -LiteralPath $Junction -Force -ErrorAction SilentlyContinue
      if ($item -and ($item.Attributes -band [System.IO.FileAttributes]::ReparsePoint)) {
        Write-Host '-> Quitando junction de node_modules...'
        cmd /c rmdir "$Junction"
        if ($LASTEXITCODE -ne 0) { Warn 'rmdir de la junction falló; sigo (worktree remove dirá si puede).' }
      }
      git -C $Root worktree remove $WtAbs
      if ($LASTEXITCODE -ne 0) { Fail 'git worktree remove falló: revisá qué quedó adentro.' }
    }
    elseif ($registered) {
      # Registrado pero sin carpeta: prune limpia el registro.
      git -C $Root worktree prune
    }

    if ($branchExists) {
      git -C $Root branch -d $Branch
      if ($LASTEXITCODE -ne 0) { Fail "git branch -d falló (¿commits sin mergear?). La rama '$Branch' sigue existiendo." }
      git -C $Root worktree prune
      Ok "Cierre completo: worktree, junction y rama '$Branch' eliminados."
    }
    else {
      git -C $Root worktree prune
      Ok "Cierre completo: worktree eliminado (no había rama '$Branch')."
    }
  }
}
