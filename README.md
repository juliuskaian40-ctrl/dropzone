# DROPZONE — Fortnite Map & Item-Shop MVP

Responsives, statisches Fan-Dashboard ohne Login oder eigenen Server.

## Funktionen
- Battle-Royale-Kartenansicht über Fortnite-API
- Item-Shop mit Suche, Sortierung, Item-Bildern und Preisen, sofern geliefert
- Manuelle Aktualisierung und automatischer Abruf alle 30 Minuten während die Seite geöffnet ist
- Dark UI, mobilfreundliches Layout
- Reload-Bereich mit klarem Hinweis, falls keine separate verifizierte Karte verfügbar ist

## Lokal testen
Öffne `index.html` im Browser. Wenn lokale Einschränkungen API-Anfragen verhindern, nutze einen lokalen Webserver, z. B. `python -m http.server 8000`, und öffne `http://localhost:8000`.

## Kostenlos veröffentlichen (GitHub Pages)
1. Erstelle auf GitHub ein neues Repository, z. B. `dropzone`.
2. Lade `index.html`, `styles.css`, `app.js` und `README.md` hoch.
3. Öffne **Settings → Pages**.
4. Wähle **Deploy from a branch**, Branch `main`, Ordner `/ (root)` und speichere.
5. Warte auf den Build und öffne die angezeigte Pages-URL.

## Hinweise
- Datenquelle: https://fortnite-api.com/ — unabhängiger Community-Dienst, nicht Epic Games.
- Bei API-Ausfällen oder Änderungen am Antwortformat zeigt die App einen Fehler statt erfundener Daten.
- Der Shop wird beim Öffnen geladen und während einer offenen Sitzung alle 30 Minuten aktualisiert; es gibt keinen serverseitigen Cronjob.
- Separate Reload-Kartendaten sind noch nicht angebunden, weil deren Verfügbarkeit über diese Datenquelle nicht bestätigt wurde.
- Vor einem öffentlichen oder kommerziellen Launch API-Nutzungsbedingungen, Marken-/Bildrechte und die für dein Projekt geltenden Datenschutz-/Impressumspflichten prüfen.
