import { describe, it, expect } from 'vitest';
import { setSeed, random } from '../src/utils/RNG';

describe('RNG', () => {
    it('produces deterministic sequences for same seed', () => {
        setSeed(12345);
        const seq1 = [random(), random(), random(), random()];

        setSeed(12345);
        const seq2 = [random(), random(), random(), random()];

        expect(seq2).toEqual(seq1);
    });
});

