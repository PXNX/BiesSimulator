/**
 * Global Configuration - BiesSimulation
 * Centralized configuration without window dependencies.
 * Runtime dimensions are provided by the renderer.
 */

export interface WorldDimensions {
    width: number;
    height: number;
}

// Runtime world dimensions (set by renderer)
let worldDimensions: WorldDimensions = { width: 1280, height: 720 };

export function setWorldDimensions(width: number, height: number): void {
    worldDimensions = { width, height };
}

export function getWorldDimensions(): WorldDimensions {
    return worldDimensions;
}

export const CONFIG = {
    // ============ RENDERING ============
    CLEAR_COLOR: '#1a1a2e',
    SHOW_GRID: false,
    SHOW_DEBUG_VISION: false,
    GRID_SIZE: 50,
    GRID_COLOR: 'rgba(255, 255, 255, 0.1)',

    // ============ AGENT DEFAULTS ============
    AGENT_SIZE: 10,
    DEFAULT_SPEED: 100,          // Pixels per second
    MAX_SPEED: 150,
    MAX_FORCE: 200,              // Steering force strength
    VISION_RADIUS: 80,
    STARTING_ENERGY: 100,
    MAX_ENERGY: 200,

    // ============ AGENT TRAITS ============
    DEFAULT_AGGRESSION: 0.5,     // 0-1 scale
    DEFAULT_MEMORY_SIZE: 5,      // Number of encounters to remember

    // ============ FOOD ============
    FOOD_SIZE: 5,
    FOOD_VALUE: 25,              // Energy gain
    FOOD_COLOR: '#4ade80',

    // ============ SPAWN SETTINGS ============
    INITIAL_AGENT_COUNT: 30,
    INITIAL_FOOD_COUNT: 60,
    AGENT_DENSITY: 0.00003,      // Agents per pixel² (alternative to count)
    FOOD_DENSITY: 0.00006,       // Food per pixel²

    // ============ ENERGY COSTS ============
    BASE_TICK_COST: 0.05,        // Energy lost per tick just existing
    MOVEMENT_COST_FACTOR: 0.01,  // Energy per pixel moved
    FIGHT_COST: 10,              // Energy cost of fighting
    REPRODUCTION_COST: 50,       // Energy to reproduce

    // ============ MOVEMENT ============
    FRICTION: 0.98,              // Velocity dampening per frame
    BOUNDARY_MODE: 'bounce' as 'bounce' | 'wrap',
    BOUNDARY_MARGIN: 20,
    WANDER_STRENGTH: 50,
    WANDER_SMOOTHNESS: 0.1,      // Lower = smoother turns

    // ============ INTERACTION ============
    COLLISION_RADIUS: 15,
    INTERACTION_COOLDOWN: 60,    // Ticks before same pair can interact again
    KNOCKBACK_FORCE: 300,

    // ============ PAYOFF MATRIX (Hawk-Dove) ============
    // [attacker outcome, defender outcome]
    PAYOFF: {
        FIGHT_FIGHT: [-20, -20],    // Both injured
        FIGHT_SHARE: [30, -10],     // Fighter wins, sharer loses
        FIGHT_FLEE: [10, 0],        // Fighter claims, fleer escapes
        SHARE_SHARE: [15, 15],      // Both share peacefully
        SHARE_FLEE: [5, 0],         // Sharer gets little, fleer safe
        FLEE_FLEE: [0, 0],          // Nothing happens
    } as const,

    // ============ STRATEGY SPAWN RATIOS ============
    STRATEGY_SPAWN: {
        Aggressive: 0.25,
        Passive: 0.25,
        Cooperative: 0.20,
        TitForTat: 0.20,
        Random: 0.10,
    } as const,
} as const;

export type ActionType = 'FIGHT' | 'SHARE' | 'FLEE' | 'IGNORE';
export type StrategyType = keyof typeof CONFIG.STRATEGY_SPAWN;
