/**
 * Aggressive Strategy (Hawk)
 * Always chooses to fight, regardless of opponent
 */

import { Agent } from '../models/Agent';
import type { ActionType } from '../config/globalConfig';
import { BaseStrategy } from './IStrategy';
import type { EncounterMemory } from './IStrategy';
import { STRATEGY_COLORS } from '../renderer/Sprites';

export class Aggressive extends BaseStrategy {
    readonly name = 'Aggressive' as const;
    readonly color = STRATEGY_COLORS.Aggressive;

    decideAction(self: Agent, _other: Agent, _memory?: EncounterMemory): ActionType {
        // Hawks always fight, unless critically low on energy
        if (this.isLowEnergy(self)) {
            return 'FLEE';
        }
        return 'FIGHT';
    }
}
