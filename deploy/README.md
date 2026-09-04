# Deploy & Adminbereich — Server-Setup

Diese Anleitung richtet die Deploy-Grundlage (Phase 1) auf dem Server ein.
Voller Kontext: [`../docs/ADMIN_DEPLOY_PLAN.md`](../docs/ADMIN_DEPLOY_PLAN.md).

> **Stand Phase 1:** `deploy.sh`, `deploy-protect.txt` und die Server-Vorlagen
> (systemd, nginx) sind angelegt. Der Admin-Node-Dienst selbst (`server/admin/`)
> entsteht in Phase 3 — die systemd-Unit verweist bereits darauf.

## Überblick

| Komponente | Ort |
|---|---|
| Repo-Clone (Build-Quelle) | `/opt/kodini/repo` |
| Webroot (nginx) | `/var/www/kodinitools.com` |
| Upload-Medien | `/var/www/kodinitools.com/uploads/` |
| Admin-Node-Dienst | `127.0.0.1:9020` (systemd `kodini-admin`) |
| Secrets | `/opt/kodini/.env` (chmod 600, nicht im Git) |

---

## Schnellstart (empfohlen): ein Skript

Das Skript [`setup-server.sh`](setup-server.sh) erledigt fast alles automatisch
(idempotent, mehrfach ausführbar). Da das Repo zum Klonen erst den Deploy-Key
braucht, führt es dich an der richtigen Stelle durch die 1–2 manuellen Schritte.

```bash
# 1. Repo einmalig irgendwohin holen (oder das Skript separat kopieren)
git clone https://github.com/KodiniTools/Kodinitools-Home.git /tmp/kodini-src
sudo bash /tmp/kodini-src/deploy/setup-server.sh
```

Das Skript:
1. erkennt den **Service-User** (Owner des Webroots),
2. prüft **Voraussetzungen** (git, node ≥ 18, rsync, nginx, openssl),
3. legt `/opt/kodini` + `uploads/` an,
4. erzeugt den **SSH-Deploy-Key** und zeigt den Public-Key → du hinterlegst ihn
   bei GitHub (Deploy key, *write*), dann bestätigst du im Skript,
5. **klont** das Repo nach `/opt/kodini/repo` und verankert den Key repo-lokal
   (`core.sshCommand` → Dienst *und* manuelle Läufe nutzen ihn automatisch),
6. schreibt `/opt/kodini/.env` (Session-Secret generiert; **Passwort** kannst du
   direkt setzen),
7. installiert + startet den **systemd-Dienst** `kodini-admin`,
8. nennt zum Schluss die restlichen manuellen Schritte (nginx-Blöcke, Dry-Run).

Danach noch **manuell**: nginx-Blöcke einfügen (Schritt 6 unten) und den ersten
**Trockenlauf-Deploy** fahren. Fertig.

Die folgenden Abschnitte erklären dieselben Schritte einzeln — als Referenz oder
für ein manuelles Setup ohne Skript.

---

## 1. Repo auf dem Server klonen

```bash
sudo mkdir -p /opt/kodini
sudo chown "$USER" /opt/kodini
git clone https://github.com/KodiniTools/Kodinitools-Home.git /opt/kodini/repo
```

## 2. SSH-Deploy-Key einrichten (Server darf nach `main` pushen)

```bash
ssh-keygen -t ed25519 -C "kodini-deploy" -f /opt/kodini/deploy_key -N ""
cat /opt/kodini/deploy_key.pub
```
Den ausgegebenen **Public Key** in GitHub hinterlegen:
**Repo → Settings → Deploy keys → Add deploy key → „Allow write access" aktivieren.**

Git so konfigurieren, dass dieser Key **repo-lokal** genutzt wird — dann greifen
sowohl der Dienst (als Service-User) als auch manuelle Läufe automatisch darauf zu,
ohne SSH-Config im Home-Verzeichnis:
```bash
cd /opt/kodini/repo
git remote set-url origin git@github.com:KodiniTools/Kodinitools-Home.git
git config core.sshCommand "ssh -i /opt/kodini/deploy_key -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new"
git fetch origin main   # Test: sollte ohne Passwort funktionieren
```

## 3. Uploads-Ordner anlegen

```bash
sudo mkdir -p /var/www/kodinitools.com/uploads
sudo chown www-data:www-data /var/www/kodinitools.com/uploads
```

## 4. Erster Deploy — ZUERST als Trockenlauf

> ⚠️ Der Trockenlauf ist Pflicht: Er zeigt, welche Dateien rsync anfassen würde,
> **ohne** etwas zu verändern. So ist sichergestellt, dass keiner der ~19
> eigenständigen Tool-Ordner gelöscht wird.

```bash
cd /opt/kodini/repo
./deploy.sh --dry-run      # nur anzeigen
```
Prüfen, dass in der Ausgabe **kein** Tool-Ordner (audiokonverter, visualizer,
videokonverter, bildergalerie, kontaktformular, …) und **nicht** `uploads/`
zum Löschen (`deleting`) markiert ist. Das Skript bricht zusätzlich automatisch
ab, falls ein geschützter Pfad gelöscht würde.

Wenn alles gut aussieht:
```bash
./deploy.sh                # echter Deploy
```

## 5. Admin-Dienst (Phase 3) — Secrets + systemd

`.env` anlegen (Vorlage: [`.env.example`](.env.example)):
```bash
sudo install -m 600 -o www-data -g www-data /dev/null /opt/kodini/.env
sudo -e /opt/kodini/.env    # Werte eintragen (Passwort-Hash, Session-Secret …)
```

systemd-Unit installieren:
```bash
sudo cp /opt/kodini/repo/deploy/kodini-admin.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now kodini-admin
systemctl status kodini-admin
```

## 6. nginx-Blöcke für `/admin` + `/uploads`

Inhalt von [`nginx-admin.conf`](nginx-admin.conf) in den bestehenden
`server { server_name kodinitools.com; listen 443 ... }`-Block einfügen —
**vor** den generischen Astro-Locations (`location = /` usw.).

```bash
sudo nginx -t && sudo systemctl reload nginx
```

---

## Manueller Deploy jederzeit

**Immer als Dienst-User `www-data` ausführen — NICHT als root.** Läuft der
Deploy als root, gehören die erzeugten Webroot-Dateien danach root, und der
Admin-Dienst (www-data) kann beim nächsten Veröffentlichen nicht mehr
darüberschreiben (`rsync … Permission denied`).

```bash
sudo -u www-data /opt/kodini/repo/deploy.sh            # baut main, deployt
sudo -u www-data /opt/kodini/repo/deploy.sh --dry-run  # nur Vorschau
```

Falls die Rechte bereits verstellt sind (Deploy meldet „Permission denied"),
einmalig als root reparieren:

```bash
sudo chown -R www-data:www-data /var/www/kodinitools.com
```

## Admin-**Backend** geändert? Dienst neu starten

`deploy.sh` baut die Website neu und spiegelt `dist/` — es startet aber
**nicht** den laufenden Admin-Node-Dienst neu. Das Frontend (`server/admin/public/`)
wird bei jeder Anfrage frisch von der Platte geladen und ist sofort aktuell;
der **Server-Code** (`server/admin/*.mjs`, z. B. neue API-Routen wie
`/api/preview`) wird jedoch nur beim Prozessstart geladen. Nach Änderungen am
Backend daher einmalig:

```bash
sudo systemctl restart kodini-admin
```

**Automatisch:** Seit `codeupdate.mjs` holt die **Vorschau** vor dem Build den
aktuellen `main`-Stand (`git merge --ff-only origin/main`, bei geänderten
Abhängigkeiten `npm ci`). Wurde dabei – oder durch `deploy.sh` beim
Veröffentlichen – Server-Code geändert, beendet sich der Dienst nach Abschluss
selbst; systemd (`Restart=on-failure`) startet ihn neu, der Adminbereich lädt
sich danach automatisch neu. Voraussetzung: der Dienst läuft unter systemd
(`INVOCATION_ID` gesetzt); mit `ADMIN_AUTO_RESTART=0` lässt sich das abschalten,
dann erscheint nur der Hinweis. Der laufende **alte** Prozess (ohne dieses
Modul) muss einmalig noch von Hand neu gestartet werden, nachdem der Code im
Klon liegt (`git pull` oder Veröffentlichen).

**Deploy „läuft endlos"?** Die Ausgabe von `deploy.sh` erscheint jetzt live im
Status-Log (git reset / npm ci / build / rsync); nach 20 Minuten bricht der
Dienst den Deploy ab. Antwortet der Dienst nicht (nginx 502, z. B. während des
Selbst-Neustarts), zeigt die Statusanzeige das an und gibt nach 3 Minuten
Diagnose-Befehle aus (`systemctl status kodini-admin`, `journalctl -u kodini-admin -n 80`).

Symptom, wenn das vergessen wird: das neue Frontend ruft eine neue Route auf,
der alte Prozess kennt sie nicht → **„Unbekannter Endpunkt"**.

## Neuen eigenständigen Tool-Ordner ergänzt?

Eine Zeile in [`../deploy-protect.txt`](../deploy-protect.txt) hinzufügen
(z. B. `neues-tool/`), damit der Deploy ihn nicht löscht.
