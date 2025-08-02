// ========================================
// WORD DEFENDER - SECURITY UTILITIES
// ========================================
// Einfache Schutzmaßnahmen gegen localStorage-Manipulation

export class SecureStorage {
    
    /**
     * Erstellt einen einfachen Hash für Datenintegrität
     * @param {string} data - Die zu hashenden Daten
     * @returns {string} Einfacher Hash
     */
    static createSimpleHash(data) {
        let hash = 0;
        const str = JSON.stringify(data) + 'worddefender_salt_2025';
        
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        
        return Math.abs(hash).toString(36);
    }
    
    /**
     * Sicheres Speichern von Highscores mit Integritätsprüfung
     * @param {Array} scores - Array der Highscores
     */
    static saveSecureHighscores(scores) {
        // Entferne verdächtige Scores (zu hoch, unmögliche Zeiten)
        const sanitizedScores = scores.filter(score => {
            return score.score <= 50000 &&  // Maximal 50.000 Punkte
                   score.survivalTime <= 7200 && // Maximal 2 Stunden
                   score.survivalTime >= 10 &&   // Mindestens 10 Sekunden
                   score.name.length <= 20 &&    // Maximal 20 Zeichen Name
                   score.name.length >= 1;       // Mindestens 1 Zeichen
        });
        
        const data = {
            scores: sanitizedScores,
            timestamp: Date.now(),
            version: '1.0'
        };
        
        const hash = this.createSimpleHash(data);
        const secureData = {
            data: data,
            integrity: hash
        };
        
        localStorage.setItem('wordDefenderHighscores', JSON.stringify(secureData));
    }
    
    /**
     * Sicheres Laden von Highscores mit Integritätsprüfung
     * @returns {Array} Array der Highscores oder leeres Array bei Manipulation
     */
    static loadSecureHighscores() {
        try {
            const stored = localStorage.getItem('wordDefenderHighscores');
            if (!stored) return [];
            
            // Versuche als neue sichere Struktur zu laden
            try {
                const secureData = JSON.parse(stored);
                
                if (secureData.data && secureData.integrity) {
                    // Prüfe Integrität
                    const expectedHash = this.createSimpleHash(secureData.data);
                    
                    if (expectedHash === secureData.integrity) {
                        // Daten sind integer - verwende sie
                        return secureData.data.scores || [];
                    } else {
                        console.warn('🚨 Highscore-Manipulation detected! Resetting scores.');
                        this.saveSecureHighscores([]); // Reset bei Manipulation
                        return [];
                    }
                }
            } catch (e) {
                // Fallback: Versuche als alte Struktur zu laden
                const oldScores = JSON.parse(stored);
                if (Array.isArray(oldScores)) {
                    console.log('📦 Converting old highscores to secure format');
                    this.saveSecureHighscores(oldScores);
                    return oldScores;
                }
            }
            
            return [];
        } catch (error) {
            console.warn('Error loading highscores:', error);
            return [];
        }
    }
    
    /**
     * Validiert einen einzelnen Score auf Plausibilität
     * @param {Object} score - Der zu validierende Score
     * @returns {boolean} True wenn plausibel
     */
    static validateScore(score) {
        const maxPossibleScore = 50000; // Angepasst an dein Spiel
        const maxSurvivalTime = 7200;   // 2 Stunden
        const minSurvivalTime = 10;     // 10 Sekunden
        
        return score.score <= maxPossibleScore &&
               score.survivalTime <= maxSurvivalTime &&
               score.survivalTime >= minSurvivalTime &&
               typeof score.name === 'string' &&
               score.name.length >= 1 &&
               score.name.length <= 20;
    }
    
    /**
     * Anti-Cheat: Prüft ob ein Score zu gut ist, um wahr zu sein
     * @param {Object} newScore - Der neue Score
     * @param {Array} existingScores - Bestehende Scores
     * @returns {boolean} True wenn verdächtig
     */
    static isSuspiciousScore(newScore, existingScores) {
        // Prüfe auf extremer Verbesserung
        if (existingScores.length > 0) {
            const bestExisting = Math.max(...existingScores.map(s => s.score));
            const improvement = newScore.score - bestExisting;
            
            // Mehr als 10x Verbesserung ist verdächtig
            if (improvement > bestExisting * 10) {
                return true;
            }
        }
        
        // Prüfe Score-zu-Zeit-Verhältnis
        const scorePerSecond = newScore.score / newScore.survivalTime;
        if (scorePerSecond > 100) { // Mehr als 100 Punkte pro Sekunde ist verdächtig
            return true;
        }
        
        return false;
    }
}

export default SecureStorage;
