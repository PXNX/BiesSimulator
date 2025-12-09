import { Agent } from '../models/Agent';
import { Food } from '../models/Food';
import { MovementSystem } from '../systems/MovementSystem';
import { CanvasRenderer } from '../renderer/CanvasRenderer';
import { CONFIG } from '../config/globalConfig';


export class World {
    public agents: Agent[] = [];
    public food: Food[] = [];

    private movementSystem: MovementSystem; // TODO: Add other systems

    constructor() {
        this.movementSystem = new MovementSystem();
        this.init();
    }

    init() {
        // Spawn initial agents
        for (let i = 0; i < 20; i++) {
            this.spawnAgent();
        }

        // Spawn initial food
        for (let i = 0; i < 50; i++) {
            this.spawnFood();
        }
    }

    spawnAgent() {
        const x = Math.random() * CONFIG.WORLD_WIDTH;
        const y = Math.random() * CONFIG.WORLD_HEIGHT;
        this.agents.push(new Agent(x, y));
    }

    spawnFood() {
        const x = Math.random() * CONFIG.WORLD_WIDTH;
        const y = Math.random() * CONFIG.WORLD_HEIGHT;
        this.food.push(new Food(x, y));
    }

    update(delta: number) {
        // Run systems
        this.movementSystem.update(this.agents);

        // Update physics for all agents
        for (const agent of this.agents) {
            agent.updatePhysics(delta);
        }
    }

    render(renderer: CanvasRenderer) {
        const ctx = renderer.getContext();
        renderer.clear();

        // Draw Food
        ctx.fillStyle = '#4caf50'; // Green
        for (const f of this.food) {
            ctx.beginPath();
            ctx.arc(f.position.x, f.position.y, CONFIG.FOOD_SIZE, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw Agents
        for (const agent of this.agents) {
            ctx.save();
            ctx.translate(agent.position.x, agent.position.y);

            // Rotate triangle to face velocity
            const angle = Math.atan2(agent.velocity.y, agent.velocity.x);
            ctx.rotate(angle);

            // Draw Triangle
            ctx.fillStyle = '#eee'; // White (Default)
            ctx.beginPath();
            ctx.moveTo(CONFIG.AGENT_SIZE, 0);
            ctx.lineTo(-CONFIG.AGENT_SIZE, -CONFIG.AGENT_SIZE / 2);
            ctx.lineTo(-CONFIG.AGENT_SIZE, CONFIG.AGENT_SIZE / 2);
            ctx.closePath();
            ctx.fill();

            ctx.restore();
        }
    }
}
