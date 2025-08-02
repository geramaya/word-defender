// Hauptlogik für die Startseite (index.html)
// Initialisierung und Event-Handler

class IndexPageManager {
    constructor() {
        this.animationManager = null;
        this.isLoaded = false;
    }

    // Hauptinitialisierung
    init() {
        if (this.isLoaded) return;
        
        console.log('🚀 Word Defender Startseite wird initialisiert...');
        
        // Warten bis DOM vollständig geladen ist
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.onDOMReady());
        } else {
            this.onDOMReady();
        }
    }

    // DOM ist bereit
    onDOMReady() {
        this.isLoaded = true;
        
        // Performance Monitor starten (falls aktiviert)
        if (typeof PerformanceMonitor !== 'undefined') {
            PerformanceMonitor.init();
        }

        // Animation-System initialisieren
        this.initAnimations();
        
        // UI-Komponenten initialisieren
        this.initUIComponents();
        
        // Event-Listener einrichten
        this.setupEventListeners();
        
        // Accessibility-Features
        this.setupAccessibility();
        
        // Analytics/Tracking (falls gewünscht)
        this.initAnalytics();
        
        console.log('✅ Startseite erfolgreich initialisiert');
    }

    // Animation-System initialisieren
    initAnimations() {
        try {
            this.animationManager = new AnimationManager();
            this.animationManager.init();
            
            // Button-Effekte
            if (typeof ButtonEffects !== 'undefined') {
                ButtonEffects.init();
            }
            
            // Globale Referenz für andere Module
            window.animationManager = this.animationManager;
            
        } catch (error) {
            console.warn('Animation-System konnte nicht initialisiert werden:', error);
        }
    }

    // UI-Komponenten initialisieren
    initUIComponents() {
        this.updateGameStats();
        this.setupResponsiveImages();
        this.initLazyLoading();
    }

    // Spiel-Statistiken aktualisieren
    updateGameStats() {
        const stats = GAME_CONFIG.gameStats;
        
        // Statistik-Zahlen aus Konfiguration setzen
        const statElements = {
            words: document.querySelector('.stat:nth-child(1) .stat-number'),
            weapons: document.querySelector('.stat:nth-child(2) .stat-number'),
            shields: document.querySelector('.stat:nth-child(3) .stat-number'),
            mode: document.querySelector('.stat:nth-child(4) .stat-number')
        };

        if (statElements.words) statElements.words.textContent = stats.totalWords;
        if (statElements.weapons) statElements.weapons.textContent = stats.weaponTypes;
        if (statElements.shields) statElements.shields.textContent = stats.availableShields;
        if (statElements.mode) statElements.mode.textContent = stats.gameMode;
    }

    // Responsive Bilder einrichten
    setupResponsiveImages() {
        const previewImage = document.querySelector('.preview-image');
        if (previewImage && CONFIG_UTILS.isMobile()) {
            // Auf mobilen Geräten einfachere Darstellung
            previewImage.style.height = '200px';
        }
    }

    // Lazy Loading für Performance
    initLazyLoading() {
        // Intersection Observer für lazy loading von schweren Elementen
        const lazyElements = document.querySelectorAll('.preview-image, .demo-spaceship');
        
        const lazyObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('loaded');
                    lazyObserver.unobserve(entry.target);
                }
            });
        });

        lazyElements.forEach(el => lazyObserver.observe(el));
    }

    // Event-Listener einrichten
    setupEventListeners() {
        // Fenster-Größe Änderungen
        window.addEventListener('resize', this.throttle(() => {
            this.handleResize();
        }, 250));

        // Scroll-Events für Performance-optimierte Effekte
        window.addEventListener('scroll', this.throttle(() => {
            this.handleScroll();
        }, 16)); // ~60fps

        // Sichtbarkeits-Änderungen (Tab-Wechsel)
        document.addEventListener('visibilitychange', () => {
            this.handleVisibilityChange();
        });

        // Touch-Events für mobile Geräte
        if ('ontouchstart' in window) {
            this.setupTouchEvents();
        }

        // Keyboard-Navigation
        this.setupKeyboardNavigation();
    }

    // Fenster-Größe Änderung handhaben
    handleResize() {
        if (this.animationManager) {
            this.animationManager.handleResize();
        }
        
        this.setupResponsiveImages();
        this.updateViewportClasses();
    }

    // Scroll-Events handhaben
    handleScroll() {
        const scrollY = window.scrollY;
        
        // Parallax-Effekt für Header
        const header = document.querySelector('.header');
        if (header) {
            header.style.transform = `translateY(${scrollY * 0.3}px)`;
        }

        // Scroll-basierte Animationen
        this.updateScrollAnimations(scrollY);
    }

    // Viewport-Klassen aktualisieren
    updateViewportClasses() {
        document.body.classList.toggle('mobile', CONFIG_UTILS.isMobile());
        document.body.classList.toggle('tablet', CONFIG_UTILS.isTablet());
    }

    // Scroll-Animationen aktualisieren
    updateScrollAnimations(scrollY) {
        // Sterne langsam bewegen für Tiefeneffekt
        const stars = document.getElementById('stars');
        if (stars) {
            stars.style.transform = `translateY(${scrollY * 0.1}px)`;
        }
    }

    // Sichtbarkeits-Änderungen handhaben
    handleVisibilityChange() {
        if (document.hidden) {
            // Tab ist nicht sichtbar - Animationen pausieren für Performance
            this.pauseAnimations();
        } else {
            // Tab ist wieder sichtbar - Animationen fortsetzen
            this.resumeAnimations();
        }
    }

    // Touch-Events für mobile Geräte
    setupTouchEvents() {
        // Touch-Feedback für Buttons
        const buttons = document.querySelectorAll('.play-button, .feature');
        buttons.forEach(button => {
            button.addEventListener('touchstart', () => {
                button.classList.add('touched');
            });
            
            button.addEventListener('touchend', () => {
                setTimeout(() => {
                    button.classList.remove('touched');
                }, 300);
            });
        });
    }

    // Keyboard-Navigation einrichten
    setupKeyboardNavigation() {
        // Enter-Taste für Play-Button
        const playButton = document.querySelector('.play-button');
        if (playButton) {
            playButton.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    playButton.click();
                }
            });
        }

        // Tab-Navigation verbessern
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.add('keyboard-navigation');
            }
        });

        document.addEventListener('mousedown', () => {
            document.body.classList.remove('keyboard-navigation');
        });
    }

    // Accessibility-Features
    setupAccessibility() {
        // Reduced Motion Support
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            this.enableReducedMotion();
        }

        // High Contrast Support
        if (window.matchMedia('(prefers-contrast: high)').matches) {
            this.enableHighContrast();
        }

        // Focus-Indikatoren verbessern
        this.enhanceFocusIndicators();
    }

    // Reduzierte Bewegung aktivieren
    enableReducedMotion() {
        document.body.classList.add('reduced-motion');
        
        // Animationen deutlich verlangsamen oder deaktivieren
        if (this.animationManager) {
            // Partikel-System pausieren
            this.animationManager.destroy();
        }
    }

    // Hohen Kontrast aktivieren
    enableHighContrast() {
        document.body.classList.add('high-contrast');
    }

    // Focus-Indikatoren verbessern
    enhanceFocusIndicators() {
        const focusableElements = document.querySelectorAll('a, button, [tabindex]');
        focusableElements.forEach(el => {
            el.addEventListener('focus', () => {
                el.classList.add('keyboard-focus');
            });
            
            el.addEventListener('blur', () => {
                el.classList.remove('keyboard-focus');
            });
        });
    }

    // Animationen pausieren
    pauseAnimations() {
        if (this.animationManager) {
            this.animationManager.destroy();
        }
    }

    // Animationen fortsetzen
    resumeAnimations() {
        if (!this.animationManager) {
            this.initAnimations();
        }
    }

    // Analytics/Tracking initialisieren
    initAnalytics() {
        // Hier könnte Analytics-Code eingefügt werden
        console.log('📊 Analytics bereit (nicht implementiert)');
        
        // Beispiel für Event-Tracking
        this.trackPageView();
        this.setupEventTracking();
    }

    // Seitenaufruf tracken
    trackPageView() {
        console.log('📈 Seitenaufruf: Startseite');
    }

    // Event-Tracking einrichten
    setupEventTracking() {
        const playButton = document.querySelector('.play-button');
        if (playButton) {
            playButton.addEventListener('click', () => {
                console.log('🎮 Event: Play-Button geklickt');
            });
        }

        const features = document.querySelectorAll('.feature');
        features.forEach((feature, index) => {
            feature.addEventListener('click', () => {
                console.log(`📝 Event: Feature ${index + 1} angeklickt`);
            });
        });
    }

    // Utility: Throttle-Funktion für Performance
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Cleanup beim Verlassen der Seite
    destroy() {
        if (this.animationManager) {
            this.animationManager.destroy();
        }
        
        // Event-Listener entfernen
        window.removeEventListener('resize', this.handleResize);
        window.removeEventListener('scroll', this.handleScroll);
        
        console.log('🧹 Startseite Cleanup abgeschlossen');
    }
}

// Hauptinitialisierung
const pageManager = new IndexPageManager();
pageManager.init();

// Globale Referenz für Debug/Development
window.pageManager = pageManager;

// Cleanup beim Verlassen der Seite
window.addEventListener('beforeunload', () => {
    pageManager.destroy();
});

// Service Worker registrieren (falls vorhanden)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(() => {
            console.log('🔧 Service Worker registriert');
        }).catch(() => {
            console.log('🔧 Service Worker nicht verfügbar');
        });
    });
}
