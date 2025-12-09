/**
 * Cooperative Strategy
 * Prefers to share, but will fight if provoked or if stronger
 */

import { Agent } from '../models/Agent';
import type { ActionType } from '../config/globalConfig';
import { BaseStrategy } from './IStrategy';
import type { EncounterMemory, EncounterResult } from './IStrategy';
import { STRATEGY_COLORS } from '../renderer/Sprites';

export class Cooperative extends BaseStrategy {
    readonly name = 'Cooperative' as const;
    readonly color = STRATEGY_COLORS.Cooperative;

    decideAction(self: Agent, other: Agent, memory?: EncounterMemory): ActionType {
        // If we remember this agent being hostile, retaliate
        if (memory && memory.lastAction === 'FIGHT') {
            // But only if we can afford to fight
            if (this.canFight(self, 10)) {
                return 'FIGHT';
            }
            return 'FLEE';
        }

        // If low energy, always try to share
        if (this.isLowEnergy(self)) {
            return 'SHARE';
        }

        // If much stronger and hungry for resources, might fight
        if (this.isStronger(self, other) && self.energy < 60) {
            // 30% chance to fight if stronger and hungry
            if (Math.random() < 0.3) {
                return 'FIGHT';
            }
        }

        // Default: cooperate
        return 'SHARE';
    }

    onEncounterResult(self: Agent, other: Agent, result: EncounterResult): void {
        // Learn from encounters - update memory
        self.rememberEncounter(other.id, result.theirAction, result.outcome);
    }
}
