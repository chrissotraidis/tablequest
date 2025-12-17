# 🎮 SANDY'S TABLE QUEST

<p align="center">
  <strong>A retro-style first-person shooter that runs entirely in your browser</strong>
</p>

<p align="center">
  <em>"In the year 199X, Sandy's masterpieces were stolen by the Interior Design Cartel..."</em>
</p>

---

## 📖 About the Game

**Sandy's Table Quest** is a browser-based FPS inspired by classic games like *Wolfenstein 3D*. You play as Sandy, an eccentric artisan furniture maker, fighting through four floors of the Interior Design Cartel's headquarters to reclaim your stolen masterpiece tables.

### ✨ Features

- **Retro Raycasting Engine** — Classic pseudo-3D rendering at 320x200 resolution
- **Procedural Audio** — All sounds synthesized in real-time using Web Audio API (no audio files!)
- **4 Unique Levels** — Fight through the cartel's headquarters to the final boss
- **Enemy Variety** — Face Guards, Managers, Executives, and the dreaded Head Designer
- **Single-File Distribution** — The entire game compiles to a single HTML file

---

## 🕹️ How to Play

### Goal
Collect all the **Tables** on each floor to unlock the elevator and advance to the next level. Reach Level 4 and defeat the **Head Designer** to win!

### Controls

| Key | Action |
|:---:|:---|
| `W` / `↑` | Move forward |
| `S` / `↓` | Move backward |
| `A` / `←` | Rotate left |
| `D` / `→` | Rotate right |
| `Space` | Fire weapon (paintbrush) |
| `E` | Open doors / interact |
| `Esc` | Pause / Menu |

### Items

| Item | Description |
|:---|:---|
| 🪑 **Tables** | Your stolen masterpieces — collect them all! |
| 🩹 **First-Aid Wood Polish** | Restores +25 HP (max 100) |
| 🎨 **Blue Paint Bucket** | Replenishes +10 ammo |

### Enemies

| Enemy | Difficulty | Description |
|:---|:---:|:---|
| **Guard** | Easy | Blue suit, slow but numerous |
| **Manager** | Medium | Gray suit with glasses, balanced stats |
| **Executive** | Hard | Black suit and hat, fast and dangerous |
| **Head Designer** | BOSS | The final boss on Level 4 |

---

## 🛠️ Installation

There are two ways to play the game:

### Option 1: Play Immediately (Pre-built)

If you just want to play the game:

1. **Download the repository** (click the green "Code" button → "Download ZIP" on GitHub, or clone it)
2. **Open the game file** — Navigate to the `dist/` folder and open `tablequest.html` in your web browser
3. **Play!** — Click anywhere on the screen to start

That's it! The game runs entirely in your browser with no installation required.

---

### Option 2: Build from Source

If you want to modify the code or rebuild the game:

#### Prerequisites
- **Node.js** (v14 or higher) — [Download here](https://nodejs.org/)

#### Steps

1. **Download or clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/tablequest.git
   cd tablequest
   ```
   
   Or download and extract the ZIP file, then open a terminal in that folder.

2. **Build the game**
   ```bash
   node build.js
   ```
   
   You should see:
   ```
   Building Sandy's Table Quest...
     Adding config.js
     Adding engine/audio.js
     ...
   Build complete! Output: dist/tablequest.html
   ```

3. **Open the game**
   
   Open `dist/tablequest.html` in any modern web browser (Chrome, Firefox, Safari, Edge).

#### Optional: Local Development Server

For a better development experience, you can run a local server:

```bash
# Using Python 3
python -m http.server 8000 --directory dist

# Or using npx (requires Node.js)
npx serve dist
```

Then visit `http://localhost:8000/tablequest.html` in your browser.

---

## 📁 Project Structure

```
tablequest/
├── README.md           # This file
├── build.js            # Build script that bundles the game
├── dist/               # Compiled output
│   └── tablequest.html # The playable game (single file!)
├── docs/               # Technical documentation
│   ├── README.md       # Documentation index
│   ├── architecture.md # Project structure & build system
│   ├── audio.md        # Web Audio API synthesizer
│   ├── enemies.md      # Enemy types & AI system
│   ├── gameplay_logic.md # Game loop & state management
│   ├── graphics.md     # Raycasting renderer
│   ├── items.md        # Collectibles & pickups
│   ├── level_design.md # ASCII map format & design rules
│   ├── player.md       # Player mechanics & combat
│   └── ...
├── src/                # Source code
│   ├── main.js         # Entry point & game loop
│   ├── config.js       # Global constants
│   ├── index.html      # HTML template
│   ├── assets/         # Procedural texture/sprite generation
│   │   ├── sprites.js
│   │   ├── textures.js
│   │   └── image_data.js
│   ├── engine/         # Core engine systems
│   │   ├── renderer.js # Raycasting & sprite rendering
│   │   ├── audio.js    # Synthesizer & sequencer
│   │   └── input.js    # Keyboard handling
│   └── game/           # Game logic
│       ├── state.js    # Entity management & physics
│       └── levels.js   # Level data (ASCII maps)
└── tools/              # Development utilities
```

---

## 🔧 Build System

The game uses a custom build script (`build.js`) that:

1. Reads the HTML template (`src/index.html`)
2. Concatenates all JavaScript files in dependency order
3. Injects the combined script into the HTML
4. Outputs a single `dist/tablequest.html` file

This allows modular development while shipping a zero-dependency, single-file game.

### Build Order

The JavaScript files are concatenated in this specific order to satisfy dependencies:

```
config.js → audio.js → image_data.js → textures.js → sprites.js → 
input.js → levels.js → state.js → renderer.js → main.js
```

---

## 📜 Story

Sandy is a legendary furniture artist whose masterpiece tables are known throughout the land. One fateful day, the **Interior Design Cartel** — a shadowy syndicate of rival decorators — stole her creations.

Now Sandy must infiltrate their corporate headquarters, an office tower of increasingly absurd interior design departments, armed only with a paint-flinging brush and a burning desire for justice.

**Fight through:**
- 📋 Level 1-2: Corporate offices filled with guards
- 🏢 Level 3: The executive floor with tougher opposition
- 👔 Level 4: The Head Designer's private suite (BOSS FIGHT!)

---

## 🎨 Technical Highlights

### Raycasting Engine
The game uses the classic DDA (Digital Differential Analyzer) raycasting algorithm to render pseudo-3D graphics on a 2D HTML Canvas. Each frame, rays are cast from the player's position to determine wall distances, heights, and texture coordinates.

### Procedural Audio
All game audio is synthesized in real-time using the Web Audio API:
- **Synthesizer**: Sawtooth, square, and sine oscillators with ADSR envelopes
- **Reverb**: Procedurally generated impulse response
- **Music**: JSON-based sequencer with look-ahead scheduling

### No External Assets
Both graphics and audio are generated procedurally, making the game completely self-contained in a single HTML file.

---

## 📚 Documentation

For detailed technical documentation, see the [docs/](docs/) folder:

- [Architecture & Build System](docs/architecture.md)
- [Graphics & Rendering](docs/graphics.md)
- [Audio System](docs/audio.md)
- [Game Logic & State](docs/gameplay_logic.md)
- [Level Design](docs/level_design.md)
- [Enemy System](docs/enemies.md)
- [Items & Pickups](docs/items.md)
- [Player & Combat](docs/player.md)

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Build and test the game (`node build.js`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## 🙏 Credits

- **Concept & Development**: Custom retro FPS about furniture
- **Engine**: Custom Raycasting Engine in vanilla JavaScript/Canvas
- **Audio**: Procedural synthesis using Web Audio API
- **Inspiration**: *Wolfenstein 3D*, *DOOM*, and the golden age of 90s shooters

---

<p align="center">
  <strong>Happy furniture hunting! 🪑</strong>
</p>
