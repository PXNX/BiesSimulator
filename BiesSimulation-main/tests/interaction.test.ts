import { describe, it, expect } from 'vitest';
import { Agent } from '../src/models/Agent';
import { Food } from '../src/models/Food';
import { SpatialGrid } from '../src/core/SpatialGrid';
import { InteractionSystem } from '../src/systems/InteractionSystem';
import { CONFIG, setWorldDimensions } from '../src/config/globalConfig';

describe('InteractionSystem', () => {
    it('applies fight cost and clamps energy to MAX_ENERGY', () => {
        setWorldDimensions(200, 200);

        const aggressive = new Agent(0, 0, 'Aggressive', {
            aggression: 0.4,
            speed: 1,
            vision: 1,
            stamina: 1,
        });
        const passive = new Agent(10, 0, 'Passive', {
            aggression: 0.2,
            speed: 1,
            vision: 1,
            stamina: 1,
        });

        aggressive.energy = CONFIG.MAX_ENERGY - 5;
        passive.energy = 100;

        const agentGrid = new SpatialGrid<Agent>(200, 200, CONFIG.VISION_RADIUS);
        const foodGrid = new SpatialGrid<Food>(200, 200, CONFIG.VISION_RADIUS);
        agentGrid.insert(aggressive);
        agentGrid.insert(passive);

        const system = new InteractionSystem();
        system.update([aggressive, passive], [], agentGrid, foodGrid);

        expect(aggressive.energy).toBe(CONFIG.MAX_ENERGY);
        expect(passive.energy).toBe(90);
    });
});

