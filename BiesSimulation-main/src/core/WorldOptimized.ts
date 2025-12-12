/**
 * Optimized World Update Methods
 * Drop-in optimizations for World.ts
 */

import type { Agent } from '../models/Agent';
import type { Food } from '../models/Food';
import { CONFIG } from '../config/globalConfig';

export class WorldOptimizer {
    /**
     * Optimized agent physics update - uses traditional for loop (faster than for-of)
     */
    static updateAgentPhysics(agents: Agent[], scaledDelta: number): void {
        for (let i = 0, len = agents.length; i < len; i++) {
            const agent = agents[i];
            if (!agent.isDead) {
                agent.updatePhysics(scaledDelta);
            }
        }
    }

    /**
     * Optimized trail updates - only when enabled
     */
    static updateTrails(agents: Agent[], effects: any): void {
        if (!CONFIG.SHOW_TRAILS) {
            effects.showTrails = false;
            return;
        }

        effects.showTrails = true;
        for (let i = 0, len = agents.length; i < len; i++) {
            const agent = agents[i];
            if (!agent.isDead) {
                effects.updateTrail(agent.id, agent.position.x, agent.position.y);
            }
        }
    }

    /**
     * Optimized event processing - skip if effects disabled
     */
    static processInteractionEvents(events: any[], effects: any): void {
        if (!CONFIG.SHOW_HIT_EFFECTS) return;

        for (let i = 0, len = events.length; i < len; i++) {
            const event = events[i];
            if (event.type === 'fight') {
                effects.addHitEffect(event.position.x, event.position.y);
            } else if (event.type === 'consume') {
                effects.addConsumeEffect(event.position.x, event.position.y);
            } else if (event.type === 'share') {
                effects.addHitEffect(event.position.x, event.position.y, '#22c55e');
            }
        }
    }

    /**
     * Optimized death effects processing
     */
    static processDeadAgents(deadAgents: Agent[], effects: any, agentGrid: any): void {
        for (let i = 0, len = deadAgents.length; i < len; i++) {
            const agent = deadAgents[i];
            if (CONFIG.SHOW_HIT_EFFECTS) {
                effects.addDeathEffect(agent.position.x, agent.position.y, agent.strategy.color);
            }
            effects.removeTrail(agent.id);
            agentGrid.remove(agent);
        }
    }

    /**
     * Optimized birth effects processing
     */
    static processNewAgents(newAgents: Agent[], effects: any, agentGrid: any, agents: Agent[]): void {
        for (let i = 0, len = newAgents.length; i < len; i++) {
            const agent = newAgents[i];
            if (CONFIG.SHOW_HIT_EFFECTS) {
                effects.addBirthEffect(agent.position.x, agent.position.y);
            }
            agents.push(agent);
            agentGrid.insert(agent);
        }
    }
}
