import { describe, it, expect } from 'vitest';
import { Agent } from '../src/models/Agent';
import { EvolutionSystem } from '../src/systems/EvolutionSystem';
import { CONFIG } from '../src/config/globalConfig';

describe('EvolutionSystem', () => {
    it('kills agents that exceed MAX_AGE', () => {
        const agent = new Agent(0, 0, 'Passive', {
            aggression: 0.2,
            speed: 1,
            vision: 1,
            stamina: 1,
        });
        agent.energy = 100;
        agent.age = CONFIG.MAX_AGE + 1;

        const system = new EvolutionSystem();
        const { deadAgents } = system.update([agent]);

        expect(deadAgents).toHaveLength(1);
        expect(agent.isDead).toBe(true);
    });
});

