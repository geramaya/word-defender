// Game Configuration and Settings
// Spieleinstellungen, Level und Mechanik-Zahlen

const GAME_CONFIG = {
    // Stern-Animation Einstellungen
    stars: {
        count: 100,
        sizes: ['small', 'medium', 'large'],
        animationDuration: {
            small: 2, // Sekunden
            medium: 3,
            large: 4
        },
        maxAnimationDelay: 3 // Sekunden
    },

    // Partikel-System Einstellungen
    particles: {
        spawnInterval: 2000, // ms zwischen Partikeln
        size: {
            min: 2, // px
            max: 6  // px
        },
        animationDuration: {
            min: 6, // Sekunden
            max: 12 // Sekunden
        },
        lifetime: 14000, // ms - wie lange Partikel existieren
        colors: ['#4488ff', '#66aaff', '#88ccff']
    },

    // UI-Animationen
    animations: {
        smoothScrollDuration: 800, // ms
        hoverTransitionDuration: 300, // ms
        glowAnimationDuration: 3000, // ms
        floatAnimationDuration: 3000, // ms für Raumschiff
        wordFloatAnimationDuration: 4000, // ms für Demo-Wörter
        wordFloatDelay: 1000 // ms Verzögerung zwischen Wörtern
    },

    // Demo-Bereich Einstellungen
    demo: {
        words: ['HELLO', 'WORLD', 'DEFENDER'],
        spaceshipFloatRange: 20, // px Bewegungsbereich
        wordFloatRange: 10 // px Bewegungsbereich
    },

    // Responsive Breakpoints
    breakpoints: {
        mobile: 768, // px
        tablet: 1024, // px
        desktop: 1200 // px
    },

    // Farben und Stile
    colors: {
        primary: '#4488ff',
        primaryLight: '#66aaff',
        primaryDark: '#2266dd',
        secondary: '#ff4444',
        accent: '#44ff88',
        background: '#0a0a0a',
        backgroundLight: '#1a1a1a',
        text: '#ffffff',
        textSecondary: '#cccccc',
        textMuted: '#888888'
    },

    // Spiel-spezifische Statistiken (für die Stats-Sektion)
    gameStats: {
        totalWords: 12,
        weaponTypes: 4,
        availableShields: 3,
        gameMode: '∞', // Unendlich-Symbol
        languages: 8, // Anzahl verschiedener Sprachen
        maxDifficulty: 3 // Schwierigkeitsgrade
    }
};

// Hilfsfunktionen für Konfiguration
const CONFIG_UTILS = {
    // Zufällige Stern-Größe wählen
    getRandomStarSize() {
        const sizes = GAME_CONFIG.stars.sizes;
        return sizes[Math.floor(Math.random() * sizes.length)];
    },

    // Zufällige Partikel-Farbe wählen
    getRandomParticleColor() {
        const colors = GAME_CONFIG.particles.colors;
        return colors[Math.floor(Math.random() * colors.length)];
    },

    // Zufällige Animationsdauer für Partikel
    getRandomParticleDuration() {
        const min = GAME_CONFIG.particles.animationDuration.min;
        const max = GAME_CONFIG.particles.animationDuration.max;
        return Math.random() * (max - min) + min;
    },

    // Zufällige Partikel-Größe
    getRandomParticleSize() {
        const min = GAME_CONFIG.particles.size.min;
        const max = GAME_CONFIG.particles.size.max;
        return Math.random() * (max - min) + min;
    },

    // Prüfen ob Mobile-Gerät basierend auf Viewport
    isMobile() {
        return window.innerWidth <= GAME_CONFIG.breakpoints.mobile;
    },

    // Prüfen ob Tablet basierend auf Viewport
    isTablet() {
        return window.innerWidth <= GAME_CONFIG.breakpoints.tablet && 
               window.innerWidth > GAME_CONFIG.breakpoints.mobile;
    },

    // CSS-Werte für Animationen basierend auf Gerät
    getAnimationDuration(baseMs) {
        // Auf mobilen Geräten etwas schnellere Animationen
        const multiplier = this.isMobile() ? 0.8 : 1.0;
        return baseMs * multiplier;
    }
};

// Exportiere Konfiguration für Module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GAME_CONFIG, CONFIG_UTILS };
}
