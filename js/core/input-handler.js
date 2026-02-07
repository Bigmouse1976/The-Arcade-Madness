/**
 * The Arcade Madness - Input Handler
 * Handles keyboard, mouse, touch, and gamepad input
 */

class InputHandler {
    constructor(options = {}) {
        // Keyboard state
        this.keys = {};
        this.keysPressed = {}; // For single press detection
        this.keysReleased = {}; // For release detection
        
        // Mouse state
        this.mouse = {
            x: 0,
            y: 0,
            isDown: false,
            button: null,
            wheelDelta: 0
        };
        
        // Touch state
        this.touches = [];
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.swipeThreshold = options.swipeThreshold || 50;
        this.lastSwipe = null;
        
        // Gamepad state
        this.gamepad = null;
        this.gamepadIndex = -1;
        
        // Settings
        this.preventDefaultKeys = options.preventDefaultKeys || true;
        this.canvas = options.canvas || null;
        
        // Bindings
        this.bindings = {};
        
        this.setupListeners();
        console.log('🎮 InputHandler initialized');
    }
    
    // ============================================
    // SETUP
    // ============================================
    
    setupListeners() {
        this.setupKeyboardListeners();
        this.setupMouseListeners();
        this.setupTouchListeners();
        this.setupGamepadListeners();
    }
    
    setupKeyboardListeners() {
        window.addEventListener('keydown', (e) => {
            // Detect new key press
            if (!this.keys[e.code]) {
                this.keysPressed[e.code] = true;
            }
            
            this.keys[e.code] = true;
            this.keys[e.key] = true;
            
            // Prevent default for game keys
            if (this.preventDefaultKeys && this.isGameKey(e.code)) {
                e.preventDefault();
            }
            
            this.triggerBinding(e.code);
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            this.keys[e.key] = false;
            this.keysReleased[e.code] = true;
        });
    }
    
    setupMouseListeners() {
        if (!this.canvas) return;
        
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });
        
        this.canvas.addEventListener('mousedown', (e) => {
            this.mouse.isDown = true;
            this.mouse.button = e.button;
            e.preventDefault();
        });
        
        this.canvas.addEventListener('mouseup', (e) => {
            this.mouse.isDown = false;
            this.mouse.button = null;
        });
        
        this.canvas.addEventListener('wheel', (e) => {
            this.mouse.wheelDelta = e.deltaY;
            e.preventDefault();
        }, { passive: false });
    }
    
    setupTouchListeners() {
        if (!this.canvas) {
            // Use document if no canvas
            document.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
            document.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
            document.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
        } else {
            this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
            this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
            this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
        }
    }
    
    setupGamepadListeners() {
        window.addEventListener('gamepadconnected', (e) => {
            this.gamepad = e.gamepad;
            this.gamepadIndex = e.gamepad.index;
            console.log(`🎮 Gamepad connected: ${e.gamepad.id}`);
        });
        
        window.addEventListener('gamepaddisconnected', (e) => {
            if (this.gamepadIndex === e.gamepad.index) {
                this.gamepad = null;
                this.gamepadIndex = -1;
                console.log('🎮 Gamepad disconnected');
            }
        });
    }
    
    // ============================================
    // KEYBOARD METHODS
    // ============================================
    
    isKeyDown(key) {
        return this.keys[key] || false;
    }
    
    isKeyPressed(key) {
        // Returns true only once per press
        if (this.keysPressed[key]) {
            this.keysPressed[key] = false;
            return true;
        }
        return false;
    }
    
    isKeyReleased(key) {
        // Returns true only once per release
        if (this.keysReleased[key]) {
            this.keysReleased[key] = false;
            return true;
        }
        return false;
    }
    
    isGameKey(code) {
        const gameKeys = [
            'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
            'Space', 'Enter', 'Escape',
            'KeyW', 'KeyA', 'KeyS', 'KeyD',
            'KeyZ', 'KeyX', 'KeyC'
        ];
        return gameKeys.includes(code);
    }
    
    // ============================================
    // MOUSE METHODS
    // ============================================
    
    getMousePosition() {
        return { x: this.mouse.x, y: this.mouse.y };
    }
    
    isMouseDown() {
        return this.mouse.isDown;
    }
    
    getMouseButton() {
        return this.mouse.button;
    }
    
    getWheelDelta() {
        const delta = this.mouse.wheelDelta;
        this.mouse.wheelDelta = 0; // Reset after reading
        return delta;
    }
    
    // ============================================
    // TOUCH METHODS
    // ============================================
    
    handleTouchStart(e) {
        if (e.touches.length > 0) {
            const touch = e.touches[0];
            const rect = this.canvas ? this.canvas.getBoundingClientRect() : { left: 0, top: 0 };
            
            this.touchStartX = touch.clientX - rect.left;
            this.touchStartY = touch.clientY - rect.top;
            this.touches = Array.from(e.touches).map(t => ({
                x: t.clientX - rect.left,
                y: t.clientY - rect.top,
                id: t.identifier
            }));
        }
        
        if (this.preventDefaultKeys) {
            e.preventDefault();
        }
    }
    
    handleTouchMove(e) {
        if (this.canvas) {
            const rect = this.canvas.getBoundingClientRect();
            this.touches = Array.from(e.touches).map(t => ({
                x: t.clientX - rect.left,
                y: t.clientY - rect.top,
                id: t.identifier
            }));
        }
    }
    
    handleTouchEnd(e) {
        if (e.changedTouches.length > 0) {
            const touch = e.changedTouches[0];
            const rect = this.canvas ? this.canvas.getBoundingClientRect() : { left: 0, top: 0 };
            
            const touchEndX = touch.clientX - rect.left;
            const touchEndY = touch.clientY - rect.top;
            
            this.lastSwipe = this.detectSwipe(touchEndX, touchEndY);
            
            if (this.lastSwipe) {
                this.triggerBinding(`swipe_${this.lastSwipe}`);
            }
        }
        
        this.touches = Array.from(e.touches).map(t => ({
            x: t.clientX,
            y: t.clientY,
            id: t.identifier
        }));
    }
    
    detectSwipe(endX, endY) {
        const deltaX = endX - this.touchStartX;
        const deltaY = endY - this.touchStartY;
        
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);
        
        if (absX < this.swipeThreshold && absY < this.swipeThreshold) {
            return null; // Too small to be a swipe
        }
        
        if (absX > absY) {
            return deltaX > 0 ? 'right' : 'left';
        } else {
            return deltaY > 0 ? 'down' : 'up';
        }
    }
    
    getLastSwipe() {
        const swipe = this.lastSwipe;
        this.lastSwipe = null; // Clear after reading
        return swipe;
    }
    
    getTouches() {
        return this.touches;
    }
    
    // ============================================
    // GAMEPAD METHODS
    // ============================================
    
    updateGamepad() {
        if (this.gamepadIndex === -1) return;
        
        const gamepads = navigator.getGamepads();
        this.gamepad = gamepads[this.gamepadIndex];
    }
    
    isGamepadButtonDown(buttonIndex) {
        if (!this.gamepad) return false;
        return this.gamepad.buttons[buttonIndex]?.pressed || false;
    }
    
    getGamepadAxis(axisIndex) {
        if (!this.gamepad) return 0;
        return this.gamepad.axes[axisIndex] || 0;
    }
    
    getGamepadLeftStick() {
        return {
            x: this.getGamepadAxis(0),
            y: this.getGamepadAxis(1)
        };
    }
    
    getGamepadRightStick() {
        return {
            x: this.getGamepadAxis(2),
            y: this.getGamepadAxis(3)
        };
    }
    
    // ============================================
    // DIRECTION HELPERS
    // ============================================
    
    getDirection() {
        // Returns direction based on keyboard, gamepad, or swipe
        let direction = null;
        
        // Check keyboard
        if (this.isKeyDown('ArrowUp') || this.isKeyDown('KeyW')) {
            direction = 'up';
        } else if (this.isKeyDown('ArrowDown') || this.isKeyDown('KeyS')) {
            direction = 'down';
        } else if (this.isKeyDown('ArrowLeft') || this.isKeyDown('KeyA')) {
            direction = 'left';
        } else if (this.isKeyDown('ArrowRight') || this.isKeyDown('KeyD')) {
            direction = 'right';
        }
        
        // Check gamepad
        if (!direction && this.gamepad) {
            const stick = this.getGamepadLeftStick();
            const threshold = 0.5;
            
            if (Math.abs(stick.x) > Math.abs(stick.y)) {
                if (stick.x > threshold) direction = 'right';
                else if (stick.x < -threshold) direction = 'left';
            } else {
                if (stick.y > threshold) direction = 'down';
                else if (stick.y < -threshold) direction = 'up';
            }
            
            // D-pad
            if (this.isGamepadButtonDown(12)) direction = 'up';
            if (this.isGamepadButtonDown(13)) direction = 'down';
            if (this.isGamepadButtonDown(14)) direction = 'left';
            if (this.isGamepadButtonDown(15)) direction = 'right';
        }
        
        return direction;
    }
    
    getDirectionPressed() {
        // Returns direction only on initial press (not held)
        if (this.isKeyPressed('ArrowUp') || this.isKeyPressed('KeyW')) return 'up';
        if (this.isKeyPressed('ArrowDown') || this.isKeyPressed('KeyS')) return 'down';
        if (this.isKeyPressed('ArrowLeft') || this.isKeyPressed('KeyA')) return 'left';
        if (this.isKeyPressed('ArrowRight') || this.isKeyPressed('KeyD')) return 'right';
        
        return this.getLastSwipe();
    }
    
    // ============================================
    // KEY BINDINGS
    // ============================================
    
    bind(key, callback) {
        if (!this.bindings[key]) {
            this.bindings[key] = [];
        }
        this.bindings[key].push(callback);
    }
    
    unbind(key, callback) {
        if (!this.bindings[key]) return;
        
        if (callback) {
            this.bindings[key] = this.bindings[key].filter(cb => cb !== callback);
        } else {
            delete this.bindings[key];
        }
    }
    
    triggerBinding(key) {
        if (!this.bindings[key]) return;
        
        this.bindings[key].forEach(callback => {
            callback(key);
        });
    }
    
    // ============================================
    // UTILITY METHODS
    // ============================================
    
    reset() {
        this.keys = {};
        this.keysPressed = {};
        this.keysReleased = {};
        this.mouse.wheelDelta = 0;
        this.lastSwipe = null;
    }
    
    destroy() {
        // Remove all event listeners (if needed for cleanup)
        this.bindings = {};
        console.log('🎮 InputHandler destroyed');
    }
    
    // ============================================
    // DEBUG
    // ============================================
    
    getActiveKeys() {
        return Object.keys(this.keys).filter(key => this.keys[key]);
    }
    
    logInputState() {
        console.log('=== INPUT STATE ===');
        console.log('Active Keys:', this.getActiveKeys());
        console.log('Mouse:', this.mouse);
        console.log('Touches:', this.touches.length);
        console.log('Gamepad:', this.gamepad ? 'Connected' : 'Disconnected');
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InputHandler;
}
