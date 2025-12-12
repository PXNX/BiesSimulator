/**
 * OptimizedSpatialGrid - Enhanced spatial partitioning with performance optimizations
 * Uses TypedArrays and efficient data structures for better cache locality
 */

import { Vector2 } from '../models/Vector2';

interface SpatialEntity {
    id: string;
    position: Vector2;
}

interface GridCell {
    entities: string[]; // Use array instead of Set for better iteration performance
    dirty: boolean;
}

export class OptimizedSpatialGrid<T extends SpatialEntity> {
    private cells: Map<number, GridCell> = new Map(); // Use numeric keys for better performance
    private entityCells: Map<string, number> = new Map();
    private entityMap: Map<string, T> = new Map();

    private cellSize: number;
    private width: number;
    private height: number;
    private cols: number;
    private rows: number;

    // Cache for query results to reduce allocations
    private queryCache: T[] = [];
    private queryCacheSize: number = 0;

    constructor(width: number, height: number, cellSize: number) {
        this.width = width;
        this.height = height;
        this.cellSize = cellSize;
        this.cols = Math.ceil(width / cellSize);
        this.rows = Math.ceil(height / cellSize);
    }

    /**
     * Update grid dimensions
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
     * Get cell key from position (optimized with bit operations)
     */
    private getCellKey(x: number, y: number): number {
        const col = Math.floor(Math.max(0, Math.min(x, this.width - 1)) / this.cellSize);
        const row = Math.floor(Math.max(0, Math.min(y, this.height - 1)) / this.cellSize);
        // Pack col and row into single number (assumes cols < 65536)
        return (row << 16) | col;
    }

    /**
     * Unpack cell key into col and row
     */
    // private unpackCellKey(key: number): { col: number; row: number } {
    //     return {
    //         col: key & 0xFFFF,
    //         row: key >>> 16,
    //     };
    // }

    /**
     * Get or create a cell
     */
    private getCell(key: number): GridCell {
        let cell = this.cells.get(key);
        if (!cell) {
            cell = { entities: [], dirty: false };
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
        if (oldKey !== undefined && oldKey !== key) {
            const oldCell = this.cells.get(oldKey);
            if (oldCell) {
                const index = oldCell.entities.indexOf(entity.id);
                if (index !== -1) {
                    oldCell.entities.splice(index, 1);
                    oldCell.dirty = true;
                }
            }
        }

        // Add to new cell if not already there
        if (!cell.entities.includes(entity.id)) {
            cell.entities.push(entity.id);
            cell.dirty = true;
        }

        this.entityCells.set(entity.id, key);
        this.entityMap.set(entity.id, entity);
    }

    /**
     * Remove an entity from the grid
     */
    remove(entity: T): void {
        const key = this.entityCells.get(entity.id);
        if (key !== undefined) {
            const cell = this.cells.get(key);
            if (cell) {
                const index = cell.entities.indexOf(entity.id);
                if (index !== -1) {
                    cell.entities.splice(index, 1);
                    cell.dirty = true;
                }
            }
            this.entityCells.delete(entity.id);
        }
        this.entityMap.delete(entity.id);
    }

    /**
     * Update entity position in grid
     */
    update(entity: T): void {
        this.insert(entity);
    }

    /**
     * Query all entities within radius (optimized)
     */
    queryRadius(position: Vector2, radius: number): T[] {
        // Reset cache
        this.queryCacheSize = 0;

        const radiusSq = radius * radius;

        // Calculate cell range
        const minCol = Math.max(0, Math.floor((position.x - radius) / this.cellSize));
        const maxCol = Math.min(this.cols - 1, Math.ceil((position.x + radius) / this.cellSize));
        const minRow = Math.max(0, Math.floor((position.y - radius) / this.cellSize));
        const maxRow = Math.min(this.rows - 1, Math.ceil((position.y + radius) / this.cellSize));

        for (let row = minRow; row <= maxRow; row++) {
            for (let col = minCol; col <= maxCol; col++) {
                const key = (row << 16) | col;
                const cell = this.cells.get(key);
                if (!cell) continue;

                for (const entityId of cell.entities) {
                    const entity = this.entityMap.get(entityId);
                    if (entity) {
                        const dx = position.x - entity.position.x;
                        const dy = position.y - entity.position.y;
                        const distSq = dx * dx + dy * dy;

                        if (distSq <= radiusSq) {
                            if (this.queryCacheSize < this.queryCache.length) {
                                this.queryCache[this.queryCacheSize] = entity;
                            } else {
                                this.queryCache.push(entity);
                            }
                            this.queryCacheSize++;
                        }
                    }
                }
            }
        }

        // Return view of cache
        return this.queryCache.slice(0, this.queryCacheSize);
    }

    /**
     * Query all entities near another entity (excluding self)
     */
    queryNear(entity: T, radius: number): T[] {
        const results = this.queryRadius(entity.position, radius);

        // Filter out self
        const filtered: T[] = [];
        for (let i = 0; i < results.length; i++) {
            if (results[i].id !== entity.id) {
                filtered.push(results[i]);
            }
        }
        return filtered;
    }

    /**
     * Clear all entities
     */
    clear(): void {
        this.cells.clear();
        this.entityCells.clear();
        this.entityMap.clear();
        this.queryCacheSize = 0;
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
     * Get grid statistics for debugging
     */
    getStats(): {
        totalCells: number;
        activeCells: number;
        avgEntitiesPerCell: number;
        maxEntitiesInCell: number;
    } {
        const activeCells = this.cells.size;
        let totalEntities = 0;
        let maxEntities = 0;

        for (const cell of this.cells.values()) {
            const count = cell.entities.length;
            totalEntities += count;
            maxEntities = Math.max(maxEntities, count);
        }

        return {
            totalCells: this.cols * this.rows,
            activeCells,
            avgEntitiesPerCell: activeCells > 0 ? totalEntities / activeCells : 0,
            maxEntitiesInCell: maxEntities,
        };
    }
}
