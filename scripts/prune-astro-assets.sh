#!/usr/bin/env bash
#
# prune-astro-assets.sh — Entfernt veraltete, gehashte Astro-Bundles aus dem
# Webroot erst nach einer Aufbewahrungsfrist statt sofort beim Deploy.
#
# Hintergrund: Jeder Build erzeugt neue Dateinamen in _astro/ (Hash im Namen).
# Wer das HTML vor dem Deploy geladen hat (offene Tabs, Browser-/Proxy-Cache,
# Crawler, Lighthouse), fordert danach noch die alten Dateinamen an. Werden
# diese sofort gelöscht, entstehen 404 und die Seite lädt ohne CSS/JS.
#
# Aufruf:
#     prune-astro-assets.sh <webroot/_astro> <dist/_astro> <state-datei> [tage] [--dry-run]
#
# Ablauf je Datei in <webroot/_astro>:
#   - im aktuellen Build vorhanden          -> bleibt, wird aus dem Status entfernt
#   - nicht mehr im Build, erstmals gesehen -> bleibt, Zeitpunkt wird notiert
#   - nicht mehr im Build seit >= <tage>    -> wird gelöscht
# Gezählt wird ab dem Deploy, der die Datei überflüssig gemacht hat (nicht ab
# ihrem Build-Datum), damit selten geänderte Bundles nicht sofort verschwinden.
#
# Umgebungsvariable NOW (Unix-Sekunden) überschreibt die aktuelle Zeit (Tests).
set -euo pipefail

if [ "$#" -lt 3 ]; then
  echo "Aufruf: $0 <webroot/_astro> <dist/_astro> <state-datei> [tage] [--dry-run]" >&2
  exit 2
fi

LIVE_DIR="$1"
DIST_DIR="$2"
STATE_FILE="$3"
DAYS="${4:-7}"
DRY_RUN=0
[ "${5:-}" = "--dry-run" ] && DRY_RUN=1

case "$DAYS" in
  ''|*[!0-9]*) echo "Ungültige Aufbewahrungsfrist: '$DAYS' (ganze Tage erwartet)" >&2; exit 2 ;;
esac
[ -d "$DIST_DIR" ] || { echo "Build-Verzeichnis fehlt: $DIST_DIR" >&2; exit 1; }
# Noch nie deployt -> nichts zu bereinigen.
[ -d "$LIVE_DIR" ] || exit 0

NOW="${NOW:-$(date +%s)}"
MAX_AGE=$((DAYS * 86400))

# Bisherigen Status lesen: "<relativer Pfad>\t<seit Unix-Sekunden>"
declare -A SINCE=()
if [ -f "$STATE_FILE" ]; then
  while IFS=$'\t' read -r name ts; do
    [ -n "$name" ] && [[ "$ts" =~ ^[0-9]+$ ]] && SINCE["$name"]="$ts"
  done < "$STATE_FILE"
fi

NEW_STATE=""
kept=0
removed=0
while IFS= read -r -d '' file; do
  rel="${file#"$LIVE_DIR"/}"
  # Teil des aktuellen Builds -> nie löschen.
  [ -e "$DIST_DIR/$rel" ] && continue
  since="${SINCE[$rel]:-$NOW}"
  if [ $((NOW - since)) -ge "$MAX_AGE" ]; then
    removed=$((removed + 1))
    if [ "$DRY_RUN" -eq 1 ]; then
      echo "würde löschen: _astro/$rel"
    else
      rm -f -- "$file"
    fi
  else
    kept=$((kept + 1))
    NEW_STATE+="$rel"$'\t'"$since"$'\n'
  fi
done < <(find "$LIVE_DIR" -type f -print0)

if [ "$DRY_RUN" -eq 1 ]; then
  echo "_astro: $kept veraltete Datei(en) bleiben noch, $removed würden gelöscht (Frist $DAYS Tage)."
  exit 0
fi

# Leere Unterordner aufräumen (nicht den _astro-Ordner selbst).
find "$LIVE_DIR" -mindepth 1 -type d -empty -delete

mkdir -p "$(dirname "$STATE_FILE")"
tmp="$STATE_FILE.tmp.$$"
printf '%s' "$NEW_STATE" > "$tmp"
mv -f "$tmp" "$STATE_FILE"

echo "_astro: $kept veraltete Datei(en) aufbewahrt, $removed gelöscht (Frist $DAYS Tage)."
