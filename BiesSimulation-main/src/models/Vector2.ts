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

    magSq(): number {
        return this.x * this.x + this.y * this.y;
    }

    normalize(): Vector2 {
        const m = this.mag();
        if (m > 0) {
            this.div(m);
        }
        return this;
    }

    setMag(n: number): Vector2 {
        return this.normalize().mult(n);
    }

    limit(max: number): Vector2 {
        if (this.magSq() > max * max) {
            this.normalize().mult(max);
        }
        return this;
    }

    dist(v: Vector2): number {
        const dx = this.x - v.x;
        const dy = this.y - v.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    distSq(v: Vector2): number {
        const dx = this.x - v.x;
        const dy = this.y - v.y;
        return dx * dx + dy * dy;
    }

    heading(): number {
        return Math.atan2(this.y, this.x);
    }

    rotate(angle: number): Vector2 {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const newX = this.x * cos - this.y * sin;
        const newY = this.x * sin + this.y * cos;
        this.x = newX;
        this.y = newY;
        return this;
    }

    lerp(target: Vector2, t: number): Vector2 {
        this.x += (target.x - this.x) * t;
        this.y += (target.y - this.y) * t;
        return this;
    }

    dot(v: Vector2): number {
        return this.x * v.x + this.y * v.y;
    }

    copy(): Vector2 {
        return new Vector2(this.x, this.y);
    }

    set(x: number, y: number): Vector2 {
        this.x = x;
        this.y = y;
        return this;
    }

    static random(): Vector2 {
        const angle = Math.random() * Math.PI * 2;
        return new Vector2(Math.cos(angle), Math.sin(angle));
    }

    static fromAngle(angle: number): Vector2 {
        return new Vector2(Math.cos(angle), Math.sin(angle));
    }

    static zero(): Vector2 {
        return new Vector2(0, 0);
    }

    static subtract(a: Vector2, b: Vector2): Vector2 {
        return new Vector2(a.x - b.x, a.y - b.y);
    }

    static add(a: Vector2, b: Vector2): Vector2 {
        return new Vector2(a.x + b.x, a.y + b.y);
    }

    static distance(a: Vector2, b: Vector2): number {
        return a.dist(b);
    }
}
