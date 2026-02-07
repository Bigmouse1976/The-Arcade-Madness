/**
 * The Arcade Madness - Pac-Man Game
 * Classic Pac-Man with ghost AI and mobile touch support
 */

class PacManGame extends GameEngine {
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
        this.tileSize = 20;
        this.cols = 28;
        this.rows = 31;
        
        // Game state
        this.maze = [];
        this.pellets = [];
        this.powerPellets = [];
        this.fruits = [];
        
        // Pac-Man
        this.pacman = {
            x: 14,
            y: 23,
            direction: { x: 0, y: 0 },
            nextDirection: { x: 0, y: 0 },
            speed: 0.15,
            mouthOpen: 0,
            mouthSpeed: 0.3,
            lives: 3
        };
        
        // Ghosts
        this.ghosts = [];
        this.ghostNames = ['blinky', 'pinky', 'inky', 'clyde'];
        this.ghostColors = {
            blinky: '#FF0000',
            pinky: '#FFB8FF',
            inky: '#00FFFF',
            clyde: '#FFB852'
        };
        
        // Power mode
        this.powerMode = false;
        this.powerModeTimer = 0;
        this.powerModeDuration = 8000; // 8 seconds
        this.ghostsEaten = 0;
        
        // Scoring
        this.pelletsEaten = 0;
        this.totalPellets = 0;
        this.highScore = this.loadHighScore();
        
        // Mobile touch
        this.setupTouchControls();
        
        // UI
        this.setupUI();
        
        // Controls
        this.setupControls();
        
        // Create maze
        this.createMaze();
        
        console.log('👻 Pac-Man game initialized!');
    }
    
    // ============================================
    // MAZE DEFINITION
    // ============================================
    
    createMaze() {
        // Classic Pac-Man maze layout
        // 0 = path with pellet, 1 = wall, 2 = power pellet, 3 = ghost house, 4 = empty path
        this.mazeLayout = [
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
            [1,2,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,2,1],
            [1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,0,1],
            [1,0,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,0,1],
            [1,0,0,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0,0,1],
            [1,1,1,1,1,1,0,1,1,1,1,1,4,1,1,4,1,1,1,1,1,0,1,1,1,1,1,1],
            [1,1,1,1,1,1,0,1,1,1,1,1,4,1,1,4,1,1,1,1,1,0,1,1,1,1,1,1],
            [1,1,1,1,1,1,0,1,1,4,4,4,4,4,4,4,4,4,4,1,1,0,1,1,1,1,1,1],
            [1,1,1,1,1,1,0,1,1,4,1,1,1,3,3,1,1,1,4,1,1,0,1,1,1,1,1,1],
            [1,1,1,1,1,1,0,1,1,4,1,3,3,3,3,3,3,1,4,1,1,0,1,1,1,1,1,1],
            [4,4,4,4,4,4,0,4,4,4,1,3,3,3,3,3,3,1,4,4,4,0,4,4,4,4,4,4],
            [1,1,1,1,1,1,0,1,1,4,1,3,3,3,3,3,3,1,4,1,1,0,1,1,1,1,1,1],
            [1,1,1,1,1,1,0,1,1,4,1,1,1,1,1,1,1,1,4,1,1,0,1,1,1,1,1,1],
            [1,1,1,1,1,1,0,1,1,4,4,4,4,4,4,4,4,4,4,1,1,0,1,1,1,1,1,1],
            [1,1,1,1,1,1,0,1,1,4,1,1,1,1,1,1,1,1,4,1,1,0,1,1,1,1,1,1],
            [1,1,1,1,1,1,0,1,1,4,1,1,1,1,1,1,1,1,4,1,1,0,1,1,1,1,1,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
            [1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
            [1,2,0,0,1,1,0,0,0,0,0,0,0,4,4,0,0,0,0,0,0,0,1,1,0,0,2,1],
            [1,1,1,0,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,0,1,1,1],
            [1,1,1,0,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,0,1,1,1],
            [1,0,0,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0,0,1],
            [1,0,1,1,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,1,1,0,1],
            [1,0,1,1,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,1,1,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
        ];
        
        this.parseMaze();
    }
    
    parseMaze() {
        this.maze = [];
        this.pellets = [];
        this.powerPellets = [];
        this.totalPellets = 0;
        
        for (let y = 0; y < this.mazeLayout.length; y++) {
            this.maze[y] = [];
            for (let x = 0; x < this.mazeLayout[y].length; x++) {
                const tile = this.mazeLayout[y][x];
                this.maze[y][x] = tile;
                
                if (tile === 0) {
                    // Regular pellet
                    this.pellets.push({ x, y, eaten: false });
                    this.totalPellets++;
                } else if (tile === 2) {
                    // Power pellet
                    this.powerPellets.push({ x, y, eaten: false });
                    this.totalPellets++;
                }
            }
        }
    }
    
    // ============================================
    // INITIALIZATION
    // ============================================
    
    setupUI() {
        this.scoreElement = document.getElementById('score');
        this.highScoreElement = document.getElementById('highScore');
        this.levelElement = document.getElementById('level');
        this.livesElement = document.getElementById('lives');
        
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
        
        this.updateUI();
    }
    
    setupTouchControls() {
        // D-pad buttons
        const dpadButtons = document.querySelectorAll('.dpad-btn[data-direction]');
        dpadButtons.forEach(btn => {
            const direction = btn.dataset.direction;
            
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.handleTouchDirection(direction);
            });
            
            btn.addEventListener('click', () => {
                this.handleTouchDirection(direction);
            });
        });
        
        // Pause button (touch)
        const pauseTouch = document.getElementById('pauseTouch');
        if (pauseTouch) {
            pauseTouch.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (!this.isRunning) {
                    this.start();
                } else {
                    this.pause();
                }
            });
        }
    }
    
    handleTouchDirection(direction) {
        const directionMap = {
            'up': { x: 0, y: -1 },
            'down': { x: 0, y: 1 },
            'left': { x: -1, y: 0 },
            'right': { x: 1, y: 0 }
        };
        
        this.pacman.nextDirection = directionMap[direction];
    }
    
    setupControls() {
        // Arrow keys
        this.input.bind('ArrowUp', () => this.pacman.nextDirection = { x: 0, y: -1 });
        this.input.bind('ArrowDown', () => this.pacman.nextDirection = { x: 0, y: 1 });
        this.input.bind('ArrowLeft', () => this.pacman.nextDirection = { x: -1, y: 0 });
        this.input.bind('ArrowRight', () => this.pacman.nextDirection = { x: 1, y: 0 });
        
        // WASD
        this.input.bind('KeyW', () => this.pacman.nextDirection = { x: 0, y: -1 });
        this.input.bind('KeyS', () => this.pacman.nextDirection = { x: 0, y: 1 });
        this.input.bind('KeyA', () => this.pacman.nextDirection = { x: -1, y: 0 });
        this.input.bind('KeyD', () => this.pacman.nextDirection = { x: 1, y: 0 });
        
        // Pause
        this.input.bind('Space', () => {
            if (!this.isRunning) {
                this.start();
            } else {
                this.pause();
            }
        });
        
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
        // Reset Pac-Man
        this.pacman.x = 14;
        this.pacman.y = 23;
        this.pacman.direction = { x: 0, y: 0 };
        this.pacman.nextDirection = { x: 0, y: 0 };
        this.pacman.lives = 3;
        this.pacman.mouthOpen = 0;
        
        // Reset maze and pellets
        this.parseMaze();
        this.pelletsEaten = 0;
        
        // Reset ghosts
        this.initializeGhosts();
        
        // Reset power mode
        this.powerMode = false;
        this.powerModeTimer = 0;
        this.ghostsEaten = 0;
        
        // Update UI
        this.updateUI();
        
        console.log('👻 Pac-Man initialized - Wakka wakka!');
    }
    
    initializeGhosts() {
        this.ghosts = [];
        
        const startPositions = [
            { x: 14, y: 11, name: 'blinky', releaseTime: 0 }, // Red - starts outside
            { x: 13, y: 14, name: 'pinky', releaseTime: 2000 },  // Pink - 2 seconds
            { x: 14, y: 14, name: 'inky', releaseTime: 4000 },   // Cyan - 4 seconds
            { x: 15, y: 14, name: 'clyde', releaseTime: 6000 }   // Orange - 6 seconds
        ];
        
        this.gameStartTime = performance.now();
        
        startPositions.forEach(pos => {
            this.ghosts.push({
                x: pos.x,
                y: pos.y,
                name: pos.name,
                color: this.ghostColors[pos.name],
                direction: { x: 0, y: -1 },
                speed: 0.1,
                mode: 'chase',
                targetX: 0,
                targetY: 0,
                inHouse: pos.name !== 'blinky',
                releaseTime: pos.releaseTime,
                modeTimer: 0,
                scatterTimer: 7000 // Start in scatter for 7 seconds
            });
        });
    }
    
    update(deltaTime) {
        if (this.gameOver) return;
        
        // Update power mode timer
        if (this.powerMode) {
            this.powerModeTimer -= deltaTime * 1000;
            if (this.powerModeTimer <= 0) {
                this.endPowerMode();
            }
        }
        
        // Update Pac-Man
        this.updatePacMan(deltaTime);
        
        // Update ghosts
        this.updateGhosts(deltaTime);
        
        // Check collisions
        this.checkCollisions();
        
        // Check win condition
        if (this.pelletsEaten >= this.totalPellets) {
            this.nextLevel();
        }
    }
    
    updatePacMan(deltaTime) {
        // Try to change direction if requested
        const nextX = this.pacman.x + this.pacman.nextDirection.x * 0.5;
        const nextY = this.pacman.y + this.pacman.nextDirection.y * 0.5;
        
        if (this.canMove(Math.round(nextX), Math.round(nextY))) {
            this.pacman.direction = { ...this.pacman.nextDirection };
        }
        
        // Move in current direction
        const moveSpeed = this.pacman.speed * deltaTime * 60;
        let newX = this.pacman.x + this.pacman.direction.x * moveSpeed;
        let newY = this.pacman.y + this.pacman.direction.y * moveSpeed;
        
        // Align to grid when turning to prevent getting stuck
        if (this.pacman.direction.x !== 0) {
            // Moving horizontally, align Y to grid
            const targetY = Math.round(this.pacman.y);
            if (Math.abs(this.pacman.y - targetY) < 0.1) {
                newY = targetY;
            } else if (Math.abs(this.pacman.y - targetY) < moveSpeed) {
                newY = targetY;
            }
        } else if (this.pacman.direction.y !== 0) {
            // Moving vertically, align X to grid
            const targetX = Math.round(this.pacman.x);
            if (Math.abs(this.pacman.x - targetX) < 0.1) {
                newX = targetX;
            } else if (Math.abs(this.pacman.x - targetX) < moveSpeed) {
                newX = targetX;
            }
        }
        
        // Check if new position is valid
        if (this.canMove(Math.floor(newX), Math.floor(newY)) &&
            this.canMove(Math.ceil(newX), Math.ceil(newY))) {
            this.pacman.x = newX;
            this.pacman.y = newY;
        } else {
            // Snap to grid to prevent getting stuck
            if (this.pacman.direction.x !== 0) {
                this.pacman.y = Math.round(this.pacman.y);
            } else if (this.pacman.direction.y !== 0) {
                this.pacman.x = Math.round(this.pacman.x);
            }
        }
        
        // Wrap around tunnels
        if (this.pacman.x < 0) this.pacman.x = this.cols - 1;
        if (this.pacman.x >= this.cols) this.pacman.x = 0;
        
        // Animate mouth (slower)
        if (this.pacman.direction.x !== 0 || this.pacman.direction.y !== 0) {
            this.pacman.mouthOpen += this.pacman.mouthSpeed * deltaTime * 10; // Much slower
            if (this.pacman.mouthOpen > 1) this.pacman.mouthOpen = 0;
        } else {
            this.pacman.mouthOpen = 0.5; // Keep mouth half open when stopped
        }
    }
    
    canMove(x, y) {
        const tileX = Math.floor(x);
        const tileY = Math.floor(y);
        
        if (tileY < 0 || tileY >= this.rows || tileX < 0 || tileX >= this.cols) {
            return false;
        }
        
        const tile = this.maze[tileY][tileX];
        return tile !== 1; // Not a wall
    }
    
    // Continued in next part...
    // ============================================
    // GHOST AI
    // ============================================
    
    updateGhosts(deltaTime) {
        const currentTime = performance.now() - this.gameStartTime;
        
        this.ghosts.forEach(ghost => {
            // Release ghosts from house based on timer
            if (ghost.inHouse) {
                if (currentTime >= ghost.releaseTime) {
                    // Move ghost upward to exit house
                    if (ghost.y > 11) {
                        ghost.y -= ghost.speed * deltaTime * 60;
                        ghost.direction = { x: 0, y: -1 };
                        return; // Skip other logic while exiting
                    } else {
                        ghost.inHouse = false;
                    }
                } else {
                    return; // Stay in house
                }
            }
            
            // Handle mode switching (scatter <-> chase)
            if (!this.powerMode) {
                ghost.modeTimer += deltaTime * 1000;
                
                if (ghost.mode === 'scatter' && ghost.modeTimer >= ghost.scatterTimer) {
                    ghost.mode = 'chase';
                    ghost.modeTimer = 0;
                } else if (ghost.mode === 'chase' && ghost.modeTimer >= 20000) {
                    // Switch back to scatter every 20 seconds
                    ghost.mode = 'scatter';
                    ghost.scatterTimer = 5000;
                    ghost.modeTimer = 0;
                }
            }
            
            // Set target based on mode and personality
            this.setGhostTarget(ghost);
            
            // Move ghost
            this.moveGhost(ghost, deltaTime);
        });
    }
    
    setGhostTarget(ghost) {
        if (this.powerMode && ghost.mode !== 'frightened') {
            ghost.mode = 'frightened';
        } else if (!this.powerMode && ghost.mode === 'frightened') {
            ghost.mode = 'chase';
        }
        
        const pacX = Math.round(this.pacman.x);
        const pacY = Math.round(this.pacman.y);
        
        if (ghost.mode === 'frightened') {
            // Run away from Pac-Man
            ghost.targetX = ghost.x < pacX ? 0 : this.cols - 1;
            ghost.targetY = ghost.y < pacY ? 0 : this.rows - 1;
        } else if (ghost.mode === 'chase') {
            // Each ghost has unique targeting
            switch(ghost.name) {
                case 'blinky': // Chases Pac-Man directly
                    ghost.targetX = pacX;
                    ghost.targetY = pacY;
                    break;
                    
                case 'pinky': // Targets 4 tiles ahead of Pac-Man
                    ghost.targetX = pacX + this.pacman.direction.x * 4;
                    ghost.targetY = pacY + this.pacman.direction.y * 4;
                    break;
                    
                case 'inky': // Complex targeting
                    ghost.targetX = pacX + this.pacman.direction.x * 2;
                    ghost.targetY = pacY + this.pacman.direction.y * 2;
                    break;
                    
                case 'clyde': // Random/scared behavior
                    const dist = Math.sqrt(
                        Math.pow(ghost.x - pacX, 2) + 
                        Math.pow(ghost.y - pacY, 2)
                    );
                    if (dist > 8) {
                        ghost.targetX = pacX;
                        ghost.targetY = pacY;
                    } else {
                        ghost.targetX = 0;
                        ghost.targetY = this.rows - 1;
                    }
                    break;
            }
        } else {
            // Scatter mode - go to corners
            const corners = {
                blinky: { x: this.cols - 2, y: 0 },
                pinky: { x: 2, y: 0 },
                inky: { x: this.cols - 2, y: this.rows - 2 },
                clyde: { x: 2, y: this.rows - 2 }
            };
            const corner = corners[ghost.name];
            ghost.targetX = corner.x;
            ghost.targetY = corner.y;
        }
    }
    
    moveGhost(ghost, deltaTime) {
        const currentTileX = Math.round(ghost.x);
        const currentTileY = Math.round(ghost.y);
        
        // Check if ghost is at tile center
        const atCenter = Math.abs(ghost.x - currentTileX) < 0.15 && 
                         Math.abs(ghost.y - currentTileY) < 0.15;
        
        if (atCenter) {
            // Snap to center
            ghost.x = currentTileX;
            ghost.y = currentTileY;
            
            // Choose new direction
            const possibleDirs = [
                { x: 0, y: -1, priority: 0 }, // up
                { x: 0, y: 1, priority: 0 },  // down
                { x: -1, y: 0, priority: 0 }, // left
                { x: 1, y: 0, priority: 0 }   // right
            ];
            
            let validDirs = [];
            
            possibleDirs.forEach(dir => {
                // Don't reverse direction (classic Pac-Man rule)
                if (dir.x === -ghost.direction.x && dir.y === -ghost.direction.y) {
                    return;
                }
                
                const nextX = currentTileX + dir.x;
                const nextY = currentTileY + dir.y;
                
                if (this.canMove(nextX, nextY)) {
                    // Calculate distance to target
                    const dist = Math.sqrt(
                        Math.pow(nextX - ghost.targetX, 2) + 
                        Math.pow(nextY - ghost.targetY, 2)
                    );
                    
                    validDirs.push({
                        dir: dir,
                        dist: dist
                    });
                }
            });
            
            // Sort by distance and pick best direction
            if (validDirs.length > 0) {
                validDirs.sort((a, b) => a.dist - b.dist);
                ghost.direction = validDirs[0].dir;
            } else if (this.canMove(currentTileX + ghost.direction.x, currentTileY + ghost.direction.y)) {
                // Keep current direction
            } else {
                // Reverse if stuck
                ghost.direction = { x: -ghost.direction.x, y: -ghost.direction.y };
            }
        }
        
        // Move ghost
        const speed = ghost.mode === 'frightened' ? ghost.speed * 0.5 : ghost.speed;
        ghost.x += ghost.direction.x * speed * deltaTime * 60;
        ghost.y += ghost.direction.y * speed * deltaTime * 60;
        
        // Wrap around
        if (ghost.x < 0) ghost.x = this.cols - 1;
        if (ghost.x >= this.cols) ghost.x = 0;
    }
    
    // ============================================
    // COLLISIONS
    // ============================================
    
    checkCollisions() {
        const pacX = Math.round(this.pacman.x);
        const pacY = Math.round(this.pacman.y);
        
        // Check pellets
        this.pellets.forEach(pellet => {
            if (!pellet.eaten && pellet.x === pacX && pellet.y === pacY) {
                pellet.eaten = true;
                this.pelletsEaten++;
                this.addScore(10);
            }
        });
        
        // Check power pellets
        this.powerPellets.forEach(pellet => {
            if (!pellet.eaten && pellet.x === pacX && pellet.y === pacY) {
                pellet.eaten = true;
                this.pelletsEaten++;
                this.addScore(50);
                this.startPowerMode();
            }
        });
        
        // Check ghosts
        this.ghosts.forEach(ghost => {
            const dist = Math.sqrt(
                Math.pow(ghost.x - this.pacman.x, 2) + 
                Math.pow(ghost.y - this.pacman.y, 2)
            );
            
            if (dist < 0.5) {
                if (this.powerMode) {
                    // Eat ghost
                    this.eatGhost(ghost);
                } else {
                    // Lose life
                    this.loseLife();
                }
            }
        });
    }
    
    startPowerMode() {
        this.powerMode = true;
        this.powerModeTimer = this.powerModeDuration;
        this.ghostsEaten = 0;
        console.log('⚡ POWER MODE!');
    }
    
    endPowerMode() {
        this.powerMode = false;
        this.ghosts.forEach(ghost => {
            if (ghost.mode === 'frightened') {
                ghost.mode = 'chase';
            }
        });
        console.log('Power mode ended');
    }
    
    eatGhost(ghost) {
        this.ghostsEaten++;
        const points = 200 * Math.pow(2, this.ghostsEaten - 1);
        this.addScore(points);
        
        // Respawn ghost in house
        ghost.x = 14;
        ghost.y = 14;
        ghost.inHouse = true;
        ghost.mode = 'chase';
        ghost.direction = { x: 0, y: -1 };
        ghost.releaseTime = 3000; // Release after 3 seconds
        this.gameStartTime = performance.now(); // Reset timer for this ghost
        
        console.log(`Ghost eaten! +${points} points`);
    }
    
    loseLife() {
        this.pacman.lives--;
        
        if (this.pacman.lives <= 0) {
            this.endGame();
        } else {
            // Reset positions
            this.pacman.x = 14;
            this.pacman.y = 23;
            this.pacman.direction = { x: 0, y: 0 };
            this.pacman.nextDirection = { x: 0, y: 0 };
            
            this.initializeGhosts();
            this.endPowerMode();
        }
        
        this.updateUI();
        console.log(`💔 Life lost! ${this.pacman.lives} lives remaining`);
    }
    
    nextLevel() {
        this.setLevel(this.level + 1);
        this.parseMaze();
        this.pelletsEaten = 0;
        
        // Reset positions
        this.pacman.x = 14;
        this.pacman.y = 23;
        this.pacman.direction = { x: 0, y: 0 };
        this.pacman.nextDirection = { x: 0, y: 0 };
        
        // Increase ghost speed
        this.ghosts.forEach(ghost => {
            ghost.speed = Math.min(0.2, 0.1 + this.level * 0.02);
        });
        
        this.initializeGhosts();
        
        console.log(`🎉 Level ${this.level}!`);
    }
    
    // Continued in rendering...
    
    // ============================================
    // RENDERING
    // ============================================
    
    render() {
        // Draw maze
        this.drawMaze();
        
        // Draw pellets
        this.drawPellets();
        
        // Draw Pac-Man
        this.drawPacMan();
        
        // Draw ghosts
        this.drawGhosts();
        
        // Draw game over
        if (this.gameOver) {
            this.drawGameOver();
        }
    }
    
    drawMaze() {
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                const tile = this.maze[y][x];
                
                if (tile === 1) {
                    // Wall
                    this.ctx.fillStyle = '#0000FF';
                    this.ctx.fillRect(
                        x * this.tileSize + 1,
                        y * this.tileSize + 1,
                        this.tileSize - 2,
                        this.tileSize - 2
                    );
                }
            }
        }
    }
    
    drawPellets() {
        // Regular pellets
        this.pellets.forEach(pellet => {
            if (!pellet.eaten) {
                this.ctx.fillStyle = '#FFB8AE';
                this.ctx.beginPath();
                this.ctx.arc(
                    pellet.x * this.tileSize + this.tileSize / 2,
                    pellet.y * this.tileSize + this.tileSize / 2,
                    2,
                    0,
                    Math.PI * 2
                );
                this.ctx.fill();
            }
        });
        
        // Power pellets (flashing)
        const flash = Math.sin(Date.now() / 200) > 0;
        if (flash) {
            this.powerPellets.forEach(pellet => {
                if (!pellet.eaten) {
                    this.ctx.fillStyle = '#FFB8AE';
                    this.ctx.beginPath();
                    this.ctx.arc(
                        pellet.x * this.tileSize + this.tileSize / 2,
                        pellet.y * this.tileSize + this.tileSize / 2,
                        6,
                        0,
                        Math.PI * 2
                    );
                    this.ctx.fill();
                }
            });
        }
    }
    
    drawPacMan() {
        const centerX = this.pacman.x * this.tileSize + this.tileSize / 2;
        const centerY = this.pacman.y * this.tileSize + this.tileSize / 2;
        const radius = this.tileSize / 2 - 2;
        
        // Determine mouth angle based on direction
        let startAngle = 0;
        let endAngle = Math.PI * 2;
        
        const mouthAngle = Math.PI / 4 * Math.abs(Math.sin(this.pacman.mouthOpen * Math.PI));
        
        if (this.pacman.direction.x > 0) {
            startAngle = mouthAngle;
            endAngle = Math.PI * 2 - mouthAngle;
        } else if (this.pacman.direction.x < 0) {
            startAngle = Math.PI + mouthAngle;
            endAngle = Math.PI - mouthAngle;
        } else if (this.pacman.direction.y < 0) {
            startAngle = -Math.PI / 2 + mouthAngle;
            endAngle = -Math.PI / 2 - mouthAngle + Math.PI * 2;
        } else if (this.pacman.direction.y > 0) {
            startAngle = Math.PI / 2 + mouthAngle;
            endAngle = Math.PI / 2 - mouthAngle + Math.PI * 2;
        }
        
        this.ctx.fillStyle = '#FFFF00';
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        this.ctx.lineTo(centerX, centerY);
        this.ctx.fill();
    }
    
    drawGhosts() {
        this.ghosts.forEach(ghost => {
            const centerX = ghost.x * this.tileSize + this.tileSize / 2;
            const centerY = ghost.y * this.tileSize + this.tileSize / 2;
            const radius = this.tileSize / 2 - 2;
            
            // Choose color
            let color = ghost.color;
            if (ghost.mode === 'frightened') {
                const flash = this.powerModeTimer < 2000 && Math.sin(Date.now() / 100) > 0;
                color = flash ? '#FFFFFF' : '#0000FF';
            }
            
            // Draw body (semi-circle)
            this.ctx.fillStyle = color;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, radius, Math.PI, 0, false);
            this.ctx.lineTo(centerX + radius, centerY + radius);
            
            // Wavy bottom
            const waveCount = 3;
            for (let i = 0; i < waveCount; i++) {
                const waveX = centerX + radius - (i * (radius * 2 / waveCount));
                const waveY = centerY + radius + (i % 2 === 0 ? 3 : -3);
                this.ctx.lineTo(waveX, waveY);
            }
            
            this.ctx.lineTo(centerX - radius, centerY + radius);
            this.ctx.closePath();
            this.ctx.fill();
            
            // Draw eyes
            if (ghost.mode !== 'frightened' || this.powerModeTimer > 2000) {
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.beginPath();
                this.ctx.arc(centerX - 4, centerY - 2, 3, 0, Math.PI * 2);
                this.ctx.arc(centerX + 4, centerY - 2, 3, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Pupils
                this.ctx.fillStyle = '#0000FF';
                const pupilX = ghost.direction.x * 1;
                const pupilY = ghost.direction.y * 1;
                this.ctx.beginPath();
                this.ctx.arc(centerX - 4 + pupilX, centerY - 2 + pupilY, 1.5, 0, Math.PI * 2);
                this.ctx.arc(centerX + 4 + pupilX, centerY - 2 + pupilY, 1.5, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
    }
    
    drawGameOver() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        this.renderer.drawPixelText('GAME OVER', centerX, centerY - 40, {
            color: '#FF0040',
            shadowColor: '#000000',
            font: 'bold 28px "Press Start 2P"',
            shadowOffset: 3
        });
        
        this.renderer.drawText(`SCORE: ${this.score}`, centerX, centerY + 10, {
            color: '#FFFF00',
            font: '16px "Press Start 2P"',
            align: 'center'
        });
        
        if (this.score === this.highScore && this.score > 0) {
            this.renderer.drawPixelText('NEW HIGH SCORE!', centerX, centerY - 80, {
                color: '#39FF14',
                shadowColor: '#000000',
                font: '12px "Press Start 2P"',
                shadowOffset: 2
            });
        }
        
        this.renderer.drawText('Press R to restart', centerX, centerY + 60, {
            color: '#00F0FF',
            font: '10px "Press Start 2P"',
            align: 'center'
        });
    }
    
    renderPauseScreen() {
        this.render();
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        this.renderer.drawPixelText('PAUSED', centerX, centerY, {
            color: '#FFFF00',
            shadowColor: '#000000',
            font: 'bold 32px "Press Start 2P"',
            shadowOffset: 3
        });
        
        this.renderer.drawText('Press P to continue', centerX, centerY + 50, {
            color: '#00F0FF',
            font: '10px "Press Start 2P"',
            align: 'center'
        });
    }
    
    // ============================================
    // UI UPDATES
    // ============================================
    
    updateUI() {
        this.scoreElement.textContent = this.score;
        this.highScoreElement.textContent = this.highScore;
        this.levelElement.textContent = this.level;
        
        // Update lives display
        this.livesElement.innerHTML = '';
        for (let i = 0; i < this.pacman.lives; i++) {
            const lifeIcon = document.createElement('div');
            lifeIcon.className = 'life-icon';
            this.livesElement.appendChild(lifeIcon);
        }
    }
    
    // ============================================
    // LIFECYCLE HOOKS
    // ============================================
    
    onScoreChange(newScore, points) {
        if (newScore > this.highScore) {
            this.highScore = newScore;
            this.saveHighScore();
        }
        this.updateUI();
    }
    
    onGameOver() {
        console.log('💀 Game Over!');
        console.log(`Final Score: ${this.score}`);
        console.log(`Level Reached: ${this.level}`);
    }
    
    // ============================================
    // HIGH SCORE MANAGEMENT
    // ============================================
    
    loadHighScore() {
        const saved = localStorage.getItem('pacman_highScore');
        return saved ? parseInt(saved, 10) : 0;
    }
    
    saveHighScore() {
        localStorage.setItem('pacman_highScore', this.highScore.toString());
        console.log(`💾 High score saved: ${this.highScore}`);
    }
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('👻 Initializing Pac-Man...');
    
    const game = new PacManGame();
    
    console.log('✅ Pac-Man ready!');
    console.log('📝 Click START or press P to begin');
    console.log('🎮 Use arrow keys or touch controls to move');
});
