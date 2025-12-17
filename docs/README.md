# Technical Documentation

This folder contains detailed technical documentation for developers who want to understand or modify the game engine and logic. 

> For general information, installation, and gameplay instructions, see the main [README](../README.md) in the repository root.

## Table of Contents

### Core Systems
1. [Architecture & Build System](architecture.md) — Project structure and build script
2. [Game Logic & State](gameplay_logic.md) — Game loop, state management, entity updates
3. [Graphics & Rendering](graphics.md) — Raycasting engine, sprite rendering, UI
4. [Audio System](audio.md) — Web Audio API synthesizer and music sequencer
5. [Input & Configuration](inputs_and_config.md) — User input handling, config settings

### Content & Assets
6. [Asset Generation](asset_generation.md) — Procedural textures and sprites
7. [Level Design](level_design.md) — ASCII map editor, entity placement, design rules
8. [Enemy System](enemies.md) — Enemy types, AI behavior, stats
9. [Items & Pickups](items.md) — Collectibles, tables, ammo, health

### Gameplay
10. [Player & Combat](player.md) — Player stats, movement, weapons

---

## Quick Reference

**Build the game:**
```bash
node build.js
```

**Output:** `dist/tablequest.html`
