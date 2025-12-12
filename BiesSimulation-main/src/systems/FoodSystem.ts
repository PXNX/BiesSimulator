/**
 * Food System
 * Handles food respawning, hotspots, and food management
 */

import { Food } from '../models/Food';
import { CONFIG, getWorldDimensions } from '../config/globalConfig';
import { Vector2 } from '../models/Vector2';
import { random, randomInt, randomRange } from '../utils/RNG';

export interface FoodHotspot {
    position: Vector2;
    radius: number;
}

export class FoodSystem {
    private respawnAccumulator: number = 0;
    private hotspots: FoodHotspot[] = [];

    constructor(private createFood: (x: number, y: number) => Food = (x, y) => new Food(x, y)) {
        this.initializeHotspots();
    }

    /**
     * Initialize food hotspots
     */
    private initializeHotspots(): void {
        if (!CONFIG.FOOD_HOTSPOTS_ENABLED) return;

        const { width, height } = getWorldDimensions();
        this.hotspots = [];

        for (let i = 0; i < CONFIG.FOOD_HOTSPOT_COUNT; i++) {
                this.hotspots.push({
                    position: new Vector2(
                    randomRange(50, width - 50),
                    randomRange(50, height - 50)
                ),
                radius: CONFIG.FOOD_HOTSPOT_RADIUS,
            });
        }
    }

    /**
     * Regenerate hotspot positions (e.g., on world resize)
     */
    regenerateHotspots(): void {
        this.initializeHotspots();
    }

    /**
     * Update food system - respawn food over time
     */
    update(food: Food[], delta: number): Food[] {
        const newFood: Food[] = [];

        // Skip if at max food
        const aliveFood = food.filter(f => !f.isDead).length;
        if (aliveFood >= CONFIG.MAX_FOOD) {
            return newFood;
        }

        // Accumulate respawn time
        this.respawnAccumulator += delta;

        // Check if we should spawn food
        const respawnInterval = 1 / CONFIG.FOOD_RESPAWN_RATE;
        while (this.respawnAccumulator >= respawnInterval) {
            this.respawnAccumulator -= respawnInterval;

            // Spawn a batch of food
            const toSpawn = Math.min(
                CONFIG.FOOD_RESPAWN_BATCH,
                CONFIG.MAX_FOOD - aliveFood - newFood.length
            );

            for (let i = 0; i < toSpawn; i++) {
                const pos = this.getSpawnPosition();
                newFood.push(this.createFood(pos.x, pos.y));
            }
        }

        return newFood;
    }

    /**
     * Get a spawn position (considering hotspots)
     */
    private getSpawnPosition(): Vector2 {
        const { width, height } = getWorldDimensions();
        const margin = 20;

        // Check if we should spawn in a hotspot
        if (CONFIG.FOOD_HOTSPOTS_ENABLED &&
            this.hotspots.length > 0 &&
            random() < CONFIG.FOOD_HOTSPOT_WEIGHT) {

            // Pick a random hotspot
            const hotspot = this.hotspots[randomInt(this.hotspots.length)];

            // Random position within hotspot
            const angle = randomRange(0, Math.PI * 2);
            const distance = randomRange(0, hotspot.radius);
            const x = hotspot.position.x + Math.cos(angle) * distance;
            const y = hotspot.position.y + Math.sin(angle) * distance;

            return new Vector2(
                Math.max(margin, Math.min(width - margin, x)),
                Math.max(margin, Math.min(height - margin, y))
            );
        }

        // Random position
        return new Vector2(
            randomRange(margin, width - margin),
            randomRange(margin, height - margin)
        );
    }

    /**
     * Get current hotspot positions (for debug rendering)
     */
    getHotspots(): FoodHotspot[] {
        return this.hotspots;
    }

    /**
     * Spawn initial food
     */
    spawnInitialFood(count: number): Food[] {
        const food: Food[] = [];
        for (let i = 0; i < count; i++) {
            const pos = this.getSpawnPosition();
            food.push(this.createFood(pos.x, pos.y));
        }
        return food;
    }
}
