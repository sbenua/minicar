class Car {
    constructor(game) {
        this.game = game;
        this.x = 0;
        this.y = 0;
        this.angle = -Math.PI / 2; // Pointing up
        this.speed = 0;
        this.maxSpeed = 800;
        this.acceleration = 600;
        this.friction = 0.96;
        this.turnSpeed = 3.5;

        // Drifting properties
        this.isDrifting = false;
        this.driftFactor = 0.96; // Normal sideways friction
        this.driftFactorSlide = 0.99; // Slippery sideways friction

        // Boost properties
        this.isBoosting = false;
        this.boostMultiplier = 1.5;

        // NOS Properties
        this.nosState = 'ready'; // ready, active, fading, cooldown
        this.nosTimer = 0;
        this.nosDuration = 2.0; // 2 seconds active triple speed
        this.nosFadeDuration = 5.0; // 5 seconds fade out
        this.nosCooldown = 0; // Will be set randomly
        this.baseMaxSpeed = this.maxSpeed; // Store original
        this.nosMaxSpeed = this.maxSpeed * 3;

        // Velocity vector components (for drifting momentum)
        this.vx = 0;
        this.vy = 0;

        this.width = 60;
        this.height = 100; // Approximate collision box
    }

    activateNOS() {
        if (this.nosState === 'ready') {
            this.nosState = 'active';
            this.nosTimer = this.nosDuration;

            // Start cooldown immediately as per interpreted request "loading started when button pressed"
            // Instant acceleration to max speed
            this.speed = this.nosMaxSpeed;

            // Bypass inertia/grip smoothing so velocity is instant
            this.vx = Math.cos(this.angle) * this.speed;
            this.vy = Math.sin(this.angle) * this.speed;

            // Cooldown is random 10-30s
            this.nosCooldown = 10 + Math.random() * 20;

            console.log(`NOS Activated! Cooldown for ${this.nosCooldown.toFixed(1)}s`);
        }
    }

    update(dt) {
        const input = this.game.input.keys;

        // NOS Logic
        if (input.nos && this.nosState === 'ready') {
            this.activateNOS();
        }

        // NOS State Machine
        if (this.nosState === 'active') {
            this.nosTimer -= dt;
            if (this.nosTimer <= 0) {
                this.nosState = 'fading';
                this.nosTimer = this.nosFadeDuration;
            }
        } else if (this.nosState === 'fading') {
            this.nosTimer -= dt;
            if (this.nosTimer <= 0) {
                // Determine next state based on cooldown
                // If cooldown is still running (very likely since 10s+ > 2+5s), we go to cooldown state logically
                // But actually we just check cooldown variable
                this.nosState = 'cooldown';
            }
        }

        // Cooldown timer runs independently once activated
        if (this.nosCooldown > 0) {
            this.nosCooldown -= dt;
            if (this.nosCooldown <= 0) {
                this.nosCooldown = 0;
                this.nosState = 'ready';
            } else if (this.nosState === 'cooldown') {
                // Just waiting
            }
        }

        // Calculate Max Speed based on NOS
        let currentMaxSpeed = this.baseMaxSpeed;

        if (this.nosState === 'active') {
            currentMaxSpeed = this.nosMaxSpeed;
        } else if (this.nosState === 'fading') {
            // Linear fade from Triple to Normal
            // Timer goes from 5.0 down to 0.0
            // Factor goes from 1.0 (start of fade) to 0.0 (end)
            const t = this.nosTimer / this.nosFadeDuration;
            currentMaxSpeed = this.baseMaxSpeed + (this.nosMaxSpeed - this.baseMaxSpeed) * t;
        }

        // 1. Handling Acceleration / Braking
        if (input.up) {
            this.speed += this.acceleration * dt;
        } else if (input.down) {
            this.speed -= this.acceleration * dt;
        } else {
            // Drag / Rolling resistance
            this.speed *= 0.98;
            if (Math.abs(this.speed) < 5) this.speed = 0;
        }

        // Boost (Manual Boost button still exists, separate from NOS?)
        // User asked for "NOS button", assumed replacing or adding.
        // "now add a new button as NOS button" -> Addition.
        // Existing boost logic:
        this.isBoosting = input.boost;
        if (this.isBoosting) {
            currentMaxSpeed *= this.boostMultiplier;
            // Emit particles when boosting
            // Center rear emission
            const rearX = this.x - Math.cos(this.angle) * 30;
            const rearY = this.y - Math.sin(this.angle) * 30;
            if (Math.random() < 0.3) {
                this.game.effects.createSmoke(rearX, rearY, this.angle + Math.PI);
            }
        }

        // Cap speed
        if (this.speed > currentMaxSpeed) this.speed = currentMaxSpeed;
        if (this.speed < -currentMaxSpeed / 2) this.speed = -currentMaxSpeed / 2;

        // 2. Handling Steering
        // Only turn if moving
        if (Math.abs(this.speed) > 10) {
            const dir = this.speed > 0 ? 1 : -1;
            if (input.left) {
                this.angle -= this.turnSpeed * dt * dir;
            }
            if (input.right) {
                this.angle += this.turnSpeed * dt * dir;
            }
        }

        // 3. Physics & Drifting
        this.isDrifting = input.drift && Math.abs(this.speed) > 100;

        // Ideal velocity vector (where the car points)
        const frontVx = Math.cos(this.angle) * this.speed;
        const frontVy = Math.sin(this.angle) * this.speed;

        // Apply inertia to current velocity
        // If drifting, we blend less towards the front vector (more sliding)
        // If driving normally, we blend quickly towards the front vector (grip)

        const grip = this.isDrifting ? 0.05 : 0.2;

        this.vx = this.vx * (1 - grip) + frontVx * grip;
        this.vy = this.vy * (1 - grip) + frontVy * grip;

        // Apply global position update
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // 4. Drift Effects
        if (this.isDrifting) {
            // Check lateral velocity to see if we are actually sliding
            // If drifting, emit smoke from "tires"
            // We can calculate left and right rear tires offset
            const cos = Math.cos(this.angle);
            const sin = Math.sin(this.angle);

            // Left Side Smoke (as requested: "car should emit left-side smoke effects" - interpreted as left rear tire?)
            // Actually request says "left-side smoke effects". I'll put it on the left rear tire.

            // Offset for left rear tire relative to center
            // Approx: -30 back, -20 left
            const lrX = this.x - cos * 25 - sin * (-15);
            const lrY = this.y - sin * 25 + cos * (-15);

            // Offset for right rear tire
            const rrX = this.x - cos * 25 - sin * (15);
            const rrY = this.y - sin * 25 + cos * (15);

            if (Math.random() > 0.1) {
                this.game.effects.createSmoke(lrX, lrY, this.angle + Math.PI);
                this.game.effects.createSmoke(rrX, rrY, this.angle + Math.PI);
            }
        }

        // 5. Collision Detection
        // Simple circle collision
        const carRadius = 30; // Approx
        const objects = this.game.world.objects;

        // Only check objects near car? For now iterate all (2000 is fine for simple JS loop)
        // Optimization: World could expose "objects near(x,y)"
        // But let's do a simple loop first.

        // We only care about Tree and Stone collision. House too.

        for (let obj of objects) {
            // Quick broadphase
            const dx = this.x - obj.x;
            const dy = this.y - obj.y;
            if (Math.abs(dx) > 100 || Math.abs(dy) > 100) continue;

            const dist = Math.sqrt(dx * dx + dy * dy);
            const minY = carRadius + (obj.radius || 30); // Use object radius if set (added in world.js)

            if (dist < minY) {
                // Collision!
                // Bounce back / Stop

                // Push car out
                const angle = Math.atan2(dy, dx);
                const push = minY - dist;
                this.x += Math.cos(angle) * push;
                this.y += Math.sin(angle) * push;

                // Kill speed (bounce)
                this.speed *= -0.5;
                this.vx *= -0.5;
                this.vy *= -0.5;
            }
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        const img = this.game.assets.car;
        if (img) {
            // Draw car centered
            // Assuming image is pointing RIGHT by default (0 radians)
            // But my angle logic assumes 0 is RIGHT.
            // If image points right, we need no extra rotation.
            // Adjust scale if needed. Let's assume the sprite is roughly 100px wide.
            const scale = 0.5; // Sprite might be large
            const w = img.width * scale;
            const h = img.height * scale;
            ctx.drawImage(img, -w / 2, -h / 2, w, h);
        } else {
            // Fallback rectangle
            ctx.fillStyle = 'red';
            ctx.fillRect(-30, -15, 60, 30);
            ctx.fillStyle = 'yellow'; // Headlights
            ctx.fillRect(20, -10, 10, 5);
            ctx.fillRect(20, 5, 10, 5);
        }

        ctx.restore();
    }
}
