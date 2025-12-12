/**
 * LightweightChart - Simple, performant chart implementation
 * Replaces Chart.js for better performance and smaller bundle size
 */

import { World } from '../core/World';
import type { StrategyType } from '../config/globalConfig';

const STRATEGY_COLORS: Record<StrategyType, string> = {
    Aggressive: '#ff2244',
    Passive: '#4488ff',
    Cooperative: '#00ff88',
    TitForTat: '#ffcc00',
    Random: '#cc44ff',
};

interface DataPoint {
    time: number;
    strategies: Record<StrategyType, number>;
}

export class LightweightChart {
    private world: World;
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D | null = null;
    private dataPoints: DataPoint[] = [];
    private maxDataPoints: number = 60;
    private sampleInterval: number = 500;
    private lastSample: number = 0;
    private width: number = 0;
    private height: number = 0;

    constructor(world: World) {
        this.world = world;
        this.canvas = document.getElementById('population-chart') as HTMLCanvasElement;

        if (!this.canvas) {
            console.warn('Population chart canvas not found');
            return;
        }

        const ctx = this.canvas.getContext('2d');
        if (!ctx) {
            console.error('Could not get 2D context for chart');
            return;
        }

        this.ctx = ctx;
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    private resize(): void {
        if (!this.canvas || !this.ctx) return;

        const parent = this.canvas.parentElement;
        if (!parent) return;

        const rect = parent.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);

        this.width = rect.width;
        this.height = rect.height;

        this.canvas.width = this.width * dpr;
        this.canvas.height = this.height * dpr;
        this.canvas.style.width = `${this.width}px`;
        this.canvas.style.height = `${this.height}px`;

        this.ctx.scale(dpr, dpr);
    }

    update(): void {
        if (!this.ctx) return;

        const now = performance.now();
        if (now - this.lastSample < this.sampleInterval) return;
        this.lastSample = now;

        const stats = this.world.getStats();

        this.dataPoints.push({
            time: now,
            strategies: { ...stats.strategyCounts },
        });

        while (this.dataPoints.length > this.maxDataPoints) {
            this.dataPoints.shift();
        }

        this.render();
    }

    reset(): void {
        this.dataPoints = [];
        if (this.ctx) {
            this.ctx.clearRect(0, 0, this.width, this.height);
        }
    }

    private render(): void {
        if (!this.ctx || this.dataPoints.length === 0) return;

        const ctx = this.ctx;
        const padding = { top: 10, right: 10, bottom: 20, left: 35 };
        const chartWidth = this.width - padding.left - padding.right;
        const chartHeight = this.height - padding.top - padding.bottom;

        // Clear canvas
        ctx.clearRect(0, 0, this.width, this.height);

        // Calculate max value for scaling
        const maxValue = Math.max(
            ...this.dataPoints.map(dp =>
                Object.values(dp.strategies).reduce((sum, val) => sum + val, 0)
            ),
            1
        );

        // Draw background grid
        this.drawGrid(ctx, padding, chartWidth, chartHeight, maxValue);

        // Draw stacked area chart
        const strategies: StrategyType[] = ['Aggressive', 'Passive', 'Cooperative', 'TitForTat', 'Random'];

        ctx.save();
        ctx.translate(padding.left, padding.top);

        // Draw each strategy layer (bottom to top)
        for (let stratIdx = 0; stratIdx < strategies.length; stratIdx++) {
            const strategy = strategies[stratIdx];
            const color = STRATEGY_COLORS[strategy];

            ctx.fillStyle = color + '30'; // Add transparency
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.5;

            ctx.beginPath();

            // Calculate cumulative values for stacking
            for (let i = 0; i < this.dataPoints.length; i++) {
                const x = (i / (this.maxDataPoints - 1)) * chartWidth;

                // Sum all strategies up to current one
                let cumulativeValue = 0;
                for (let j = 0; j <= stratIdx; j++) {
                    cumulativeValue += this.dataPoints[i].strategies[strategies[j]];
                }

                const y = chartHeight - (cumulativeValue / maxValue) * chartHeight;

                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }

            // Complete the shape back to baseline
            if (stratIdx > 0) {
                // Line back along previous layer
                for (let i = this.dataPoints.length - 1; i >= 0; i--) {
                    const x = (i / (this.maxDataPoints - 1)) * chartWidth;

                    let cumulativeValue = 0;
                    for (let j = 0; j < stratIdx; j++) {
                        cumulativeValue += this.dataPoints[i].strategies[strategies[j]];
                    }

                    const y = chartHeight - (cumulativeValue / maxValue) * chartHeight;
                    ctx.lineTo(x, y);
                }
            } else {
                // First layer - go to bottom
                ctx.lineTo(chartWidth, chartHeight);
                ctx.lineTo(0, chartHeight);
            }

            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }

        ctx.restore();
    }

    private drawGrid(
        ctx: CanvasRenderingContext2D,
        padding: { top: number; right: number; bottom: number; left: number },
        chartWidth: number,
        chartHeight: number,
        maxValue: number
    ): void {
        ctx.save();
        ctx.translate(padding.left, padding.top);

        // Grid lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;

        const gridLines = 4;
        for (let i = 0; i <= gridLines; i++) {
            const y = (i / gridLines) * chartHeight;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(chartWidth, y);
            ctx.stroke();
        }

        // Y-axis labels
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '9px monospace';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';

        for (let i = 0; i <= gridLines; i++) {
            const y = (i / gridLines) * chartHeight;
            const value = Math.round(maxValue * (1 - i / gridLines));
            ctx.fillText(value.toString(), -5, y);
        }

        ctx.restore();
    }
}
