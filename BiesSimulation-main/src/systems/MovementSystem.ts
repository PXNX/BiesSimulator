/**
 * Enhanced Movement System
 * Implements steering behaviors: wander, seek, flee, arrive
 * With boundary handling (bounce/wrap), friction, and energy costs
 */

import { Agent } from '../models/Agent';
import { Food } from '../models/Food';
import { CONFIG, getWorldDimensions } from '../config/globalConfig';
import { SpatialGrid } from '../core/SpatialGrid';
import { Vector2 } from '../models/Vector2';
import { random } from '../utils/RNG';
import { withPooledVector } from '../utils/ObjectPool';

export class MovementSystem {
    /**
     * Update all agents' movement
     */
    update(
        agents: Agent[],
        agentGrid: SpatialGrid<Agent>,
        foodGrid: SpatialGrid<Food>,
        delta: number
    ): void {
        for (const agent of agents) {
            if (agent.isDead) continue;

            const neighbors = agentGrid.queryNear(agent, agent.visionRadius);

            // Separation to avoid crowding
            if (neighbors.length > 0) {
                withPooledVector((separation) => {
                    this.separateInto(
                        agent,
                        neighbors,
                        CONFIG.COLLISION_RADIUS * 2,
                        separation
                    );
                    separation.mult(0.6);
                    agent.applyForce(separation);
                });
            }

            // Flee from nearby threats when low on energy
            const threat = this.findClosestThreat(agent, neighbors);
            if (threat) {
                this.fleeFrom(agent, threat.position);
            } else {
                // Seek closest food within vision radius
                const targetFood = this.findClosestFood(agent, foodGrid);
                if (targetFood) {
                    this.seekFood(agent, targetFood.position);
                } else {
                    // Default wander
                    this.wander(agent);
                }
            }

            // Handle boundaries
            this.boundaries(agent);

            // Apply energy costs for movement
            agent.drainMovementEnergy(delta);
            agent.drainBaseEnergy(delta);
        }
    }

    private findClosestFood(agent: Agent, foodGrid: SpatialGrid<Food>): Food | null {
        const nearbyFood = foodGrid.queryNear(agent as any, agent.visionRadius);
        let closest: Food | null = null;
        let closestDistSq = Infinity;

        for (const f of nearbyFood) {
            if (f.isDead) continue;
            const dSq = agent.position.distSq(f.position);
            if (dSq < closestDistSq) {
                closestDistSq = dSq;
                closest = f;
            }
        }

        return closest;
    }

    private findClosestThreat(agent: Agent, neighbors: Agent[]): Agent | null {
        if (agent.energy > 30) return null;

        let closest: Agent | null = null;
        let closestDistSq = Infinity;

        for (const other of neighbors) {
            if (other.isDead) continue;
            const isThreat =
                other.strategyType === 'Aggressive' ||
                other.traits.aggression > 0.7;
            if (!isThreat) continue;

            const dSq = agent.position.distSq(other.position);
            if (dSq < closestDistSq) {
                closestDistSq = dSq;
                closest = other;
            }
        }

        return closest;
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
        agent.wanderAngle += (random() - 0.5) * wanderJitter * Math.PI;

        // Calculate target on wander circle (pooled vectors to avoid allocations)
        withPooledVector((circleCenter) =>
            withPooledVector((displacement) =>
                withPooledVector((wanderTarget) =>
                    withPooledVector((steer) => {
                        circleCenter.set(agent.velocity.x, agent.velocity.y);
                        if (circleCenter.magSq() > 0) {
                            circleCenter.normalize().mult(wanderDistance);
                        } else {
                            circleCenter.set(1, 0).mult(wanderDistance);
                        }

                        displacement
                            .set(Math.cos(agent.wanderAngle), Math.sin(agent.wanderAngle))
                            .mult(wanderRadius);

                        wanderTarget.set(
                            agent.position.x + circleCenter.x + displacement.x,
                            agent.position.y + circleCenter.y + displacement.y
                        );

                        this.seekInto(agent, wanderTarget, steer);
                        steer.mult(CONFIG.WANDER_STRENGTH / 100);
                        agent.applyForce(steer);
                    })
                )
            )
        );
    }

    /**
     * Seek behavior - steer towards a target position
     *
     * NOTE: This method allocates a new `Vector2`. Prefer `seekInto(...)` in hot paths.
     *
     * @returns Steering force vector
     */
    seek(agent: Agent, target: Vector2): Vector2 {
        const out = new Vector2(0, 0);
        return this.seekInto(agent, target, out);
    }

    /**
     * Allocation-free variant of `seek(...)`.
     */
    public seekInto(agent: Agent, target: Vector2, out: Vector2): Vector2 {
        out.set(target.x - agent.position.x, target.y - agent.position.y);
        const distance = out.mag();
        if (distance < 0.01) {
            out.set(0, 0);
            return out;
        }

        out.setMag(agent.maxSpeed);
        out.sub(agent.velocity);
        out.limit(agent.maxForce);
        return out;
    }

    /**
     * Flee behavior - steer away from a threat
     *
     * NOTE: This method allocates a new `Vector2`. Prefer `fleeInto(...)` in hot paths.
     *
     * @returns Steering force vector
     */
    flee(agent: Agent, threat: Vector2): Vector2 {
        const out = new Vector2(0, 0);
        return this.fleeInto(agent, threat, out);
    }

    /**
     * Allocation-free variant of `flee(...)`.
     */
    public fleeInto(agent: Agent, threat: Vector2, out: Vector2): Vector2 {
        out.set(agent.position.x - threat.x, agent.position.y - threat.y);
        const distance = out.mag();

        if (distance > agent.visionRadius) {
            out.set(0, 0);
            return out;
        }

        const fleeStrength = 1 - distance / agent.visionRadius;
        out.setMag(agent.maxSpeed * fleeStrength);
        out.sub(agent.velocity);
        out.limit(agent.maxForce);
        return out;
    }

    /**
     * Arrive behavior - approach target and slow down as it gets close
     *
     * NOTE: This method allocates a new `Vector2`. Prefer `arriveInto(...)` in hot paths.
     *
     * @returns Steering force vector
     */
    arrive(agent: Agent, target: Vector2, slowRadius: number = 50): Vector2 {
        const out = new Vector2(0, 0);
        return this.arriveInto(agent, target, slowRadius, out);
    }

    /**
     * Allocation-free variant of `arrive(...)`.
     */
    public arriveInto(
        agent: Agent,
        target: Vector2,
        slowRadius: number,
        out: Vector2
    ): Vector2 {
        out.set(target.x - agent.position.x, target.y - agent.position.y);
        const distance = out.mag();
        if (distance < 0.01) {
            out.set(0, 0);
            return out;
        }

        let speed = agent.maxSpeed;
        if (distance < slowRadius) {
            speed = agent.maxSpeed * (distance / slowRadius);
        }

        out.setMag(speed);
        out.sub(agent.velocity);
        out.limit(agent.maxForce);
        return out;
    }

    /**
     * Separation behavior - avoid crowding nearby agents
     *
     * NOTE: This method allocates a new `Vector2`. Prefer `separateInto(...)` in hot paths.
     *
     * @returns Steering force vector
     */
    separate(agent: Agent, neighbors: Agent[], separationRadius: number = 25): Vector2 {
        const out = new Vector2(0, 0);
        return this.separateInto(agent, neighbors, separationRadius, out);
    }

    /**
     * Allocation-free variant of `separate(...)`.
     */
    public separateInto(
        agent: Agent,
        neighbors: Agent[],
        separationRadius: number,
        out: Vector2
    ): Vector2 {
        out.set(0, 0);
        let count = 0;
        const radiusSq = separationRadius * separationRadius;

        for (const other of neighbors) {
            if (other.id === agent.id || other.isDead) continue;

            const dx = agent.position.x - other.position.x;
            const dy = agent.position.y - other.position.y;
            const distSq = dx * dx + dy * dy;

            if (distSq > 0 && distSq < radiusSq) {
                // Weight by distance squared (closer = stronger)
                out.x += dx / distSq;
                out.y += dy / distSq;
                count++;
            }
        }

        if (count > 0) {
            out.div(count);
            out.setMag(agent.maxSpeed);
            out.sub(agent.velocity);
            out.limit(agent.maxForce);
        }

        return out;
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
            let desiredX: number | null = null;
            let desiredY: number | null = null;

            if (agent.position.x < margin) {
                desiredX = agent.maxSpeed;
            } else if (agent.position.x > width - margin) {
                desiredX = -agent.maxSpeed;
            }

            if (agent.position.y < margin) {
                desiredY = agent.maxSpeed;
            } else if (agent.position.y > height - margin) {
                desiredY = -agent.maxSpeed;
            }

            if (desiredX != null || desiredY != null) {
                withPooledVector((desired) => {
                    desired.set(
                        desiredX ?? agent.velocity.x,
                        desiredY ?? agent.velocity.y
                    );
                    desired.normalize().mult(agent.maxSpeed);
                    desired.sub(agent.velocity);
                    desired.limit(agent.maxForce * 2); // Stronger force for boundaries
                    agent.applyForce(desired);
                });
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
        withPooledVector((steer) => {
            this.arriveInto(agent, foodPosition, 30, steer);
            steer.mult(1.5); // Higher priority for food
            agent.applyForce(steer);
        });
    }

    /**
     * Apply steering to flee from threat
     */
    fleeFrom(agent: Agent, threatPosition: Vector2): void {
        withPooledVector((steer) => {
            this.fleeInto(agent, threatPosition, steer);
            steer.mult(2); // High priority for fleeing
            agent.applyForce(steer);
        });
    }
}
