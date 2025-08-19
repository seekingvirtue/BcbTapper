// Game variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let gameState = {
    score: 0,
    lives: 3,
    level: 1,
    gameRunning: false,
    bartenderPosition: 0,
    bartenderX: 50,
    lastMugThrown: 0,
    minMugDelay: 60,
    tapPower: 0,
    tapCharging: false,
    tips: [],
    distractionShow: {
        active: false,
        timer: 0,
        duration: 180
    }
};

// Game objects
let customers = [];
let coffees = [];
let emptyMugs = [];
let pendingMugs = [];

// Counter positions
const counters = [
    { y: 100, length: 700 },
    { y: 200, length: 700 },
    { y: 300, length: 700 },
    { y: 400, length: 700 }
];

// Sound effect function using audio manager
function playSound(soundType) {
    if (window.audioManager) {
        // Only play sounds that exist to avoid errors
        const validSounds = ['CoffeeServed', 'CoffeeCaptured', 'CupMissed', 'MoneyDroppedOrCollected'];
        if (validSounds.includes(soundType)) {
            window.audioManager.playSound(soundType);
        } else {
            console.log(`Sound not implemented: ${soundType}`);
        }
    } else {
        console.log(`Playing sound: ${soundType}`);
    }
}

// Coffee class with sliding physics
class Coffee {
    constructor(counterIndex, initialSpeed = 3) {
        this.counter = counterIndex;
        this.x = gameState.bartenderX + 30;
        this.y = counters[counterIndex].y;
        this.speed = initialSpeed;
        this.friction = 0.02;
        this.minSpeed = 1;
        this.caught = false;
    }

    update() {
        // Apply friction to simulate sliding
        this.speed = Math.max(this.minSpeed, this.speed - this.friction);
        this.x += this.speed;
        
        // Check collision with customers
        let shouldRemove = false;
        customers.forEach((customer, index) => {
            if (customer.counter === this.counter && 
                customer.hasOrder &&
                Math.abs(this.x - customer.x) < 30 && !this.caught) {
                this.caught = true;
                customer.servedCoffee(this.speed);
                playSound('CoffeeCaptured');
                shouldRemove = true;
            }
        });
        
        if (shouldRemove) return false;

        // Check if drink falls off the end
        if (this.x > canvas.width) {
            console.log('Coffee fell off screen! Lives before:', gameState.lives);
            gameState.lives--;
            console.log('Lives after:', gameState.lives);
            playSound('CupMissed');
            return false;
        }
        
        return true;
    }

    draw() {
        ctx.font = '25px Arial';
        ctx.fillText('☕', this.x, this.y + 20);
        
        // Draw sliding trail effect
        ctx.globalAlpha = 0.3;
        for (let i = 1; i <= 3; i++) {
            ctx.fillText('☕', this.x - (i * 10), this.y + 20);
        }
        ctx.globalAlpha = 1.0;
    }
}

// Customer class
class Customer {
    constructor(counterIndex) {
        this.counter = counterIndex;
        this.x = canvas.width - 50;
        this.y = counters[counterIndex].y;
        this.speed = 0.5 + (gameState.level * 0.1);
        this.hasOrder = true;
        this.state = 'advancing';
        this.drinkTimer = 0;
        this.pushBackDistance = 0;
        this.tipChance = 0.1 + (gameState.level * 0.02);
        this.distracted = false;
        this.distractionTimer = 0;
        this.type = this.getCustomerType();
        this.emoji = this.getCustomerEmoji();
    }
    
    getCustomerType() {
        if (gameState.level <= 2) return 'cowboy';
        if (gameState.level <= 4) return 'athlete';
        if (gameState.level <= 6) return 'punk';
        return 'alien';
    }
    
    getCustomerEmoji() {
        const types = {
            cowboy: ['🤠', '🧑‍🌾', '👨‍🌾', '👩‍🌾'],
            athlete: ['⚽', '🏀', '🏈', '🎾', '🏐'],
            punk: ['🎸', '🎤', '🥁', '🎹'],
            alien: ['👽', '🛸', '🤖', '👾']
        };
        const typeEmojis = types[this.type] || types.cowboy;
        return typeEmojis[Math.floor(Math.random() * typeEmojis.length)];
    }

    update() {
        if (this.distracted) {
            this.distractionTimer--;
            if (this.distractionTimer <= 0) {
                this.distracted = false;
            }
            return true;
        }

        switch (this.state) {
            case 'advancing':
                if (this.hasOrder) {
                    this.x -= this.speed;
                    
                    // Customer reached the bartender
                    if (this.x <= 80) {
                        gameState.lives--;
                        playSound('CupMissed');
                        return false;
                    }
                }
                break;
                
            case 'retreating':
                this.x += this.speed * 1.5;
                this.pushBackDistance -= this.speed * 1.5;
                
                if (this.x >= canvas.width - 20) {
                    return false;
                }
                
                if (this.pushBackDistance <= 0) {
                    this.state = 'drinking';
                    this.drinkTimer = 60;
                }
                break;
                
            case 'drinking':
                this.drinkTimer--;
                if (this.drinkTimer <= 0) {
                    this.state = 'advancing';
                    this.hasOrder = true;
                    
                    // Chance to leave a tip
                    if (Math.random() < this.tipChance) {
                        const tip = new Tip(this.x, this.y, this.counter, 50 + Math.floor(Math.random() * 150));
                        gameState.tips.push(tip);
                    }
                    
                    // Queue empty mug return
                    pendingMugs.push({
                        counter: this.counter,
                        x: this.x,
                        delay: Math.random() * 30 + 30
                    });
                }
                break;
        }
        
        return true;
    }

    draw() {
        ctx.font = '30px Arial';
        
        if (this.distracted) {
            ctx.fillStyle = '#FFD700';
        } else {
            ctx.fillStyle = '#000000';
        }
        
        ctx.fillText(this.emoji, this.x, this.y + 25);
        ctx.fillStyle = '#000000';
        
        if (this.state === 'drinking') {
            ctx.font = '20px Arial';
            ctx.fillText('💭', this.x + 30, this.y);
        }
    }

    servedCoffee(drinkSpeed) {
        this.hasOrder = false;
        this.state = 'retreating';
        gameState.score += 10;
        this.pushBackDistance = Math.min(150, drinkSpeed * 30);
        playSound('CoffeeServed');
    }
    
    distract(duration = 180) {
        this.distracted = true;
        this.distractionTimer = duration;
    }
}

// Tip class
class Tip {
    constructor(x, y, counter, points) {
        this.x = x;
        this.y = y;
        this.counter = counter;
        this.points = points;
        this.bobOffset = 0;
        this.collected = false;
    }
    
    update() {
        this.bobOffset += 0.1;
        
        if (this.counter === gameState.bartenderPosition && 
            Math.abs(this.x - gameState.bartenderX) < 40) {
            this.collected = true;
            gameState.score += this.points;
            playSound('MoneyDroppedOrCollected');
            activateDistractionShow();
            return false;
        }
        
        return true;
    }
    
    draw() {
        const yOffset = Math.sin(this.bobOffset) * 3;
        ctx.font = '20px Arial';
        ctx.fillText('💰', this.x, this.y + yOffset);
        
        ctx.font = '12px Arial';
        ctx.fillStyle = '#FFD700';
        ctx.fillText(`$${this.points}`, this.x - 5, this.y - 10 + yOffset);
        ctx.fillStyle = '#000000';
    }
}

// Empty Mug class
class EmptyMug {
    constructor(counterIndex, startX) {
        this.counter = counterIndex;
        this.x = startX;
        this.y = counters[counterIndex].y;
        this.speed = 2 + Math.random();
        this.spinning = 0;
    }

    update() {
        this.x -= this.speed;
        this.spinning += 0.2;
        
        if (this.counter === gameState.bartenderPosition && 
            Math.abs(this.x - gameState.bartenderX) < 40) {
            gameState.score += 5;
            playSound('MoneyDroppedOrCollected');
            return false;
        }
        
        if (this.x < 0) {
            gameState.lives--;
            playSound('CupMissed');
            return false;
        }
        
        return true;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x + 10, this.y + 10);
        ctx.rotate(this.spinning);
        ctx.font = '20px Arial';
        ctx.fillText('🥤', -10, 5);
        ctx.restore();
    }
}

// Distraction show functions
function activateDistractionShow() {
    gameState.distractionShow.active = true;
    gameState.distractionShow.timer = gameState.distractionShow.duration;
    
    customers.forEach(customer => {
        if (Math.random() < 0.6) {
            customer.distract(gameState.distractionShow.duration);
        }
    });
}

function updateDistractionShow() {
    if (gameState.distractionShow.active) {
        gameState.distractionShow.timer--;
        if (gameState.distractionShow.timer <= 0) {
            gameState.distractionShow.active = false;
        }
    }
}

function drawDistractionShow() {
    if (gameState.distractionShow.active) {
        ctx.font = '30px Arial';
        ctx.fillText('💃', canvas.width - 150, 150);
        ctx.fillText('💃', canvas.width - 150, 350);
        
        for (let i = 0; i < 5; i++) {
            const sparkleX = canvas.width - 170 + Math.random() * 40;
            const sparkleY = 100 + Math.random() * 400;
            ctx.font = '15px Arial';
            ctx.fillText('✨', sparkleX, sparkleY);
        }
    }
}

// Input handling
const keys = {};

document.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    
    if (e.code === 'Space' && gameState.gameRunning && !gameState.tapCharging) {
        e.preventDefault();
        gameState.tapCharging = true;
        gameState.tapPower = 0;
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.code] = false;
    
    if (e.code === 'Space' && gameState.gameRunning && gameState.tapCharging) {
        e.preventDefault();
        serveCoffee();
        gameState.tapCharging = false;
        gameState.tapPower = 0;
    }
});

function handleInput() {
    if (!gameState.gameRunning) return;

    if (gameState.tapCharging) {
        gameState.tapPower = Math.min(5, gameState.tapPower + 0.1);
    }

    if (keys['ArrowUp'] && gameState.bartenderPosition > 0) {
        gameState.bartenderPosition--;
        keys['ArrowUp'] = false;
    }
    if (keys['ArrowDown'] && gameState.bartenderPosition < 3) {
        gameState.bartenderPosition++;
        keys['ArrowDown'] = false;
    }
    
    if (keys['ArrowLeft'] && gameState.bartenderX > 30) {
        gameState.bartenderX -= 3;
    }
    if (keys['ArrowRight'] && gameState.bartenderX < 100) {
        gameState.bartenderX += 3;
    }
}

function serveCoffee() {
    const speed = 2 + gameState.tapPower;
    console.log('Serving coffee with speed:', speed, 'at position:', gameState.bartenderX);
    coffees.push(new Coffee(gameState.bartenderPosition, speed));
    playSound('CoffeeServed');
}

// Spawn customers
function spawnCustomer() {
    if (Math.random() < 0.02 + (gameState.level * 0.005)) {
        const counterIndex = Math.floor(Math.random() * 4);
        const hasNearbyCustomer = customers.some(c => 
            c.counter === counterIndex && c.x > canvas.width - 100
        );
        
        if (!hasNearbyCustomer) {
            customers.push(new Customer(counterIndex));
        }
    }
}

// Manage mug throwing queue
function manageMugQueue() {
    pendingMugs.forEach(mug => {
        mug.delay--;
    });
    
    gameState.lastMugThrown++;
    
    if (gameState.lastMugThrown >= gameState.minMugDelay && pendingMugs.length > 0) {
        const readyMugIndex = pendingMugs.findIndex(mug => mug.delay <= 0);
        
        if (readyMugIndex !== -1) {
            const readyMug = pendingMugs[readyMugIndex];
            emptyMugs.push(new EmptyMug(readyMug.counter, readyMug.x));
            pendingMugs.splice(readyMugIndex, 1);
            gameState.lastMugThrown = 0;
        }
    }
}

// Update game objects
function update() {
    if (!gameState.gameRunning) return;

    handleInput();
    spawnCustomer();
    manageMugQueue();
    updateDistractionShow();

    customers = customers.filter(customer => customer.update());
    coffees = coffees.filter(coffee => coffee.update());
    emptyMugs = emptyMugs.filter(mug => mug.update());
    gameState.tips = gameState.tips.filter(tip => tip.update());

    if (gameState.lives <= 0) {
        console.log('Game Over triggered! Lives:', gameState.lives);
        gameOver();
    }

    if (gameState.score > gameState.level * 100) {
        gameState.level++;
        gameState.minMugDelay = Math.max(30, 60 - (gameState.level * 3));
        playSound('CupMissed'); // Using this as level up sound for now
    }

    document.getElementById('score').textContent = gameState.score;
    document.getElementById('lives').textContent = gameState.lives;
    document.getElementById('level').textContent = gameState.level;
}

// Render game
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw counters
    ctx.fillStyle = '#8B4513';
    counters.forEach((counter, index) => {
        ctx.fillRect(50, counter.y + 25, counter.length, 8);
        
        if (index === gameState.bartenderPosition) {
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 3;
            ctx.strokeRect(48, counter.y + 23, counter.length + 4, 12);
        }
    });

    // Draw bartender (man emoji)
    ctx.font = '35px Arial';
    const bartenderY = counters[gameState.bartenderPosition].y;
    ctx.fillText('👨', gameState.bartenderX, bartenderY + 20);

    // Draw coffee dispenser
    ctx.font = '30px Arial';
    ctx.fillText('☕', 10, bartenderY + 20);
    
    // Draw tap power indicator when charging
    if (gameState.tapCharging) {
        const powerBarWidth = 100;
        const powerBarHeight = 10;
        const powerRatio = gameState.tapPower / 5;
        
        ctx.fillStyle = 'red';
        ctx.fillRect(gameState.bartenderX - 20, bartenderY - 30, powerBarWidth, powerBarHeight);
        ctx.fillStyle = 'yellow';
        ctx.fillRect(gameState.bartenderX - 20, bartenderY - 30, powerBarWidth * powerRatio, powerBarHeight);
        
        ctx.font = '12px Arial';
        ctx.fillStyle = 'white';
        ctx.fillText('POWER', gameState.bartenderX - 15, bartenderY - 35);
        ctx.fillStyle = 'black';
    }

    // Draw game objects
    customers.forEach(customer => customer.draw());
    coffees.forEach(coffee => coffee.draw());
    emptyMugs.forEach(mug => mug.draw());
    gameState.tips.forEach(tip => tip.draw());
    
    drawDistractionShow();
}

// Game over
function gameOver() {
    gameState.gameRunning = false;
    document.getElementById('finalScore').textContent = gameState.score;
    document.getElementById('gameOver').style.display = 'block';
    playSound('CupMissed');
    
    if (window.screenManager) {
        window.screenManager.resetKeyboardNavigation('gameOver');
        window.screenManager.showKeyboardHint();
    }
}

// Restart game
function restartGame() {
    gameState = {
        score: 0,
        lives: 3,
        level: 1,
        gameRunning: true,
        bartenderPosition: 0,
        bartenderX: 50,
        lastMugThrown: 0,
        minMugDelay: 60,
        tapPower: 0,
        tapCharging: false,
        tips: [],
        distractionShow: {
            active: false,
            timer: 0,
            duration: 180
        }
    };
    
    customers = [];
    coffees = [];
    emptyMugs = [];
    pendingMugs = [];
    
    document.getElementById('gameOver').style.display = 'none';
    
    if (window.screenManager) {
        window.screenManager.hideKeyboardHint();
    }
    
    if (!gameLoopRunning) {
        startGame();
    }
}

// Start the game
let gameLoopRunning = false;

function startGame() {
    gameState.gameRunning = true;
    if (!gameLoopRunning) {
        gameLoopRunning = true;
        gameLoop();
    }
}

function gameLoop() {
    if (gameLoopRunning) {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }
}

function stopGame() {
    gameLoopRunning = false;
    gameState.gameRunning = false;
}
