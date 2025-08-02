# Legacy Dateien - Word Defender

Dieser Ordner enthält alle Dateien, die nach der Migration zu ES6-Modulen und der Konfigurationsextrahierung nicht mehr aktiv verwendet werden.

## Verschobene Dateien:

### Alte Spielversionen:
- `defender.html` - Ursprüngliche Spielversion
- `index.html` - Alte Startseite
- `index.js` - Alte JavaScript-Hauptdatei
- `index-styles.css` - Alte CSS-Datei für die Startseite

### Ersetzt durch neue Architektur:
- `config.js` - Alte Konfigurationsdatei (ersetzt durch `game_config.js`)
- `animations.js` - Separate Animationsdatei (jetzt in `game.js` integriert)

### Backup und Test-Dateien:
- `game.js.backup` - Backup der game.js vor der Migration
- `create_favicon.html` - Hilfsdatei zur Favicon-Erstellung
- `debug.html` - Debug-Testdatei während der Migration
- `debug_simple.html` - Einfache Debug-Testdatei
- `minimal_test.html` - Minimaler Test für Overlay-Probleme
- `test_config.html` - Test für Konfigurationssystem
- `test_start.html` - Test für Start-Screen

## Aktuelle Projektstruktur:

Nach der Migration bestehen die aktiven Dateien aus:
- `game.html` - Hauptspiel (ES6-Module)
- `game.js` - Spiellogik mit CONFIG-Integration
- `game_config.js` - Zentrale Konfiguration (98+ Parameter)
- `styles.css` - Haupt-CSS-Datei
- `words.json` - Wortdaten

## Migration abgeschlossen am: 1. August 2025

Die Migration zu ES6-Modulen und zentraler Konfiguration wurde erfolgreich abgeschlossen. Alle Legacy-Dateien sind hier archiviert für Referenzzwecke.
