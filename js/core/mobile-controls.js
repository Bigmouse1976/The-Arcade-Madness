/**
 * The Arcade Madness - Mobile Controls
 * On-screen touch controls for mobile devices
 * 
 * Usage:
 *   const mobileControls = new MobileControls(inputHandler, {
 *       dpad: true,                    // show directional pad
 *       actionButtons: ['rotate', 'drop'],  // optional action buttons
 *       container: document.body       // where to append (default: body)
 *   });
 * 
 * Action button presets:
 *   'rotate'  -> triggers 'ArrowUp' (Tetris rotate)
 *   'drop'    -> triggers 'Space'   (Tetris hard drop)
 *   'pause'   -> triggers 'Space'   (general pause)
 *   'restart' -> triggers 'KeyR'    (general restart)
 */

class MobileControls {
    constructor(inputHandler, options = {}) {
        this.input = inputHandler;
        this.dpad = options.dpad !== false; // default true
        this.actionButtons = options.actionButtons || [];
        this.container = options.container || document.body;
        this.repeatRate = options.repeatRate || 120; // ms between repeated inputs
        this.theme = options.theme || 'green'; // 'green', 'yellow', 'cyan'

        // Track active intervals for repeating buttons
        this._repeatTimers = {};
        this._activeButtons = new Set();

        // Only show on touch-capable devices
        this._isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

        this.element = null;
        this._build();
    }

    // ============================================
    // BUILD UI
    // ============================================

    _build() {
        // Create wrapper
        this.element = document.createElement('div');
        this.element.className = 'mobile-controls';
        this.element.id = 'mobileControls';

        // Inject styles once
        if (!document.getElementById('mobile-controls-styles')) {
            const style = document.createElement('style');
            style.id = 'mobile-controls-styles';
            style.textContent = this._getStyles();
            document.head.appendChild(style);
        }

        // D-pad (left side)
        if (this.dpad) {
            const dpadEl = this._buildDpad();
            this.element.appendChild(dpadEl);
        }

        // Action buttons (right side)
        if (this.actionButtons.length > 0) {
            const actionsEl = this._buildActionButtons();
            this.element.appendChild(actionsEl);
        }

        this.container.appendChild(this.element);
    }

    _buildDpad() {
        const dpad = document.createElement('div');
        dpad.className = 'mc-dpad';

        const directions = [
            { dir: 'up',    label: '▲', key: 'ArrowUp',    row: 1, col: 2 },
            { dir: 'left',  label: '◀', key: 'ArrowLeft',  row: 2, col: 1 },
            { dir: 'down',  label: '▼', key: 'ArrowDown',  row: 3, col: 2 },
            { dir: 'right', label: '▶', key: 'ArrowRight', row: 2, col: 3 },
        ];

        directions.forEach(d => {
            const btn = document.createElement('button');
            btn.className = `mc-btn mc-dpad-btn mc-dpad-${d.dir}`;
            btn.textContent = d.label;
            btn.dataset.key = d.key;
            btn.dataset.dir = d.dir;
            btn.setAttribute('aria-label', d.dir);
            btn.style.gridRow = d.row;
            btn.style.gridColumn = d.col;
            this._bindTouch(btn, d.key, d.dir);
            dpad.appendChild(btn);
        });

        return dpad;
    }

    _buildActionButtons() {
        const wrapper = document.createElement('div');
        wrapper.className = 'mc-actions';

        const presets = {
            'rotate':  { label: '↻',  key: 'ArrowUp',  name: 'ROTATE', repeat: false },
            'drop':    { label: '⤓',  key: 'Space',    name: 'DROP',   repeat: false },
            'pause':   { label: '⏸',  key: 'Space',    name: 'PAUSE',  repeat: false },
            'restart': { label: '↺',  key: 'KeyR',     name: 'REDO',   repeat: false },
            'fire':    { label: '●',  key: 'Space',    name: 'FIRE',   repeat: false },
            'jump':    { label: '⬆',  key: 'Space',    name: 'JUMP',   repeat: false },
        };

        this.actionButtons.forEach(action => {
            const preset = typeof action === 'string' ? presets[action] : action;
            if (!preset) return;

            const btn = document.createElement('button');
            btn.className = 'mc-btn mc-action-btn';
            btn.innerHTML = `<span class="mc-action-icon">${preset.label}</span><span class="mc-action-name">${preset.name || ''}</span>`;
            btn.dataset.key = preset.key;
            btn.setAttribute('aria-label', preset.name || preset.label);
            this._bindTouch(btn, preset.key, null, preset.repeat);
            wrapper.appendChild(btn);
        });

        return wrapper;
    }

    // ============================================
    // TOUCH BINDING
    // ============================================

    _bindTouch(btn, key, direction, repeat = true) {
        const id = key + '_' + (direction || Math.random().toString(36).substr(2, 4));

        const startHandler = (e) => {
            e.preventDefault();
            e.stopPropagation();
            btn.classList.add('mc-btn-active');
            this._activeButtons.add(id);

            // Simulate key press
            this._simulateKeyDown(key);

            // If it's a direction, also set swipe-style input
            if (direction) {
                this.input.lastSwipe = direction;
                // Also set key state so isKeyDown/getDirection works
                this.input.keys[key] = true;
                this.input.keysPressed[key] = true;
            }

            // Trigger binding immediately
            this.input.triggerBinding(key);

            // Repeat for held buttons (d-pad directions)
            if (repeat !== false && direction) {
                this._repeatTimers[id] = setInterval(() => {
                    if (!this._activeButtons.has(id)) {
                        clearInterval(this._repeatTimers[id]);
                        return;
                    }
                    this.input.keysPressed[key] = true;
                    this.input.lastSwipe = direction;
                    this.input.triggerBinding(key);
                }, this.repeatRate);
            }
        };

        const endHandler = (e) => {
            e.preventDefault();
            btn.classList.remove('mc-btn-active');
            this._activeButtons.delete(id);

            // Clear repeat
            if (this._repeatTimers[id]) {
                clearInterval(this._repeatTimers[id]);
                delete this._repeatTimers[id];
            }

            // Simulate key up
            this.input.keys[key] = false;
            this.input.keysReleased[key] = true;
        };

        btn.addEventListener('touchstart', startHandler, { passive: false });
        btn.addEventListener('touchend', endHandler, { passive: false });
        btn.addEventListener('touchcancel', endHandler, { passive: false });

        // Also handle mouse for testing on desktop
        btn.addEventListener('mousedown', startHandler);
        btn.addEventListener('mouseup', endHandler);
        btn.addEventListener('mouseleave', (e) => {
            if (this._activeButtons.has(id)) {
                endHandler(e);
            }
        });
    }

    _simulateKeyDown(key) {
        this.input.keys[key] = true;
        this.input.keysPressed[key] = true;
    }

    // ============================================
    // SHOW / HIDE
    // ============================================

    show() {
        if (this.element) this.element.style.display = '';
    }

    hide() {
        if (this.element) this.element.style.display = 'none';
    }

    destroy() {
        // Clean up timers
        Object.values(this._repeatTimers).forEach(t => clearInterval(t));
        this._repeatTimers = {};
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }

    // ============================================
    // STYLES
    // ============================================

    _getStyles() {
        return `
/* ========== MOBILE CONTROLS ========== */
.mobile-controls {
    display: none;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 900;
    padding: 0.5rem 1rem 0.8rem;
    justify-content: space-between;
    align-items: flex-end;
    pointer-events: none;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
}

/* Show only on touch / small screens */
@media (max-width: 768px), (pointer: coarse) {
    .mobile-controls {
        display: flex;
    }
}

/* D-pad */
.mc-dpad {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(3, 1fr);
    gap: 4px;
    width: 150px;
    height: 150px;
    pointer-events: auto;
}

/* Buttons base */
.mc-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid #39FF14;
    background: rgba(57, 255, 20, 0.12);
    color: #39FF14;
    font-family: 'Press Start 2P', monospace, sans-serif;
    font-size: 1.2rem;
    border-radius: 8px;
    outline: none;
    cursor: pointer;
    pointer-events: auto;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
    transition: background 0.08s, transform 0.08s, box-shadow 0.08s;
    box-shadow: 0 0 8px rgba(57, 255, 20, 0.2);
    text-shadow: 0 0 6px #39FF14;
}

.mc-btn:active,
.mc-btn-active {
    background: rgba(57, 255, 20, 0.45);
    transform: scale(0.92);
    box-shadow: 0 0 18px rgba(57, 255, 20, 0.6);
}

/* D-pad buttons */
.mc-dpad-btn {
    width: 100%;
    height: 100%;
    font-size: 1.3rem;
}

/* Action buttons */
.mc-actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: center;
    pointer-events: auto;
}

.mc-action-btn {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    flex-direction: column;
    gap: 2px;
    font-size: 1.4rem;
    border-width: 2px;
}

.mc-action-icon {
    font-size: 1.4rem;
    line-height: 1;
}

.mc-action-name {
    font-size: 0.3rem;
    letter-spacing: 0.05em;
    opacity: 0.8;
}

/* Very small screens: shrink controls */
@media (max-width: 380px) {
    .mc-dpad {
        width: 120px;
        height: 120px;
    }
    .mc-dpad-btn {
        font-size: 1rem;
    }
    .mc-action-btn {
        width: 52px;
        height: 52px;
    }
    .mc-action-icon {
        font-size: 1.1rem;
    }
}

/* Landscape: smaller so they don't cover the game */
@media (max-height: 500px) {
    .mobile-controls {
        padding: 0.3rem 0.8rem 0.4rem;
    }
    .mc-dpad {
        width: 110px;
        height: 110px;
    }
    .mc-dpad-btn {
        font-size: 0.9rem;
    }
    .mc-action-btn {
        width: 48px;
        height: 48px;
    }
}
`;
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MobileControls;
}
