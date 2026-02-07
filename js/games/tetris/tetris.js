/**
 * The Arcade Madness - Tetris Game
 * Classic Tetris with modern features
 */

class TetrisGame extends GameEngine {
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
        this.blockSize = 30;
        this.cols = 10;
        this.rows = 20;
        this.grid = [];
        
        // Game settings
        this.dropSpeed = 1000; // milliseconds per drop
        this.lastDropTime = 0;
        this.fastDrop = false;
        this.fastDropSpeed = 50;
        
        // Current piece
        this.currentPiece = null;
        this.currentX = 0;
        this.currentY = 0;
        this.currentRotation = 0;
        
        // Next piece
        this.nextPiece = null;
        this.nextPieceCanvas = document.getElementById('nextPieceCanvas');
        this.nextPieceCtx = this.nextPieceCanvas.getContext('2d');
        
        // Lines and scoring
        this.lines = 0;
        this.comboCount = 0;
        
        // High score
        this.highScore = this.loadHighScore();
        
        // Particles
        this.particles = [];
        
        // Define tetrominoes
        this.defineTetrominoes();
        
        // UI elements
        this.setupUI();
        
        // Setup controls
        this.setupControls();
        
        console.log('🎮 Tetris game initialized!');
    }
    
    // ============================================
    // TETROMINOES DEFINITION
    // ============================================
    
    defineTetrominoes() {
        this.tetrominoes = {
            'I': {
                shape: [
                    [[0,0,0,0],
                     [1,1,1,1],
                     [0,0,0,0],
                     [0,0,0,0]]
                ],
                color: '#00F0FF'
            },
            'O': {
                shape: [
                    [[1,1],
                     [1,1]]
                ],
                color: '#FFFF00'
            },
            'T': {
                shape: [
                    [[0,1,0],
                     [1,1,1],
                     [0,0,0]]
                ],
                color: '#9D00FF'
            },
            'S': {
                shape: [
                    [[0,1,1],
                     [1,1,0],
                     [0,0,0]]
                ],
                color: '#39FF14'
            },
            'Z': {
                shape: [
                    [[1,1,0],
                     [0,1,1],
                     [0,0,0]]
                ],
                color: '#FF0040'
            },
            'J': {
                shape: [
                    [[1,0,0],
                     [1,1,1],
                     [0,0,0]]
                ],
                color: '#0000FF'
            },
            'L': {
                shape: [
                    [[0,0,1],
                     [1,1,1],
                     [0,0,0]]
                ],
                color: '#FF6600'
            }
        };
        
        this.tetrominoTypes = Object.keys(this.tetrominoes);
    }
    
    // ============================================
    // INITIALIZATION
    // ============================================
    
    setupUI() {
        this.scoreElement = document.getElementById('score');
        this.linesElement = document.getElementById('lines');
        this.levelElement = document.getElementById('level');
        this.highScoreElement = document.getElementById('highScore');
        this.levelDotsContainer = document.getElementById('levelDots');
        
        // Create level dots first
        this.createLevelDots();
        
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
        
        // Update UI after dots are created
        this.updateUI();
    }
    
    createLevelDots() {
        for (let i = 0; i < 10; i++) {
            const dot = document.createElement('div');
            dot.className = 'level-dot';
            dot.id = `level-dot-${i}`;
            this.levelDotsContainer.appendChild(dot);
        }
    }
    
    updateLevelDots() {
        for (let i = 0; i < 10; i++) {
            const dot = document.getElementById(`level-dot-${i}`);
            if (dot) {
                if (i < this.level) {
                    dot.classList.add('active');
                } else {
                    dot.classList.remove('active');
                }
            }
        }
    }
    
    setupControls() {
        // Movement
        this.input.bind('ArrowLeft', () => this.movePiece(-1, 0));
        this.input.bind('ArrowRight', () => this.movePiece(1, 0));
        this.input.bind('ArrowDown', () => { this.fastDrop = true; });
        
        // Rotation
        this.input.bind('ArrowUp', () => this.rotatePiece(-1));
        this.input.bind('KeyZ', () => this.rotatePiece(-1));
        this.input.bind('KeyX', () => this.rotatePiece(1));
        
        // Hard drop
        this.input.bind('Space', () => this.hardDrop());
        
        // Pause
        this.input.bind('KeyP', () => {
            if (!this.isRunning) {
                this.start();
            } else {
                this.pause();
            }
        });
        
        // Restart
        this.input.bind('KeyR', () => {
            if (this.gameOver) {
                this.restart();
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
        // Clear grid
        this.grid = [];
        for (let y = 0; y < this.rows; y++) {
            this.grid[y] = [];
            for (let x = 0; x < this.cols; x++) {
                this.grid[y][x] = null;
            }
        }
        
        // Reset stats
        this.lines = 0;
        this.comboCount = 0;
        this.particles = [];
        this.level = 1;
        this.dropSpeed = 1000;
        this.lastDropTime = 0;
        
        // Spawn pieces
        this.nextPiece = this.getRandomPiece();
        this.spawnPiece();
        
        // Update UI
        this.updateUI();
        
        // Do initial render
        this.render();
        
        console.log('🎮 Tetris initialized - Let\'s play!');
    }
    
    update(deltaTime) {
        // Always update particles (even during game over)
        this.updateParticles(deltaTime);
        
        if (this.gameOver) return;
        
        // Check if down arrow is held (fast drop)
        if (this.input.isKeyDown('ArrowDown')) {
            this.fastDrop = true;
        } else {
            this.fastDrop = false;
        }
        
        // Auto drop piece
        const currentTime = performance.now();
        const speed = this.fastDrop ? this.fastDropSpeed : this.dropSpeed;
        
        if (currentTime - this.lastDropTime >= speed) {
            this.dropPiece();
            this.lastDropTime = currentTime;
        }
    }
    
    spawnPiece() {
        this.currentPiece = this.nextPiece;
        this.nextPiece = this.getRandomPiece();
        this.currentRotation = 0;
        this.currentX = Math.floor(this.cols / 2) - 1;
        this.currentY = 0;
        
        console.log('Spawning piece:', this.currentPiece.type, 'at', this.currentX, this.currentY);
        
        // Check if can spawn
        if (!this.canPlacePiece(this.currentX, this.currentY, this.currentRotation)) {
            console.log('Cannot spawn piece - game over!');
            this.endGame();
        }
        
        this.drawNextPiece();
    }
    
    getRandomPiece() {
        const type = this.tetrominoTypes[Math.floor(Math.random() * this.tetrominoTypes.length)];
        return {
            type: type,
            shape: this.tetrominoes[type].shape,
            color: this.tetrominoes[type].color
        };
    }
    
    dropPiece() {
        if (this.movePiece(0, 1)) {
            // Piece moved down successfully
        } else {
            // Piece can't move down - lock it
            this.lockPiece();
        }
    }
    
    movePiece(dx, dy) {
        const newX = this.currentX + dx;
        const newY = this.currentY + dy;
        
        if (this.canPlacePiece(newX, newY, this.currentRotation)) {
            this.currentX = newX;
            this.currentY = newY;
            return true;
        }
        return false;
    }
    
    rotatePiece(direction) {
        if (!this.currentPiece) return;
        if (this.currentPiece.type === 'O') return; // O piece doesn't rotate
        console.log('Rotating piece:', this.currentPiece.type, 'direction:', direction);
        const numRotations = 4;
        let newRotation = this.currentRotation + direction;
        console.log('Current rotation:', this.currentRotation, 'New rotation:', newRotation);
        
        if (newRotation < 0) newRotation = numRotations - 1;
        if (newRotation >= numRotations) newRotation = 0;
        
        // Try to place at current position
        if (this.canPlacePiece(this.currentX, this.currentY, newRotation)) {
            this.currentRotation = newRotation;
            console.log('Rotation successful at current position');
            return;
        }
        
        // Try wall kicks (shift left/right if rotation blocked)
        const kicks = [-1, 1, -2, 2];
        for (const kick of kicks) {
            if (this.canPlacePiece(this.currentX + kick, this.currentY, newRotation)) {
                this.currentX += kick;
                this.currentRotation = newRotation;
                console.log('Rotation successful with wall kick:', kick);
                return;
            }
        }
    }
    
    hardDrop() {
        while (this.movePiece(0, 1)) {
            this.addScore(2); // Bonus points for hard drop
        }
        this.lockPiece();
    }
    
    canPlacePiece(x, y, rotation) {
        if (!this.currentPiece) return false;
        
        const shape = this.getRotatedShape(rotation);
        
        for (let py = 0; py < shape.length; py++) {
            for (let px = 0; px < shape[py].length; px++) {
                if (shape[py][px]) {
                    const gridX = x + px;
                    const gridY = y + py;
                    
                    // Check bounds
                    if (gridX < 0 || gridX >= this.cols || gridY >= this.rows) {
                        return false;
                    }
                    
                    // Check collision with locked pieces (but allow above grid)
                    if (gridY >= 0 && this.grid[gridY][gridX]) {
                        return false;
                    }
                }
            }
        }
        
        return true;
    }
    
    getRotatedShape(rotation) {
        if (!this.currentPiece) return [];
        
        // O piece doesn't rotate
        if (this.currentPiece.type === 'O') {
            return this.currentPiece.shape[0];
        }
        
        // Generate rotation from base shape
        return this.generateRotation(this.currentPiece.shape[0], rotation);
    }
    
    generateRotation(shape, times) {
        let rotated = shape;
        for (let i = 0; i < times; i++) {
            rotated = this.rotateMatrix(rotated);
        }
        return rotated;
    }
    
    rotateMatrix(matrix) {
        const n = matrix.length;
        const rotated = [];
        
        for (let i = 0; i < n; i++) {
            rotated[i] = [];
            for (let j = 0; j < n; j++) {
                rotated[i][j] = matrix[n - 1 - j][i];
            }
        }
        
        return rotated;
    }
    
    lockPiece() {
        const shape = this.getRotatedShape(this.currentRotation);
        
        // Place piece in grid
        for (let py = 0; py < shape.length; py++) {
            for (let px = 0; px < shape[py].length; px++) {
                if (shape[py][px]) {
                    const gridX = this.currentX + px;
                    const gridY = this.currentY + py;
                    
                    if (gridY >= 0 && gridY < this.rows && gridX >= 0 && gridX < this.cols) {
                        this.grid[gridY][gridX] = this.currentPiece.color;
                    }
                }
            }
        }
        
        // Check for completed lines
        const linesCleared = this.clearLines();
        
        if (linesCleared > 0) {
            this.comboCount++;
            this.updateScore(linesCleared);
        } else {
            this.comboCount = 0;
        }
        
        // Spawn next piece
        this.spawnPiece();
    }
    
    clearLines() {
        let linesCleared = 0;
        
        // Check each row from bottom to top
        for (let y = this.rows - 1; y >= 0; y--) {
            let filled = true;
            
            for (let x = 0; x < this.cols; x++) {
                if (!this.grid[y][x]) {
                    filled = false;
                    break;
                }
            }
            
            if (filled) {
                // Spawn particles from cleared line
                this.spawnLineClearParticles(y);
                // Remove this line
                this.grid.splice(y, 1);
                // Add empty line at top
                this.grid.unshift(new Array(this.cols).fill(null));
                linesCleared++;
                y++; // Check same row again
            }
        }
        
        return linesCleared;
    }
    
    updateScore(linesCleared) {
        // Tetris scoring system
        const basePoints = {
            1: 100,   // Single
            2: 300,   // Double
            3: 500,   // Triple
            4: 800    // Tetris!
        };
        
        const points = basePoints[linesCleared] * this.level;
        const comboBonus = this.comboCount > 1 ? 50 * this.comboCount * this.level : 0;
        
        this.addScore(points + comboBonus);
        this.lines += linesCleared;
        
        // Level up every 10 lines
        const newLevel = Math.floor(this.lines / 10) + 1;
        if (newLevel > this.level) {
            this.setLevel(Math.min(10, newLevel));
            // Increase speed
            this.dropSpeed = Math.max(100, 1000 - (this.level - 1) * 100);
        }
        
        this.updateUI();
        
        if (linesCleared === 4) {
            console.log('🎉 TETRIS!');
        }
    }
    
    // ============================================
    // RENDERING
    // ============================================
    
    render() {
        // Draw grid background
        this.drawGridBackground();
        
        // Draw locked pieces
        this.drawLockedPieces();
        
        // Draw ghost piece (preview where piece will land)
        this.drawGhostPiece();
        
        // Draw current piece
        this.drawCurrentPiece();
        
        // Draw particles
        this.drawParticles();
        
        // Draw game over screen
        if (this.gameOver) {
            this.drawGameOver();
        }
    }
    
    drawGridBackground() {
        // Draw subtle grid
        this.ctx.strokeStyle = '#111111';
        this.ctx.lineWidth = 1;
        
        for (let x = 0; x <= this.cols; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * this.blockSize, 0);
            this.ctx.lineTo(x * this.blockSize, this.canvas.height);
            this.ctx.stroke();
        }
        
        for (let y = 0; y <= this.rows; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * this.blockSize);
            this.ctx.lineTo(this.canvas.width, y * this.blockSize);
            this.ctx.stroke();
        }
    }
    
    drawLockedPieces() {
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                if (this.grid[y][x]) {
                    this.drawBlock(x, y, this.grid[y][x]);
                }
            }
        }
    }
    
    drawGhostPiece() {
        if (!this.currentPiece) return;
        
        // Find where piece would land
        let ghostY = this.currentY;
        while (this.canPlacePiece(this.currentX, ghostY + 1, this.currentRotation)) {
            ghostY++;
        }
        
        // Draw ghost
        const shape = this.getRotatedShape(this.currentRotation);
        this.ctx.save();
        this.ctx.globalAlpha = 0.3;
        
        for (let py = 0; py < shape.length; py++) {
            for (let px = 0; px < shape[py].length; px++) {
                if (shape[py][px]) {
                    const x = this.currentX + px;
                    const y = ghostY + py;
                    if (y >= 0) {
                        this.drawBlock(x, y, this.currentPiece.color);
                    }
                }
            }
        }
        
        this.ctx.restore();
    }
    
    drawCurrentPiece() {
        if (!this.currentPiece) return;
        
        const shape = this.getRotatedShape(this.currentRotation);
        
        for (let py = 0; py < shape.length; py++) {
            for (let px = 0; px < shape[py].length; px++) {
                if (shape[py][px]) {
                    const x = this.currentX + px;
                    const y = this.currentY + py;
                    if (y >= 0) {
                        this.drawBlock(x, y, this.currentPiece.color);
                    }
                }
            }
        }
    }
    
    drawBlock(x, y, color) {
        const pixelX = x * this.blockSize;
        const pixelY = y * this.blockSize;
        const padding = 2;
        const size = this.blockSize - padding * 2;
        
        // Main block
        this.ctx.fillStyle = color;
        this.ctx.fillRect(pixelX + padding, pixelY + padding, size, size);
        
        // Highlight (top-left)
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        this.ctx.fillRect(pixelX + padding, pixelY + padding, size, 3);
        this.ctx.fillRect(pixelX + padding, pixelY + padding, 3, size);
        
        // Shadow (bottom-right)
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        this.ctx.fillRect(pixelX + padding, pixelY + this.blockSize - padding - 3, size, 3);
        this.ctx.fillRect(pixelX + this.blockSize - padding - 3, pixelY + padding, 3, size);
    }
    
    drawNextPiece() {
        if (!this.nextPiece) return;
        
        // Clear canvas
        this.nextPieceCtx.fillStyle = '#000000';
        this.nextPieceCtx.fillRect(0, 0, this.nextPieceCanvas.width, this.nextPieceCanvas.height);
        
        const shape = this.nextPiece.shape[0];
        const blockSize = 24;
        
        // Calculate centering offset
        const pieceWidth = shape[0].length * blockSize;
        const pieceHeight = shape.length * blockSize;
        const offsetX = (this.nextPieceCanvas.width - pieceWidth) / 2;
        const offsetY = (this.nextPieceCanvas.height - pieceHeight) / 2;
        
        // Draw piece
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    const pixelX = offsetX + x * blockSize;
                    const pixelY = offsetY + y * blockSize;
                    const padding = 2;
                    const size = blockSize - padding * 2;
                    
                    // Main block
                    this.nextPieceCtx.fillStyle = this.nextPiece.color;
                    this.nextPieceCtx.fillRect(pixelX + padding, pixelY + padding, size, size);
                    
                    // Highlight
                    this.nextPieceCtx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                    this.nextPieceCtx.fillRect(pixelX + padding, pixelY + padding, size, 2);
                    this.nextPieceCtx.fillRect(pixelX + padding, pixelY + padding, 2, size);
                }
            }
        }
    }
    
    drawGameOver() {
        // Semi-transparent overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // Game Over text
        this.renderer.drawPixelText('GAME', centerX, centerY - 60, {
            color: '#FF0040',
            shadowColor: '#000000',
            font: 'bold 32px "Press Start 2P"',
            shadowOffset: 3
        });
        
        this.renderer.drawPixelText('OVER', centerX, centerY - 20, {
            color: '#FF0040',
            shadowColor: '#000000',
            font: 'bold 32px "Press Start 2P"',
            shadowOffset: 3
        });
        
        // Score
        this.renderer.drawText(`SCORE: ${this.score}`, centerX, centerY + 30, {
            color: '#FF10F0',
            font: '16px "Press Start 2P"',
            align: 'center'
        });
        
        // Lines
        this.renderer.drawText(`LINES: ${this.lines}`, centerX, centerY + 60, {
            color: '#00F0FF',
            font: '16px "Press Start 2P"',
            align: 'center'
        });
        
        // High score
        if (this.score === this.highScore && this.score > 0) {
            this.renderer.drawPixelText('NEW HIGH SCORE!', centerX, centerY - 100, {
                color: '#FFFF00',
                shadowColor: '#FF6600',
                font: '14px "Press Start 2P"',
                shadowOffset: 2
            });
        }
        
        // Instructions
        this.renderer.drawText('Press R to restart', centerX, centerY + 110, {
            color: '#39FF14',
            font: '10px "Press Start 2P"',
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
            color: '#FF10F0',
            shadowColor: '#000000',
            font: 'bold 36px "Press Start 2P"',
            shadowOffset: 3
        });
        
        // Instructions
        this.renderer.drawText('Press P to continue', centerX, centerY + 50, {
            color: '#FFFF00',
            font: '10px "Press Start 2P"',
            align: 'center'
        });
    }
    
    // ============================================
    // PARTICLES
    // ============================================
    
    spawnLineClearParticles(row) {
        const particleCount = 4; // per block
        
        for (let x = 0; x < this.cols; x++) {
            const color = this.grid[row][x] || '#FFFFFF';
            const baseX = x * this.blockSize + this.blockSize / 2;
            const baseY = row * this.blockSize + this.blockSize / 2;
            
            for (let i = 0; i < particleCount; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 80 + Math.random() * 180;
                
                this.particles.push({
                    x: baseX + (Math.random() - 0.5) * this.blockSize,
                    y: baseY + (Math.random() - 0.5) * this.blockSize,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed - 60, // slight upward bias
                    size: 2 + Math.random() * 4,
                    color: color,
                    life: 0.6 + Math.random() * 0.6,
                    maxLife: 0.6 + Math.random() * 0.6,
                    alpha: 1
                });
            }
        }
    }
    
    updateParticles(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            
            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;
            p.vy += 200 * deltaTime; // gravity
            p.life -= deltaTime;
            p.alpha = Math.max(0, p.life / p.maxLife);
            p.size *= 0.995; // slowly shrink
            
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    drawParticles() {
        this.ctx.save();
        for (const p of this.particles) {
            this.ctx.globalAlpha = p.alpha;
            this.ctx.fillStyle = p.color;
            this.ctx.shadowColor = p.color;
            this.ctx.shadowBlur = 6;
            this.ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        }
        this.ctx.restore();
    }
    
    // ============================================
    // UI UPDATES
    // ============================================
    
    updateUI() {
        this.scoreElement.textContent = this.score;
        this.linesElement.textContent = this.lines;
        this.levelElement.textContent = this.level;
        this.highScoreElement.textContent = this.highScore;
        this.updateLevelDots();
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
    
    onLevelChange(oldLevel, newLevel) {
        console.log(`📈 Level Up! Now at level ${newLevel}`);
        this.updateUI();
    }
    
    onGameOver() {
        console.log('💀 Game Over!');
        console.log(`Final Score: ${this.score}`);
        console.log(`Lines Cleared: ${this.lines}`);
        console.log(`Level Reached: ${this.level}`);
    }
    
    // ============================================
    // HIGH SCORE MANAGEMENT
    // ============================================
    
    loadHighScore() {
        const saved = localStorage.getItem('tetris_highScore');
        return saved ? parseInt(saved, 10) : 0;
    }
    
    saveHighScore() {
        localStorage.setItem('tetris_highScore', this.highScore.toString());
        console.log(`💾 High score saved: ${this.highScore}`);
    }
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🎮 Initializing Tetris...');
    
    // Create game instance
    const game = new TetrisGame();
    
    // Initialize game state (but don't start the loop yet)
    game.initializeGame();
    
    console.log('✅ Tetris ready!');
    console.log('📝 Click START or press P to begin');
});
