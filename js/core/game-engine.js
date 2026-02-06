/**
 * The Arcade Madness - Core Game Engine
 * Base class for all games
 */

class GameEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.lastFrameTime = 0;
        this.isRunning = false;
        this.isPaused = false;
        this.fps = 60;
        this.frameInterval = 1000 / this.fps;
    }

    start() {
        this.isRunning = true;
        this.isPaused = false;
        this.lastFrameTime = performance.now();
        this.loop(this.lastFrameTime);
    }

    pause() {
        this.isPaused = !this.isPaused;
    }

    stop() {
        this.isRunning = false;
    }

    loop(currentTime) {
        if (!this.isRunning) return;

        const deltaTime = currentTime - this.lastFrameTime;

        if (deltaTime >= this.frameInterval) {
            this.lastFrameTime = currentTime - (deltaTime % this.frameInterval);

            if (!this.isPaused) {
                this.update(deltaTime);
                this.render();
            }
        }

        requestAnimationFrame((time) => this.loop(time));
    }

    update(deltaTime) {
        // Override in child classes
    }

    render() {
        // Override in child classes
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}
