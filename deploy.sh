#!/usr/bin/env bash
#
# deploy.sh — Baut die Astro-Seite aus 'main' und spiegelt sie nach
# /var/www/kodinitools.com, OHNE die eigenständigen Tool-Ordner oder
# hochgeladene Medien (uploads/) zu löschen.
#
# Wird AUF DEM SERVER ausgeführt — vom Admin-Dienst (Veröffentlichen)
# oder manuell per SSH:
#
#     cd /opt/kodini/repo && ./deploy.sh              # normaler Deploy
#     ./deploy.sh --dry-run                           # nur anzeigen, nichts ändern
#     ./deploy.sh --no-pull                           # ohne git reset (lokalen Stand bauen)
#
# Konfigurierbar über Umgebungsvariablen:
#     REPO_DIR   (Default: Verzeichnis dieses Skripts)
#     WEBROOT    (Default: /var/www/kodinitools.com)
#     BRANCH     (Default: main)
#
set -euo pipefail

# --- Verzeichnis dieses Skripts (= Repo-Clone) ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

REPO_DIR="${REPO_DIR:-$SCRIPT_DIR}"
WEBROOT="${WEBROOT:-/var/www/kodinitools.com}"
BRANCH="${BRANCH:-main}"

# --- Build-Umgebung robust machen ---
# Astro-Telemetrie deaktivieren (sonst Schreibversuch nach ~/.config/astro,
# was als Dienst-User www-data fehlschlägt) und dem Build ein sicher
# beschreibbares HOME geben (npm-Cache, Tool-Configs).
export ASTRO_TELEMETRY_DISABLED=1
export DO_NOT_TRACK=1
export HOME="${DEPLOY_HOME:-$(dirname "$REPO_DIR")/.build-home}"
mkdir -p "$HOME"

DRY_RUN=""
DO_PULL=1
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN="--dry-run" ;;
    --no-pull) DO_PULL=0 ;;
    *) echo "Unbekannte Option: $arg" >&2; exit 2 ;;
  esac
done

log() { printf '\033[1;34m[deploy]\033[0m %s\n' "$*"; }
err() { printf '\033[1;31m[deploy:FEHLER]\033[0m %s\n' "$*" >&2; }

# --- Vorbedingungen prüfen ---
[ -d "$WEBROOT" ]  || { err "Webroot existiert nicht: $WEBROOT"; exit 1; }
command -v rsync >/dev/null || { err "rsync nicht installiert"; exit 1; }
command -v npm   >/dev/null || { err "npm/Node nicht installiert"; exit 1; }

cd "$REPO_DIR"

# --- 1. Neuesten Stand aus 'main' holen ---
if [ "$DO_PULL" -eq 1 ]; then
  log "Hole $BRANCH von origin ..."
  git fetch origin "$BRANCH"
  git checkout "$BRANCH"
  git reset --hard "origin/$BRANCH"
else
  log "--no-pull: baue aktuellen Arbeitsstand (kein git reset)."
fi

log "Stand: $(git rev-parse --short HEAD) — $(git log -1 --pretty=%s)"

# --- 2. Bauen ---
# --include=dev erzwingt die devDependencies (z.B. @astrojs/sitemap), die der
# Build braucht. Ohne das lässt npm sie unter NODE_ENV=production weg — der
# Admin-Dienst läuft mit NODE_ENV=production, daher ist das Flag hier Pflicht.
log "npm ci (inkl. devDependencies) ..."
npm ci --include=dev
log "npm run build ..."
npm run build   # -> dist/

[ -d "$REPO_DIR/dist" ] || { err "Build-Ausgabe dist/ fehlt — Abbruch."; exit 1; }

# --- 3. Spiegeln nach Webroot ---
#
# WICHTIG: KEIN destruktives --delete auf dem gesamten Webroot!
# Der Astro-Build (dist/) enthält NUR die Astro-Shell (index.html, en/, blog/,
# faq/, _astro/, public-Assets). Er enthält NICHT die eigenständigen Tool-Ordner
# und NICHT webroot-eigene Assets wie images/ oder videos/. Ein globales
# --delete würde all das löschen.
#
# Strategie:
#   (a) dist/ additiv nach Webroot spiegeln (kopieren/aktualisieren, nie löschen)
#   (b) NUR innerhalb von _astro/ veraltete, gehashte Bundles bereinigen
#       (dieses Verzeichnis gehört zu 100 % dem Astro-Build)

if [ -n "$DRY_RUN" ]; then
  log "DRY-RUN — es wird nichts verändert."
  log "(a) additive Spiegelung dist/ -> Webroot:"
  rsync -a --itemize-changes --dry-run dist/ "$WEBROOT/"
  if [ -d "$WEBROOT/_astro" ]; then
    log "(b) _astro/ Bereinigung veralteter Bundles:"
    rsync -a --delete --itemize-changes --dry-run dist/_astro/ "$WEBROOT/_astro/"
  fi
  log "DRY-RUN beendet."
  exit 0
fi

log "(a) Spiegele dist/ additiv nach $WEBROOT (löscht nichts) ..."
rsync -a dist/ "$WEBROOT/"

log "(b) Bereinige veraltete Bundles in _astro/ ..."
rsync -a --delete dist/_astro/ "$WEBROOT/_astro/"

log "Fertig. Live-Stand: $(git rev-parse --short HEAD)"
