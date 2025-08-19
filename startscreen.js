// Start Screen Animation Controller
class StartScreenAnimations {
    constructor() {
        this.beverages = [];
        this.characters = [];
        this.steamElements = [];
        this.animationId = null;
        this.isRunning = false;
        
        // Animation containers
        this.beverageContainer = document.querySelector('.floating-beverages');
        this.characterContainer = document.querySelector('.bouncing-characters');
        this.steamContainer = document.querySelector('.steam-effects');
        
        console.log('Animation containers found:');
        console.log('Beverage container:', this.beverageContainer);
        console.log('Character container:', this.characterContainer);
        console.log('Steam container:', this.steamContainer);
        
        // Emoji arrays
        this.beverageEmojis = ['☕', '🥤', '🫖', '🧋', '🥛', '🍵'];
        this.characterEmojis = ['🤡', '🧑‍💼', '🧑‍🎓', '👩‍💼', '👨‍🍳', '🧑‍🎨'];
        this.steamEmoji = '💨';
        
        this.init();
    }
    
    init() {
        this.createFloatingBeverages();
        this.createBouncingCharacters();
        this.startAnimationLoop();
        this.startSteamEffects();
    }
    
    createFloatingBeverages() {
        const count = window.innerWidth > 600 ? 15 : 10; // Increased count for fuller screen
        
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                this.spawnBeverage();
            }, i * 500); // Stagger the initial spawn
        }
    }
    
    spawnBeverage() {
        const element = document.createElement('div');
        element.className = 'floating-element';
        element.textContent = this.beverageEmojis[Math.floor(Math.random() * this.beverageEmojis.length)];
        
        // Random position across the full screen
        const startX = Math.random() * (window.innerWidth - 100);
        // Use full screen height, avoiding just the very top and bottom edges
        const startY = 50 + Math.random() * (window.innerHeight - 200);
        
        element.style.left = startX + 'px';
        element.style.top = startY + 'px';
        
        // Random animation duration and type
        const duration = 3 + Math.random() * 4; // 3-7 seconds
        const animationType = Math.random() > 0.5 ? 'float' : 'floatSlow';
        
        // Add random scale for variety
        const scale = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
        element.style.transform = `scale(${scale})`;
        
        element.style.animation = `${animationType} ${duration}s ease-in-out infinite`;
        
        this.beverageContainer.appendChild(element);
        this.beverages.push(element);
        
        // Remove and recreate after animation cycle
        setTimeout(() => {
            if (element.parentNode && this.isRunning) {
                element.remove();
                const index = this.beverages.indexOf(element);
                if (index > -1) {
                    this.beverages.splice(index, 1);
                }
                // Respawn if still running
                if (this.isRunning) {
                    setTimeout(() => this.spawnBeverage(), Math.random() * 2000);
                }
            }
        }, duration * 1000);
    }
    
    createBouncingCharacters() {
        // Character animations disabled - keeping only drink animations
        console.log('Character animations disabled'); // Debug log
        return;
    }
    
    spawnCharacter() {
        // Character spawning disabled - keeping only drink animations
        console.log('Character spawning disabled'); // Debug log
        return;
    }
    
    startSteamEffects() {
        setInterval(() => {
            if (this.isRunning && this.beverages.length > 0) {
                // Add steam to random beverages
                const randomBeverage = this.beverages[Math.floor(Math.random() * this.beverages.length)];
                if (randomBeverage) {
                    this.createSteam(randomBeverage);
                }
            }
        }, 2000); // Every 2 seconds
    }
    
    createSteam(sourceElement) {
        const steam = document.createElement('div');
        steam.className = 'steam-element';
        steam.textContent = this.steamEmoji;
        
        const rect = sourceElement.getBoundingClientRect();
        steam.style.left = (rect.left + rect.width / 2) + 'px';
        steam.style.top = rect.top + 'px';
        
        steam.style.animation = 'steamRise 3s ease-out forwards';
        
        this.steamContainer.appendChild(steam);
        
        // Remove after animation
        setTimeout(() => {
            if (steam.parentNode) {
                steam.remove();
            }
        }, 3000);
    }
    
    startAnimationLoop() {
        this.isRunning = true;
        
        const animate = () => {
            if (this.isRunning) {
                // Update any additional animations here if needed
                this.animationId = requestAnimationFrame(animate);
            }
        };
        
        this.animationId = requestAnimationFrame(animate);
    }
    
    stop() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        // Clear all elements
        this.beverageContainer.innerHTML = '';
        this.characterContainer.innerHTML = '';
        this.steamContainer.innerHTML = '';
        
        this.beverages = [];
        this.characters = [];
        this.steamElements = [];
    }
    
    resume() {
        this.stop();
        setTimeout(() => {
            this.init();
        }, 100);
    }
}

// Screen Management System
class ScreenManager {
    constructor() {
        this.currentScreen = 'startScreen';
        this.screens = ['startScreen', 'gameScreen', 'storyScreen'];
        this.animations = null;
        this.gameInitialized = false;
        
        // Audio state
        this.musicStarted = false;
        
        // Keyboard navigation
        this.currentMenuIndex = 0;
        this.menuButtons = [];
        this.storyButtons = [];
        this.gameOverButtons = [];
        this.keyboardActive = false;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.setupKeyboardNavigation();
        this.showScreen('startScreen');
        this.animations = new StartScreenAnimations();
    }
    
    setupEventListeners() {
        // Start Game button
        document.getElementById('startGame').addEventListener('click', () => {
            this.startMusicIfNeeded();
            this.playSound('buttonClick');
            this.showScreen('gameScreen');
        });
        
        // Story Mode button
        document.getElementById('storyMode').addEventListener('click', () => {
            this.startMusicIfNeeded();
            this.playSound('buttonClick');
            this.showScreen('storyScreen');
        });
        
        // Exit Game button
        document.getElementById('exitGame').addEventListener('click', () => {
            this.startMusicIfNeeded();
            this.playSound('buttonClick');
            this.showExitConfirmation();
        });
        
        // Button hover sounds
        document.querySelectorAll('.menu-button').forEach(button => {
            button.addEventListener('mouseenter', () => {
                this.playSound('buttonHover');
                // Update keyboard navigation when mouse is used
                this.updateMenuIndexFromMouse(button);
            });
        });
    }
    
    setupKeyboardNavigation() {
        this.menuButtons = Array.from(document.querySelectorAll('#startScreen .menu-button'));
        this.storyButtons = Array.from(document.querySelectorAll('#storyScreen .menu-button'));
        this.gameOverButtons = Array.from(document.querySelectorAll('#gameOver .menu-button'));
        
        // Global keyboard event listener
        document.addEventListener('keydown', (e) => {
            if (this.currentScreen === 'startScreen') {
                this.handleStartScreenKeyboard(e);
            } else if (this.currentScreen === 'storyScreen') {
                this.handleStoryScreenKeyboard(e);
            } else if (this.isGameOverVisible()) {
                this.handleGameOverKeyboard(e);
            }
        });
        
        // Show keyboard hint initially
        this.showKeyboardHint();
        
        // Hide keyboard hint after mouse movement
        let mouseTimer;
        document.addEventListener('mousemove', () => {
            this.keyboardActive = false;
            this.hideKeyboardHint();
            clearTimeout(mouseTimer);
            mouseTimer = setTimeout(() => {
                if (!this.keyboardActive) {
                    this.showKeyboardHint();
                }
            }, 3000);
        });
    }
    
    startMusicIfNeeded() {
        if (!this.musicStarted && window.audioManager && this.currentScreen === 'startScreen') {
            console.log('Starting music after user interaction');
            this.musicStarted = true;
            window.audioManager.playMusic('startScreenMusic', 1500);
        }
    }
    
    handleStartScreenKeyboard(e) {
        // Start music on first keyboard interaction
        this.startMusicIfNeeded();
        
        switch(e.code) {
            case 'ArrowUp':
                e.preventDefault();
                this.navigateMenu(-1, this.menuButtons);
                this.keyboardActive = true;
                this.showKeyboardHint();
                break;
                
            case 'ArrowDown':
                e.preventDefault();
                this.navigateMenu(1, this.menuButtons);
                this.keyboardActive = true;
                this.showKeyboardHint();
                break;
                
            case 'Space':
            case 'Enter':
                e.preventDefault();
                this.activateCurrentMenuItem(this.menuButtons);
                this.keyboardActive = true;
                break;
                
            case 'ArrowLeft':
            case 'ArrowRight':
                // Optional: Could add horizontal navigation or other features
                e.preventDefault();
                break;
        }
    }
    
    handleStoryScreenKeyboard(e) {
        switch(e.code) {
            case 'Space':
            case 'Enter':
            case 'Escape':
                e.preventDefault();
                this.activateCurrentMenuItem(this.storyButtons);
                this.keyboardActive = true;
                break;
                
            case 'ArrowUp':
            case 'ArrowDown':
            case 'ArrowLeft':
            case 'ArrowRight':
                // No navigation needed for single button, but prevent default
                e.preventDefault();
                break;
        }
    }
    
    handleGameOverKeyboard(e) {
        switch(e.code) {
            case 'ArrowUp':
                e.preventDefault();
                this.navigateMenu(-1, this.gameOverButtons);
                this.keyboardActive = true;
                this.showKeyboardHint();
                break;
                
            case 'ArrowDown':
                e.preventDefault();
                this.navigateMenu(1, this.gameOverButtons);
                this.keyboardActive = true;
                this.showKeyboardHint();
                break;
                
            case 'Space':
            case 'Enter':
                e.preventDefault();
                this.activateCurrentMenuItem(this.gameOverButtons);
                this.keyboardActive = true;
                break;
                
            case 'ArrowLeft':
            case 'ArrowRight':
                e.preventDefault();
                break;
        }
    }
    
    isGameOverVisible() {
        const gameOverElement = document.getElementById('gameOver');
        return gameOverElement && gameOverElement.style.display !== 'none';
    }
    
    navigateMenu(direction, buttonArray) {
        // Remove focus from current button
        buttonArray[this.currentMenuIndex].classList.remove('focused');
        
        // Update index
        this.currentMenuIndex += direction;
        
        // Wrap around
        if (this.currentMenuIndex < 0) {
            this.currentMenuIndex = buttonArray.length - 1;
        } else if (this.currentMenuIndex >= buttonArray.length) {
            this.currentMenuIndex = 0;
        }
        
        // Add focus to new button
        buttonArray[this.currentMenuIndex].classList.add('focused');
        buttonArray[this.currentMenuIndex].focus();
        
        // Play navigation sound
        this.playSound('buttonHover');
    }
    
    activateCurrentMenuItem(buttonArray) {
        const currentButton = buttonArray[this.currentMenuIndex];
        
        // Visual feedback
        currentButton.classList.add('pressed');
        
        // Play click sound
        this.playSound('buttonClick');
        
        // Remove pressed state after animation
        setTimeout(() => {
            currentButton.classList.remove('pressed');
        }, 150);
        
        // Trigger button action
        setTimeout(() => {
            currentButton.click();
        }, 100);
    }
    
    updateMenuIndexFromMouse(button) {
        let buttonArray, index;
        
        // Determine which button array to use
        if (this.currentScreen === 'startScreen') {
            buttonArray = this.menuButtons;
            index = this.menuButtons.indexOf(button);
        } else if (this.currentScreen === 'storyScreen') {
            buttonArray = this.storyButtons;
            index = this.storyButtons.indexOf(button);
        } else if (this.isGameOverVisible()) {
            buttonArray = this.gameOverButtons;
            index = this.gameOverButtons.indexOf(button);
        }
        
        if (index !== -1 && buttonArray) {
            // Remove focus from current button
            if (buttonArray[this.currentMenuIndex]) {
                buttonArray[this.currentMenuIndex].classList.remove('focused');
            }
            
            // Update index and add focus
            this.currentMenuIndex = index;
            buttonArray[this.currentMenuIndex].classList.add('focused');
        }
    }
    
    showKeyboardHint() {
        const hint = document.getElementById('keyboardHint');
        if (hint) {
            hint.classList.remove('hide');
            hint.classList.add('show');
        }
    }
    
    hideKeyboardHint() {
        const hint = document.getElementById('keyboardHint');
        if (hint) {
            hint.classList.remove('show');
            hint.classList.add('hide');
        }
    }
    
    showScreen(screenId) {
        // Hide all screens
        this.screens.forEach(id => {
            const screen = document.getElementById(id);
            if (screen) {
                screen.classList.remove('active');
            }
        });
        
        // Show target screen
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
            this.currentScreen = screenId;
            
            // Handle screen-specific logic
            this.handleScreenTransition(screenId);
        }
    }
    
    handleScreenTransition(screenId) {
        switch (screenId) {
            case 'startScreen':
                if (this.animations) {
                    this.animations.resume();
                }
                // Restore music volume if music was already started and we're returning from story mode
                if (this.musicStarted && window.audioManager && window.audioManager.currentMusic) {
                    window.audioManager.setMusicVolume(0.7);
                }
                // Reset keyboard navigation
                this.resetKeyboardNavigation('start');
                this.showKeyboardHint();
                break;
                
            case 'gameScreen':
                if (this.animations) {
                    this.animations.stop();
                }
                // Stop the start screen music with fade out
                if (window.audioManager) {
                    window.audioManager.stopMusic(1000);
                }
                this.hideKeyboardHint();
                if (!this.gameInitialized) {
                    this.initializeGame();
                } else {
                    // Reset and restart the game
                    if (typeof restartGame === 'function') {
                        restartGame();
                    }
                }
                break;
                
            case 'storyScreen':
                if (this.animations) {
                    this.animations.stop();
                }
                // Keep music playing but lower volume for story screen
                if (window.audioManager) {
                    window.audioManager.setMusicVolume(0.3);
                }
                this.resetKeyboardNavigation('story');
                this.showKeyboardHint();
                // Restart story scrolling animation
                this.restartStoryAnimation();
                break;
        }
    }
    
    resetKeyboardNavigation(screenType) {
        // Remove focus from all buttons
        this.menuButtons.forEach(button => {
            button.classList.remove('focused');
        });
        this.storyButtons.forEach(button => {
            button.classList.remove('focused');
        });
        this.gameOverButtons.forEach(button => {
            button.classList.remove('focused');
        });
        
        // Reset to first button and focus appropriate button array
        this.currentMenuIndex = 0;
        
        if (screenType === 'start') {
            this.menuButtons[this.currentMenuIndex].classList.add('focused');
        } else if (screenType === 'story') {
            this.storyButtons[this.currentMenuIndex].classList.add('focused');
        } else if (screenType === 'gameOver') {
            this.gameOverButtons[this.currentMenuIndex].classList.add('focused');
        }
    }
    
    showKeyboardHint() {
        let hintId = 'keyboardHint';
        if (this.currentScreen === 'storyScreen') {
            hintId = 'storyKeyboardHint';
        } else if (this.isGameOverVisible()) {
            hintId = 'gameOverKeyboardHint';
        }
        
        const hint = document.getElementById(hintId);
        if (hint) {
            hint.classList.remove('hide');
            hint.classList.add('show');
        }
    }
    
    hideKeyboardHint() {
        const hints = ['keyboardHint', 'storyKeyboardHint', 'gameOverKeyboardHint'];
        hints.forEach(hintId => {
            const hint = document.getElementById(hintId);
            if (hint) {
                hint.classList.remove('show');
                hint.classList.add('hide');
            }
        });
    }
    
    initializeGame() {
        // Initialize the game (this will be called from game.js)
        this.gameInitialized = true;
        // Start the game
        if (typeof startGame === 'function') {
            startGame();
        }
    }
    
    showExitConfirmation() {
        const confirmed = confirm('Are you sure you want to exit Coffee Tapper?');
        if (confirmed) {
            // In a web environment, we can't really close the window
            // So we'll show a farewell message
            alert('Thanks for playing Coffee Tapper! ☕');
            // Could redirect to another page or just return to start screen
            this.showScreen('startScreen');
        }
    }
    
    playSound(soundType) {
        // Placeholder for sound effects
        console.log(`Playing sound: ${soundType}`);
        // TODO: Implement actual sound effects with Web Audio API
    }
    
    restartStoryAnimation() {
        console.log('Story animation started');
        const scrollingText = document.getElementById('scrollingText');
        if (scrollingText) {
            // Remove and re-add the scrolling text to restart the animation
            scrollingText.style.animation = 'none';
            scrollingText.offsetHeight; // Trigger reflow
            scrollingText.style.animation = 'testScroll 60s linear infinite';
            
            // Reset paragraph animations - no complex timing for now
            const paragraphs = scrollingText.querySelectorAll('.story-paragraph');
            console.log(`Story loaded with ${paragraphs.length} sections`);
            paragraphs.forEach((paragraph) => {
                paragraph.style.opacity = '1';
            });
        } else {
            console.log('Story content not found');
        }
    }
}

// Global functions for game integration
function returnToStart() {
    if (window.screenManager) {
        window.screenManager.showScreen('startScreen');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.screenManager = new ScreenManager();
});

// Handle visibility change to pause/resume animations
document.addEventListener('visibilitychange', () => {
    if (window.screenManager && window.screenManager.animations) {
        if (document.hidden) {
            window.screenManager.animations.stop();
        } else if (window.screenManager.currentScreen === 'startScreen') {
            window.screenManager.animations.resume();
        }
    }
});
