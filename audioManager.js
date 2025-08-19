// Audio Manager for Coffee Tapper Game
class AudioManager {
    constructor() {
        this.sounds = {};
        this.currentMusic = null;
        this.musicVolume = 0.7;
        this.sfxVolume = 0.8;
        this.isMuted = false;
        
        this.init();
    }
    
    init() {
        console.log('Audio Manager initializing...');
        // Load audio files
        this.loadSound('startScreenMusic', 'assets/audio/StartingScreenMusic.wav', true); // true for music
        
        // Load game sound effects
        this.loadSound('CoffeeServed', 'assets/audio/CoffeeServed.wav');
        this.loadSound('CoffeeCaptured', 'assets/audio/CupCaptured.wav'); // Fixed filename
        this.loadSound('CupMissed', 'assets/audio/CupMissed.wav');
        this.loadSound('MoneyDroppedOrCollected', 'assets/audio/MoneyDroppedOrCollected.wav');
    }
    
    loadSound(name, src, isMusic = false) {
        // Prevent duplicate loading
        if (this.sounds[name]) {
            console.log(`Sound ${name} already loaded, skipping`);
            return;
        }
        
        console.log(`Loading sound: ${name} from ${src}`);
        const audio = new Audio(src);
        audio.preload = 'auto';
        
        if (isMusic) {
            audio.loop = true;
            audio.volume = this.musicVolume;
            // Optimize for seamless looping
            audio.preservesPitch = false; // Allow browser optimizations
        } else {
            audio.volume = this.sfxVolume;
        }
        
        // Handle loading errors gracefully
        audio.addEventListener('error', (e) => {
            console.warn(`Failed to load audio: ${src}`, e);
        });
        
        audio.addEventListener('canplaythrough', () => {
            console.log(`Audio loaded successfully: ${name}`);
        });
        
        // Add event listener for loop debugging
        if (isMusic) {
            audio.addEventListener('ended', () => {
                console.log(`Music ended, should loop automatically: ${name}`);
            });
            
            audio.addEventListener('timeupdate', () => {
                // Log when we're close to the end to debug looping
                const timeLeft = audio.duration - audio.currentTime;
                if (timeLeft < 0.1 && timeLeft > 0.05) {
                    console.log(`Music approaching end, time left: ${timeLeft.toFixed(3)}s`);
                }
            });
        }
        
        this.sounds[name] = {
            audio: audio,
            isMusic: isMusic,
            src: src
        };
    }
    
    playMusic(name, fadeInDuration = 1000) {
        console.log(`Attempting to play music: ${name}, muted: ${this.isMuted}`);
        if (this.isMuted) {
            console.log('Music is muted, not playing');
            return;
        }
        
        const sound = this.sounds[name];
        if (!sound || !sound.isMusic) {
            console.warn(`Music not found or not marked as music: ${name}`);
            return;
        }
        
        console.log(`Music found, audio readyState: ${sound.audio.readyState}`);
        console.log(`Current music playing:`, this.currentMusic ? 'yes' : 'no');
        
        // Stop current music with fade out
        if (this.currentMusic && this.currentMusic !== sound.audio) {
            console.log('Stopping current music');
            this.stopMusic(500); // 500ms fade out
        }
        
        // If this music is already playing, don't restart it
        if (this.currentMusic === sound.audio && !sound.audio.paused) {
            console.log('Music already playing, not restarting');
            return;
        }
        
        this.currentMusic = sound.audio;
        sound.audio.currentTime = 0;
        
        console.log('Starting music playback...');
        
        // Fade in
        if (fadeInDuration > 0) {
            sound.audio.volume = 0;
            const playPromise = sound.audio.play();
            
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    console.log('Music started successfully, beginning fade in');
                    this.fadeIn(sound.audio, this.musicVolume, fadeInDuration);
                }).catch((error) => {
                    console.error('Audio play failed:', error);
                });
            }
        } else {
            sound.audio.volume = this.musicVolume;
            const playPromise = sound.audio.play();
            
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    console.log('Music started successfully (no fade)');
                }).catch((error) => {
                    console.error('Audio play failed:', error);
                });
            }
        }
    }
    
    stopMusic(fadeOutDuration = 1000) {
        if (!this.currentMusic) return;
        
        if (fadeOutDuration > 0) {
            this.fadeOut(this.currentMusic, fadeOutDuration, () => {
                this.currentMusic.pause();
                this.currentMusic.currentTime = 0;
                this.currentMusic = null;
            });
        } else {
            this.currentMusic.pause();
            this.currentMusic.currentTime = 0;
            this.currentMusic = null;
        }
    }
    
    pauseMusic() {
        if (this.currentMusic && !this.currentMusic.paused) {
            this.currentMusic.pause();
        }
    }
    
    resumeMusic() {
        if (this.currentMusic && this.currentMusic.paused) {
            const playPromise = this.currentMusic.play();
            if (playPromise !== undefined) {
                playPromise.catch((error) => {
                    console.warn('Audio resume failed:', error);
                });
            }
        }
    }
    
    playSound(name) {
        if (this.isMuted) return;
        
        const sound = this.sounds[name];
        if (!sound || sound.isMusic) {
            console.warn(`Sound effect not found or is music: ${name}`);
            return;
        }
        
        // Clone audio for overlapping sounds
        const audioClone = sound.audio.cloneNode();
        audioClone.volume = this.sfxVolume;
        
        const playPromise = audioClone.play();
        if (playPromise !== undefined) {
            playPromise.catch((error) => {
                console.warn('Sound effect play failed:', error);
            });
        }
    }
    
    fadeIn(audio, targetVolume, duration) {
        const startVolume = 0;
        const volumeStep = targetVolume / (duration / 50);
        let currentVolume = startVolume;
        
        const fadeInterval = setInterval(() => {
            currentVolume += volumeStep;
            if (currentVolume >= targetVolume) {
                audio.volume = targetVolume;
                clearInterval(fadeInterval);
            } else {
                audio.volume = currentVolume;
            }
        }, 50);
    }
    
    fadeOut(audio, duration, callback) {
        const startVolume = audio.volume;
        const volumeStep = startVolume / (duration / 50);
        let currentVolume = startVolume;
        
        const fadeInterval = setInterval(() => {
            currentVolume -= volumeStep;
            if (currentVolume <= 0) {
                audio.volume = 0;
                clearInterval(fadeInterval);
                if (callback) callback();
            } else {
                audio.volume = currentVolume;
            }
        }, 50);
    }
    
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        if (this.currentMusic) {
            this.currentMusic.volume = this.musicVolume;
        }
    }
    
    setSFXVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
    }
    
    toggleMute() {
        this.isMuted = !this.isMuted;
        
        if (this.isMuted) {
            this.pauseMusic();
        } else {
            this.resumeMusic();
        }
        
        return this.isMuted;
    }
    
    // Check if audio file exists and is loaded
    isLoaded(name) {
        const sound = this.sounds[name];
        return sound && sound.audio.readyState >= 2; // HAVE_CURRENT_DATA
    }
    
    // Get loading progress for a sound
    getLoadingProgress(name) {
        const sound = this.sounds[name];
        if (!sound) return 0;
        
        const buffered = sound.audio.buffered;
        if (buffered.length > 0) {
            return buffered.end(buffered.length - 1) / sound.audio.duration;
        }
        return 0;
    }
}

// Global audio manager instance
window.audioManager = new AudioManager();
