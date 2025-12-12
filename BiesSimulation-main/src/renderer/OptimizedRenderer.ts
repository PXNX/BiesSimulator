/**
 * OptimizedRenderer - Performance-focused rendering with LOD and batching
 */

import { Agent } from '../models/Agent';
import { Food } from '../models/Food';
import { CONFIG } from '../config/globalConfig';
import { STRATEGY_COLORS } from './Sprites';
import type { StrategyType } from '../config/globalConfig';

export interface RenderOptions {
    enableLOD: boolean;
    batchSize: number;
    culling: boolean;
}

export class OptimizedRenderer {
    private ctx: CanvasRenderingContext2D;
    private time: number = 0;
    private options: RenderOptions = {
        enableLOD: true,
        batchSize: 100,
        culling: true,
    };

    // Performance metrics
    private frameCount: number = 0;
    private lastFpsUpdate: number = 0;
    private currentFps: number = 60;

    constructor(ctx: CanvasRenderingContext2D, options?: Partial<RenderOptions>) {
        this.ctx = ctx;
        if (options) {
            this.options = { ...this.options, ...options };
        }
    }

    update(deltaTime: number): void {
        this.time += deltaTime;
        this.frameCount++;

        const now = performance.now();
        if (now - this.lastFpsUpdate >= 1000) {
            this.currentFps = this.frameCount;
            this.frameCount = 0;
            this.lastFpsUpdate = now;
        }
    }

    /**
     * Render agents with LOD based on count
     */
    renderAgents(agents: Agent[], showVision: boolean = false): void {
        const count = agents.length;

        // Determine LOD level based on agent count
        const lodLevel = this.getLODLevel(count);

        this.ctx.save();

        for (const agent of agents) {
            if (agent.isDead) continue;

            // Frustum culling (optional)
            if (this.options.culling && !this.isInViewport(agent.position.x, agent.position.y)) {
                continue;
            }

            this.renderAgentLOD(agent, lodLevel, showVision);
        }

        this.ctx.restore();
    }

    /**
     * Render food items with batching
     */
    renderFood(food: Food[]): void {
        this.ctx.save();

        const count = food.length;
        const lodLevel = this.getLODLevel(count);

        for (const f of food) {
            if (f.isDead) continue;

            if (this.options.culling && !this.isInViewport(f.position.x, f.position.y)) {
                continue;
            }

            this.renderFoodLOD(f, lodLevel);
        }

        this.ctx.restore();
    }

    private getLODLevel(entityCount: number): number {
        if (!this.options.enableLOD) return 2; // High quality

        if (entityCount < 50) return 2;      // High detail
        if (entityCount < 150) return 1;     // Medium detail
        return 0;                             // Low detail
    }

    private renderAgentLOD(agent: Agent, lod: number, showVision: boolean): void {
        const ctx = this.ctx;
        const size = CONFIG.AGENT_SIZE;
        const color = STRATEGY_COLORS[agent.strategyType] || '#ffffff';

        ctx.save();
        ctx.translate(agent.position.x, agent.position.y);

        const energyRatio = Math.max(0.3, agent.energy / CONFIG.MAX_ENERGY);
        ctx.globalAlpha = energyRatio;

        if (lod === 2) {
            // High detail - full rendering
            this.renderAgentHigh(agent, size, color, showVision);
        } else if (lod === 1) {
            // Medium detail - simplified
            this.renderAgentMedium(agent, size, color);
        } else {
            // Low detail - dots only
            this.renderAgentLow(agent, size, color);
        }

        ctx.restore();
    }

    private renderAgentHigh(agent: Agent, size: number, color: string, showVision: boolean): void {
        const ctx = this.ctx;

        // Vision radius (if debug enabled)
        if (showVision || CONFIG.SHOW_DEBUG_VISION) {
            ctx.beginPath();
            ctx.arc(0, 0, agent.visionRadius, 0, Math.PI * 2);
            ctx.strokeStyle = color;
            ctx.globalAlpha = 0.15;
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.globalAlpha = 1;
        }

        // Rotate to face velocity
        const angle = agent.velocity.heading();
        ctx.rotate(angle);

        // Draw shape based on strategy
        this.drawStrategyShape(agent.strategyType, size, color);

        // Direction indicator
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(size * 0.6, 0, size * 0.15, 0, Math.PI * 2);
        ctx.fill();
    }

    private renderAgentMedium(agent: Agent, size: number, color: string): void {
        const ctx = this.ctx;
        const angle = agent.velocity.heading();
        ctx.rotate(angle);

        // Simple circle with direction
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, this.darkenColor(color));

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, size, 0, Math.PI * 2);
        ctx.fill();

        // Direction
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(size * 0.4, -size * 0.15, size * 0.4, size * 0.3);
    }

    private renderAgentLow(_agent: Agent, size: number, color: string): void {
        // Simple dot
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, size * 0.7, 0, Math.PI * 2);
        this.ctx.fill();
    }

    private renderFoodLOD(food: Food, lod: number): void {
        const ctx = this.ctx;
        const size = CONFIG.FOOD_SIZE;

        ctx.save();
        ctx.translate(food.position.x, food.position.y);

        if (lod >= 1) {
            // Medium/High - glow effect
            const pulse = 1 + Math.sin(this.time * 4 + food.position.x * 0.05) * 0.15;

            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size * pulse);
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(0.3, '#00ffaa');
            gradient.addColorStop(1, '#006644');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(0, 0, size * pulse, 0, Math.PI * 2);
            ctx.shadowColor = '#00ffaa';
            ctx.shadowBlur = lod === 2 ? 15 : 8;
            ctx.fill();
        } else {
            // Low - simple circle
            ctx.fillStyle = '#00ffaa';
            ctx.beginPath();
            ctx.arc(0, 0, size * 0.8, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    private drawStrategyShape(strategy: StrategyType, size: number, color: string): void {
        const ctx = this.ctx;

        switch (strategy) {
            case 'Aggressive':
                this.drawSpiky(size, color);
                break;
            case 'Passive':
                this.drawCircle(size, color);
                break;
            case 'Cooperative':
                this.drawFlower(size, color);
                break;
            case 'TitForTat':
                this.drawDiamond(size, color);
                break;
            case 'Random':
                this.drawIrregular(size, color);
                break;
            default:
                this.drawCircle(size, color);
        }
    }

    private drawSpiky(size: number, color: string): void {
        const ctx = this.ctx;
        const spikes = 6;
        const innerRadius = size * 0.6;
        const outerRadius = size * 1.2;

        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, outerRadius);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, this.darkenColor(color));

        ctx.beginPath();
        for (let i = 0; i < spikes * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i / (spikes * 2)) * Math.PI * 2;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();
    }

    private drawCircle(size: number, color: string): void {
        const ctx = this.ctx;
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.3, color);
        gradient.addColorStop(1, this.darkenColor(color));

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, size, 0, Math.PI * 2);
        ctx.fill();
    }

    private drawFlower(size: number, color: string): void {
        const ctx = this.ctx;
        const petals = 5;

        ctx.fillStyle = color;
        ctx.beginPath();
        for (let i = 0; i < petals; i++) {
            const angle = (i / petals) * Math.PI * 2;
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(
                Math.cos(angle) * size * 0.7,
                Math.sin(angle) * size * 0.7,
                Math.cos(angle) * size,
                Math.sin(angle) * size
            );
        }
        ctx.fill();

        // Center
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.3, 0, Math.PI * 2);
        ctx.fill();
    }

    private drawDiamond(size: number, color: string): void {
        const ctx = this.ctx;

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(size * 1.2, 0);
        ctx.lineTo(0, -size * 0.7);
        ctx.lineTo(-size * 0.8, 0);
        ctx.lineTo(0, size * 0.7);
        ctx.closePath();
        ctx.fill();
    }

    private drawIrregular(size: number, color: string): void {
        const ctx = this.ctx;
        const points = 6;

        ctx.fillStyle = color;
        ctx.beginPath();
        for (let i = 0; i <= points; i++) {
            const angle = (i / points) * Math.PI * 2;
            const radius = size * (0.8 + Math.sin(this.time + i) * 0.2);
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
    }

    private darkenColor(color: string): string {
        // Simple color darkening
        const hex = color.replace('#', '');
        const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - 40);
        const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - 40);
        const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - 40);
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    private isInViewport(x: number, y: number): boolean {
        const margin = 100; // Render slightly outside viewport
        const canvas = this.ctx.canvas;
        const width = canvas.width / window.devicePixelRatio;
        const height = canvas.height / window.devicePixelRatio;

        return x >= -margin && x <= width + margin &&
            y >= -margin && y <= height + margin;
    }

    getFPS(): number {
        return this.currentFps;
    }
}
