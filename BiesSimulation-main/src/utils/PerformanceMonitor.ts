/**
 * PerformanceMonitor - Track and optimize runtime performance
 */

export class PerformanceMonitor {
    private frameCount: number = 0;
    private lastFpsUpdate: number = 0;
    private fps: number = 60;
    private frameTimes: number[] = [];
    private maxFrameTimeSamples: number = 60;

    // Memory tracking (if available)
    private lastMemoryCheck: number = 0;
    private memoryCheckInterval: number = 5000;

    // Performance markers
    private markers: Map<string, number> = new Map();

    constructor() {
        this.lastFpsUpdate = performance.now();
        this.lastMemoryCheck = performance.now();
    }

    /**
     * Update FPS counter
     */
    update(deltaTime: number): void {
        this.frameCount++;
        this.frameTimes.push(deltaTime);

        if (this.frameTimes.length > this.maxFrameTimeSamples) {
            this.frameTimes.shift();
        }

        const now = performance.now();
        if (now - this.lastFpsUpdate >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastFpsUpdate = now;
        }

        // Check memory periodically
        if (now - this.lastMemoryCheck >= this.memoryCheckInterval) {
            this.checkMemory();
            this.lastMemoryCheck = now;
        }
    }

    /**
     * Start a performance marker
     */
    mark(label: string): void {
        this.markers.set(label, performance.now());
    }

    /**
     * End a performance marker and return duration
     */
    measure(label: string): number {
        const start = this.markers.get(label);
        if (!start) return 0;

        const duration = performance.now() - start;
        this.markers.delete(label);
        return duration;
    }

    /**
     * Get current FPS
     */
    getFPS(): number {
        return this.fps;
    }

    /**
     * Get average frame time in ms
     */
    getAverageFrameTime(): number {
        if (this.frameTimes.length === 0) return 0;
        const sum = this.frameTimes.reduce((a, b) => a + b, 0);
        return sum / this.frameTimes.length;
    }

    /**
     * Get worst frame time (spike detection)
     */
    getWorstFrameTime(): number {
        if (this.frameTimes.length === 0) return 0;
        return Math.max(...this.frameTimes);
    }

    /**
     * Check memory usage (if API available)
     */
    private checkMemory(): void {
        if ('memory' in performance) {
            const memory = (performance as any).memory;
            const usedMB = memory.usedJSHeapSize / 1048576;
            const totalMB = memory.totalJSHeapSize / 1048576;
            const limitMB = memory.jsHeapSizeLimit / 1048576;

            // Log if memory is high
            if (usedMB > limitMB * 0.8) {
                console.warn(`High memory usage: ${usedMB.toFixed(0)}MB / ${limitMB.toFixed(0)}MB`);
            }
        }
    }

    /**
     * Get performance report
     */
    getReport(): {
        fps: number;
        avgFrameTime: number;
        worstFrameTime: number;
        memoryUsage?: number;
    } {
        const report: any = {
            fps: this.fps,
            avgFrameTime: this.getAverageFrameTime(),
            worstFrameTime: this.getWorstFrameTime(),
        };

        if ('memory' in performance) {
            const memory = (performance as any).memory;
            report.memoryUsage = memory.usedJSHeapSize / 1048576;
        }

        return report;
    }

    /**
     * Detect if performance is degraded
     */
    isPerformanceDegraded(): boolean {
        return this.fps < 30 || this.getAverageFrameTime() > 33; // 30 FPS threshold
    }

    /**
     * Get performance recommendations
     */
    getRecommendations(): string[] {
        const recommendations: string[] = [];

        if (this.fps < 30) {
            recommendations.push('Low FPS detected. Consider reducing agent count or disabling effects.');
        }

        const avgFrameTime = this.getAverageFrameTime();
        if (avgFrameTime > 33) {
            recommendations.push('High frame time. Enable LOD rendering for better performance.');
        }

        const worstFrameTime = this.getWorstFrameTime();
        if (worstFrameTime > 100) {
            recommendations.push('Frame spikes detected. Check for GC pauses or heavy operations.');
        }

        return recommendations;
    }

    /**
     * Reset all metrics
     */
    reset(): void {
        this.frameCount = 0;
        this.lastFpsUpdate = performance.now();
        this.fps = 60;
        this.frameTimes = [];
        this.markers.clear();
    }
}

// Singleton instance
export const perfMonitor = new PerformanceMonitor();
