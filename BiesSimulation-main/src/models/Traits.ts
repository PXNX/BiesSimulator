/**
 * Agent Traits - Defines individual characteristics
 */

export interface Traits {
    speed: number;          // Max speed multiplier (0.5 - 1.5)
    vision: number;         // Vision radius multiplier
    aggression: number;     // 0-1 scale, affects fight decisions
    stamina: number;        // Energy efficiency multiplier
}

export const DEFAULT_TRAITS: Traits = {
    speed: 1.0,
    vision: 1.0,
    aggression: 0.5,
    stamina: 1.0,
};

/**
 * Generate random variation on traits (for mutation/reproduction)
 */
export function mutateTraits(traits: Traits, mutationStrength: number = 0.1): Traits {
    const mutate = (value: number, min: number = 0, max: number = 2): number => {
        const delta = (Math.random() - 0.5) * 2 * mutationStrength;
        return Math.max(min, Math.min(max, value + delta));
    };

    return {
        speed: mutate(traits.speed, 0.5, 1.5),
        vision: mutate(traits.vision, 0.5, 2.0),
        aggression: mutate(traits.aggression, 0, 1),
        stamina: mutate(traits.stamina, 0.5, 1.5),
    };
}

/**
 * Create random traits for initial population
 */
export function randomTraits(): Traits {
    return {
        speed: 0.8 + Math.random() * 0.4,      // 0.8 - 1.2
        vision: 0.8 + Math.random() * 0.4,
        aggression: Math.random(),              // 0 - 1
        stamina: 0.8 + Math.random() * 0.4,
    };
}
