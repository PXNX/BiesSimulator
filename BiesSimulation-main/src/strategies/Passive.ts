/**
 * Passive Strategy (Dove)
 * Never fights, prefers to share or flee
 */

import { Agent } from '../models/Agent';
import type { ActionType } from '../config/globalConfig';
import { BaseStrategy } from './IStrategy';
import type { EncounterMemory } from './IStrategy';
import { STRATEGY_COLORS } from '../renderer/Sprites';

export class Passive extends BaseStrategy {
    readonly name = 'Passive' as const;
    readonly color = STRATEGY_COLORS.Passive;

    decideAction(self: Agent, other: Agent, _memory?: EncounterMemory): ActionType {
        // Doves never fight
        // If the other agent seems aggressive, flee
        if (other.traits.aggression > 0.6) {
            return 'FLEE';
        }

        // If low energy, share to avoid conflict
        if (this.isLowEnergy(self)) {
            return 'SHARE';
        }

        // Default to sharing
        return 'SHARE';
    }
}
