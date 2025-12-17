# Player & Combat

This document describes the player mechanics and combat system.

## Player Stats

| Stat | Default | Description |
|:---|:---:|:---|
| Health | 100 | Reduced by enemy projectiles |
| Ammo | 20 | Consumed when firing ranged weapons |
| Tables | 0 | Collected objectives per level |
| Score | 0 | Points earned from kills and pickups |
| Speed | 0.06 | Movement speed |
| Rotation Speed | 0.012 | Turning speed |
| Weapons | ['paintbrush'] | Unlocked weapons inventory |
| Current Weapon | 0 | Index of equipped weapon |

## Controls

| Key | Action |
|:---|:---|
| W / ↑ | Move forward |
| S / ↓ | Move backward |
| A / ← | Rotate left |
| D / → | Rotate right |
| E | Open door / interact |
| Space | Attack (fire/swing) |
| 1, 2, 3 | Switch weapons |
| Escape | Pause / Menu |

## Weapons

### Paintbrush (Ranged)
- **Type**: Ranged projectile
- **Damage**: 15 per hit
- **Ammo Cost**: 1 per shot
- **Cooldown**: 15 frames
- **Projectile**: Rainbow HSL colors
- **Found**: Starting weapon

### Table Leg (Melee)
- **Type**: Melee swing
- **Damage**: 40 per hit
- **Ammo Cost**: None (free swings!)
- **Cooldown**: 30 frames
- **Range**: 1.5 units
- **Arc**: 90° in front of player
- **Found**: Level 2 pickup

## Combat

### Melee Attack
Melee weapons check for enemies in a cone in front of the player:
- Hits all enemies within range and arc
- No ammo cost
- Bigger swing animation with motion blur

### Ranged Attack
Ranged weapons spawn projectiles that travel forward:
- Projectile color based on weapon
- Collides with walls and enemies
- Consumes ammo

### Taking Damage
- Enemy projectile damage: 3 HP per hit
- Screen flashes red on hit
- Game over when health ≤ 0

## HUD Elements

| Element | Location | Color | Shows |
|:---|:---|:---|:---|
| Health | Left | Red | Health percentage |
| Ammo | Left | Blue | Ammo count |
| Face | Center | - | Expression (happy/ouch) |
| Weapon | Center | Gold | Slot + current weapon |
| Score | Right | Gold | Points earned |
| Tables | Right | Green | Collection count |
| Floor | Right | Yellow | Current level |
