import { Entity } from './Entity';
import { CONFIG } from '../config/globalConfig';

export class Food extends Entity {
    public energyValue: number;

    constructor(x: number, y: number) {
        super(x, y);
        this.energyValue = CONFIG.FOOD_VALUE;
    }
}
