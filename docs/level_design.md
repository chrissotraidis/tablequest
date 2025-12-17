# Level Design (`src/game/levels.js`)

Levels are defined as 2D arrays of strings, creating a visual ASCII representation of the map.

## MANDATORY DESIGN RULES

> **CRITICAL**: All levels MUST follow these rules or the game will be unplayable.

### 1. Connectivity
- **Every door (`+`) MUST lead to an accessible area** - never place a door against a solid wall
- **The player must be able to reach ALL tables** - verify paths exist from start to each table
- **The exit area must be reachable** - clear path from start to elevator gate

### 2. Progression System
- **Levels 1-2 require 3 tables (`T`)** to unlock the elevator gate
- **Level 3 requires 4 tables (`T`)** to unlock the elevator gate (final collection level)
- **Level 4 (Boss Level) requires 0 tables** - defeat the boss (`G`) to win
- **The elevator gate (`X`)** blocks access to the elevator until all tables are collected
- **The elevator (`E`)** transports the player to the next level when entered

### 3. Content Requirements
- **Health pickups (`H`)** - at least 3-4 per level, distributed throughout
- **Ammo pickups (`A`)** - at least 3-4 per level, near combat areas
- **Enemies (`D`)** - 5-10 per level, guarding tables and key areas
- **Boss enemy (`G`)** - only on Level 4, single powerful enemy
- **Safe start** - the spawn area should not have enemies immediately adjacent

### 4. Layout Quality
- **Varied textures** - use different wall types (O, W, M, C) for visual interest
- **Clear navigation** - player should understand where to explore
- **Interesting spaces** - mix of corridors, rooms, and open areas

## Map Characters

| Char | Type | Wall ID | Description |
|:---:|:---|:---:|:---|
| `.` | Empty | 0 | Walkable floor |
| `#` | Brick | 1 | Standard brick wall |
| `W` | Wood | 2 | Wooden panels |
| `+` | Door | 3 | Openable door |
| `X` | Gate | 4 | Locked until tables collected |
| `B` | Stone | 5 | Dungeon stone blocks |
| `C` | Concrete | 6 | Industrial concrete |
| `O` | Office | 7 | Office panel wall |
| `M` | Metal | 8 | Metal wall with rivets |
| `E` | Elevator | 9 | Level exit |
| `S` | Start | - | Player spawn point |
| `T` | Table | - | Collectible objective |
| `D` | Designer | - | Enemy entity |
| `G` | Boss | - | Boss enemy (Level 4 only) |
| `A` | Ammo | - | Ammo pickup |
| `H` | Health | - | Health pickup |
| `L` | Weapon | - | Table Leg weapon pickup |

## Level Checklist

Before finalizing a level, verify:
- [ ] Player can walk from `S` to every `T`
- [ ] Player can walk from `S` to `X` (gate) and `E` (elevator)
- [ ] Every `+` has walkable space on BOTH sides
- [ ] Correct number of `T` tiles (3 for L1-2, 4 for L3, 0 for L4)
- [ ] At least 1 `X` and 1 `E` tile exist
- [ ] Mix of `A`, `H`, and `D` tiles throughout
- [ ] Boss level has exactly 1 `G` tile

