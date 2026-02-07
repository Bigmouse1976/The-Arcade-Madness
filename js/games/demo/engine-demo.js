/**
 * The Arcade Madness - Core Engine Demo
 * Example showing how to use GameEngine, InputHandler, Renderer, CollisionDetector, and AudioManager
 */

class EngineDemo extends GameEngine {
    constructor() {
        super('demoCanvas', {
            targetFPS: 60,
            backgroundColor: '#000000',
            debug: true
        });
        
        // Initialize components
        this.input = new InputHandler({ canvas: this.canvas });
        this.renderer = new Renderer(this.ctx);
        this.collision = new CollisionDetector();
        this.audio = new AudioManager();
        
        // Game objects
        this.player = {
            x: 100,
            y: 100,
            width: 30,
            height: 30,
            speed: 200,
            color: '#00F0FF'
        };
        
        this.obstacles = [
            { x: 200, y: 150, width: 50, height: 50, color: '#FF10F0' },
            { x: 350, y: 200, width: 50, height: 50, color: '#FFFF00' },
            { x: 150, y: 300, width: 80, height: 30, color: '#39FF14' }
        ];
        
        this.collectibles = [
            { x: 300, y: 100, radius: 15, color: '#FF6600', collected: false },
            { x: 450, y: 250, radius: 15, color: '#9D00FF', collected: false },
            { x: 250, y: 350, radius: 15, color: '#FF0040', collected: false }
        ];
        
        this.particles = [];
        
        // Setup key bindings
        this.setupBindings();
    }
    
    setupBindings() {
        // Pause on Space
        this.input.bind('Space', () => this.pause());
        
        // Debug toggle on D
        this.input.bind('KeyD', () => this.toggleDebug());
        
        // Mute on M
        this.input.bind('KeyM', () => this.audio.toggleMute());
    }
    
    // ============================================
    // GAME LOGIC
    // ============================================
    
    update(deltaTime) {
        // Handle input and move player
        this.updatePlayer(deltaTime);
        
        // Check collisions
        this.checkCollisions();
        
        // Update particles
        this.updateParticles(deltaTime);
        
        // Update gamepad
        this.input.updateGamepad();
    }
    
    updatePlayer(deltaTime) {
        const direction = this.input.getDirection();
        const speed = this.player.speed * deltaTime;
        
        // Store old position
        const oldX = this.player.x;
        const oldY = this.player.y;
        
        // Move based on input
        if (direction === 'up') this.player.y -= speed;
        if (direction === 'down') this.player.y += speed;
        if (direction === 'left') this.player.x -= speed;
        if (direction === 'right') this.player.x += speed;
        
        // Check collision with obstacles
        let collided = false;
        for (const obstacle of this.obstacles) {
            if (this.collision.rectRect(this.player, obstacle)) {
                collided = true;
                break;
            }
        }
        
        // Revert if collision
        if (collided) {
            this.player.x = oldX;
            this.player.y = oldY;
        }
        
        // Keep player in bounds
        this.player.x = Math.max(0, Math.min(this.canvas.width - this.player.width, this.player.x));
        this.player.y = Math.max(0, Math.min(this.canvas.height - this.player.height, this.player.y));
    }
    
    checkCollisions() {
        const playerCenter = {
            x: this.player.x + this.player.width / 2,
            y: this.player.y + this.player.height / 2
        };
        
        // Check collectibles
        for (const collectible of this.collectibles) {
            if (!collectible.collected && 
                this.collision.pointCircle(playerCenter.x, playerCenter.y, collectible)) {
                collectible.collected = true;
                this.addScore(10);
                this.createParticleExplosion(collectible.x, collectible.y, collectible.color);
                console.log('💎 Collectible collected! Score:', this.score);
            }
        }
    }
    
    updateParticles(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            
            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;
            p.life -= deltaTime;
            p.alpha = p.life / p.maxLife;
            
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    createParticleExplosion(x, y, color) {
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 50 + Math.random() * 100;
            
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 3 + Math.random() * 3,
                color: color,
                life: 1,
                maxLife: 1,
                alpha: 1
            });
        }
    }
    
    // ============================================
    // RENDERING
    // ============================================
    
    render() {
        // Draw obstacles
        for (const obstacle of this.obstacles) {
            this.renderer.draw3DTile(
                Math.floor(obstacle.x / 50),
                Math.floor(obstacle.y / 50),
                50,
                obstacle.color,
                2
            );
        }
        
        // Draw collectibles
        for (const collectible of this.collectibles) {
            if (!collectible.collected) {
                this.renderer.drawWithGlow(() => {
                    this.renderer.drawCircle(
                        collectible.x,
                        collectible.y,
                        collectible.radius,
                        collectible.color
                    );
                }, collectible.color, 20);
            }
        }
        
        // Draw player
        this.renderer.drawWithGlow(() => {
            this.renderer.drawRoundedRect(
                this.player.x,
                this.player.y,
                this.player.width,
                this.player.height,
                5,
                this.player.color,
                true
            );
        }, this.player.color, 15);
        
        // Draw particles
        for (const p of this.particles) {
            this.renderer.drawParticle(p.x, p.y, p.size, p.color, p.alpha);
        }
        
        // Draw UI
        this.renderUI();
    }
    
    renderUI() {
        // Score
        this.renderer.drawPixelText(`SCORE: ${this.score}`, 10, 30, {
            align: 'left',
            font: '20px "Press Start 2P"'
        });
        
        // Instructions
        const instructions = [
            'ARROW KEYS / WASD - MOVE',
            'SPACE - PAUSE',
            'D - DEBUG',
            'M - MUTE'
        ];
        
        instructions.forEach((text, index) => {
            this.renderer.drawText(text, 10, this.canvas.height - 20 - (index * 20), {
                color: '#00F0FF',
                font: '12px "Press Start 2P"',
                align: 'left',
                baseline: 'bottom'
            });
        });
        
        // Game Over
        if (this.gameOver) {
            this.renderGameOver();
        }
    }
    
    // ============================================
    // LIFECYCLE HOOKS
    // ============================================
    
    onStart() {
        console.log('🎮 Demo started!');
    }
    
    onPause(isPaused) {
        if (isPaused) {
            this.audio.pauseMusic();
        } else {
            this.audio.resumeMusic();
        }
    }
    
    onScoreChange(newScore, points) {
        console.log(`✨ Score +${points} = ${newScore}`);
    }
    
    onGameOver() {
        console.log('💀 Demo ended!');
    }
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🎮 Initializing Engine Demo...');
    
    // Create demo instance
    const demo = new EngineDemo();
    
    // Start the game
    demo.start();
    
    console.log('✅ Engine Demo ready!');
    console.log('📝 Use ARROW KEYS or WASD to move');
    console.log('📝 Collect the glowing orbs');
    console.log('📝 Press SPACE to pause');
    console.log('📝 Press D to toggle debug mode');
});
