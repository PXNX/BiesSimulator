/**
 * Sprite rendering utilities for BiesSimulation
 * Handles strategy-specific colors, shapes, and debug visualizations
 * 
 * MODERN DESIGN: Organic creature shapes with glow effects
 */

import { Agent } from '../models/Agent';
import { Food } from '../models/Food';
import { CONFIG } from '../config/globalConfig';
import type { StrategyType } from '../config/globalConfig';

/**
 * Color palette for each strategy type - Neon vibrant colors
 */
export const STRATEGY_COLORS: Record<StrategyType, string> = {
    Aggressive: '#ff2244',    // Neon Red
    Passive: '#4488ff',       // Neon Blue
    Cooperative: '#00ff88',   // Neon Green
    TitForTat: '#ffcc00',     // Gold
    Random: '#cc44ff',        // Neon Purple
};

/**
 * Secondary colors for glow/outline effects
 */
export const STRATEGY_GLOW_COLORS: Record<StrategyType, string> = {
    Aggressive: 'rgba(255, 34, 68, 0.5)',
    Passive: 'rgba(68, 136, 255, 0.5)',
    Cooperative: 'rgba(0, 255, 136, 0.5)',
    TitForTat: 'rgba(255, 204, 0, 0.5)',
    Random: 'rgba(204, 68, 255, 0.5)',
};

/**
 * Darker inner colors for gradients
 */
const STRATEGY_DARK_COLORS: Record<StrategyType, string> = {
    Aggressive: '#991133',
    Passive: '#224488',
    Cooperative: '#006644',
    TitForTat: '#aa8800',
    Random: '#662299',
};

export class Sprites {
    private ctx: CanvasRenderingContext2D;
    private time: number = 0;

    constructor(ctx: CanvasRenderingContext2D) {
        this.ctx = ctx;
    }

    /**
     * Update animation time
     */
    update(deltaTime: number): void {
        this.time += deltaTime;
    }

    /**
     * Draw an agent with strategy-specific organic styling
     */
    drawAgent(agent: Agent, showVisionRadius: boolean = false): void {
        const ctx = this.ctx;
        const size = CONFIG.AGENT_SIZE;
        const color = STRATEGY_COLORS[agent.strategyType] || '#ffffff';
        const glowColor = STRATEGY_GLOW_COLORS[agent.strategyType];
        const darkColor = STRATEGY_DARK_COLORS[agent.strategyType] || '#333333';

        ctx.save();
        ctx.translate(agent.position.x, agent.position.y);

        // Optional vision radius debug
        if (showVisionRadius || CONFIG.SHOW_DEBUG_VISION) {
            ctx.beginPath();
            ctx.arc(0, 0, agent.visionRadius, 0, Math.PI * 2);
            ctx.fillStyle = glowColor || 'rgba(255,255,255,0.1)';
            ctx.fill();
            ctx.strokeStyle = color;
            ctx.lineWidth = 0.5;
            ctx.setLineDash([4, 4]);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Rotate to face velocity direction
        const angle = agent.velocity.heading();
        ctx.rotate(angle);

        // Energy-based opacity and pulse
        const energyRatio = Math.max(0.3, agent.energy / CONFIG.MAX_ENERGY);
        const pulse = 1 + Math.sin(this.time * 3 + agent.position.x * 0.1) * 0.05;

        ctx.globalAlpha = energyRatio;

        // Draw outer glow
        this.drawGlow(0, 0, size * 2.5 * pulse, glowColor);

        // Draw strategy-specific shape
        switch (agent.strategyType) {
            case 'Aggressive':
                this.drawAggressiveCreature(size * pulse, color, darkColor);
                break;
            case 'Passive':
                this.drawPassiveCreature(size * pulse, color, darkColor);
                break;
            case 'Cooperative':
                this.drawCooperativeCreature(size * pulse, color, darkColor);
                break;
            case 'TitForTat':
                this.drawTitForTatCreature(size * pulse, color, darkColor);
                break;
            case 'Random':
                this.drawRandomCreature(size * pulse, color, darkColor, agent.position.x + agent.position.y);
                break;
            default:
                this.drawDefaultCreature(size * pulse, color, darkColor);
        }

        // Draw "eye" indicator for direction
        this.drawEye(size * 0.6, 0, size * 0.15);

        // Energy indicator (arc around creature)
        ctx.globalAlpha = 1;
        this.drawEnergyArc(size * 1.3, energyRatio, color);

        ctx.restore();
    }

    /**
     * AGGRESSIVE: Spiky creature with threatening appearance
     */
    private drawAggressiveCreature(size: number, color: string, darkColor: string): void {
        const ctx = this.ctx;
        const spikes = 6;
        const innerRadius = size * 0.6;
        const outerRadius = size * 1.2;

        // Create gradient
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, outerRadius);
        gradient.addColorStop(0, color);
        gradient.addColorStop(0.6, color);
        gradient.addColorStop(1, darkColor);

        ctx.beginPath();
        for (let i = 0; i < spikes * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();

        ctx.fillStyle = gradient;
        ctx.fill();

        // Inner core
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fill();

        // Outline glow
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    /**
     * PASSIVE: Soft droplet/bubble shape
     */
    private drawPassiveCreature(size: number, color: string, darkColor: string): void {
        const ctx = this.ctx;

        // Create gradient
        const gradient = ctx.createRadialGradient(-size * 0.3, -size * 0.3, 0, 0, 0, size * 1.2);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.2, color);
        gradient.addColorStop(1, darkColor);

        // Main droplet body
        ctx.beginPath();
        ctx.moveTo(size * 1.1, 0);
        ctx.quadraticCurveTo(size * 0.8, -size * 0.6, 0, -size * 0.9);
        ctx.quadraticCurveTo(-size * 0.9, -size * 0.7, -size * 0.9, 0);
        ctx.quadraticCurveTo(-size * 0.9, size * 0.7, 0, size * 0.9);
        ctx.quadraticCurveTo(size * 0.8, size * 0.6, size * 1.1, 0);
        ctx.closePath();

        ctx.fillStyle = gradient;
        ctx.fill();

        // Highlight bubble
        ctx.beginPath();
        ctx.arc(-size * 0.2, -size * 0.3, size * 0.25, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fill();

        // Outline
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.shadowColor = color;
        ctx.shadowBlur = 6;
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    /**
     * COOPERATIVE: Flower/heart-like shape
     */
    private drawCooperativeCreature(size: number, color: string, darkColor: string): void {
        const ctx = this.ctx;
        const petals = 5;

        // Create gradient
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 1.2);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.3, color);
        gradient.addColorStop(1, darkColor);

        // Draw petals
        ctx.beginPath();
        for (let i = 0; i < petals; i++) {
            const angle = (i / petals) * Math.PI * 2;
            const petalX = Math.cos(angle) * size * 0.5;
            const petalY = Math.sin(angle) * size * 0.5;

            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(
                petalX + Math.cos(angle + 0.5) * size * 0.8,
                petalY + Math.sin(angle + 0.5) * size * 0.8,
                Math.cos(angle) * size,
                Math.sin(angle) * size
            );
            ctx.quadraticCurveTo(
                petalX + Math.cos(angle - 0.5) * size * 0.8,
                petalY + Math.sin(angle - 0.5) * size * 0.8,
                0, 0
            );
        }

        ctx.fillStyle = gradient;
        ctx.fill();

        // Center
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(0, 0, size * 0.25, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        // Glow outline
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    /**
     * TIT-FOR-TAT: Crystal/diamond shape
     */
    private drawTitForTatCreature(size: number, color: string, darkColor: string): void {
        const ctx = this.ctx;

        // Main diamond
        const gradient = ctx.createLinearGradient(-size, 0, size, 0);
        gradient.addColorStop(0, darkColor);
        gradient.addColorStop(0.3, color);
        gradient.addColorStop(0.5, '#ffffff');
        gradient.addColorStop(0.7, color);
        gradient.addColorStop(1, darkColor);

        ctx.beginPath();
        ctx.moveTo(size * 1.2, 0);      // Right point
        ctx.lineTo(0, -size * 0.7);     // Top
        ctx.lineTo(-size * 0.8, 0);     // Left
        ctx.lineTo(0, size * 0.7);      // Bottom
        ctx.closePath();

        ctx.fillStyle = gradient;
        ctx.fill();

        // Inner facets
        ctx.beginPath();
        ctx.moveTo(size * 0.6, 0);
        ctx.lineTo(0, -size * 0.35);
        ctx.lineTo(-size * 0.4, 0);
        ctx.lineTo(0, size * 0.35);
        ctx.closePath();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fill();

        // Outline with glow
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.shadowColor = color;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(size * 1.2, 0);
        ctx.lineTo(0, -size * 0.7);
        ctx.lineTo(-size * 0.8, 0);
        ctx.lineTo(0, size * 0.7);
        ctx.closePath();
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    /**
     * RANDOM: Amoeba-like shape with pseudopods
     */
    private drawRandomCreature(size: number, color: string, darkColor: string, seed: number): void {
        const ctx = this.ctx;
        const points = 8;
        const wobble = this.time * 2 + seed;

        // Create gradient
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 1.3);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.3, color);
        gradient.addColorStop(1, darkColor);

        // Draw wobbly amoeba shape
        ctx.beginPath();
        for (let i = 0; i <= points; i++) {
            const angle = (i / points) * Math.PI * 2;
            const wobbleRadius = size * (0.8 + Math.sin(wobble + i * 1.5) * 0.3);
            const x = Math.cos(angle) * wobbleRadius;
            const y = Math.sin(angle) * wobbleRadius;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                // Smooth curves between points
                const prevAngle = ((i - 1) / points) * Math.PI * 2;
                const prevWobble = size * (0.8 + Math.sin(wobble + (i - 1) * 1.5) * 0.3);
                const cpX = Math.cos((angle + prevAngle) / 2) * (wobbleRadius + prevWobble) * 0.6;
                const cpY = Math.sin((angle + prevAngle) / 2) * (wobbleRadius + prevWobble) * 0.6;
                ctx.quadraticCurveTo(cpX, cpY, x, y);
            }
        }
        ctx.closePath();

        ctx.fillStyle = gradient;
        ctx.fill();

        // Inner nucleus
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fill();

        // Outline
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    /**
     * Default creature (fallback)
     */
    private drawDefaultCreature(size: number, color: string, darkColor: string): void {
        const ctx = this.ctx;

        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, darkColor);

        ctx.beginPath();
        ctx.arc(0, 0, size, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
    }

    /**
     * Draw outer glow effect
     */
    private drawGlow(x: number, y: number, radius: number, color: string): void {
        const ctx = this.ctx;
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, color);
        gradient.addColorStop(0.5, color.replace('0.5)', '0.2)'));
        gradient.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
    }

    /**
     * Draw direction indicator "eye"
     */
    private drawEye(x: number, y: number, size: number): void {
        const ctx = this.ctx;

        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x + size * 0.3, y, size * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = '#000000';
        ctx.fill();
    }

    /**
     * Draw energy arc around creature
     */
    private drawEnergyArc(radius: number, energyRatio: number, color: string): void {
        const ctx = this.ctx;
        const startAngle = -Math.PI / 2;
        const endAngle = startAngle + (Math.PI * 2 * energyRatio);

        // Background arc
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Energy arc - use color as fallback
        ctx.beginPath();
        ctx.arc(0, 0, radius, startAngle, endAngle);
        ctx.strokeStyle = this.getEnergyColor(energyRatio * CONFIG.MAX_ENERGY) || color;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.stroke();
    }

    /**
     * Draw food item with enhanced glow
     */
    drawFood(food: Food): void {
        const ctx = this.ctx;
        const size = CONFIG.FOOD_SIZE;
        const pulse = 1 + Math.sin(this.time * 4 + food.position.x * 0.05) * 0.15;

        ctx.save();
        ctx.translate(food.position.x, food.position.y);

        // Outer glow
        const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 4 * pulse);
        glowGradient.addColorStop(0, 'rgba(0, 255, 170, 0.4)');
        glowGradient.addColorStop(0.5, 'rgba(0, 255, 170, 0.15)');
        glowGradient.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.arc(0, 0, size * 4 * pulse, 0, Math.PI * 2);
        ctx.fillStyle = glowGradient;
        ctx.fill();

        // Core gradient
        const coreGradient = ctx.createRadialGradient(-size * 0.3, -size * 0.3, 0, 0, 0, size * 1.5);
        coreGradient.addColorStop(0, '#ffffff');
        coreGradient.addColorStop(0.3, '#00ffaa');
        coreGradient.addColorStop(1, '#006644');

        ctx.beginPath();
        ctx.arc(0, 0, size * pulse, 0, Math.PI * 2);
        ctx.fillStyle = coreGradient;
        ctx.shadowColor = '#00ffaa';
        ctx.shadowBlur = 15;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Highlight
        ctx.beginPath();
        ctx.arc(-size * 0.25, -size * 0.25, size * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fill();

        ctx.restore();
    }

    /**
     * Draw debug grid
     */
    drawGrid(width: number, height: number): void {
        if (!CONFIG.SHOW_GRID) return;

        const ctx = this.ctx;
        const gridSize = CONFIG.GRID_SIZE;

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;

        // Vertical lines
        for (let x = 0; x <= width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }

        // Horizontal lines
        for (let y = 0; y <= height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
    }

    /**
     * Draw axis at origin
     */
    drawAxis(width: number, height: number): void {
        const ctx = this.ctx;
        const centerX = width / 2;
        const centerY = height / 2;

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;

        // X-axis
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(width, centerY);
        ctx.stroke();

        // Y-axis
        ctx.beginPath();
        ctx.moveTo(centerX, 0);
        ctx.lineTo(centerX, height);
        ctx.stroke();
    }

    /**
     * Get color based on energy level
     */
    private getEnergyColor(energy: number): string {
        const ratio = energy / CONFIG.MAX_ENERGY;
        if (ratio > 0.6) return '#00ff88';       // Neon Green
        if (ratio > 0.3) return '#ffcc00';       // Gold
        return '#ff2244';                         // Neon Red
    }

    /**
     * Draw interaction effect (hit flash)
     */
    drawInteractionEffect(
        x: number,
        y: number,
        type: 'fight' | 'share' | 'consume',
        progress: number
    ): void {
        const ctx = this.ctx;
        const alpha = 1 - progress;
        const radius = 20 + progress * 30;

        ctx.save();
        ctx.globalAlpha = alpha * 0.6;

        let color: string;
        switch (type) {
            case 'fight':
                color = '#ff2244';
                break;
            case 'share':
                color = '#00ff88';
                break;
            case 'consume':
                color = '#00ffaa';
                break;
        }

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 20;
        ctx.fill();

        ctx.restore();
    }
}
