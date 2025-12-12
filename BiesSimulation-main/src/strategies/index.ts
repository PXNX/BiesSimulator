/**
 * Strategy Registry - Factory for creating and managing strategies
 */

import type { IStrategy } from './IStrategy';
import { Aggressive } from './Aggressive';
import { Passive } from './Passive';
import { Cooperative } from './Cooperative';
import { TitForTat } from './TitForTat';
import { RandomStrategy } from './RandomStrategy';
import type { StrategyType } from '../config/globalConfig';
import { random } from '../utils/RNG';

// Singleton instances of each strategy
const strategies: Record<StrategyType, IStrategy> = {
    Aggressive: new Aggressive(),
    Passive: new Passive(),
    Cooperative: new Cooperative(),
    TitForTat: new TitForTat(),
    Random: new RandomStrategy(),
};

/**
 * Get a strategy instance by type
 */
export function getStrategy(type: StrategyType): IStrategy {
    return strategies[type];
}

/**
 * Get all available strategies
 */
export function getAllStrategies(): IStrategy[] {
    return Object.values(strategies);
}

/**
 * Get all strategy types
 */
export function getStrategyTypes(): StrategyType[] {
    return Object.keys(strategies) as StrategyType[];
}

/**
 * Pick a random strategy based on spawn ratios
 */
export function pickRandomStrategy(ratios: Record<StrategyType, number>): StrategyType {
    const total = Object.values(ratios).reduce((sum, val) => sum + val, 0);
    let roll = random() * total;

    for (const [type, ratio] of Object.entries(ratios)) {
        roll -= ratio;
        if (roll <= 0) {
            return type as StrategyType;
        }
    }

    // Fallback
    return 'Random';
}
