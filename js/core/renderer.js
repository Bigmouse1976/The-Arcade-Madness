/**
 * The Arcade Madness - Renderer Utilities
 * Common rendering functions and drawing helpers
 */

class Renderer {
    constructor(ctx) {
        this.ctx = ctx;
        console.log('🎨 Renderer initialized');
    }
    
    // ============================================
    // BASIC SHAPES
    // ============================================
    
    /**
     * Draw a filled rectangle
     */
    drawRect(x, y, width, height, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, width, height);
    }
    
    /**
     * Draw a rectangle outline
     */
    strokeRect(x, y, width, height, color, lineWidth = 1) {
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = lineWidth;
        this.ctx.strokeRect(x, y, width, height);
    }
    
    /**
     * Draw a rounded rectangle
     */
    drawRoundedRect(x, y, width, height, radius, color, fill = true) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
        
        if (fill) {
            this.ctx.fillStyle = color;
            this.ctx.fill();
        } else {
            this.ctx.strokeStyle = color;
            this.ctx.stroke();
        }
    }
    
    /**
     * Draw a filled circle
     */
    drawCircle(x, y, radius, color) {
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    /**
     * Draw a circle outline
     */
    strokeCircle(x, y, radius, color, lineWidth = 1) {
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = lineWidth;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.stroke();
    }
    
    /**
     * Draw a line
     */
    drawLine(x1, y1, x2, y2, color, lineWidth = 1) {
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = lineWidth;
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
    }
    
    /**
     * Draw a polygon
     */
    drawPolygon(points, color, fill = true) {
        if (points.length < 3) return;
        
        this.ctx.beginPath();
        this.ctx.moveTo(points[0].x, points[0].y);
        
        for (let i = 1; i < points.length; i++) {
            this.ctx.lineTo(points[i].x, points[i].y);
        }
        
        this.ctx.closePath();
        
        if (fill) {
            this.ctx.fillStyle = color;
            this.ctx.fill();
        } else {
            this.ctx.strokeStyle = color;
            this.ctx.stroke();
        }
    }
    
    // ============================================
    // TEXT RENDERING
    // ============================================
    
    /**
     * Draw text
     */
    drawText(text, x, y, options = {}) {
        const {
            color = '#FFFFFF',
            font = '20px Arial',
            align = 'center',
            baseline = 'middle',
            maxWidth = null
        } = options;
        
        this.ctx.fillStyle = color;
        this.ctx.font = font;
        this.ctx.textAlign = align;
        this.ctx.textBaseline = baseline;
        
        if (maxWidth) {
            this.ctx.fillText(text, x, y, maxWidth);
        } else {
            this.ctx.fillText(text, x, y);
        }
    }
    
    /**
     * Draw text with outline
     */
    drawTextWithOutline(text, x, y, options = {}) {
        const {
            color = '#FFFFFF',
            outlineColor = '#000000',
            font = '20px Arial',
            align = 'center',
            baseline = 'middle',
            outlineWidth = 2
        } = options;
        
        this.ctx.font = font;
        this.ctx.textAlign = align;
        this.ctx.textBaseline = baseline;
        
        // Draw outline
        this.ctx.strokeStyle = outlineColor;
        this.ctx.lineWidth = outlineWidth;
        this.ctx.strokeText(text, x, y);
        
        // Draw fill
        this.ctx.fillStyle = color;
        this.ctx.fillText(text, x, y);
    }
    
    /**
     * Draw retro pixel text with shadow
     */
    drawPixelText(text, x, y, options = {}) {
        const {
            color = '#00F0FF',
            shadowColor = '#FF10F0',
            font = '20px "Press Start 2P"',
            align = 'center',
            baseline = 'middle',
            shadowOffset = 2
        } = options;
        
        this.ctx.font = font;
        this.ctx.textAlign = align;
        this.ctx.textBaseline = baseline;
        
        // Draw shadow
        this.ctx.fillStyle = shadowColor;
        this.ctx.fillText(text, x + shadowOffset, y + shadowOffset);
        
        // Draw main text
        this.ctx.fillStyle = color;
        this.ctx.fillText(text, x, y);
    }
    
    /**
     * Measure text width
     */
    measureText(text, font = '20px Arial') {
        this.ctx.font = font;
        return this.ctx.measureText(text).width;
    }
    
    // ============================================
    // GRID RENDERING
    // ============================================
    
    /**
     * Draw a grid
     */
    drawGrid(cellSize, cols, rows, color = '#333333', lineWidth = 1) {
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = lineWidth;
        
        // Vertical lines
        for (let i = 0; i <= cols; i++) {
            this.drawLine(i * cellSize, 0, i * cellSize, rows * cellSize, color, lineWidth);
        }
        
        // Horizontal lines
        for (let i = 0; i <= rows; i++) {
            this.drawLine(0, i * cellSize, cols * cellSize, i * cellSize, color, lineWidth);
        }
    }
    
    /**
     * Draw a tile/cell at grid position
     */
    drawTile(gridX, gridY, cellSize, color, padding = 0) {
        const x = gridX * cellSize + padding;
        const y = gridY * cellSize + padding;
        const size = cellSize - padding * 2;
        
        this.drawRect(x, y, size, size, color);
    }
    
    /**
     * Draw a 3D-style tile (with highlight and shadow)
     */
    draw3DTile(gridX, gridY, cellSize, color, padding = 1) {
        const x = gridX * cellSize + padding;
        const y = gridY * cellSize + padding;
        const size = cellSize - padding * 2;
        
        // Main tile
        this.drawRect(x, y, size, size, color);
        
        // Highlight (top-left)
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.fillRect(x, y, size, 2);
        this.ctx.fillRect(x, y, 2, size);
        
        // Shadow (bottom-right)
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(x, y + size - 2, size, 2);
        this.ctx.fillRect(x + size - 2, y, 2, size);
    }
    
    // ============================================
    // EFFECTS
    // ============================================
    
    /**
     * Draw with glow effect
     */
    drawWithGlow(drawFunction, glowColor, glowSize = 10) {
        this.ctx.shadowColor = glowColor;
        this.ctx.shadowBlur = glowSize;
        drawFunction();
        this.ctx.shadowBlur = 0;
    }
    
    /**
     * Draw gradient rectangle
     */
    drawGradientRect(x, y, width, height, colorStart, colorEnd, horizontal = false) {
        const gradient = horizontal
            ? this.ctx.createLinearGradient(x, y, x + width, y)
            : this.ctx.createLinearGradient(x, y, x, y + height);
        
        gradient.addColorStop(0, colorStart);
        gradient.addColorStop(1, colorEnd);
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(x, y, width, height);
    }
    
    /**
     * Draw radial gradient circle
     */
    drawRadialGradientCircle(x, y, innerRadius, outerRadius, colorInner, colorOuter) {
        const gradient = this.ctx.createRadialGradient(x, y, innerRadius, x, y, outerRadius);
        gradient.addColorStop(0, colorInner);
        gradient.addColorStop(1, colorOuter);
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(x, y, outerRadius, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    /**
     * Draw with pattern
     */
    drawPattern(x, y, width, height, imageOrCanvas, repeat = 'repeat') {
        const pattern = this.ctx.createPattern(imageOrCanvas, repeat);
        this.ctx.fillStyle = pattern;
        this.ctx.fillRect(x, y, width, height);
    }
    
    // ============================================
    // SPRITES & IMAGES
    // ============================================
    
    /**
     * Draw an image
     */
    drawImage(image, x, y, width = null, height = null) {
        if (width && height) {
            this.ctx.drawImage(image, x, y, width, height);
        } else {
            this.ctx.drawImage(image, x, y);
        }
    }
    
    /**
     * Draw a sprite from a spritesheet
     */
    drawSprite(spritesheet, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight) {
        this.ctx.drawImage(spritesheet, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
    }
    
    /**
     * Draw a rotated image
     */
    drawRotatedImage(image, x, y, width, height, rotation) {
        this.ctx.save();
        this.ctx.translate(x + width / 2, y + height / 2);
        this.ctx.rotate(rotation);
        this.ctx.drawImage(image, -width / 2, -height / 2, width, height);
        this.ctx.restore();
    }
    
    // ============================================
    // PARTICLES & EFFECTS
    // ============================================
    
    /**
     * Draw a simple particle
     */
    drawParticle(x, y, size, color, alpha = 1) {
        this.ctx.save();
        this.ctx.globalAlpha = alpha;
        this.drawCircle(x, y, size, color);
        this.ctx.restore();
    }
    
    /**
     * Draw a trail/motion blur effect
     */
    drawTrail(positions, color, maxAlpha = 1) {
        positions.forEach((pos, index) => {
            const alpha = (index / positions.length) * maxAlpha;
            this.ctx.save();
            this.ctx.globalAlpha = alpha;
            this.drawCircle(pos.x, pos.y, pos.size || 5, color);
            this.ctx.restore();
        });
    }
    
    // ============================================
    // UTILITY METHODS
    // ============================================
    
    /**
     * Clear the entire canvas
     */
    clear(color = null) {
        if (color) {
            this.ctx.fillStyle = color;
            this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        } else {
            this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        }
    }
    
    /**
     * Save context state
     */
    save() {
        this.ctx.save();
    }
    
    /**
     * Restore context state
     */
    restore() {
        this.ctx.restore();
    }
    
    /**
     * Set global alpha
     */
    setAlpha(alpha) {
        this.ctx.globalAlpha = alpha;
    }
    
    /**
     * Set composite operation
     */
    setCompositeOperation(operation) {
        this.ctx.globalCompositeOperation = operation;
    }
    
    /**
     * Apply transformation
     */
    transform(translateX, translateY, rotation = 0, scaleX = 1, scaleY = 1) {
        this.ctx.translate(translateX, translateY);
        if (rotation) this.ctx.rotate(rotation);
        if (scaleX !== 1 || scaleY !== 1) this.ctx.scale(scaleX, scaleY);
    }
    
    /**
     * Reset transformation
     */
    resetTransform() {
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    
    /**
     * Clip to rectangle
     */
    clipRect(x, y, width, height) {
        this.ctx.beginPath();
        this.ctx.rect(x, y, width, height);
        this.ctx.clip();
    }
}

// Static utility methods (can be used without instance)
Renderer.hexToRgb = function(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
};

Renderer.rgbToHex = function(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

Renderer.lerp = function(start, end, t) {
    return start + (end - start) * t;
};

Renderer.lerpColor = function(color1, color2, t) {
    const c1 = Renderer.hexToRgb(color1);
    const c2 = Renderer.hexToRgb(color2);
    
    if (!c1 || !c2) return color1;
    
    const r = Math.round(Renderer.lerp(c1.r, c2.r, t));
    const g = Math.round(Renderer.lerp(c1.g, c2.g, t));
    const b = Math.round(Renderer.lerp(c1.b, c2.b, t));
    
    return Renderer.rgbToHex(r, g, b);
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Renderer;
}
