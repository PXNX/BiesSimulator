import { describe, it, expect } from 'vitest';
import { Vector2 } from '../src/models/Vector2';

describe('Vector2', () => {
    it('adds and subtracts vectors', () => {
        const v = new Vector2(1, 2);
        v.add(new Vector2(3, 4));
        expect(v.x).toBe(4);
        expect(v.y).toBe(6);

        v.sub(new Vector2(1, 1));
        expect(v.x).toBe(3);
        expect(v.y).toBe(5);
    });

    it('normalizes and limits magnitude', () => {
        const v = new Vector2(3, 4);
        expect(v.mag()).toBeCloseTo(5);

        v.normalize();
        expect(v.mag()).toBeCloseTo(1);

        v.mult(10);
        v.limit(2);
        expect(v.mag()).toBeCloseTo(2);
    });
});

