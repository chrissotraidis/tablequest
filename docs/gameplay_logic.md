# Game Logic & State (`src/game/state.js`)

This module handles the simulation of the game world.

## Game Loop
The `gameLoop` function in `main.js` calls `update(dt)` in `state.js`.
- **`dt`**: Delta time (time elapsed since last frame).

## Key Functions

### `update(dt)`
The core heartbeat of the game.
1.  **Input Processing**: converting key presses into rotation or movement.
2.  **Movement Physics**: collision detection against the `worldMap`.
3.  **Entity Updates**: Iterates through `gameObjects` to update enemies, projectiles, and items.
4.  **Game Events**: Checks for win/loss conditions (e.g., player health <= 0).

### `loadLevel(lvlIdx)`
Parses the ASCII-based level layout from `levels.js`.
- Converts characters (e.g., '#', '.', 'S', 'D') into numerical map data and entity objects.
- Resets player position and required collectibles (tables).

### `fireWeapon()`
Handles shooting mechanics.
- Checks ammo/cooldown.
- Spawns a projectile object.
- Updates HUD.

## Data Structures
- **`worldMap`**: A flat `Int8Array` representing the grid. `index = y * width + x`.
- **`gameObjects`**: Array of active entities (sprites).
    - `{ type, x, y, active, [health], [state], ... }`

## Enemy AI
Enemies use a state machine with type-specific behaviors. See [enemies.md](enemies.md) for full details.

| State | Description |
|:---|:---|
| **idle** | Patrol with random micro-movements |
| **alert** | Brief pause when spotting player |
| **chase** | Move toward player with wall collision |
| **pain** | Stunned briefly after being hit |
| **dead** | Inactive, rendering dead sprite |

**Type Variants**: Guard (slow), Manager (medium), Executive (fast/dangerous)
