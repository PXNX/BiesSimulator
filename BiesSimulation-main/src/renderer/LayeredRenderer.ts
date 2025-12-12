/**
 * LayeredRenderer - Multi-canvas rendering for better performance
 * Separates static background, dynamic entities, and effects into layers
 */

import { getWorldDimensions } from '../config/globalConfig';

export interface Layer {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    needsRedraw: boolean;
}

export class LayeredRenderer {
    private container: HTMLElement;
    private layers: Map<string, Layer> = new Map();
    private _dpr: number = 1;

    constructor(containerId: string) {
        const container = document.getElementById(containerId);
        if (!container) {
            throw new Error(`Container with id ${containerId} not found`);
        }
        this.container = container;

        // Create layers (bottom to top)
        this.createLayer('background', 1);  // Static background
        this.createLayer('grid', 2);        // Debug grid
        this.createLayer('entities', 3);    // Agents and food
        this.createLayer('effects', 4);     // Particles and effects

        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    private createLayer(name: string, zIndex: number): void {
        const canvas = document.createElement('canvas');
        canvas.id = `layer-${name}`;
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.zIndex = zIndex.toString();
        canvas.style.pointerEvents = 'none';

        const ctx = canvas.getContext('2d', {
            alpha: name !== 'background',
            desynchronized: true, // Improve performance
        });

        if (!ctx) {
            throw new Error(`Could not get 2D context for layer ${name}`);
        }

        this.container.appendChild(canvas);
        this.layers.set(name, { canvas, ctx, needsRedraw: true });
    }

    private resize(): void {
        this._dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap at 2x for performance

        const displayWidth = window.innerWidth;
        const displayHeight = window.innerHeight;

        for (const layer of this.layers.values()) {
            layer.canvas.width = displayWidth * this._dpr;
            layer.canvas.height = displayHeight * this._dpr;
            layer.canvas.style.width = `${displayWidth}px`;
            layer.canvas.style.height = `${displayHeight}px`;
            layer.ctx.scale(this._dpr, this._dpr);
            layer.needsRedraw = true;
        }
    }

    getLayer(name: string): Layer | undefined {
        return this.layers.get(name);
    }

    clearLayer(name: string, color?: string): void {
        const layer = this.layers.get(name);
        if (!layer) return;

        const { width, height } = getWorldDimensions();
        layer.ctx.setTransform(this._dpr, 0, 0, this._dpr, 0, 0);

        if (color) {
            layer.ctx.fillStyle = color;
            layer.ctx.fillRect(0, 0, width, height);
        } else {
            layer.ctx.clearRect(0, 0, width, height);
        }
    }

    markDirty(name: string): void {
        const layer = this.layers.get(name);
        if (layer) {
            layer.needsRedraw = true;
        }
    }

    get devicePixelRatio(): number {
        return this._dpr;
    }

    get width(): number {
        return getWorldDimensions().width;
    }

    get height(): number {
        return getWorldDimensions().height;
    }
}
