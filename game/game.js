// Import der Game-Konfiguration
import CONFIG from './game_config.js';
import SecureStorage from './security_utils.js';

const PHI = CONFIG.GAME_CONSTANTS.PHI;
const UI_BAR_HEIGHT = CONFIG.GAME_CONSTANTS.UI_BAR_HEIGHT;
let containerWidth = window.innerWidth;
let containerHeight = window.innerHeight;

let wordsData = [];
let floatingTexts = [];

let spaceshipController;
let secondSpaceshipController = null;
let restartButton = null;
let gameStarted = false;
let gameStartTime = 0;

// Game state variables with pause functionality
let isPaused = false;
let pauseStartTime = 0;

// Global array for active homing projectiles
let activeProjectiles = [];

// Shield system
let shieldCount = CONFIG.SHIELD_CONFIG.INITIAL_SHIELD_COUNT;
let maxShields = CONFIG.SHIELD_CONFIG.MAX_SHIELDS;
let shieldCooldown = CONFIG.SHIELD_CONFIG.BASE_SHIELD_COOLDOWN; // 60 seconds
let lastShieldTime = 0;
let protectedWords = new Set();

// Beacon mine system
let spaceBeacons = [];
let maxBeacons = CONFIG.BEACON_CONFIG.MAX_BEACONS;
let beaconDeploymentCounter = 0; // Track defenses for beacon deployment
let nextBeaconAt = CONFIG.BEACON_CONFIG.FIRST_BEACON_AT_DEFENSE; // First beacon at 4th defense, then every 2nd

// Floating mine system
let floatingMines = [];
let mineSpawnTimer = null;
// Pulsar endgame system
let pulsarElement = null;
let pulsarPhase = 0; // 0 = inactive, 1 = phase1 (≤4 words), 2 = phase2 (≤2 words)
let pulsarTimer = 0;
let pulsarCycleTime = CONFIG.PULSAR_CONFIG.PHASE_1_CYCLE_TIME; // 1 second for phase 1, 0.5 second for phase 2
let pulsarCycleCount = 0;
let pulsarActive = false; // Whether currently pulling words

// Variablen für das Autoschild-System
let autoShieldCount = CONFIG.SHIELD_CONFIG.INITIAL_AUTO_SHIELD_COUNT;
const MAX_AUTO_SHIELDS = CONFIG.SHIELD_CONFIG.MAX_AUTO_SHIELDS;

let mineSpawnInterval = CONFIG.MINE_CONFIG.SPAWN_INTERVAL; // 30 seconds
let mineLifespan = CONFIG.MINE_CONFIG.LIFESPAN; // 10 seconds

// Difficulty system
let currentDifficulty = CONFIG.GAME_CONSTANTS.DEFAULT_DIFFICULTY; // default

// Scoring system
let currentScore = 0;
let consecutiveSuccessfulDefenses = 0;
let attackInterval = CONFIG.ATTACK_CONFIG.INITIAL_ATTACK_INTERVAL; // Start at 10 seconds
let hasFirstAttackHappened = false;
let defendedWordsCounter = 0;

// Sound system
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// Sound limiting to prevent multiple simultaneous boost sounds
let lastBoostSoundTime = 0;
const BOOST_SOUND_COOLDOWN = 500; // 500ms minimum between boost sounds

function createBoosterSound() {
    // Create multiple oscillators for complex jet afterburner sound
    const osc1 = audioContext.createOscillator();
    const osc2 = audioContext.createOscillator();
    const osc3 = audioContext.createOscillator(); // Added high-pitched scream
    const noiseBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.1, audioContext.sampleRate);
    const noiseSource = audioContext.createBufferSource();
    
    // Create noise for turbulent jet sound
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseBuffer.length; i++) {
        output[i] = Math.random() * 2 - 1;
    }
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;
    
    const gain1 = audioContext.createGain();
    const gain2 = audioContext.createGain();
    const gain3 = audioContext.createGain();
    const noiseGain = audioContext.createGain();
    const masterGain = audioContext.createGain();
    
    // Connect everything
    osc1.connect(gain1);
    osc2.connect(gain2);
    osc3.connect(gain3);
    noiseSource.connect(noiseGain);
    gain1.connect(masterGain);
    gain2.connect(masterGain);
    gain3.connect(masterGain);
    noiseGain.connect(masterGain);
    masterGain.connect(audioContext.destination);
    
    // Jet afterburner: explosive start, then fading rumble
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(120, audioContext.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(80, audioContext.currentTime + 0.05);
    osc1.frequency.exponentialRampToValueAtTime(45, audioContext.currentTime + 1.0);
    
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(200, audioContext.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(30, audioContext.currentTime + 0.8);
    
    // High-pitched scream for brightness
    osc3.type = 'square';
    osc3.frequency.setValueAtTime(1200, audioContext.currentTime);
    osc3.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.03);
    osc3.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.15);
    
    // Sharp blast at start, then long fade
    gain1.gain.setValueAtTime(0.6, audioContext.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.3, audioContext.currentTime + 0.05);
    gain1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.2);
    
    gain2.gain.setValueAtTime(0.4, audioContext.currentTime);
    gain2.gain.exponentialRampToValueAtTime(0.1, audioContext.currentTime + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.0);
    
    // Bright scream - short but piercing
    gain3.gain.setValueAtTime(0.5, audioContext.currentTime);
    gain3.gain.exponentialRampToValueAtTime(0.2, audioContext.currentTime + 0.03);
    gain3.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    
    // Noise for turbulent jet texture
    noiseGain.gain.setValueAtTime(0.2, audioContext.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.05, audioContext.currentTime + 0.1);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.8);
    
    masterGain.gain.setValueAtTime(0.6, audioContext.currentTime); // Slightly louder
    
    osc1.start(audioContext.currentTime);
    osc2.start(audioContext.currentTime);
    osc3.start(audioContext.currentTime);
    noiseSource.start(audioContext.currentTime);
    
    osc1.stop(audioContext.currentTime + 1.2);
    osc2.stop(audioContext.currentTime + 1.0);
    osc3.stop(audioContext.currentTime + 0.2);
    noiseSource.stop(audioContext.currentTime + 0.8);
}

function createLaserSound() {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Laser sound: high-pitched zap
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.2);
    
    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
}

function createUltraLaserSound() {
    // Ultra laser: more complex, powerful sound
    const osc1 = audioContext.createOscillator();
    const osc2 = audioContext.createOscillator();
    const osc3 = audioContext.createOscillator();
    
    const gain1 = audioContext.createGain();
    const gain2 = audioContext.createGain();
    const gain3 = audioContext.createGain();
    const masterGain = audioContext.createGain();
    
    osc1.connect(gain1);
    osc2.connect(gain2);
    osc3.connect(gain3);
    gain1.connect(masterGain);
    gain2.connect(masterGain);
    gain3.connect(masterGain);
    masterGain.connect(audioContext.destination);
    
    // Ultra laser: deeper, more powerful sound
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(400, audioContext.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(150, audioContext.currentTime + 0.3);
    
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(1200, audioContext.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(300, audioContext.currentTime + 0.25);
    
    osc3.type = 'triangle';
    osc3.frequency.setValueAtTime(800, audioContext.currentTime);
    osc3.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.35);
    
    gain1.gain.setValueAtTime(0.4, audioContext.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
    
    gain2.gain.setValueAtTime(0.3, audioContext.currentTime);
    gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    gain3.gain.setValueAtTime(0.35, audioContext.currentTime);
    gain3.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.45);
    
    masterGain.gain.setValueAtTime(0.6, audioContext.currentTime);
    
    osc1.start(audioContext.currentTime);
    osc2.start(audioContext.currentTime);
    osc3.start(audioContext.currentTime);
    
    osc1.stop(audioContext.currentTime + 0.4);
    osc2.stop(audioContext.currentTime + 0.3);
    osc3.stop(audioContext.currentTime + 0.45);
}

function createSoftWooshSound() {
    // --- SETUP ---
    const now = audioContext.currentTime;
    const duration = 0.50;

    // 1. Oszillatoren für den "Wumms" des Nachbrenners
    const osc = audioContext.createOscillator();
    osc.type = 'sawtooth';

    // NEU: Sub-Oszillator für das Bass-Fundament
    const subOsc = audioContext.createOscillator();
    subOsc.type = 'sine'; // Sinuswelle für einen reinen, tiefen Bass

    // Eigene Gain-Regler für jeden Oszillator
    const oscGain = audioContext.createGain();
    const subOscGain = audioContext.createGain(); // NEU

    // 2. Rauschen für das "Woosh"-Geräusch
    const bufferSize = audioContext.sampleRate * duration;
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const output = buffer.getChannelData(0);
    
    // GEÄNDERT: Rauschen wird jetzt als "Brown Noise" generiert für mehr Tiefe
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5; // Lautstärke des Rauschens anheben
    }
    const noiseSource = audioContext.createBufferSource();
    noiseSource.buffer = buffer;

    // Filter für das Rauschen
    const noiseFilter = audioContext.createBiquadFilter();
    noiseFilter.type = 'lowpass';

    // 3. Haupt-Lautstärkeregler
    const masterGain = audioContext.createGain();

    // 4. Alles miteinander verbinden
    osc.connect(oscGain);
    oscGain.connect(masterGain);
    subOsc.connect(subOscGain); // NEU
    subOscGain.connect(masterGain); // NEU
    noiseSource.connect(noiseFilter);
    noiseFilter.connect(masterGain);
    masterGain.connect(audioContext.destination);

    // --- AUTOMATION ---

    // A) Oszillator-Automation (Zünd-Impuls)
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.1);
    oscGain.gain.setValueAtTime(0, now);
    oscGain.gain.linearRampToValueAtTime(0.4, now + 0.02);
    oscGain.gain.linearRampToValueAtTime(0, now + 0.15); // Etwas längeres Ausklingen

    // B) Sub-Bass-Automation (Das Fundament) - NEU
    subOsc.frequency.setValueAtTime(60, now); // Eine Oktave tiefer
    subOsc.frequency.exponentialRampToValueAtTime(25, now + 0.2);
    subOscGain.gain.setValueAtTime(0, now);
    subOscGain.gain.linearRampToValueAtTime(0.7, now + 0.05); // Schwillt etwas langsamer an
    subOscGain.gain.exponentialRampToValueAtTime(0.01, now + duration); // Hält den Bass länger

    // C) Rauschen-Automation (der Schweif)
    noiseFilter.frequency.setValueAtTime(8000, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(100, now + duration * 0.9);

    // D) Gesamt-Lautstärke-Automation
    // ANGEPASST: Etwas leiser, da der Sound jetzt "dichter" ist und mehr Druck hat
    const peakVolume = 0.60;
    masterGain.gain.setValueAtTime(0, now);
    masterGain.gain.linearRampToValueAtTime(peakVolume, now + 0.03);
    masterGain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    // --- START & STOP ---
    osc.start(now);
    subOsc.start(now); // NEU
    noiseSource.start(now);

    osc.stop(now + duration);
    subOsc.stop(now + duration); // NEU
    noiseSource.stop(now + duration);
}        

// Create explosion sound for space beacon destruction        
function createExplosionSound() {
    // Create complex explosion sound with multiple layers
    const osc1 = audioContext.createOscillator();
    const osc2 = audioContext.createOscillator();
    const osc3 = audioContext.createOscillator();
    const noiseBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.5, audioContext.sampleRate);
    const noiseSource = audioContext.createBufferSource();
    
    // Create white noise for explosion texture
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseBuffer.length; i++) {
        output[i] = Math.random() * 2 - 1;
    }
    noiseSource.buffer = noiseBuffer;
    
    const gain1 = audioContext.createGain();
    const gain2 = audioContext.createGain();
    const gain3 = audioContext.createGain();
    const noiseGain = audioContext.createGain();
    const masterGain = audioContext.createGain();
    
    // Connect all sources
    osc1.connect(gain1);
    osc2.connect(gain2);
    osc3.connect(gain3);
    noiseSource.connect(noiseGain);
    gain1.connect(masterGain);
    gain2.connect(masterGain);
    gain3.connect(masterGain);
    noiseGain.connect(masterGain);
    masterGain.connect(audioContext.destination);
    
    // Explosion: sharp crack, mid boom, deep rumble
    osc1.type = 'square';  // Sharp crack
    osc1.frequency.setValueAtTime(800, audioContext.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.1);
    
    osc2.type = 'sawtooth';  // Mid-range boom
    osc2.frequency.setValueAtTime(200, audioContext.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.3);
    
    osc3.type = 'triangle';  // Deep rumble
    osc3.frequency.setValueAtTime(80, audioContext.currentTime);
    osc3.frequency.exponentialRampToValueAtTime(20, audioContext.currentTime + 0.6);
    
    // Sharp attack, exponential decay
    gain1.gain.setValueAtTime(0.8, audioContext.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
    
    gain2.gain.setValueAtTime(0.6, audioContext.currentTime);
    gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
    
    gain3.gain.setValueAtTime(0.4, audioContext.currentTime);
    gain3.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);
    
    // Noise burst for texture
    noiseGain.gain.setValueAtTime(0.3, audioContext.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2);
    
    masterGain.gain.setValueAtTime(0.4, audioContext.currentTime);
    
    osc1.start(audioContext.currentTime);
    osc2.start(audioContext.currentTime);
    osc3.start(audioContext.currentTime);
    noiseSource.start(audioContext.currentTime);
    
    osc1.stop(audioContext.currentTime + 0.15);
    osc2.stop(audioContext.currentTime + 0.4);
    osc3.stop(audioContext.currentTime + 0.8);
    noiseSource.stop(audioContext.currentTime + 0.2);
}

// Dynamic game mechanics based on remaining words
function calculateSpaceshipChaseSpeed() {
    const remainingWords = floatingTexts.filter(word => !word.isDestroyed).length;
    return CONFIG.CONFIG_UTILS.calculateSpaceshipSpeed(remainingWords);
}

// HomingProjectile class for Ultra-Nachschuss
class HomingProjectile {
    constructor(startX, startY, target, speed, turnRate) {
        this.x = startX;
        this.y = startY;
        this.target = target;
        this.speed = speed;
        this.turnRate = turnRate || CONFIG.PROJECTILE_CONFIG.HOMING.DEFAULT_TURN_RATE; // How quickly it can turn toward target
        this.lifespan = CONFIG.PROJECTILE_CONFIG.HOMING.LIFESPAN; // 2.5 seconds max lifetime
        this.age = 0;
        
        // Calculate initial velocity direction toward target
        const targetRect = target.element.getBoundingClientRect();
        const targetX = targetRect.left + targetRect.width / 2;
        const targetY = targetRect.top + targetRect.height / 2;
        
        const deltaX = targetX - startX;
        const deltaY = targetY - startY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        this.vx = (deltaX / distance) * speed;
        this.vy = (deltaY / distance) * speed;
        
        // Create DOM element
        this.element = this.createElement();
        document.querySelector('.container').appendChild(this.element);
        
        // NEUE ZEILE: Markiere das Zielwort visuell.
        if (this.target) this.target.element.classList.add('targeted');
    }
    
    createElement() {
        const projectile = document.createElement('div');
        projectile.className = 'laser ultra-laser';
        projectile.style.left = this.x + 'px';
        projectile.style.top = this.y + 'px';
        projectile.style.width = '18px';
        projectile.style.height = '18px';
        projectile.style.background = 'radial-gradient(circle, #aa44ff 0%, #6600aa 50%, #440088 100%)';
        projectile.style.border = '3px solid #ffffff';
        projectile.style.boxShadow = `
            0 0 20px #aa44ff,
            0 0 40px #aa44ff,
            0 0 60px rgba(170, 68, 255, 0.8),
            inset 0 0 8px rgba(255, 255, 255, 0.6)`;
        projectile.style.animation = 'ultraProjectilePulse 0.15s ease-in-out infinite alternate';
        return projectile;
    }
    
    update(deltaTime) {
        this.age += deltaTime;

        if (this.age >= this.lifespan || !this.target || this.target.isDestroyed) {
            // NEU: Punkte für erfolgreiche Verteidigung vergeben wenn Homing Projectile verfehlt
            if (this.age >= this.lifespan) {
                console.log('Homing projectile timed out - defense successful! Points awarded.');
                awardPoints();
            } else if (this.target && this.target.isDestroyed) {
                console.log('Homing projectile target destroyed by other means - no points awarded.');
            }
            this.destroy();
            return false;
        }

        const targetX = this.target.x + this.target.width / 2;
        const targetY = this.target.y + this.target.height / 2;

        // --- NEUE KAPSEL-KOLLISIONSPRÜFUNG ---
        const collisionRadius = CONFIG.PROJECTILE_CONFIG.HOMING.COLLISION_RADIUS + Math.min(this.target.width, this.target.height) * CONFIG.PROJECTILE_CONFIG.HOMING.TARGET_COLLISION_FACTOR;
        const distanceToCenter = Math.sqrt(Math.pow(targetX - this.x, 2) + Math.pow(targetY - this.y, 2));

        if (distanceToCenter < collisionRadius) {
            this.hitTarget();
            return false;
        }
        // --- ENDE NEUE KOLLISIONSPRÜFUNG ---

        const dirX = targetX - this.x;
        const dirY = targetY - this.y;
        const distance = Math.sqrt(dirX * dirX + dirY * dirY);

        const normDirX = dirX / distance;
        const normDirY = dirY / distance;

        this.vx += (normDirX * this.speed - this.vx) * this.turnRate;
        this.vy += (normDirY * this.speed - this.vy) * this.turnRate;

        const currentSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        this.vx = (this.vx / currentSpeed) * this.speed;
        this.vy = (this.vy / currentSpeed) * this.speed;

        this.x += this.vx * (deltaTime / 1000);
        this.y += this.vy * (deltaTime / 1000);

        this.element.style.left = this.x + 'px';
        this.element.style.top = this.y + 'px';
        
        return true;
    }
    
    checkCollision() {
        if (!this.target || this.target.isDestroyed) return false;
        
        const targetRect = this.target.element.getBoundingClientRect();
        const targetCenterX = targetRect.left + targetRect.width / 2;
        const targetCenterY = targetRect.top + targetRect.height / 2;
        
        const distance = Math.sqrt(
            Math.pow(this.x - targetCenterX, 2) + 
            Math.pow(this.y - targetCenterY, 2)
        );
        
        return distance <= CONFIG.PROJECTILE_CONFIG.STANDARD_COLLISION_RADIUS; // Collision radius
    }
    
    hitTarget() {
        console.log('Homing projectile hit target!');
        
        // Use spaceship controller's explode logic
        if (spaceshipController) {
            spaceshipController.explodeWord(this.target);
        }
        
        this.destroy();
    }
    
    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        
        // NEU: Entferne die visuelle Markierung vom Zielwort.
        if (this.target && this.target.element) {
            this.target.element.classList.remove('targeted');
        }

        // Remove from active projectiles array
        const index = activeProjectiles.indexOf(this);
        if (index > -1) {
            activeProjectiles.splice(index, 1);
        }
    }
}

function calculateBoosterFrequency() {
    const remainingWords = floatingTexts.filter(word => !word.isDestroyed).length;
    return CONFIG.CONFIG_UTILS.calculateBoosterFrequency(remainingWords);
}

// Difficulty system functions
function getDifficultySettings() {
    return CONFIG.CONFIG_UTILS.getDifficultySettings();
}

function calculateTargetingTime() {
    const remainingWords = floatingTexts.filter(word => !word.isDestroyed).length;
    return CONFIG.CONFIG_UTILS.calculateTargetingTime(remainingWords);
}

function calculateSpaceshipAggressiveness() {
    const remainingWords = floatingTexts.filter(word => !word.isDestroyed).length;
    const desperationFactor = (CONFIG.GAME_CONSTANTS.TOTAL_WORDS - remainingWords) / CONFIG.GAME_CONSTANTS.TOTAL_WORDS;
    
    return {
        chaseThreshold: Math.max(CONFIG.SPACESHIP_CONFIG.AGGRESSION.MIN_CHASE_THRESHOLD, 
                                CONFIG.SPACESHIP_CONFIG.AGGRESSION.BASE_CHASE_THRESHOLD - desperationFactor * 0.25), // 40% → 15% chase chance
        directionChangeSpeed: 1 + desperationFactor * (CONFIG.SPACESHIP_CONFIG.AGGRESSION.MAX_DIRECTION_CHANGE_SPEED - 1), // 1x → 3x faster direction changes
        huntMode: remainingWords <= CONFIG.SPACESHIP_CONFIG.AGGRESSION.HUNT_MODE_WORD_THRESHOLD // Aggressive hunt mode when ≤4 words
    };
}

function calculateDynamicFriction() {
    const remainingWords = floatingTexts.filter(word => !word.isDestroyed).length;
    const desperationFactor = (CONFIG.GAME_CONSTANTS.TOTAL_WORDS - remainingWords) / CONFIG.GAME_CONSTANTS.TOTAL_WORDS;
    const dynamicFriction = CONFIG.SPACESHIP_CONFIG.PHYSICS.BASE_FRICTION - (desperationFactor * CONFIG.SPACESHIP_CONFIG.PHYSICS.FRICTION_DESPERATION_FACTOR);
    
    return Math.max(dynamicFriction, CONFIG.SPACESHIP_CONFIG.PHYSICS.MIN_FRICTION); // Minimum friction threshold
}

function calculateDynamicRotationDamping() {
    const remainingWords = floatingTexts.filter(word => !word.isDestroyed).length;
    const desperationFactor = (CONFIG.GAME_CONSTANTS.TOTAL_WORDS - remainingWords) / CONFIG.GAME_CONSTANTS.TOTAL_WORDS;
    return CONFIG.SPACESHIP_CONFIG.PHYSICS.BASE_ROTATION_DAMPING - (desperationFactor * CONFIG.SPACESHIP_CONFIG.PHYSICS.ROTATION_DESPERATION_FACTOR); // Stronger damping when desperate
}

function calculateAttackInterval() {
    const remainingWords = floatingTexts.filter(word => !word.isDestroyed).length;
    return CONFIG.CONFIG_UTILS.calculateAttackInterval(remainingWords);
}

function getSpaceshipAggressionLevel() {
    const remainingWords = floatingTexts.filter(word => !word.isDestroyed).length;
    const desperationFactor = (CONFIG.GAME_CONSTANTS.TOTAL_WORDS - remainingWords) / CONFIG.GAME_CONSTANTS.TOTAL_WORDS;
    return 1 + desperationFactor * (CONFIG.SPACESHIP_CONFIG.AGGRESSION.MAX_DIRECTION_CHANGE_SPEED - 1); // 1x → 3x aggression
}

function updateEmergencyState() {
    const remainingWords = floatingTexts.filter(word => !word.isDestroyed).length;
    let emergencyOverlay = document.getElementById('emergency-overlay');
    
    if (remainingWords <= CONFIG.EMERGENCY_CONFIG.EMERGENCY_WORD_THRESHOLD) {
        // Create emergency overlay if it doesn't exist
        if (!emergencyOverlay) {
            emergencyOverlay = document.createElement('div');
            emergencyOverlay.id = 'emergency-overlay';
            emergencyOverlay.className = 'emergency-overlay';
            emergencyOverlay.innerHTML = '<div class="emergency-border"></div>';
            document.body.appendChild(emergencyOverlay);
        }
        
        // Activate emergency state
        emergencyOverlay.classList.add('active');
    } else {
        // Deactivate emergency state
        if (emergencyOverlay) {
            emergencyOverlay.classList.remove('active');
        }
    }
}

function showInfoOverlay() {
    console.log('🎯 showInfoOverlay called');
    
    try {
        const overlay = document.createElement('div');
        overlay.className = 'info-overlay';
        
        // Erstelle einen sicheren Highscore-Bereich
        let highscoreContent = '';
        try {
            highscoreContent = showStartScreenHighscores();
            console.log('✅ Highscores loaded successfully');
        } catch (error) {
            console.error('❌ Error loading highscores:', error);
            highscoreContent = `
                <div class="start-screen-leaderboard">
                    <h2>🏆 LOKALE HIGHSCORES</h2>
                    <p>Highscores werden geladen...</p>
                </div>
            `;
        }
        
        overlay.innerHTML = `
            <div class="info-box">
                <h1>WORD DEFENDER<br><span style="font-size: 0.6em; color: #ff4444;">vs. THE PSYCHO WORD HUNTER</span></h1>
                <p>Ein Raumschiff jagt die schwebenden Wörter!</p>
                <p><span class="highlight">Erste Angriffe beginnen nach 20 Sekunden</span> - dann dynamische Intervalle.</p>
                <p><span class="highlight">Rote Radar-Pings</span> warnen vor dem Angriff.</p>
                <p>Das Radar und das Aufschalten <span class="highlight">passieren schnell</span> - sei bereit!</p>
                <p>Klicke auf Wörter um sie zu bewegen und vor dem Schiff zu retten!</p>
                <p>Überlebe so lange wie möglich! 🚀</p>
                
                <div class="start-screen-navigation">
                    <div class="nav-buttons">
                        <button class="nav-btn active" data-tab="game-setup">🎮 SPIEL STARTEN</button>
                        <button class="nav-btn" data-tab="leaderboard">🏆 HIGHSCORES</button>
                    </div>
                </div>
                
                <div id="game-setup" class="tab-content active">
                    <div class="difficulty-section">
                        <h3>Schwierigkeitsgrad wählen:</h3>
                        <div class="difficulty-buttons">
                            <button class="difficulty-btn" data-difficulty="leicht">
                                🟢 LEICHT
                                <small>Entspannt spielen</small>
                            </button>
                            <button class="difficulty-btn selected" data-difficulty="mittel">
                                🟡 MITTEL
                                <small>Ausgewogen</small>
                            </button>
                            <button class="difficulty-btn" data-difficulty="schwer">
                                🔴 SCHWER
                                <small>Hardcore-Modus</small>
                            </button>
                        </div>
                    </div>
                    
                    <input type="text" class="player-name-input" id="player-name" placeholder="Dein Name..." maxlength="20">
                    <div class="error-message" id="name-error">Bitte gib einen Namen ein!</div>
                    <button class="start-button" onclick="validateAndStartGame()">START GAME</button>
                </div>
                
                <div id="leaderboard" class="tab-content">
                    <div id="start-screen-highscores">
                        ${highscoreContent}
                    </div>
                    <button class="start-button secondary" onclick="switchToGameSetup()">⬅ ZURÜCK ZUM SPIEL</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        console.log('✅ Overlay added to DOM');
        
        // Debug: Check if overlay is actually visible
        setTimeout(() => {
            const addedOverlay = document.querySelector('.info-overlay');
            if (addedOverlay) {
                console.log('🔍 Overlay found in DOM:', addedOverlay);
                console.log('📐 Overlay styles:', {
                    display: getComputedStyle(addedOverlay).display,
                    visibility: getComputedStyle(addedOverlay).visibility,
                    opacity: getComputedStyle(addedOverlay).opacity,
                    zIndex: getComputedStyle(addedOverlay).zIndex,
                    position: getComputedStyle(addedOverlay).position
                });
                console.log('📏 Overlay dimensions:', {
                    width: addedOverlay.offsetWidth,
                    height: addedOverlay.offsetHeight,
                    top: addedOverlay.offsetTop,
                    left: addedOverlay.offsetLeft
                });
            } else {
                console.error('❌ Overlay not found in DOM!');
            }
        }, 200);
        
        // Set up tab navigation
        setupStartScreenNavigation();
        
        // Load saved difficulty and player name
        const savedDifficulty = localStorage.getItem('wordDefenderDifficulty') || CONFIG.GAME_CONSTANTS.DEFAULT_DIFFICULTY;
        const lastPlayer = localStorage.getItem('wordDefenderLastPlayer');
        
        // Set difficulty buttons
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.classList.remove('selected');
            if (btn.dataset.difficulty === savedDifficulty) {
                btn.classList.add('selected');
            }
            
            btn.addEventListener('click', () => {
                document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                currentDifficulty = btn.dataset.difficulty;
                localStorage.setItem('wordDefenderDifficulty', currentDifficulty);
                console.log('Schwierigkeitsgrad geändert zu:', currentDifficulty);
            });
        });
        
        if (lastPlayer) {
            document.getElementById('player-name').value = lastPlayer;
        }
        
        // Focus on input when on game setup tab
        const gameSetupTab = document.getElementById('game-setup');
        if (gameSetupTab && gameSetupTab.classList.contains('active')) {
            document.getElementById('player-name').focus();
        }
        
        // Allow Enter key to start
        document.getElementById('player-name').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                validateAndStartGame();
            }
        });
        
        console.log('✅ showInfoOverlay completed successfully');
        
    } catch (error) {
        console.error('❌ Critical error in showInfoOverlay:', error);
        // Fallback: Zeige ein einfaches Overlay
        const fallbackOverlay = document.createElement('div');
        fallbackOverlay.className = 'info-overlay';
        fallbackOverlay.innerHTML = `
            <div class="info-box">
                <h1>WORD DEFENDER</h1>
                <p>Spiel wird geladen...</p>
                <p>Bei Problemen die Seite neu laden.</p>
                <button onclick="location.reload()" style="padding: 10px 20px; background: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    Neu laden
                </button>
            </div>
        `;
        document.body.appendChild(fallbackOverlay);
    }
}

function setupStartScreenNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.dataset.tab;
            
            // Remove active class from all buttons and tabs
            navButtons.forEach(b => b.classList.remove('active'));
            tabContents.forEach(tab => tab.classList.remove('active'));
            
            // Add active class to clicked button and corresponding tab
            btn.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
            
            // If switching to leaderboard, refresh it
            if (targetTab === 'leaderboard') {
                refreshStartScreenLeaderboard();
            }
            
            // If switching to game setup, focus on name input
            if (targetTab === 'game-setup') {
                setTimeout(() => {
                    document.getElementById('player-name').focus();
                }, 100);
            }
        });
    });
}

function showStartScreenHighscores() {
    const highscores = loadHighscores();
    const stats = SecureStorage.getScoreStatistics(highscores);
    
    return `
        <div class="start-screen-leaderboard">
            <h2>🏆 LOKALE HIGHSCORES</h2>
            
            <!-- Difficulty Filter Buttons -->
            <div class="difficulty-filter-buttons">
                <button class="filter-btn active" data-filter="alle">
                    🎯 ALLE (${stats.alle_count})
                </button>
                <button class="filter-btn" data-filter="leicht">
                    🟢 LEICHT (${stats.leicht_count})
                </button>
                <button class="filter-btn" data-filter="mittel">
                    🟡 MITTEL (${stats.mittel_count})
                </button>
                <button class="filter-btn" data-filter="schwer">
                    🔴 SCHWER (${stats.schwer_count})
                </button>
            </div>
            
            <ol class="highscore-list compact" id="local-filtered-scores">
                ${renderFilteredScores(highscores, 'alle', 8)}
            </ol>
            
            <div class="online-section-compact">
                <button id="show-online-start" class="online-button compact">
                    🌐 ONLINE HIGHSCORES
                </button>
            </div>
        </div>
    `;
}

function renderFilteredScores(scores, difficulty = 'alle', limit = 10, isOnline = false) {
    const filteredScores = SecureStorage.filterByDifficulty(scores, difficulty);
    const limitedScores = filteredScores.slice(0, limit);
    
    if (limitedScores.length === 0) {
        const difficultyText = difficulty === 'alle' ? '' : ` (${difficulty.toUpperCase()})`;
        return `<li class="no-scores">Noch keine Scores${difficultyText} vorhanden<br><small>${isOnline ? 'Spiele online oder' : 'Spiele dein erstes Spiel!'}</small></li>`;
    }
    
    return limitedScores.map((score, index) => {
        const difficultyBadge = score.difficulty ? 
            `<span class="difficulty-badge ${score.difficulty}">${score.difficulty.toUpperCase()}</span>` : '';
        
        const flaggedBadge = score.flagged ? 
            `<span class="flagged-badge" title="Verdächtiger Score">⚠️</span>` : '';
            
        const entryClass = isOnline ? 'online-entry' : '';
        
        return `
            <li class="highscore-entry compact ${entryClass} ${score.flagged ? 'flagged' : ''}">
                <div class="rank">#${index + 1}</div>
                <div class="player-info">
                    <div class="player-name">${score.name} ${difficultyBadge} ${flaggedBadge}</div>
                    <div class="score-details">
                        <span class="score">${score.score} Punkte</span>
                        <span class="time">${CONFIG.CONFIG_UTILS.formatTime(score.survivalTime)}</span>
                    </div>
                </div>
            </li>
        `;
    }).join('');
}

function refreshStartScreenLeaderboard() {
    const container = document.getElementById('start-screen-highscores');
    if (container) {
        container.innerHTML = showStartScreenHighscores();
        
        // Attach online leaderboard button
        const onlineBtn = document.getElementById('show-online-start');
        if (onlineBtn) {
            onlineBtn.addEventListener('click', showStartScreenOnlineLeaderboard);
        }
        
        // Attach filter event listeners for local leaderboard
        attachFilterEventListeners('local');
    }
}

function attachFilterEventListeners(mode = 'local') {
    const filterButtons = document.querySelectorAll(`.filter-btn[data-mode="${mode}"], .filter-btn:not([data-mode])`);
    
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all filter buttons in this mode
            filterButtons.forEach(b => b.classList.remove('active'));
            
            // Add active class to clicked button
            btn.classList.add('active');
            
            const difficulty = btn.dataset.filter;
            
            if (mode === 'online') {
                updateOnlineFilteredScores(difficulty);
            } else if (mode === 'fullscreen') {
                updateFullscreenFilteredScores(difficulty);
            } else {
                updateLocalFilteredScores(difficulty);
            }
        });
    });
}

function updateLocalFilteredScores(difficulty) {
    const container = document.getElementById('local-filtered-scores');
    const highscores = loadHighscores();
    
    if (container) {
        container.innerHTML = renderFilteredScores(highscores, difficulty, 8, false);
    }
}

function updateFullscreenFilteredScores(difficulty) {
    const container = document.getElementById('fullscreen-filtered-scores');
    const highscores = loadHighscores();
    
    if (container) {
        // Check if we're in a game over context and get the current score
        const currentScoreData = window.currentGameOverScore || null;
        container.innerHTML = renderFullscreenScores(highscores, difficulty, currentScoreData);
    }
}

async function updateOnlineFilteredScores(difficulty) {
    const container = document.getElementById('online-filtered-scores');
    
    if (container) {
        // Show loading while filtering
        container.innerHTML = '<li class="loading-item">Filtere Scores...</li>';
        
        const onlineScores = await loadOnlineLeaderboard();
        container.innerHTML = renderFilteredScores(onlineScores, difficulty, 10, true);
    }
}

async function showStartScreenOnlineLeaderboard() {
    const container = document.getElementById('start-screen-highscores');
    if (!container) return;
    
    // Show loading state
    container.innerHTML = `
        <div class="start-screen-leaderboard">
            <h2>🌐 ONLINE LEADERBOARD</h2>
            <div class="loading">Lade Online Highscores...</div>
            <button class="back-button" onclick="refreshStartScreenLeaderboard()">⬅ ZURÜCK ZU LOKALEN SCORES</button>
        </div>
    `;
    
    // Load online data
    const onlineScores = await loadOnlineLeaderboard();
    const stats = SecureStorage.getScoreStatistics(onlineScores);
    
    container.innerHTML = `
        <div class="start-screen-leaderboard">
            <h2>🌐 ONLINE LEADERBOARD</h2>
            
            <!-- Online Difficulty Filter Buttons -->
            <div class="difficulty-filter-buttons">
                <button class="filter-btn active" data-filter="alle" data-mode="online">
                    🎯 ALLE (${stats.alle_count})
                </button>
                <button class="filter-btn" data-filter="leicht" data-mode="online">
                    🟢 LEICHT (${stats.leicht_count})
                </button>
                <button class="filter-btn" data-filter="mittel" data-mode="online">
                    🟡 MITTEL (${stats.mittel_count})
                </button>
                <button class="filter-btn" data-filter="schwer" data-mode="online">
                    🔴 SCHWER (${stats.schwer_count})
                </button>
            </div>
            
            <ol class="highscore-list compact online" id="online-filtered-scores">
                ${renderFilteredScores(onlineScores, 'alle', 10, true)}
            </ol>
            <button class="back-button" onclick="refreshStartScreenLeaderboard()">⬅ ZURÜCK ZU LOKALEN SCORES</button>
        </div>
    `;
    
    // Attach filter event listeners for online leaderboard
    attachFilterEventListeners('online');
}

function switchToGameSetup() {
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    
    document.querySelector('.nav-btn[data-tab="game-setup"]').classList.add('active');
    document.getElementById('game-setup').classList.add('active');
    
    setTimeout(() => {
        document.getElementById('player-name').focus();
    }, 100);
}

function validateAndStartGame() {
    const nameInput = document.getElementById('player-name');
    const errorDiv = document.getElementById('name-error');
    const playerName = nameInput.value.trim();
    
    if (!playerName) {
        errorDiv.classList.add('show');
        nameInput.focus();
        return;
    }
    
    // Hide error and save name
    errorDiv.classList.remove('show');
    localStorage.setItem('wordDefenderLastPlayer', playerName);
    
    // Store current player name and difficulty globally
    window.currentPlayerName = playerName;
    currentDifficulty = localStorage.getItem('wordDefenderDifficulty') || 'mittel';
    
    console.log('Spiel startet mit Schwierigkeitsgrad:', currentDifficulty);
    startGame();
}

// Online Leaderboard API URL (kann angepasst werden)
const LEADERBOARD_API = CONFIG.LEADERBOARD_CONFIG.API_URL; // Beispiel-URL
const API_KEY = CONFIG.LEADERBOARD_CONFIG.API_KEY; // JsonBin.io API Key

// Highscore localStorage functions mit Sicherheitsmaßnahmen
function loadHighscores() {
    return SecureStorage.loadSecureHighscores();
}

// Helper function to get difficulty sorting value
function getDifficultySortValue(difficulty) {
    switch (difficulty) {
        case 'schwer': return 3;
        case 'mittel': return 2;
        case 'leicht': return 1;
        default: return 0; // Für alte Scores ohne Schwierigkeit
    }
}

function saveHighscore(playerName, survivalTime, finalScore) {
    const highscores = loadHighscores();
    const newScore = {
        name: playerName,
        survivalTime: survivalTime,
        score: finalScore || 0, // Ensure score is always a number
        date: new Date().toISOString(),
        wordsDestroyed: CONFIG.GAME_CONSTANTS.TOTAL_WORDS - floatingTexts.filter(word => !word.isDestroyed).length,
        difficulty: localStorage.getItem('wordDefenderDifficulty') || CONFIG.GAME_CONSTANTS.DEFAULT_DIFFICULTY
    };
    
    // Anti-Cheat: Validiere Score
    if (!SecureStorage.validateScore(newScore)) {
        console.warn('🚨 Invalid score detected - not saving');
        return null;
    }
    
    // Anti-Cheat: Prüfe auf verdächtige Scores
    if (SecureStorage.isSuspiciousScore(newScore, highscores)) {
        console.warn('🚨 Suspicious score detected - flagging for review');
        newScore.flagged = true; // Markiere verdächtige Scores
    }
    
    highscores.push(newScore);
    
    // Ensure all existing scores have score property
    highscores.forEach(score => {
        if (typeof score.score === 'undefined') {
            score.score = 0;
        }
    });
    
    // Sort by difficulty first (schwer > mittel > leicht), then by score, then by survival time
    highscores.sort((a, b) => {
        const diffA = getDifficultySortValue(a.difficulty);
        const diffB = getDifficultySortValue(b.difficulty);
        
        if (diffB !== diffA) {
            return diffB - diffA; // Higher difficulty first
        }
        
        if (b.score !== a.score) {
            return b.score - a.score; // Higher score first
        }
        
        return b.survivalTime - a.survivalTime; // If score tied, longer time first
    });
    
    // Keep only top 10
    const topScores = highscores.slice(0, 10);
    
    // Sichere Speicherung
    SecureStorage.saveSecureHighscores(topScores);
    
    return newScore;
}

// Online Leaderboard Functions
async function loadOnlineLeaderboard() {
    try {
        const response = await fetch(LEADERBOARD_API, {
            method: 'GET',
            headers: {
                'X-Master-Key': API_KEY,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            // Robuste Behandlung verschiedener Datenformate
            let leaderboard = data.record?.leaderboard || data.record || data.leaderboard || data || [];
            
            // Sicherstellen, dass es ein Array ist
            if (!Array.isArray(leaderboard)) {
                console.warn('Leaderboard ist kein Array, erstelle leeres Array');
                leaderboard = [];
            }
            
            return leaderboard;
        } else {
            console.warn('Online Leaderboard konnte nicht geladen werden');
            return [];
        }
    } catch (error) {
        console.warn('Fehler beim Laden des Online Leaderboards:', error);
        return [];
    }
}

async function submitToOnlineLeaderboard(scoreData) {
    try {
        // NEUE Validierung vor dem Senden
        if (!SecureStorage.validateScore(scoreData)) {
            console.warn('🚨 Invalid score - not submitting to online leaderboard');
            return false;
        }
        
        // Erst aktuelle Daten laden
        const currentLeaderboard = await loadOnlineLeaderboard();
        
        // NEUE Anti-Cheat-Prüfung auch für Online
        if (SecureStorage.isSuspiciousScore(scoreData, currentLeaderboard)) {
            console.warn('🚨 Suspicious score detected - flagging for online submission');
            scoreData.flagged = true; // Markiere auch online
        }
        
        // Neuen Score hinzufügen
        currentLeaderboard.push({
            ...scoreData,
            id: Date.now() + Math.random(), // Eindeutige ID
            submittedAt: new Date().toISOString()
        });
        
        // Nach Schwierigkeit, dann Score sortieren (höchste Schwierigkeit und Score zuerst)
        currentLeaderboard.sort((a, b) => {
            const diffA = getDifficultySortValue(a.difficulty);
            const diffB = getDifficultySortValue(b.difficulty);
            
            if (diffB !== diffA) {
                return diffB - diffA; // Higher difficulty first
            }
            
            if (b.score !== a.score) {
                return b.score - a.score; // Higher score first
            }
            
            return b.survivalTime - a.survivalTime; // If score tied, longer time first
        });
        
        // Top 50 behalten
        const topScores = currentLeaderboard.slice(0, 50);
        
        // Zurück zum Server senden - JSONBin erwartet das Array in der leaderboard-Struktur
        const response = await fetch(LEADERBOARD_API, {
            method: 'PUT',
            headers: {
                'X-Master-Key': API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ leaderboard: topScores })
        });
        
        if (response.ok) {
            console.log('Score erfolgreich zum Online Leaderboard hinzugefügt!');
            return true;
        } else {
            console.warn('Fehler beim Senden zum Online Leaderboard');
            return false;
        }
    } catch (error) {
        console.warn('Fehler beim Senden zum Online Leaderboard:', error);
        return false;
    }
}

function formatTime(seconds) {
    return CONFIG.CONFIG_UTILS.formatTime(seconds);
}

function showHighscoreTable(currentScoreData = null) {
    const highscores = loadHighscores();
    const stats = SecureStorage.getScoreStatistics(highscores);
    
    const tableHTML = `
        <div class="highscore-table">
            <h2>🏆 LOKALE HIGHSCORES</h2>
            
            <!-- Difficulty Filter Buttons for Full Table -->
            <div class="difficulty-filter-buttons fullscreen">
                <button class="filter-btn active" data-filter="alle" data-mode="fullscreen">
                    🎯 ALLE (${stats.alle_count})
                </button>
                <button class="filter-btn" data-filter="leicht" data-mode="fullscreen">
                    🟢 LEICHT (${stats.leicht_count})
                </button>
                <button class="filter-btn" data-filter="mittel" data-mode="fullscreen">
                    🟡 MITTEL (${stats.mittel_count})
                </button>
                <button class="filter-btn" data-filter="schwer" data-mode="fullscreen">
                    🔴 SCHWER (${stats.schwer_count})
                </button>
            </div>
            
            <ol class="highscore-list" id="fullscreen-filtered-scores">
                ${renderFullscreenScores(highscores, 'alle', currentScoreData)}
            </ol>
            
            <div class="online-leaderboard-section">
                <button id="show-online-leaderboard" class="online-button">
                    🌐 ONLINE LEADERBOARD ANZEIGEN
                </button>
                ${currentScoreData ? `
                    <div class="submit-score-section">
                        <p class="submit-prompt">Möchtest du deinen Score online teilen?</p>
                        <button id="submit-score-online" class="submit-button">
                            📤 SCORE ONLINE VERÖFFENTLICHEN
                        </button>
                        <p class="privacy-note">Nur dein Name, Score und Spielzeit werden geteilt.</p>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
    
    return tableHTML;
}

function renderFullscreenScores(scores, difficulty = 'alle', currentScoreData = null) {
    const filteredScores = SecureStorage.filterByDifficulty(scores, difficulty);
    
    if (filteredScores.length === 0) {
        const difficultyText = difficulty === 'alle' ? '' : ` (${difficulty.toUpperCase()})`;
        return `<li class="no-scores">Noch keine Scores${difficultyText} vorhanden</li>`;
    }
    
    return filteredScores.map((score, index) => {
        const isCurrentScore = currentScoreData && 
            score.name === currentScoreData.name && 
            score.score === currentScoreData.score &&
            Math.abs(new Date(score.date).getTime() - new Date(currentScoreData.date).getTime()) < 5000;
            
        const difficultyBadge = score.difficulty ? 
            `<span class="difficulty-badge ${score.difficulty}">${score.difficulty.toUpperCase()}</span>` : '';
            
        return `
            <li class="highscore-entry ${isCurrentScore ? 'current-score' : ''}">
                <div class="rank">#${index + 1}</div>
                <div class="player-info">
                    <div class="player-name">${score.name} ${difficultyBadge}</div>
                    <div class="score-details">
                        <span class="score">${score.score} Punkte</span>
                        <span class="time">${CONFIG.CONFIG_UTILS.formatTime(score.survivalTime)}</span>
                        <span class="words">${score.wordsDestroyed || 0}/${CONFIG.GAME_CONSTANTS.TOTAL_WORDS} Wörter</span>
                    </div>
                </div>
                <div class="date">${new Date(score.date).toLocaleDateString('de-DE')}</div>
            </li>
        `;
    }).join('');
}

async function showOnlineLeaderboard() {
    // Show loading state
    const loadingHTML = `
        <div class="online-leaderboard">
            <h2>🌐 ONLINE LEADERBOARD</h2>
            <div class="loading">Lade Online Highscores...</div>
            <button class="back-button" onclick="showLocalLeaderboard()">⬅ ZURÜCK ZU LOKALEN SCORES</button>
        </div>
    `;
    
    const highscoreContainer = document.querySelector('.highscore-table');
    if (highscoreContainer) {
        highscoreContainer.innerHTML = loadingHTML;
    }
    
    // Load online data
    const onlineScores = await loadOnlineLeaderboard();
    
    const onlineHTML = `
        <div class="online-leaderboard">
            <h2>🌐 ONLINE LEADERBOARD</h2>
            <ol class="highscore-list online">
                ${onlineScores.length > 0 
                    ? onlineScores.slice(0, 20).map((score, index) => {
                        const difficultyBadge = score.difficulty ? 
                            `<span class="difficulty-badge ${score.difficulty}">${score.difficulty.toUpperCase()}</span>` : '';
                            
                        return `
                            <li class="highscore-entry online-entry">
                                <div class="rank">#${index + 1}</div>
                                <div class="player-info">
                                    <div class="player-name">${score.name} ${difficultyBadge}</div>
                                    <div class="score-details">
                                        <span class="score">${score.score} Punkte</span>
                                        <span class="time">${CONFIG.CONFIG_UTILS.formatTime(score.survivalTime)}</span>
                                        <span class="words">${score.wordsDestroyed || 0}/${CONFIG.GAME_CONSTANTS.TOTAL_WORDS} Wörter</span>
                                    </div>
                                </div>
                                <div class="date">${new Date(score.submittedAt || score.date).toLocaleDateString('de-DE')}</div>
                            </li>
                        `;
                    }).join('')
                    : '<li class="no-scores">Noch keine Online-Scores vorhanden</li>'
                }
            </ol>
            <button class="back-button" onclick="showLocalLeaderboard()">⬅ ZURÜCK ZU LOKALEN SCORES</button>
        </div>
    `;
    
    if (highscoreContainer) {
        highscoreContainer.innerHTML = onlineHTML;
    }
}

function showLocalLeaderboard() {
    const highscoreContainer = document.querySelector('.highscore-table');
    if (highscoreContainer) {
        const newContent = showHighscoreTable();
        highscoreContainer.outerHTML = newContent;
        attachLeaderboardEventListeners();
    }
}

function attachLeaderboardEventListeners() {
    const showOnlineBtn = document.getElementById('show-online-leaderboard');
    const submitOnlineBtn = document.getElementById('submit-score-online');
    
    if (showOnlineBtn) {
        showOnlineBtn.addEventListener('click', showOnlineLeaderboard);
    }
    
    if (submitOnlineBtn) {
        submitOnlineBtn.addEventListener('click', async () => {
            const button = submitOnlineBtn;
            const originalText = button.textContent;
            
            button.textContent = 'Sende...';
            button.disabled = true;
            
            // Get the most recent score (should be the current one)
            const highscores = loadHighscores();
            const latestScore = highscores[0];
            
            if (latestScore) {
                const success = await submitToOnlineLeaderboard(latestScore);
                
                if (success) {
                    button.textContent = '✅ ERFOLGREICH GESENDET!';
                    button.style.background = '#28a745';
                    
                    // Hide submit section after successful submission
                    setTimeout(() => {
                        const submitSection = button.closest('.submit-score-section');
                        if (submitSection) {
                            submitSection.style.opacity = '0.5';
                            submitSection.innerHTML = '<p style="color: #28a745;">✅ Score wurde online veröffentlicht!</p>';
                        }
                    }, 2000);
                } else {
                    button.textContent = '❌ FEHLER BEIM SENDEN';
                    button.style.background = '#dc3545';
                    
                    setTimeout(() => {
                        button.textContent = originalText;
                        button.style.background = '';
                        button.disabled = false;
                    }, 3000);
                }
            }
        });
    }
    
    // Attach filter event listeners for fullscreen leaderboard
    attachFilterEventListeners('fullscreen');
}

function calculateScore() {
    return CONFIG.CONFIG_UTILS.calculateScore(consecutiveSuccessfulDefenses);
}

function awardPoints() {
    const points = calculateScore();
    currentScore += points;
    consecutiveSuccessfulDefenses++;
    defendedWordsCounter++;

    // NEU: Logik zum Erhalten von Autoschilden (mit Schwierigkeitsgrad)
    const settings = getDifficultySettings();
    const maxAutoShields = settings.maxAutoShields;
    
    if (consecutiveSuccessfulDefenses > 3 && autoShieldCount < maxAutoShields) {
        if (CONFIG.SHIELD_CONFIG.AUTO_SHIELD_AWARD_THRESHOLDS.includes(consecutiveSuccessfulDefenses)) {
            autoShieldCount++;
            console.log(`Autoschild erhalten! Gesamt: ${autoShieldCount} (Max: ${maxAutoShields})`);
        }
    }

    // After 4th successful defense, reduce attack interval (bestehende Logik)
    if (consecutiveSuccessfulDefenses === 4) {
        attackInterval = CONFIG.ATTACK_CONFIG.REDUCED_ATTACK_INTERVAL; // Reduce from 10s to 8s
        console.log('Attack interval reduced to 8 seconds!');
    }

    // Beacon deployment logic (bestehende Logik)
    beaconDeploymentCounter++;
    if (beaconDeploymentCounter === nextBeaconAt) {
        deployBeacon();
        if (nextBeaconAt === CONFIG.BEACON_CONFIG.FIRST_BEACON_AT_DEFENSE) {
            nextBeaconAt = CONFIG.BEACON_CONFIG.FIRST_BEACON_AT_DEFENSE + CONFIG.BEACON_CONFIG.SUBSEQUENT_BEACON_INTERVAL;
        } else {
            nextBeaconAt += CONFIG.BEACON_CONFIG.SUBSEQUENT_BEACON_INTERVAL;
        }
        console.log(`Beacon deployed! Next beacon at defense ${nextBeaconAt}`);
    }

    console.log(`Awarded ${points} points. Total: ${currentScore}. Consecutive defenses: ${consecutiveSuccessfulDefenses}.`);
}

function resetScoreStreak() {
    consecutiveSuccessfulDefenses = 0;
    defendedWordsCounter = 0;
    
    // Reset pulsar system
    resetPulsar();
    
    // Reset beacon deployment counter but keep existing beacons
    beaconDeploymentCounter = 0;
    nextBeaconAt = CONFIG.BEACON_CONFIG.FIRST_BEACON_AT_DEFENSE;
    
    console.log('Score streak, defended counter, and beacon deployment counter reset to 0');
}

async function startGame() {
    const overlay = document.querySelector('.info-overlay');
    if (overlay) {
        overlay.remove();
    }
    
    // Apply difficulty settings
    const settings = getDifficultySettings();
    console.log('Angewandte Schwierigkeitseinstellungen:', settings);
    
    // Zuerst alles zurücksetzen und initialisieren.
    shieldCount = CONFIG.SHIELD_CONFIG.INITIAL_SHIELD_COUNT;
    lastShieldTime = 0; // Wichtig für den ersten Cooldown-Timer
    protectedWords.clear();
    currentScore = 0;
    consecutiveSuccessfulDefenses = 0;
    attackInterval = CONFIG.ATTACK_CONFIG.INITIAL_ATTACK_INTERVAL;
    hasFirstAttackHappened = false;
    defendedWordsCounter = 0;
    resetPulsar();
    beaconDeploymentCounter = 0;
    nextBeaconAt = CONFIG.BEACON_CONFIG.FIRST_BEACON_AT_DEFENSE;
    spaceBeacons.forEach(beacon => beacon.destroy());
    spaceBeacons = [];
    stopMineSpawning();
    
    // Apply difficulty-specific settings
    shieldCooldown = Math.round(CONFIG.SHIELD_CONFIG.BASE_SHIELD_COOLDOWN * settings.shieldCooldownMultiplier);
    autoShieldCount = CONFIG.SHIELD_CONFIG.INITIAL_AUTO_SHIELD_COUNT;
    // Note: MAX_AUTO_SHIELDS is handled in getDifficultySettings()
    
    // Reset second hunter
    secondSpaceshipController = null;
    
    // Warten, bis alle Wörter geladen und die Objekte erstellt sind.
    await initializeGame();
    
    // Erst NACH der Initialisierung das Spiel als gestartet markieren.
    gameStarted = true;
    gameStartTime = Date.now();
    
    // UI erstellen und aktualisieren.
    createGameUI();
    startUIUpdates(); // Start UI updates with proper interval
    startMineSpawning(); // Minen-Spawn erst jetzt starten.

    // Audio-Kontext fortsetzen, falls nötig.
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
}

function checkForGameEnd() {
    // Diese Prüfung läuft nur, wenn das Spiel aktiv ist und kein Overlay angezeigt wird.
    if (gameStarted && !document.querySelector('.info-overlay')) {
        const remainingWords = floatingTexts.filter(word => !word.isDestroyed).length;
        if (remainingWords === 0) {
            console.log("Zentrale Prüfung: Alle Wörter zerstört! Spiel endet.");
            
            // Spiel anhalten und Endsequenz einleiten
            gameStarted = false; // Stoppt die Logik in der animate-Schleife
            showRestartButton(); // Zeigt den Highscore-Bildschirm an
        }
    }
}

function checkForSecondHunter() {
    // Nur einmal ausführen, wenn der zweite Jäger noch nicht existiert.
    if (!secondSpaceshipController) {
        const remainingWords = floatingTexts.filter(word => !word.isDestroyed).length;
        
        if (remainingWords <= CONFIG.EMERGENCY_CONFIG.SECOND_HUNTER_WORD_THRESHOLD) {
            console.log('3 ODER WENIGER WORTE VERBLEIBEND! EIN ZWEITER JÄGER ERSCHEINT!');
            secondSpaceshipController = new SpaceshipController(true); // true = zweiter Hunter
        }
    }
}

function createGameUI() {
    const gameUI = document.createElement('div');
    gameUI.className = 'game-ui';
    gameUI.id = 'game-ui';
    gameUI.innerHTML = `
        <div class="ui-element words-remaining">
            Wörter: <span id="words-count">${CONFIG.GAME_CONSTANTS.TOTAL_WORDS}</span>
        </div>
        <div class="ui-element survival-time">
            Zeit: <span id="survival-timer">00:00</span>
        </div>
        <div class="ui-element current-score">
            Score: <span id="current-score">0</span>
        </div>
        <div class="ui-element defended-counter">
            Verteidigt: <span id="defended-count">0</span>
        </div>
        <div class="ui-element difficulty-display">
            Modus: <span id="difficulty-display" class="difficulty-badge">MITTEL</span>
        </div>
        <div class="ui-element spaceship-aggression">
            Schiff: <span id="aggression-level" class="aggression-level calm">RUHIG</span>
        </div>
        <div class="ui-element" style="color: #ff88aa;">
            Schusstypen: <span id="shot-chances" style="font-size: 14px;">🟢35% 🟡23% 🔴17% ⚡25%</span>
        </div>
        <div class="ui-element shield-system">
            <div class="shield-counter">
                🛡️ x<span id="shield-count">${CONFIG.SHIELD_CONFIG.INITIAL_SHIELD_COUNT}</span>
            </div>
            <div class="shield-cooldown">
                <div class="cooldown-bar" id="cooldown-bar"></div>
                <span class="cooldown-text" id="cooldown-text"></span>
            </div>
            <div class="shield-hint">[SPACE] für Schild</div>
        </div>
        <div class="ui-element shield-system" style="margin-left: 20px;">
            <div class="shield-counter">
                🛡️ AUTO x<span id="auto-shield-count">${CONFIG.SHIELD_CONFIG.INITIAL_AUTO_SHIELD_COUNT}</span>
            </div>
        </div>                
    `;
    document.body.appendChild(gameUI);
}

function updateGameUI() {
    if (!gameStarted) return;
    
    const wordsCount = document.getElementById('words-count');
    const survivalTimer = document.getElementById('survival-timer');
    const currentScoreElement = document.getElementById('current-score');
    const defendedCountElement = document.getElementById('defended-count');
    
    if (wordsCount) {
        const remainingWords = floatingTexts.filter(word => !word.isDestroyed).length;
        wordsCount.textContent = remainingWords;
    }
    
    if (survivalTimer) {
        const elapsedTime = Math.floor((Date.now() - gameStartTime) / 1000);
        const minutes = Math.floor(elapsedTime / 60).toString().padStart(2, '0');
        const seconds = (elapsedTime % 60).toString().padStart(2, '0');
        survivalTimer.textContent = `${minutes}:${seconds}`;
    }
    
    if (currentScoreElement) {
        currentScoreElement.textContent = currentScore;
    }
    
    if (defendedCountElement) {
        defendedCountElement.textContent = defendedWordsCounter;
    }
    
    // Update spaceship aggression level
    const aggressionElement = document.getElementById('aggression-level');
    if (aggressionElement) {
        const remainingWords = floatingTexts.filter(word => !word.isDestroyed).length;
        const aggressiveness = calculateSpaceshipAggressiveness();
        
        aggressionElement.className = 'aggression-level';
        
        // Check if spaceship is in forced aggression mode
        const isInForcedMode = spaceshipController && spaceshipController.isInForcedAggressionMode;
        
        if (isInForcedMode) {
            aggressionElement.textContent = 'ZWANGS-JAGD!';
            aggressionElement.classList.add('hunting');
        } else if (remainingWords <= 2) {
            aggressionElement.textContent = 'JAGD!';
            aggressionElement.classList.add('hunting');
        } else if (remainingWords <= 4) {
            aggressionElement.textContent = 'AGGRESSIV';
            aggressionElement.classList.add('aggressive');
        } else if (remainingWords <= 7) {
            aggressionElement.textContent = 'ALARMIERT';
            aggressionElement.classList.add('alert');
        } else {
            aggressionElement.textContent = 'RUHIG';
            aggressionElement.classList.add('calm');
        }
    }
    
    // Update shot type chances display
    const shotChancesElement = document.getElementById('shot-chances');
    if (shotChancesElement) {
        const remainingWords = floatingTexts.filter(word => !word.isDestroyed).length;
        const isEarlyGame = remainingWords >= 7;
        
        if (isEarlyGame) {
            shotChancesElement.textContent = '🟢35% 🟡23% 🔴17% ⚡25%';
        } else {
            shotChancesElement.textContent = '🟢20% 🟡28% 🔴27% ⚡25%';
        }
    }
    
    // Update shield system
    updateShieldUI();

    // NEU: Autoschild-Zähler aktualisieren
    const autoShieldCountElement = document.getElementById('auto-shield-count');
    if (autoShieldCountElement) {
        autoShieldCountElement.textContent = autoShieldCount;
        // Optional: Den Zähler hervorheben, wenn Schilde vorhanden sind
        autoShieldCountElement.parentElement.parentElement.style.color = autoShieldCount > 0 ? '#55ff55' : '#44ffaa';
    }
    
    // Update difficulty display
    const difficultyDisplay = document.getElementById('difficulty-display');
    if (difficultyDisplay) {
        const currentDiff = localStorage.getItem('wordDefenderDifficulty') || 'mittel';
        difficultyDisplay.textContent = currentDiff.toUpperCase();
        difficultyDisplay.className = 'difficulty-badge ' + currentDiff;
    }            
    
    // Update emergency state
    updateEmergencyState();
}

// UI Update Timer - separate from game loop
let uiUpdateInterval = null;

function startUIUpdates() {
    if (uiUpdateInterval) clearInterval(uiUpdateInterval);
    uiUpdateInterval = setInterval(updateGameUI, CONFIG.UI_CONFIG.UPDATE_INTERVAL);
}

function stopUIUpdates() {
    if (uiUpdateInterval) {
        clearInterval(uiUpdateInterval);
        uiUpdateInterval = null;
    }
}

function updateShieldCooldown() {
    if (shieldCount < maxShields) {
        const now = Date.now();
        if (now - lastShieldTime >= shieldCooldown) {
            shieldCount++;
            console.log(`Schild regeneriert. Aktuell: ${shieldCount}`);
            // WICHTIG: Setze den Timer-Startpunkt für den NÄCHSTEN Schild neu.
            lastShieldTime = Date.now(); 
        }
    }
}

function updateShieldUI() {
    const shieldCountElement = document.getElementById('shield-count');
    const cooldownBar = document.getElementById('cooldown-bar');
    const cooldownText = document.getElementById('cooldown-text');
    
    if (shieldCountElement) {
        shieldCountElement.textContent = shieldCount;
    }
    
    if (cooldownBar && cooldownText) {
        if (shieldCount < maxShields) {
            const now = Date.now();
            const timeSinceLastShield = now - lastShieldTime;
            const progress = Math.min(timeSinceLastShield / shieldCooldown, 1);
            const timeRemaining = Math.max(0, Math.ceil((shieldCooldown - timeSinceLastShield) / 1000));
            
            cooldownBar.style.setProperty('--progress', `${progress * 100}%`);
            cooldownText.textContent = timeRemaining > 0 ? `${timeRemaining}s` : '';
        } else {
            cooldownBar.style.setProperty('--progress', '100%');
            cooldownText.textContent = '';
        }
    }
    
    updateShieldCooldown();
}

function activateShield(word) {
    console.log('Attempting to shield word:', word.element.textContent, 'already shielded:', word.isShielded);
    
    if (!protectedWords.has(word) && !word.isShielded) {
        protectedWords.add(word);
        word.isShielded = true;
        word.element.classList.add('shielded-word');
        
        console.log('Shield activated successfully on:', word.element.textContent);
        
        // Shield sound effect
        try {
            createShieldSound();
        } catch (e) {
            console.log('Audio not available:', e);
        }
        
        // Remove shield after being hit or after 10 seconds
        setTimeout(() => {
            console.log('Shield timeout for:', word.element.textContent);
            removeShield(word);
        }, 10000);
        
        return true;
    }
    console.log('Shield activation failed - word already protected');
    return false; // Word already shielded
}

function removeShield(word) {
    if (word && protectedWords.has(word)) {
        console.log('Removing shield from:', word.element.textContent);
        protectedWords.delete(word);
        word.isShielded = false;
        word.element.classList.remove('shielded-word');
    }
}

function createShieldSound() {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Shield activation sound: rising tone
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.3);
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
}

function createShieldDeflectionEffect(target) {
    const rect = target.element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Create multiple spark particles
    for (let i = 0; i < 8; i++) {
        const spark = document.createElement('div');
        spark.className = 'shield-spark';
        spark.style.position = 'fixed';
        spark.style.left = centerX + 'px';
        spark.style.top = centerY + 'px';
        spark.style.width = '4px';
        spark.style.height = '4px';
        spark.style.backgroundColor = '#44ffaa';
        spark.style.borderRadius = '50%';
        spark.style.pointerEvents = 'none';
        spark.style.zIndex = '2000';
        
        document.body.appendChild(spark);
        
        // Random direction for spark
        const angle = (i / 8) * Math.PI * 2;
        const distance = 30 + Math.random() * 20;
        const deltaX = Math.cos(angle) * distance;
        const deltaY = Math.sin(angle) * distance;
        
        // Animate spark
        spark.animate([
            { transform: 'translate(0, 0) scale(1)', opacity: 1 },
            { transform: `translate(${deltaX}px, ${deltaY}px) scale(0)`, opacity: 0 }
        ], {
            duration: 500,
            easing: 'ease-out'
        }).onfinish = () => {
            spark.remove();
        };
    }
}

function createShieldDeflectionSound() {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Shield deflection sound: metallic clang
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(1200, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(300, audioContext.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
}

function showRestartButton() {
    // Calculate survival time
    const survivalTime = Math.floor((Date.now() - gameStartTime) / 1000);
    
    // Save highscore with final score
    const currentScoreData = saveHighscore(window.currentPlayerName, survivalTime, currentScore);
    
    // Store current score data globally for filter updates
    window.currentGameOverScore = currentScoreData;
    
    // Create game over overlay with highscore table
    const overlay = document.createElement('div');
    overlay.className = 'info-overlay';
    
    const isFirstGame = loadHighscores().length === 1 && loadHighscores()[0] === currentScoreData;
    const congratsText = isFirstGame 
        ? "Dein erster Highscore!" 
        : currentScoreData === loadHighscores()[0] 
            ? "🏆 NEUER REKORD!" 
            : "Gut gespielt!";
    
    overlay.innerHTML = `
        <div class="info-box">
            <h1>GAME OVER</h1>
            <p style="color: #ffaa44; font-size: 20px; font-weight: 600;">${congratsText}</p>
            <p>Du hast <span class="highlight">${formatTime(survivalTime)}</span> überlebt!</p>
            <p><span class="highlight">${currentScore}</span> Punkte erreicht!</p>
            <p><span class="highlight">${12 - floatingTexts.filter(word => !word.isDestroyed).length}</span> Wörter zerstört.</p>
            ${showHighscoreTable(currentScoreData)}
            <button class="start-button" onclick="restartGame()" style="margin-top: 20px;">NEUES SPIEL</button>
        </div>
    `;
    document.body.appendChild(overlay);
    
    // Attach event listeners for online leaderboard functionality
    setTimeout(() => {
        attachLeaderboardEventListeners();
    }, 100);
}

function restartGame() {
    const overlay = document.querySelector('.info-overlay');
    if (overlay) {
        overlay.remove();
    }

    if (restartButton) {
        restartButton.remove();
        restartButton = null;
    }

    const gameUI = document.getElementById('game-ui');
    if (gameUI) {
        gameUI.remove();
    }
    
    // Clear current game over score data
    window.currentGameOverScore = null;
    
    // Stop UI updates to prevent memory leaks
    stopUIUpdates();

    const emergencyOverlay = document.getElementById('emergency-overlay');
    if (emergencyOverlay) {
        emergencyOverlay.remove();
    }

    // Zerstöre alle aktiven Jäger und ihre Timer
    if (spaceshipController) {
        spaceshipController.destroy();
        spaceshipController = null;
    }
    if (secondSpaceshipController) {
        secondSpaceshipController.destroy();
        secondSpaceshipController = null;
    }

    floatingTexts.forEach(word => {
        if (word.element && word.element.parentNode) {
            word.element.parentNode.removeChild(word.element);
        }
    });
    floatingTexts = [];

    activeProjectiles.forEach(projectile => {
        projectile.destroy();
    });
    activeProjectiles = [];

    // Spielstatus vollständig zurücksetzen
    gameStarted = false;
    gameStartTime = 0;
    shieldCount = 3;
    lastShieldTime = 0;
    protectedWords.clear();
    currentScore = 0;
    consecutiveSuccessfulDefenses = 0;
    attackInterval = 10000;
    hasFirstAttackHappened = false;
    defendedWordsCounter = 0;
    resetPulsar();
    stopMineSpawning();
    
    // Info-Overlay für den Neustart anzeigen
    showInfoOverlay();
}

async function initializeGame() {
    await loadWords();
    
    const container = document.querySelector('.container');
    const goldenSizes = calculateGoldenRatioSizes();
    
    // Create word elements dynamically from JSON data
    wordsData.forEach((wordData, index) => {
        const element = document.createElement('span');
        element.className = 'hello';
        element.textContent = wordData.text;
        element.style.fontWeight = wordData.fontWeight;
        element.style.color = wordData.color;
        element.style.opacity = wordData.opacity;
        element.title = wordData.language;
        
        container.appendChild(element);
        floatingTexts.push(new FloatingText(element, index + 1, goldenSizes[index]));
    });
    
    // Initialize spaceship
    spaceshipController = new SpaceshipController();
}

class SpaceshipController {
    constructor(isSecondHunter = false) {
        this.container = document.querySelector('.container');
        this.spaceship = null;
        this.isSecondHunter = isSecondHunter; // Unterscheidet zwischen erstem und zweitem Schiff
        this.x = containerWidth / 2 + (Math.random() - 0.5) * 200;
        this.y = containerHeight / 2 + (Math.random() - 0.5) * 200;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
        this.targetVx = this.vx;
        this.targetVy = this.vy;
        this.changeDirectionTimer = 0;
        this.rotation = 0;
        this.targetRotation = 0;
        this.isChasing = false;
        this.chaseTarget = null;
        this.shootingRadius = Math.min(containerWidth, containerHeight) / 2.5;
        this.radarRadius = Math.min(containerWidth, containerHeight) / 1.5;
        this.MAX_FIRING_ANGLE = 30;
        this.COLLISION_RADIUS = 25 * CONFIG.SPACESHIP_CONFIG.VISUAL.SIZE_SCALE; // Skalierter Kollisionsradius
        this.targetingWord = null;
        this.targetingTimer = null;
        this.radarPing = null;
        this.chaseAttempts = 0;
        this.maxChaseAttempts = 1;
        this.aggressionModeTimer = 0;
        this.isInForcedAggressionMode = false;
        this.forcedAggressionDuration = 0;
        this.hasFiredShot = false; // Verfolgt ob bereits ein Schuss in diesem Angriff abgegeben wurde
        
        // Anti-Stuck-System
        this.lastPositionX = this.x;
        this.lastPositionY = this.y;
        this.stuckCounter = 0;
        this.lastMovementCheck = Date.now();
        this.lastBoosterTime = 0; // Verhindert Booster-Spam
        
        // Instanz-spezifische Timer
        this.shootTimer = null;
        this.radarInterval = null;

        this.createSpaceship();
        this.startShootingTimer();
    }
    
    destroy() {
        // Stoppt alle Timer dieser Instanz
        clearTimeout(this.shootTimer);
        clearTimeout(this.targetingTimer);
        clearTimeout(this.radarInterval);
        
        // Entfernt das DOM-Element
        if (this.spaceship && this.spaceship.parentNode) {
            this.spaceship.remove();
        }
        console.log('Spaceship controller and its timers have been destroyed.');
    }
    
    createSpaceship() {
        this.spaceship = document.createElement('div');
        this.spaceship.className = 'spaceship';
        this.spaceship.style.left = this.x + 'px';
        this.spaceship.style.top = this.y + 'px';
        
        // Skaliere das Raumschiff basierend auf CONFIG
        const scale = CONFIG.SPACESHIP_CONFIG.VISUAL.SIZE_SCALE;
        const baseSize = CONFIG.SPACESHIP_CONFIG.VISUAL.BASE_WIDTH;
        const scaledSize = baseSize * scale;
        
        this.spaceship.style.width = scaledSize + 'px';
        this.spaceship.style.height = scaledSize + 'px';
        this.spaceship.style.transform = `scale(${scale})`;
        this.spaceship.style.transformOrigin = 'center center';
        
        // Unterschiedliche Farben für erstes und zweites Schiff
        if (this.isSecondHunter) {
            // Zweiter Hunter - Rote Farben mit weißem Cockpit
            this.spaceship.innerHTML = `
                <svg viewBox="0 0 ${CONFIG.SPACESHIP_CONFIG.VISUAL.SVG_VIEWBOX_SIZE} ${CONFIG.SPACESHIP_CONFIG.VISUAL.SVG_VIEWBOX_SIZE}" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <!-- Hauptkörper Gradient (Rot-Metallic) -->
                        <linearGradient id="secondHunterBodyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" style="stop-color:#e74c3c;stop-opacity:1" />
                            <stop offset="50%" style="stop-color:#c0392b;stop-opacity:1" />
                            <stop offset="100%" style="stop-color:#a93226;stop-opacity:1" />
                        </linearGradient>
                        <!-- Sekundärteile Gradient (Dunkelblau-Metallic) -->
                        <linearGradient id="secondHunterWingsGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" style="stop-color:#3498db;stop-opacity:1" />
                            <stop offset="50%" style="stop-color:#2980b9;stop-opacity:1" />
                            <stop offset="100%" style="stop-color:#1f4e79;stop-opacity:1" />
                        </linearGradient>
                        <!-- Weißes Cockpit Gradient -->
                        <radialGradient id="secondHunterCockpitGradient" cx="30%" cy="30%" r="70%">
                            <stop offset="0%" style="stop-color:#ffffff;stop-opacity:1" />
                            <stop offset="50%" style="stop-color:#f8f9fa;stop-opacity:1" />
                            <stop offset="100%" style="stop-color:#e9ecef;stop-opacity:1" />
                        </radialGradient>
                    </defs>
                    <!-- Main body (Hauptkörper - Rot) -->
                    <ellipse cx="25" cy="31.25" rx="10" ry="15" fill="url(#secondHunterBodyGradient)" stroke="#7b1e1e" stroke-width="1"/>
                    <!-- Cockpit (Vordere Ellipse - Weiß) -->
                    <ellipse cx="25" cy="18.75" rx="5" ry="7.5" fill="url(#secondHunterCockpitGradient)" stroke="#adb5bd" stroke-width="0.5"/>
                    <!-- Wings (Sekundärteile - Blau) -->
                    <polygon points="15,37.5 10,43.75 15,40" fill="url(#secondHunterWingsGradient)" stroke="#1f4e79"/>
                    <polygon points="35,37.5 40,43.75 35,40" fill="url(#secondHunterWingsGradient)" stroke="#1f4e79"/>
                    <!-- Engine glow (Triebwerksglühen) -->
                    <ellipse cx="25" cy="46.25" rx="3.75" ry="2.5" fill="#ff4444" opacity="0.8"/>
                    <ellipse cx="25" cy="47.5" rx="2.5" ry="1.25" fill="#ffff44" opacity="0.9"/>
                </svg>
            `;
        } else {
            // Erstes Schiff - Grüne Farben mit weißem Cockpit
            this.spaceship.innerHTML = `
                <svg viewBox="0 0 ${CONFIG.SPACESHIP_CONFIG.VISUAL.SVG_VIEWBOX_SIZE} ${CONFIG.SPACESHIP_CONFIG.VISUAL.SVG_VIEWBOX_SIZE}" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <!-- Hauptkörper Gradient (Grün-Metallic) -->
                        <linearGradient id="mainBodyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" style="stop-color:#58d68d;stop-opacity:1" />
                            <stop offset="50%" style="stop-color:#27ae60;stop-opacity:1" />
                            <stop offset="100%" style="stop-color:#1e8449;stop-opacity:1" />
                        </linearGradient>
                        <!-- Sekundärteile Gradient (Orange-Metallic) -->
                        <linearGradient id="secondaryPartsGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" style="stop-color:#f39c12;stop-opacity:1" />
                            <stop offset="50%" style="stop-color:#e67e22;stop-opacity:1" />
                            <stop offset="100%" style="stop-color:#d35400;stop-opacity:1" />
                        </linearGradient>
                        <!-- Weißes Cockpit Gradient -->
                        <radialGradient id="whiteCockpitGradient" cx="30%" cy="30%" r="70%">
                            <stop offset="0%" style="stop-color:#ffffff;stop-opacity:1" />
                            <stop offset="50%" style="stop-color:#f8f9fa;stop-opacity:1" />
                            <stop offset="100%" style="stop-color:#e9ecef;stop-opacity:1" />
                        </radialGradient>
                    </defs>
                    <!-- Main body (Hauptkörper - Grün) -->
                    <ellipse cx="25" cy="31.25" rx="10" ry="15" fill="url(#mainBodyGradient)" stroke="#145a32" stroke-width="1"/>
                    <!-- Cockpit (Vordere Ellipse - Weiß) -->
                    <ellipse cx="25" cy="18.75" rx="5" ry="7.5" fill="url(#whiteCockpitGradient)" stroke="#adb5bd" stroke-width="0.5"/>
                    <!-- Wings (Sekundärteile - Orange) -->
                    <polygon points="15,37.5 10,43.75 15,40" fill="url(#secondaryPartsGradient)" stroke="#a04000"/>
                    <polygon points="35,37.5 40,43.75 35,40" fill="url(#secondaryPartsGradient)" stroke="#a04000"/>
                    <!-- Engine glow (Triebwerksglühen) -->
                    <ellipse cx="25" cy="46.25" rx="3.75" ry="2.5" fill="#ff4444" opacity="0.8"/>
                    <ellipse cx="25" cy="47.5" rx="2.5" ry="1.25" fill="#ffff44" opacity="0.9"/>
                </svg>
            `;
        }
        this.container.appendChild(this.spaceship);
    }

    showBooster() {
        // Verhindere Booster-Spam (maximal alle 1 Sekunde pro Schiff)
        const now = Date.now();
        if (now - this.lastBoosterTime < 1000) {
            console.log(`🔇 Booster skipped for spaceship ${this.isSecondHunter ? '2' : '1'} (individual cooldown)`);
            return;
        }
        this.lastBoosterTime = now;
        
        const booster = document.createElement('div');
        booster.className = 'booster-flame';
        
        // Skaliere den Booster basierend auf CONFIG
        const boosterScale = CONFIG.SPACESHIP_CONFIG.VISUAL.BOOSTER_SCALE;
        booster.style.transform = `translateX(-50%) scale(${boosterScale})`;
        booster.style.transformOrigin = 'center bottom';
        
        this.spaceship.appendChild(booster);
        
        // Play booster sound with limiting to prevent multiple sounds
        try {
            // Only play sound if enough time has passed since last boost sound
            if (now - lastBoostSoundTime >= BOOST_SOUND_COOLDOWN) {
                createSoftWooshSound();
                lastBoostSoundTime = now;
                console.log(`🔊 Boost sound played by spaceship ${this.isSecondHunter ? '2' : '1'}`);
            } else {
                console.log('🔇 Boost sound skipped (global cooldown active)');
            }
        } catch (e) {
            console.log('Audio not available:', e);
        }
        
        setTimeout(() => {
            if (booster.parentNode) {
                booster.remove();
            }
        }, 500);
    }
    
    update() {
        if (this.isChasing && this.chaseTarget && !this.chaseTarget.isDestroyed) {
            // Chase mode - move toward target
            const targetRect = this.chaseTarget.element.getBoundingClientRect();
            const targetX = targetRect.left + targetRect.width / 2;
            const targetY = targetRect.top + targetRect.height / 2;
            
            const deltaX = targetX - (this.x + 25);
            const deltaY = targetY - (this.y + 25);
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            
            // Check if target is now in radar range for targeting
            if (distance <= this.radarRadius) {
                this.isChasing = false;
                this.startTargeting(this.chaseTarget);
                this.chaseTarget = null;
                return;
            }
            
            // Move toward target with dynamic boosted speed (etwas moderiert)
            const chaseSpeed = calculateSpaceshipChaseSpeed() * 0.9; // 10% langsamer für glättere Bewegung
            
            // Vermeidung von Überschießen bei nahen Zielen
            const speedFactor = Math.min(1.0, distance / 100); // Langsamere Annäherung bei < 100px
            this.vx = (deltaX / distance) * chaseSpeed * speedFactor;
            this.vy = (deltaY / distance) * chaseSpeed * speedFactor;
            
            // Rotate toward target
            this.targetRotation = Math.atan2(deltaY, deltaX) * 180 / Math.PI + 90;
            
        } else {
            // Normal patrol mode with dynamic aggressiveness
            const remainingWords = floatingTexts.filter(word => !word.isDestroyed).length;
            
            // Check for forced aggression mode when >=7 targets (30% chance every 3 seconds)
            if (remainingWords >= 7 && !this.isInForcedAggressionMode) {
                this.aggressionModeTimer++;
                if (this.aggressionModeTimer >= 180) { // 3 seconds at 60fps
                    this.aggressionModeTimer = 0;
                    if (Math.random() < 0.3) { // 30% chance
                        this.isInForcedAggressionMode = true;
                        this.forcedAggressionDuration = 300 + Math.random() * 300; // 5-10 seconds
                        console.log('Ship entered forced aggression mode for', (this.forcedAggressionDuration / 60).toFixed(1), 'seconds!');
                        this.showBooster(); // Visual indication of mode switch
                    }
                }
            }
            
            // Handle forced aggression mode duration
            if (this.isInForcedAggressionMode) {
                this.forcedAggressionDuration--;
                if (this.forcedAggressionDuration <= 0) {
                    this.isInForcedAggressionMode = false;
                    console.log('Ship exited forced aggression mode');
                }
            }
            
            const aggressiveness = calculateSpaceshipAggressiveness();
            const changeSpeedMultiplier = aggressiveness.directionChangeSpeed;
            
            // Apply forced aggression mode effects
            const effectiveAggressiveness = this.isInForcedAggressionMode ? {
                ...aggressiveness,
                huntMode: true,
                directionChangeSpeed: Math.max(aggressiveness.directionChangeSpeed, 2.0),
                chaseThreshold: Math.min(aggressiveness.chaseThreshold, 0.2)
            } : aggressiveness;
            
            this.changeDirectionTimer++;
            const baseChangeInterval = 180;
            const dynamicChangeInterval = baseChangeInterval / effectiveAggressiveness.directionChangeSpeed;
            
            if (this.changeDirectionTimer > dynamicChangeInterval + Math.random() * 120) {
                const speedMultiplier = effectiveAggressiveness.huntMode ? 1.5 : 1.0;
                // Weniger aggressive Geschwindigkeitsänderungen um Zittern zu vermeiden
                this.targetVx = (Math.random() - 0.5) * 2.5 * speedMultiplier;
                this.targetVy = (Math.random() - 0.5) * 2.5 * speedMultiplier;
                this.targetRotation = Math.atan2(this.targetVy, this.targetVx) * 180 / Math.PI + 90;
                this.changeDirectionTimer = 0;
            }
            
            // Glättere Bewegung - erhöhte Interpolation von 0.02 auf 0.08
            const smoothingFactor = effectiveAggressiveness.huntMode ? 0.12 : 0.08;
            this.vx += (this.targetVx - this.vx) * smoothingFactor;
            this.vy += (this.targetVy - this.vy) * smoothingFactor;
        }
        
        // Check if currently targeting word is still in range
        if (this.targetingWord && !this.targetingWord.isDestroyed) {
            const rect = this.targetingWord.element.getBoundingClientRect();
            const wordX = rect.left + rect.width / 2;
            const wordY = rect.top + rect.height / 2;
            const distance = Math.sqrt(
                Math.pow(wordX - (this.x + 25), 2) + 
                Math.pow(wordY - (this.y + 25), 2)
            );
            
            if (distance > this.radarRadius) {
                // Target escaped radar range completely, cancel targeting
                this.cancelTargeting();
                
                console.log('Word escaped radar range - repositioning');
                
                // Check if we should chase or switch target
                const remainingWords = floatingTexts.filter(word => !word.isDestroyed);
                const aggressiveness = calculateSpaceshipAggressiveness();
                
                // Apply forced aggression mode effects
                const effectiveAggressiveness = this.isInForcedAggressionMode ? {
                    ...aggressiveness,
                    huntMode: true,
                    chaseThreshold: Math.min(aggressiveness.chaseThreshold, 0.2)
                } : aggressiveness;
                
                if (remainingWords.length < 3) {
                    // Few words left: Higher chase chance (60% instead of 40%)
                    if (Math.random() < 0.6) {
                        this.chaseAttempts++;
                        if (this.chaseAttempts <= this.maxChaseAttempts) {
                            // Continue chasing this target
                            setTimeout(() => {
                                this.startChasing(this.targetingWord);
                            }, 500);
                        } else {
                            // Switch to random target after max attempts
                            this.chaseAttempts = 0;
                            this.maxChaseAttempts = Math.floor(Math.random() * 2) + 1; // 1-2 attempts
                            setTimeout(() => {
                                this.shootAtRandomWord();
                            }, 500);
                        }
                    } else {
                        // Switch to random target immediately (40% chance)
                        this.chaseAttempts = 0;
                        this.maxChaseAttempts = Math.floor(Math.random() * 2) + 1; // 1-2 attempts
                        setTimeout(() => {
                            this.shootAtRandomWord();
                        }, 500);
                    }
                } else {
                    // Many words left: Dynamic chase chance based on effective aggressiveness
                    const baseChaseChance = effectiveAggressiveness.huntMode ? 0.3 : 0.15;
                    // Increase chase chance further if in forced aggression mode
                    const chaseChance = this.isInForcedAggressionMode ? Math.min(baseChaseChance * 1.5, 0.6) : baseChaseChance;
                    if (Math.random() < chaseChance) {
                        this.chaseAttempts++;
                        if (this.chaseAttempts <= this.maxChaseAttempts) {
                            // Continue chasing this target
                            setTimeout(() => {
                                this.startChasing(this.targetingWord);
                            }, 500);
                        } else {
                            // Switch to random target after max attempts
                            this.chaseAttempts = 0;
                            this.maxChaseAttempts = Math.floor(Math.random() * 2) + 1; // 1-2 attempts
                            setTimeout(() => {
                                this.shootAtRandomWord();
                            }, 500);
                        }
                    } else {
                        // Switch to random target immediately
                        this.chaseAttempts = 0;
                        this.maxChaseAttempts = Math.floor(Math.random() * 2) + 1; // 1-2 attempts
                        setTimeout(() => {
                            this.shootAtRandomWord();
                        }, 500);
                    }
                }
            } else {
                // Target still in radar range but outside shooting range: continue targeting
                // Re-schedule targeting attempt after a short delay
                this.targetingTimer = setTimeout(() => {
                    this.executeShot();
                }, 500);
            }
        }
        
        // Update position
        this.x += this.vx;
        this.y += this.vy;
        
        // Bounce off edges with margin
        const margin = 60;
        if (this.x < margin) {
            this.x = margin;
            this.vx = Math.abs(this.vx);
            this.targetVx = Math.abs(this.targetVx);
        } else if (this.x > containerWidth - margin) {
            this.x = containerWidth - margin;
            this.vx = -Math.abs(this.vx);
            this.targetVx = -Math.abs(this.targetVx);
        }
        
        if (this.y < margin) {
            this.y = margin;
            this.vy = Math.abs(this.vy);
            this.targetVy = Math.abs(this.targetVy);
        } else if (this.y > containerHeight - margin) {
            this.y = containerHeight - margin;
            this.vy = -Math.abs(this.vy);
            this.targetVy = -Math.abs(this.targetVy);
        }
        
        // Glättere Rotation - erhöhte Rotationsgeschwindigkeit von 0.1 auf 0.15
        let rotationDiff = this.targetRotation - this.rotation;
        if (rotationDiff > 180) rotationDiff -= 360;
        if (rotationDiff < -180) rotationDiff += 360;
        
        // Adaptive Rotationsgeschwindigkeit je nach Modus
        const rotationSpeed = this.isChasing ? 0.2 : 0.15;
        this.rotation += rotationDiff * rotationSpeed;
        
        // Anti-Stuck-System: Prüfe alle 2 Sekunden auf Bewegung
        const now = Date.now();
        if (now - this.lastMovementCheck > 2000) { // 2 Sekunden
            const distanceMoved = Math.sqrt(
                Math.pow(this.x - this.lastPositionX, 2) + 
                Math.pow(this.y - this.lastPositionY, 2)
            );
            
            if (distanceMoved < 10) { // Weniger als 10 Pixel in 2 Sekunden = stuck
                this.stuckCounter++;
                console.log(`🚨 Spaceship ${this.isSecondHunter ? '2' : '1'} appears stuck! Count: ${this.stuckCounter}, Distance: ${distanceMoved.toFixed(1)}px`);
                
                if (this.stuckCounter >= 2) { // Nach 4 Sekunden ohne Bewegung
                    console.log(`🔧 Unsticking spaceship ${this.isSecondHunter ? '2' : '1'}!`);
                    this.unstickSpaceship();
                    this.stuckCounter = 0;
                }
            } else {
                this.stuckCounter = 0; // Reset counter bei Bewegung
            }
            
            // Update Tracking-Variablen
            this.lastPositionX = this.x;
            this.lastPositionY = this.y;
            this.lastMovementCheck = now;
        }
        
        // Update spaceship position and rotation
        this.spaceship.style.left = this.x + 'px';
        this.spaceship.style.top = this.y + 'px';
        this.spaceship.style.transform = `rotate(${this.rotation}deg)`;
    }
    
    unstickSpaceship() {
        console.log(`🔧 Applying emergency unstick to spaceship ${this.isSecondHunter ? '2' : '1'}`);
        
        // Clear all timers und states, die zu Deadlocks führen könnten
        clearTimeout(this.targetingTimer);
        clearTimeout(this.radarInterval);
        this.targetingTimer = null;
        this.radarInterval = null;
        
        // Reset targeting state
        if (this.targetingWord) {
            this.targetingWord.element.classList.remove('targeted');
            this.targetingWord = null;
        }
        
        // Clear radar ping
        if (this.radarPing && this.radarPing.parentNode) {
            this.radarPing.remove();
            this.radarPing = null;
        }
        
        // Reset chase state
        this.isChasing = false;
        this.chaseTarget = null;
        
        // Reset aggression mode
        this.isInForcedAggressionMode = false;
        this.aggressionModeTimer = 0;
        this.forcedAggressionDuration = 0;
        
        // Force new random movement direction with higher speed
        this.targetVx = (Math.random() - 0.5) * 4; // Doppelte Geschwindigkeit
        this.targetVy = (Math.random() - 0.5) * 4;
        this.vx = this.targetVx * 0.5; // Sofort etwas Geschwindigkeit geben
        this.vy = this.targetVy * 0.5;
        
        // Reset direction change timer to trigger new direction soon
        this.changeDirectionTimer = 0;
        
        // Restart shooting timer
        clearTimeout(this.shootTimer);
        this.startShootingTimer();
        
        console.log(`✅ Spaceship ${this.isSecondHunter ? '2' : '1'} unstuck procedure completed`);
    }
    
    startShootingTimer() {
        const initialDelay = hasFirstAttackHappened ? calculateAttackInterval() : 20000;
        
        this.shootTimer = setTimeout(() => {
            hasFirstAttackHappened = true;
            if (!this.targetingWord && !this.hasFiredShot) {
                this.shootAtRandomWord();
            }
            
            const scheduleNextAttack = () => {
                this.shootTimer = setTimeout(() => {
                    if (!this.targetingWord && !this.hasFiredShot) {
                        this.shootAtRandomWord();
                    }
                    scheduleNextAttack();
                }, calculateAttackInterval());
            };
            
            scheduleNextAttack();
        }, initialDelay);
    }
    
    shootAtRandomWord() {
        // Get all available words and categorize them by distance
        const availableWords = floatingTexts.filter(word => !word.isDestroyed);
        if (availableWords.length === 0) return;
        
        const wordsInRadar = [];
        const wordsOutsideRadar = [];
        
        availableWords.forEach(word => {
            const rect = word.element.getBoundingClientRect();
            const wordX = rect.left + rect.width / 2;
            const wordY = rect.top + rect.height / 2;
            const distance = Math.sqrt(
                Math.pow(wordX - (this.x + 25), 2) + 
                Math.pow(wordY - (this.y + 25), 2)
            );
            
            if (distance <= this.radarRadius) {
                wordsInRadar.push(word);
            } else {
                wordsOutsideRadar.push(word);
            }
        });
        
        let target;
        
        // Priority: Choose words outside radar range (requires chasing)
        if (wordsOutsideRadar.length > 0) {
            target = wordsOutsideRadar[Math.floor(Math.random() * wordsOutsideRadar.length)];
            console.log('Targeting word outside radar range - will chase');
            
            // Target is outside radar range: chase first
            this.resetChaseAttempts();
            this.startChasing(target);
            
        } else {
            // Fallback: Choose from words in radar range (immediate targeting)
            target = wordsInRadar[Math.floor(Math.random() * wordsInRadar.length)];
            console.log('All words in radar range - targeting immediately');
            
            // Target in radar range: can target immediately
            this.resetChaseAttempts();
            
            // Random radar boost for unpredictable acceleration (40% chance)
            if (Math.random() < 0.4) {
                console.log('Random radar boost triggered! Aggressive approach!');
                this.showBooster();
            }
            
            this.startTargeting(target);
        }
    }
    
    resetChaseAttempts() {
        this.chaseAttempts = 0;
        this.maxChaseAttempts = Math.floor(Math.random() * 2) + 1; // 1-2 attempts
    }
    
    calculateAngleToTarget(target) {
        const targetRect = target.element.getBoundingClientRect();
        const targetX = targetRect.left + targetRect.width / 2;
        const targetY = targetRect.top + targetRect.height / 2;
        
        const deltaX = targetX - (this.x + 25);
        const deltaY = targetY - (this.y + 25);
        return Math.atan2(deltaY, deltaX) * 180 / Math.PI + 90;
    }
    
    checkProjectileCollision(projectileX, projectileY, target) {
        if (!target || target.isDestroyed) return false;
        
        const targetRect = target.element.getBoundingClientRect();
        const targetCenterX = targetRect.left + targetRect.width / 2;
        const targetCenterY = targetRect.top + targetRect.height / 2;

        // --- NEUE KAPSEL-KOLLISIONSLOGIK ---
        const collisionRadius = 15 + Math.min(target.width, target.height) * 0.4;
        
        const distance = Math.sqrt(
            Math.pow(projectileX - targetCenterX, 2) + 
            Math.pow(projectileY - targetCenterY, 2)
        );
        
        return distance <= collisionRadius;
    }
    
    startTargeting(target) {
        if (this.targetingWord) return; // Already targeting
        
        this.targetingWord = target;
        this.hasFiredShot = false; // Neuer Angriff beginnt - Schuss-Status zurücksetzen
        target.element.classList.add('targeted'); // Add red glow
        this.showRadarPing(target);
        
        // Aim at target
        const targetRect = target.element.getBoundingClientRect();
        const targetX = targetRect.left + targetRect.width / 2;
        const targetY = targetRect.top + targetRect.height / 2;
        
        const deltaX = targetX - (this.x + 25);
        const deltaY = targetY - (this.y + 25);
        this.targetRotation = Math.atan2(deltaY, deltaX) * 180 / Math.PI + 90;
        
        // Check if this might be an ultra shot and adjust targeting time
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const isLongRange = distance > this.shootingRadius;
        
        // Wait time based on remaining words (dynamic targeting speed)
        // Ultra shots (long range) take 2x longer to target
        let targetingTime = calculateTargetingTime();
        if (isLongRange) {
            targetingTime *= 2;
            console.log('Long range target detected - extended targeting time:', targetingTime);
        }
        
        this.targetingTimer = setTimeout(() => {
            // Dynamic booster effect frequency
            const boosterFrequency = calculateBoosterFrequency();
            if (Math.random() < boosterFrequency) {
                this.showBooster();
            }
            this.executeShot();
        }, targetingTime);
    }
    
    showRadarPing(target) {
        const targetRect = target.element.getBoundingClientRect();
        const targetX = targetRect.left + targetRect.width / 2;
        const targetY = targetRect.top + targetRect.height / 2;
        
        this.radarPing = document.createElement('div');
        this.radarPing.className = 'radar-ping';
        this.radarPing.style.left = targetX + 'px';
        this.radarPing.style.top = targetY + 'px';
        this.radarPing.style.width = '30px';
        this.radarPing.style.height = '30px';
        
        this.container.appendChild(this.radarPing);
        
        // Update ping position as target moves
        this.updatePingPosition();
        
        // Start random interval radar pings (1-2 seconds)
        this.startRadarPingInterval();
    }
    
    startRadarPingInterval() {
        if (this.radarInterval) {
            clearTimeout(this.radarInterval);
        }
        
        const scheduleNextPing = () => {
            const randomInterval = 500 + Math.random() * 500;
            this.radarInterval = setTimeout(() => {
                if (this.targetingWord && !this.targetingWord.isDestroyed) {
                    this.createRadarPing();
                    scheduleNextPing();
                }
            }, randomInterval);
        };
        
        scheduleNextPing();
    }
    
    createRadarPing() {
        if (!this.targetingWord || this.targetingWord.isDestroyed) return;
        
        const targetRect = this.targetingWord.element.getBoundingClientRect();
        const targetX = targetRect.left + targetRect.width / 2;
        const targetY = targetRect.top + targetRect.height / 2;
        
        const ping = document.createElement('div');
        ping.className = 'radar-ping';
        ping.style.left = targetX + 'px';
        ping.style.top = targetY + 'px';
        ping.style.width = '30px';
        ping.style.height = '30px';
        
        this.container.appendChild(ping);
        
        // Remove ping after animation completes
        setTimeout(() => {
            if (ping.parentNode) {
                ping.remove();
            }
        }, 500);
    }
    
    updatePingPosition() {
        if (this.radarPing && this.targetingWord && !this.targetingWord.isDestroyed) {
            const targetRect = this.targetingWord.element.getBoundingClientRect();
            const targetX = targetRect.left + targetRect.width / 2;
            const targetY = targetRect.top + targetRect.height / 2;
            
            this.radarPing.style.left = targetX + 'px';
            this.radarPing.style.top = targetY + 'px';
            
            setTimeout(() => this.updatePingPosition(), 50);
        }
    }
    
    cancelTargeting() {
        if (this.targetingTimer) {
            clearTimeout(this.targetingTimer);
            this.targetingTimer = null;
        }
        
        if (this.radarInterval) {
            clearTimeout(this.radarInterval);
            this.radarInterval = null;
        }
        
        if (this.radarPing) {
            this.radarPing.remove();
            this.radarPing = null;
        }
        
        // NEU: Entferne die Ziel-Markierung vom DOM, aber behalte targetingWord 
        // für Schild-Aktivierung während Projektil-Flug
        if (this.targetingWord) {
            this.targetingWord.element.classList.remove('targeted');
            // WICHTIG: targetingWord wird NICHT auf null gesetzt!
            // Es bleibt gesetzt für Schild-Aktivierung während normaler Projektile
        }
    }
    
    executeShot() {
        if (!this.targetingWord || this.hasFiredShot) return; // Verhindere mehrfache Schüsse pro Angriff
        
        // Determine shot type first
        const shotType = this.calculateShotType();
        
        const rect = this.targetingWord.element.getBoundingClientRect();
        const wordX = rect.left + rect.width / 2;
        const wordY = rect.top + rect.height / 2;
        const distance = Math.sqrt(
            Math.pow(wordX - (this.x + 25), 2) + 
            Math.pow(wordY - (this.y + 25), 2)
        );
        
        // Check if target is in range (normal shots use shootingRadius, ultra shots use extended range)
        const effectiveRange = shotType.type === 'ultra' ? 
            this.shootingRadius * shotType.rangeMultiplier : 
            this.shootingRadius;
        
        if (distance <= effectiveRange) {
            // Berechne Winkel zum Ziel
            const targetAngle = this.calculateAngleToTarget(this.targetingWord);
            const shipFacing = this.rotation;
            
            // Berechne Winkeldifferenz
            let angleDiff = targetAngle - shipFacing;
            while (angleDiff > 180) angleDiff -= 360;
            while (angleDiff < -180) angleDiff += 360;
            
            // Ultra shots have wider firing angle (±45° instead of ±30°)
            const maxFiringAngle = shotType.type === 'ultra' ? 45 : this.MAX_FIRING_ANGLE;
            
            if (Math.abs(angleDiff) <= maxFiringAngle) {
                // Ziel im Schusswinkel: feuern!
                console.log(`Firing ${shotType.name}! Angle diff: ${angleDiff.toFixed(1)}° (within ±${maxFiringAngle}°), Range: ${distance.toFixed(0)}/${effectiveRange.toFixed(0)}`);
                this.hasFiredShot = true; // Markiere dass ein Schuss abgegeben wurde
                this.fireLaser(this.targetingWord);
                this.cancelTargeting();
            } else {
                // Ziel außerhalb Schusswinkel: repositionieren
                console.log(`Target outside firing angle: ${angleDiff.toFixed(1)}° (max ±${maxFiringAngle}°) - repositioning`);
                this.targetRotation = targetAngle;
                // Retry nach kurzer Zeit
                this.targetingTimer = setTimeout(() => this.executeShot(), 200);
            }
        } else if (distance > this.radarRadius) {
            // Target escaped radar range completely, cancel targeting
            this.cancelTargeting();
            
            console.log('Word escaped radar range during executeShot - repositioning');
            
            // Try to target another word
            const chaseProb = calculateDynamicChaseProb();
            if (Math.random() < chaseProb) {
                setTimeout(() => {
                    if (!this.targetingWord) { // Only shoot if not already targeting
                        this.shootAtRandomWord();
                    }
                }, 500 + Math.random() * 1000);
            } else {
                setTimeout(() => {
                    if (!this.targetingWord) { // Only shoot if not already targeting
                        this.shootAtRandomWord();
                    }
                }, 1500 + Math.random() * 2000);
            }
        } else {
            // Target still in radar range but outside shooting range: continue targeting
            // Wait a bit longer and try again
            this.targetingTimer = setTimeout(() => this.executeShot(), 200);
        }
    }
    
    startChasing(target) {
        this.isChasing = true;
        this.chaseTarget = target;
        this.showBooster();
    }
    
    calculateShotType() {
        const remainingWords = floatingTexts.filter(word => !word.isDestroyed).length;
        const isEarlyGame = remainingWords >= 7;
        
        const random = Math.random() * 100;
        
        // Ultra shot now has 25% chance
        if (random < 25) {
            return {
                type: 'ultra',
                name: 'Ultra-Nachschuss',
                speedMultiplier: 1.25, // +25% base speed increase
                chance: 25,
                rangeMultiplier: 3.0,
                color: '#aa44ff',
                size: 18
            };
        }
        
        // Adjust remaining percentages (75% total)
        if (isEarlyGame) {
            // Early game: 35% normal, 23% yellow, 17% red (scaled to 75%)
            if (random < 25 + 35) { // 25-60%
                return {
                    type: 'normal',
                    name: 'Grün (Normal)',
                    speedMultiplier: 1.25, // +25% base speed increase
                    chance: 35,
                    rangeMultiplier: 3.0, // 3x range for all shots
                    color: '#44ff44',
                    size: 12
                };
            } else if (random < 25 + 35 + 23) { // 60-83%
                return {
                    type: 'yellow',
                    name: 'Gelb (+15%)',
                    speedMultiplier: 1.44, // 1.15 * 1.25 = 1.44 (+44% total)
                    chance: 23,
                    rangeMultiplier: 3.0, // 3x range for all shots
                    color: '#ffff44',
                    size: 14
                };
            } else { // 83-100%
                return {
                    type: 'red',
                    name: 'Rot (+30%)',
                    speedMultiplier: 1.63, // 1.30 * 1.25 = 1.63 (+63% total)
                    chance: 17,
                    rangeMultiplier: 3.0, // 3x range for all shots
                    color: '#ff4444',
                    size: 16
                };
            }
        } else {
            // Late game: 20% normal, 28% yellow, 27% red (scaled to 75%)
            if (random < 25 + 20) { // 25-45%
                return {
                    type: 'normal',
                    name: 'Grün (Normal)',
                    speedMultiplier: 1.25, // +25% base speed increase
                    chance: 20,
                    rangeMultiplier: 3.0, // 3x range for all shots
                    color: '#44ff44',
                    size: 12
                };
            } else if (random < 25 + 20 + 28) { // 45-73%
                return {
                    type: 'yellow',
                    name: 'Gelb (+15%)',
                    speedMultiplier: 1.44, // 1.15 * 1.25 = 1.44 (+44% total)
                    chance: 28,
                    rangeMultiplier: 3.0, // 3x range for all shots
                    color: '#ffff44',
                    size: 14
                };
            } else { // 73-100%
                return {
                    type: 'red',
                    name: 'Rot (+30%)',
                    speedMultiplier: 1.63, // 1.30 * 1.25 = 1.63 (+63% total)
                    chance: 27,
                    rangeMultiplier: 3.0, // 3x range for all shots
                    color: '#ff4444',
                    size: 16
                };
            }
        }
    }
    
    applyProjectileStyles(projectile, shotType) {
        projectile.style.width = shotType.size + 'px';
        projectile.style.height = shotType.size + 'px';
        
        if (shotType.type === 'ultra') {
            projectile.style.background = `radial-gradient(circle, ${shotType.color} 0%, #6600aa 50%, #440088 100%)`;
            projectile.style.border = '3px solid #ffffff';
            projectile.style.boxShadow = `
                0 0 20px ${shotType.color},
                0 0 40px ${shotType.color},
                0 0 60px rgba(170, 68, 255, 0.8),
                inset 0 0 8px rgba(255, 255, 255, 0.6)`;
        } else {
            projectile.style.background = `radial-gradient(circle, ${shotType.color} 0%, #ff4400 50%, #ff0000 100%)`;
            projectile.style.border = '2px solid #ffffff';
            projectile.style.boxShadow = `
                0 0 15px ${shotType.color},
                0 0 30px ${shotType.color},
                0 0 45px rgba(255, 68, 0, 0.8),
                inset 0 0 6px rgba(255, 255, 255, 0.6)`;
        }
    }
    
    fireLaser(target) {
        const spaceshipX = this.x + 20; // Center of spaceship
        const spaceshipY = this.y + 20;
        
        const targetRect = target.element.getBoundingClientRect();
        const targetX = targetRect.left + targetRect.width / 2;
        const targetY = targetRect.top + targetRect.height / 2;
        
        // Determine shot type based on probability
        const shotType = this.calculateShotType();
        console.log(`Shot type selected: ${shotType.name} (${shotType.chance}% chance)`);
        
        // Play appropriate laser sound
        try {
            if (shotType.type === 'ultra') {
                createUltraLaserSound();
            } else {
                createLaserSound();
            }
        } catch (e) {
            console.log('Audio not available:', e);
        }
        
        // Handle ultra shots with homing projectiles
        if (shotType.type === 'ultra') {
            const baseSpeed = 480 * 1.25; // Basis-Geschwindigkeit (600 p/s)
            const homingProjectile = new HomingProjectile(
                spaceshipX,
                spaceshipY,
                target,
                baseSpeed, // Übergib die volle Geschwindigkeit (in Pixel pro Sekunde)
                0.1 // Erhöhe die Wenderate für aggressivere Kurven
            );
            activeProjectiles.push(homingProjectile);
            console.log('Homing projectile launched at', target.element.textContent);
            
            // Ultra-Schuss beendet - Flags zurücksetzen da Homing Projectile eigene Logik hat
            this.targetingWord = null;
            this.hasFiredShot = false;
            
            return; // Wichtig: Beende die Funktion hier für Ultra-Schüsse
        }
        
        // NEU: Für normale Projektile speichere das Zielwort während der Flugzeit
        this.targetingWord = target;
        console.log(`Normal projectile targeting: ${target.element.textContent}`);
        
        // Regular projectiles for non-ultra shots
        const projectile = document.createElement('div');
        projectile.className = 'laser';
        projectile.style.left = spaceshipX + 'px';
        projectile.style.top = spaceshipY + 'px';
        
        // Apply shot type specific styling
        if (shotType.type !== 'normal') {
            this.applyProjectileStyles(projectile, shotType);
        }
        
        this.container.appendChild(projectile);
        
        // Calculate projectile trajectory with speed multiplier
        const deltaX = targetX - spaceshipX;
        const deltaY = targetY - spaceshipY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const baseSpeed = 480 * shotType.speedMultiplier; // Base projectile speed with +25% increase
        const duration = distance / baseSpeed;
        
        // Collision detection variables
        let collisionDetected = false;
        let collisionCheckInterval;
        const startTime = Date.now();
        
        // Start collision detection loop
        collisionCheckInterval = setInterval(() => {
            if (collisionDetected || target.isDestroyed) {
                clearInterval(collisionCheckInterval);
                return;
            }
            
            // Calculate current projectile position based on elapsed time
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / (duration * 1000), 1);
            
            const currentX = spaceshipX + (deltaX * progress);
            const currentY = spaceshipY + (deltaY * progress);
            
            // Check collision
            if (this.checkProjectileCollision(currentX, currentY, target)) {
                collisionDetected = true;
                clearInterval(collisionCheckInterval);
                
                // Stop projectile animation and explode at current position
                projectile.style.left = currentX + 'px';
                projectile.style.top = currentY + 'px';
                
                setTimeout(() => {
                    projectile.remove();
                    console.log('Projectile hit target!');
                    // NEU: Angriff beendet - beide Flags zurücksetzen
                    this.targetingWord = null;
                    this.hasFiredShot = false;
                    this.explodeWord(target);
                }, 50);
            }
        }, 16); // Check every ~60fps
        
        // Animate circular projectile with rotation effect
        const animation = projectile.animate([
            { 
                transform: 'translate(0, 0) rotate(0deg)', 
                opacity: 1 
            },
            { 
                transform: `translate(${deltaX}px, ${deltaY}px) rotate(720deg)`, 
                opacity: 1 
            }
        ], {
            duration: duration * 1000,
            easing: 'linear'
        });
        
        animation.onfinish = () => {
            clearInterval(collisionCheckInterval);
            if (!collisionDetected) {
                projectile.remove();
                console.log('Projectile missed target!');
                
                // NEU: Angriff beendet - beide Flags zurücksetzen
                this.targetingWord = null;
                this.hasFiredShot = false;
                
                // Award points for successful defense - shot missed
                awardPoints();
                console.log('Shot missed - defense successful! Points awarded.');
            }
        };
        
        // Add projectile trail effect
        this.createProjectileTrail(spaceshipX, spaceshipY, targetX, targetY, duration);
    }
    
    createProjectileTrail(startX, startY, endX, endY, duration) {
        const trail = document.createElement('div');
        trail.style.position = 'absolute';
        trail.style.left = startX + 'px';
        trail.style.top = startY + 'px';
        trail.style.width = '2px';
        trail.style.height = '2px';
        trail.style.background = 'rgba(255, 68, 0, 0.6)';
        trail.style.borderRadius = '50%';
        trail.style.pointerEvents = 'none';
        trail.style.zIndex = '998';
        trail.style.boxShadow = '0 0 8px rgba(255, 68, 0, 0.8)';
        
        this.container.appendChild(trail);
        
        // Animate trail following projectile path
        const deltaX = endX - startX;
        const deltaY = endY - startY;
        
        trail.animate([
            { 
                transform: 'translate(0, 0) scale(1)',
                opacity: 0.8 
            },
            { 
                transform: `translate(${deltaX}px, ${deltaY}px) scale(0.3)`,
                opacity: 0 
            }
        ], {
            duration: duration * 1000 * 1.2, // Trail lasts slightly longer
            easing: 'ease-out'
        }).onfinish = () => {
            trail.remove();
        };
    }
    
    explodeWord(target) {
        // NEU: Autoschild-Logik. Diese hat die höchste Priorität.
        if (autoShieldCount > 0) {
            autoShieldCount--; // Verbrauche einen Autoschild
            console.log('Autoschild hat das Wort gerettet! Verbleibend:', autoShieldCount);

            // Visuelles Feedback für den Spieler
            createShieldDeflectionEffect(target); // Wir können den gleichen Effekt wie beim manuellen Schild nutzen
            createShieldDeflectionSound(); // Und den gleichen Sound

            // Wichtig: Beende die Funktion hier, um die Zerstörung zu verhindern.
            return; 
        }

        // Bestehende Logik für den manuellen Schild (wird nur erreicht, wenn kein Autoschild verfügbar war)
        console.log('Explosion attempt on word:', target.element.textContent, 'isShielded:', target.isShielded);
        if (target.isShielded) {
            console.log('Shield deflection successful!');
            createShieldDeflectionEffect(target);
            removeShield(target);
            awardPoints();
            try {
                createShieldDeflectionSound();
            } catch (e) {
                console.log('Audio not available:', e);
            }
            return;
        }

        console.log('Word exploded - no shield protection');
        resetScoreStreak();
        target.explode();
    }
}

async function loadWords() {
    try {
        const response = await fetch('words.json');
        const data = await response.json();
        wordsData = data.words;
        return wordsData;
    } catch (error) {
        console.error('Could not load words.json, using fallback data:', error);
        // Fallback data in case words.json can't be loaded
        wordsData = [
            { text: "hello", language: "English", fontWeight: 800, color: "#FFB3BA", opacity: 0.9 },
            { text: "hola", language: "Spanish", fontWeight: 300, color: "#BAFFC9", opacity: 0.8 },
            { text: "bonjour", language: "French", fontWeight: 600, color: "#BAE1FF", opacity: 0.7 },
            { text: "ciao", language: "Italian", fontWeight: 500, color: "#FFFFBA", opacity: 0.8 },
            { text: "hallo", language: "German", fontWeight: 400, color: "#FFD1FF", opacity: 0.6 },
            { text: "こんにちは", language: "Japanese", fontWeight: 700, color: "#FFDFBA", opacity: 0.5 },
            { text: "olá", language: "Portuguese", fontWeight: 600, color: "#E1BAFF", opacity: 0.9 },
            { text: "привет", language: "Russian", fontWeight: 400, color: "#BAFFE1", opacity: 0.7 },
            { text: "merhaba", language: "Turkish", fontWeight: 800, color: "#FFC9BA", opacity: 0.9 },
            { text: "안녕하세요", language: "Korean", fontWeight: 300, color: "#C9BAFF", opacity: 0.6 },
            { text: "namaste", language: "Hindi", fontWeight: 500, color: "#BAFFD1", opacity: 0.8 },
            { text: "shalom", language: "Hebrew", fontWeight: 700, color: "#FFE1BA", opacity: 0.8 }
        ];
        return wordsData;
    }
}

function calculateGoldenRatioSizes() {
    const baseFontSize = Math.min(containerWidth, containerHeight) / 15 * 2; // Double the scale
    const minFontSize = Math.max(48, baseFontSize / 6); // Minimum also doubled
    const goldenRatioSizes = [];
    
    // Create different scaling variations while maintaining golden ratio relationships
    const scaleVariations = [1.2, 0.8, 1.0, 1.3, 0.9, 1.1, 0.7, 1.4, 0.85, 1.15, 0.95, 1.25];
    
    let currentSize = baseFontSize;
    for (let i = 0; i < wordsData.length; i++) {
        const variation = scaleVariations[i % scaleVariations.length];
        const sizeWithVariation = Math.max(currentSize * variation, minFontSize);
        goldenRatioSizes.push(sizeWithVariation);
        currentSize /= PHI;
    }
    
    return goldenRatioSizes.sort(() => Math.random() - 0.5);
}

class FloatingText {
    constructor(element, index, fontSize) {
        this.element = element;
        this.index = index;
        this.fontSize = fontSize;
        this.initialFontSize = fontSize; // Store the initial font size
        this.isDestroyed = false;
        
        this.element.style.fontSize = this.fontSize + 'px';
        
        setTimeout(() => {
            this.width = this.element.offsetWidth;
            this.height = this.element.offsetHeight;
            
            this.x = containerWidth / 2 - this.width / 2 + (Math.random() - 0.5) * 100;
            this.y = containerHeight / 2 - this.height / 2 + (Math.random() - 0.5) * 100;
            
            this.vx = (Math.random() - 0.5) * 3;
            this.vy = (Math.random() - 0.5) * 3;
            this.rotation = Math.random() * 360;
            this.rotationSpeed = (Math.random() - 0.5) * 0.5;
            this.baseRotationSpeed = (Math.random() - 0.5) * 0.3;
            
        this.element.style.transform = `translate3d(${this.x}px, ${this.y}px, 0) rotate(${this.rotation}deg)`;                    this.element.style.zIndex = index;
            
            this.setupInteractionHandlers();
        }, 10);
    }
    
    setupInteractionHandlers() {
        this.element.addEventListener('click', (e) => {
            // Get click position relative to word element
            const rect = this.element.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickY = e.clientY - rect.top;
            
            // Calculate center of word
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            // Calculate distance from center (normalized to 0-1)
            const deltaX = clickX - centerX;
            const deltaY = clickY - centerY;
            const distanceFromCenter = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);
            const normalizedDistance = Math.min(distanceFromCenter / maxDistance, 1);
            
            let escapeAngle;
            
            if (normalizedDistance > 0.3) {
                // Near edges: escape direction based on click position
                escapeAngle = Math.atan2(deltaY, deltaX);
            } else {
                // Near center: random direction
                escapeAngle = Math.random() * 2 * Math.PI;
            }
            
            const baseForce = 14.375; // Fixed click force
            
            // Apply directional impulse
            this.vx = Math.cos(escapeAngle) * baseForce;
            this.vy = Math.sin(escapeAngle) * baseForce;
            
            // Add rotation based on escape direction
            // Positive angle = counter-clockwise rotation
            const rotationDirection = Math.sign(Math.sin(escapeAngle - Math.PI/4));
            this.rotationSpeed = rotationDirection * (4 + Math.random() * 4);
            
            e.preventDefault();
        });
    }
    
    isNearEdge() {
        const margin = Math.min(containerWidth, containerHeight) * 0.15;
        return (this.x <= margin || 
                this.x >= containerWidth - this.width - margin ||
                this.y <= margin || 
                this.y >= containerHeight - this.height - margin);
    }
    
    addRotationalImpulse() {
        this.rotationSpeed += (Math.random() - 0.5) * 8;
    }
    
    explode() {
        if (this.isDestroyed) return;
        this.isDestroyed = true;
        
        // Play explosion sound
        try {
            createExplosionSound();
        } catch (e) {
            console.log('Audio not available:', e);
        }
        
        const rect = this.element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Create explosion particles
        const particleCount = 20;
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'explosion-particle';
            particle.style.left = centerX + 'px';
            particle.style.top = centerY + 'px';
            particle.style.background = this.element.style.color || '#ffff00';
            
            document.querySelector('.container').appendChild(particle);
            
            // Random explosion direction and speed
            const angle = (i / particleCount) * 360 + Math.random() * 30;
            const speed = 150 + Math.random() * 150;
            const deltaX = Math.cos(angle * Math.PI / 180) * speed;
            const deltaY = Math.sin(angle * Math.PI / 180) * speed;
            
            // Animate particle explosion
            particle.animate([
                { transform: 'translate(0, 0) scale(1)', opacity: 1 },
                { transform: `translate(${deltaX}px, ${deltaY}px) scale(0.2)`, opacity: 0 }
            ], {
                duration: 1200 + Math.random() * 800,
                easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            }).onfinish = () => {
                particle.remove();
            };
        }
        
        // Hide and remove the word element
        this.element.style.opacity = '0';
        setTimeout(() => {
            if (this.element.parentNode) {
                this.element.parentNode.removeChild(this.element);
            }
        }, 100);
    }
    
    update() {
        if (this.isDestroyed || !this.width) return;
        
        // Simple physics - no center attraction, no orbital mechanics
        this.x += this.vx;
        this.y += this.vy;
        this.rotation += this.rotationSpeed + this.baseRotationSpeed;
        
        // Progressive friction - words naturally slow down
        const dynamicFriction = calculateDynamicFriction();
        const dynamicRotationDamping = calculateDynamicRotationDamping();
        
        this.vx *= dynamicFriction;
        this.vy *= dynamicFriction;
        this.rotationSpeed *= dynamicRotationDamping;
        
        // Auto-escape from UI overlap zone
        const UI_ZONE = { x: 0, y: 0, width: 350, height: 250 };
        const ESCAPE_THRESHOLD = 1.0; // Only push slow-moving words
        
        if (this.x < UI_ZONE.width && this.y < UI_ZONE.height) {
            const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
            if (speed < ESCAPE_THRESHOLD) {
                // Apply gentle escape force away from UI
                const escapeForce = 3.0;
                const centerX = UI_ZONE.width / 2;
                const centerY = UI_ZONE.height / 2;
                
                // Direction away from UI center
                const deltaX = this.x - centerX;
                const deltaY = this.y - centerY;
                const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                
                if (distance > 0) {
                    this.vx += (deltaX / distance) * escapeForce;
                    this.vy += (deltaY / distance) * escapeForce;
                } else {
                    // If exactly in center, push down-right
                    this.vx += escapeForce;
                    this.vy += escapeForce;
                }
            }
        }
        
        // Edge bouncing with force loss
        let isColliding = false;
        const bounceMargin = 30;
        
        if (this.x <= bounceMargin) {
            this.vx = Math.abs(this.vx) * 0.7; // Lose energy on bounce
            this.x = bounceMargin + 1;
            isColliding = true;
        } else if (this.x >= containerWidth - this.width - bounceMargin) {
            this.vx = -Math.abs(this.vx) * 0.7;
            this.x = containerWidth - this.width - bounceMargin - 1;
            isColliding = true;
        }
        
        // NEUE OBERE KOLLISION mit der UI-Leiste
        if (this.y <= UI_BAR_HEIGHT) {
            this.vy = Math.abs(this.vy) * 0.7; // Energieverlust beim Aufprall
            this.y = UI_BAR_HEIGHT + 1; // Position direkt unter die Leiste setzen
            isColliding = true;
        } else if (this.y >= containerHeight - this.height - bounceMargin) {
            this.vy = -Math.abs(this.vy) * 0.7;
            this.y = containerHeight - this.height - bounceMargin - 1;
            isColliding = true;
        }
        
        if (isColliding) {
            this.rotationSpeed += (Math.random() - 0.5) * 2; // Less spin on collision
            this.element.classList.add('glowing');
            setTimeout(() => {
                this.element.classList.remove('glowing');
            }, 400);
        }
        
        this.element.style.transform = `translate3d(${this.x}px, ${this.y}px, 0) rotate(${this.rotation}deg)`;
    }
    
    resize() {
        containerWidth = window.innerWidth;
        containerHeight = window.innerHeight;
        
        if (this.width && this.height) {
            this.x = Math.min(this.x, containerWidth - this.width - 50);
            this.y = Math.min(this.y, containerHeight - this.height - 50);
        }
        
        // Keep the initial font size unchanged during resize
        this.element.style.fontSize = this.initialFontSize + 'px';
        
        setTimeout(() => {
            this.width = this.element.offsetWidth;
            this.height = this.element.offsetHeight;
        }, 10);
    }
}

// Space Beacon Mine System
class SpaceBeacon {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.detectionRadius = 100; // Warning radius
        this.blastRadius = 60; // Explosion radius
        this.isExploded = false;
        this.isTargeting = false;
        this.targetingWord = null;
        this.targetingTimer = null;
        this.radarPing = null;
        this.element = this.createElement();
        this.container = document.querySelector('.container');
        this.container.appendChild(this.element);
    }
    
    createElement() {
        const beacon = document.createElement('div');
        beacon.className = 'space-beacon';
        beacon.style.left = (this.x - 12) + 'px'; // Center the 24px beacon
        beacon.style.top = (this.y - 12) + 'px';
        return beacon;
    }
    
    update() {
        if (this.isExploded) return;
        
        // Check for nearby words to target
        this.checkForTargets();
    }
    
    checkForTargets() {
        if (this.isTargeting) return;
        
        for (let word of floatingTexts) {
            if (word.isDestroyed || word.isShielded) continue;
            
            // Use getBoundingClientRect for accurate visual position (like Spaceship)
            const rect = word.element.getBoundingClientRect();
            const wordCenterX = rect.left + rect.width / 2;
            const wordCenterY = rect.top + rect.height / 2;
            const distance = Math.sqrt(
                Math.pow(wordCenterX - this.x, 2) + 
                Math.pow(wordCenterY - this.y, 2)
            );
            
            // Debug output
            if (distance <= this.detectionRadius + 20) { // Log when close
                console.log('Space beacon checking word:', word.element.textContent, 'Distance:', Math.round(distance), 'Detection radius:', this.detectionRadius);
            }
            
            if (distance <= this.detectionRadius) {
                console.log('Space beacon starting targeting for:', word.element.textContent);
                this.startTargeting(word);
                break;
            }
        }
    }
    
    startTargeting(word) {
        if (this.isTargeting) return;
        
        this.isTargeting = true;
        this.targetingWord = word;
        this.element.classList.add('targeting');
        
        // Create radar ping
        this.createRadarPing(word);
        
        // Set targeting timer
        const targetingTime = 500; // 0.5 seconds warning
        this.targetingTimer = setTimeout(() => {
            console.log('Space beacon timer expired, executing explosion');
            this.executeExplosion();
        }, targetingTime);
        
        console.log('Space beacon targeting word:', word.element.textContent, 'Timer set for', targetingTime + 'ms');
    }
    
    createRadarPing(word) {
        this.radarPing = document.createElement('div');
        this.radarPing.className = 'radar-ping';
        this.radarPing.style.left = (word.x + word.width/2 - 15) + 'px';
        this.radarPing.style.top = (word.y + word.height/2 - 15) + 'px';
        this.container.appendChild(this.radarPing);
    }
    
    executeExplosion() {
        console.log('Space beacon executeExplosion called');
        
        if (!this.targetingWord || this.targetingWord.isDestroyed) {
            console.log('No valid targeting word, canceling');
            this.cancelTargeting();
            return;
        }
        
        // Check if word is still in blast range
        const wordCenterX = this.targetingWord.x + this.targetingWord.width / 2;
        const wordCenterY = this.targetingWord.y + this.targetingWord.height / 2;
        const distance = Math.sqrt(
            Math.pow(wordCenterX - this.x, 2) + 
            Math.pow(wordCenterY - this.y, 2)
        );
        
        console.log('Final distance check:', Math.round(distance), 'vs blast radius:', this.blastRadius);
        
        if (distance <= this.blastRadius) {
            // Check if word is shielded
            if (this.targetingWord.isShielded) {
                console.log('Space beacon blocked by shield!');
                this.targetingWord.isShielded = false;
                this.targetingWord.element.classList.remove('shielded-word');
                // Award points for successful shield defense
                awardPoints();
            } else {
                // Destroy the word
                console.log('Space beacon destroyed word:', this.targetingWord.element.textContent);
                this.targetingWord.explode();
            }
        } else {
            // Word escaped, continue beacon operation
            console.log('Word escaped space beacon - no points awarded');
        }
        
        this.explode();
    }
    
    cancelTargeting() {
        if (this.targetingTimer) {
            clearTimeout(this.targetingTimer);
            this.targetingTimer = null;
        }
        
        if (this.radarPing && this.radarPing.parentNode) {
            this.radarPing.parentNode.removeChild(this.radarPing);
        }
        
        if (this.targetingWord) {
            this.targetingWord.element.classList.remove('targeted');
            this.targetingWord = null;
        }
        
        this.element.classList.remove('targeting');
        this.isTargeting = false;
    }
    
    explode() {
        if (this.isExploded) return;
        
        this.isExploded = true;
        this.cancelTargeting();
        
        console.log('Space beacon exploding at:', this.x, this.y);
        
        // Create explosion effect
        const explosion = document.createElement('div');
        explosion.className = 'beacon-explosion';
        explosion.style.left = this.x + 'px';
        explosion.style.top = this.y + 'px';
        this.container.appendChild(explosion);
        
        // Play beacon explosion sound
        try {
            createMineExplosionSound();
        } catch (e) {
            console.log('Audio not available:', e);
        }
        
        // Remove explosion effect after animation
        setTimeout(() => {
            if (explosion.parentNode) {
                explosion.parentNode.removeChild(explosion);
            }
        }, 600);
        
        // Check for words in blast radius and destroy them
        floatingTexts.forEach(word => {
            if (word.isDestroyed) return;
            
            const wordCenterX = word.x + word.width / 2;
            const wordCenterY = word.y + word.height / 2;
            const distance = Math.sqrt(
                Math.pow(wordCenterX - this.x, 2) + 
                Math.pow(wordCenterY - this.y, 2)
            );
            
            if (distance <= this.blastRadius) {
                if (word.isShielded) {
                    console.log('Word protected by shield from space beacon explosion');
                    word.isShielded = false;
                    word.element.classList.remove('shielded-word');
                    awardPoints();
                } else {
                    console.log('Word destroyed by space beacon explosion:', word.element.textContent);
                    word.explode();
                }
            }
        });
        
        this.destroy();
    }
    
    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        
        // Remove from spaceBeacons array
        const index = spaceBeacons.indexOf(this);
        if (index > -1) {
            spaceBeacons.splice(index, 1);
        }
    }
}

function deployBeacon() {
    if (spaceBeacons.length >= maxBeacons) {
        // Remove oldest beacon
        const oldestBeacon = spaceBeacons.shift();
        oldestBeacon.destroy();
    }
    
    // Find a safe position away from words and UI
    let attempts = 0;
    let x, y;
    
    do {
        x = 400 + Math.random() * (containerWidth - 800); // Avoid UI and edges
        y = 100 + Math.random() * (containerHeight - 200);
        attempts++;
    } while (attempts < 10 && isPositionNearWords(x, y, 120));
    
    const beacon = new SpaceBeacon(x, y);
    spaceBeacons.push(beacon);
    
    console.log('Space beacon deployed at:', x, y, 'Total beacons:', spaceBeacons.length);
}

function isPositionNearWords(x, y, minDistance) {
    for (let word of floatingTexts) {
        if (word.isDestroyed) continue;
        
        const wordCenterX = word.x + word.width / 2;
        const wordCenterY = word.y + word.height / 2;
        const distance = Math.sqrt(
            Math.pow(wordCenterX - x, 2) + 
            Math.pow(wordCenterY - y, 2)
        );
        
        if (distance < minDistance) {
            return true;
        }
    }
    return false;
}

function updateBeacons() {
    spaceBeacons.forEach(beacon => {
        beacon.update();
    });
}

// Floating Mine Threat System
class FloatingMine {
    constructor() {
        this.container = document.querySelector('.container');
        this.findSafePosition();
        this.vx = (Math.random() - 0.5) * 1.5; // Slow floating movement
        this.vy = (Math.random() - 0.5) * 1.5;
        this.isDestroyed = false;
        this.isTargeting = false;
        this.targetingWord = null;
        this.targetingTimer = null;
        this.radarPing = null;
        this.element = this.createElement();
        this.container.appendChild(this.element);
        
        // Auto-explode after lifespan
        setTimeout(() => {
            if (!this.isDestroyed) {
                console.log('Floating mine auto-exploding after lifespan');
                this.explode();
            }
        }, mineLifespan);
        
        console.log('Floating mine spawned at:', this.x, this.y);
    }
    
    findSafePosition() {
        let attempts = 0;
        do {
            this.x = 200 + Math.random() * (containerWidth - 400);
            this.y = 150 + Math.random() * (containerHeight - 300);
            attempts++;
        } while (attempts < 20 && (isPositionNearWords(this.x, this.y, 100) || this.isInUIZone()));
    }
    
    isInUIZone() {
        return this.x < 350 && this.y < 250;
    }
    
    createElement() {
        const mine = document.createElement('div');
        mine.className = 'floating-mine';
        mine.style.left = this.x + 'px';
        mine.style.top = this.y + 'px';
        
        // No click handler - mines are threats, not collectibles
        
        return mine;
    }
    
    update() {
        if (this.isDestroyed) return;
        
        // Floating physics similar to words but slower
        this.x += this.vx;
        this.y += this.vy;
        
        // Very light friction
        this.vx *= 0.995;
        this.vy *= 0.995;
        
        // Edge bouncing
        const margin = 50;
        if (this.x <= margin || this.x >= containerWidth - margin) {
            this.vx *= -0.8;
            this.x = Math.max(margin, Math.min(containerWidth - margin, this.x));
        }
        if (this.y <= margin || this.y >= containerHeight - margin) {
            this.vy *= -0.8;
            this.y = Math.max(margin, Math.min(containerHeight - margin, this.y));
        }
        
        this.element.style.left = this.x + 'px';
        this.element.style.top = this.y + 'px';
        
        // Check for nearby words to target
        this.checkForTargets();
    }
    
    checkForTargets() {
        if (this.isTargeting) return;
        
        const DETECTION_RADIUS = 100;
        
        // Debug: Log mine position every few frames
        if (Math.random() < 0.01) { // 1% chance to log
            console.log('Floating mine at:', Math.round(this.x), Math.round(this.y), 'checking for targets...');
        }
        
        for (let word of floatingTexts) {
            if (word.isDestroyed || word.isShielded) continue;
            
            // Use getBoundingClientRect for accurate visual position (like Spaceship)
            const rect = word.element.getBoundingClientRect();
            const wordX = rect.left + rect.width / 2;
            const wordY = rect.top + rect.height / 2;
            
            const distance = Math.sqrt(
                Math.pow(wordX - this.x, 2) + 
                Math.pow(wordY - this.y, 2)
            );
            
            // Debug: Log close encounters
            if (distance <= DETECTION_RADIUS + 40) { // Log when getting close
                console.log('Floating mine distance to', word.element.textContent + ':', Math.round(distance), '(detection:', DETECTION_RADIUS + ')');
            }
            
            if (distance <= DETECTION_RADIUS) {
                console.log('Floating mine starting targeting for:', word.element.textContent, 'at distance:', Math.round(distance));
                this.startTargeting(word);
                break;
            }
        }
    }
    
    startTargeting(word) {
        if (this.isTargeting) return;
        
        this.isTargeting = true;
        this.targetingWord = word;
        this.element.classList.add('targeted');
        
        // Create radar ping
        this.createRadarPing(word);
        
        // Set targeting timer (similar to spaceship but shorter)
        const targetingTime = 500; // 0.5 seconds warning
        this.targetingTimer = setTimeout(() => {
            this.executeDestruction();
        }, targetingTime);
        
        console.log('Floating mine targeting word:', word.element.textContent);
    }
    
    createRadarPing(word) {
        this.radarPing = document.createElement('div');
        this.radarPing.className = 'radar-ping';
        this.radarPing.style.left = (word.x + word.width/2 - 15) + 'px';
        this.radarPing.style.top = (word.y + word.height/2 - 15) + 'px';
        this.container.appendChild(this.radarPing);
    }
    
    executeDestruction() {
        if (!this.targetingWord || this.targetingWord.isDestroyed) {
            this.cancelTargeting();
            return;
        }
        
        // Check if word is still in range using getBoundingClientRect
        const rect = this.targetingWord.element.getBoundingClientRect();
        const wordX = rect.left + rect.width / 2;
        const wordY = rect.top + rect.height / 2;
        
        const distance = Math.sqrt(
            Math.pow(wordX - this.x, 2) + 
            Math.pow(wordY - this.y, 2)
        );
        
        if (distance <= 80) {
            // Check if word is shielded
            if (this.targetingWord.isShielded) {
                console.log('Floating mine blocked by shield!');
                this.targetingWord.isShielded = false;
                this.targetingWord.element.classList.remove('shielded-word');
                // Award points for successful shield defense
                awardPoints();
                // Mine explodes even when blocked by shield
                this.explode();
            } else {
                // Explode and destroy word
                console.log('Floating mine exploding near word:', this.targetingWord.element.textContent);
                this.explode();
            }
        } else {
            // Word escaped, continue mine operation
            console.log('Word escaped floating mine - no points awarded');
            this.destroy(); // Mine just disappears if no target
        }
        
        this.cancelTargeting();
    }
    
    cancelTargeting() {
        if (this.targetingTimer) {
            clearTimeout(this.targetingTimer);
            this.targetingTimer = null;
        }
        
        if (this.radarPing && this.radarPing.parentNode) {
            this.radarPing.parentNode.removeChild(this.radarPing);
        }
        
        if (this.targetingWord) {
            this.targetingWord.element.classList.remove('targeted');
            this.targetingWord = null;
        }
        
        this.element.classList.remove('targeted');
        this.isTargeting = false;
    }
    
    explode() {
        if (this.isDestroyed) return;
        
        console.log('Floating mine exploding at:', this.x, this.y);
        
        // Create explosion effect
        const explosion = document.createElement('div');
        explosion.className = 'beacon-explosion';
        explosion.style.left = this.x + 'px';
        explosion.style.top = this.y + 'px';
        explosion.style.background = 'radial-gradient(circle, #88ff88 0%, #44ff44 30%, #22aa22 60%, transparent 100%)';
        this.container.appendChild(explosion);
        
        // Play mine explosion sound
        try {
            createMineExplosionSound();
        } catch (e) {
            console.log('Audio not available:', e);
        }
        
        // Remove explosion effect after animation
        setTimeout(() => {
            if (explosion.parentNode) {
                explosion.parentNode.removeChild(explosion);
            }
        }, 600);
        
        // Check for words in blast radius and destroy them
        const BLAST_RADIUS = 80;
        floatingTexts.forEach(word => {
            if (word.isDestroyed) return;
            
            // Use getBoundingClientRect for accurate visual position
            const rect = word.element.getBoundingClientRect();
            const wordX = rect.left + rect.width / 2;
            const wordY = rect.top + rect.height / 2;
            
            const distance = Math.sqrt(
                Math.pow(wordX - this.x, 2) + 
                Math.pow(wordY - this.y, 2)
            );
            
            if (distance <= BLAST_RADIUS) {
                if (word.isShielded) {
                    console.log('Word protected by shield from floating mine explosion');
                    word.isShielded = false;
                    word.element.classList.remove('shielded-word');
                    awardPoints();
                } else {
                    console.log('Word destroyed by floating mine explosion:', word.element.textContent);
                    word.explode();
                }
            }
        });
        
        this.destroy();
    }
    
    destroy() {
        if (this.isDestroyed) return;
        
        this.isDestroyed = true;
        this.cancelTargeting();
        
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        
        // Remove from floatingMines array
        const index = floatingMines.indexOf(this);
        if (index > -1) {
            floatingMines.splice(index, 1);
        }
    }
}

// Floating mine management functions
function spawnFloatingMine() {
    if (!gameStarted) return;
    
    const mine = new FloatingMine();
    floatingMines.push(mine);
    
    console.log('Floating mine spawned. Total active:', floatingMines.length);
}

function startMineSpawning() {
    if (mineSpawnTimer) {
        clearInterval(mineSpawnTimer);
    }
    
    mineSpawnTimer = setInterval(() => {
        spawnFloatingMine();
    }, mineSpawnInterval);
    
    // Spawn first mine after 15 seconds
    setTimeout(() => {
        spawnFloatingMine();
    }, 15000);
}

function stopMineSpawning() {
    if (mineSpawnTimer) {
        clearInterval(mineSpawnTimer);
        mineSpawnTimer = null;
    }
    
    // Destroy all floating mines
    floatingMines.forEach(mine => mine.destroy());
    floatingMines = [];
}

function updateFloatingMines() {
    floatingMines.forEach(mine => {
        if (!mine.isDestroyed) {
            mine.update();
        }
    });
}

function createCollectionSound() {
    // Create pleasant collection sound
    const osc1 = audioContext.createOscillator();
    const osc2 = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Pleasant ascending tones
    osc1.frequency.setValueAtTime(440, audioContext.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(660, audioContext.currentTime + 0.2);
    
    osc2.frequency.setValueAtTime(880, audioContext.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(1320, audioContext.currentTime + 0.2);
    
    gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);
    
    osc1.start(audioContext.currentTime);
    osc2.start(audioContext.currentTime);
    osc1.stop(audioContext.currentTime + 0.3);
    osc2.stop(audioContext.currentTime + 0.3);
}

// Pulsar endgame mechanics
function createPulsar() {
    if (pulsarElement) {
        pulsarElement.remove();
    }
    
    pulsarElement = document.createElement("div");
    pulsarElement.className = "pulsar";
    pulsarElement.style.left = (containerWidth / 2) + "px";
    pulsarElement.style.top = (containerHeight / 2) + "px";
    document.body.appendChild(pulsarElement);
}

function updatePulsarPhase() {
    const activeWordCount = floatingTexts.filter(text => !text.isDestroyed).length;
    
    if (activeWordCount <= 2 && pulsarPhase !== 2) {
        // Phase 2: Red pulsar for ≤2 words
        pulsarPhase = 2;
        pulsarCycleTime = 500; // 0.5 seconds
        pulsarTimer = 0;
        pulsarCycleCount = 0;
        
        if (!pulsarElement) {
            createPulsar();
        }
        pulsarElement.className = "pulsar phase2";
        createPulsarWave("phase2");
        
    } else if (activeWordCount <= 4 && activeWordCount > 2 && pulsarPhase !== 1) {
        // Phase 1: Blue pulsar for ≤4 words (but >2)
        pulsarPhase = 1;
        pulsarCycleTime = 1000; // 1 second
        pulsarTimer = 0;
        pulsarCycleCount = 0;
        
        if (!pulsarElement) {
            createPulsar();
        }
        pulsarElement.className = "pulsar phase1";
        createPulsarWave("phase1");
        
    } else if (activeWordCount > 4 && pulsarPhase !== 0) {
        // Deactivate pulsar
        pulsarPhase = 0;
        pulsarActive = false;
        if (pulsarElement) {
            pulsarElement.remove();
            pulsarElement = null;
        }
    }
}

function applyPulsarAttraction(deltaTime) {
    if (pulsarPhase === 0 || !pulsarActive) return;
    
    const centerX = containerWidth / 2;
    const centerY = containerHeight / 2;
    const baseForce = pulsarPhase === 1 ? 0.3 : 0.6; // Stronger in phase 2
    const timeMultiplier = Math.min(1 + (pulsarCycleCount * 0.1), 2.5); // Increase over time
    
    floatingTexts.forEach(text => {
        if (text.isDestroyed) return;
        
        const dx = centerX - text.x;
        const dy = centerY - text.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 5) { // Avoid division by zero and jitter at center
            const force = (baseForce * timeMultiplier) / (distance * 0.01);
            const forceX = (dx / distance) * force;
            const forceY = (dy / distance) * force;
            
            text.vx += forceX * deltaTime * 0.001;
            text.vy += forceY * deltaTime * 0.001;
        }
    });
}

function createPulsarWave(phase) {
    const wave = document.createElement("div");
    wave.className = "pulsar-wave " + phase;
    wave.style.left = (containerWidth / 2) + "px";
    wave.style.top = (containerHeight / 2) + "px";
    document.body.appendChild(wave);
    
    // Remove the wave after animation completes
    setTimeout(() => {
        if (wave.parentNode) {
            wave.remove();
        }
    }, phase === "phase1" ? 1500 : 1000);
}

function resetPulsar() {
    pulsarPhase = 0;
    pulsarTimer = 0;
    pulsarCycleCount = 0;
    pulsarActive = false;
    
    if (pulsarElement) {
        pulsarElement.remove();
        pulsarElement = null;
    }
    
    // Remove any remaining waves
    document.querySelectorAll(".pulsar-wave").forEach(wave => wave.remove());
}

document.addEventListener('DOMContentLoaded', async function() {
    console.log('🌟 DOMContentLoaded event fired');
    console.log('📦 CONFIG available:', typeof CONFIG !== 'undefined');
    console.log('🎮 showInfoOverlay function available:', typeof showInfoOverlay !== 'undefined');
    
    try {
        // Show info overlay on page load
        console.log('⏰ Starting initialization...');
        showInfoOverlay();
    } catch (error) {
        console.error('❌ Error during initialization:', error);
    }
    
    function animate(currentTime) {
        // Performance-Optimierung: Berechne echte deltaTime mit adaptiver Grenze
        if (!animate.lastTime) animate.lastTime = currentTime;
        const deltaTime = Math.min(currentTime - animate.lastTime, 25); // Max 25ms (40 FPS minimum, 60 FPS angestrebt)
        animate.lastTime = currentTime;
        
        // NEU: Überprüfe, ob das Spiel pausiert ist
        if (isPaused) { 
            animate.lastTime = currentTime; // Reset time when paused
            requestAnimationFrame(animate); 
            return; 
        }

        // Update des ersten Raumschiffs
        if (spaceshipController && gameStarted) {
            spaceshipController.update();
        }
        
        // Update des zweiten Raumschiffs, falls es existiert
        if (secondSpaceshipController && gameStarted) {
            secondSpaceshipController.update();
        }
        
        floatingTexts.forEach(text => {
            if (!text.isDestroyed) {
                text.update();
            }
        });
        
        // Update der zielsuchenden Projektile mit echter deltaTime
        if (gameStarted && activeProjectiles.length > 0) {
            for (let i = activeProjectiles.length - 1; i >= 0; i--) {
                const projectile = activeProjectiles[i];
                if (!projectile.update(deltaTime)) {
                    activeProjectiles.splice(i, 1);
                }
            }
        }
        
        // Alle anderen Spiel-Updates
        if (gameStarted) {
            updateBeacons();
            updateFloatingMines();
            updatePulsarPhase();
            checkForSecondHunter(); // Prüft, ob der zweite Jäger gerufen werden soll

            if (pulsarPhase > 0) {
                pulsarTimer += deltaTime;
                if (pulsarTimer >= pulsarCycleTime) {
                    pulsarActive = !pulsarActive;
                    pulsarTimer = 0;
                    
                    if (pulsarActive) {
                        pulsarCycleCount++;
                        createPulsarWave(pulsarPhase === 1 ? "phase1" : "phase2");
                    }
                }
                if (pulsarActive) {
                    applyPulsarAttraction(deltaTime);
                }
            }
        }
        
        // NEU: Die zentrale Game-Over-Prüfung in jedem Frame
        checkForGameEnd();
        
        requestAnimationFrame(animate);
    }
    
    window.addEventListener('resize', () => {
        containerWidth = window.innerWidth;
        containerHeight = window.innerHeight;
        floatingTexts.forEach(text => {
            if (!text.isDestroyed) {
                text.resize();
            }
        });
    });

    // Logik zum Aktivieren des Schildes
    document.addEventListener('keydown', function(e) {
        if (e.code === 'Space' && gameStarted) {
            e.preventDefault();

            if (shieldCount > 0) {
                let targetedWord = null;
                let threatSource = 'unbekannt';

                // Priorität 1: Aktive Ultraschuss-Projektile
                if (activeProjectiles.length > 0) {
                    const activeHomingProjectile = activeProjectiles[0];
                    if (activeHomingProjectile && activeHomingProjectile.target && !activeHomingProjectile.target.isDestroyed) {
                        targetedWord = activeHomingProjectile.target;
                        threatSource = 'Ultraschuss-Rakete';
                    }
                }
                
                // Priorität 2: Aktive Minen-Targeting
                if (!targetedWord) {
                    for (let mine of floatingMines) {
                        if (mine.isTargeting && mine.targetingWord) {
                            targetedWord = mine.targetingWord;
                            threatSource = 'Mobile Mine';
                            break; 
                        }
                    }
                    if (!targetedWord) {
                        for (let beacon of spaceBeacons) {
                            if (beacon.isTargeting && beacon.targetingWord) {
                                targetedWord = beacon.targetingWord;
                                threatSource = 'Statische Mine';
                                break;
                            }
                        }
                    }
                }
                
                // Priorität 3: Raumschiff-Targeting (während Radar oder normaler Schuss unterwegs)
                if (!targetedWord && spaceshipController && spaceshipController.targetingWord) {
                    targetedWord = spaceshipController.targetingWord;
                    threatSource = 'Raumschiff (Radar/Zielung)';
                }
                
                // NEU - Priorität 4: Auch zweiter Jäger berücksichtigen
                if (!targetedWord && secondSpaceshipController && secondSpaceshipController.targetingWord) {
                    targetedWord = secondSpaceshipController.targetingWord;
                    threatSource = 'Zweiter Jäger (Radar/Zielung)';
                }

                if (targetedWord) {
                    if (activateShield(targetedWord)) {
                        // NEU: Wir prüfen, ob die Schilde vorher voll waren.
                        if (shieldCount === maxShields) {
                            lastShieldTime = Date.now(); // Starte den Cooldown-Timer JETZT.
                        }
                        shieldCount--; // Verbrauche den Schild.
                        console.log(`Schild aktiviert auf "${targetedWord.element.textContent}" gegen ${threatSource}. Verbleibend: ${shieldCount}`);
                    }
                } else {
                    console.log('Schild-Einsatz nicht möglich: Keine aktive Bedrohung erkannt.');
                }
            } else {
                console.log('Keine Schilde verfügbar.');
            }
        }
    });
    
    animate();
    
});

// Am Ende deines Scripts, im DOMContentLoaded-Listener, hinzufügen
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Spieler hat den Tab verlassen -> Pausieren
        if (gameStarted && !isPaused) {
            isPaused = true;
            pauseStartTime = Date.now();
            console.log('Spiel pausiert (Tab verlassen)');
        }
    } else {
        // Spieler ist zum Tab zurückgekehrt -> Fortsetzen
        if (gameStarted && isPaused) {
            const pauseDuration = Date.now() - pauseStartTime;
            // Wichtig: Korrigiere die Startzeit, damit der Timer nicht springt
            gameStartTime += pauseDuration; 
            // Korrigiere auch den letzten Schild-Timer
            if(lastShieldTime > 0) {
                lastShieldTime += pauseDuration;
            }
        
            isPaused = false;
            console.log(`Spiel fortgesetzt nach ${Math.round(pauseDuration / 1000)}s Pause.`);
        }
    }
});

// ========================================
// GLOBALE FUNKTIONEN FÜR HTML ONCLICK
// ========================================
// Diese Funktionen müssen global verfügbar sein für onclick-Handler in HTML

window.validateAndStartGame = validateAndStartGame;
window.switchToGameSetup = switchToGameSetup;
window.showLocalLeaderboard = showLocalLeaderboard;
window.refreshStartScreenLeaderboard = refreshStartScreenLeaderboard;
window.restartGame = restartGame;

