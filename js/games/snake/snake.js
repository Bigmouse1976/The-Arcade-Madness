/**
 * The Arcade Madness - Snake Game
 * Classic snake game with modern features
 */

class SnakeGame extends GameEngine {
    constructor() {
        super('gameCanvas', {
            targetFPS: 60,
            backgroundColor: '#000000',
            debug: false
        });
        
        // Initialize components
        this.input = new InputHandler({ canvas: this.canvas });
        this.renderer = new Renderer(this.ctx);
        this.collision = new CollisionDetector();
        this.audio = new AudioManager();
        
        // Grid settings
        this.gridSize = 28; // 560 / 20 = 28 for perfect grid
        this.cols = Math.floor(this.canvas.width / this.gridSize);
        this.rows = Math.floor(this.canvas.height / this.gridSize);
        
        // Game settings
        this.moveSpeed = 100; // milliseconds per move
        this.lastMoveTime = 0;
        this.difficulty = 'normal';
        
        // Snake
        this.snake = [];
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        
        // Food
        this.food = { x: 0, y: 0 };
        this.foodType = 'normal'; // normal, bonus
        
        // Colors
        this.colors = {
            snake: '#39FF14',
            snakeHead: '#FFFF00',
            snakeTail: '#2a8a0f',
            food: '#FF0040',
            bonusFood: '#FF6600',
            grid: '#111111'
        };
        
        // High score
        this.highScore = this.loadHighScore();
        
        // UI elements
        this.setupUI();
        
        // Setup controls
        this.setupControls();
        
        console.log('🐍 Snake game initialized!');
    }
    
    // ============================================
    // INITIALIZATION
    // ============================================
    
    setupUI() {
        this.scoreElement = document.getElementById('score');
        this.highScoreElement = document.getElementById('highScore');
        this.lengthElement = document.getElementById('length');
        
        // Buttons
        this.startBtn = document.getElementById('startBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.restartBtn = document.getElementById('restartBtn');
        this.backBtn = document.getElementById('backBtn');
        
        // Button events
        this.startBtn.addEventListener('click', () => this.start());
        this.pauseBtn.addEventListener('click', () => this.pause());
        this.restartBtn.addEventListener('click', () => this.restart());
        this.backBtn.addEventListener('click', () => window.location.href = '../../../index.html');
        
        // Difficulty selector
        const difficultyButtons = document.querySelectorAll('.difficulty-btn');
        difficultyButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                if (this.isRunning) return; // Can't change during game
                
                difficultyButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                this.moveSpeed = parseInt(btn.dataset.speed);
                this.difficulty = btn.textContent.toLowerCase();
                console.log(`Difficulty set to: ${this.difficulty} (${this.moveSpeed}ms)`);
            });
        });
        
        // Update UI
        this.updateUI();
    }
    
    setupControls() {
        // Keyboard controls
        this.input.bind('Space', () => {
            if (!this.isRunning) {
                this.start();
            } else {
                this.pause();
            }
        });
        
        this.input.bind('KeyR', () => {
            if (this.gameOver) {
                this.restart();
            }
        });
        
        this.input.bind('Escape', () => {
            if (this.isRunning) {
                this.pause();
            }
        });
    }
    
    // ============================================
    // GAME LOGIC
    // ============================================
    
    onStart() {
        this.initializeGame();
    }
    
    onReset() {
        this.initializeGame();
    }
    
    initializeGame() {
        // Reset snake to center, moving right
        const centerX = Math.floor(this.cols / 2);
        const centerY = Math.floor(this.rows / 2);
        
        this.snake = [
            { x: centerX, y: centerY },
            { x: centerX - 1, y: centerY },
            { x: centerX - 2, y: centerY }
        ];
        
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        this.lastMoveTime = 0;
        
        // Spawn food
        this.spawnFood();
        
        // Update UI
        this.updateUI();
        
        console.log('🐍 Game initialized - Ready to play!');
    }
    
    update(deltaTime) {
        if (this.gameOver) return;
        
        // Handle input
        this.handleInput();
        
        // Move snake at fixed intervals
        const currentTime = performance.now();
        if (currentTime - this.lastMoveTime >= this.moveSpeed) {
            this.moveSnake();
            this.lastMoveTime = currentTime;
        }
    }
    
    handleInput() {
        const dirPressed = this.input.getDirectionPressed();
        
        if (dirPressed) {
            let newDir = { ...this.direction };
            
            switch(dirPressed) {
                case 'up':
                    if (this.direction.y === 0) newDir = { x: 0, y: -1 };
                    break;
                case 'down':
                    if (this.direction.y === 0) newDir = { x: 0, y: 1 };
                    break;
                case 'left':
                    if (this.direction.x === 0) newDir = { x: -1, y: 0 };
                    break;
                case 'right':
                    if (this.direction.x === 0) newDir = { x: 1, y: 0 };
                    break;
            }
            
            // Store next direction (prevents double-back bug)
            this.nextDirection = newDir;
        }
    }
    
    moveSnake() {
        // Update direction
        this.direction = this.nextDirection;
        
        // Calculate new head position
        const head = this.snake[0];
        const newHead = {
            x: head.x + this.direction.x,
            y: head.y + this.direction.y
        };
        
        // Check wall collision
        if (newHead.x < 0 || newHead.x >= this.cols || 
            newHead.y < 0 || newHead.y >= this.rows) {
            this.endGame();
            return;
        }
        
        // Check self collision
        if (this.collision.gridPositionInArray(newHead, this.snake)) {
            this.endGame();
            return;
        }
        
        // Add new head
        this.snake.unshift(newHead);
        
        // Check food collision
        if (this.collision.gridPosition(newHead, this.food)) {
            this.eatFood();
        } else {
            // Remove tail if no food eaten
            this.snake.pop();
        }
    }
    
    eatFood() {
        // Add score based on food type
        const points = this.foodType === 'bonus' ? 20 : 10;
        this.addScore(points);
        
        // Increase speed slightly every 5 foods
        if (this.score % 50 === 0 && this.moveSpeed > 30) {
            this.moveSpeed = Math.max(30, this.moveSpeed - 5);
            console.log(`Speed increased! New speed: ${this.moveSpeed}ms`);
        }
        
        // Spawn new food
        this.spawnFood();
        
        // Update UI
        this.updateUI();
        
        console.log(`🍎 Food eaten! Score: ${this.score}, Length: ${this.snake.length}`);
    }
    
    spawnFood() {
        // 10% chance for bonus food
        this.foodType = Math.random() < 0.1 ? 'bonus' : 'normal';
        
        // Find empty position
        let validPosition = false;
        while (!validPosition) {
            this.food = {
                x: Math.floor(Math.random() * this.cols),
                y: Math.floor(Math.random() * this.rows)
            };
            
            // Check if position is not occupied by snake
            validPosition = !this.collision.gridPositionInArray(this.food, this.snake);
        }
    }
    
    // ============================================
    // RENDERING
    // ============================================
    
    render() {
        // Draw grid
        this.drawGrid();
        
        // Draw food
        this.drawFood();
        
        // Draw snake
        this.drawSnake();
        
        // Draw game over screen
        if (this.gameOver) {
            this.drawGameOver();
        }
    }
    
    drawGrid() {
        this.ctx.strokeStyle = this.colors.grid;
        this.ctx.lineWidth = 1;
        
        // Vertical lines
        for (let i = 0; i <= this.cols; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.gridSize, 0);
            this.ctx.lineTo(i * this.gridSize, this.canvas.height);
            this.ctx.stroke();
        }
        
        // Horizontal lines
        for (let i = 0; i <= this.rows; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.gridSize);
            this.ctx.lineTo(this.canvas.width, i * this.gridSize);
            this.ctx.stroke();
        }
    }
    
    drawSnake() {
        this.snake.forEach((segment, index) => {
            const x = segment.x * this.gridSize;
            const y = segment.y * this.gridSize;
            const padding = 2;
            const size = this.gridSize - padding * 2;
            
            // Determine color (gradient from head to tail)
            let color;
            if (index === 0) {
                color = this.colors.snakeHead; // Head
            } else {
                const ratio = index / this.snake.length;
                color = this.lerpColor(this.colors.snake, this.colors.snakeTail, ratio);
            }
            
            // Draw segment with 3D effect
            this.renderer.draw3DTile(segment.x, segment.y, this.gridSize, color, padding);
            
            // Draw eyes on head
            if (index === 0) {
                const eyeSize = 3;
                const eyeOffset = 8;
                
                // Determine eye position based on direction
                let eye1X = x + this.gridSize / 2 - eyeOffset;
                let eye1Y = y + this.gridSize / 2 - eyeOffset;
                let eye2X = x + this.gridSize / 2 + eyeOffset;
                let eye2Y = y + this.gridSize / 2 - eyeOffset;
                
                if (this.direction.x !== 0) {
                    eye1Y = y + this.gridSize / 2 - 6;
                    eye2Y = y + this.gridSize / 2 + 6;
                    eye1X = x + this.gridSize / 2 + (this.direction.x > 0 ? 6 : -6);
                    eye2X = eye1X;
                } else {
                    eye1X = x + this.gridSize / 2 - 6;
                    eye2X = x + this.gridSize / 2 + 6;
                    eye1Y = y + this.gridSize / 2 + (this.direction.y > 0 ? 6 : -6);
                    eye2Y = eye1Y;
                }
                
                this.ctx.fillStyle = '#000000';
                this.ctx.fillRect(eye1X, eye1Y, eyeSize, eyeSize);
                this.ctx.fillRect(eye2X, eye2Y, eyeSize, eyeSize);
            }
        });
    }
    
    drawFood() {
        const x = this.food.x * this.gridSize;
        const y = this.food.y * this.gridSize;
        const centerX = x + this.gridSize / 2;
        const centerY = y + this.gridSize / 2;
        const radius = (this.gridSize / 2) - 4;
        
        const color = this.foodType === 'bonus' ? this.colors.bonusFood : this.colors.food;
        
        // Draw with glow effect
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = color;
        
        // Draw food circle
        this.renderer.drawCircle(centerX, centerY, radius, color);
        
        // Inner highlight
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.beginPath();
        this.ctx.arc(centerX - 2, centerY - 2, radius / 3, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw bonus indicator
        if (this.foodType === 'bonus') {
            this.ctx.shadowBlur = 0;
            this.ctx.fillStyle = '#FFFF00';
            this.ctx.font = '12px "Press Start 2P"';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('★', centerX, centerY);
        }
        
        this.ctx.shadowBlur = 0;
    }
    
    drawGameOver() {
        // Semi-transparent overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // Game Over text
        this.renderer.drawPixelText('GAME OVER', centerX, centerY - 60, {
            color: '#FF0040',
            shadowColor: '#000000',
            font: 'bold 36px "Press Start 2P"',
            shadowOffset: 3
        });
        
        // Final score
        this.renderer.drawText(`SCORE: ${this.score}`, centerX, centerY, {
            color: '#39FF14',
            font: '24px "Press Start 2P"',
            align: 'center'
        });
        
        // Length
        this.renderer.drawText(`LENGTH: ${this.snake.length}`, centerX, centerY + 40, {
            color: '#00F0FF',
            font: '20px "Press Start 2P"',
            align: 'center'
        });
        
        // High score
        if (this.score === this.highScore && this.score > 0) {
            this.renderer.drawPixelText('NEW HIGH SCORE!', centerX, centerY - 100, {
                color: '#FFFF00',
                shadowColor: '#FF6600',
                font: '16px "Press Start 2P"',
                shadowOffset: 2
            });
        }
        
        // Instructions
        this.renderer.drawText('Press R or RESTART to play again', centerX, centerY + 100, {
            color: '#FFFF00',
            font: '12px "Press Start 2P"',
            align: 'center'
        });
    }
    
    renderPauseScreen() {
        // Draw current game state
        this.render();
        
        // Semi-transparent overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // Pause text
        this.renderer.drawPixelText('PAUSED', centerX, centerY, {
            color: '#00F0FF',
            shadowColor: '#000000',
            font: 'bold 48px "Press Start 2P"',
            shadowOffset: 3
        });
        
        // Instructions
        this.renderer.drawText('Press SPACE to continue', centerX, centerY + 60, {
            color: '#FFFF00',
            font: '14px "Press Start 2P"',
            align: 'center'
        });
    }
    
    // ============================================
    // UI UPDATES
    // ============================================
    
    updateUI() {
        this.scoreElement.textContent = this.score;
        this.highScoreElement.textContent = this.highScore;
        this.lengthElement.textContent = this.snake.length;
    }
    
    // ============================================
    // LIFECYCLE HOOKS
    // ============================================
    
    onScoreChange(newScore, points) {
        // Update high score
        if (newScore > this.highScore) {
            this.highScore = newScore;
            this.saveHighScore();
        }
        this.updateUI();
    }
    
    onGameOver() {
        console.log('💀 Game Over!');
        console.log(`Final Score: ${this.score}`);
        console.log(`Final Length: ${this.snake.length}`);
        console.log(`High Score: ${this.highScore}`);
    }
    
    // ============================================
    // HIGH SCORE MANAGEMENT
    // ============================================
    
    loadHighScore() {
        const saved = localStorage.getItem('snake_highScore');
        return saved ? parseInt(saved, 10) : 0;
    }
    
    saveHighScore() {
        localStorage.setItem('snake_highScore', this.highScore.toString());
        console.log(`💾 High score saved: ${this.highScore}`);
    }
    
    // ============================================
    // UTILITY METHODS
    // ============================================
    
    lerpColor(color1, color2, t) {
        const hex1 = color1.replace('#', '');
        const hex2 = color2.replace('#', '');
        
        const r1 = parseInt(hex1.substr(0, 2), 16);
        const g1 = parseInt(hex1.substr(2, 2), 16);
        const b1 = parseInt(hex1.substr(4, 2), 16);
        
        const r2 = parseInt(hex2.substr(0, 2), 16);
        const g2 = parseInt(hex2.substr(2, 2), 16);
        const b2 = parseInt(hex2.substr(4, 2), 16);
        
        const r = Math.round(r1 + (r2 - r1) * t);
        const g = Math.round(g1 + (g2 - g1) * t);
        const b = Math.round(b1 + (b2 - b1) * t);
        
        return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    }
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🐍 Initializing Snake Game...');
    
    // Create game instance
    const game = new SnakeGame();
    
    console.log('✅ Snake Game ready!');
    console.log('📝 Click START or press SPACE to begin');
});
