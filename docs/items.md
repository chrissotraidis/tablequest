# Items & Pickups

This document describes the collectible items in the game.

## Objectives

### Tables (`T`)
The primary collectible objective in each level.

| Property | Value |
|:---|:---|
| Character | `T` |
| Sprite | `table` |
| **Required per level** | **3** |
| Effect | Increments `player.tables` |

**Progression**: Collecting all 3 tables unlocks the elevator gate (`X`) allowing level completion.

## Resources

### Ammo (`A`)
Replenishes player ammunition.

| Property | Value |
|:---|:---|
| Character | `A` |
| Sprite | `ammo` (paint bucket) |
| **Amount Given** | **+10 ammo** |

### Health (`H`)
Restores player health.

| Property | Value |
|:---|:---|
| Character | `H` |
| Sprite | `health` (gold bottle) |
| **Amount Given** | **+25 HP** (capped at 100) |

## Implementation

Items are stored in the `gameObjects` array with type properties:
```javascript
{ x, y, type: 'table'|'ammo'|'health', active: true }
```

Collection occurs when player distance < 0.5 units:
```javascript
if (dist < 0.5 && obj.active) {
    obj.active = false;
    // Apply effect...
    playSound('collect');
}
```

## Sprite Generation

Item sprites are defined in `src/assets/sprites.js`:
- **Table**: Brown wooden desk with legs
- **Ammo**: Gray bucket with blue paint
- **Health**: Gold bottle with red cross

