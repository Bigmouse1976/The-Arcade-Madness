/**
 * The Arcade Madness - Collision Detection
 * Utilities for detecting collisions between various shapes
 */

class CollisionDetector {
    constructor() {
        console.log('💥 CollisionDetector initialized');
    }
    
    // ============================================
    // RECTANGLE COLLISIONS
    // ============================================
    
    /**
     * Check if two rectangles overlap (AABB collision)
     * @param {Object} rect1 - {x, y, width, height}
     * @param {Object} rect2 - {x, y, width, height}
     * @returns {boolean}
     */
    rectRect(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    /**
     * Check if a point is inside a rectangle
     * @param {number} px - Point x
     * @param {number} py - Point y
     * @param {Object} rect - {x, y, width, height}
     * @returns {boolean}
     */
    pointRect(px, py, rect) {
        return px >= rect.x &&
               px <= rect.x + rect.width &&
               py >= rect.y &&
               py <= rect.y + rect.height;
    }
    
    // ============================================
    // CIRCLE COLLISIONS
    // ============================================
    
    /**
     * Check if two circles overlap
     * @param {Object} circle1 - {x, y, radius}
     * @param {Object} circle2 - {x, y, radius}
     * @returns {boolean}
     */
    circleCircle(circle1, circle2) {
        const dx = circle2.x - circle1.x;
        const dy = circle2.y - circle1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < circle1.radius + circle2.radius;
    }
    
    /**
     * Check if a point is inside a circle
     * @param {number} px - Point x
     * @param {number} py - Point y
     * @param {Object} circle - {x, y, radius}
     * @returns {boolean}
     */
    pointCircle(px, py, circle) {
        const dx = px - circle.x;
        const dy = py - circle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance <= circle.radius;
    }
    
    /**
     * Check if a circle and rectangle overlap
     * @param {Object} circle - {x, y, radius}
     * @param {Object} rect - {x, y, width, height}
     * @returns {boolean}
     */
    circleRect(circle, rect) {
        // Find the closest point on the rectangle to the circle center
        const closestX = this.clamp(circle.x, rect.x, rect.x + rect.width);
        const closestY = this.clamp(circle.y, rect.y, rect.y + rect.height);
        
        // Calculate distance from circle center to this closest point
        const dx = circle.x - closestX;
        const dy = circle.y - closestY;
        const distanceSquared = dx * dx + dy * dy;
        
        return distanceSquared < circle.radius * circle.radius;
    }
    
    // ============================================
    // GRID-BASED COLLISIONS (for Snake, Pac-Man, Sokoban)
    // ============================================
    
    /**
     * Check if two grid positions are the same
     * @param {Object} pos1 - {x, y}
     * @param {Object} pos2 - {x, y}
     * @returns {boolean}
     */
    gridPosition(pos1, pos2) {
        return pos1.x === pos2.x && pos1.y === pos2.y;
    }
    
    /**
     * Check if a position collides with any in an array
     * @param {Object} pos - {x, y}
     * @param {Array} positions - Array of {x, y}
     * @returns {boolean}
     */
    gridPositionInArray(pos, positions) {
        return positions.some(p => this.gridPosition(pos, p));
    }
    
    /**
     * Check if grid position is within bounds
     * @param {Object} pos - {x, y}
     * @param {number} width - Grid width
     * @param {number} height - Grid height
     * @returns {boolean}
     */
    gridWithinBounds(pos, width, height) {
        return pos.x >= 0 && pos.x < width && pos.y >= 0 && pos.y < height;
    }
    
    // ============================================
    // LINE COLLISIONS
    // ============================================
    
    /**
     * Check if two line segments intersect
     * @param {Object} line1 - {x1, y1, x2, y2}
     * @param {Object} line2 - {x1, y1, x2, y2}
     * @returns {boolean}
     */
    lineLine(line1, line2) {
        const { x1: x1, y1: y1, x2: x2, y2: y2 } = line1;
        const { x1: x3, y1: y3, x2: x4, y2: y4 } = line2;
        
        const denom = ((y4 - y3) * (x2 - x1)) - ((x4 - x3) * (y2 - y1));
        
        if (denom === 0) return false; // Lines are parallel
        
        const ua = (((x4 - x3) * (y1 - y3)) - ((y4 - y3) * (x1 - x3))) / denom;
        const ub = (((x2 - x1) * (y1 - y3)) - ((y2 - y1) * (x1 - x3))) / denom;
        
        return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
    }
    
    /**
     * Check if a line segment intersects with a rectangle
     * @param {Object} line - {x1, y1, x2, y2}
     * @param {Object} rect - {x, y, width, height}
     * @returns {boolean}
     */
    lineRect(line, rect) {
        // Check each edge of the rectangle
        const edges = [
            { x1: rect.x, y1: rect.y, x2: rect.x + rect.width, y2: rect.y }, // Top
            { x1: rect.x + rect.width, y1: rect.y, x2: rect.x + rect.width, y2: rect.y + rect.height }, // Right
            { x1: rect.x, y1: rect.y + rect.height, x2: rect.x + rect.width, y2: rect.y + rect.height }, // Bottom
            { x1: rect.x, y1: rect.y, x2: rect.x, y2: rect.y + rect.height } // Left
        ];
        
        return edges.some(edge => this.lineLine(line, edge));
    }
    
    // ============================================
    // POLYGON COLLISIONS
    // ============================================
    
    /**
     * Check if a point is inside a polygon (ray casting algorithm)
     * @param {number} px - Point x
     * @param {number} py - Point y
     * @param {Array} vertices - Array of {x, y} points
     * @returns {boolean}
     */
    pointPolygon(px, py, vertices) {
        let inside = false;
        
        for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
            const xi = vertices[i].x;
            const yi = vertices[i].y;
            const xj = vertices[j].x;
            const yj = vertices[j].y;
            
            const intersect = ((yi > py) !== (yj > py)) &&
                            (px < (xj - xi) * (py - yi) / (yj - yi) + xi);
            
            if (intersect) inside = !inside;
        }
        
        return inside;
    }
    
    // ============================================
    // SAT (SEPARATING AXIS THEOREM) for rotated rectangles
    // ============================================
    
    /**
     * Check collision between two oriented rectangles using SAT
     * @param {Object} rect1 - {x, y, width, height, rotation}
     * @param {Object} rect2 - {x, y, width, height, rotation}
     * @returns {boolean}
     */
    orientedRectRect(rect1, rect2) {
        const corners1 = this.getRectCorners(rect1);
        const corners2 = this.getRectCorners(rect2);
        
        const axes = [
            ...this.getRectAxes(rect1),
            ...this.getRectAxes(rect2)
        ];
        
        for (const axis of axes) {
            const proj1 = this.projectPolygon(corners1, axis);
            const proj2 = this.projectPolygon(corners2, axis);
            
            if (!this.overlapOnAxis(proj1, proj2)) {
                return false; // Found a separating axis
            }
        }
        
        return true; // No separating axis found, rectangles collide
    }
    
    getRectCorners(rect) {
        const { x, y, width, height, rotation = 0 } = rect;
        const cos = Math.cos(rotation);
        const sin = Math.sin(rotation);
        
        const corners = [
            { x: -width / 2, y: -height / 2 },
            { x: width / 2, y: -height / 2 },
            { x: width / 2, y: height / 2 },
            { x: -width / 2, y: height / 2 }
        ];
        
        return corners.map(corner => ({
            x: x + corner.x * cos - corner.y * sin,
            y: y + corner.x * sin + corner.y * cos
        }));
    }
    
    getRectAxes(rect) {
        const corners = this.getRectCorners(rect);
        return [
            { x: corners[1].x - corners[0].x, y: corners[1].y - corners[0].y },
            { x: corners[3].x - corners[0].x, y: corners[3].y - corners[0].y }
        ].map(axis => this.normalize(axis));
    }
    
    projectPolygon(vertices, axis) {
        let min = Infinity;
        let max = -Infinity;
        
        for (const vertex of vertices) {
            const projection = vertex.x * axis.x + vertex.y * axis.y;
            min = Math.min(min, projection);
            max = Math.max(max, projection);
        }
        
        return { min, max };
    }
    
    overlapOnAxis(proj1, proj2) {
        return !(proj1.max < proj2.min || proj2.max < proj1.min);
    }
    
    normalize(vector) {
        const length = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
        return { x: vector.x / length, y: vector.y / length };
    }
    
    // ============================================
    // SPATIAL PARTITIONING (for optimization)
    // ============================================
    
    /**
     * Simple grid-based spatial hash for broad phase collision detection
     */
    createSpatialHash(cellSize) {
        return {
            cellSize: cellSize,
            cells: new Map(),
            
            getCellKey(x, y) {
                const cellX = Math.floor(x / this.cellSize);
                const cellY = Math.floor(y / this.cellSize);
                return `${cellX},${cellY}`;
            },
            
            insert(object, x, y) {
                const key = this.getCellKey(x, y);
                if (!this.cells.has(key)) {
                    this.cells.set(key, []);
                }
                this.cells.get(key).push(object);
            },
            
            query(x, y, radius = 0) {
                const results = [];
                const minX = Math.floor((x - radius) / this.cellSize);
                const maxX = Math.floor((x + radius) / this.cellSize);
                const minY = Math.floor((y - radius) / this.cellSize);
                const maxY = Math.floor((y + radius) / this.cellSize);
                
                for (let cy = minY; cy <= maxY; cy++) {
                    for (let cx = minX; cx <= maxX; cx++) {
                        const key = `${cx},${cy}`;
                        const cell = this.cells.get(key);
                        if (cell) {
                            results.push(...cell);
                        }
                    }
                }
                
                return results;
            },
            
            clear() {
                this.cells.clear();
            }
        };
    }
    
    // ============================================
    // UTILITY METHODS
    // ============================================
    
    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }
    
    distance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    distanceSquared(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return dx * dx + dy * dy;
    }
    
    /**
     * Get the overlap amount between two rectangles
     * @returns {Object|null} {x, y} overlap or null if no collision
     */
    getRectOverlap(rect1, rect2) {
        if (!this.rectRect(rect1, rect2)) return null;
        
        const overlapX = Math.min(
            rect1.x + rect1.width - rect2.x,
            rect2.x + rect2.width - rect1.x
        );
        
        const overlapY = Math.min(
            rect1.y + rect1.height - rect2.y,
            rect2.y + rect2.height - rect1.y
        );
        
        return { x: overlapX, y: overlapY };
    }
    
    /**
     * Get collision normal (direction to push objects apart)
     * @returns {Object} {x, y} normalized direction
     */
    getCollisionNormal(rect1, rect2) {
        const centerX1 = rect1.x + rect1.width / 2;
        const centerY1 = rect1.y + rect1.height / 2;
        const centerX2 = rect2.x + rect2.width / 2;
        const centerY2 = rect2.y + rect2.height / 2;
        
        const dx = centerX2 - centerX1;
        const dy = centerY2 - centerY1;
        const length = Math.sqrt(dx * dx + dy * dy);
        
        if (length === 0) return { x: 0, y: 1 };
        
        return { x: dx / length, y: dy / length };
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CollisionDetector;
}
