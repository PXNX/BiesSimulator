/**
 * Tit-for-Tat Strategy
 * Cooperates on first encounter, then mirrors opponent's last action
 */

import { Agent } from '../models/Agent';
import type { ActionType } from '../config/globalConfig';
import { BaseStrategy } from './IStrategy';
import type { EncounterMemory, EncounterResult } from './IStrategy';
import { STRATEGY_COLORS } from '../renderer/Sprites';

export class TitForTat extends BaseStrategy {
    readonly name = 'TitForTat' as const;
    readonly color = STRATEGY_COLORS.TitForTat;

    decideAction(self: Agent, _other: Agent, memory?: EncounterMemory): ActionType {
        // If critically low on energy, flee
        if (this.isLowEnergy(self)) {
            return 'FLEE';
        }

        // First encounter with this agent: cooperate
        if (!memory) {
            return 'SHARE';
        }

        // Mirror their last action
        switch (memory.lastAction) {
            case 'FIGHT':
                // They fought last time, fight back
                if (this.canFight(self, 10)) {
                    return 'FIGHT';
                }
                // Can't afford to fight, flee instead
                return 'FLEE';

            case 'SHARE':
                // They shared last time, reciprocate
                return 'SHARE';

            case 'FLEE':
                // They fled last time, be nice
                return 'SHARE';

            case 'IGNORE':
            default:
                // Unknown, default to cooperation
                return 'SHARE';
        }
    }

    onEncounterResult(self: Agent, other: Agent, result: EncounterResult): void {
        // Always remember what they did
        self.rememberEncounter(other.id, result.theirAction, result.outcome);
    }
}
