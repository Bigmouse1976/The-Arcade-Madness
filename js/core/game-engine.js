/**
 * The Arcade Madness - Core Game Engine
 * Base class for all games with game loop, state management, and utilities
 */

class GameEngine {
    constructor(canvasId, options = {}) {
        // Canvas setup
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            throw new Error(`Canvas with id "${canvasId}" not found`);
        }
        
        this.ctx = this.canvas.getContext('2d');
        
        // Game loop properties
        this.lastFrameTime = 0;
        this.deltaTime = 0;
        this.isRunning = false;
        this.isPaused = false;
        this.animationFrameId = null;
        
        // FPS settings
        this.targetFPS = options.targetFPS || 60;
        this.frameInterval = 1000 / this.targetFPS;
        this.fpsUpdateInterval = 500; // Update FPS display every 500ms
        this.lastFpsUpdate = 0;
        this.frameCount = 0;
        this.currentFPS = 0;
        
        // Game state
        this.state = options.initialState || 'loading';
        this.score = 0;
        this.level = 1;
        this.gameOver = false;
        
        // Canvas settings
        this.backgroundColor = options.backgroundColor || '#000000';
        this.enableSmoothing = options.enableSmoothing !== undefined ? options.enableSmoothing : false;
        
        // Debug mode
        this.debug = options.debug || false;
        
        // Initialize
        this.init();
    }
    
    init() {
        // Set canvas rendering quality
        this.ctx.imageSmoothingEnabled = this.enableSmoothing;
        
        // Prevent context menu on right click
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Handle visibility change (pause when tab is hidden)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.isRunning && !this.isPaused) {
                this.pause();
            }
        });
        
        console.log(`🎮 GameEngine initialized - Target FPS: ${this.targetFPS}`);
    }
    
    // ============================================
    // GAME LOOP
    // ============================================
    
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.isPaused = false;
        this.gameOver = false;
        this.lastFrameTime = performance.now();
        this.lastFpsUpdate = performance.now();
        this.frameCount = 0;
        
        this.onStart();
        this.loop(this.lastFrameTime);
        
        console.log('🎮 Game started');
    }
    
    loop(currentTime) {
        if (!this.isRunning) return;
        
        // Calculate delta time
        this.deltaTime = currentTime - this.lastFrameTime;
        
        // Frame rate limiting
        if (this.deltaTime >= this.frameInterval) {
            this.lastFrameTime = currentTime - (this.deltaTime % this.frameInterval);
            
            // FPS calculation
            this.frameCount++;
            const timeSinceLastFpsUpdate = currentTime - this.lastFpsUpdate;
            if (timeSinceLastFpsUpdate >= this.fpsUpdateInterval) {
                this.currentFPS = Math.round((this.frameCount * 1000) / timeSinceLastFpsUpdate);
                this.frameCount = 0;
                this.lastFpsUpdate = currentTime;
            }
            
            if (!this.isPaused) {
                // Update game logic
                this.update(this.deltaTime / 1000); // Convert to seconds
                
                // Clear canvas
                this.clear();
                
                // Render game
                this.render();
                
                // Debug info
                if (this.debug) {
                    this.renderDebugInfo();
                }
            } else {
                // Render pause screen
                this.renderPauseScreen();
            }
        }
        
        // Continue loop
        this.animationFrameId = requestAnimationFrame((time) => this.loop(time));
    }
    
    pause() {
        this.isPaused = !this.isPaused;
        this.onPause(this.isPaused);
        console.log(this.isPaused ? '⏸️  Game paused' : '▶️  Game resumed');
    }
    
    stop() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        this.isPaused = false;
        
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        this.onStop();
        console.log('🛑 Game stopped');
    }
    
    restart() {
        this.stop();
        this.reset();
        this.start();
        console.log('🔄 Game restarted');
    }
    
    reset() {
        this.score = 0;
        this.level = 1;
        this.gameOver = false;
        this.state = 'playing';
        this.onReset();
    }
    
    // ============================================
    // CANVAS UTILITIES
    // ============================================
    
    clear() {
        this.ctx.fillStyle = this.backgroundColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    setCanvasSize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.ctx.imageSmoothingEnabled = this.enableSmoothing;
    }
    
    getCanvasCenter() {
        return {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2
        };
    }
    
    // ============================================
    // STATE MANAGEMENT
    // ============================================
    
    setState(newState) {
        const oldState = this.state;
        this.state = newState;
        this.onStateChange(oldState, newState);
    }
    
    addScore(points) {
        this.score += points;
        this.onScoreChange(this.score, points);
    }
    
    setLevel(level) {
        const oldLevel = this.level;
        this.level = level;
        this.onLevelChange(oldLevel, level);
    }
    
    endGame() {
        this.gameOver = true;
        this.setState('gameover');
        this.onGameOver();
        console.log(`💀 Game Over - Final Score: ${this.score}`);
    }
    
    // ============================================
    // DEBUG UTILITIES
    // ============================================
    
    renderDebugInfo() {
        this.ctx.save();
        this.ctx.fillStyle = '#00FF00';
        this.ctx.font = '12px monospace';
        this.ctx.textAlign = 'left';
        
        const debugInfo = [
            `FPS: ${this.currentFPS}`,
            `Delta: ${this.deltaTime.toFixed(2)}ms`,
            `State: ${this.state}`,
            `Score: ${this.score}`,
            `Level: ${this.level}`,
        ];
        
        debugInfo.forEach((info, index) => {
            this.ctx.fillText(info, 10, 20 + (index * 15));
        });
        
        this.ctx.restore();
    }
    
    toggleDebug() {
        this.debug = !this.debug;
        console.log(`🐛 Debug mode: ${this.debug ? 'ON' : 'OFF'}`);
    }
    
    // ============================================
    // RENDER HELPERS
    // ============================================
    
    renderPauseScreen() {
        this.render(); // Render current game state
        
        // Semi-transparent overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Pause text
        const center = this.getCanvasCenter();
        this.ctx.fillStyle = '#00F0FF';
        this.ctx.font = 'bold 48px "Press Start 2P", monospace';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('PAUSED', center.x, center.y);
        
        // Instructions
        this.ctx.font = '16px "Press Start 2P", monospace';
        this.ctx.fillStyle = '#FFFF00';
        this.ctx.fillText('Press SPACE to continue', center.x, center.y + 60);
    }
    
    renderGameOver() {
        // Semi-transparent overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        const center = this.getCanvasCenter();
        
        // Game Over text
        this.ctx.fillStyle = '#FF0040';
        this.ctx.font = 'bold 48px "Press Start 2P", monospace';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('GAME OVER', center.x, center.y - 40);
        
        // Score
        this.ctx.font = '24px "Press Start 2P", monospace';
        this.ctx.fillStyle = '#00F0FF';
        this.ctx.fillText(`Score: ${this.score}`, center.x, center.y + 20);
        
        // Instructions
        this.ctx.font = '16px "Press Start 2P", monospace';
        this.ctx.fillStyle = '#FFFF00';
        this.ctx.fillText('Press ENTER to restart', center.x, center.y + 80);
    }
    
    // ============================================
    // LIFECYCLE HOOKS (Override in child classes)
    // ============================================
    
    update(deltaTime) {
        // Override this method in child classes
        // deltaTime is in seconds (e.g., 0.016 for 60fps)
    }
    
    render() {
        // Override this method in child classes
    }
    
    onStart() {
        // Called when game starts
    }
    
    onStop() {
        // Called when game stops
    }
    
    onReset() {
        // Called when game resets
    }
    
    onPause(isPaused) {
        // Called when game is paused/unpaused
    }
    
    onStateChange(oldState, newState) {
        // Called when game state changes
    }
    
    onScoreChange(newScore, points) {
        // Called when score changes
    }
    
    onLevelChange(oldLevel, newLevel) {
        // Called when level changes
    }
    
    onGameOver() {
        // Called when game ends
    }
    
    // ============================================
    // UTILITY METHODS
    // ============================================
    
    getElapsedTime() {
        return performance.now() - this.lastFrameTime;
    }
    
    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }
    
    lerp(start, end, t) {
        return start + (end - start) * t;
    }
    
    distance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    randomFloat(min, max) {
        return Math.random() * (max - min) + min;
    }
    
    randomChoice(array) {
        return array[Math.floor(Math.random() * array.length)];
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameEngine;
}
