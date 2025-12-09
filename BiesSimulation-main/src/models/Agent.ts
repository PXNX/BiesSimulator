import { Entity } from './Entity';
import { Vector2 } from './Vector2';
import { CONFIG } from '../config/globalConfig';

export class Agent extends Entity {
    public velocity: Vector2;
    public acceleration: Vector2;
    public maxSpeed: number;
    public maxForce: number;
    public energy: number;
    // Strategy will be added in Phase 3

    constructor(x: number, y: number) {
        super(x, y);
        this.velocity = Vector2.random().mult(CONFIG.DEFAULT_SPEED);
        this.acceleration = new Vector2(0, 0);
        this.maxSpeed = CONFIG.DEFAULT_SPEED;
        this.maxForce = CONFIG.MAX_FORCE;
        this.energy = CONFIG.STARTING_ENERGY;
    }

    applyForce(force: Vector2) {
        // F = m*a (assuming mass = 1 for simplicity)
        this.acceleration.add(force);
    }

    updatePhysics(delta: number) {
        // Update velocity
        this.velocity.add(this.acceleration.copy().mult(delta));
        this.velocity.limit(this.maxSpeed);

        // Update position
        this.position.add(this.velocity.copy().mult(delta));

        // Reset acceleration
        this.acceleration.mult(0);
    }
}
