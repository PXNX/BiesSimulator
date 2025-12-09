export class GameLoop {
    private lastTime: number = 0;
    private accumulator: number = 0;
    private readonly timeStep: number = 1 / 60;
    private isRunning: boolean = false;
    private loopId: number = 0;

    constructor(
        private updateFn: (delta: number) => void,
        private renderFn: () => void
    ) { }

    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.lastTime = performance.now();
            this.loopId = requestAnimationFrame(this.loop.bind(this));
        }
    }

    stop() {
        this.isRunning = false;
        cancelAnimationFrame(this.loopId);
    }

    private loop(currentTime: number) {
        if (!this.isRunning) return;

        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        // Cap deltaTime to avoid spiral of death on lag
        const safeDelta = Math.min(deltaTime, 0.25);

        this.accumulator += safeDelta;

        while (this.accumulator >= this.timeStep) {
            this.updateFn(this.timeStep);
            this.accumulator -= this.timeStep;
        }

        this.renderFn();
        this.loopId = requestAnimationFrame(this.loop.bind(this));
    }
}
