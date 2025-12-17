# Asset Generation (`src/assets/`)

To keep the game contained within a single HTML file without requiring external HTTP requests for images, all graphics are generated procedurally using the HTML5 Canvas API at runtime.

## Textures (`src/assets/textures.js`)
Wall textures are created by drawing onto an off-screen canvas and storing the result as a pattern or image.
- **Noise Generation**: Many textures ('floor', 'ceil') use per-pixel randomization to create grit/texture.
- **Bricks**: Draws a grid of rectangles with bevel shading (highlight top-left, shadow bottom-right) to simulate depth.
- **Resolution**: Most textures are generated at 128x128 pixels.

## Sprites (`src/assets/sprites.js`)
Sprites (enemies, items, objects) are also drawn to temporary canvases.
- **`createSprite(name, drawFn)`**: A helper function that sets up a 64x64 canvas, executes `drawFn` to paint the sprite, and saves it.
- **Enemies**: Drawn using simple geometric shapes (rectangles for suits, circles for heads). Colors are parameterized to create variants (Blue suit, Grey suit, etc.).
- **HUD Faces**: Complex drawing paths (arcs, lines) are used to create the player's face (Sandy) with different expressions (Happy, Ouch).

## Performance Note
Generating assets at startup takes a small amount of time but allows for infinite variation and zero download size for assets.
