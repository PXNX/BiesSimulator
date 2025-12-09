/**
 * Object Pool - Reusable object allocation to reduce GC pressure
 */

export class ObjectPool<T> {
    private pool: T[] = [];
    private factory: () => T;
    private reset: (obj: T) => void;
    private maxSize: number;

    constructor(
        factory: () => T,
        reset: (obj: T) => void,
        initialSize: number = 50,
        maxSize: number = 200
    ) {
        this.factory = factory;
        this.reset = reset;
        this.maxSize = maxSize;

        // Pre-allocate
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(factory());
        }
    }

    /**
     * Get an object from the pool
     */
    acquire(): T {
        if (this.pool.length > 0) {
            return this.pool.pop()!;
        }
        return this.factory();
    }

    /**
     * Return an object to the pool
     */
    release(obj: T): void {
        if (this.pool.length < this.maxSize) {
            this.reset(obj);
            this.pool.push(obj);
        }
    }

    /**
     * Get current pool size
     */
    get size(): number {
        return this.pool.length;
    }

    /**
     * Clear the pool
     */
    clear(): void {
        this.pool = [];
    }
}

/**
 * Vector2 Pool for reducing allocations in hot loops
 */
import { Vector2 } from '../models/Vector2';

export const vector2Pool = new ObjectPool<Vector2>(
    () => new Vector2(0, 0),
    (v) => { v.x = 0; v.y = 0; },
    100,
    500
);

/**
 * Helper to get a pooled vector and auto-release after callback
 */
export function withPooledVector<R>(callback: (v: Vector2) => R): R {
    const v = vector2Pool.acquire();
    try {
        return callback(v);
    } finally {
        vector2Pool.release(v);
    }
}
