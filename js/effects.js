class Particle {
    constructor(x, y, angle) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.life = 1.0;
        this.decay = Math.random() * 0.03 + 0.01;
        this.size = Math.random() * 5 + 5;
        this.speed = Math.random() * 20;
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= this.decay;
        this.size += 10 * dt; // Expand
        this.vx *= 0.95; // Friction
        this.vy *= 0.95;
    }

    draw(ctx) {
        ctx.fillStyle = `rgba(200, 200, 200, ${this.life * 0.5})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

class Effects {
    constructor(game) {
        this.game = game;
        this.particles = [];
    }

    createSmoke(x, y, angle) {
        // Create a few particles
        this.particles.push(new Particle(x, y, angle + Math.random() * 0.5 - 0.25));
    }

    update(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.update(dt);
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        this.particles.forEach(p => p.draw(ctx));
    }
}
