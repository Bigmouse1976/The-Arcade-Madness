/**
 * The Arcade Madness - Pixel Drift Runner
 * Retro top-down neon racer with drift mechanics
 * Auto-drive forward, steer/swipe to drift around corners & obstacles
 */

class PixelDriftRunner extends GameEngine {
    constructor() {
        super('gameCanvas', {
            targetFPS: 60,
            backgroundColor: '#0a0a1a',
            debug: false
        });

        // Core framework components
        this.input = new InputHandler({ canvas: this.canvas, swipeThreshold: 30 });
        this.renderer = new Renderer(this.ctx);
        this.collision = new CollisionDetector();
        this.audio = new AudioManager();

        // Road geometry
        this.roadWidth = 200;
        this.roadLeft = (this.canvas.width - this.roadWidth) / 2;
        this.roadRight = this.roadLeft + this.roadWidth;
        this.laneWidth = this.roadWidth / 3;

        // Car properties
        this.car = null;
        this.carWidth = 24;
        this.carHeight = 40;

        // Track / scrolling
        this.scrollSpeed = 0;
        this.baseSpeed = 150;
        this.maxSpeed = 400;
        this.acceleration = 40;
        this.brakeForce = 120;
        this.scrollOffset = 0;
        this.distanceTraveled = 0;

        // Drift mechanics
        this.driftForce = 0;
        this.driftFriction = 4;
        this.maxDrift = 260;
        this.steerSpeed = 320;
        this.isDrifting = false;

        // Boost system
        this.boostFuel = 0;
        this.maxBoost = 100;
        this.boostActive = false;
        this.boostMultiplier = 1.8;
        this.boostDrain = 40; // per second
        this.boostGainPerTape = 35;

        // Road curves
        this.roadCurve = 0;          // current lateral shift
        this.targetCurve = 0;        // target lateral shift
        this.curveSmooth = 2;
        this.curveTimer = 0;
        this.curveInterval = 2.5;    // seconds between curve changes
        this.curveStrength = 100;

        // Spawning
        this.spawnTimer = 0;
        this.spawnInterval = 0.8;
        this.obstacleSpeed = 0;

        // Game objects
        this.obstacles = [];
        this.cassettes = [];
        this.roadLines = [];
        this.particles = [];
        this.stars = [];

        // Stats
        this.tapesCollected = 0;
        this.highScore = 0;
        this.bestDistance = 0;

        // Seeded RNG for daily tracks
        this.dailySeed = this.getDailySeed();
        this.rng = this.createSeededRng(this.dailySeed);

        // UI
        this.setupUI();
        this.setupControls();

        // Generate starfield
        this.generateStars();
        // Pre-fill road lines
        this.initRoadLines();

        console.log('🏎️ Pixel Drift Runner initialized!');
    }

    // ============================================
    // SEEDED RNG (daily tracks)
    // ============================================

    getDailySeed() {
        const d = new Date();
        return `PDR-${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    }

    createSeededRng(seed) {
        let h = 1779033703 ^ seed.split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 0);
        return () => {
            h = Math.imul(h ^ (h >>> 16), 2246822507);
            h = Math.imul(h ^ (h >>> 13), 3266489909);
            return ((h ^= h >>> 16) >>> 0) / 4294967296;
        };
    }

    // ============================================
    // INITIALIZATION
    // ============================================

    setupUI() {
        this.scoreElement = document.getElementById('score');
        this.distanceElement = document.getElementById('distance');
        this.speedElement = document.getElementById('speed');
        this.tapesElement = document.getElementById('tapes');
        this.highScoreElement = document.getElementById('highScore');
        this.bestDistanceElement = document.getElementById('bestDistance');
        this.boostBarElement = document.getElementById('boostBar');
        this.speedDotsContainer = document.getElementById('speedDots');

        // Create speed dots
        for (let i = 0; i < 10; i++) {
            const dot = document.createElement('div');
            dot.className = 'speed-dot';
            dot.id = `speed-dot-${i}`;
            this.speedDotsContainer.appendChild(dot);
        }

        // Buttons
        this.startBtn = document.getElementById('startBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.restartBtn = document.getElementById('restartBtn');
        this.backBtn = document.getElementById('backBtn');

        this.startBtn.addEventListener('click', () => this.start());
        this.pauseBtn.addEventListener('click', () => this.pause());
        this.restartBtn.addEventListener('click', () => this.restart());
        this.backBtn.addEventListener('click', () => window.location.href = '../../../index.html');

        // Load saved data
        this.highScore = this.loadData('pixelDrift_highScore');
        this.bestDistance = this.loadData('pixelDrift_bestDistance');

        this.updateUI();
    }

    setupControls() {
        // Steering
        this.input.bind('ArrowLeft', () => { /* handled in update via isKeyDown */ });
        this.input.bind('ArrowRight', () => { /* handled in update via isKeyDown */ });

        // Boost
        this.input.bind('Space', () => this.activateBoost());

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
            if (this.gameOver) this.restart();
        });

        // Touch / swipe
        this.input.bind('swipe_left', () => {
            this.driftForce = -this.maxDrift;
            this.isDrifting = true;
        });
        this.input.bind('swipe_right', () => {
            this.driftForce = this.maxDrift;
            this.isDrifting = true;
        });
    }

    onStart() {
        this.initializeGame();
    }

    onReset() {
        this.initializeGame();
    }

    initializeGame() {
        // Reset car
        this.car = {
            x: this.canvas.width / 2,
            y: this.canvas.height - 100,
            width: this.carWidth,
            height: this.carHeight,
            tilt: 0
        };

        // Reset state
        this.scrollSpeed = this.baseSpeed;
        this.scrollOffset = 0;
        this.distanceTraveled = 0;
        this.tapesCollected = 0;
        this.boostFuel = 0;
        this.boostActive = false;
        this.driftForce = 0;
        this.isDrifting = false;
        this.roadCurve = 0;
        this.targetCurve = 0;
        this.curveTimer = 0;
        this.spawnTimer = 0;

        // Clear objects
        this.obstacles = [];
        this.cassettes = [];
        this.particles = [];

        // Re-init visuals
        this.initRoadLines();
        this.generateStars();

        // Reset seeded RNG for consistent daily track
        this.rng = this.createSeededRng(this.dailySeed);

        this.updateUI();
        this.render();

        console.log('🏎️ Race initialized — Daily seed:', this.dailySeed);
    }

    generateStars() {
        this.stars = [];
        for (let i = 0; i < 60; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: 1 + Math.random() * 2,
                speed: 10 + Math.random() * 30,
                brightness: 0.3 + Math.random() * 0.7
            });
        }
    }

    initRoadLines() {
        this.roadLines = [];
        const lineSpacing = 40;
        for (let y = -lineSpacing; y < this.canvas.height + lineSpacing; y += lineSpacing) {
            this.roadLines.push({ y: y });
        }
    }

    // ============================================
    // GAME LOOP
    // ============================================

    update(deltaTime) {
        // Always update particles
        this.updateParticles(deltaTime);
        this.updateStars(deltaTime);

        if (this.gameOver) return;

        // --- Steering ---
        this.handleSteering(deltaTime);

        // --- Speed / Acceleration ---
        this.handleSpeed(deltaTime);

        // --- Road curve ---
        this.updateRoadCurve(deltaTime);

        // --- Scroll ---
        const effectiveSpeed = this.boostActive ? this.scrollSpeed * this.boostMultiplier : this.scrollSpeed;
        const scrollDelta = effectiveSpeed * deltaTime;
        this.scrollOffset += scrollDelta;
        this.distanceTraveled += scrollDelta;

        // Apply curve push on car
        this.car.x -= this.roadCurve * deltaTime * 0.5;

        // --- Boost ---
        if (this.boostActive) {
            this.boostFuel -= this.boostDrain * deltaTime;
            // Boost exhaust particles
            this.spawnExhaustParticles();
            if (this.boostFuel <= 0) {
                this.boostFuel = 0;
                this.boostActive = false;
            }
        }

        // Clamp car to road edges
        const margin = 10;
        const leftEdge = this.roadLeft + margin;
        const rightEdge = this.roadRight - margin - this.car.width;
        this.car.x = this.clamp(this.car.x, leftEdge, rightEdge);

        // --- Spawn objects ---
        this.spawnTimer += deltaTime;
        const adaptiveInterval = Math.max(0.35, this.spawnInterval - this.distanceTraveled * 0.00002);
        if (this.spawnTimer >= adaptiveInterval) {
            this.spawnTimer = 0;
            this.spawnObjects();
        }

        // --- Move objects ---
        this.moveObjects(deltaTime, effectiveSpeed);

        // --- Collisions ---
        this.checkCollisions();

        // --- Score by distance ---
        this.addScore(Math.floor(effectiveSpeed * deltaTime * 0.05));

        // --- Difficulty ramp ---
        this.level = Math.floor(this.distanceTraveled / 3000) + 1;

        this.updateUI();
    }

    handleSteering(deltaTime) {
        let steerInput = 0;

        if (this.input.isKeyDown('ArrowLeft') || this.input.isKeyDown('KeyA')) {
            steerInput = -1;
        } else if (this.input.isKeyDown('ArrowRight') || this.input.isKeyDown('KeyD')) {
            steerInput = 1;
        }

        // Touch: also check continuous touch position
        if (this.input.touches.length > 0) {
            const touch = this.input.touches[0];
            const center = this.canvas.width / 2;
            if (touch.x < center - 20) steerInput = -1;
            else if (touch.x > center + 20) steerInput = 1;
        }

        if (steerInput !== 0) {
            this.driftForce += steerInput * this.steerSpeed * deltaTime;
            this.driftForce = this.clamp(this.driftForce, -this.maxDrift, this.maxDrift);
            this.isDrifting = true;
        } else {
            // Friction brings drift back to 0
            if (Math.abs(this.driftForce) > 1) {
                this.driftForce -= Math.sign(this.driftForce) * this.driftFriction * 60 * deltaTime;
            } else {
                this.driftForce = 0;
                this.isDrifting = false;
            }
        }

        this.car.x += this.driftForce * deltaTime;
        this.car.tilt = this.driftForce / this.maxDrift * 0.25; // visual tilt

        // Drift sparks
        if (this.isDrifting && Math.abs(this.driftForce) > this.maxDrift * 0.5) {
            this.spawnDriftSparks();
        }
    }

    handleSpeed(deltaTime) {
        if (this.input.isKeyDown('ArrowUp') || this.input.isKeyDown('KeyW')) {
            this.scrollSpeed = Math.min(this.maxSpeed, this.scrollSpeed + this.acceleration * deltaTime);
        } else if (this.input.isKeyDown('ArrowDown') || this.input.isKeyDown('KeyS')) {
            this.scrollSpeed = Math.max(80, this.scrollSpeed - this.brakeForce * deltaTime);
        } else {
            // Gentle auto-acceleration
            this.scrollSpeed = Math.min(this.maxSpeed * 0.6, this.scrollSpeed + this.acceleration * 0.3 * deltaTime);
        }

        // Difficulty speed ramp
        const distBonus = Math.min(100, this.distanceTraveled * 0.005);
        this.scrollSpeed = Math.max(this.scrollSpeed, this.baseSpeed + distBonus);
    }

    updateRoadCurve(deltaTime) {
        this.curveTimer += deltaTime;
        if (this.curveTimer >= this.curveInterval) {
            this.curveTimer = 0;
            // Use seeded RNG for daily track consistency
            const r = this.rng();
            if (r < 0.3) {
                this.targetCurve = -this.curveStrength * (0.5 + this.rng() * 0.5);
            } else if (r > 0.7) {
                this.targetCurve = this.curveStrength * (0.5 + this.rng() * 0.5);
            } else {
                this.targetCurve = 0;
            }
            // Increase curve strength with distance
            this.curveStrength = Math.min(180, 100 + this.distanceTraveled * 0.003);
        }

        // Smooth interpolation toward target curve
        this.roadCurve = this.lerp(this.roadCurve, this.targetCurve, this.curveSmooth * deltaTime);
    }

    // ============================================
    // SPAWNING
    // ============================================

    spawnObjects() {
        const r = this.rng();

        if (r < 0.55) {
            this.spawnObstacle();
        }
        if (r > 0.65) {
            this.spawnCassette();
        }
    }

    spawnObstacle() {
        const laneCount = 3;
        const lane = Math.floor(this.rng() * laneCount);
        const x = this.roadLeft + lane * this.laneWidth + (this.laneWidth - 28) / 2;

        const types = [
            { w: 28, h: 28, color: '#FF0040', type: 'barrel' },
            { w: 50, h: 20, color: '#9D00FF', type: 'barrier' },
            { w: 24, h: 24, color: '#FF6600', type: 'cone' },
        ];
        const t = types[Math.floor(this.rng() * types.length)];

        this.obstacles.push({
            x: x,
            y: -t.h,
            width: t.w,
            height: t.h,
            color: t.color,
            type: t.type
        });
    }

    spawnCassette() {
        const laneCount = 3;
        const lane = Math.floor(this.rng() * laneCount);
        const x = this.roadLeft + lane * this.laneWidth + this.laneWidth / 2;

        this.cassettes.push({
            x: x,
            y: -20,
            radius: 12,
            bobPhase: Math.random() * Math.PI * 2,
            collected: false
        });
    }

    moveObjects(deltaTime, speed) {
        // Move obstacles
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            this.obstacles[i].y += speed * deltaTime;
            // Apply curve shift
            this.obstacles[i].x += this.roadCurve * deltaTime * 0.15;
            if (this.obstacles[i].y > this.canvas.height + 50) {
                this.obstacles.splice(i, 1);
            }
        }

        // Move cassettes
        for (let i = this.cassettes.length - 1; i >= 0; i--) {
            this.cassettes[i].y += speed * deltaTime;
            this.cassettes[i].x += this.roadCurve * deltaTime * 0.15;
            this.cassettes[i].bobPhase += deltaTime * 4;
            if (this.cassettes[i].y > this.canvas.height + 50 || this.cassettes[i].collected) {
                if (this.cassettes[i].collected || this.cassettes[i].y > this.canvas.height + 50) {
                    this.cassettes.splice(i, 1);
                }
            }
        }

        // Move road lines
        for (const line of this.roadLines) {
            line.y += speed * deltaTime;
            if (line.y > this.canvas.height + 40) {
                line.y -= (this.roadLines.length) * 40;
            }
        }
    }

    // ============================================
    // COLLISIONS
    // ============================================

    checkCollisions() {
        const carRect = {
            x: this.car.x,
            y: this.car.y,
            width: this.car.width,
            height: this.car.height
        };

        // Car center for circle checks
        const carCx = this.car.x + this.car.width / 2;
        const carCy = this.car.y + this.car.height / 2;

        // Obstacles
        for (const obs of this.obstacles) {
            if (this.collision.rectRect(carRect, obs)) {
                this.spawnCrashExplosion(carCx, carCy);
                this.endGame();
                return;
            }
        }

        // Cassettes
        for (const tape of this.cassettes) {
            if (tape.collected) continue;
            const dist = this.distance(carCx, carCy, tape.x, tape.y);
            if (dist < this.car.width / 2 + tape.radius) {
                tape.collected = true;
                this.tapesCollected++;
                this.addScore(50);
                this.boostFuel = Math.min(this.maxBoost, this.boostFuel + this.boostGainPerTape);
                this.spawnCollectParticles(tape.x, tape.y);
                console.log('📼 Cassette collected! Tapes:', this.tapesCollected);
            }
        }

        // Off-road check (car fully past road edges)
        if (this.car.x + this.car.width < this.roadLeft || this.car.x > this.roadRight) {
            this.spawnCrashExplosion(carCx, carCy);
            this.endGame();
        }
    }

    activateBoost() {
        if (this.boostFuel > 10 && !this.boostActive && !this.gameOver) {
            this.boostActive = true;
            console.log('🚀 BOOST ACTIVATED!');
        }
    }

    // ============================================
    // PARTICLES
    // ============================================

    spawnDriftSparks() {
        const side = Math.sign(this.driftForce);
        const x = this.car.x + (side > 0 ? this.car.width : 0);
        const y = this.car.y + this.car.height - 4;

        for (let i = 0; i < 2; i++) {
            this.particles.push({
                x: x + (Math.random() - 0.5) * 6,
                y: y + Math.random() * 6,
                vx: -side * (30 + Math.random() * 60),
                vy: -(20 + Math.random() * 40),
                size: 2 + Math.random() * 2,
                color: Math.random() > 0.5 ? '#FFFF00' : '#FF6600',
                life: 0.3 + Math.random() * 0.3,
                maxLife: 0.3 + Math.random() * 0.3,
                alpha: 1,
                type: 'spark'
            });
        }
    }

    spawnExhaustParticles() {
        const cx = this.car.x + this.car.width / 2;
        const y = this.car.y + this.car.height + 2;

        for (let i = 0; i < 2; i++) {
            this.particles.push({
                x: cx + (Math.random() - 0.5) * 10,
                y: y,
                vx: (Math.random() - 0.5) * 30,
                vy: 40 + Math.random() * 60,
                size: 3 + Math.random() * 4,
                color: Math.random() > 0.5 ? '#FF10F0' : '#00F0FF',
                life: 0.25 + Math.random() * 0.2,
                maxLife: 0.25 + Math.random() * 0.2,
                alpha: 1,
                type: 'exhaust'
            });
        }
    }

    spawnCollectParticles(x, y) {
        for (let i = 0; i < 15; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 60 + Math.random() * 120;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 2 + Math.random() * 4,
                color: Math.random() > 0.5 ? '#FFD700' : '#FFFF00',
                life: 0.5 + Math.random() * 0.5,
                maxLife: 0.5 + Math.random() * 0.5,
                alpha: 1,
                type: 'collect'
            });
        }
    }

    spawnCrashExplosion(x, y) {
        const colors = ['#FF0040', '#FF6600', '#FFFF00', '#FF10F0', '#FFFFFF'];
        for (let i = 0; i < 40; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 80 + Math.random() * 200;
            this.particles.push({
                x: x + (Math.random() - 0.5) * 20,
                y: y + (Math.random() - 0.5) * 20,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 3 + Math.random() * 6,
                color: colors[Math.floor(Math.random() * colors.length)],
                life: 0.6 + Math.random() * 0.8,
                maxLife: 0.6 + Math.random() * 0.8,
                alpha: 1,
                type: 'crash'
            });
        }
    }

    updateParticles(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;
            if (p.type === 'crash') p.vy += 150 * deltaTime; // gravity
            p.life -= deltaTime;
            p.alpha = Math.max(0, p.life / p.maxLife);
            p.size *= 0.98;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    updateStars(deltaTime) {
        const speed = this.boostActive ? this.scrollSpeed * this.boostMultiplier : this.scrollSpeed;
        for (const star of this.stars) {
            star.y += star.speed * deltaTime * (speed / this.baseSpeed);
            if (star.y > this.canvas.height) {
                star.y = -2;
                star.x = Math.random() * this.canvas.width;
            }
        }
    }

    // ============================================
    // RENDERING
    // ============================================

    render() {
        this.drawStarfield();
        this.drawRoad();
        this.drawRoadLines();
        this.drawCassettes();
        this.drawObstacles();
        if (!this.gameOver) this.drawCar();
        this.drawParticles();
        this.drawHUD();

        if (this.gameOver) {
            this.drawGameOver();
        }
    }

    drawStarfield() {
        for (const star of this.stars) {
            this.ctx.save();
            this.ctx.globalAlpha = star.brightness;
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.fillRect(star.x, star.y, star.size, star.size);
            this.ctx.restore();
        }
    }

    drawRoad() {
        // Road surface
        this.ctx.fillStyle = '#111133';
        this.ctx.fillRect(this.roadLeft, 0, this.roadWidth, this.canvas.height);

        // Neon edge lines
        this.ctx.save();

        // Left edge
        this.ctx.strokeStyle = '#FF10F0';
        this.ctx.lineWidth = 3;
        this.ctx.shadowColor = '#FF10F0';
        this.ctx.shadowBlur = 12;
        this.ctx.beginPath();
        this.ctx.moveTo(this.roadLeft, 0);
        this.ctx.lineTo(this.roadLeft, this.canvas.height);
        this.ctx.stroke();

        // Right edge
        this.ctx.strokeStyle = '#00F0FF';
        this.ctx.shadowColor = '#00F0FF';
        this.ctx.beginPath();
        this.ctx.moveTo(this.roadRight, 0);
        this.ctx.lineTo(this.roadRight, this.canvas.height);
        this.ctx.stroke();

        this.ctx.restore();

        // Shoulder stripes
        const stripeH = 20;
        const stripeGap = 20;
        for (let y = (this.scrollOffset % (stripeH + stripeGap)) - stripeH; y < this.canvas.height; y += stripeH + stripeGap) {
            // Left shoulder
            this.ctx.fillStyle = '#FF0040';
            this.ctx.fillRect(this.roadLeft - 8, y, 6, stripeH);
            // Right shoulder
            this.ctx.fillStyle = '#FF0040';
            this.ctx.fillRect(this.roadRight + 2, y, 6, stripeH);
        }
    }

    drawRoadLines() {
        // Dashed center lane dividers
        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([20, 20]);

        const lane1X = this.roadLeft + this.laneWidth;
        const lane2X = this.roadLeft + this.laneWidth * 2;

        for (const line of this.roadLines) {
            // Horizontal grid lines
            this.ctx.globalAlpha = 0.15;
            this.ctx.beginPath();
            this.ctx.moveTo(this.roadLeft, line.y);
            this.ctx.lineTo(this.roadRight, line.y);
            this.ctx.stroke();
        }

        // Lane dividers
        this.ctx.globalAlpha = 0.3;
        this.ctx.setLineDash([30, 30]);
        this.ctx.lineDashOffset = -this.scrollOffset;

        this.ctx.beginPath();
        this.ctx.moveTo(lane1X, 0);
        this.ctx.lineTo(lane1X, this.canvas.height);
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.moveTo(lane2X, 0);
        this.ctx.lineTo(lane2X, this.canvas.height);
        this.ctx.stroke();

        this.ctx.restore();
    }

    drawCar() {
        const cx = this.car.x + this.car.width / 2;
        const cy = this.car.y + this.car.height / 2;

        this.ctx.save();
        this.ctx.translate(cx, cy);
        this.ctx.rotate(this.car.tilt);

        const hw = this.car.width / 2;
        const hh = this.car.height / 2;

        // Car shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        this.ctx.fillRect(-hw + 3, -hh + 3, this.car.width, this.car.height);

        // Car body
        this.ctx.shadowColor = this.boostActive ? '#FF10F0' : '#00F0FF';
        this.ctx.shadowBlur = this.boostActive ? 20 : 12;
        this.ctx.fillStyle = this.boostActive ? '#FF10F0' : '#00F0FF';
        this.ctx.fillRect(-hw, -hh, this.car.width, this.car.height);

        // Windshield
        this.ctx.fillStyle = '#0a0a2a';
        this.ctx.fillRect(-hw + 4, -hh + 6, this.car.width - 8, 10);

        // Hood stripe
        this.ctx.fillStyle = '#FFFF00';
        this.ctx.fillRect(-2, -hh + 2, 4, this.car.height - 4);

        // Tail lights
        this.ctx.shadowColor = '#FF0040';
        this.ctx.shadowBlur = 8;
        this.ctx.fillStyle = '#FF0040';
        this.ctx.fillRect(-hw + 2, hh - 6, 5, 4);
        this.ctx.fillRect(hw - 7, hh - 6, 5, 4);

        // Headlights
        this.ctx.shadowColor = '#FFFFFF';
        this.ctx.shadowBlur = 10;
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(-hw + 2, -hh, 5, 3);
        this.ctx.fillRect(hw - 7, -hh, 5, 3);

        this.ctx.restore();
    }

    drawObstacles() {
        for (const obs of this.obstacles) {
            this.ctx.save();

            if (obs.type === 'barrel') {
                this.renderer.drawWithGlow(() => {
                    this.ctx.fillStyle = obs.color;
                    this.ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
                    // Stripe
                    this.ctx.fillStyle = '#FFFF00';
                    this.ctx.fillRect(obs.x + 2, obs.y + obs.height / 2 - 3, obs.width - 4, 6);
                }, obs.color, 8);
            } else if (obs.type === 'barrier') {
                this.renderer.drawWithGlow(() => {
                    // Chevron pattern barrier
                    this.ctx.fillStyle = obs.color;
                    this.ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
                    this.ctx.fillStyle = '#FFFF00';
                    for (let i = 0; i < obs.width; i += 12) {
                        this.ctx.fillRect(obs.x + i, obs.y + 2, 6, obs.height - 4);
                    }
                }, obs.color, 10);
            } else {
                // Cone
                this.renderer.drawWithGlow(() => {
                    this.ctx.fillStyle = obs.color;
                    this.ctx.beginPath();
                    this.ctx.moveTo(obs.x + obs.width / 2, obs.y);
                    this.ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
                    this.ctx.lineTo(obs.x, obs.y + obs.height);
                    this.ctx.closePath();
                    this.ctx.fill();
                    this.ctx.fillStyle = '#FFFFFF';
                    this.ctx.fillRect(obs.x + obs.width / 2 - 4, obs.y + obs.height / 2, 8, 3);
                }, obs.color, 6);
            }

            this.ctx.restore();
        }
    }

    drawCassettes() {
        const time = performance.now() / 1000;

        for (const tape of this.cassettes) {
            if (tape.collected) continue;

            const bobY = tape.y + Math.sin(tape.bobPhase) * 4;

            this.ctx.save();

            // Glow
            this.ctx.shadowColor = '#FFD700';
            this.ctx.shadowBlur = 14;

            // Cassette body
            const w = 22;
            const h = 14;
            this.ctx.fillStyle = '#333';
            this.ctx.fillRect(tape.x - w / 2, bobY - h / 2, w, h);

            // Label
            this.ctx.fillStyle = '#FFD700';
            this.ctx.fillRect(tape.x - w / 2 + 2, bobY - h / 2 + 2, w - 4, h - 4);

            // Tape reels
            this.ctx.fillStyle = '#111';
            this.ctx.beginPath();
            this.ctx.arc(tape.x - 4, bobY, 3, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.beginPath();
            this.ctx.arc(tape.x + 4, bobY, 3, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.restore();
        }
    }

    drawParticles() {
        this.ctx.save();
        for (const p of this.particles) {
            this.ctx.globalAlpha = p.alpha;
            this.ctx.fillStyle = p.color;
            this.ctx.shadowColor = p.color;
            this.ctx.shadowBlur = p.type === 'crash' ? 8 : 4;
            this.ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        }
        this.ctx.restore();
    }

    drawHUD() {
        // Speed indicator at top
        const effectiveSpeed = this.boostActive ? this.scrollSpeed * this.boostMultiplier : this.scrollSpeed;
        const speedKmh = Math.floor(effectiveSpeed * 0.8);

        this.ctx.save();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(0, 0, this.canvas.width, 28);

        this.ctx.font = '8px "Press Start 2P", monospace';
        this.ctx.textAlign = 'left';
        this.ctx.fillStyle = '#FFFF00';
        this.ctx.fillText(`${speedKmh} KM/H`, 8, 18);

        this.ctx.textAlign = 'right';
        this.ctx.fillStyle = '#39FF14';
        this.ctx.fillText(`${Math.floor(this.distanceTraveled)}m`, this.canvas.width - 8, 18);

        // Boost indicator
        if (this.boostActive) {
            this.ctx.textAlign = 'center';
            this.ctx.fillStyle = '#FF10F0';
            this.ctx.shadowColor = '#FF10F0';
            this.ctx.shadowBlur = 10;
            this.ctx.fillText('BOOST!', this.canvas.width / 2, 18);
        }

        // Curve indicator
        if (Math.abs(this.roadCurve) > 30) {
            this.ctx.textAlign = 'center';
            this.ctx.fillStyle = '#FF6600';
            const arrow = this.roadCurve < 0 ? '>>> CURVE RIGHT >>>' : '<<< CURVE LEFT <<<';
            this.ctx.fillText(arrow, this.canvas.width / 2, this.canvas.height - 10);
        }

        this.ctx.restore();
    }

    drawGameOver() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const cx = this.canvas.width / 2;
        const cy = this.canvas.height / 2;

        this.renderer.drawPixelText('WRECKED!', cx, cy - 60, {
            color: '#FF0040',
            shadowColor: '#000000',
            font: 'bold 28px "Press Start 2P"',
            shadowOffset: 3
        });

        this.renderer.drawText(`SCORE: ${this.score}`, cx, cy + 10, {
            color: '#FF10F0',
            font: '14px "Press Start 2P"',
            align: 'center'
        });

        this.renderer.drawText(`DISTANCE: ${Math.floor(this.distanceTraveled)}m`, cx, cy + 40, {
            color: '#00F0FF',
            font: '12px "Press Start 2P"',
            align: 'center'
        });

        this.renderer.drawText(`TAPES: ${this.tapesCollected}`, cx, cy + 65, {
            color: '#FFD700',
            font: '12px "Press Start 2P"',
            align: 'center'
        });

        if (this.score === this.highScore && this.score > 0) {
            this.renderer.drawPixelText('NEW HIGH SCORE!', cx, cy - 100, {
                color: '#FFFF00',
                shadowColor: '#FF6600',
                font: '11px "Press Start 2P"',
                shadowOffset: 2
            });
        }

        this.renderer.drawText('Press R to race again', cx, cy + 110, {
            color: '#39FF14',
            font: '9px "Press Start 2P"',
            align: 'center'
        });
    }

    renderPauseScreen() {
        this.render();

        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const cx = this.canvas.width / 2;
        const cy = this.canvas.height / 2;

        this.renderer.drawPixelText('PAUSED', cx, cy, {
            color: '#FF10F0',
            shadowColor: '#000000',
            font: 'bold 32px "Press Start 2P"',
            shadowOffset: 3
        });

        this.renderer.drawText('Press P to continue', cx, cy + 50, {
            color: '#FFFF00',
            font: '10px "Press Start 2P"',
            align: 'center'
        });
    }

    // ============================================
    // UI UPDATES
    // ============================================

    updateUI() {
        const effectiveSpeed = this.boostActive ? this.scrollSpeed * this.boostMultiplier : this.scrollSpeed;

        this.scoreElement.textContent = this.score;
        this.distanceElement.textContent = Math.floor(this.distanceTraveled) + 'm';
        this.speedElement.textContent = Math.floor(effectiveSpeed * 0.8);
        this.tapesElement.textContent = this.tapesCollected;
        this.highScoreElement.textContent = this.highScore;
        this.bestDistanceElement.textContent = Math.floor(this.bestDistance) + 'm';

        // Boost bar
        const boostPercent = (this.boostFuel / this.maxBoost) * 100;
        this.boostBarElement.style.width = boostPercent + '%';

        // Speed dots
        const speedLevel = Math.floor((effectiveSpeed / this.maxSpeed) * 10);
        for (let i = 0; i < 10; i++) {
            const dot = document.getElementById(`speed-dot-${i}`);
            if (dot) {
                dot.className = 'speed-dot';
                if (i < speedLevel) {
                    dot.classList.add(this.boostActive ? 'boost' : 'active');
                }
            }
        }
    }

    // ============================================
    // LIFECYCLE HOOKS
    // ============================================

    onScoreChange(newScore, points) {
        if (newScore > this.highScore) {
            this.highScore = newScore;
            this.saveData('pixelDrift_highScore', this.highScore);
        }
        this.updateUI();
    }

    onGameOver() {
        if (this.distanceTraveled > this.bestDistance) {
            this.bestDistance = Math.floor(this.distanceTraveled);
            this.saveData('pixelDrift_bestDistance', this.bestDistance);
        }
        console.log('💀 Wrecked!');
        console.log(`  Score: ${this.score}`);
        console.log(`  Distance: ${Math.floor(this.distanceTraveled)}m`);
        console.log(`  Tapes: ${this.tapesCollected}`);
    }

    // ============================================
    // PERSISTENCE
    // ============================================

    loadData(key) {
        const saved = localStorage.getItem(key);
        return saved ? parseInt(saved, 10) : 0;
    }

    saveData(key, value) {
        localStorage.setItem(key, value.toString());
    }
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🏎️ Initializing Pixel Drift Runner...');

    const game = new PixelDriftRunner();
    window.pixelDriftGame = game;

    // Render initial state without starting the loop
    game.initializeGame();

    console.log('✅ Pixel Drift Runner ready!');
    console.log('📝 Click START or press P to begin');
});