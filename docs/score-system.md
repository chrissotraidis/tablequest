# Score System

This document describes the Wolfenstein-style point system.

## Player Score

Players earn points for combat, collecting tables, and bonus pickups. Score is displayed on the HUD in gold text.

| Stat | Property | Reset On |
|:---|:---|:---|
| Score | `player.score` | New game start |

## Point Values

### Enemy Kills

| Enemy Type | Points |
|:---|---:|
| Guard (Type 0) | 100 |
| Manager (Type 1) | 200 |
| Executive (Type 2) | 400 |
| Head Designer (Boss) | 5,000 |

### Collectibles

| Item | Points |
|:---|---:|
| Table | 500 |
| Table Money (`$`) | 100 |
| Gold Bar (`Z`) | 250 |

### Bonuses

| Event | Points |
|:---|---:|
| Level Completion | 1,000 |

## Implementation

Score constants are defined in `src/game/state.js`:
```javascript
const SCORE_VALUES = {
    enemy: { 0: 100, 1: 200, 2: 400, 'boss': 5000 },
    table: 500,
    money: 100,
    levelBonus: 1000
};
```

Score is awarded at:
- Enemy death (melee or ranged kill)
- Table collection
- Money pickup
- Elevator use (level completion)

## HUD Display

The score is shown in the right panel of the HUD with gold styling, formatted with locale-specific thousands separators.

## Technical Constraints & Implementation Notes

> [!WARNING]
> **Build Script Sensitivity to Special Characters**
>
> During implementation, the use of `$` in code (e.g., checking for the money symbol `char === '$'`) triggered a bug in the build script's regex replacement logic.
>
> - **Issue:** `String.replace` interprets `$` patterns (like `$'`) specially.
> - **Fix:** `build.js` was updated to use a callback function for replacement.
> - **Reference:** See `docs/decision-build-script-injection.md` for full details.

