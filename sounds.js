// Fallback audio system with multiple approaches
class FallbackAudioSystem {
    constructor() {
        this.audioEnabled = true;
        this.audioContext = null;
        this.fallbackAudio = null;
        this.backgroundMusic = null;
        this.musicEnabled = true;
        this.initAudio();
    }

    initAudio() {
        // Try Web Audio API first
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('Web Audio API initialized successfully');
            this.initBackgroundMusic();
        } catch (e) {
            console.log('Web Audio API failed, trying fallback:', e);
            this.createFallbackAudio();
        }
    }

    initBackgroundMusic() {
        if (!this.audioContext) return;
        
        // Create background music using oscillators and filters
        this.backgroundMusic = {
            bass: this.audioContext.createOscillator(),
            pad: this.audioContext.createOscillator(),
            lead: this.audioContext.createOscillator(),
            bassGain: this.audioContext.createGain(),
            padGain: this.audioContext.createGain(),
            leadGain: this.audioContext.createGain(),
            filter: this.audioContext.createBiquadFilter(),
            delay: this.audioContext.createDelay(),
            feedback: this.audioContext.createGain()
        };

        // Set up bass (low frequency sawtooth)
        this.backgroundMusic.bass.type = 'sawtooth';
        this.backgroundMusic.bass.frequency.setValueAtTime(55, this.audioContext.currentTime);
        this.backgroundMusic.bassGain.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        
        // Set up pad (mid frequency sine with modulation)
        this.backgroundMusic.pad.type = 'sine';
        this.backgroundMusic.pad.frequency.setValueAtTime(220, this.audioContext.currentTime);
        this.backgroundMusic.padGain.gain.setValueAtTime(0.05, this.audioContext.currentTime);
        
        // Set up lead (high frequency triangle)
        this.backgroundMusic.lead.type = 'triangle';
        this.backgroundMusic.lead.frequency.setValueAtTime(440, this.audioContext.currentTime);
        this.backgroundMusic.leadGain.gain.setValueAtTime(0.03, this.audioContext.currentTime);

        // Set up filter for spacey effect
        this.backgroundMusic.filter.type = 'lowpass';
        this.backgroundMusic.filter.frequency.setValueAtTime(800, this.audioContext.currentTime);
        this.backgroundMusic.filter.Q.setValueAtTime(0.5, this.audioContext.currentTime);

        // Set up delay for space effect
        this.backgroundMusic.delay.delayTime.setValueAtTime(0.3, this.audioContext.currentTime);
        this.backgroundMusic.feedback.gain.setValueAtTime(0.3, this.audioContext.currentTime);

        // Connect the audio chain
        this.backgroundMusic.bass.connect(this.backgroundMusic.bassGain);
        this.backgroundMusic.pad.connect(this.backgroundMusic.padGain);
        this.backgroundMusic.lead.connect(this.backgroundMusic.leadGain);
        
        this.backgroundMusic.bassGain.connect(this.backgroundMusic.filter);
        this.backgroundMusic.padGain.connect(this.backgroundMusic.filter);
        this.backgroundMusic.leadGain.connect(this.backgroundMusic.filter);
        
        this.backgroundMusic.filter.connect(this.backgroundMusic.delay);
        this.backgroundMusic.delay.connect(this.backgroundMusic.feedback);
        this.backgroundMusic.feedback.connect(this.backgroundMusic.delay);
        this.backgroundMusic.delay.connect(this.audioContext.destination);
        this.backgroundMusic.filter.connect(this.audioContext.destination);

        console.log('Background music initialized');
    }

    startBackgroundMusic() {
        if (!this.backgroundMusic || !this.musicEnabled) return;
        
        try {
            this.backgroundMusic.bass.start();
            this.backgroundMusic.pad.start();
            this.backgroundMusic.lead.start();
            
            // Add some modulation for space jazz feel
            this.modulateFrequencies();
            
            console.log('Background music started');
        } catch (e) {
            console.log('Failed to start background music:', e);
        }
    }

    stopBackgroundMusic() {
        if (!this.backgroundMusic) return;
        
        try {
            this.backgroundMusic.bass.stop();
            this.backgroundMusic.pad.stop();
            this.backgroundMusic.lead.stop();
            console.log('Background music stopped');
        } catch (e) {
            console.log('Failed to stop background music:', e);
        }
    }

    modulateFrequencies() {
        if (!this.backgroundMusic || !this.audioContext) return;
        
        // Bass modulation (slow)
        this.backgroundMusic.bass.frequency.exponentialRampToValueAtTime(
            55 * Math.pow(2, Math.sin(this.audioContext.currentTime * 0.1) * 0.1),
            this.audioContext.currentTime + 2
        );
        
        // Pad modulation (medium)
        this.backgroundMusic.pad.frequency.exponentialRampToValueAtTime(
            220 * Math.pow(2, Math.sin(this.audioContext.currentTime * 0.3) * 0.2),
            this.audioContext.currentTime + 1
        );
        
        // Lead modulation (fast)
        this.backgroundMusic.lead.frequency.exponentialRampToValueAtTime(
            440 * Math.pow(2, Math.sin(this.audioContext.currentTime * 0.5) * 0.3),
            this.audioContext.currentTime + 0.5
        );
        
        // Filter modulation
        this.backgroundMusic.filter.frequency.exponentialRampToValueAtTime(
            800 + Math.sin(this.audioContext.currentTime * 0.2) * 200,
            this.audioContext.currentTime + 1
        );
        
        // Schedule next modulation
        setTimeout(() => this.modulateFrequencies(), 1000);
    }

    toggleBackgroundMusic() {
        this.musicEnabled = !this.musicEnabled;
        if (this.musicEnabled) {
            this.startBackgroundMusic();
        } else {
            this.stopBackgroundMusic();
        }
        return this.musicEnabled;
    }

    createFallbackAudio() {
        // Create a simple audio element as fallback
        this.fallbackAudio = new Audio();
        this.fallbackAudio.volume = 0.3;
        console.log('Fallback audio system created');
    }

    playBeep() {
        if (!this.audioEnabled) return;

        if (this.audioContext && this.audioContext.state === 'running') {
            // Use Web Audio API
            try {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
                oscillator.type = 'sine';
                
                gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
                
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 0.1);
            } catch (e) {
                console.log('Web Audio failed, using fallback:', e);
                this.playFallbackBeep();
            }
        } else if (this.fallbackAudio) {
            // Use fallback audio
            this.playFallbackBeep();
        } else {
            // Last resort: try to create audio context on demand
            try {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                this.playBeep();
            } catch (e) {
                console.log('All audio methods failed:', e);
            }
        }
    }

    playFallbackBeep() {
        if (this.fallbackAudio) {
            // Create a simple beep using audio element
            const audio = new Audio();
            audio.volume = 0.3;
            
            // Create a simple beep sound using data URL
            const sampleRate = 44100;
            const duration = 0.1;
            const frequency = 800;
            const samples = Math.floor(sampleRate * duration);
            
            // Generate simple sine wave
            const audioData = new Float32Array(samples);
            for (let i = 0; i < samples; i++) {
                audioData[i] = Math.sin(2 * Math.PI * frequency * i / sampleRate) * 0.3;
            }
            
            // Convert to audio buffer and play
            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const buffer = audioContext.createBuffer(1, samples, sampleRate);
                buffer.getChannelData(0).set(audioData);
                
                const source = audioContext.createBufferSource();
                source.buffer = buffer;
                source.connect(audioContext.destination);
                source.start();
            } catch (e) {
                console.log('Fallback audio failed:', e);
            }
        }
    }

    playClick() {
        this.playBeep();
    }

    playSuccess() {
        this.playBeep();
        setTimeout(() => this.playBeep(), 100);
        setTimeout(() => this.playBeep(), 200);
    }

    playError() {
        this.playBeep();
        setTimeout(() => this.playBeep(), 150);
    }

    playLevelComplete() {
        this.playBeep();
        setTimeout(() => this.playBeep(), 150);
        setTimeout(() => this.playBeep(), 300);
        setTimeout(() => this.playBeep(), 450);
    }

    playGameOver() {
        this.playBeep();
        setTimeout(() => this.playBeep(), 200);
        setTimeout(() => this.playBeep(), 400);
    }

    playPop() {
        this.playBeep();
    }

    enable() {
        this.audioEnabled = true;
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    disable() {
        this.audioEnabled = false;
    }
}

// Create global sound system
const soundSystem = new FallbackAudioSystem();
window.soundSystem = soundSystem;

// Export sound interface
export const sounds = {
    button_click: {
        play: () => soundSystem.playClick()
    },
    success: {
        play: () => soundSystem.playSuccess()
    },
    error: {
        play: () => soundSystem.playError()
    },
    level_complete: {
        play: () => soundSystem.playLevelComplete()
    },
    game_over: {
        play: () => soundSystem.playGameOver()
    },
    place: {
        play: () => soundSystem.playPop()
    }
};

// Initialize audio on user interaction
export function initAudio() {
    soundSystem.enable();
    // Start background music after user interaction
    setTimeout(() => {
        soundSystem.startBackgroundMusic();
    }, 1000);
    console.log('Fallback audio system initialized');
}

// Add event listeners to initialize audio
document.addEventListener('click', initAudio, { once: true });
document.addEventListener('keydown', initAudio, { once: true });
document.addEventListener('touchstart', initAudio, { once: true });
document.addEventListener('mousedown', initAudio, { once: true });

// Also try to initialize on page load
window.addEventListener('load', () => {
    setTimeout(initAudio, 100);
});

