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
EXCLUDES="$REPO_DIR/deploy-protect.txt"

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
[ -f "$EXCLUDES" ] || { err "Schutzliste fehlt: $EXCLUDES"; exit 1; }
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
log "npm ci ..."
npm ci
log "npm run build ..."
npm run build   # -> dist/

[ -d "$REPO_DIR/dist" ] || { err "Build-Ausgabe dist/ fehlt — Abbruch."; exit 1; }

# --- 3. Sicherheitscheck: kein geschützter Ordner darf gelöscht werden ---
# Trockenlauf und prüfen, ob rsync einen Pfad aus der Schutzliste löschen würde.
log "Prüfe geplante Löschungen gegen Schutzliste ..."
DELETIONS="$(rsync -a --delete --exclude-from="$EXCLUDES" --dry-run \
            --out-format='%o %n' dist/ "$WEBROOT/" | awk '$1=="del." || $1=="deleting"{ $1=""; sub(/^ /,""); print }')" || true

if [ -n "$DELETIONS" ]; then
  # Vergleiche jede geplante Löschung mit den Top-Level-Einträgen der Schutzliste
  while IFS= read -r prot; do
    [ -z "$prot" ] && continue
    case "$prot" in \#*) continue ;; esac
    prot_top="${prot%%/*}"
    if echo "$DELETIONS" | grep -qE "^${prot_top}(/|$)"; then
      err "ABBRUCH: rsync würde geschützten Pfad '$prot_top' löschen!"
      err "Prüfe deploy-protect.txt. Geplante Löschungen:"
      echo "$DELETIONS" | sed 's/^/    /' >&2
      exit 1
    fi
  done < "$EXCLUDES"
fi

# --- 4. Spiegeln (bzw. Dry-Run) ---
if [ -n "$DRY_RUN" ]; then
  log "DRY-RUN — es wird nichts verändert. Geplante Änderungen:"
  rsync -a --delete --exclude-from="$EXCLUDES" --dry-run --itemize-changes \
    dist/ "$WEBROOT/"
  log "DRY-RUN beendet."
  exit 0
fi

log "Spiegele dist/ nach $WEBROOT (Tool-Ordner + uploads/ geschützt) ..."
rsync -a --delete --exclude-from="$EXCLUDES" dist/ "$WEBROOT/"

log "Fertig. Live-Stand: $(git rev-parse --short HEAD)"
