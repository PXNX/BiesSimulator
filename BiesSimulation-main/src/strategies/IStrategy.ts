/**
 * Strategy Interface - Defines behavior patterns for agents
 */

import { Agent } from '../models/Agent';
import type { ActionType, StrategyType } from '../config/globalConfig';

/**
 * Memory of a past encounter with another agent
 */
export interface EncounterMemory {
    agentId: string;
    lastAction: ActionType;
    timestamp: number;
    outcome: 'won' | 'lost' | 'tie' | 'fled';
}

/**
 * Result of an interaction between two agents
 */
export interface EncounterResult {
    myAction: ActionType;
    theirAction: ActionType;
    energyChange: number;
    outcome: 'won' | 'lost' | 'tie' | 'fled';
}

/**
 * Strategy interface - all strategies must implement this
 */
export interface IStrategy {
    /** Unique strategy name */
    readonly name: StrategyType;

    /** Display color for this strategy */
    readonly color: string;

    /** 
     * Decide what action to take when encountering another agent
     * @param self - The agent using this strategy
     * @param other - The other agent being encountered
     * @param memory - Optional memory of past encounters with this agent
     * @returns The action to take
     */
    decideAction(self: Agent, other: Agent, memory?: EncounterMemory): ActionType;

    /**
     * Optional callback after an encounter is resolved
     * Used for strategies that learn (like TitForTat)
     */
    onEncounterResult?(self: Agent, other: Agent, result: EncounterResult): void;
}

/**
 * Base class with common strategy utilities
 */
export abstract class BaseStrategy implements IStrategy {
    abstract readonly name: StrategyType;
    abstract readonly color: string;

    abstract decideAction(self: Agent, other: Agent, memory?: EncounterMemory): ActionType;

    /**
     * Check if agent has enough energy to fight
     */
    protected canFight(agent: Agent, fightCost: number): boolean {
        return agent.energy > fightCost * 1.5;
    }

    /**
     * Check if energy is critically low
     */
    protected isLowEnergy(agent: Agent): boolean {
        return agent.energy < 30;
    }

    /**
     * Check if agent is stronger based on traits
     */
    protected isStronger(self: Agent, other: Agent): boolean {
        const selfPower = self.energy * self.traits.aggression;
        const otherPower = other.energy * other.traits.aggression;
        return selfPower > otherPower;
    }
}
