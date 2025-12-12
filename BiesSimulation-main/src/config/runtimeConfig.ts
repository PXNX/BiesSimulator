/**
 * RuntimeConfig - Mutable game rules that should be editable at runtime.
 *
 * Keep simulation constants in `globalConfig.ts`, and put user-editable rules here.
 */

import { CONFIG } from './globalConfig';

export type PayoffKey = keyof typeof CONFIG.PAYOFF;
export type PayoffTuple = [number, number];

export interface RuntimeConfig {
    FIGHT_COST: number;
    FOOD_VALUE: number;
    PAYOFF: Record<PayoffKey, PayoffTuple>;
}

function clonePayoff(): Record<PayoffKey, PayoffTuple> {
    const out = {} as Record<PayoffKey, PayoffTuple>;
    for (const [key, value] of Object.entries(CONFIG.PAYOFF) as [PayoffKey, readonly [number, number]][]) {
        out[key] = [value[0], value[1]];
    }
    return out;
}

export const DEFAULT_RUNTIME_CONFIG: RuntimeConfig = {
    FIGHT_COST: CONFIG.FIGHT_COST,
    FOOD_VALUE: CONFIG.FOOD_VALUE,
    PAYOFF: clonePayoff(),
};

export const runtimeConfig: RuntimeConfig = {
    FIGHT_COST: DEFAULT_RUNTIME_CONFIG.FIGHT_COST,
    FOOD_VALUE: DEFAULT_RUNTIME_CONFIG.FOOD_VALUE,
    PAYOFF: clonePayoff(),
};

export function resetRuntimeConfig(): void {
    runtimeConfig.FIGHT_COST = DEFAULT_RUNTIME_CONFIG.FIGHT_COST;
    runtimeConfig.FOOD_VALUE = DEFAULT_RUNTIME_CONFIG.FOOD_VALUE;

    for (const key of Object.keys(DEFAULT_RUNTIME_CONFIG.PAYOFF) as PayoffKey[]) {
        runtimeConfig.PAYOFF[key][0] = DEFAULT_RUNTIME_CONFIG.PAYOFF[key][0];
        runtimeConfig.PAYOFF[key][1] = DEFAULT_RUNTIME_CONFIG.PAYOFF[key][1];
    }
}

