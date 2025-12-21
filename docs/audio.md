# Audio System (`src/engine/audio.js`)

The game uses the **Web Audio API** for all sound generation. There are no external mp3/wav files; everything is synthesized in real-time.

## Components

### 1. `initAudio()`
Initializes `AudioContext` and creates the Master gain node and Reverb bus.
- **Reverb**: generated procedurally using an impulse response buffer (`generateReverbImpulse`).

### 2. Synthesizer (`playNote`)
A versatile synth function that creates:
- 2 Oscillators (Sawtooth, Square, Sine, etc.)
- 1 Biquad Filter (Lowpass/Highpass)
- 1 Gain Envelope (Attack, Decay, Sustain, Release - ADSR)

### 3. Sequencer (`startSequencer`, `scheduler`)
A look-ahead scheduler that queues audio events to ensure precise timing despite JavaScript's main thread jitter.
- **Songs**: Defined as JSON objects containing tracks and note arrays.
- **Tracks**: assigned an Instrument (e.g., 'BASS', 'LEAD').

### 4. Sound Effects (`playSound`)
Procedural SFX for game actions:

| Sound | Description |
|:---|:---|
| `shoot` | Frequency sweep (Sawtooth) |
| `hit` | Impact sound when damaged |
| `step` | Short noise burst for footsteps |
| 'collect' | Happy Chime | Item pickup (Table, Ammo, Weapon) |
| 'munch' | Crunching Sound | Health pickup (Fritos bag) |
| 'money' | Cha-ching / Coin | Money/Gold pickup |
| `door_open` | Heavy door creaking/sliding |
| `enemy_death` | Satisfying defeat sound |
| `elevator` | Mechanical ascending with ding |
| `boss_roar` | Intimidating low growl |
| `fanfare` | Victory celebration arpeggio |

## Usage
Browser policy requires user interaction before audio starts. The audio is initialized during the boot sequence:
1. **Memory Screen** - User presses any key (no music)
2. **Title Screen** - `initAudio()` and `startMenuMusic()` are called, music begins
3. **Main Menu** - Music continues playing

