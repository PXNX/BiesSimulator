/**
 * Food Entity
 */

import { Entity } from './Entity';
import { CONFIG } from '../config/globalConfig';

export class Food extends Entity {
    public energyValue: number;

    constructor(x: number, y: number, energyValue?: number) {
        super(x, y);
        this.energyValue = energyValue ?? CONFIG.FOOD_VALUE;
    }
}
