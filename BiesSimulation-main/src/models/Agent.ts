/**
 * Agent - Autonomous entity with strategy, traits, and memory
 */

import { Entity } from './Entity';
import { Vector2 } from './Vector2';
import { DEFAULT_TRAITS, randomTraits } from './Traits';
import type { Traits } from './Traits';
import { CONFIG } from '../config/globalConfig';
import type { StrategyType, ActionType } from '../config/globalConfig';
import { getStrategy } from '../strategies/index';
import type { IStrategy, EncounterMemory } from '../strategies/IStrategy';
import { random } from '../utils/RNG';
import { withPooledVector } from '../utils/ObjectPool';

export class Agent extends Entity {
    // Physics
    public velocity: Vector2;
    public acceleration: Vector2;
    public maxSpeed: number;
    public maxForce: number;

    // Stats
    public energy: number;
    public age: number = 0;

    // Traits
    public traits: Traits;

    // Strategy
    public strategyType: StrategyType;
    private _strategy: IStrategy;

    // Memory for TitForTat and learning strategies
    private encounterMemory: Map<string, EncounterMemory> = new Map();
    private readonly maxMemorySize: number;

    // Interaction state
    public interactionCooldowns: Map<string, number> = new Map();
    public lastInteractionTime: number = 0;

    // Reproduction
    public reproductionCooldown: number = 0;

    // Wander behavior state (for smooth movement)
    public wanderAngle: number = random() * Math.PI * 2;

    constructor(
        x: number,
        y: number,
        strategyType?: StrategyType,
        traits?: Partial<Traits>
    ) {
        super(x, y);

        // Initialize traits
        this.traits = traits
            ? { ...DEFAULT_TRAITS, ...traits }
            : randomTraits();

        // Physics with trait modifiers
        this.velocity = Vector2.random().mult(CONFIG.DEFAULT_SPEED * this.traits.speed);
        this.acceleration = new Vector2(0, 0);
        this.maxSpeed = CONFIG.MAX_SPEED * this.traits.speed;
        this.maxForce = CONFIG.MAX_FORCE;

        // Energy
        this.energy = CONFIG.STARTING_ENERGY;

        // Strategy
        this.strategyType = strategyType || 'Random';
        this._strategy = getStrategy(this.strategyType);

        // Memory
        this.maxMemorySize = CONFIG.DEFAULT_MEMORY_SIZE;
    }

    get strategy(): IStrategy {
        return this._strategy;
    }

    get visionRadius(): number {
        return CONFIG.VISION_RADIUS * this.traits.vision;
    }

    /**
     * Apply a force to the agent
     */
    applyForce(force: Vector2): void {
        this.acceleration.add(force);
    }

    /**
     * Update physics each frame
     */
    updatePhysics(delta: number): void {
        // Clamp acceleration
        this.acceleration.limit(this.maxForce);

        // Update velocity (avoid allocations)
        this.velocity.x += this.acceleration.x * delta;
        this.velocity.y += this.acceleration.y * delta;

        // Apply friction/damping
        this.velocity.mult(CONFIG.FRICTION);

        // Limit speed
        this.velocity.limit(this.maxSpeed);

        // Update position (avoid allocations)
        this.position.x += this.velocity.x * delta;
        this.position.y += this.velocity.y * delta;

        // Reset acceleration
        this.acceleration.mult(0);

        // Age
        this.age += delta;

        // Decrease cooldowns
        if (this.reproductionCooldown > 0) {
            this.reproductionCooldown -= delta;
        }

        // Decay interaction cooldowns
        for (const [id, cooldown] of this.interactionCooldowns) {
            const newCooldown = cooldown - 1;
            if (newCooldown <= 0) {
                this.interactionCooldowns.delete(id);
            } else {
                this.interactionCooldowns.set(id, newCooldown);
            }
        }
    }

    /**
     * Consume energy for movement
     */
    drainMovementEnergy(delta: number): void {
        const speed = this.velocity.mag();
        const cost = speed * CONFIG.MOVEMENT_COST_FACTOR * delta * (1 / this.traits.stamina);
        this.energy -= cost;
    }

    /**
     * Consume base tick energy
     */
    drainBaseEnergy(delta: number): void {
        const ageMultiplier = 1 + this.age * CONFIG.AGE_ENERGY_COST_FACTOR;
        this.energy -= CONFIG.BASE_TICK_COST * ageMultiplier * delta * (1 / this.traits.stamina);
    }

    /**
     * Gain energy from food
     */
    gainEnergy(amount: number): void {
        this.energy = Math.min(this.energy + amount, CONFIG.MAX_ENERGY);
    }

    /**
     * Lose energy from fighting
     */
    loseEnergy(amount: number): void {
        this.energy -= amount;
        if (this.energy <= 0) {
            this.isDead = true;
        }
    }

    /**
     * Decide action against another agent
     */
    decideAction(other: Agent): ActionType {
        const memory = this.encounterMemory.get(other.id);
        return this._strategy.decideAction(this, other, memory);
    }

    /**
     * Remember an encounter with another agent
     */
    rememberEncounter(
        agentId: string,
        action: ActionType,
        outcome: 'won' | 'lost' | 'tie' | 'fled'
    ): void {
        // Remove oldest memory if at capacity
        if (this.encounterMemory.size >= this.maxMemorySize) {
            let oldestId: string | null = null;
            let oldestTime = Infinity;

            for (const [id, mem] of this.encounterMemory) {
                if (mem.timestamp < oldestTime) {
                    oldestTime = mem.timestamp;
                    oldestId = id;
                }
            }

            if (oldestId) {
                this.encounterMemory.delete(oldestId);
            }
        }

        this.encounterMemory.set(agentId, {
            agentId,
            lastAction: action,
            timestamp: Date.now(),
            outcome,
        });
    }

    /**
     * Get memory of a specific agent
     */
    getMemory(agentId: string): EncounterMemory | undefined {
        return this.encounterMemory.get(agentId);
    }

    /**
     * Check if on cooldown with another agent
     */
    isOnCooldown(otherId: string): boolean {
        return this.interactionCooldowns.has(otherId);
    }

    /**
     * Set interaction cooldown with another agent
     */
    setCooldown(otherId: string): void {
        this.interactionCooldowns.set(otherId, CONFIG.INTERACTION_COOLDOWN);
    }

    /**
     * Apply knockback force
     */
    applyKnockback(direction: Vector2, force: number): void {
        withPooledVector((knockback) => {
            knockback.set(direction.x, direction.y).normalize().mult(force);
            this.velocity.add(knockback);
        });
    }

    /**
     * Reset agent state for reuse from pool.
     * Clears memory/cooldowns and reinitializes traits/physics/strategy.
     */
    resetForSpawn(
        x: number,
        y: number,
        strategyType?: StrategyType,
        traits?: Partial<Traits>
    ): void {
        this.id = crypto.randomUUID();
        this.position.set(x, y);
        this.isDead = false;

        this.traits = traits
            ? { ...DEFAULT_TRAITS, ...traits }
            : randomTraits();

        const angle = random() * Math.PI * 2;
        this.velocity.set(Math.cos(angle), Math.sin(angle)).mult(
            CONFIG.DEFAULT_SPEED * this.traits.speed
        );
        this.acceleration.set(0, 0);
        this.maxSpeed = CONFIG.MAX_SPEED * this.traits.speed;
        this.maxForce = CONFIG.MAX_FORCE;

        this.energy = CONFIG.STARTING_ENERGY;
        this.age = 0;
        this.reproductionCooldown = 0;

        this.wanderAngle = random() * Math.PI * 2;

        this.interactionCooldowns.clear();
        this.lastInteractionTime = 0;
        this.encounterMemory.clear();

        this.strategyType = strategyType || 'Random';
        this._strategy = getStrategy(this.strategyType);
    }

    /**
     * Minimal cleanup when returning to pool.
     */
    resetToPool(): void {
        this.isDead = false;
        this.energy = 0;
        this.age = 0;
        this.reproductionCooldown = 0;
        this.interactionCooldowns.clear();
        this.encounterMemory.clear();
    }

}
