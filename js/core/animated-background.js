/**
 * The Arcade Madness - Animated Background
 * Features floating Tetris pieces, Pac-Man ghosts, and Snake segments
 */

class AnimatedBackground {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.maxParticles = 20;
        
        this.colors = {
            cyan: '#00F0FF',
            pink: '#FF10F0',
            yellow: '#FFFF00',
            green: '#39FF14',
            orange: '#FF6600',
            purple: '#9D00FF',
            red: '#FF0040'
        };
        
        this.init();
        this.createParticles();
        this.animate();
    }
    
    init() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    createParticles() {
        const types = ['tetromino', 'ghost', 'snake', 'pellet'];
        
        for (let i = 0; i < this.maxParticles; i++) {
            const type = types[Math.floor(Math.random() * types.length)];
            this.particles.push(this.createParticle(type));
        }
    }
    
    createParticle(type) {
        const colorKeys = Object.keys(this.colors);
        const randomColor = this.colors[colorKeys[Math.floor(Math.random() * colorKeys.length)]];
        
        const particle = {
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            type: type,
            color: randomColor,
            size: 20 + Math.random() * 20,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.02,
            opacity: 0.3 + Math.random() * 0.4
        };
        
        // Type-specific properties
        if (type === 'tetromino') {
            particle.shape = this.getRandomTetrominoShape();
        } else if (type === 'ghost') {
            particle.phase = Math.random() * Math.PI * 2;
        } else if (type === 'snake') {
            particle.segments = 5;
        }
        
        return particle;
    }
    
    getRandomTetrominoShape() {
        const shapes = [
            // I piece
            [[1,1,1,1]],
            // O piece
            [[1,1],[1,1]],
            // T piece
            [[0,1,0],[1,1,1]],
            // S piece
            [[0,1,1],[1,1,0]],
            // Z piece
            [[1,1,0],[0,1,1]],
            // J piece
            [[1,0,0],[1,1,1]],
            // L piece
            [[0,0,1],[1,1,1]]
        ];
        return shapes[Math.floor(Math.random() * shapes.length)];
    }
    
    update() {
        this.particles.forEach(particle => {
            // Update position
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.rotation += particle.rotationSpeed;
            
            // Update ghost phase for floating effect
            if (particle.type === 'ghost') {
                particle.phase += 0.02;
                particle.y += Math.sin(particle.phase) * 0.3;
            }
            
            // Wrap around screen edges
            if (particle.x < -particle.size) particle.x = this.canvas.width + particle.size;
            if (particle.x > this.canvas.width + particle.size) particle.x = -particle.size;
            if (particle.y < -particle.size) particle.y = this.canvas.height + particle.size;
            if (particle.y > this.canvas.height + particle.size) particle.y = -particle.size;
        });
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.particles.forEach(particle => {
            this.ctx.save();
            this.ctx.globalAlpha = particle.opacity;
            this.ctx.translate(particle.x, particle.y);
            this.ctx.rotate(particle.rotation);
            
            switch(particle.type) {
                case 'tetromino':
                    this.drawTetromino(particle);
                    break;
                case 'ghost':
                    this.drawGhost(particle);
                    break;
                case 'snake':
                    this.drawSnake(particle);
                    break;
                case 'pellet':
                    this.drawPellet(particle);
                    break;
            }
            
            this.ctx.restore();
        });
    }
    
    drawTetromino(particle) {
        const blockSize = particle.size / 4;
        const shape = particle.shape;
        
        // Draw glow
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = particle.color;
        
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const x = (col - shape[row].length / 2) * blockSize;
                    const y = (row - shape.length / 2) * blockSize;
                    
                    // Block
                    this.ctx.fillStyle = particle.color;
                    this.ctx.fillRect(x, y, blockSize - 2, blockSize - 2);
                    
                    // Highlight
                    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                    this.ctx.fillRect(x, y, blockSize - 2, 3);
                    this.ctx.fillRect(x, y, 3, blockSize - 2);
                }
            }
        }
        
        this.ctx.shadowBlur = 0;
    }
    
    drawGhost(particle) {
        const size = particle.size;
        
        // Draw glow
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = particle.color;
        
        // Body
        this.ctx.fillStyle = particle.color;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, size / 2, Math.PI, 0, false);
        this.ctx.lineTo(size / 2, size / 2);
        
        // Wavy bottom
        const waves = 4;
        for (let i = 0; i < waves; i++) {
            const waveX = (size / 2) - (i * (size / waves));
            const waveY = size / 2 + (i % 2 === 0 ? 5 : -5);
            this.ctx.lineTo(waveX, waveY);
        }
        
        this.ctx.lineTo(-size / 2, size / 2);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Eyes
        this.ctx.fillStyle = '#000000';
        this.ctx.beginPath();
        this.ctx.arc(-size / 6, -size / 8, size / 10, 0, Math.PI * 2);
        this.ctx.arc(size / 6, -size / 8, size / 10, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Eye highlights
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.beginPath();
        this.ctx.arc(-size / 6 + 2, -size / 8 - 2, size / 20, 0, Math.PI * 2);
        this.ctx.arc(size / 6 + 2, -size / 8 - 2, size / 20, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.shadowBlur = 0;
    }
    
    drawSnake(particle) {
        const segmentSize = particle.size / particle.segments;
        
        // Draw glow
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = particle.color;
        
        for (let i = 0; i < particle.segments; i++) {
            const x = -particle.size / 2 + (i * segmentSize);
            const alpha = 1 - (i / particle.segments) * 0.5;
            
            this.ctx.globalAlpha = alpha * particle.opacity;
            this.ctx.fillStyle = particle.color;
            this.ctx.fillRect(x, -segmentSize / 2, segmentSize - 2, segmentSize - 2);
            
            // Highlight
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.fillRect(x, -segmentSize / 2, segmentSize - 2, 2);
        }
        
        this.ctx.globalAlpha = particle.opacity;
        this.ctx.shadowBlur = 0;
    }
    
    drawPellet(particle) {
        // Draw glow
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = particle.color;
        
        this.ctx.fillStyle = particle.color;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, particle.size / 4, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Inner glow
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, particle.size / 8, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.shadowBlur = 0;
    }
    
    animate() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.animate());
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new AnimatedBackground('backgroundCanvas');
});
