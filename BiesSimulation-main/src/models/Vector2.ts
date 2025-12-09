export class Vector2 {
    constructor(public x: number, public y: number) { }

    add(v: Vector2): Vector2 {
        this.x += v.x;
        this.y += v.y;
        return this;
    }

    sub(v: Vector2): Vector2 {
        this.x -= v.x;
        this.y -= v.y;
        return this;
    }

    mult(n: number): Vector2 {
        this.x *= n;
        this.y *= n;
        return this;
    }

    div(n: number): Vector2 {
        if (n !== 0) {
            this.x /= n;
            this.y /= n;
        }
        return this;
    }

    mag(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    normalize(): Vector2 {
        const m = this.mag();
        if (m > 0) {
            this.div(m);
        }
        return this;
    }

    limit(max: number): Vector2 {
        if (this.mag() > max) {
            this.normalize().mult(max);
        }
        return this;
    }

    dist(v: Vector2): number {
        const dx = this.x - v.x;
        const dy = this.y - v.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    copy(): Vector2 {
        return new Vector2(this.x, this.y);
    }

    static random(): Vector2 {
        const angle = Math.random() * Math.PI * 2;
        return new Vector2(Math.cos(angle), Math.sin(angle));
    }
}
