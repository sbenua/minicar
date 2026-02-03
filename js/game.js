class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        this.assets = {};
        this.assetsLoaded = 0;
        this.totalAssets = 6;

        this.input = new Input();
        this.world = new World(this);
        this.car = new Car(this);
        this.effects = new Effects(this);

        this.lastTime = 0;

        this.init();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.loadAssets();
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    loadAssets() {
        const assetNames = ['car', 'tree', 'house', 'stone', 'road', 'ground'];

        assetNames.forEach(name => {
            const img = new Image();
            img.src = `assets/${name}.png`;
            img.onload = () => {
                this.assets[name] = img;
                this.assetsLoaded++;
                if (this.assetsLoaded === this.totalAssets) {
                    this.start();
                }
            };
            img.onerror = () => {
                console.error(`Failed to load asset: ${name}`);
            };
        });
    }

    start() {
        console.log("Game Started!");
        this.world.generate();
        requestAnimationFrame((ts) => this.loop(ts));
    }

    loop(timestamp) {
        const dt = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        this.update(dt);
        this.draw();

        requestAnimationFrame((ts) => this.loop(ts));
    }

    update(dt) {
        this.car.update(dt);
        this.world.update(this.car.y); // Update infinite world generation
        this.effects.update(dt);
        // Camera follow logic can be here or in drawing
    }

    draw() {
        // Clear screen
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.ctx.save();

        // Camera Translation: Center on Car
        const camX = -this.car.x + this.width / 2;
        const camY = -this.car.y + this.height / 2;

        this.ctx.translate(camX, camY);

        // Draw World
        this.world.draw(this.ctx, this.car.x, this.car.y);

        // Draw Effects (below car? or above?)
        this.effects.draw(this.ctx);

        // Draw Car
        this.car.draw(this.ctx);

        this.ctx.restore();

        // Draw UI / HUD if needed
        this.updateHUD();
    }

    updateHUD() {
        const speedEl = document.getElementById('speedometer');
        if (speedEl) {
            // Convert pixels/sec to arbitrary km/h
            // 800 roughly -> 200 km/h
            const kmh = Math.abs(Math.round(this.car.speed / 4));
            speedEl.innerText = `${kmh} km/h`;
        }
    }
}

// Start game when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});
