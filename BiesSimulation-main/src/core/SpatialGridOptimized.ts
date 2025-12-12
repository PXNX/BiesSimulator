/**
 * Optimized SpatialGrid - High-performance spatial partitioning
 * Uses arrays instead of Maps/Sets for better cache locality
 * Pre-allocates buffers to minimize GC pressure
 */

import { Vector2 } from '../models/Vector2';

interface SpatialEntity {
    id: string;
    position: Vector2;
}

export class SpatialGridOptimized<T extends SpatialEntity> {
    // Use flat arrays for better performance
    private cells: Array<T[]>;
    private entityCells: Map<string, number> = new Map(); // entity id -> cell index
    private entityMap: Map<string, T> = new Map();

    // Pre-allocated query result buffer
    private queryBuffer: T[] = [];
    private readonly MAX_QUERY_RESULTS = 100;

    private cellSize: number;
    private width: number;
    private height: number;
    private cols: number;
    private rows: number;
    private totalCells: number;

    constructor(width: number, height: number, cellSize: number) {
        this.width = width;
        this.height = height;
        this.cellSize = cellSize;
        this.cols = Math.ceil(width / cellSize);
        this.rows = Math.ceil(height / cellSize);
        this.totalCells = this.cols * this.rows;

        // Pre-allocate all cells
        this.cells = new Array(this.totalCells);
        for (let i = 0; i < this.totalCells; i++) {
            this.cells[i] = [];
        }

        // Pre-allocate query buffer
        this.queryBuffer = new Array(this.MAX_QUERY_RESULTS);
    }

    /**
     * Update grid dimensions (e.g., on window resize)
     */
    resize(width: number, height: number): void {
        this.width = width;
        this.height = height;
        this.cols = Math.ceil(width / this.cellSize);
        this.rows = Math.ceil(height / this.cellSize);
        this.totalCells = this.cols * this.rows;

        // Re-allocate cells
        const entities = Array.from(this.entityMap.values());
        this.cells = new Array(this.totalCells);
        for (let i = 0; i < this.totalCells; i++) {
            this.cells[i] = [];
        }
        this.entityCells.clear();

        // Re-insert all entities
        for (let i = 0; i < entities.length; i++) {
            this.insert(entities[i]);
        }
    }

    /**
     * Get cell index from position (inline for performance)
     */
    private getCellIndex(x: number, y: number): number {
        const col = Math.floor(Math.max(0, Math.min(x, this.width - 1)) / this.cellSize);
        const row = Math.floor(Math.max(0, Math.min(y, this.height - 1)) / this.cellSize);
        return row * this.cols + col;
    }

    /**
     * Insert an entity into the grid
     */
    insert(entity: T): void {
        const index = this.getCellIndex(entity.position.x, entity.position.y);

        // Remove from old cell if exists
        const oldIndex = this.entityCells.get(entity.id);
        if (oldIndex !== undefined && oldIndex !== index) {
            const oldCell = this.cells[oldIndex];
            const idx = oldCell.indexOf(entity);
            if (idx !== -1) {
                // Swap with last element and pop (faster than splice)
                const last = oldCell.length - 1;
                if (idx !== last) {
                    oldCell[idx] = oldCell[last];
                }
                oldCell.pop();
            }
        }

        this.cells[index].push(entity);
        this.entityCells.set(entity.id, index);
        this.entityMap.set(entity.id, entity);
    }

    /**
     * Remove an entity from the grid
     */
    remove(entity: T): void {
        const index = this.entityCells.get(entity.id);
        if (index !== undefined) {
            const cell = this.cells[index];
            const idx = cell.indexOf(entity);
            if (idx !== -1) {
                // Swap with last element and pop (faster than splice)
                const last = cell.length - 1;
                if (idx !== last) {
                    cell[idx] = cell[last];
                }
                cell.pop();
            }
            this.entityCells.delete(entity.id);
        }
        this.entityMap.delete(entity.id);
    }

    /**
     * Update entity position in grid (fast path for moving entities)
     */
    update(entity: T): void {
        const newIndex = this.getCellIndex(entity.position.x, entity.position.y);
        const oldIndex = this.entityCells.get(entity.id);

        // Only update if cell changed
        if (oldIndex !== newIndex) {
            this.insert(entity);
        }
    }

    /**
     * Query all entities within radius of a position (optimized)
     */
    queryRadius(position: Vector2, radius: number): T[] {
        const results: T[] = [];
        const radiusSq = radius * radius;
        const px = position.x;
        const py = position.y;

        // Calculate cell range to check
        const cellRadius = Math.ceil(radius / this.cellSize);
        const centerCol = Math.floor(px / this.cellSize);
        const centerRow = Math.floor(py / this.cellSize);

        const minCol = Math.max(0, centerCol - cellRadius);
        const maxCol = Math.min(this.cols - 1, centerCol + cellRadius);
        const minRow = Math.max(0, centerRow - cellRadius);
        const maxRow = Math.min(this.rows - 1, centerRow + cellRadius);

        // Iterate through cells
        for (let row = minRow; row <= maxRow; row++) {
            const baseIndex = row * this.cols;
            for (let col = minCol; col <= maxCol; col++) {
                const cell = this.cells[baseIndex + col];

                // Check each entity in cell
                for (let i = 0, len = cell.length; i < len; i++) {
                    const entity = cell[i];
                    const dx = px - entity.position.x;
                    const dy = py - entity.position.y;
                    const distSq = dx * dx + dy * dy;

                    if (distSq <= radiusSq) {
                        results.push(entity);
                    }
                }
            }
        }

        return results;
    }

    /**
     * Query all entities near another entity (excluding self) - most common operation
     */
    queryNear(entity: T, radius: number): T[] {
        const results: T[] = [];
        const radiusSq = radius * radius;
        const px = entity.position.x;
        const py = entity.position.y;
        const entityId = entity.id;

        // Calculate cell range
        const cellRadius = Math.ceil(radius / this.cellSize);
        const centerCol = Math.floor(px / this.cellSize);
        const centerRow = Math.floor(py / this.cellSize);

        const minCol = Math.max(0, centerCol - cellRadius);
        const maxCol = Math.min(this.cols - 1, centerCol + cellRadius);
        const minRow = Math.max(0, centerRow - cellRadius);
        const maxRow = Math.min(this.rows - 1, centerRow + cellRadius);

        // Iterate through cells
        for (let row = minRow; row <= maxRow; row++) {
            const baseIndex = row * this.cols;
            for (let col = minCol; col <= maxCol; col++) {
                const cell = this.cells[baseIndex + col];

                // Check each entity in cell
                for (let i = 0, len = cell.length; i < len; i++) {
                    const other = cell[i];

                    // Skip self
                    if (other.id === entityId) continue;

                    // Fast distance check
                    const dx = px - other.position.x;
                    const dy = py - other.position.y;
                    const distSq = dx * dx + dy * dy;

                    if (distSq <= radiusSq) {
                        results.push(other);
                    }
                }
            }
        }

        return results;
    }

    /**
     * Query rectangular area (less common, but still optimized)
     */
    queryRect(x: number, y: number, width: number, height: number): T[] {
        const results: T[] = [];
        const x2 = x + width;
        const y2 = y + height;

        const minCol = Math.max(0, Math.floor(x / this.cellSize));
        const maxCol = Math.min(this.cols - 1, Math.ceil(x2 / this.cellSize));
        const minRow = Math.max(0, Math.floor(y / this.cellSize));
        const maxRow = Math.min(this.rows - 1, Math.ceil(y2 / this.cellSize));

        for (let row = minRow; row <= maxRow; row++) {
            const baseIndex = row * this.cols;
            for (let col = minCol; col <= maxCol; col++) {
                const cell = this.cells[baseIndex + col];

                for (let i = 0, len = cell.length; i < len; i++) {
                    const entity = cell[i];
                    const ex = entity.position.x;
                    const ey = entity.position.y;

                    if (ex >= x && ex <= x2 && ey >= y && ey <= y2) {
                        results.push(entity);
                    }
                }
            }
        }

        return results;
    }

    /**
     * Clear all entities from the grid
     */
    clear(): void {
        for (let i = 0; i < this.totalCells; i++) {
            this.cells[i].length = 0; // Clear array without reallocation
        }
        this.entityCells.clear();
        this.entityMap.clear();
    }

    /**
     * Get total number of entities
     */
    get size(): number {
        return this.entityMap.size;
    }

    /**
     * Get all entities
     */
    getAll(): T[] {
        return Array.from(this.entityMap.values());
    }

    /**
     * Get grid statistics (for debugging)
     */
    getStats(): { totalCells: number; occupiedCells: number; avgEntitiesPerCell: number } {
        let occupiedCells = 0;
        let totalEntities = 0;

        for (let i = 0; i < this.totalCells; i++) {
            const count = this.cells[i].length;
            if (count > 0) {
                occupiedCells++;
                totalEntities += count;
            }
        }

        return {
            totalCells: this.totalCells,
            occupiedCells,
            avgEntitiesPerCell: occupiedCells > 0 ? totalEntities / occupiedCells : 0
        };
    }
}
