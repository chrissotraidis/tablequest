# Architecture & Build System

## Project Structure
The project is structured to keep concerns separated during development, while allowing for a single-file distribution.

- **`src/`**: Source code directory.
    - **`main.js`**: The entry point. Initializes the game and contains the main loop.
    - **`assets/`**: Contains procedural generation logic for textures and sprites (`sprites.js`, `textures.js`).
    - **`engine/`**: Core engine systems (`renderer.js`, `audio.js`, `input.js`).
    - **`game/`**: High-level game logic (`state.js`, `levels.js`).
    - **`config.js`**: Global constants.
    - **`index.html`**: The HTML template.

- **`build.js`**: A Node.js script that compiles the project.
- **`dist/`**: The output directory.

## Build Process (`build.js`)
Since this is a vanilla JavaScript project without a bundler like Webpack, we use a custom script `build.js` to combine files.

1.  **Read Template**: Reads `src/index.html`.
2.  **Concatenate JS**: Reads specific JavaScript files in a defined order (critical for dependencies).
    - *Order*: `config.js` -> `audio.js` -> `image_data.js` -> `textures.js` -> `sprites.js` -> `input.js` -> `levels.js` -> `state.js` -> `renderer.js` -> `main.js`.
3.  **Injection**: Replaces the placeholder `// %%SCRIPTS%%` in the HTML with the concatenated JavaScript.
4.  **Output**: Writes the result to `dist/tablequest.html`.

This allows us to develop using modules/files but ship a standalone HTML file.
