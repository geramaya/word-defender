# Word Defender - Schwierigkeitsgrade

## Übersicht

Word Defender bietet drei verschiedene Schwierigkeitsgrade, die das Spielerlebnis an unterschiedliche Spielertypen anpassen. Jeder Schwierigkeitsgrad modifiziert mehrere Gameplay-Parameter, um eine ausgewogene Herausforderung zu bieten.

---

## 🟢 LEICHT - "Entspannt spielen"

**Zielgruppe:** Neue Spieler, Casual-Gamer, entspannte Sessions

### Anpassungen:
- **Angriffsintervalle:** +50% länger (12s→7.5s statt 8s→5s)
- **Targeting-Zeit:** +40% mehr Zeit (1.68s→2.1s statt 1.2s→1.5s)
- **Schild-Regeneration:** +25% schneller (45s statt 60s)
- **Auto-Schilde:** 3 verfügbar (statt 2)
- **Raumschiff-Geschwindigkeit:** -15% langsamer
- **Booster-Angriffe:** -30% weniger häufig

### Gameplay-Effekt:
- Mehr Zeit zum Reagieren auf Angriffe
- Häufigere Schild-Verfügbarkeit
- Weniger aggressive Raumschiff-Bewegungen
- Zusätzlicher Auto-Schild als Sicherheitsnetz
- Entspannteres Spieltempo

---

## 🟡 MITTEL - "Ausgewogen"

**Zielgruppe:** Erfahrene Spieler, Standard-Erfahrung

### Anpassungen:
- **Angriffsintervalle:** Standard (8s→5s)
- **Targeting-Zeit:** Standard (1.2s→1.5s)
- **Schild-Regeneration:** Standard (60s)
- **Auto-Schilde:** 2 verfügbar
- **Raumschiff-Geschwindigkeit:** Standard
- **Booster-Angriffe:** Standard-Häufigkeit

### Gameplay-Effekt:
- Ausgewogene Balance zwischen Herausforderung und Fairness
- Alle Spielmechaniken in ihrer ursprünglich geplanten Form
- Optimaler Schwierigkeitsgrad für die meisten Spieler

---

## 🔴 SCHWER - "Hardcore-Modus"

**Zielgruppe:** Hardcore-Gamer, Herausforderung suchende Spieler

### Anpassungen:
- **Angriffsintervalle:** -30% kürzer (5.6s→3.5s statt 8s→5s)
- **Targeting-Zeit:** -30% weniger Zeit (0.84s→1.05s statt 1.2s→1.5s)
- **Schild-Regeneration:** +30% langsamer (78s statt 60s)
- **Auto-Schilde:** Nur 1 verfügbar (statt 2)
- **Raumschiff-Geschwindigkeit:** +20% schneller
- **Booster-Angriffe:** +30% häufiger

### Gameplay-Effekt:
- Extrem schnelle Reaktionszeiten erforderlich
- Weniger Schild-Verfügbarkeit für kritische Momente
- Aggressivere Raumschiff-Bewegungen
- Reduzierte Auto-Schild-Hilfe
- Intensives, anspruchsvolles Gameplay

---

## Technische Implementation

### Parameter-Multiplikatoren

```javascript
function getDifficultySettings() {
    const difficulty = localStorage.getItem('wordDefenderDifficulty') || 'mittel';
    
    switch(difficulty) {
        case 'leicht':
            return {
                attackIntervalMultiplier: 1.5,     // 50% längere Intervalle
                targetingTimeMultiplier: 1.4,      // 40% längere Targeting-Zeit
                shieldCooldownMultiplier: 0.75,    // 25% schnellere Regeneration
                maxAutoShields: 3,                 // Ein zusätzlicher Auto-Schild
                spaceshipSpeedMultiplier: 0.85,    // 15% langsameres Schiff
                boosterFrequencyMultiplier: 0.7    // 30% weniger Booster
            };
        case 'schwer':
            return {
                attackIntervalMultiplier: 0.7,     // 30% kürzere Intervalle
                targetingTimeMultiplier: 0.7,      // 30% kürzere Targeting-Zeit
                shieldCooldownMultiplier: 1.3,     // 30% langsamere Regeneration
                maxAutoShields: 1,                 // Nur ein Auto-Schild
                spaceshipSpeedMultiplier: 1.2,     // 20% schnelleres Schiff
                boosterFrequencyMultiplier: 1.3    // 30% mehr Booster
            };
        default: // mittel
            return {
                attackIntervalMultiplier: 1.0,
                targetingTimeMultiplier: 1.0,
                shieldCooldownMultiplier: 1.0,
                maxAutoShields: 2,
                spaceshipSpeedMultiplier: 1.0,
                boosterFrequencyMultiplier: 1.0
            };
    }
}
```

### Betroffene Funktionen

Die folgenden Gameplay-Funktionen werden durch das Schwierigkeitsgrad-System beeinflusst:

1. **`calculateAttackInterval()`** - Bestimmt die Zeit zwischen Angriffen
2. **`calculateTargetingTime()`** - Bestimmt die Targeting-Dauer
3. **`calculateSpaceshipChaseSpeed()`** - Bestimmt die Raumschiff-Geschwindigkeit
4. **`awardPoints()`** - Bestimmt die maximale Anzahl an Auto-Schilden
5. **`startGame()`** - Wendet Schild-Cooldown-Modifikationen an

---

## UI-Integration

### Auswahl-Dialog
- Drei farbcodierte Buttons im Startbildschirm
- Visuelle Unterscheidung durch Farben (Grün/Gelb/Rot)
- Kurze Beschreibung unter jedem Button
- Auswahl wird lokal gespeichert

### In-Game Anzeige
- Schwierigkeitsgrad-Badge in der oberen UI-Leiste
- Farbcodierte Anzeige entsprechend der Auswahl
- Live-Feedback über den aktuellen Modus

---

## Balancing-Überlegungen

### Design-Philosophie
- **LEICHT:** Fehlerverzeihend, mehr Zeit zum Lernen
- **MITTEL:** Ausgewogen, optimale Spielerfahrung
- **SCHWER:** Unerbittlich, maximale Herausforderung

### Testempfehlungen
- Neue Spieler sollten mit LEICHT beginnen
- Erfahrene Arcade-Spieler können direkt zu MITTEL
- SCHWER ist für Spieler gedacht, die Perfektion anstreben

### Langzeit-Motivation
- Progression durch Schwierigkeitsgrade
- Separate Highscore-Listen pro Schwierigkeitsgrad (potenzielle Erweiterung)
- Achievements für das Überleben auf verschiedenen Schwierigkeitsgraden

---

## Zukünftige Erweiterungen

### Mögliche Zusatz-Features
- **Dynamische Schwierigkeit:** Automatische Anpassung basierend auf Spielerleistung
- **Custom-Schwierigkeit:** Manuelle Anpassung einzelner Parameter
- **Zeitbasierte Modi:** Survival-Modus, Speed-Run-Modus
- **Getrennte Highscores:** Separate Ranglisten pro Schwierigkeitsgrad

### Analytics-Integration
- Tracking der bevorzugten Schwierigkeitsgrade
- Durchschnittliche Überlebenszeiten pro Schwierigkeitsgrad
- Conversion-Rate zwischen den Schwierigkeitsgraden
