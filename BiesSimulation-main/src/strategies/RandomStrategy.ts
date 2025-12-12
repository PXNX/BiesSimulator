/**
 * Random Strategy
 * Chooses actions randomly - useful as a control/baseline
 */

import { Agent } from '../models/Agent';
import type { ActionType } from '../config/globalConfig';
import { BaseStrategy } from './IStrategy';
import type { EncounterMemory } from './IStrategy';
import { STRATEGY_COLORS } from '../renderer/Sprites';
import { randomInt } from '../utils/RNG';

export class RandomStrategy extends BaseStrategy {
    readonly name = 'Random' as const;
    readonly color = STRATEGY_COLORS.Random;

    private readonly actions: ActionType[] = ['FIGHT', 'SHARE', 'FLEE', 'IGNORE'];

    decideAction(self: Agent, _other: Agent, _memory?: EncounterMemory): ActionType {
        // If critically low on energy, bias towards non-fighting
        if (this.isLowEnergy(self)) {
            const safeActions: ActionType[] = ['SHARE', 'FLEE', 'IGNORE'];
            return safeActions[randomInt(safeActions.length)];
        }

        // Otherwise completely random
        return this.actions[randomInt(this.actions.length)];
    }
}
