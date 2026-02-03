# Troubleshooting Log

## Issue: Blank Screen & Assets Not Loading
**Date:** 2026-02-03
**Severity:** Critical

### Symptoms
- Game loaded but showed a blank/dark grey screen.
- Mobile UI controls were visible but the car and world were missing.
- No "Failed to load asset" errors in the console.
- Global `window.game` object was undefined.

### Root Cause Analysis
Investigated the initialization flow in `js/game.js`:
```javascript
this.world = new World(this); // (1) World created first
this.car = new Car(this);     // (2) Car created second
```

Inside `js/world.js` constructor:
```javascript
constructor(game) {
    this.game = game;
    // ...
    // ERROR: this.game.car is undefined at this point!
    this.game.car.x = this.width / 2; 
    this.game.car.y = this.height / 2;
}
```
The `World` constructor attempted to access `this.game.car` to set the starting position, but `Car` had not been instantiated yet. This caused a javascript error that halted execution before `window.game` could be assigned, effectively crashing the game silently before main initialization.

### Resolution
Moved the car positioning logic out of the `World` constructor and into the `generate()` method, which is called explicitly after all objects are instantiated.

**Fix in `js/world.js`:**
```javascript
// Removed from constructor
// Added to generate()
generate() {
    console.log("Generating world...");
    
    // Set car start position to center of world
    this.game.car.x = this.width / 2;
    this.game.car.y = this.height / 2;
    
    // ... rest of generation logic
}
```

### Verification
- Reloaded page.
- Confirmed `game` object exists.
- Confirmed assets (Car, Tree, House, etc.) load correctly.
- Gameplay functionality restored.

## Issue: Game Crash (Infinite loop / Black Screen)
**Date:** 2026-02-03
**Severity:** Critical

### Symptoms
- Game starts but immediately halts or shows a black screen.
- Console error: `TypeError: this.world.update is not a function`.

### Root Cause Analysis
The `js/game.js` main loop was updated to call `this.world.update()` to handle infinite world rendering, but the `World` class in `js/world.js` had not yet been updated to include this method. This mismatch caused the game loop to crash on the first frame.

### Resolution
Implemented the proper `update(carY)` method in `js/world.js` to handle object recycling and confirmed the `generate` method sets up the necessary road properties (`roadX`, `roadWidth`).

**Fix in `js/world.js`:**
Added `update` method:
```javascript
update(carY) {
    const viewBuffer = 4000;
    // Logic to recycle objects from behind to ahead of the car
    // ...
}
```
