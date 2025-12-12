/**
 * Population Chart - Chart.js integration for population over time
 */

import { World } from '../core/World';
import type { StrategyType } from '../config/globalConfig';
import type { Chart as ChartJS, ChartConfiguration } from 'chart.js';

type LineChart = ChartJS<'line', number[], string>;
type LineChartConfiguration = ChartConfiguration<'line', number[], string>;
type ChartConstructor = new (
    ctx: CanvasRenderingContext2D,
    config: LineChartConfiguration
) => LineChart;

const STRATEGY_COLORS: Record<StrategyType, string> = {
    Aggressive: '#ef4444',
    Passive: '#3b82f6',
    Cooperative: '#22c55e',
    TitForTat: '#eab308',
    Random: '#a855f7',
};

export class StatsChart {
    private world: World;
    private ChartCtor: ChartConstructor | null = null;
    private chart: LineChart | null = null;
    private canvas: HTMLCanvasElement;
    private isInitialized: boolean = false;
    private errorMessageEl: HTMLElement | null = null;

    // Data storage
    private maxDataPoints: number = 60;
    private sampleInterval: number = 500; // ms
    private lastSample: number = 0;
    private dataPoints: {
        time: number;
        strategies: Record<StrategyType, number>;
    }[] = [];

    constructor(world: World) {
        this.world = world;
        this.canvas = document.getElementById('population-chart') as HTMLCanvasElement;

        // Load Chart.js dynamically
        this.loadChartJS();
    }

    private async loadChartJS(): Promise<void> {
        try {
            const mod = await import('chart.js/auto');
            this.ChartCtor = (mod.default as unknown) as ChartConstructor;
            this.initChart();
        } catch (err) {
            console.error('Failed to load Chart.js', err);
            this.showFallback('Chart unavailable (Chart.js failed to load)');
        }
    }

    private initChart(): void {
        if (this.isInitialized || !this.canvas || !this.ChartCtor) return;

        const ctx = this.canvas.getContext('2d');
        if (!ctx) return;

        this.clearFallback();
        this.chart = new this.ChartCtor(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    this.createDataset('Aggressive'),
                    this.createDataset('Passive'),
                    this.createDataset('Cooperative'),
                    this.createDataset('TitForTat'),
                    this.createDataset('Random'),
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                interaction: {
                    intersect: false,
                    mode: 'index',
                },
                plugins: {
                    legend: {
                        display: false,
                    },
                    tooltip: {
                        enabled: true,
                        backgroundColor: 'rgba(22, 33, 62, 0.9)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderWidth: 1,
                    },
                },
                scales: {
                    x: {
                        display: false,
                        stacked: true,
                    },
                    y: {
                        display: true,
                        min: 0,
                        stacked: true,
                        grid: {
                            color: 'rgba(255,255,255,0.05)',
                        },
                        ticks: {
                            color: 'rgba(255,255,255,0.5)',
                            font: { size: 9 },
                            maxTicksLimit: 4,
                        },
                    },
                },
            },
        });

        this.isInitialized = true;
    }

    private createDataset(strategy: StrategyType) {
        return {
            label: strategy,
            data: [],
            borderColor: STRATEGY_COLORS[strategy],
            backgroundColor: STRATEGY_COLORS[strategy] + '20',
            fill: true,
            stack: 'population',
            tension: 0.3,
            pointRadius: 0,
        };
    }

    /**
     * Update chart (call every frame, will sample internally)
     */
    update(): void {
        if (!this.isInitialized || !this.chart) return;

        const now = performance.now();
        if (now - this.lastSample < this.sampleInterval) return;
        this.lastSample = now;

        // Get current stats
        const stats = this.world.getStats();

        // Add data point
        this.dataPoints.push({
            time: now,
            strategies: { ...stats.strategyCounts },
        });

        // Trim old data
        while (this.dataPoints.length > this.maxDataPoints) {
            this.dataPoints.shift();
        }

        // Update chart
        this.updateChartData();
    }

    private updateChartData(): void {
        if (!this.chart) return;

        // Update labels
        this.chart.data.labels = this.dataPoints.map((_, i) => i.toString());

        // Update datasets
        const strategies: StrategyType[] = ['Aggressive', 'Passive', 'Cooperative', 'TitForTat', 'Random'];
        for (let i = 0; i < strategies.length; i++) {
            const strategy = strategies[i];
            this.chart.data.datasets[i].data = this.dataPoints.map(dp => dp.strategies[strategy]);
        }

        // Refresh chart
        this.chart.update('none');
    }

    /**
     * Reset chart data
     */
    reset(): void {
        this.dataPoints = [];
        if (this.chart) {
            for (const dataset of this.chart.data.datasets) {
                dataset.data = [];
            }
            this.chart.data.labels = [];
            this.chart.update('none');
        }
    }

    private showFallback(message: string): void {
        const container = document.getElementById('chart-container');
        if (!container) return;

        this.canvas?.classList.add('hidden');

        if (!this.errorMessageEl) {
            this.errorMessageEl = document.createElement('div');
            this.errorMessageEl.className = 'chart-fallback';
            container.appendChild(this.errorMessageEl);
        }

        this.errorMessageEl.textContent = message;
    }

    private clearFallback(): void {
        this.canvas?.classList.remove('hidden');
        if (this.errorMessageEl) {
            this.errorMessageEl.remove();
            this.errorMessageEl = null;
        }
    }
}
