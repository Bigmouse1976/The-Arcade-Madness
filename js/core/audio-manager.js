/**
 * The Arcade Madness - Audio Manager
 * Handles sound effects, music, and audio playback
 */

class AudioManager {
    constructor(options = {}) {
        this.sounds = new Map();
        this.music = null;
        this.currentMusicName = null;
        
        // Settings
        this.isMuted = options.muted || false;
        this.masterVolume = options.volume || 1.0;
        this.sfxVolume = options.sfxVolume || 1.0;
        this.musicVolume = options.musicVolume || 0.5;
        
        // Audio context for advanced features (optional)
        this.audioContext = null;
        this.useWebAudio = options.useWebAudio || false;
        
        if (this.useWebAudio && (window.AudioContext || window.webkitAudioContext)) {
            this.initWebAudio();
        }
        
        // Preload queue
        this.loadingQueue = [];
        this.loadedCount = 0;
        
        console.log('🔊 AudioManager initialized');
    }
    
    // ============================================
    // WEB AUDIO API
    // ============================================
    
    initWebAudio() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
            this.gainNode = this.audioContext.createGain();
            this.gainNode.connect(this.audioContext.destination);
            this.gainNode.gain.value = this.masterVolume;
            console.log('🔊 Web Audio API initialized');
        } catch (e) {
            console.warn('Web Audio API not supported:', e);
            this.useWebAudio = false;
        }
    }
    
    // ============================================
    // LOADING
    // ============================================
    
    /**
     * Load a sound effect
     * @param {string} name - Sound identifier
     * @param {string} url - Path to audio file
     * @returns {Promise}
     */
    loadSound(name, url) {
        return new Promise((resolve, reject) => {
            if (this.useWebAudio && this.audioContext) {
                // Load with Web Audio API
                fetch(url)
                    .then(response => response.arrayBuffer())
                    .then(arrayBuffer => this.audioContext.decodeAudioData(arrayBuffer))
                    .then(audioBuffer => {
                        this.sounds.set(name, {
                            buffer: audioBuffer,
                            type: 'webaudio'
                        });
                        console.log(`✅ Loaded sound: ${name}`);
                        resolve();
                    })
                    .catch(error => {
                        console.error(`❌ Failed to load sound: ${name}`, error);
                        reject(error);
                    });
            } else {
                // Load with HTML5 Audio
                const audio = new Audio(url);
                audio.preload = 'auto';
                
                audio.addEventListener('canplaythrough', () => {
                    this.sounds.set(name, {
                        audio: audio,
                        type: 'html5'
                    });
                    console.log(`✅ Loaded sound: ${name}`);
                    resolve();
                }, { once: true });
                
                audio.addEventListener('error', (e) => {
                    console.error(`❌ Failed to load sound: ${name}`, e);
                    reject(e);
                });
                
                audio.load();
            }
        });
    }
    
    /**
     * Load multiple sounds
     * @param {Object} soundMap - {name: url, ...}
     * @returns {Promise}
     */
    loadSounds(soundMap) {
        const promises = Object.entries(soundMap).map(([name, url]) => 
            this.loadSound(name, url)
        );
        return Promise.all(promises);
    }
    
    /**
     * Load background music
     * @param {string} name - Music identifier
     * @param {string} url - Path to audio file
     * @returns {Promise}
     */
    loadMusic(name, url) {
        return new Promise((resolve, reject) => {
            const audio = new Audio(url);
            audio.preload = 'auto';
            audio.loop = true;
            
            audio.addEventListener('canplaythrough', () => {
                this.sounds.set(name, {
                    audio: audio,
                    type: 'music'
                });
                console.log(`✅ Loaded music: ${name}`);
                resolve();
            }, { once: true });
            
            audio.addEventListener('error', (e) => {
                console.error(`❌ Failed to load music: ${name}`, e);
                reject(e);
            });
            
            audio.load();
        });
    }
    
    // ============================================
    // PLAYBACK - SOUND EFFECTS
    // ============================================
    
    /**
     * Play a sound effect
     * @param {string} name - Sound identifier
     * @param {Object} options - {volume, rate, loop}
     */
    playSound(name, options = {}) {
        if (this.isMuted || !this.sounds.has(name)) return;
        
        const sound = this.sounds.get(name);
        const volume = (options.volume || 1.0) * this.sfxVolume * this.masterVolume;
        const rate = options.rate || 1.0;
        const loop = options.loop || false;
        
        if (sound.type === 'webaudio' && this.audioContext) {
            this.playWebAudioSound(sound.buffer, volume, rate, loop);
        } else if (sound.type === 'html5') {
            this.playHTML5Sound(sound.audio, volume, rate, loop);
        }
    }
    
    playWebAudioSound(buffer, volume, rate, loop) {
        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        
        source.buffer = buffer;
        source.playbackRate.value = rate;
        source.loop = loop;
        
        gainNode.gain.value = volume;
        
        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        source.start(0);
        
        return source; // Return for potential stopping
    }
    
    playHTML5Sound(audio, volume, rate, loop) {
        // Clone the audio to allow multiple simultaneous plays
        const sound = audio.cloneNode();
        sound.volume = Math.min(1, Math.max(0, volume));
        sound.playbackRate = rate;
        sound.loop = loop;
        
        // Clean up after playing
        if (!loop) {
            sound.addEventListener('ended', () => {
                sound.remove();
            });
        }
        
        sound.play().catch(err => {
            console.warn('Audio play failed:', err);
        });
        
        return sound;
    }
    
    /**
     * Stop a specific sound (HTML5 only)
     */
    stopSound(name) {
        if (!this.sounds.has(name)) return;
        
        const sound = this.sounds.get(name);
        if (sound.type === 'html5' && sound.audio) {
            sound.audio.pause();
            sound.audio.currentTime = 0;
        }
    }
    
    // ============================================
    // PLAYBACK - MUSIC
    // ============================================
    
    /**
     * Play background music
     * @param {string} name - Music identifier
     * @param {boolean} fadeIn - Fade in duration in ms
     */
    playMusic(name, fadeIn = 0) {
        if (!this.sounds.has(name)) {
            console.warn(`Music not found: ${name}`);
            return;
        }
        
        // Stop current music
        if (this.music && this.currentMusicName !== name) {
            this.stopMusic();
        }
        
        const musicData = this.sounds.get(name);
        this.music = musicData.audio;
        this.currentMusicName = name;
        
        if (!this.music) return;
        
        this.music.loop = true;
        this.music.volume = this.isMuted ? 0 : this.musicVolume * this.masterVolume;
        
        if (fadeIn > 0 && !this.isMuted) {
            this.fadeInMusic(fadeIn);
        } else {
            this.music.play().catch(err => {
                console.warn('Music play failed:', err);
            });
        }
    }
    
    /**
     * Stop background music
     * @param {number} fadeOut - Fade out duration in ms
     */
    stopMusic(fadeOut = 0) {
        if (!this.music) return;
        
        if (fadeOut > 0) {
            this.fadeOutMusic(fadeOut, () => {
                this.music.pause();
                this.music.currentTime = 0;
                this.music = null;
                this.currentMusicName = null;
            });
        } else {
            this.music.pause();
            this.music.currentTime = 0;
            this.music = null;
            this.currentMusicName = null;
        }
    }
    
    /**
     * Pause music
     */
    pauseMusic() {
        if (this.music && !this.music.paused) {
            this.music.pause();
        }
    }
    
    /**
     * Resume music
     */
    resumeMusic() {
        if (this.music && this.music.paused) {
            this.music.play().catch(err => {
                console.warn('Music resume failed:', err);
            });
        }
    }
    
    // ============================================
    // FADE EFFECTS
    // ============================================
    
    fadeInMusic(duration) {
        if (!this.music) return;
        
        const targetVolume = this.musicVolume * this.masterVolume;
        this.music.volume = 0;
        
        this.music.play().catch(err => {
            console.warn('Music play failed:', err);
        });
        
        const startTime = Date.now();
        const fadeInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            this.music.volume = progress * targetVolume;
            
            if (progress >= 1) {
                clearInterval(fadeInterval);
            }
        }, 50);
    }
    
    fadeOutMusic(duration, callback) {
        if (!this.music) return;
        
        const startVolume = this.music.volume;
        const startTime = Date.now();
        
        const fadeInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            this.music.volume = startVolume * (1 - progress);
            
            if (progress >= 1) {
                clearInterval(fadeInterval);
                if (callback) callback();
            }
        }, 50);
    }
    
    // ============================================
    // VOLUME CONTROL
    // ============================================
    
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        
        if (this.useWebAudio && this.gainNode) {
            this.gainNode.gain.value = this.masterVolume;
        }
        
        if (this.music) {
            this.music.volume = this.musicVolume * this.masterVolume;
        }
        
        console.log(`🔊 Master volume: ${(this.masterVolume * 100).toFixed(0)}%`);
    }
    
    setSFXVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        console.log(`🔊 SFX volume: ${(this.sfxVolume * 100).toFixed(0)}%`);
    }
    
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        
        if (this.music) {
            this.music.volume = this.musicVolume * this.masterVolume;
        }
        
        console.log(`🔊 Music volume: ${(this.musicVolume * 100).toFixed(0)}%`);
    }
    
    getMasterVolume() {
        return this.masterVolume;
    }
    
    getSFXVolume() {
        return this.sfxVolume;
    }
    
    getMusicVolume() {
        return this.musicVolume;
    }
    
    // ============================================
    // MUTE CONTROL
    // ============================================
    
    toggleMute() {
        this.isMuted = !this.isMuted;
        
        if (this.music) {
            this.music.volume = this.isMuted ? 0 : this.musicVolume * this.masterVolume;
        }
        
        console.log(`🔊 Audio ${this.isMuted ? 'muted' : 'unmuted'}`);
        return this.isMuted;
    }
    
    mute() {
        if (!this.isMuted) {
            this.toggleMute();
        }
    }
    
    unmute() {
        if (this.isMuted) {
            this.toggleMute();
        }
    }
    
    isMutedState() {
        return this.isMuted;
    }
    
    // ============================================
    // UTILITY
    // ============================================
    
    /**
     * Check if a sound is loaded
     */
    hasSound(name) {
        return this.sounds.has(name);
    }
    
    /**
     * Get loaded sound names
     */
    getSoundNames() {
        return Array.from(this.sounds.keys());
    }
    
    /**
     * Remove a sound from memory
     */
    unloadSound(name) {
        if (this.sounds.has(name)) {
            const sound = this.sounds.get(name);
            if (sound.audio) {
                sound.audio.pause();
                sound.audio.src = '';
            }
            this.sounds.delete(name);
            console.log(`🗑️ Unloaded sound: ${name}`);
        }
    }
    
    /**
     * Unload all sounds
     */
    unloadAll() {
        this.stopMusic();
        this.sounds.forEach((sound, name) => {
            if (sound.audio) {
                sound.audio.pause();
                sound.audio.src = '';
            }
        });
        this.sounds.clear();
        console.log('🗑️ Unloaded all sounds');
    }
    
    /**
     * Get current music name
     */
    getCurrentMusic() {
        return this.currentMusicName;
    }
    
    /**
     * Check if music is playing
     */
    isMusicPlaying() {
        return this.music && !this.music.paused;
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AudioManager;
}
