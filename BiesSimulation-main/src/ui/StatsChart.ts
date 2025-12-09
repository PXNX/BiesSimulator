/**
 * Population Chart - Chart.js integration for population over time
 */

import { World } from '../core/World';
import type { StrategyType } from '../config/globalConfig';

// Chart.js types (minimal, we'll load from CDN)
interface ChartDataset {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    fill: boolean;
    tension: number;
    pointRadius: number;
}

interface ChartInstance {
    data: {
        labels: string[];
        datasets: ChartDataset[];
    };
    update: (mode?: string) => void;
    destroy: () => void;
}

declare const Chart: any;

const STRATEGY_COLORS: Record<StrategyType, string> = {
    Aggressive: '#ef4444',
    Passive: '#3b82f6',
    Cooperative: '#22c55e',
    TitForTat: '#eab308',
    Random: '#a855f7',
};

export class StatsChart {
    private world: World;
    private chart: ChartInstance | null = null;
    private canvas: HTMLCanvasElement;
    private isInitialized: boolean = false;

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
        // Check if already loaded
        if (typeof Chart !== 'undefined') {
            this.initChart();
            return;
        }

        // Load from CDN
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js';
        script.async = true;
        script.onload = () => {
            this.initChart();
        };
        document.head.appendChild(script);
    }

    private initChart(): void {
        if (this.isInitialized || !this.canvas) return;

        const ctx = this.canvas.getContext('2d');
        if (!ctx) return;

        this.chart = new Chart(ctx, {
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
                    },
                    y: {
                        display: true,
                        min: 0,
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

    private createDataset(strategy: StrategyType): ChartDataset {
        return {
            label: strategy,
            data: [],
            borderColor: STRATEGY_COLORS[strategy],
            backgroundColor: STRATEGY_COLORS[strategy] + '20',
            fill: true,
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
}
