import { Vector2 } from '../models/Vector2';

export abstract class Entity {
    public id: string;
    public position: Vector2;
    public isDead: boolean = false;

    constructor(x: number, y: number) {
        this.id = crypto.randomUUID();
        this.position = new Vector2(x, y);
    }
}
