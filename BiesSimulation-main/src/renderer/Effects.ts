/**
 * Visual Effects System
 * Handles hit flashes, trails, and other visual effects
 */

import { Vector2 } from '../models/Vector2';

export interface VisualEffect {
    type: 'hit' | 'consume' | 'birth' | 'death' | 'trail';
    position: Vector2;
    startTime: number;
    duration: number;
    color: string;
    size: number;
    data?: any;
}

export interface TrailPoint {
    x: number;
    y: number;
    age: number;
}

export class EffectsSystem {
    private effects: VisualEffect[] = [];
    private trails: Map<string, TrailPoint[]> = new Map();
    private maxEffects: number = 100;
    private trailLength: number = 8;
    private trailUpdateInterval: number = 50; // ms
    private lastTrailUpdate: number = 0;

    // Configuration
    public showTrails: boolean = false;
    public showHitEffects: boolean = true;

    /**
     * Add a hit flash effect
     */
    addHitEffect(x: number, y: number, color: string = '#ef4444'): void {
        if (!this.showHitEffects) return;

        this.addEffect({
            type: 'hit',
            position: new Vector2(x, y),
            startTime: performance.now(),
            duration: 400,
            color,
            size: 25,
        });
    }

    /**
     * Add a consume effect (food eaten)
     */
    addConsumeEffect(x: number, y: number): void {
        this.addEffect({
            type: 'consume',
            position: new Vector2(x, y),
            startTime: performance.now(),
            duration: 300,
            color: '#4ade80',
            size: 15,
        });
    }

    /**
     * Add a birth effect
     */
    addBirthEffect(x: number, y: number): void {
        this.addEffect({
            type: 'birth',
            position: new Vector2(x, y),
            startTime: performance.now(),
            duration: 500,
            color: '#22c55e',
            size: 20,
        });
    }

    /**
     * Add a death effect
     */
    addDeathEffect(x: number, y: number, color: string): void {
        this.addEffect({
            type: 'death',
            position: new Vector2(x, y),
            startTime: performance.now(),
            duration: 600,
            color,
            size: 30,
        });
    }

    private addEffect(effect: VisualEffect): void {
        this.effects.push(effect);

        // Trim if too many
        while (this.effects.length > this.maxEffects) {
            this.effects.shift();
        }
    }

    /**
     * Update trail for an entity
     */
    updateTrail(id: string, x: number, y: number): void {
        if (!this.showTrails) return;

        const now = performance.now();
        if (now - this.lastTrailUpdate < this.trailUpdateInterval) return;
        this.lastTrailUpdate = now;

        let trail = this.trails.get(id);
        if (!trail) {
            trail = [];
            this.trails.set(id, trail);
        }

        // Add new point
        trail.unshift({ x, y, age: 0 });

        // Age existing points
        for (let i = 1; i < trail.length; i++) {
            trail[i].age++;
        }

        // Trim old points
        while (trail.length > this.trailLength) {
            trail.pop();
        }
    }

    /**
     * Remove trail for an entity
     */
    removeTrail(id: string): void {
        this.trails.delete(id);
    }

    /**
     * Render all active effects
     */
    render(ctx: CanvasRenderingContext2D): void {
        const now = performance.now();

        // Render trails first (behind everything)
        if (this.showTrails) {
            this.renderTrails(ctx);
        }

        // Render effects
        for (let i = this.effects.length - 1; i >= 0; i--) {
            const effect = this.effects[i];
            const elapsed = now - effect.startTime;

            if (elapsed >= effect.duration) {
                this.effects.splice(i, 1);
                continue;
            }

            const progress = elapsed / effect.duration;
            this.renderEffect(ctx, effect, progress);
        }
    }

    private renderEffect(ctx: CanvasRenderingContext2D, effect: VisualEffect, progress: number): void {
        ctx.save();

        const alpha = 1 - progress;
        ctx.globalAlpha = alpha * 0.6;

        switch (effect.type) {
            case 'hit':
                // Expanding ring
                const ringRadius = effect.size * (1 + progress);
                ctx.strokeStyle = effect.color;
                ctx.lineWidth = 3 * (1 - progress);
                ctx.beginPath();
                ctx.arc(effect.position.x, effect.position.y, ringRadius, 0, Math.PI * 2);
                ctx.stroke();

                // Inner glow
                ctx.globalAlpha = alpha * 0.3;
                ctx.fillStyle = effect.color;
                ctx.beginPath();
                ctx.arc(effect.position.x, effect.position.y, ringRadius * 0.5, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'consume':
                // Rising particles
                const particleCount = 5;
                ctx.fillStyle = effect.color;
                for (let i = 0; i < particleCount; i++) {
                    const angle = (i / particleCount) * Math.PI * 2;
                    const dist = progress * 20;
                    const px = effect.position.x + Math.cos(angle) * dist;
                    const py = effect.position.y + Math.sin(angle) * dist - progress * 15;
                    const pSize = 3 * (1 - progress);
                    ctx.beginPath();
                    ctx.arc(px, py, pSize, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;

            case 'birth':
                // Expanding star
                const starRadius = effect.size * progress;
                ctx.strokeStyle = effect.color;
                ctx.lineWidth = 2;
                for (let i = 0; i < 4; i++) {
                    const angle = (i / 4) * Math.PI * 2;
                    ctx.beginPath();
                    ctx.moveTo(effect.position.x, effect.position.y);
                    ctx.lineTo(
                        effect.position.x + Math.cos(angle) * starRadius,
                        effect.position.y + Math.sin(angle) * starRadius
                    );
                    ctx.stroke();
                }
                break;

            case 'death':
                // Fading skull/X shape
                ctx.strokeStyle = effect.color;
                ctx.lineWidth = 2 * (1 - progress);
                const deathSize = effect.size * (0.5 + progress * 0.5);
                ctx.beginPath();
                ctx.moveTo(effect.position.x - deathSize, effect.position.y - deathSize);
                ctx.lineTo(effect.position.x + deathSize, effect.position.y + deathSize);
                ctx.moveTo(effect.position.x + deathSize, effect.position.y - deathSize);
                ctx.lineTo(effect.position.x - deathSize, effect.position.y + deathSize);
                ctx.stroke();
                break;
        }

        ctx.restore();
    }

    private renderTrails(ctx: CanvasRenderingContext2D): void {
        ctx.save();

        for (const [_, trail] of this.trails) {
            if (trail.length < 2) continue;

            ctx.beginPath();
            ctx.moveTo(trail[0].x, trail[0].y);

            for (let i = 1; i < trail.length; i++) {
                ctx.lineTo(trail[i].x, trail[i].y);
            }

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.stroke();
        }

        ctx.restore();
    }

    /**
     * Clear all effects
     */
    clear(): void {
        this.effects = [];
        this.trails.clear();
    }
}
