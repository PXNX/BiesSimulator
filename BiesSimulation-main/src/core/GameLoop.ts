/**
 * Optimized Game Loop with frame skipping and adaptive quality
 */

export class GameLoop {
    private lastTime: number = 0;
    private accumulator: number = 0;
    private readonly timeStep: number = 1 / 60;
    private isRunning: boolean = false;
    private loopId: number = 0;

    // Performance monitoring
    private frameCount: number = 0;
    private fpsTime: number = 0;
    private currentFPS: number = 60;
    private targetFPS: number = 60;
    private skipRenderFrames: number = 0;

    // Adaptive quality settings
    private adaptiveQuality: boolean = true;
    private qualityLevel: number = 1.0; // 0.5 to 1.0

    constructor(
        private updateFn: (delta: number) => void,
        private renderFn: () => void
    ) { }

    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.lastTime = performance.now();
            this.fpsTime = this.lastTime;
            this.frameCount = 0;
            this.loopId = requestAnimationFrame(this.loop.bind(this));
        }
    }

    stop() {
        this.isRunning = false;
        cancelAnimationFrame(this.loopId);
    }

    setAdaptiveQuality(enabled: boolean) {
        this.adaptiveQuality = enabled;
    }

    getQualityLevel(): number {
        return this.qualityLevel;
    }

    getCurrentFPS(): number {
        return this.currentFPS;
    }

    private loop(currentTime: number) {
        if (!this.isRunning) return;

        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        // Update FPS counter
        this.frameCount++;
        if (currentTime - this.fpsTime >= 1000) {
            this.currentFPS = this.frameCount;
            this.frameCount = 0;
            this.fpsTime = currentTime;

            // Adjust quality based on FPS
            if (this.adaptiveQuality) {
                this.adjustQuality();
            }
        }

        // Cap deltaTime to avoid spiral of death on lag
        const safeDelta = Math.min(deltaTime, 0.25);

        this.accumulator += safeDelta;

        // Fixed timestep updates
        let updateCount = 0;
        const maxUpdates = 5; // Prevent spiral of death

        while (this.accumulator >= this.timeStep && updateCount < maxUpdates) {
            this.updateFn(this.timeStep);
            this.accumulator -= this.timeStep;
            updateCount++;
        }

        // Reset accumulator if we're falling too far behind
        if (updateCount >= maxUpdates) {
            this.accumulator = 0;
        }

        // Skip rendering if FPS is low (frame skipping)
        if (this.skipRenderFrames > 0) {
            this.skipRenderFrames--;
        } else {
            this.renderFn();
        }

        this.loopId = requestAnimationFrame(this.loop.bind(this));
    }

    private adjustQuality() {
        if (this.currentFPS < 30) {
            // Critical performance - reduce quality significantly
            this.qualityLevel = Math.max(0.5, this.qualityLevel - 0.1);
            this.skipRenderFrames = 1; // Skip every other frame
        } else if (this.currentFPS < 45) {
            // Low performance - reduce quality
            this.qualityLevel = Math.max(0.7, this.qualityLevel - 0.05);
        } else if (this.currentFPS >= 55 && this.qualityLevel < 1.0) {
            // Good performance - increase quality
            this.qualityLevel = Math.min(1.0, this.qualityLevel + 0.02);
            this.skipRenderFrames = 0;
        }
    }
}
