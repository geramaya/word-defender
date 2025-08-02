// ========================================
// WORD DEFENDER - GAME CONFIGURATION
// ========================================
// Diese Datei enthält alle wichtigen Spielparameter und -einstellungen
// die aus game.js extrahiert wurden zur besseren Konfigurierbarkeit.

// ========================================
// GRUNDLEGENDE SPIELKONSTANTEN
// ========================================
export const GAME_CONSTANTS = {
    // Mathematische Konstanten
    PHI: 1.618033988749,
    
    // UI-Layout
    UI_BAR_HEIGHT: 60, // Muss mit der CSS-Höhe von .game-ui übereinstimmen
    
    // Spielfeld-Grundeinstellungen
    TOTAL_WORDS: 12,
    
    // Standard-Schwierigkeitsgrad
    DEFAULT_DIFFICULTY: 'mittel'
};

// ========================================
// SCHILD-SYSTEM KONFIGURATION
// ========================================
export const SHIELD_CONFIG = {
    // Schild-Grundeinstellungen
    INITIAL_SHIELD_COUNT: 3,
    MAX_SHIELDS: 3,
    BASE_SHIELD_COOLDOWN: 60000, // 60 Sekunden in Millisekunden
    
    // Auto-Schild System
    INITIAL_AUTO_SHIELD_COUNT: 0,
    MAX_AUTO_SHIELDS: 2,
    
    // Auto-Schild-Erhalt bei erfolgreichen Verteidigungen
    AUTO_SHIELD_AWARD_THRESHOLDS: [4, 8], // Bei 4. und 8. erfolgreicher Verteidigung
};

// ========================================
// BEACON-SYSTEM KONFIGURATION
// ========================================
export const BEACON_CONFIG = {
    MAX_BEACONS: 3,
    FIRST_BEACON_AT_DEFENSE: 4,     // Erstes Beacon bei 4. Verteidigung
    SUBSEQUENT_BEACON_INTERVAL: 2,  // Dann alle 2 Verteidigungen
};

// ========================================
// MINEN-SYSTEM KONFIGURATION
// ========================================
export const MINE_CONFIG = {
    SPAWN_INTERVAL: 30000,  // 30 Sekunden
    LIFESPAN: 10000,        // 10 Sekunden Lebensdauer
};

// ========================================
// PULSAR-SYSTEM KONFIGURATION
// ========================================
export const PULSAR_CONFIG = {
    // Pulsar-Phasen (basierend auf verbleibenden Wörtern)
    PHASE_1_WORD_THRESHOLD: 4,  // Phase 1 aktiviert wenn ≤4 Wörter
    PHASE_2_WORD_THRESHOLD: 2,  // Phase 2 aktiviert wenn ≤2 Wörter
    
    // Timing
    PHASE_1_CYCLE_TIME: 1000,   // 1 Sekunde für Phase 1
    PHASE_2_CYCLE_TIME: 500,    // 0.5 Sekunden für Phase 2
};

// ========================================
// ANGRIFFS-SYSTEM KONFIGURATION
// ========================================
export const ATTACK_CONFIG = {
    // Grund-Angriffsintervalle (in Millisekunden)
    INITIAL_ATTACK_INTERVAL: 10000, // 10 Sekunden beim Start
    REDUCED_ATTACK_INTERVAL: 8000,  // 8 Sekunden nach 4 erfolgreichen Verteidigungen
    
    // Dynamische Intervalle basierend auf verbleibenden Wörtern
    DYNAMIC_INTERVALS: {
        HIGH_WORDS: { threshold: 9, interval: 8000 },   // ≥9 Wörter: 8s
        MID_WORDS:  { threshold: 6, interval: 7000 },   // 6-8 Wörter: 7s
        LOW_WORDS:  { threshold: 3, interval: 6000 },   // 3-5 Wörter: 6s
        FINAL_WORDS: { threshold: 0, interval: 5000 }   // ≤2 Wörter: 5s
    },
    
    // Targeting-Zeit (Warnung vor Angriff)
    TARGETING_TIME: {
        MIN: 1200, // Minimale Targeting-Zeit in ms
        MAX: 1500  // Maximale Targeting-Zeit in ms
    },
    
    // Erste Angriffe-Verzögerung
    FIRST_ATTACK_DELAY: 20000 // 20 Sekunden bis zum ersten Angriff
};

// ========================================
// RAUMSCHIFF-KONFIGURATION
// ========================================
export const SPACESHIP_CONFIG = {
    // Geschwindigkeits-Grundeinstellungen
    BASE_CHASE_SPEED: 4.8,
    MAX_DESPERATION_MULTIPLIER: 1.5, // Bis zu 50% schneller wenn verzweifelt
    
    // Visuelle Größen-Parameter
    VISUAL: {
        SIZE_SCALE: 2.2,        // 120% Vergrößerung (2.2x original)
        SVG_VIEWBOX_SIZE: 50,   // Original SVG viewBox
        BASE_WIDTH: 50,         // Basis-Breite
        BASE_HEIGHT: 50,        // Basis-Höhe
        BOOSTER_SCALE: 2.5      // Booster-Effekte 150% größer
    },
    
    // Aggressivitäts-System
    AGGRESSION: {
        BASE_CHASE_THRESHOLD: 0.4,       // 40% Grundchance für Verfolgung
        MIN_CHASE_THRESHOLD: 0.15,       // Minimum 15% bei Verzweiflung
        HUNT_MODE_WORD_THRESHOLD: 4,     // Aggressiver Jagdmodus bei ≤4 Wörtern
        MAX_DIRECTION_CHANGE_SPEED: 3    // 3x schnellere Richtungsänderungen
    },
    
    // Physik-Parameter
    PHYSICS: {
        BASE_FRICTION: 0.995,
        MIN_FRICTION: 0.970,
        FRICTION_DESPERATION_FACTOR: 0.008,
        
        BASE_ROTATION_DAMPING: 0.998,
        ROTATION_DESPERATION_FACTOR: 0.003
    }
};

// ========================================
// PROJEKTIL-KONFIGURATION
// ========================================
export const PROJECTILE_CONFIG = {
    // Homing Projectile (Ultra-Nachschuss)
    HOMING: {
        DEFAULT_TURN_RATE: 0.04,        // Wendegeschwindigkeit
        LIFESPAN: 2500,                 // 2.5 Sekunden maximale Lebensdauer
        COLLISION_RADIUS: 15,           // Basis-Kollisionsradius
        TARGET_COLLISION_FACTOR: 0.4,   // Zusätzlicher Faktor basierend auf Zielgröße
    },
    
    // Standard-Kollisionsradius für Legacy-System
    STANDARD_COLLISION_RADIUS: 25
};

// ========================================
// BOOSTER-SYSTEM KONFIGURATION
// ========================================
export const BOOSTER_CONFIG = {
    BASE_FREQUENCY: 0.4,        // 40% Grundchance
    MAX_FREQUENCY: 0.9,         // Maximale 90% Chance bei Verzweiflung
    DESPERATION_BOOST: 0.5      // Zusätzliche 50% bei Verzweiflung
};

// ========================================
// SCORING-SYSTEM KONFIGURATION
// ========================================
export const SCORING_CONFIG = {
    // Punkteverteilung pro erfolgreiche Verteidigung
    POINTS_BY_DEFENSE: {
        0: 100,   // Erste Verteidigung
        1: 250,   // Zweite Verteidigung
        2: 500,   // Dritte Verteidigung
        DEFAULT: 500  // Alle weiteren Verteidigungen
    }
};

// ========================================
// SCHWIERIGKEITSGRAD-KONFIGURATION
// ========================================
export const DIFFICULTY_SETTINGS = {
    leicht: {
        name: 'Leicht',
        emoji: '🟢',
        description: 'Entspannt spielen',
        
        // Multiplikatoren für verschiedene Aspekte
        attackIntervalMultiplier: 1.5,     // 50% längere Intervalle
        targetingTimeMultiplier: 1.4,      // 40% längere Targeting-Zeit
        shieldCooldownMultiplier: 0.75,    // 25% schnellere Schild-Regeneration
        spaceshipSpeedMultiplier: 0.85,    // 15% langsameres Schiff
        boosterFrequencyMultiplier: 0.7,   // 30% weniger Booster
        
        // Spezielle Einstellungen
        maxAutoShields: 3  // Ein zusätzlicher Auto-Schild
    },
    
    mittel: {
        name: 'Mittel',
        emoji: '🟡',
        description: 'Ausgewogen',
        
        // Standard-Multiplikatoren (keine Änderung)
        attackIntervalMultiplier: 1.0,
        targetingTimeMultiplier: 1.0,
        shieldCooldownMultiplier: 1.0,
        spaceshipSpeedMultiplier: 1.0,
        boosterFrequencyMultiplier: 1.0,
        
        maxAutoShields: 2  // Standard Auto-Schilde
    },
    
    schwer: {
        name: 'Schwer',
        emoji: '🔴',
        description: 'Hardcore-Modus',
        
        // Verschärfte Multiplikatoren
        attackIntervalMultiplier: 0.7,     // 30% kürzere Intervalle
        targetingTimeMultiplier: 0.7,      // 30% kürzere Targeting-Zeit
        shieldCooldownMultiplier: 1.3,     // 30% langsamere Schild-Regeneration
        spaceshipSpeedMultiplier: 1.2,     // 20% schnelleres Schiff
        boosterFrequencyMultiplier: 1.3,   // 30% mehr Booster
        
        maxAutoShields: 1  // Nur ein Auto-Schild
    }
};

// ========================================
// ONLINE LEADERBOARD KONFIGURATION
// ========================================
export const LEADERBOARD_CONFIG = {
    // API-Konfiguration (kann angepasst werden)
    API_URL: 'https://api.jsonbin.io/v3/b/688db663f7e7a370d1f21314', // Beispiel-URL
    API_KEY: '$2a$10$urO2Arfpa17B8pEkR9i5ce0I43zavxeYMlI6cqKvdDHtF2Z8/Q9GS', // JsonBin.io API Key
    
    // Leaderboard-Limits
    LOCAL_HIGHSCORE_LIMIT: 10,
    ONLINE_HIGHSCORE_LIMIT: 50,
    DISPLAY_ONLINE_LIMIT: 20,
    DISPLAY_START_SCREEN_LIMIT: 8
};

// ========================================
// AUDIO-SYSTEM KONFIGURATION
// ========================================
export const AUDIO_CONFIG = {
    // Master-Lautstärke-Einstellungen
    MASTER_VOLUMES: {
        BOOSTER: 0.6,
        LASER: 0.2,
        ULTRA_LASER: 0.6,
        SOFT_WOOSH: 0.60,
        EXPLOSION: 0.4,
        SHIELD: 0.3,
        SHIELD_DEFLECTION: 0.25
    },
    
    // Sound-Dauer-Einstellungen
    DURATIONS: {
        BOOSTER: 1.2,
        LASER: 0.2,
        ULTRA_LASER: 0.45,
        SOFT_WOOSH: 0.50,
        EXPLOSION: 0.8,
        SHIELD: 0.3,
        SHIELD_DEFLECTION: 0.15
    }
};

// ========================================
// UI-UPDATE KONFIGURATION
// ========================================
export const UI_CONFIG = {
    UPDATE_INTERVAL: 1000, // UI-Updates alle 1000ms (1 Sekunde)
    
    // Aggressivitätsstufen für UI-Anzeige
    AGGRESSION_LEVELS: {
        CALM: { threshold: 1.5, label: 'RUHIG', class: 'calm' },
        AGGRESSIVE: { threshold: 2.5, label: 'AGGRESSIV', class: 'aggressive' },
        HUNTING: { threshold: 3.0, label: 'JAGDMODUS', class: 'hunting' },
        FORCED: { threshold: Infinity, label: 'ZWANGSMODUS', class: 'forced' }
    }
};

// ========================================
// NOTFALL-SYSTEM KONFIGURATION
// ========================================
export const EMERGENCY_CONFIG = {
    // Notfall-Overlay aktiviert sich bei wenigen Wörtern
    EMERGENCY_WORD_THRESHOLD: 3,
    
    // Zweiter Jäger wird gespawnt bei kritischen Worten
    SECOND_HUNTER_WORD_THRESHOLD: 3
};

// ========================================
// UTILITY-FUNKTIONEN
// ========================================
export const CONFIG_UTILS = {
    /**
     * Holt die Schwierigkeitsgrad-Einstellungen für den aktuellen oder angegebenen Schwierigkeitsgrad
     * @param {string} difficulty - Der Schwierigkeitsgrad ('leicht', 'mittel', 'schwer')
     * @returns {object} Die Schwierigkeitsgrad-Einstellungen
     */
    getDifficultySettings(difficulty = null) {
        const currentDifficulty = difficulty || localStorage.getItem('wordDefenderDifficulty') || GAME_CONSTANTS.DEFAULT_DIFFICULTY;
        return DIFFICULTY_SETTINGS[currentDifficulty] || DIFFICULTY_SETTINGS[GAME_CONSTANTS.DEFAULT_DIFFICULTY];
    },
    
    /**
     * Berechnet den Angriffs-Intervall basierend auf verbleibenden Wörtern und Schwierigkeitsgrad
     * @param {number} remainingWords - Anzahl verbleibender Wörter
     * @param {string} difficulty - Optional: Schwierigkeitsgrad
     * @returns {number} Angriffs-Intervall in Millisekunden
     */
    calculateAttackInterval(remainingWords, difficulty = null) {
        const settings = this.getDifficultySettings(difficulty);
        let baseInterval;
        
        const intervals = ATTACK_CONFIG.DYNAMIC_INTERVALS;
        if (remainingWords >= intervals.HIGH_WORDS.threshold) {
            baseInterval = intervals.HIGH_WORDS.interval;
        } else if (remainingWords >= intervals.MID_WORDS.threshold) {
            baseInterval = intervals.MID_WORDS.interval;
        } else if (remainingWords >= intervals.LOW_WORDS.threshold) {
            baseInterval = intervals.LOW_WORDS.interval;
        } else {
            baseInterval = intervals.FINAL_WORDS.interval;
        }
        
        return Math.round(baseInterval * settings.attackIntervalMultiplier);
    },
    
    /**
     * Berechnet die Targeting-Zeit basierend auf verbleibenden Wörtern und Schwierigkeitsgrad
     * @param {number} remainingWords - Anzahl verbleibender Wörter
     * @param {string} difficulty - Optional: Schwierigkeitsgrad
     * @returns {number} Targeting-Zeit in Millisekunden
     */
    calculateTargetingTime(remainingWords, difficulty = null) {
        const settings = this.getDifficultySettings(difficulty);
        const minTime = ATTACK_CONFIG.TARGETING_TIME.MIN * settings.targetingTimeMultiplier;
        const maxTime = ATTACK_CONFIG.TARGETING_TIME.MAX * settings.targetingTimeMultiplier;
        
        // Mehr Wörter = längere Zeit, weniger Wörter = kürzere Zeit
        const wordRatio = remainingWords / GAME_CONSTANTS.TOTAL_WORDS;
        return minTime + (maxTime - minTime) * wordRatio;
    },
    
    /**
     * Berechnet die Raumschiff-Geschwindigkeit basierend auf Verzweiflung und Schwierigkeitsgrad
     * @param {number} remainingWords - Anzahl verbleibender Wörter
     * @param {string} difficulty - Optional: Schwierigkeitsgrad
     * @returns {number} Geschwindigkeit
     */
    calculateSpaceshipSpeed(remainingWords, difficulty = null) {
        const settings = this.getDifficultySettings(difficulty);
        const baseSpeed = SPACESHIP_CONFIG.BASE_CHASE_SPEED * settings.spaceshipSpeedMultiplier;
        const desperationMultiplier = (GAME_CONSTANTS.TOTAL_WORDS - remainingWords) / GAME_CONSTANTS.TOTAL_WORDS * SPACESHIP_CONFIG.MAX_DESPERATION_MULTIPLIER;
        return baseSpeed * (1 + desperationMultiplier);
    },
    
    /**
     * Berechnet die Booster-Frequenz basierend auf Verzweiflung und Schwierigkeitsgrad
     * @param {number} remainingWords - Anzahl verbleibender Wörter
     * @param {string} difficulty - Optional: Schwierigkeitsgrad
     * @returns {number} Booster-Frequenz (0.0 - 1.0)
     */
    calculateBoosterFrequency(remainingWords, difficulty = null) {
        const settings = this.getDifficultySettings(difficulty);
        const baseFrequency = BOOSTER_CONFIG.BASE_FREQUENCY * settings.boosterFrequencyMultiplier;
        const desperationFactor = (GAME_CONSTANTS.TOTAL_WORDS - remainingWords) / GAME_CONSTANTS.TOTAL_WORDS;
        const dynamicFrequency = Math.min(BOOSTER_CONFIG.MAX_FREQUENCY, baseFrequency + desperationFactor * BOOSTER_CONFIG.DESPERATION_BOOST);
        return dynamicFrequency;
    },
    
    /**
     * Berechnet Punkte basierend auf aufeinanderfolgenden erfolgreichen Verteidigungen
     * @param {number} consecutiveDefenses - Anzahl aufeinanderfolgender erfolgreicher Verteidigungen
     * @returns {number} Punkte für diese Verteidigung
     */
    calculateScore(consecutiveDefenses) {
        const points = SCORING_CONFIG.POINTS_BY_DEFENSE;
        return points[consecutiveDefenses] || points.DEFAULT;
    },
    
    /**
     * Formatiert Zeit in MM:SS Format
     * @param {number} seconds - Zeit in Sekunden
     * @returns {string} Formatierte Zeit
     */
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
};

// ========================================
// EXPORT DEFAULT CONFIGURATION
// ========================================
export default {
    GAME_CONSTANTS,
    SHIELD_CONFIG,
    BEACON_CONFIG,
    MINE_CONFIG,
    PULSAR_CONFIG,
    ATTACK_CONFIG,
    SPACESHIP_CONFIG,
    PROJECTILE_CONFIG,
    BOOSTER_CONFIG,
    SCORING_CONFIG,
    DIFFICULTY_SETTINGS,
    LEADERBOARD_CONFIG,
    AUDIO_CONFIG,
    UI_CONFIG,
    EMERGENCY_CONFIG,
    CONFIG_UTILS
};
