/**
 * Seedable RNG for deterministic simulations.
 * Uses Mulberry32 PRNG.
 */

export type SeedInput = number | string | undefined;

function hashStringToSeed(value: string): number {
    let h = 2166136261;
    for (let i = 0; i < value.length; i++) {
        h ^= value.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}

export class RNG {
    private state: number = 1;
    private _seed: number = 1;

    constructor(seed?: SeedInput) {
        this.setSeed(seed ?? Date.now());
    }

    get seed(): number {
        return this._seed;
    }

    setSeed(seed: SeedInput): void {
        const numeric =
            typeof seed === 'string'
                ? hashStringToSeed(seed)
                : (seed ?? Date.now());
        this._seed = (numeric >>> 0) || 1;
        this.state = this._seed;
    }

    random(): number {
        // Mulberry32
        let t = (this.state += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    randomRange(min: number, max: number): number {
        return min + (max - min) * this.random();
    }

    randomInt(maxExclusive: number): number {
        if (maxExclusive <= 0) return 0;
        return Math.floor(this.random() * maxExclusive);
    }

    randomIntRange(minInclusive: number, maxExclusive: number): number {
        if (maxExclusive <= minInclusive) return minInclusive;
        return minInclusive + this.randomInt(maxExclusive - minInclusive);
    }
}

export const rng = new RNG();

export function setSeed(seed: SeedInput): void {
    rng.setSeed(seed);
}

export function getSeed(): number {
    return rng.seed;
}

export function random(): number {
    return rng.random();
}

export function randomRange(min: number, max: number): number {
    return rng.randomRange(min, max);
}

export function randomInt(maxExclusive: number): number {
    return rng.randomInt(maxExclusive);
}

export function randomIntRange(minInclusive: number, maxExclusive: number): number {
    return rng.randomIntRange(minInclusive, maxExclusive);
}
