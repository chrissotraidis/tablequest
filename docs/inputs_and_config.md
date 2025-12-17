# Input & Configuration

## Input Handling (`src/engine/input.js`)
The game uses a keyboard-based input system. Event listeners (`keydown`, `keyup`) update a global `input` state object.

### Controls
| Action | Primary Key | Secondary Key |
| :--- | :--- | :--- |
| **Move Forward** | `W` | `Up Arrow` |
| **Move Backward** | `S` | `Down Arrow` |
| **Turn Left** | `A` | `Left Arrow` |
| **Turn Right** | `D` | `Right Arrow` |
| **Interact / Open**| `E` | - |
| **Shoot / Select** | `Space` | `Enter` |

### Menu Navigation
- **Up/Down**: Navigate options.
- **Enter/Space**: Select option.

## Configuration (`src/config.js`)
Global constants that act as a single source of truth for game tuning.

### Key Constants
- **`SCREEN_WIDTH` / `SCREEN_HEIGHT`**: 320x200. Sets the internal rendering buffer size.
- **`FOV`**: Field of view, set to `Math.PI / 3` (60 degrees).
- **`BLOCK_SIZE`**: 64. The unit size of a wall block in the Raycasting world.
- **`MAX_DEPTH`**: 50. The maximum distance (in blocks) the raycaster will search before giving up (fog limit).
- **`TICK_RATE`**: 30. Target physics updates per second.
