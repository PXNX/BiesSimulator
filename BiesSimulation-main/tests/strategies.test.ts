import { describe, it, expect } from 'vitest';
import { Agent } from '../src/models/Agent';

describe('Strategies', () => {
    it('Aggressive fights when energy is sufficient', () => {
        const hawk = new Agent(0, 0, 'Aggressive', {
            aggression: 1,
            speed: 1,
            vision: 1,
            stamina: 1,
        });
        const dove = new Agent(10, 0, 'Passive', {
            aggression: 0.2,
            speed: 1,
            vision: 1,
            stamina: 1,
        });

        hawk.energy = 100;
        expect(hawk.decideAction(dove)).toBe('FIGHT');
    });

    it('Aggressive flees when energy is critically low', () => {
        const hawk = new Agent(0, 0, 'Aggressive', {
            aggression: 1,
            speed: 1,
            vision: 1,
            stamina: 1,
        });
        const other = new Agent(10, 0, 'Passive');

        hawk.energy = 10;
        expect(hawk.decideAction(other)).toBe('FLEE');
    });

    it('TitForTat shares first, then mirrors last action', () => {
        const tft = new Agent(0, 0, 'TitForTat', {
            aggression: 0.5,
            speed: 1,
            vision: 1,
            stamina: 1,
        });
        const hawk = new Agent(10, 0, 'Aggressive', {
            aggression: 1,
            speed: 1,
            vision: 1,
            stamina: 1,
        });

        tft.energy = 100;
        expect(tft.decideAction(hawk)).toBe('SHARE');

        // Remember hawk fought last time.
        tft.rememberEncounter(hawk.id, 'FIGHT', 'lost');
        expect(tft.decideAction(hawk)).toBe('FIGHT');
    });
});

