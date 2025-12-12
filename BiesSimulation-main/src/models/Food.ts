/**
 * Food Entity
 */

import { Entity } from './Entity';
import { runtimeConfig } from '../config/runtimeConfig';

export class Food extends Entity {
    public energyValue: number;

    constructor(x: number, y: number, energyValue?: number) {
        super(x, y);
        this.energyValue = energyValue ?? runtimeConfig.FOOD_VALUE;
    }

    /**
     * Reset food state for reuse from pool.
     */
    resetForSpawn(x: number, y: number, energyValue?: number): void {
        this.id = crypto.randomUUID();
        this.position.set(x, y);
        this.energyValue = energyValue ?? runtimeConfig.FOOD_VALUE;
        this.isDead = false;
    }

    resetToPool(): void {
        this.isDead = false;
        this.energyValue = 0;
    }
}
