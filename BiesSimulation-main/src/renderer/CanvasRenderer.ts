/**
 * Canvas Renderer with DPI-aware sizing and debug features
 */

import { CONFIG, setWorldDimensions } from '../config/globalConfig';

export class CanvasRenderer {
    private ctx: CanvasRenderingContext2D;
    private canvas: HTMLCanvasElement;
    private _dpr: number = 1;

    constructor(canvasId: string) {
        const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        if (!canvas) {
            throw new Error(`Canvas with id ${canvasId} not found`);
        }
        this.canvas = canvas;
        const ctx = this.canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Could not get 2D context');
        }
        this.ctx = ctx;

        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    /**
     * Resize canvas with DPI awareness for sharp rendering on retina displays
     */
    private resize(): void {
        // Get device pixel ratio
        this._dpr = window.devicePixelRatio || 1;

        // Get CSS pixel dimensions
        const displayWidth = window.innerWidth;
        const displayHeight = window.innerHeight;

        // Set canvas internal resolution
        this.canvas.width = displayWidth * this._dpr;
        this.canvas.height = displayHeight * this._dpr;

        // Set CSS display size
        this.canvas.style.width = `${displayWidth}px`;
        this.canvas.style.height = `${displayHeight}px`;

        // Scale context to match DPI
        this.ctx.scale(this._dpr, this._dpr);

        // Update global world dimensions
        setWorldDimensions(displayWidth, displayHeight);
    }

    /**
     * Clear canvas with configured background color
     */
    public clear(color?: string): void {
        // Reset transform to clear entire canvas
        this.ctx.setTransform(this._dpr, 0, 0, this._dpr, 0, 0);

        this.ctx.fillStyle = color || CONFIG.CLEAR_COLOR;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    /**
     * Draw debug grid overlay
     */
    public drawGrid(): void {
        if (!CONFIG.SHOW_GRID) return;

        const ctx = this.ctx;
        const gridSize = CONFIG.GRID_SIZE;

        ctx.strokeStyle = CONFIG.GRID_COLOR;
        ctx.lineWidth = 1;

        // Vertical lines
        for (let x = 0; x <= this.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.height);
            ctx.stroke();
        }

        // Horizontal lines
        for (let y = 0; y <= this.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.width, y);
            ctx.stroke();
        }

        // Draw cell coordinates (optional, only when zoomed in)
        if (gridSize > 40) {
            ctx.font = '10px monospace';
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            for (let x = 0; x < this.width; x += gridSize) {
                for (let y = 0; y < this.height; y += gridSize) {
                    ctx.fillText(`${Math.floor(x / gridSize)},${Math.floor(y / gridSize)}`, x + 2, y + 12);
                }
            }
        }
    }

    /**
     * Draw center axis crosshair
     */
    public drawAxis(): void {
        const ctx = this.ctx;
        const centerX = this.width / 2;
        const centerY = this.height / 2;

        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);

        // X-axis
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(this.width, centerY);
        ctx.stroke();

        // Y-axis
        ctx.beginPath();
        ctx.moveTo(centerX, 0);
        ctx.lineTo(centerX, this.height);
        ctx.stroke();

        ctx.setLineDash([]);
    }

    public getContext(): CanvasRenderingContext2D {
        return this.ctx;
    }

    public get width(): number {
        // Return CSS pixel width, not internal resolution
        return this.canvas.width / this._dpr;
    }

    public get height(): number {
        return this.canvas.height / this._dpr;
    }

    public get devicePixelRatio(): number {
        return this._dpr;
    }
}
