import { World } from '../core/World';
import { Controls } from './Controls';

interface TouchState {
    id: number;
    x: number;
    y: number;
}

/**
 * Minimal gesture support for mobile: double-tap to pause, pinch to adjust speed.
 */
export class GestureController {
    private world: World;
    private controls: Controls;
    private canvas: HTMLCanvasElement;
    private touches: Map<number, TouchState> = new Map();
    private pinchStartDist: number | null = null;
    private pinchStartSpeed: number = 1;
    private lastTap = 0;

    constructor(world: World, controls: Controls, canvasId: string = 'sim-canvas') {
        this.world = world;
        this.controls = controls;
        const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        if (!canvas) throw new Error('Canvas not found for gestures');
        this.canvas = canvas;
        this.bind();
    }

    private bind(): void {
        this.canvas.addEventListener('touchstart', (e) => this.onStart(e), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => this.onMove(e), { passive: false });
        this.canvas.addEventListener('touchend', (e) => this.onEnd(e), { passive: false });
        this.canvas.addEventListener('touchcancel', (e) => this.onEnd(e), { passive: false });
    }

    private onStart(e: TouchEvent): void {
        const now = performance.now();
        if (now - this.lastTap < 300) {
            this.world.togglePause();
            e.preventDefault();
        }
        this.lastTap = now;

        for (const t of Array.from(e.changedTouches)) {
            this.touches.set(t.identifier, { id: t.identifier, x: t.clientX, y: t.clientY });
        }
        if (this.touches.size === 2) {
            const [a, b] = Array.from(this.touches.values());
            this.pinchStartDist = this.distance(a, b);
            this.pinchStartSpeed = this.world.timeScale;
        }
    }

    private onMove(e: TouchEvent): void {
        if (this.touches.size < 2) return;
        for (const t of Array.from(e.changedTouches)) {
            const entry = this.touches.get(t.identifier);
            if (entry) {
                entry.x = t.clientX;
                entry.y = t.clientY;
            }
        }
        const [a, b] = Array.from(this.touches.values());
        if (!a || !b || this.pinchStartDist == null) return;
        const dist = this.distance(a, b);
        const scale = dist / this.pinchStartDist;
        const nextSpeed = this.pinchStartSpeed * scale;
        this.controls.setSpeedMultiplier(nextSpeed);
        e.preventDefault();
    }

    private onEnd(e: TouchEvent): void {
        for (const t of Array.from(e.changedTouches)) {
            this.touches.delete(t.identifier);
        }
        if (this.touches.size < 2) {
            this.pinchStartDist = null;
        }
    }

    private distance(a: TouchState, b: TouchState): number {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
}
