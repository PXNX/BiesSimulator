/**
 * Sprite rendering utilities for BiesSimulation
 * Handles strategy-specific colors, shapes, and debug visualizations
 */

import { Agent } from '../models/Agent';
import { Food } from '../models/Food';
import { CONFIG } from '../config/globalConfig';
import type { StrategyType } from '../config/globalConfig';

/**
 * Color palette for each strategy type
 */
export const STRATEGY_COLORS: Record<StrategyType, string> = {
    Aggressive: '#ef4444',    // Red - Hawk
    Passive: '#3b82f6',       // Blue - Dove
    Cooperative: '#22c55e',   // Green
    TitForTat: '#eab308',     // Yellow
    Random: '#a855f7',        // Purple
};

/**
 * Secondary colors for glow/outline effects
 */
export const STRATEGY_GLOW_COLORS: Record<StrategyType, string> = {
    Aggressive: 'rgba(239, 68, 68, 0.4)',
    Passive: 'rgba(59, 130, 246, 0.4)',
    Cooperative: 'rgba(34, 197, 94, 0.4)',
    TitForTat: 'rgba(234, 179, 8, 0.4)',
    Random: 'rgba(168, 85, 247, 0.4)',
};

export class Sprites {
    private ctx: CanvasRenderingContext2D;

    constructor(ctx: CanvasRenderingContext2D) {
        this.ctx = ctx;
    }

    /**
     * Draw an agent with strategy-specific styling
     */
    drawAgent(agent: Agent, showVisionRadius: boolean = false): void {
        const ctx = this.ctx;
        const size = CONFIG.AGENT_SIZE;
        const color = STRATEGY_COLORS[agent.strategyType] || '#ffffff';
        const glowColor = STRATEGY_GLOW_COLORS[agent.strategyType];

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
            ctx.stroke();
        }

        // Rotate to face velocity direction
        const angle = agent.velocity.heading();
        ctx.rotate(angle);

        // Energy-based opacity (low energy = more transparent)
        const energyRatio = Math.max(0.3, agent.energy / CONFIG.MAX_ENERGY);
        ctx.globalAlpha = energyRatio;

        // Draw agent body (triangle pointing in direction of movement)
        ctx.beginPath();
        ctx.moveTo(size, 0);                              // Nose
        ctx.lineTo(-size * 0.7, -size * 0.6);            // Top back
        ctx.lineTo(-size * 0.4, 0);                       // Back indent
        ctx.lineTo(-size * 0.7, size * 0.6);             // Bottom back
        ctx.closePath();

        // Fill with strategy color
        ctx.fillStyle = color;
        ctx.fill();

        // Subtle outline
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Energy indicator (small bar)
        ctx.globalAlpha = 1;
        const barWidth = size * 1.4;
        const barHeight = 2;
        const barY = size * 0.8;

        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(-barWidth / 2, barY, barWidth, barHeight);

        ctx.fillStyle = this.getEnergyColor(agent.energy);
        ctx.fillRect(-barWidth / 2, barY, barWidth * energyRatio, barHeight);

        ctx.restore();
    }

    /**
     * Draw food item
     */
    drawFood(food: Food): void {
        const ctx = this.ctx;
        const size = CONFIG.FOOD_SIZE;

        ctx.save();
        ctx.translate(food.position.x, food.position.y);

        // Glow effect
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 2);
        gradient.addColorStop(0, CONFIG.FOOD_COLOR);
        gradient.addColorStop(0.5, CONFIG.FOOD_COLOR);
        gradient.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.arc(0, 0, size * 2, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Core
        ctx.beginPath();
        ctx.arc(0, 0, size, 0, Math.PI * 2);
        ctx.fillStyle = CONFIG.FOOD_COLOR;
        ctx.fill();

        // Highlight
        ctx.beginPath();
        ctx.arc(-size * 0.3, -size * 0.3, size * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
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

        ctx.strokeStyle = CONFIG.GRID_COLOR;
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

        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
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
        if (ratio > 0.6) return '#22c55e';       // Green
        if (ratio > 0.3) return '#eab308';       // Yellow
        return '#ef4444';                         // Red
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
        ctx.globalAlpha = alpha * 0.5;

        let color: string;
        switch (type) {
            case 'fight':
                color = '#ef4444';
                break;
            case 'share':
                color = '#22c55e';
                break;
            case 'consume':
                color = '#4ade80';
                break;
        }

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        ctx.restore();
    }
}
