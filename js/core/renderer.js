/**
 * The Arcade Madness - Renderer Utilities
 * Common rendering functions
 */

class Renderer {
    static drawRect(ctx, x, y, width, height, color) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, width, height);
    }

    static drawCircle(ctx, x, y, radius, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    static drawText(ctx, text, x, y, color = '#fff', font = '20px Arial') {
        ctx.fillStyle = color;
        ctx.font = font;
        ctx.textAlign = 'center';
        ctx.fillText(text, x, y);
    }

    static drawGrid(ctx, cellSize, cols, rows, color = '#333') {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;

        // Vertical lines
        for (let i = 0; i <= cols; i++) {
            ctx.beginPath();
            ctx.moveTo(i * cellSize, 0);
            ctx.lineTo(i * cellSize, rows * cellSize);
            ctx.stroke();
        }

        // Horizontal lines
        for (let i = 0; i <= rows; i++) {
            ctx.beginPath();
            ctx.moveTo(0, i * cellSize);
            ctx.lineTo(cols * cellSize, i * cellSize);
            ctx.stroke();
        }
    }
}
