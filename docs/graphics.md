# Graphics & Rendering (`src/engine/renderer.js`)

The engine uses a Raycasting algorithm (similar to Wolfenstein 3D) to render a pseudo-3D world on a 2D HTML Canvas.

## The Raycasting Loop (`drawGame`)
For every vertical strip (column) of the screen (`SCREEN_WIDTH`):
1.  **Cast a Ray**: Calculate a vector from the player's position based on viewing angle.
2.  **DDA Algorithm**: Step the ray through the grid until it hits a wall (`worldMap` > 0).
3.  **Distance Calculation**: Calculate the perpendicular distance to prevent "fish-eye" effect.
4.  **Wall Slice**: Determine the height of the wall strip on screen (`h = constant / distance`).
5.  **Texture Mapping**: Calculate which part of the texture (0-127) to draw based on where the ray hit the wall.

## Sprite Rendering (`drawSprites`)
Sprites are billboarded (always face the player).
1.  **Sort**: Sprites are sorted from furthest to nearest (Painter's Algorithm).
2.  **Projection**: World coordinates are transformed into screen coordinates.
3.  **Z-Buffer Check**: Before drawing a vertical strip of a sprite, we check against the `rays[]` distance buffer to ensure walls properly obscure sprites.

## Canvas Resolution
- **Internal Resolution**: 320x200 (Retro feel).
- **Display Resolution**: Scaled up by CSS to 640x480 (or viewport size).
- *Note*: Ensure `canvas.width` and `canvas.height` match the internal resolution to avoid coordinate mismatch.

## HUD & UI
- **2D Overlay**: The HUD is mostly HTML/CSS (`#hud` div).
- **Weapon**: Drawn directly on the canvas using `ctx` paths and gradients.
- **Menu**: An HTML overlay (`#hd-menu`) that interacts with the canvas via standard DOM events.
