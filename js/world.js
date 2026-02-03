class World {
    constructor(game) {
        this.game = game;
        this.tileSize = 256; // High res tiles
        this.mapSize = 100; // 100x100 tiles
        this.objects = [];

        // Map bounds in pixels
        this.width = this.tileSize * this.mapSize;
        this.height = this.tileSize * this.mapSize;
    }

    generate() {
        console.log("Generating world...");

        // Set car start position to center of world
        const cx = this.width / 2;
        const cy = this.height / 2;
        this.game.car.x = cx;
        this.game.car.y = cy;

        // 1. Setup Infinite Road
        this.roadWidth = 400; // Wider main highway
        this.roadX = cx - this.roadWidth / 2; // Fixed X position for vertical road
        this.roads = []; // Not used for rendering infinite road, but kept for compatibility logic if needed

        // 2. Place Objects (Initial Pool)
        // We initialize objects around the start area (-3000 to +3000 vertical range)
        const count = 200; // Smaller active pool, we recycle them
        this.objectSpawnRange = 3000; // Distance ahead/behind to spawn

        // Clear existing objects
        this.objects = [];

        // Generate initial objects
        for (let i = 0; i < count; i++) {
            this.spawnObject(cx, cy, this.objectSpawnRange, true);
        }
    }

    spawnObject(refX, refY, range, initial = false) {
        // Random position within range of reference Y
        const yOffset = (Math.random() - 0.5) * 2 * range;
        const x = (Math.random() - 0.5) * this.width * 2 + refX; // Wide X spread
        const y = refY + yOffset;

        // Skip if too close to road (Horizontal clearance)
        if (x > this.roadX - 100 && x < this.roadX + this.roadWidth + 100) return;

        // Skip safe start zone
        if (initial) {
            const dx = x - refX;
            const dy = y - refY;
            if (dx * dx + dy * dy < 300 * 300) return;
        }

        const rand = Math.random();
        let type = 'tree';
        let scale = 0.3 + Math.random() * 0.3;
        let radius = 30 * scale;

        if (rand > 0.7) {
            type = 'stone';
            scale = 0.3 + Math.random() * 0.3;
            radius = 35 * scale;
        } else if (rand > 0.95) {
            type = 'house';
            scale = 0.6 + Math.random() * 0.4;
            radius = 100 * scale;
        }

        // Check for overlaps with existing objects
        for (const obj of this.objects) {
            const dx = obj.x - x;
            const dy = obj.y - y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < obj.radius + radius) {
                // Allow tree on stone exception if needed, strictly avoid for now
                if (type === 'tree' && obj.type === 'stone') continue;
                return; // Overlap
            }
        }

        this.objects.push({
            x: x,
            y: y,
            type: type,
            angle: type === 'house' ? 0 : Math.random() * Math.PI * 2,
            scale: scale,
            radius: radius
        });
    }

    update(carY) {
        // Recycle objects that are too far behind or ahead
        const viewBuffer = 4000; // Keep objects within this range of carY

        for (let i = 0; i < this.objects.length; i++) {
            const obj = this.objects[i];
            const dy = obj.y - carY;

            if (Math.abs(dy) > viewBuffer) {
                // Object is too far, move it to the other side

                // If car is moving "up" (decreasing Y), objects below (pos Y) fall out of view.
                // We move them to top (neg Y relative to car).
                const sign = dy > 0 ? -1 : 1;

                // New Y: Ahead of car in direction of movement logic
                obj.y = carY + sign * (viewBuffer - 100 + Math.random() * 500);

                // Randomize X again
                obj.x = this.roadX + (Math.random() - 0.5) * 5000;

                // Ensure it doesn't land on road
                if (obj.x > this.roadX - 100 && obj.x < this.roadX + this.roadWidth + 100) {
                    obj.x += 600; // Push away from road
                }
            }
        }
    }

    draw(ctx, camX, camY) {
        // 1. Draw Ground (Tiled)
        // Optimization: Only draw tiles visible on screen
        const startCol = Math.floor((camX - this.game.width / 2) / this.tileSize);
        const endCol = startCol + Math.ceil(this.game.width / this.tileSize) + 1;
        const startRow = Math.floor((camY - this.game.height / 2) / this.tileSize);
        const endRow = startRow + Math.ceil(this.game.height / this.tileSize) + 1;

        const ground = this.game.assets.ground;

        if (ground) {
            for (let c = startCol; c <= endCol; c++) {
                for (let r = startRow; r <= endRow; r++) {
                    ctx.drawImage(ground, c * this.tileSize, r * this.tileSize, this.tileSize, this.tileSize);
                }
            }
        }

        // 1.5 Draw Infinite Road
        const roadImg = this.game.assets.road;
        if (roadImg && this.roadWidth) {
            // Draw road strip that covers visible view
            // We want road to go from visible Top to visible Bottom
            const viewT = camY - this.game.height / 2;
            const viewB = camY + this.game.height / 2;

            const rStartRow = Math.floor(viewT / 256);
            const rEndRow = Math.floor(viewB / 256) + 1;

            // Road X is fixed
            const rX = this.roadX;
            const rW = this.roadWidth;

            // Tile vertical road segments
            ctx.save();
            ctx.beginPath();
            ctx.rect(rX, viewT - 100, rW, (viewB - viewT) + 200); // Clip area
            ctx.clip();

            // Draw enough tiles to cover height
            const cStart = Math.floor(rX / 256);
            const cEnd = Math.floor((rX + rW) / 256) + 1;

            for (let r = rStartRow - 1; r <= rEndRow; r++) {
                for (let c = cStart; c < cEnd; c++) {
                    ctx.drawImage(roadImg, c * 256, r * 256, 256, 256);
                }
            }
            ctx.restore();

            // Borders
            ctx.strokeStyle = '#555';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(rX, viewT);
            ctx.lineTo(rX, viewB);
            ctx.moveTo(rX + rW, viewT);
            ctx.lineTo(rX + rW, viewB);
            ctx.stroke();
        }

        // 2. Draw Objects
        // Optimization: Only draw objects near the camera
        const viewL = camX - this.game.width / 2 - 200;
        const viewR = camX + this.game.width / 2 + 200;
        const viewT = camY - this.game.height / 2 - 200;
        const viewB = camY + this.game.height / 2 + 200;

        this.objects.forEach(obj => {
            if (obj.x > viewL && obj.x < viewR && obj.y > viewT && obj.y < viewB) {
                const img = this.game.assets[obj.type];
                if (img) {
                    ctx.save();
                    ctx.translate(obj.x, obj.y);
                    if (obj.type !== 'house') ctx.rotate(obj.angle);

                    const w = img.width * obj.scale;
                    const h = img.height * obj.scale;
                    ctx.drawImage(img, -w / 2, -h / 2, w, h);
                    ctx.restore();
                }
            }
        });
    }
}
