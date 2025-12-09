/**
 * Presets for different simulation scenarios
 */

import type { StrategyType } from './globalConfig';

export interface SimulationPreset {
    name: string;
    description: string;
    strategyRatios: Record<StrategyType, number>;
    foodCount: number;
    agentCount: number;
    foodValue?: number;
    mutationChance?: number;
    boundaryMode?: 'bounce' | 'wrap';
}

export const PRESETS: Record<string, SimulationPreset> = {
    // Classic Hawk-Dove 50/50 split
    HawkDove5050: {
        name: 'Hawk vs Dove (50/50)',
        description: 'Classic game theory setup with equal aggressive and passive agents',
        strategyRatios: {
            Aggressive: 0.5,
            Passive: 0.5,
            Cooperative: 0,
            TitForTat: 0,
            Random: 0,
        },
        agentCount: 40,
        foodCount: 60,
    },

    // Hawk invasion scenario
    HawkInvasion: {
        name: 'Hawk Invasion',
        description: 'Small aggressive population invading passive community',
        strategyRatios: {
            Aggressive: 0.1,
            Passive: 0.9,
            Cooperative: 0,
            TitForTat: 0,
            Random: 0,
        },
        agentCount: 50,
        foodCount: 80,
    },

    // Tit-for-Tat minority
    TitForTatMinority: {
        name: 'TitForTat Minority',
        description: 'Can TitForTat strategy survive?',
        strategyRatios: {
            Aggressive: 0.4,
            Passive: 0.4,
            Cooperative: 0,
            TitForTat: 0.2,
            Random: 0,
        },
        agentCount: 40,
        foodCount: 50,
    },

    // Resource scarcity
    Scarcity: {
        name: 'Scarcity',
        description: 'Limited resources force competition',
        strategyRatios: {
            Aggressive: 0.3,
            Passive: 0.3,
            Cooperative: 0.2,
            TitForTat: 0.2,
            Random: 0,
        },
        agentCount: 50,
        foodCount: 20,
    },

    // Abundance scenario
    Abundance: {
        name: 'Abundance',
        description: 'Plenty of resources, cooperation thrives',
        strategyRatios: {
            Aggressive: 0.2,
            Passive: 0.2,
            Cooperative: 0.3,
            TitForTat: 0.2,
            Random: 0.1,
        },
        agentCount: 40,
        foodCount: 150,
    },

    // Mixed balanced
    Balanced: {
        name: 'Balanced Mix',
        description: 'All strategies represented equally',
        strategyRatios: {
            Aggressive: 0.2,
            Passive: 0.2,
            Cooperative: 0.2,
            TitForTat: 0.2,
            Random: 0.2,
        },
        agentCount: 50,
        foodCount: 75,
    },

    // Pure cooperation
    CooperativeWorld: {
        name: 'Cooperative World',
        description: 'Mostly cooperative and TitForTat strategies',
        strategyRatios: {
            Aggressive: 0.1,
            Passive: 0.1,
            Cooperative: 0.4,
            TitForTat: 0.4,
            Random: 0,
        },
        agentCount: 40,
        foodCount: 60,
    },

    // Chaos mode
    Chaos: {
        name: 'Chaos',
        description: 'Highly aggressive environment',
        strategyRatios: {
            Aggressive: 0.6,
            Passive: 0.1,
            Cooperative: 0.1,
            TitForTat: 0.1,
            Random: 0.1,
        },
        agentCount: 60,
        foodCount: 40,
    },
};

export const DEFAULT_PRESET = PRESETS.Balanced;
