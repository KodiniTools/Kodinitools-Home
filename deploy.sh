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
#     ./deploy.sh --full                              # npm ci erzwingen (sonst nur bei geändertem Lockfile)
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
FULL_INSTALL=0
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN="--dry-run" ;;
    --no-pull) DO_PULL=0 ;;
    --full) FULL_INSTALL=1 ;;
    *) echo "Unbekannte Option: $arg" >&2; exit 2 ;;
  esac
done

# rsync ohne Eigentümer/Gruppe zu übernehmen: Der Dienst läuft als www-data und
# darf chown/chgrp nicht ausführen. Ohne --no-owner/--no-group scheitert -a mit
# "chgrp … Operation not permitted", sobald Quell- und Ziel-Gruppe abweichen.
RSYNC_OPTS="-a --no-owner --no-group"

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
# --include=dev erzwingt die devDependencies (z.B. eslint/prettier-Plugins,
# vite), die der Build/Toolchain braucht. Ohne das lässt npm sie unter
# NODE_ENV=production weg — der
# Admin-Dienst läuft mit NODE_ENV=production, daher ist das Flag hier Pflicht.
# npm ci löscht node_modules komplett und installiert neu – auf dem VPS mehrere
# Minuten. Das ist nur nötig, wenn sich package-lock.json geändert hat. Ein
# Stempel mit der Prüfsumme des Lockfiles in node_modules/ erkennt das; mit
# --full (oder fehlendem/unvollständigem node_modules) wird immer installiert.
LOCK_SUM="$(sha256sum package-lock.json | cut -d' ' -f1)"
STAMP="node_modules/.kodini-lock-sha256"
if [ "$FULL_INSTALL" -eq 0 ] && [ -x node_modules/.bin/astro ] && [ -f "$STAMP" ] \
   && [ "$(cat "$STAMP")" = "$LOCK_SUM" ]; then
  log "npm ci übersprungen: package-lock.json unverändert (node_modules aktuell)."
else
  log "npm ci (inkl. devDependencies) ..."
  npm ci --include=dev
  printf '%s' "$LOCK_SUM" > "$STAMP"
fi
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
  rsync $RSYNC_OPTS --itemize-changes --dry-run dist/ "$WEBROOT/"
  if [ -d "$WEBROOT/_astro" ]; then
    log "(b) _astro/ Bereinigung veralteter Bundles:"
    rsync $RSYNC_OPTS --delete --itemize-changes --dry-run dist/_astro/ "$WEBROOT/_astro/"
  fi
  log "(c) Entfernen alter Sitemap-Index-/Chunk-Dateien (ersetzt durch sitemap.xml):"
  for f in sitemap-index.xml sitemap-0.xml; do
    [ -e "$WEBROOT/$f" ] && log "    würde löschen: $WEBROOT/$f"
  done
  log "DRY-RUN beendet."
  exit 0
fi

# Vorabprüfung: Kann der Dienst-User überhaupt ins Webroot schreiben? Wenn nicht
# (z.B. weil ein früherer Deploy als root lief und root-eigene Dateien anlegte),
# bricht rsync mit "Permission denied" ab. Klarer Hinweis mit Reparatur-Befehl.
if [ ! -w "$WEBROOT" ] || { [ -d "$WEBROOT/_astro" ] && [ ! -w "$WEBROOT/_astro" ]; }; then
  err "Kein Schreibrecht im Webroot ($WEBROOT) für Benutzer '$(id -un)'."
  err "Vermutlich gehören Dateien einem anderen Benutzer (z.B. root aus einem"
  err "früheren 'sudo ./deploy.sh'). Einmalig als root reparieren:"
  err "    sudo chown -R www-data:www-data $WEBROOT"
  err "und danach den Deploy erneut ausführen (als Dienst-User, nicht als root):"
  err "    sudo -u www-data $REPO_DIR/deploy.sh"
  exit 1
fi

log "(a) Spiegele dist/ additiv nach $WEBROOT (löscht nichts) ..."
rsync $RSYNC_OPTS dist/ "$WEBROOT/"

log "(b) Bereinige veraltete Bundles in _astro/ ..."
rsync $RSYNC_OPTS --delete dist/_astro/ "$WEBROOT/_astro/"

# (c) Alte Sitemap-Dateien entfernen: Der Build erzeugt jetzt eine einzelne
# sitemap.xml statt sitemap-index.xml + sitemap-0.xml. Da die Spiegelung in (a)
# additiv ist, würden die alten Dateien sonst im Webroot verbleiben und von
# Suchmaschinen weiter gelesen. Einmalig gezielt entfernen (idempotent).
log "(c) Entferne alte Sitemap-Index-/Chunk-Dateien (ersetzt durch sitemap.xml) ..."
rm -f "$WEBROOT/sitemap-index.xml" "$WEBROOT/sitemap-0.xml"

log "Fertig. Live-Stand: $(git rev-parse --short HEAD)"
