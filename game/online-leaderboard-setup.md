# Online Leaderboard Setup für Word Defender

## Übersicht
Das Online-Leaderboard ermöglicht es Spielern, ihre Highscores zu teilen und mit anderen zu vergleichen. Es ist optional und vollständig datenschutzfreundlich.

## Einrichtung

### Option 1: JSONBin.io (Empfohlen für einfache Einrichtung)

1. **Account erstellen**
   - Gehe zu [JSONBin.io](https://jsonbin.io/)
   - Erstelle einen kostenlosen Account
   - Erstelle einen neuen Bin für die Highscores

2. **API-Konfiguration**
   - Kopiere deine Bin-ID und API-Key
   - Ersetze in `defender.html` folgende Zeilen:
   ```javascript
   const LEADERBOARD_API = 'https://api.jsonbin.io/v3/b/DEINE_BIN_ID';
   const API_KEY = 'DEIN_API_KEY';
   ```

3. **Initialisierung**
   - Der Bin sollte als leeres Array `[]` initialisiert werden

### Option 2: Eigener Server

Für mehr Kontrolle kann ein eigener API-Endpunkt verwendet werden:

```javascript
const LEADERBOARD_API = 'https://deine-domain.com/api/leaderboard';
const API_KEY = 'optional'; // Falls erforderlich
```

Der Server sollte folgende Endpunkte unterstützen:
- `GET /api/leaderboard` - Abrufen der Highscores
- `PUT /api/leaderboard` - Aktualisieren der Highscores

## Features

### Lokale vs. Online Highscores
- **Lokale Highscores**: Werden im Browser gespeichert (localStorage)
- **Online Highscores**: Optional teilbar, werden auf Server gespeichert
- Spieler können wählen, ob sie ihre Scores teilen möchten

### Gespeicherte Daten
```json
{
  "name": "Spielername",
  "score": 1250,
  "survivalTime": 180,
  "wordsDestroyed": 8,
  "difficulty": "mittel",
  "date": "2025-08-01T10:30:00.000Z",
  "submittedAt": "2025-08-01T10:35:00.000Z"
}
```

### Datenschutz
- Nur Name, Score, Zeit und Schwierigkeitsgrad werden geteilt
- Keine IP-Adressen oder persönlichen Daten
- Freiwillige Teilnahme für jeden Score

## Funktionalität

### 1. Nach dem Spielende
- Lokaler Highscore wird automatisch gespeichert
- Option zum Teilen des Scores online wird angezeigt
- Spieler kann wählen zwischen lokalem und Online-Leaderboard

### 2. Online-Leaderboard anzeigen
- Lädt die Top 20 Online-Scores
- Zeigt Schwierigkeitsgrad-Badges
- Sortiert nach Score, dann nach Überlebenszeit

### 3. Score einreichen
- Ein-Klick-Submission nach dem Spiel
- Feedback über Erfolg/Fehler
- Automatische Aktualisierung der Anzeige

## Konfiguration ohne Server

Für lokale Tests oder wenn kein Online-Leaderboard gewünscht ist:

```javascript
// Online-Features deaktivieren
const LEADERBOARD_API = null;
const API_KEY = null;
```

Dies versteckt alle Online-Optionen und das Spiel funktioniert nur mit lokalen Highscores.

## Sicherheit

### Rate Limiting
JSONBin.io bietet automatisches Rate Limiting. Bei eigenem Server sollten folgende Limits implementiert werden:
- Max. 10 Submissions pro Stunde pro IP
- Max. 100 Abrufe pro Stunde pro IP

### Validierung
Serverseitige Validierung der Daten:
- Score zwischen 0-50000
- Survival Time zwischen 0-3600 Sekunden
- Name max. 20 Zeichen, keine HTML/Script-Tags

### Spam-Schutz
- Duplikat-Detection (gleicher Name + Score innerhalb 5 Minuten)
- Minimum-Survival-Time (z.B. 10 Sekunden)

## Kosten

### JSONBin.io Free Tier
- 10.000 API Calls pro Monat
- Für kleine bis mittlere Spielerzahlen ausreichend
- Upgrade bei Bedarf verfügbar

### Eigener Server
- Vollständige Kontrolle
- Keine externen Abhängigkeiten
- Hosting-Kosten je nach Anbieter

## Wartung

### Datenbereinigung
- Automatische Begrenzung auf Top 50 Scores
- Alte Einträge werden automatisch entfernt
- Keine manuelle Wartung erforderlich

### Monitoring
- Console-Logs für Debug-Informationen
- Fehlerbehandlung für Netzwerkprobleme
- Graceful Fallback auf lokale Scores

## Installation

1. Die aktuelle `defender.html` enthält bereits alle erforderlichen Funktionen
2. API-Credentials in den entsprechenden Variablen setzen
3. Bei JSONBin.io: Bin mit leerem Array `[]` initialisieren
4. Spiel testen und Online-Funktionen verifizieren

Das Online-Leaderboard ist jetzt einsatzbereit! 🚀
