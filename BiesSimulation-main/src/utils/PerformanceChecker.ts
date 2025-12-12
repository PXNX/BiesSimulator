/**
 * Performance Checker Utility
 * Helps diagnose performance issues and suggests optimizations
 */

export interface PerformanceReport {
    fps: number;
    frameTime: number;
    memoryUsage: number;
    agentCount: number;
    bottleneck: string;
    suggestions: string[];
    score: 'excellent' | 'good' | 'fair' | 'poor';
}

export class PerformanceChecker {
    private frameTimes: number[] = [];
    private maxSamples: number = 60;
    private lastFrameTime: number = performance.now();

    recordFrame(): void {
        const now = performance.now();
        const frameTime = now - this.lastFrameTime;
        this.lastFrameTime = now;

        this.frameTimes.push(frameTime);
        if (this.frameTimes.length > this.maxSamples) {
            this.frameTimes.shift();
        }
    }

    getReport(agentCount: number): PerformanceReport {
        const avgFrameTime = this.getAverageFrameTime();
        const fps = 1000 / avgFrameTime;
        const memoryUsage = this.getMemoryUsage();

        const report: PerformanceReport = {
            fps: Math.round(fps),
            frameTime: Math.round(avgFrameTime * 10) / 10,
            memoryUsage: Math.round(memoryUsage),
            agentCount,
            bottleneck: this.identifyBottleneck(fps, agentCount),
            suggestions: this.getSuggestions(fps, agentCount, memoryUsage),
            score: this.getScore(fps),
        };

        return report;
    }

    private getAverageFrameTime(): number {
        if (this.frameTimes.length === 0) return 16.67;
        const sum = this.frameTimes.reduce((a, b) => a + b, 0);
        return sum / this.frameTimes.length;
    }

    private getMemoryUsage(): number {
        // @ts-ignore - memory is non-standard but widely supported
        if (performance.memory) {
            // @ts-ignore
            return performance.memory.usedJSHeapSize / 1048576; // MB
        }
        return 0;
    }

    private identifyBottleneck(fps: number, agentCount: number): string {
        if (fps >= 55) return 'none';
        if (agentCount > 150) return 'agent_count';
        if (fps < 30) return 'rendering';
        if (fps < 45) return 'interactions';
        return 'general';
    }

    private getSuggestions(fps: number, agentCount: number, memory: number): string[] {
        const suggestions: string[] = [];

        if (fps < 30) {
            suggestions.push('Enable performance mode: Use /src/main.optimized.ts');
            suggestions.push('Disable visual effects: Press P or CONFIG.SHOW_TRAILS = false');
            suggestions.push('Reduce agent count to 50-80');
        } else if (fps < 45) {
            suggestions.push('Consider using optimized entry point for smoother gameplay');
            suggestions.push('Disable trails for +10-15% FPS: CONFIG.SHOW_TRAILS = false');
        }

        if (agentCount > 150) {
            suggestions.push(`Reduce agent count (current: ${agentCount}, recommended: <150)`);
            suggestions.push('Use CONFIG.MAX_AGENTS = 150 to cap population');
        }

        if (memory > 200) {
            suggestions.push(`High memory usage (${memory.toFixed(0)}MB) - consider resetting simulation`);
        }

        if (suggestions.length === 0) {
            suggestions.push('Performance is optimal! 🎉');
            if (fps >= 55 && agentCount < 100) {
                suggestions.push('Try increasing agent count for more interesting dynamics');
            }
        }

        return suggestions;
    }

    private getScore(fps: number): 'excellent' | 'good' | 'fair' | 'poor' {
        if (fps >= 55) return 'excellent';
        if (fps >= 45) return 'good';
        if (fps >= 30) return 'fair';
        return 'poor';
    }

    printReport(report: PerformanceReport): void {
        console.group('📊 Performance Report');
        console.log(`Score: ${report.score.toUpperCase()} (${report.fps} FPS)`);
        console.log(`Frame Time: ${report.frameTime}ms`);
        console.log(`Agents: ${report.agentCount}`);
        console.log(`Memory: ${report.memoryUsage}MB`);
        console.log(`Bottleneck: ${report.bottleneck}`);
        console.log('\nSuggestions:');
        report.suggestions.forEach((s, i) => console.log(`  ${i + 1}. ${s}`));
        console.groupEnd();
    }

    getFormattedReport(report: PerformanceReport): string {
        const scoreEmoji = {
            excellent: '🟢',
            good: '🟡',
            fair: '🟠',
            poor: '🔴',
        };

        return `
${scoreEmoji[report.score]} Performance: ${report.score.toUpperCase()}

📈 Metrics:
  • FPS: ${report.fps}
  • Frame Time: ${report.frameTime}ms
  • Agents: ${report.agentCount}
  • Memory: ${report.memoryUsage}MB
  • Bottleneck: ${report.bottleneck}

💡 Suggestions:
${report.suggestions.map((s, i) => `  ${i + 1}. ${s}`).join('\n')}
        `.trim();
    }

    // Automated performance test
    async runBenchmark(
        resetFn: (agentCount: number) => void,
        agentCounts: number[] = [50, 100, 150, 200]
    ): Promise<{ agentCount: number; fps: number }[]> {
        const results: { agentCount: number; fps: number }[] = [];

        console.log('🔬 Starting benchmark...');

        for (const count of agentCounts) {
            console.log(`Testing ${count} agents...`);
            resetFn(count);

            // Wait for stabilization
            await this.sleep(2000);

            // Clear samples
            this.frameTimes = [];

            // Measure for 5 seconds
            await this.sleep(5000);

            const report = this.getReport(count);
            results.push({ agentCount: count, fps: report.fps });

            console.log(`  ${count} agents: ${report.fps} FPS`);
        }

        console.log('✅ Benchmark complete');
        this.printBenchmarkResults(results);

        return results;
    }

    private printBenchmarkResults(results: { agentCount: number; fps: number }[]): void {
        console.group('📊 Benchmark Results');
        console.table(results);

        const optimal = results.find(r => r.fps >= 55);
        if (optimal) {
            console.log(`✅ Optimal agent count: ${optimal.agentCount} (${optimal.fps} FPS)`);
        } else {
            console.log('⚠️ Performance issues detected at all tested agent counts');
        }

        console.groupEnd();
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // System info
    getSystemInfo(): Record<string, any> {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            hardwareConcurrency: navigator.hardwareConcurrency,
            deviceMemory: (navigator as any).deviceMemory || 'unknown',
            devicePixelRatio: window.devicePixelRatio,
            screenResolution: `${window.screen.width}x${window.screen.height}`,
            viewportSize: `${window.innerWidth}x${window.innerHeight}`,
            // @ts-ignore
            memory: performance.memory ? {
                // @ts-ignore
                total: Math.round(performance.memory.jsHeapSizeLimit / 1048576) + 'MB',
                // @ts-ignore
                used: Math.round(performance.memory.usedJSHeapSize / 1048576) + 'MB',
            } : 'not available',
        };
    }

    printSystemInfo(): void {
        console.group('💻 System Information');
        const info = this.getSystemInfo();
        for (const [key, value] of Object.entries(info)) {
            console.log(`${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`);
        }
        console.groupEnd();
    }
}

// Singleton instance
export const performanceChecker = new PerformanceChecker();

// Auto-export for console usage
if (typeof window !== 'undefined') {
    (window as any).performanceChecker = performanceChecker;
}
