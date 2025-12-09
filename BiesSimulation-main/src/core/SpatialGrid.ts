/**
 * SpatialGrid - Efficient spatial partitioning for neighbor queries
 * Divides the world into cells for O(1) average-case neighbor lookups
 */

import { Vector2 } from '../models/Vector2';

interface SpatialEntity {
    id: string;
    position: Vector2;
}

interface GridCell {
    entities: Set<string>;
}

export class SpatialGrid<T extends SpatialEntity> {
    private cells: Map<string, GridCell> = new Map();
    private entityCells: Map<string, string> = new Map(); // entity id -> cell key
    private entityMap: Map<string, T> = new Map();

    private cellSize: number;
    private width: number;
    private height: number;
    private cols: number;
    private rows: number;

    constructor(width: number, height: number, cellSize: number) {
        this.width = width;
        this.height = height;
        this.cellSize = cellSize;
        this.cols = Math.ceil(width / cellSize);
        this.rows = Math.ceil(height / cellSize);
    }

    /**
     * Update grid dimensions (e.g., on window resize)
     */
    resize(width: number, height: number): void {
        this.width = width;
        this.height = height;
        this.cols = Math.ceil(width / this.cellSize);
        this.rows = Math.ceil(height / this.cellSize);
        // Re-insert all entities
        const entities = Array.from(this.entityMap.values());
        this.clear();
        for (const entity of entities) {
            this.insert(entity);
        }
    }

    /**
     * Get cell key from position
     */
    private getCellKey(x: number, y: number): string {
        const col = Math.floor(Math.max(0, Math.min(x, this.width - 1)) / this.cellSize);
        const row = Math.floor(Math.max(0, Math.min(y, this.height - 1)) / this.cellSize);
        return `${col},${row}`;
    }

    /**
     * Get or create a cell
     */
    private getCell(key: string): GridCell {
        let cell = this.cells.get(key);
        if (!cell) {
            cell = { entities: new Set() };
            this.cells.set(key, cell);
        }
        return cell;
    }

    /**
     * Insert an entity into the grid
     */
    insert(entity: T): void {
        const key = this.getCellKey(entity.position.x, entity.position.y);
        const cell = this.getCell(key);

        // Remove from old cell if exists
        const oldKey = this.entityCells.get(entity.id);
        if (oldKey && oldKey !== key) {
            const oldCell = this.cells.get(oldKey);
            if (oldCell) {
                oldCell.entities.delete(entity.id);
            }
        }

        cell.entities.add(entity.id);
        this.entityCells.set(entity.id, key);
        this.entityMap.set(entity.id, entity);
    }

    /**
     * Remove an entity from the grid
     */
    remove(entity: T): void {
        const key = this.entityCells.get(entity.id);
        if (key) {
            const cell = this.cells.get(key);
            if (cell) {
                cell.entities.delete(entity.id);
            }
            this.entityCells.delete(entity.id);
        }
        this.entityMap.delete(entity.id);
    }

    /**
     * Update entity position in grid
     */
    update(entity: T): void {
        this.insert(entity); // Insert handles moving between cells
    }

    /**
     * Query all entities within radius of a position
     */
    queryRadius(position: Vector2, radius: number): T[] {
        const results: T[] = [];
        const radiusSq = radius * radius;

        // Calculate cell range to check
        const minCol = Math.floor((position.x - radius) / this.cellSize);
        const maxCol = Math.ceil((position.x + radius) / this.cellSize);
        const minRow = Math.floor((position.y - radius) / this.cellSize);
        const maxRow = Math.ceil((position.y + radius) / this.cellSize);

        for (let col = minCol; col <= maxCol; col++) {
            for (let row = minRow; row <= maxRow; row++) {
                // Clamp to grid bounds
                if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) continue;

                const key = `${col},${row}`;
                const cell = this.cells.get(key);
                if (!cell) continue;

                for (const entityId of cell.entities) {
                    const entity = this.entityMap.get(entityId);
                    if (entity) {
                        const distSq = position.distSq(entity.position);
                        if (distSq <= radiusSq) {
                            results.push(entity);
                        }
                    }
                }
            }
        }

        return results;
    }

    /**
     * Query all entities near another entity (excluding self)
     */
    queryNear(entity: T, radius: number): T[] {
        return this.queryRadius(entity.position, radius)
            .filter(e => e.id !== entity.id);
    }

    /**
     * Get all entities in a rectangular area
     */
    queryRect(x: number, y: number, width: number, height: number): T[] {
        const results: T[] = [];

        const minCol = Math.floor(x / this.cellSize);
        const maxCol = Math.ceil((x + width) / this.cellSize);
        const minRow = Math.floor(y / this.cellSize);
        const maxRow = Math.ceil((y + height) / this.cellSize);

        for (let col = minCol; col <= maxCol; col++) {
            for (let row = minRow; row <= maxRow; row++) {
                if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) continue;

                const key = `${col},${row}`;
                const cell = this.cells.get(key);
                if (!cell) continue;

                for (const entityId of cell.entities) {
                    const entity = this.entityMap.get(entityId);
                    if (entity &&
                        entity.position.x >= x &&
                        entity.position.x <= x + width &&
                        entity.position.y >= y &&
                        entity.position.y <= y + height) {
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
        this.cells.clear();
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
}
