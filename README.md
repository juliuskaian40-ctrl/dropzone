# DROPZONE — Fortnite Map & Item-Shop MVP

Responsives Fan-Dashboard ohne Login. Der Shop-API-Schlüssel wird serverseitig über eine Cloudflare-Pages-Function verwendet und nicht im öffentlichen Frontend gespeichert.

## Funktionen
- Battle-Royale-Kartenansicht über Fortnite-API
- Item-Shop mit Suche, Sortierung, Item-Bildern und Preisen, sofern geliefert
- Manuelle Aktualisierung und automatischer Abruf alle 30 Minuten während die Seite geöffnet ist
- Dark UI, mobilfreundliches Layout
- Reload-Bereich mit klarem Hinweis, falls keine separate verifizierte Karte verfügbar ist

## Lokal testen
Öffne `index.html` im Browser. Wenn lokale Einschränkungen API-Anfragen verhindern, nutze einen lokalen Webserver, z. B. `python -m http.server 8000`, und öffne `http://localhost:8000`.

## Veröffentlichen mit Cloudflare Pages
GitHub Pages führt keine serverseitigen Functions aus. Für den geschützten Shop-API-Schlüssel muss das Projekt als Cloudflare Pages-Projekt bereitgestellt werden.

1. Verbinde das GitHub-Repository mit Cloudflare Pages.
2. Wähle als Build-Befehl keinen Build-Befehl und als Ausgabeverzeichnis das Repository-Wurzelverzeichnis.
3. Öffne die Cloudflare Pages-Projekteinstellungen und füge unter **Settings → Environment variables** die geheime Variable `FORTNITE_API_KEY` hinzu.
4. Füge den API-Schlüssel als **Secret/verschlüsselte Umgebungsvariable** hinzu – niemals in `app.js` oder in eine öffentliche Datei.
5. Starte ein neues Deployment.

Die Datei `functions/api/shop.js` leitet Shop-Anfragen an die Fortnite-API weiter und fügt den geheimen Schlüssel serverseitig hinzu. Das Aussehen der Seite wird dadurch nicht verändert.

## Hinweise
- Datenquelle: https://fortnite-api.com/ — unabhängiger Community-Dienst, nicht Epic Games.
- Bei API-Ausfällen, fehlender Server-Konfiguration oder Änderungen am Antwortformat zeigt die App einen Fehler statt erfundener Daten.
- Der Shop-Endpunkt benötigt die geheime Cloudflare-Umgebungsvariable `FORTNITE_API_KEY`; GitHub Pages allein reicht für diesen geschützten Proxy nicht aus.
- Der Shop wird beim Öffnen geladen und während einer offenen Sitzung alle 30 Minuten aktualisiert; es gibt keinen serverseitigen Cronjob.
- Separate Reload-Kartendaten sind noch nicht angebunden, weil deren Verfügbarkeit über diese Datenquelle nicht bestätigt wurde.
- Vor einem öffentlichen oder kommerziellen Launch API-Nutzungsbedingungen, Marken-/Bildrechte und die für dein Projekt geltenden Datenschutz-/Impressumspflichten prüfen.
