/**
 * Food Entity
 */

import { Entity } from './Entity';
import { CONFIG } from '../config/globalConfig';

export class Food extends Entity {
    public energyValue: number;

    constructor(x: number, y: number, energyValue?: number) {
        super(x, y);
        this.energyValue = energyValue ?? CONFIG.FOOD_VALUE;
    }

    /**
     * Reset food state for reuse from pool.
     */
    resetForSpawn(x: number, y: number, energyValue?: number): void {
        this.id = crypto.randomUUID();
        this.position.set(x, y);
        this.energyValue = energyValue ?? CONFIG.FOOD_VALUE;
        this.isDead = false;
    }

    resetToPool(): void {
        this.isDead = false;
        this.energyValue = 0;
    }
}
