// Animation System für die Startseite
// Sterne, Partikel und andere visuelle Effekte

class AnimationManager {
    constructor() {
        this.starsContainer = null;
        this.particleInterval = null;
        this.activeParticles = [];
    }

    // Initialisierung des Animations-Systems
    init() {
        this.starsContainer = document.getElementById('stars');
        if (this.starsContainer) {
            this.createStars();
        }
        this.startParticleSystem();
        this.setupScrollAnimations();
    }

    // Stern-System erstellen
    createStars() {
        const starCount = GAME_CONFIG.stars.count;
        
        // Weniger Sterne auf mobilen Geräten für Performance
        const adjustedCount = CONFIG_UTILS.isMobile() ? Math.floor(starCount * 0.6) : starCount;
        
        for (let i = 0; i < adjustedCount; i++) {
            this.createSingleStar();
        }
    }

    // Einzelnen Stern erstellen
    createSingleStar() {
        const star = document.createElement('div');
        star.className = 'star';
        
        // Zufällige Stern-Größe
        const size = CONFIG_UTILS.getRandomStarSize();
        star.classList.add(size);
        
        // Zufällige Position
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        
        // Zufällige Animations-Verzögerung
        const delay = Math.random() * GAME_CONFIG.stars.maxAnimationDelay;
        star.style.animationDelay = delay + 's';
        
        // Angepasste Animationsdauer für Gerätetyp
        const baseDuration = GAME_CONFIG.stars.animationDuration[size] * 1000;
        const duration = CONFIG_UTILS.getAnimationDuration(baseDuration);
        star.style.animationDuration = (duration / 1000) + 's';
        
        this.starsContainer.appendChild(star);
    }

    // Partikel-System starten
    startParticleSystem() {
        // Weniger häufige Partikel auf mobilen Geräten
        const interval = CONFIG_UTILS.isMobile() ? 
            GAME_CONFIG.particles.spawnInterval * 1.5 : 
            GAME_CONFIG.particles.spawnInterval;
            
        this.particleInterval = setInterval(() => {
            this.createParticle();
        }, interval);
    }

    // Einzelnes Partikel erstellen
    createParticle() {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // Zufällige Größe
        const size = CONFIG_UTILS.getRandomParticleSize();
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        
        // Zufällige horizontale Position
        particle.style.left = Math.random() * 100 + '%';
        
        // Zufällige Farbe
        particle.style.backgroundColor = CONFIG_UTILS.getRandomParticleColor();
        
        // Zufällige Animationsdauer
        const duration = CONFIG_UTILS.getRandomParticleDuration();
        const adjustedDuration = CONFIG_UTILS.getAnimationDuration(duration * 1000);
        particle.style.animationDuration = (adjustedDuration / 1000) + 's';
        
        document.body.appendChild(particle);
        this.activeParticles.push(particle);
        
        // Partikel nach Lebensdauer entfernen
        setTimeout(() => {
            this.removeParticle(particle);
        }, GAME_CONFIG.particles.lifetime);
    }

    // Partikel entfernen
    removeParticle(particle) {
        if (particle && particle.parentNode) {
            particle.remove();
        }
        
        // Aus aktiven Partikeln entfernen
        const index = this.activeParticles.indexOf(particle);
        if (index > -1) {
            this.activeParticles.splice(index, 1);
        }
    }

    // Scroll-Animationen einrichten
    setupScrollAnimations() {
        // Smooth Scrolling für interne Links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });

        // Intersection Observer für Fade-in Animationen
        this.setupIntersectionObserver();
    }

    // Intersection Observer für Scroll-basierte Animationen
    setupIntersectionObserver() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in');
                }
            });
        }, observerOptions);

        // Elemente für Fade-in Animation beobachten
        document.querySelectorAll('.feature, .game-preview, .game-stats').forEach(el => {
            observer.observe(el);
        });
    }

    // Performance-optimierte Partikel-Begrenzung
    limitParticles() {
        const maxParticles = CONFIG_UTILS.isMobile() ? 15 : 30;
        
        while (this.activeParticles.length > maxParticles) {
            const oldestParticle = this.activeParticles.shift();
            this.removeParticle(oldestParticle);
        }
    }

    // Animation-System stoppen (für Cleanup)
    destroy() {
        if (this.particleInterval) {
            clearInterval(this.particleInterval);
            this.particleInterval = null;
        }

        // Alle aktiven Partikel entfernen
        this.activeParticles.forEach(particle => {
            this.removeParticle(particle);
        });
        this.activeParticles = [];
    }

    // Responsive Anpassungen
    handleResize() {
        // Bei Größenänderung Partikel-Anzahl anpassen
        this.limitParticles();
        
        // Partikel-Spawn-Rate anpassen
        if (this.particleInterval) {
            clearInterval(this.particleInterval);
            this.startParticleSystem();
        }
    }
}

// Button-Hover-Effekte
class ButtonEffects {
    static init() {
        const playButton = document.querySelector('.play-button');
        if (playButton) {
            this.setupPlayButtonEffects(playButton);
        }

        const featureCards = document.querySelectorAll('.feature');
        featureCards.forEach(card => {
            this.setupCardHoverEffects(card);
        });
    }

    static setupPlayButtonEffects(button) {
        button.addEventListener('mouseenter', () => {
            button.style.transform = 'translateY(-3px) scale(1.02)';
        });

        button.addEventListener('mouseleave', () => {
            button.style.transform = 'translateY(0) scale(1)';
        });

        // Ripple-Effekt beim Klick
        button.addEventListener('click', (e) => {
            const ripple = document.createElement('span');
            const rect = button.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('ripple');
            
            button.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    }

    static setupCardHoverEffects(card) {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-8px) rotateX(5deg)';
            card.style.boxShadow = '0 15px 40px rgba(68, 136, 255, 0.3)';
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0) rotateX(0deg)';
            card.style.boxShadow = 'none';
        });
    }
}

// Performance Monitor für Animationen
class PerformanceMonitor {
    static init() {
        this.frameCount = 0;
        this.lastTime = performance.now();
        this.fpsDisplay = false; // Set to true for debugging
        
        if (this.fpsDisplay) {
            this.createFPSDisplay();
        }
        
        this.startMonitoring();
    }

    static startMonitoring() {
        const monitor = () => {
            this.frameCount++;
            const currentTime = performance.now();
            
            if (currentTime - this.lastTime >= 1000) {
                const fps = this.frameCount;
                this.frameCount = 0;
                this.lastTime = currentTime;
                
                // Performance-Anpassungen basierend auf FPS
                if (fps < 30) {
                    this.reducePerfomance();
                } else if (fps > 50) {
                    this.increasePerfomance();
                }
                
                if (this.fpsDisplay) {
                    this.updateFPSDisplay(fps);
                }
            }
            
            requestAnimationFrame(monitor);
        };
        
        requestAnimationFrame(monitor);
    }

    static reducePerfomance() {
        // Weniger Partikel bei schlechter Performance
        const animationManager = window.animationManager;
        if (animationManager) {
            animationManager.limitParticles();
        }
    }

    static increasePerfomance() {
        // Mehr Effekte bei guter Performance möglich
        // Implementierung für erweiterte Effekte
    }

    static createFPSDisplay() {
        const fpsDiv = document.createElement('div');
        fpsDiv.id = 'fps-display';
        fpsDiv.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0,0,0,0.8);
            color: #4488ff;
            padding: 5px 10px;
            border-radius: 5px;
            font-family: monospace;
            z-index: 9999;
        `;
        document.body.appendChild(fpsDiv);
    }

    static updateFPSDisplay(fps) {
        const display = document.getElementById('fps-display');
        if (display) {
            display.textContent = `FPS: ${fps}`;
            display.style.color = fps < 30 ? '#ff4444' : fps < 50 ? '#ffaa44' : '#44ff88';
        }
    }
}

// Exportiere für Module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AnimationManager, ButtonEffects, PerformanceMonitor };
}
