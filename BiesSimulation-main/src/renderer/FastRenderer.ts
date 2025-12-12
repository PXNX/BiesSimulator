/**
 * Fast Renderer - Optimized version with minimal overhead
 * Uses instancing, batching, and reduced visual complexity for better performance
 */

import { Agent } from '../models/Agent';
import { Food } from '../models/Food';
import { CONFIG } from '../config/globalConfig';
import type { StrategyType } from '../config/globalConfig';

const STRATEGY_COLORS: Record<StrategyType, string> = {
    Aggressive: '#ff2244',
    Passive: '#4488ff',
    Cooperative: '#00ff88',
    TitForTat: '#ffcc00',
    Random: '#cc44ff',
};

export class FastRenderer {
    private ctx: CanvasRenderingContext2D;
    private offscreenCanvas: OffscreenCanvas | null = null;
    private offscreenCtx: OffscreenCanvasRenderingContext2D | null = null;

    // Sprite caching
    private spriteCache: Map<string, ImageBitmap | ImageData> = new Map();
    private cacheSize: number = 32; // Size of cached sprites

    // Performance mode
    private qualityLevel: number = 1.0;

    constructor(ctx: CanvasRenderingContext2D) {
        this.ctx = ctx;
        this.initOffscreenCanvas();
        this.preRenderSprites();
    }

    private initOffscreenCanvas() {
        try {
            // Use OffscreenCanvas if available (better performance)
            if (typeof OffscreenCanvas !== 'undefined') {
                this.offscreenCanvas = new OffscreenCanvas(this.cacheSize * 2, this.cacheSize * 2);
                this.offscreenCtx = this.offscreenCanvas.getContext('2d') as OffscreenCanvasRenderingContext2D;
            }
        } catch (e) {
            console.warn('OffscreenCanvas not available, using regular canvas');
        }
    }

    private async preRenderSprites() {
        // Pre-render agent sprites for each strategy
        const strategies: StrategyType[] = ['Aggressive', 'Passive', 'Cooperative', 'TitForTat', 'Random'];

        for (const strategy of strategies) {
            const key = `agent-${strategy}`;
            const sprite = this.createAgentSprite(strategy);

            // Try to create ImageBitmap for even faster rendering
            if (typeof createImageBitmap !== 'undefined' && sprite instanceof ImageData) {
                try {
                    const bitmap = await createImageBitmap(sprite);
                    this.spriteCache.set(key, bitmap);
                } catch {
                    this.spriteCache.set(key, sprite);
                }
            } else {
                this.spriteCache.set(key, sprite);
            }
        }

        // Pre-render food sprite
        const foodSprite = this.createFoodSprite();
        if (typeof createImageBitmap !== 'undefined' && foodSprite instanceof ImageData) {
            try {
                const bitmap = await createImageBitmap(foodSprite);
                this.spriteCache.set('food', bitmap);
            } catch {
                this.spriteCache.set('food', foodSprite);
            }
        } else {
            this.spriteCache.set('food', foodSprite);
        }
    }

    private createAgentSprite(strategy: StrategyType): ImageData {
        const size = this.cacheSize;
        const center = size;

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = size * 2;
        tempCanvas.height = size * 2;
        const tempCtx = tempCanvas.getContext('2d')!;

        const color = STRATEGY_COLORS[strategy];
        const radius = CONFIG.AGENT_SIZE;

        // Simple circle with gradient (faster than complex shapes)
        const gradient = tempCtx.createRadialGradient(center, center, 0, center, center, radius * 1.5);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.3, color);
        gradient.addColorStop(1, color + '00');

        tempCtx.fillStyle = gradient;
        tempCtx.beginPath();
        tempCtx.arc(center, center, radius * 1.5, 0, Math.PI * 2);
        tempCtx.fill();

        // Solid core
        tempCtx.fillStyle = color;
        tempCtx.beginPath();
        tempCtx.arc(center, center, radius, 0, Math.PI * 2);
        tempCtx.fill();

        // Direction indicator
        tempCtx.fillStyle = '#ffffff';
        tempCtx.beginPath();
        tempCtx.arc(center + radius * 0.5, center, radius * 0.2, 0, Math.PI * 2);
        tempCtx.fill();

        return tempCtx.getImageData(0, 0, size * 2, size * 2);
    }

    private createFoodSprite(): ImageData {
        const size = this.cacheSize;
        const center = size / 2;

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = size;
        tempCanvas.height = size;
        const tempCtx = tempCanvas.getContext('2d')!;

        const radius = CONFIG.FOOD_SIZE;

        // Simple glowing circle
        const gradient = tempCtx.createRadialGradient(center, center, 0, center, center, radius * 2);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.3, '#00ffaa');
        gradient.addColorStop(1, '#00ffaa00');

        tempCtx.fillStyle = gradient;
        tempCtx.beginPath();
        tempCtx.arc(center, center, radius * 2, 0, Math.PI * 2);
        tempCtx.fill();

        return tempCtx.getImageData(0, 0, size, size);
    }

    setQualityLevel(level: number) {
        this.qualityLevel = Math.max(0.5, Math.min(1.0, level));
    }

    drawAgentFast(agent: Agent) {
        const ctx = this.ctx;
        const key = `agent-${agent.strategyType}`;
        const sprite = this.spriteCache.get(key);

        if (!sprite) {
            // Fallback to simple circle
            this.drawSimpleAgent(agent);
            return;
        }

        ctx.save();

        // Apply energy-based opacity only in high quality mode
        if (this.qualityLevel > 0.8) {
            const energyRatio = Math.max(0.5, agent.energy / CONFIG.MAX_ENERGY);
            ctx.globalAlpha = energyRatio;
        }

        const size = CONFIG.AGENT_SIZE * 3;
        const halfSize = size / 2;

        // Rotate based on velocity (only in high quality)
        if (this.qualityLevel > 0.7) {
            ctx.translate(agent.position.x, agent.position.y);
            const angle = agent.velocity.heading();
            ctx.rotate(angle);

            if (sprite instanceof ImageBitmap) {
                ctx.drawImage(sprite, -halfSize, -halfSize, size, size);
            } else {
                ctx.putImageData(sprite as ImageData, -halfSize, -halfSize);
            }
        } else {
            // No rotation in low quality mode
            if (sprite instanceof ImageBitmap) {
                ctx.drawImage(sprite, agent.position.x - halfSize, agent.position.y - halfSize, size, size);
            } else {
                // ImageData requires translation
                ctx.translate(agent.position.x - halfSize, agent.position.y - halfSize);
                ctx.putImageData(sprite as ImageData, 0, 0);
            }
        }

        ctx.restore();
    }

    private drawSimpleAgent(agent: Agent) {
        const ctx = this.ctx;
        const color = STRATEGY_COLORS[agent.strategyType];

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(agent.position.x, agent.position.y, CONFIG.AGENT_SIZE, 0, Math.PI * 2);
        ctx.fill();
    }

    drawFoodFast(food: Food) {
        const sprite = this.spriteCache.get('food');

        if (!sprite) {
            // Fallback
            this.ctx.fillStyle = CONFIG.FOOD_COLOR;
            this.ctx.beginPath();
            this.ctx.arc(food.position.x, food.position.y, CONFIG.FOOD_SIZE, 0, Math.PI * 2);
            this.ctx.fill();
            return;
        }

        const size = CONFIG.FOOD_SIZE * 4;
        const halfSize = size / 2;

        if (sprite instanceof ImageBitmap) {
            this.ctx.drawImage(sprite, food.position.x - halfSize, food.position.y - halfSize, size, size);
        } else {
            this.ctx.save();
            this.ctx.translate(food.position.x - halfSize, food.position.y - halfSize);
            this.ctx.putImageData(sprite as ImageData, 0, 0);
            this.ctx.restore();
        }
    }

    // Batch rendering for better performance
    drawAgentsBatch(agents: Agent[]) {
        // Group agents by strategy for potential batching optimizations
        const groups = new Map<StrategyType, Agent[]>();

        for (const agent of agents) {
            if (agent.isDead) continue;

            if (!groups.has(agent.strategyType)) {
                groups.set(agent.strategyType, []);
            }
            groups.get(agent.strategyType)!.push(agent);
        }

        // Draw each group
        for (const [_, groupAgents] of groups) {
            for (const agent of groupAgents) {
                this.drawAgentFast(agent);
            }
        }
    }

    drawFoodBatch(food: Food[]) {
        for (const f of food) {
            if (!f.isDead) {
                this.drawFoodFast(f);
            }
        }
    }

    // Clear sprite cache and regenerate
    clearCache() {
        for (const [_, sprite] of this.spriteCache) {
            if (sprite instanceof ImageBitmap) {
                sprite.close();
            }
        }
        this.spriteCache.clear();
        this.preRenderSprites();
    }
}
