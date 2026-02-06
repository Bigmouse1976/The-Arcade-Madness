/**
 * The Arcade Madness - Audio Manager
 * Handles sound effects and music
 */

class AudioManager {
    constructor() {
        this.sounds = {};
        this.music = null;
        this.isMuted = false;
        this.volume = 1.0;
    }

    loadSound(name, url) {
        const audio = new Audio(url);
        audio.volume = this.volume;
        this.sounds[name] = audio;
    }

    playSound(name) {
        if (this.isMuted || !this.sounds[name]) return;
        
        const sound = this.sounds[name].cloneNode();
        sound.volume = this.volume;
        sound.play().catch(err => console.log('Audio play failed:', err));
    }

    playMusic(url, loop = true) {
        if (this.music) {
            this.music.pause();
        }

        this.music = new Audio(url);
        this.music.loop = loop;
        this.music.volume = this.volume * 0.5;
        
        if (!this.isMuted) {
            this.music.play().catch(err => console.log('Music play failed:', err));
        }
    }

    stopMusic() {
        if (this.music) {
            this.music.pause();
            this.music.currentTime = 0;
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        
        if (this.music) {
            this.music.muted = this.isMuted;
        }

        return this.isMuted;
    }

    setVolume(level) {
        this.volume = Math.max(0, Math.min(1, level));
        
        if (this.music) {
            this.music.volume = this.volume * 0.5;
        }

        Object.values(this.sounds).forEach(sound => {
            sound.volume = this.volume;
        });
    }
}
