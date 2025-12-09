/**
 * Enhanced Movement System
 * Implements steering behaviors: wander, seek, flee, arrive
 * With boundary handling (bounce/wrap), friction, and energy costs
 */

import { Agent } from '../models/Agent';
import { CONFIG, getWorldDimensions } from '../config/globalConfig';
import { Vector2 } from '../models/Vector2';

export class MovementSystem {
    /**
     * Update all agents' movement
     */
    update(agents: Agent[], _delta: number): void {
        for (const agent of agents) {
            if (agent.isDead) continue;

            // Apply wander behavior
            this.wander(agent);

            // Handle boundaries
            this.boundaries(agent);

            // Apply energy costs for movement
            agent.drainMovementEnergy();
            agent.drainBaseEnergy();
        }
    }

    /**
     * Smooth random wander behavior
     * Uses a "wander circle" for smooth, natural-looking movement
     */
    private wander(agent: Agent): void {
        // Wander circle parameters
        const wanderRadius = 40;
        const wanderDistance = 60;
        const wanderJitter = CONFIG.WANDER_SMOOTHNESS;

        // Slightly randomize the wander angle
        agent.wanderAngle += (Math.random() - 0.5) * wanderJitter * Math.PI;

        // Calculate target on wander circle
        const circleCenter = agent.velocity.copy().normalize().mult(wanderDistance);
        const displacement = Vector2.fromAngle(agent.wanderAngle).mult(wanderRadius);

        const wanderTarget = agent.position.copy().add(circleCenter).add(displacement);

        // Steer towards wander target
        const steer = this.seek(agent, wanderTarget);
        steer.mult(CONFIG.WANDER_STRENGTH / 100);

        agent.applyForce(steer);
    }

    /**
     * Seek behavior - steer towards a target position
     * @returns Steering force vector
     */
    seek(agent: Agent, target: Vector2): Vector2 {
        const desired = Vector2.subtract(target, agent.position);
        const distance = desired.mag();

        if (distance < 0.01) return Vector2.zero();

        // Scale by max speed
        desired.setMag(agent.maxSpeed);

        // Calculate steering force (desired - current velocity)
        const steer = desired.sub(agent.velocity);
        steer.limit(agent.maxForce);

        return steer;
    }

    /**
     * Flee behavior - steer away from a threat
     * @returns Steering force vector
     */
    flee(agent: Agent, threat: Vector2): Vector2 {
        const desired = Vector2.subtract(agent.position, threat);
        const distance = desired.mag();

        // Only flee if within vision radius
        if (distance > agent.visionRadius) return Vector2.zero();

        // Flee strength inversely proportional to distance
        const fleeStrength = 1 - (distance / agent.visionRadius);

        desired.setMag(agent.maxSpeed * fleeStrength);

        const steer = desired.sub(agent.velocity);
        steer.limit(agent.maxForce);

        return steer;
    }

    /**
     * Arrive behavior - approach target and slow down as it gets close
     * @returns Steering force vector
     */
    arrive(agent: Agent, target: Vector2, slowRadius: number = 50): Vector2 {
        const desired = Vector2.subtract(target, agent.position);
        const distance = desired.mag();

        if (distance < 0.01) return Vector2.zero();

        // Slow down within radius
        let speed = agent.maxSpeed;
        if (distance < slowRadius) {
            speed = agent.maxSpeed * (distance / slowRadius);
        }

        desired.setMag(speed);

        const steer = desired.sub(agent.velocity);
        steer.limit(agent.maxForce);

        return steer;
    }

    /**
     * Separation behavior - avoid crowding nearby agents
     * @returns Steering force vector
     */
    separate(agent: Agent, neighbors: Agent[], separationRadius: number = 25): Vector2 {
        const steer = Vector2.zero();
        let count = 0;

        for (const other of neighbors) {
            if (other.id === agent.id || other.isDead) continue;

            const distance = agent.position.dist(other.position);

            if (distance > 0 && distance < separationRadius) {
                // Calculate repulsion vector
                const diff = Vector2.subtract(agent.position, other.position);
                diff.normalize();
                diff.div(distance); // Weight by distance (closer = stronger)
                steer.add(diff);
                count++;
            }
        }

        if (count > 0) {
            steer.div(count);
            steer.setMag(agent.maxSpeed);
            steer.sub(agent.velocity);
            steer.limit(agent.maxForce);
        }

        return steer;
    }

    /**
     * Boundary handling - keep agents within world bounds
     */
    private boundaries(agent: Agent): void {
        const { width, height } = getWorldDimensions();
        const margin = CONFIG.BOUNDARY_MARGIN;

        if (CONFIG.BOUNDARY_MODE === 'wrap') {
            // Wrap around edges
            if (agent.position.x < 0) agent.position.x = width;
            if (agent.position.x > width) agent.position.x = 0;
            if (agent.position.y < 0) agent.position.y = height;
            if (agent.position.y > height) agent.position.y = 0;
        } else {
            // Bounce off edges with steering
            let desired: Vector2 | null = null;

            if (agent.position.x < margin) {
                desired = new Vector2(agent.maxSpeed, agent.velocity.y);
            } else if (agent.position.x > width - margin) {
                desired = new Vector2(-agent.maxSpeed, agent.velocity.y);
            }

            if (agent.position.y < margin) {
                desired = new Vector2(
                    desired?.x ?? agent.velocity.x,
                    agent.maxSpeed
                );
            } else if (agent.position.y > height - margin) {
                desired = new Vector2(
                    desired?.x ?? agent.velocity.x,
                    -agent.maxSpeed
                );
            }

            if (desired) {
                desired.normalize().mult(agent.maxSpeed);
                const steer = desired.sub(agent.velocity);
                steer.limit(agent.maxForce * 2); // Stronger force for boundaries
                agent.applyForce(steer);
            }

            // Hard clamp position to prevent escaping
            agent.position.x = Math.max(5, Math.min(width - 5, agent.position.x));
            agent.position.y = Math.max(5, Math.min(height - 5, agent.position.y));
        }
    }

    /**
     * Apply steering to seek food
     */
    seekFood(agent: Agent, foodPosition: Vector2): void {
        const steer = this.arrive(agent, foodPosition, 30);
        steer.mult(1.5); // Higher priority for food
        agent.applyForce(steer);
    }

    /**
     * Apply steering to flee from threat
     */
    fleeFrom(agent: Agent, threatPosition: Vector2): void {
        const steer = this.flee(agent, threatPosition);
        steer.mult(2); // High priority for fleeing
        agent.applyForce(steer);
    }
}
