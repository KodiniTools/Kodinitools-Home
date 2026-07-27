#!/usr/bin/env bash
#
# setup-server.sh — Richtet den Adminbereich + Deploy auf dem Server ein.
# Idempotent: kann mehrfach ausgeführt werden.
#
#   sudo bash deploy/setup-server.sh
#
# Voraussetzungen: Debian/Ubuntu, nginx läuft bereits, Node >= 18, git, rsync.
# Erledigt automatisch: Repo-Klon, SSH-Deploy-Key, uploads/, .env (mit
# Session-Secret + optional Passwort-Hash), systemd-Dienst.
# Manuell bleiben: Deploy-Key bei GitHub hinterlegen + nginx-Blöcke einfügen
# (das Skript zeigt genau, was zu tun ist).

set -euo pipefail

# ================== Konfiguration ==================
REPO_SLUG="KodiniTools/Kodinitools-Home"
REPO_SSH="git@github.com:${REPO_SLUG}.git"
REPO_HTTPS="https://github.com/${REPO_SLUG}.git"
BASE_DIR="/opt/kodini"
REPO_DIR="${BASE_DIR}/repo"
KEY_FILE="${BASE_DIR}/deploy_key"
ENV_FILE="${BASE_DIR}/.env"
WEBROOT="/var/www/kodinitools.com"
UPLOADS_DIR="${WEBROOT}/uploads"
BRANCH="main"
PORT="9020"
UNIT="/etc/systemd/system/kodini-admin.service"

c_ok()  { printf '\033[1;32m✓\033[0m %s\n' "$*"; }
c_inf() { printf '\033[1;34m•\033[0m %s\n' "$*"; }
c_warn(){ printf '\033[1;33m!\033[0m %s\n' "$*"; }
c_err() { printf '\033[1;31m✗\033[0m %s\n' "$*" >&2; }
step()  { printf '\n\033[1;36m== %s ==\033[0m\n' "$*"; }

[ "$(id -u)" -eq 0 ] || { c_err "Bitte mit sudo/root ausführen."; exit 1; }

# ================== 1. Service-User bestimmen ==================
step "1. Service-User"
if [ -d "$WEBROOT" ]; then
  SERVICE_USER="$(stat -c '%U' "$WEBROOT")"
else
  SERVICE_USER="www-data"
fi
# Fallback, falls Owner 'root' ist (Dienst soll nicht als root laufen)
if [ "$SERVICE_USER" = "root" ]; then SERVICE_USER="www-data"; fi
SERVICE_GROUP="$(id -gn "$SERVICE_USER" 2>/dev/null || echo "$SERVICE_USER")"
c_inf "Dienst läuft als: ${SERVICE_USER}:${SERVICE_GROUP} (abgeleitet vom Webroot-Owner)"
c_inf "Falls das falsch ist, Skript abbrechen und SERVICE_USER oben anpassen."

# ================== 2. Voraussetzungen ==================
step "2. Voraussetzungen prüfen"
MISS=0
for bin in git rsync node npm openssl nginx; do
  if command -v "$bin" >/dev/null 2>&1; then
    c_ok "$bin: $(command -v "$bin")"
  else
    c_err "$bin fehlt"; MISS=1
  fi
done
if command -v node >/dev/null; then
  NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
  [ "$NODE_MAJOR" -ge 18 ] && c_ok "Node-Version $(node -v) OK" || { c_err "Node >= 18 nötig (aktuell $(node -v))"; MISS=1; }
fi
[ "$MISS" -eq 0 ] || { c_err "Bitte fehlende Pakete installieren und erneut ausführen."; exit 1; }

# ================== 3. Verzeichnisse ==================
step "3. Verzeichnisse anlegen"
mkdir -p "$BASE_DIR"
c_ok "$BASE_DIR"
mkdir -p "$UPLOADS_DIR"
chown "$SERVICE_USER:$SERVICE_GROUP" "$UPLOADS_DIR"
c_ok "$UPLOADS_DIR (Owner: $SERVICE_USER)"

# ================== 4. SSH-Deploy-Key ==================
step "4. SSH-Deploy-Key"
if [ ! -f "$KEY_FILE" ]; then
  ssh-keygen -t ed25519 -C "kodini-deploy" -f "$KEY_FILE" -N "" >/dev/null
  c_ok "Neuen Deploy-Key erzeugt: $KEY_FILE"
else
  c_inf "Deploy-Key existiert bereits: $KEY_FILE"
fi
chown "$SERVICE_USER:$SERVICE_GROUP" "$KEY_FILE" "${KEY_FILE}.pub"
chmod 600 "$KEY_FILE"; chmod 644 "${KEY_FILE}.pub"

echo
c_warn "AKTION NÖTIG — diesen Public-Key bei GitHub als Deploy-Key mit SCHREIBrecht hinterlegen:"
c_warn "  Repo → Settings → Deploy keys → Add deploy key → 'Allow write access' ankreuzen"
echo "-----------------------------------------------------------------------"
cat "${KEY_FILE}.pub"
echo "-----------------------------------------------------------------------"
echo
read -r -p "Ist der Key bei GitHub hinterlegt (mit Schreibrecht)? [j/N] " ANS
if [ "${ANS,,}" != "j" ]; then
  c_warn "OK — Key zuerst hinterlegen, dann dieses Skript erneut ausführen. Es macht dort weiter."
  exit 0
fi

# GitHub-Host bekannt machen (StrictHostKeyChecking)
KNOWN_HOSTS="${BASE_DIR}/known_hosts"
ssh-keyscan -t ed25519 github.com > "$KNOWN_HOSTS" 2>/dev/null || true
chown "$SERVICE_USER:$SERVICE_GROUP" "$KNOWN_HOSTS"
SSH_CMD="ssh -i ${KEY_FILE} -o IdentitiesOnly=yes -o UserKnownHostsFile=${KNOWN_HOSTS} -o StrictHostKeyChecking=accept-new"

# ================== 5. Repo klonen / aktualisieren ==================
step "5. Repository"
if [ ! -d "$REPO_DIR/.git" ]; then
  c_inf "Klone $REPO_SLUG nach $REPO_DIR ..."
  GIT_SSH_COMMAND="$SSH_CMD" git clone "$REPO_SSH" "$REPO_DIR"
  c_ok "Repo geklont"
else
  c_inf "Repo existiert bereits: $REPO_DIR"
fi
cd "$REPO_DIR"
git remote set-url origin "$REPO_SSH"
# Deploy-Key repo-lokal verankern: gilt für Dienst UND manuelle Läufe
git config core.sshCommand "$SSH_CMD"
c_ok "core.sshCommand gesetzt (nutzt Deploy-Key automatisch)"
GIT_SSH_COMMAND="$SSH_CMD" git fetch origin "$BRANCH" && c_ok "Zugriff auf origin/$BRANCH OK" || {
  c_err "git fetch fehlgeschlagen — ist der Deploy-Key korrekt hinterlegt?"; exit 1;
}
git checkout "$BRANCH" >/dev/null 2>&1 || true
git reset --hard "origin/$BRANCH"
chmod +x deploy.sh 2>/dev/null || true

# ================== 6. .env ==================
step "6. Konfiguration (.env)"
if [ ! -f "$ENV_FILE" ]; then
  SECRET="$(openssl rand -hex 32)"
  cat > "$ENV_FILE" <<EOF
# Auto-generiert von setup-server.sh — Werte bei Bedarf anpassen.
PORT=${PORT}
REPO_DIR=${REPO_DIR}
WEBROOT=${WEBROOT}
UPLOADS_DIR=${UPLOADS_DIR}
GIT_BRANCH=${BRANCH}
SESSION_SECRET=${SECRET}
ADMIN_PASSWORD_HASH=
MAX_UPLOAD_MB=2048
EOF
  c_ok ".env angelegt (SESSION_SECRET generiert)"
else
  c_inf ".env existiert bereits — wird nicht überschrieben"
fi
chown "$SERVICE_USER:$SERVICE_GROUP" "$ENV_FILE"
chmod 600 "$ENV_FILE"

# Passwort setzen (falls noch kein Hash)
if ! grep -q '^ADMIN_PASSWORD_HASH=.\+' "$ENV_FILE"; then
  echo
  read -r -p "Admin-Passwort jetzt setzen? [J/n] " SETPW
  if [ "${SETPW,,}" != "n" ]; then
    read -r -s -p "Neues Admin-Passwort (min. 8 Zeichen): " PW1; echo
    read -r -s -p "Wiederholen: " PW2; echo
    if [ "$PW1" = "$PW2" ] && [ "${#PW1}" -ge 8 ]; then
      HASH="$(cd "$REPO_DIR" && node server/admin/hash-password.mjs "$PW1")"
      # bestehende (leere) Zeile ersetzen
      sed -i "s#^ADMIN_PASSWORD_HASH=.*#ADMIN_PASSWORD_HASH=${HASH}#" "$ENV_FILE"
      c_ok "Passwort-Hash gespeichert"
    else
      c_warn "Passwörter ungleich oder zu kurz — übersprungen. Später manuell setzen (siehe Ende)."
    fi
    unset PW1 PW2
  fi
fi

# ================== 7. Rechte am Repo ==================
step "7. Rechte"
chown -R "$SERVICE_USER:$SERVICE_GROUP" "$BASE_DIR"
c_ok "$BASE_DIR gehört $SERVICE_USER"
# Webroot: Service-User muss dort schreiben können (rsync-Deploy)
if sudo -u "$SERVICE_USER" test -w "$WEBROOT"; then
  c_ok "$SERVICE_USER kann in $WEBROOT schreiben"
else
  c_warn "$SERVICE_USER kann NICHT in $WEBROOT schreiben — Deploy würde scheitern."
  c_warn "  Prüfe/setze Rechte, z.B.:  sudo chown -R $SERVICE_USER:$SERVICE_GROUP $WEBROOT"
  c_warn "  (Vorsicht mit bestehenden Tool-Ordnern — ggf. nur benötigte Pfade anpassen.)"
fi

# ================== 8. systemd-Dienst ==================
step "8. systemd-Dienst"
cat > "$UNIT" <<EOF
[Unit]
Description=Kodini Admin Service (Content-Editor + Publish/Deploy)
After=network.target

[Service]
Type=simple
User=${SERVICE_USER}
Group=${SERVICE_GROUP}
WorkingDirectory=${REPO_DIR}
EnvironmentFile=${ENV_FILE}
Environment=NODE_ENV=production
ExecStart=/usr/bin/node server/admin/index.mjs
Restart=on-failure
RestartSec=3
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=full
ReadWritePaths=${REPO_DIR} ${UPLOADS_DIR} ${WEBROOT}

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable kodini-admin >/dev/null 2>&1 || true
c_ok "systemd-Unit installiert: $UNIT"

if grep -q '^ADMIN_PASSWORD_HASH=.\+' "$ENV_FILE"; then
  systemctl restart kodini-admin
  sleep 1
  if systemctl is-active --quiet kodini-admin; then
    c_ok "Dienst läuft (127.0.0.1:${PORT})"
  else
    c_err "Dienst startet nicht — Log: journalctl -u kodini-admin -n 30 --no-pager"
  fi
else
  c_warn "Kein Passwort-Hash gesetzt — Dienst noch nicht gestartet."
fi

# ================== 9. Abschluss / manuelle Schritte ==================
step "9. Noch manuell zu tun"
cat <<EOF

  a) nginx-Blöcke einfügen (falls noch nicht geschehen):
     Inhalt von  ${REPO_DIR}/deploy/nginx-admin.conf
     in den HAUPT-server-Block (server_name kodinitools.com; listen 443)
     einfügen — VOR den generischen Astro-Locations (location = / …). Dann:
         sudo nginx -t && sudo systemctl reload nginx

  b) Falls oben kein Passwort gesetzt wurde:
         cd ${REPO_DIR}
         HASH=\$(node server/admin/hash-password.mjs 'DEIN-PASSWORT')
         sudo sed -i "s#^ADMIN_PASSWORD_HASH=.*#ADMIN_PASSWORD_HASH=\$HASH#" ${ENV_FILE}
         sudo systemctl restart kodini-admin

  c) Erster Deploy als Trockenlauf (prüft, dass keine Tool-Ordner gelöscht werden):
         cd ${REPO_DIR} && sudo -u ${SERVICE_USER} ./deploy.sh --dry-run
     Wenn sauber:
         cd ${REPO_DIR} && sudo -u ${SERVICE_USER} ./deploy.sh

  Danach: Seite öffnen, Strg+Shift+Alt+K → Login unter /admin/.

EOF
c_ok "Setup-Skript abgeschlossen."
