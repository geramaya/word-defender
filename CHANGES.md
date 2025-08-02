# CHANGELOG
Alle wichtigen Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/),
und dieses Projekt folgt [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.5.0] - 2025-08-02

### Hinzugefügt
- **Google Analytics 4 Integration** - Vollständiges Event-Tracking für Spielstatistiken
- **Lokales Analytics-System** - Backup-Lösung für blockierte externe Analytics
- **Google Tag Manager Support** - Professionelle Analytics-Verwaltung
- **Event-Tracking für alle Spielaktionen**:
  - Spielstart und -ende
  - Score-Tracking und Highscores
  - Schild-Nutzung (manuell/automatisch)
  - Wort-Zerstörungen
  - Schwierigkeitsänderungen
  - Session-Dauer
  - Feature-Nutzung
  - Error-Tracking

### Geändert
- Analytics-Events werden sowohl lokal als auch an Google Analytics gesendet
- Verbesserte Debug-Ausgaben für Analytics-Funktionalität
- Optimierte Script-Ladereihenfolge für bessere Performance

## [1.4] - 2025-08-02

### Hinzugefügt
- **Leaderboard-Filterung nach Schwierigkeitsgrad** - Spieler können Highscores nach Schwierigkeit filtern
- **Verbesserte Highscore-Sortierung** - Optimierte Darstellung der Bestenlisten
- **Erweiterte Spaceship-Bewegungen** - Flüssigere Animationen und Soundeffekte
- **Vollbild-Highscore-Tabelle** - Score-Anzeige in der Vollbildansicht

### Verbessert
- Spaceship-Bewegung und Rotation für flüssigere Animationen
- Highscore-Sicherheit und Validierung gegen Manipulation
- Sound-Effekte für Spaceship-Aktionen

## [1.3] - 2025-08-02

### Hinzugefügt
- **Online Leaderboard-System** - Weltweite Bestenlisten mit API-Integration
- **Leaderboard API-Konfiguration** - Sichere Verbindung zu externen Highscore-Services
- **Responsive Overlay-Design** - Verbesserte Darstellung auf verschiedenen Bildschirmgrößen
- **Organisierte Dateistruktur** - Spieldateien in dediziertes `/game`-Verzeichnis verschoben

### Verbessert
- Leaderboard-Datenverarbeitung und API-Kommunikation
- Overlay-Responsivität für bessere mobile Erfahrung
- Modulare Spielkonfiguration

## [1.2] - 2025-08-01

### Hinzugefügt
- **Great A'Tuin Easter Egg** - Verstecktes Discworld-Feature
- **Zweites Hunter-Spaceship** - Zusätzlicher Gegner mit einzigartigen Visuals
- **Konfigurierbare Spaceship-Skalierung** - Anpassbare Größenverhältnisse
- **Erweiterte Animationspfade** - Verbesserte Bewegungsmuster
- **Debug- und Favicon-Erstellungsseiten** - Entwicklertools

### Verbessert
- Kern-Spiellogik und Benutzeroberfläche
- Modulare Spielkonfiguration
- Animation-Dauern und -Pfade

### Archiviert
- Legacy-Dateien nach Migration in Archive-Branches

## [1.1] - 2025-08-01

### Hinzugefügt
- **Schwierigkeitsgrade-System** - Leicht, Mittel, Schwer mit angepassten Parametern
- **Auto-Schild-System** - Automatischer Schutz vor kritischen Wörtern
- **Pause-Funktionalität** - Spiel pausiert bei Tab-Wechsel
- **Verbesserte Sound-Effekte** - Booster- und Interaktions-Sounds
- **Zielwort-Highlighting** - Markierung der anvisierten Wörter

### Verbessert
- Schild-Logik und Timer-Verhalten
- Spaceship-Targeting und Verteidigungsmechaniken
- Projektil-Kollisionserkennung
- DeltaTime-Berechnung für flüssigere Animationen

### Behoben
- Schild-Timer-Probleme
- Pause-Verhalten bei inaktiven Tabs
- Projektil-Lebensdauer für bessere Balance

## [1.0] - 2025-07-31

### Hinzugefügt
- **Homing-Projektile** - Zielverfolgende Ultra-Shots
- **Endgame-Pulsar-Effekt** - Visueller Abschluss-Effekt
- **Verbesserte UI** - Top-Kollision und überarbeitete Benutzeroberfläche
- **Spiel-Reset-Funktionalität** - Sauberer Neustart
- **Projektil-Zielberechnung** - Präzise Verfolgungslogik
- **Landing Page** - Attraktive Startseite

### Verbessert
- Homing-Projektil-Verhalten
- Projektil-Zielpositions-Berechnung
- Spiel-Schwierigkeit und Flow
- Spiel-Ende-Überprüfung für bessere Zuverlässigkeit

### Behoben
- Ultra-Shot-Bugs
- Projektil-Lebensdauer-Balance
- Zielverfolgungs-Genauigkeit

---

## Entwicklungshinweise

### Branch-Struktur
- `main` - Produktive Version
- `release-branch` - Release-Kandidaten
- `feature/*` - Feature-Entwicklung
- `bugfix/*` - Fehlerbehebungen
- `archive/*` - Archivierte Features

### Analytics-Integration
- Google Analytics 4 (G-87BH7WSYQ8)
- Google Tag Manager (GTM-PW8CBSFL)
- Lokales Backup-System
- Export-Funktionalität für Datenanalyse

### Tagging-System
- Version 1.5.0: Analytics-Integration
- Version 1.4: Leaderboard-Features
- Version 1.3: Online-Features
- Version 1.2: Multi-Spaceship

---

**Projektinfo:**
- Repository: word-defender
- Owner: geramaya
- Aktueller Branch: release-branch
- Letztes Update: 2025-08-02
