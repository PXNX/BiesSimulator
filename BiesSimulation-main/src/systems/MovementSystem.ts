import { Agent } from '../models/Agent';
import { CONFIG } from '../config/globalConfig';
import { Vector2 } from '../models/Vector2';

export class MovementSystem {

    update(agents: Agent[]) {
        for (const agent of agents) {
            if (agent.isDead) continue;

            this.wander(agent);
            this.boundaries(agent);
        }
    }

    // Random movement pattern
    private wander(agent: Agent) {
        // Simple random steering (can be improved with Perlin noise later)
        // Add a random vector to velocity to change direction slightly
        const randomForce = Vector2.random()
            .mult(50); // Random strength

        // Steer towards current velocity + random offset to keep movement consistent
        // (Simulates wandering)
        const steer = agent.velocity.copy().normalize().mult(100).add(randomForce);

        // Limit steering force
        steer.limit(agent.maxForce);
        agent.applyForce(steer);
    }

    // Keep agent inside the world
    private boundaries(agent: Agent) {
        const margin = CONFIG.AGENT_SIZE;
        let desired: Vector2 | null = null;

        if (agent.position.x < margin) {
            desired = new Vector2(agent.maxSpeed, agent.velocity.y);
        } else if (agent.position.x > CONFIG.WORLD_WIDTH - margin) {
            desired = new Vector2(-agent.maxSpeed, agent.velocity.y);
        }

        if (agent.position.y < margin) {
            desired = new Vector2(agent.velocity.x, agent.maxSpeed);
        } else if (agent.position.y > CONFIG.WORLD_HEIGHT - margin) {
            desired = new Vector2(agent.velocity.x, -agent.maxSpeed);
        }

        if (desired) {
            desired.normalize().mult(agent.maxSpeed);
            const steer = desired.sub(agent.velocity);
            steer.limit(agent.maxForce * 2); // Stronger force to turn around
            agent.applyForce(steer);
        }
    }
}
