/**
 * AUDIO SYSTEM V2.0 (High Fidelity)
 * Features: Subtractive Synthesis, Convolution Reverb, Multi-track Sequencing
 */
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;
let masterGain;
let reverbNode;

// --- DSP & SYNTHESIS ---

let compressorNode;
let delayNode;
let delayFeedback;
let delayGain;

function initAudio() {
    if (audioCtx) return;
    audioCtx = new AudioContext();

    // Master Bus (Compressor -> Destination)
    compressorNode = audioCtx.createDynamicsCompressor();
    compressorNode.threshold.value = -10;
    compressorNode.knee.value = 40;
    compressorNode.ratio.value = 12;
    compressorNode.attack.value = 0;
    compressorNode.release.value = 0.25;
    compressorNode.connect(audioCtx.destination);

    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.6;
    masterGain.connect(compressorNode);

    // Reverb Bus (Convolution -> Master)
    reverbNode = audioCtx.createConvolver();
    generateReverbImpulse(3.0); // 3 seconds tail for vast spaces

    const reverbGain = audioCtx.createGain();
    reverbGain.gain.value = 0.3; // Wet mix
    reverbNode.connect(reverbGain);
    reverbGain.connect(masterGain);

    // Delay Bus (Feedback Delay -> Master)
    delayNode = audioCtx.createDelay();
    delayNode.delayTime.value = 0.3; // ~300ms echo

    delayFeedback = audioCtx.createGain();
    delayFeedback.gain.value = 0.4; // 40% feedback

    delayGain = audioCtx.createGain();
    delayGain.gain.value = 0.3; // Wet mix

    delayNode.connect(delayFeedback);
    delayFeedback.connect(delayNode); // Feedback loop
    delayNode.connect(delayGain);
    delayGain.connect(masterGain);
}

function generateReverbImpulse(duration) {
    const rate = audioCtx.sampleRate;
    const length = rate * duration;
    const impulse = audioCtx.createBuffer(2, length, rate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
        // Exponential decay for smoother tail
        const decay = Math.pow(1 - i / length, 4);
        left[i] = (Math.random() * 2 - 1) * decay;
        right[i] = (Math.random() * 2 - 1) * decay;
    }
    reverbNode.buffer = impulse;
}

/**
 * Play a synthesized note
 * @param {Object} instr Instrument definition (osc types, envelope, filter)
 * @param {Number} freq Frequency in Hz
 * @param {Number} time Start time
 * @param {Number} duration Duration in seconds
 * @param {Number} vol Volume (0-1)
 */
function playNote(instr, freq, time, duration, vol = 1.0) {
    if (!audioCtx) return;

    // --- Oscillators ---
    let src1, src2;
    if (instr.type1 === 'noise') {
        src1 = audioCtx.createBufferSource();
        src1.buffer = createNoiseBuffer();
        src1.loop = true;
    } else {
        src1 = audioCtx.createOscillator();
        src1.type = instr.type1 || 'sawtooth';
        src1.frequency.setValueAtTime(freq, time);
        src1.detune.value = -instr.detune || -10;
    }

    if (instr.type2 === 'noise') {
        src2 = audioCtx.createBufferSource();
        src2.buffer = createNoiseBuffer();
        src2.loop = true;
    } else {
        src2 = audioCtx.createOscillator();
        src2.type = instr.type2 || 'square';
        src2.frequency.setValueAtTime(freq, time);
        src2.detune.value = instr.detune || 10;
    }

    // --- Filter & Amp ---
    const vcf = audioCtx.createBiquadFilter();
    const vca = audioCtx.createGain();

    // Patch: Sources -> VCF -> VCA -> Master/Effects
    src1.connect(vcf);
    src2.connect(vcf);
    vcf.connect(vca);
    vca.connect(masterGain);

    // Effects Sends
    if (instr.reverb) vca.connect(reverbNode);
    if (instr.delay) vca.connect(delayNode);

    // --- LFO Modulation ---
    if (instr.lfo) {
        const lfo = audioCtx.createOscillator();
        lfo.type = instr.lfoType || 'sine';
        lfo.frequency.value = instr.lfoRate || 5; // Hz

        const lfoGain = audioCtx.createGain();
        lfoGain.gain.value = instr.lfoDepth || 10;

        lfo.connect(lfoGain);

        if (instr.lfoTarget === 'freq') {
            // Vibrato
            if (src1.detune) lfoGain.connect(src1.detune);
            if (src2.detune) lfoGain.connect(src2.detune);
        } else {
            // Wah / Tremolo (Filter)
            lfoGain.connect(vcf.frequency);
        }

        lfo.start(time);
        lfo.stop(time + duration + 0.5);
    }

    // --- Envelopes ---

    // Filter
    vcf.type = instr.filterType || 'lowpass';
    vcf.Q.value = instr.res || 1;
    const baseCutoff = instr.cutoff || 1000;
    vcf.frequency.setValueAtTime(baseCutoff, time);

    if (instr.filterEnv) {
        // Envelope amount (how much higher than base cutoff)
        const amt = instr.filterEnvAmt || 2000;
        vcf.frequency.setValueAtTime(baseCutoff, time);
        vcf.frequency.linearRampToValueAtTime(baseCutoff + amt, time + 0.05); // Attack
        vcf.frequency.exponentialRampToValueAtTime(baseCutoff, time + 0.3); // Decay
    }

    // Amp ADSR
    const atk = instr.attack || 0.01;
    const dec = instr.decay || 0.1;
    const sus = instr.sustain || 0.5;
    const rel = instr.release || 0.2;

    const baseVol = (instr.vol || 0.5) * vol;
    vca.gain.setValueAtTime(0, time);
    vca.gain.linearRampToValueAtTime(baseVol, time + atk);
    vca.gain.exponentialRampToValueAtTime(baseVol * sus, time + atk + dec);
    // Note off
    vca.gain.setValueAtTime(baseVol * sus, time + duration);
    vca.gain.exponentialRampToValueAtTime(0.001, time + duration + rel);

    // Start/Stop Sources
    src1.start(time);
    src2.start(time);
    src1.stop(time + duration + rel + 0.5);
    src2.stop(time + duration + rel + 0.5);
}

let noiseBuffer = null;
function createNoiseBuffer() {
    if (noiseBuffer) return noiseBuffer;
    const len = audioCtx.sampleRate * 1.0;
    const buf = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    noiseBuffer = buf;
    return buf;
}

function playDrum(type, time) {
    if (!audioCtx) return;
    const t = time;

    if (type === 'kick') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(masterGain);

        osc.frequency.setValueAtTime(150, t);
        osc.frequency.exponentialRampToValueAtTime(40, t + 0.1);
        gain.gain.setValueAtTime(0.8, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);

        osc.start(t);
        osc.stop(t + 0.2);
    }
    else if (type === 'snare') {
        const noise = createNoiseBuffer();
        const noiseSrc = audioCtx.createBufferSource();
        noiseSrc.buffer = noise;
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 800;
        const gain = audioCtx.createGain();

        noiseSrc.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);
        gain.connect(reverbNode); // Snare needs reverb

        gain.gain.setValueAtTime(0.6, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
        noiseSrc.start(t);
        noiseSrc.stop(t + 0.2);
        // Tone underlining
        const osc = audioCtx.createOscillator();
        const ogain = audioCtx.createGain();
        osc.connect(ogain);
        ogain.connect(masterGain);
        osc.frequency.setValueAtTime(200, t);
        ogain.gain.setValueAtTime(0.3, t);
        ogain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
        osc.start(t);
        osc.stop(t + 0.1);
    }
    else if (type === 'hat') {
        const noise = createNoiseBuffer();
        const bs = audioCtx.createBufferSource();
        bs.buffer = noise;
        const hpf = audioCtx.createBiquadFilter();
        hpf.type = 'highpass';
        hpf.frequency.value = 5000;
        const gain = audioCtx.createGain();

        bs.connect(hpf);
        hpf.connect(gain);
        gain.connect(masterGain);

        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
        bs.start(t);
        bs.stop(t + 0.05);
    }
}

// --- INSTRUMENT DEFINITIONS ---

// --- INSTRUMENTS (V2.1) ---

const INSTRUMENTS = {
    // Menu Pad: Warm, chorused detune, slow attack
    PAD_WARM: {
        type1: 'sawtooth', type2: 'sawtooth', detune: 12,
        attack: 0.8, decay: 0.5, sustain: 0.7, release: 2.0,
        cutoff: 600, res: 2, vol: 0.25, reverb: true,
        lfo: true, lfoType: 'sine', lfoRate: 0.5, lfoDepth: 100, lfoTarget: 'filter'
    },
    // Game Lead: Expressive with vibrato and delay
    LEAD_EXPRESSIVE: {
        type1: 'square', type2: 'triangle', detune: 5,
        attack: 0.05, decay: 0.1, sustain: 0.6, release: 0.3,
        cutoff: 2000, res: 3, vol: 0.35, reverb: true, delay: true,
        lfo: true, lfoType: 'sine', lfoRate: 6, lfoDepth: 15, lfoTarget: 'freq' // Vibrato
    },
    // Bass: Punchy pluck with filter envelope
    BASS_PLUCK: {
        type1: 'sawtooth', type2: 'square', detune: 8,
        attack: 0.01, decay: 0.3, sustain: 0.3, release: 0.1,
        cutoff: 400, res: 5, vol: 0.6,
        filterEnv: true, filterEnvAmt: 1500
    },
    // Arp Synth: Short and bubbly
    ARP_SYNTH: {
        type1: 'square', type2: 'sawtooth', detune: 5,
        attack: 0.01, decay: 0.1, sustain: 0.1, release: 0.1,
        cutoff: 1200, res: 1, vol: 0.3, delay: true
    },
    // Drums
    KICK: { type: 'kick', vol: 0.9 },
    SNARE: { type: 'snare', vol: 0.7 },
    HIHAT: { type: 'hat', vol: 0.3 }
};

// --- SONGS ---

// Menu Theme: "The Carpenter's Dream" (Atmospheric, 85 BPM)
const SONG_MENU = {
    bpm: 85,
    length: 64, // 16 bars
    tracks: [
        { instr: 'PAD_WARM', notes: [] },
        { instr: 'LEAD_EXPRESSIVE', notes: [] },
        { instr: 'ARP_SYNTH', notes: [] }
    ]
};

// Progression: Dm9 -> BbMaj7 -> Gm7 -> Asus4 (Dorian-ish)
const menuChords = [
    [146.8, 220, 261.6, 329.6], // Dm9 (D F A E)
    [116.5, 174.6, 220, 293.7], // BbMaj7 (Bb F A D)
    [196, 233.1, 293.7, 349.2], // Gm7 (G Bb D F)
    [220, 293.7, 329.6, 392]    // Asus4 -> A7ish
];

for (let bar = 0; bar < 16; bar++) {
    const chord = menuChords[bar % 4];
    // Pad Chords
    chord.forEach(freq => {
        SONG_MENU.tracks[0].notes.push([bar * 4, freq, 4]);
    });

    // Arpeggio background (enters bar 4)
    if (bar >= 4) {
        for (let i = 0; i < 16; i++) { // 16th notes
            if (i % 2 === 0) {
                const note = chord[i % 4] * 2; // Octave up
                SONG_MENU.tracks[2].notes.push([bar * 4 + i * 0.25, note, 0.1]);
            }
        }
    }
}

// Melody (enters bar 8)
const melodyBase = 32; // bar 8 * 4 beats
const melodyNotes = [
    [0, 440, 1.5], [1.5, 392, 0.5], [2, 349.2, 1], [3, 293.7, 1], // A G F D
    [4, 220, 2.0], [6, 261.6, 0.5], [6.5, 293.7, 0.5], [7, 329.6, 1] // A, C D E
];
melodyNotes.forEach(n => {
    SONG_MENU.tracks[1].notes.push([melodyBase + n[0], n[1], n[2]]);
    SONG_MENU.tracks[1].notes.push([melodyBase + 8 + n[0], n[1], n[2]]); // Repeat
});

// =============================================================================
// Intro Theme: "The Artisan's Lament" (Slow, Emotional, 60 BPM)
// For the Star Wars-style story scroll
// =============================================================================
const SONG_INTRO = {
    bpm: 60,
    length: 128, // 32 bars - long for the story scroll
    tracks: [
        { instr: 'PAD_WARM', notes: [] },
        { instr: 'LEAD_EXPRESSIVE', notes: [] },
        { instr: 'ARP_SYNTH', notes: [] },
        { instr: 'BASS_PLUCK', notes: [] }
    ]
};

// D minor progression - somber but hopeful: Dm -> Bb -> Gm -> A7
const introChords = [
    [146.8, 174.6, 220],     // Dm (D F A)
    [116.5, 146.8, 174.6],   // Bb (Bb D F)
    [98, 116.5, 146.8],      // Gm (G Bb D)
    [110, 138.6, 164.8]      // A (A C# E)
];

// Slow pad progression throughout
for (let bar = 0; bar < 32; bar++) {
    const chord = introChords[bar % 4];
    chord.forEach(freq => {
        SONG_INTRO.tracks[0].notes.push([bar * 4, freq, 4]);
    });

    // Bass notes - root of each chord
    const bassFreqs = [73.4, 58.3, 49, 55]; // D, Bb, G, A (one octave down)
    SONG_INTRO.tracks[3].notes.push([bar * 4, bassFreqs[bar % 4], 3.5]);
}

// Gentle arpeggio (enters bar 4)
for (let bar = 4; bar < 32; bar++) {
    const chord = introChords[bar % 4];
    for (let i = 0; i < 8; i++) {
        const note = chord[i % 3] * 2; // Octave up
        SONG_INTRO.tracks[2].notes.push([bar * 4 + i * 0.5, note, 0.3]);
    }
}

// Expressive melody - tells Sandy's story
const introMelody = [
    // Opening phrase (bars 8-12) - questioning
    [32, 293.7, 2], [34, 349.2, 1], [35, 329.6, 1],
    [36, 293.7, 2], [38, 261.6, 2],
    [40, 293.7, 1], [41, 329.6, 1], [42, 349.2, 2],
    [44, 392, 2], [46, 349.2, 2],

    // Rising hope (bars 16-20)
    [64, 392, 2], [66, 440, 1], [67, 392, 1],
    [68, 349.2, 2], [70, 329.6, 2],
    [72, 293.7, 2], [74, 349.2, 1], [75, 392, 1],
    [76, 440, 4],

    // Determination (bars 24-28)
    [96, 523.3, 2], [98, 493.9, 1], [99, 440, 1],
    [100, 392, 2], [102, 440, 2],
    [104, 493.9, 2], [106, 523.3, 1], [107, 587.3, 1],
    [108, 659.3, 4],

    // Resolve (bars 28-32)
    [112, 587.3, 2], [114, 523.3, 2],
    [116, 440, 2], [118, 392, 2],
    [120, 349.2, 2], [122, 293.7, 2],
    [124, 293.7, 4] // End on D
];

introMelody.forEach(n => {
    SONG_INTRO.tracks[1].notes.push([n[0], n[1], n[2]]);
});

function startIntroMusic() {
    startSequencer(SONG_INTRO);
}


// Game Theme: "Table Quest Anthem" (Driving, 135 BPM) - Level 1: Office
const SONG_LEVEL1 = {
    bpm: 135,
    length: 32, // 8 bar loop
    tracks: [
        { instr: 'BASS_PLUCK', notes: [] },
        { instr: 'KICK', notes: [] },
        { instr: 'SNARE', notes: [] },
        { instr: 'HIHAT', notes: [] },
        { instr: 'LEAD_EXPRESSIVE', notes: [] }
    ]
};

// Bassline: E Minor pentatonic drive
// 0 0 3 0 5 0 7 0 (E G A B)
const bassScale = [82.4, 82.4, 98, 82.4, 110, 82.4, 123.5, 82.4];

for (let i = 0; i < 32; i++) { // 32 beats
    // Bass - 8th note drive
    SONG_LEVEL1.tracks[0].notes.push([i, bassScale[i % 8], 0.2]);
    SONG_LEVEL1.tracks[0].notes.push([i + 0.5, bassScale[(i + 2) % 8], 0.2]);

    // Drums
    SONG_LEVEL1.tracks[1].notes.push([i, 0, 0]); // 4-on-floor Kick
    if (i % 2 !== 0) SONG_LEVEL1.tracks[2].notes.push([i, 0, 0]); // Snare 2/4
    SONG_LEVEL1.tracks[3].notes.push([i + 0.5, 0, 0]); // Offbeat Hat
}

// Heroic Melody (Bar 4-8)
const gameMelodyBase = 16;
const gameMelody = [
    [0, 659.3, 0.5], [0.5, 659.3, 0.5], [1, 587.3, 0.5], [1.5, 523.3, 0.5], [2, 493.9, 1.0], [3, 392, 1.0],
    [4, 329.6, 2.0], [6, 440, 0.5], [6.5, 493.9, 0.5], [7, 523.3, 1.0]
];
gameMelody.forEach(n => {
    SONG_LEVEL1.tracks[4].notes.push([gameMelodyBase + n[0], n[1], n[2]]);
    SONG_LEVEL1.tracks[4].notes.push([gameMelodyBase + 8 + n[0], n[1], n[2]]);
});

// =============================================================================
// Level 2: Dungeon Theme - "Descent into Darkness" (Dark, Tense, 100 BPM)
// =============================================================================
const SONG_LEVEL2 = {
    bpm: 100,
    length: 32, // 8 bar loop
    tracks: [
        { instr: 'BASS_PLUCK', notes: [] },
        { instr: 'KICK', notes: [] },
        { instr: 'SNARE', notes: [] },
        { instr: 'ARP_SYNTH', notes: [] },
        { instr: 'PAD_WARM', notes: [] }
    ]
};

// D minor dark progression
const dungeonBass = [73.4, 73.4, 69.3, 73.4, 82.4, 73.4, 69.3, 65.4]; // D D C# D E D C# B

for (let i = 0; i < 32; i++) {
    // Sparse, punchy bass
    if (i % 2 === 0) {
        SONG_LEVEL2.tracks[0].notes.push([i, dungeonBass[i % 8], 0.3]);
    }

    // Sparse drums - tension building
    if (i % 4 === 0) SONG_LEVEL2.tracks[1].notes.push([i, 0, 0]); // Kick on 1
    if (i % 4 === 2) SONG_LEVEL2.tracks[2].notes.push([i, 0, 0]); // Snare on 3

    // Dark arpeggio - D minor chord
    if (i % 4 === 0) {
        const arpNotes = [293.7, 349.2, 440, 349.2]; // D F A F
        for (let j = 0; j < 4; j++) {
            SONG_LEVEL2.tracks[3].notes.push([i + j * 0.25, arpNotes[j], 0.2]);
        }
    }
}

// Eerie pad chord (enters bar 4)
const dungeonPad = [146.8, 174.6, 220]; // D F A (D minor)
for (let bar = 4; bar < 8; bar++) {
    dungeonPad.forEach(freq => {
        SONG_LEVEL2.tracks[4].notes.push([bar * 4, freq, 4]);
    });
}

// =============================================================================
// Level 3: Factory Theme - "Production Line" (Industrial, Heavy, 150 BPM)
// =============================================================================
const SONG_LEVEL3 = {
    bpm: 150,
    length: 32,
    tracks: [
        { instr: 'BASS_PLUCK', notes: [] },
        { instr: 'KICK', notes: [] },
        { instr: 'SNARE', notes: [] },
        { instr: 'HIHAT', notes: [] },
        { instr: 'LEAD_EXPRESSIVE', notes: [] }
    ]
};

// A minor industrial bass - aggressive
const factoryBass = [110, 110, 130.8, 110, 146.8, 130.8, 110, 98]; // A A C A D C A G

for (let i = 0; i < 32; i++) {
    // Heavy 16th note bass drive
    SONG_LEVEL3.tracks[0].notes.push([i, factoryBass[i % 8], 0.15]);
    SONG_LEVEL3.tracks[0].notes.push([i + 0.25, factoryBass[(i + 1) % 8] * 0.5, 0.1]);
    SONG_LEVEL3.tracks[0].notes.push([i + 0.5, factoryBass[(i + 2) % 8], 0.15]);
    SONG_LEVEL3.tracks[0].notes.push([i + 0.75, factoryBass[(i + 3) % 8] * 0.5, 0.1]);

    // Pounding industrial drums
    SONG_LEVEL3.tracks[1].notes.push([i, 0, 0]); // Kick every beat
    SONG_LEVEL3.tracks[1].notes.push([i + 0.5, 0, 0]); // Double kick
    if (i % 2 === 1) SONG_LEVEL3.tracks[2].notes.push([i, 0, 0]); // Snare 2/4
    SONG_LEVEL3.tracks[3].notes.push([i + 0.25, 0, 0]); // 16th hats
    SONG_LEVEL3.tracks[3].notes.push([i + 0.75, 0, 0]);
}

// Aggressive staccato melody (bars 4-8)
const factoryMelody = [
    [0, 440, 0.25], [0.5, 440, 0.25], [1, 523.3, 0.25], [1.5, 440, 0.25],
    [2, 392, 0.5], [3, 349.2, 0.5],
    [4, 329.6, 0.25], [4.5, 329.6, 0.25], [5, 392, 0.25], [5.5, 440, 0.25],
    [6, 493.9, 1], [7, 440, 1]
];
factoryMelody.forEach(n => {
    SONG_LEVEL3.tracks[4].notes.push([16 + n[0], n[1], n[2]]);
    SONG_LEVEL3.tracks[4].notes.push([24 + n[0], n[1], n[2]]);
});

// =============================================================================
// Level 4: Boss Theme - "Final Confrontation" (Epic, Intense, 160 BPM)
// =============================================================================
const SONG_LEVEL4 = {
    bpm: 160,
    length: 32,
    tracks: [
        { instr: 'BASS_PLUCK', notes: [] },
        { instr: 'KICK', notes: [] },
        { instr: 'SNARE', notes: [] },
        { instr: 'HIHAT', notes: [] },
        { instr: 'LEAD_EXPRESSIVE', notes: [] },
        { instr: 'PAD_WARM', notes: [] }
    ]
};

// E minor epic bass - power
const bossBass = [82.4, 82.4, 98, 110, 82.4, 73.4, 65.4, 82.4]; // E E G A E D C E

for (let i = 0; i < 32; i++) {
    // Powerful bass hits
    SONG_LEVEL4.tracks[0].notes.push([i, bossBass[i % 8], 0.2]);
    if (i % 2 === 0) {
        SONG_LEVEL4.tracks[0].notes.push([i + 0.5, bossBass[(i + 4) % 8] * 0.5, 0.15]);
    }

    // Epic double-time drums
    SONG_LEVEL4.tracks[1].notes.push([i, 0, 0]); // Kick
    SONG_LEVEL4.tracks[1].notes.push([i + 0.5, 0, 0]); // Double kick
    if (i % 2 === 1) {
        SONG_LEVEL4.tracks[2].notes.push([i, 0, 0]); // Snare
        SONG_LEVEL4.tracks[2].notes.push([i + 0.25, 0, 0]); // Snare fill
    }
    // Driving hats
    for (let h = 0; h < 4; h++) {
        SONG_LEVEL4.tracks[3].notes.push([i + h * 0.25, 0, 0]);
    }
}

// Epic power chord pad
const bossChords = [
    [82.4, 123.5, 164.8], // E power chord
    [73.4, 110, 146.8],   // D power chord
    [65.4, 98, 130.8],    // C power chord
    [73.4, 110, 146.8]    // D power chord
];
for (let bar = 0; bar < 8; bar++) {
    const chord = bossChords[bar % 4];
    chord.forEach(freq => {
        SONG_LEVEL4.tracks[5].notes.push([bar * 4, freq, 4]);
    });
}

// Heroic/desperate melody
const bossMelody = [
    [0, 659.3, 0.5], [0.5, 783.99, 0.5], [1, 659.3, 0.5], [1.5, 587.3, 0.5],
    [2, 523.3, 1], [3, 493.9, 0.5], [3.5, 440, 0.5],
    [4, 392, 1], [5, 440, 0.5], [5.5, 493.9, 0.5], [6, 523.3, 0.5], [6.5, 587.3, 0.5],
    [7, 659.3, 1]
];
bossMelody.forEach(n => {
    SONG_LEVEL4.tracks[4].notes.push([16 + n[0], n[1], n[2]]);
    SONG_LEVEL4.tracks[4].notes.push([24 + n[0], n[1], n[2]]);
});


let currentSequence = null;
let nextNoteTime = 0;
let beatIndex = 0;
let isPlaying = false;
let lookahead = 25.0; // ms
let scheduleAheadTime = 0.1; // s

function startSequencer(song) {
    if (!audioCtx) initAudio();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    stopMusic();
    currentSequence = song;
    beatIndex = 0;
    nextNoteTime = audioCtx.currentTime;
    isPlaying = true;
    requestAnimationFrame(scheduler);
}

function stopMusic() {
    isPlaying = false;
    // Immediately silence all audio by disconnecting master gain
    if (masterGain && audioCtx) {
        masterGain.disconnect();
        masterGain = audioCtx.createGain();
        masterGain.gain.value = 0.15;
        masterGain.connect(audioCtx.destination);
    }
}

function scheduler() {
    if (!isPlaying) return;

    while (nextNoteTime < audioCtx.currentTime + scheduleAheadTime) {
        scheduleNote16th(beatIndex, nextNoteTime);
        nextBeat16th();
    }
    requestAnimationFrame(scheduler);
}

function nextBeat16th() {
    const secondsPer16th = (60.0 / currentSequence.bpm) / 4;
    nextNoteTime += secondsPer16th;
    beatIndex++;
    // Length is in BEATS, so *4
    if (beatIndex >= currentSequence.length * 4) beatIndex = 0;
}

function scheduleNote16th(step, time) {
    const beatVal = step / 4.0;
    const secondsPerBeat = 60.0 / currentSequence.bpm;

    currentSequence.tracks.forEach(track => {
        track.notes.forEach(n => {
            // Check if note starts at this 16th step (epsilon check)
            if (Math.abs(n[0] - beatVal) < 0.001) {
                const instrName = track.instr;
                const freq = n[1];
                const dur = n[2] * secondsPerBeat; // Duration in seconds

                if (INSTRUMENTS[instrName]) {
                    if (['KICK', 'SNARE', 'HIHAT'].includes(instrName)) {
                        playDrum(INSTRUMENTS[instrName].type, time);
                    } else {
                        playNote(INSTRUMENTS[instrName], freq, time, dur);
                    }
                }
            }
        });
    });
}

function startMenuMusic() {
    startSequencer(SONG_MENU);
}

function startMusic() { // Legacy - defaults to level 1
    startSequencer(SONG_LEVEL1);
}

function startLevelMusic(levelNum) {
    // Each level gets unique music
    switch (levelNum) {
        case 1: startSequencer(SONG_LEVEL1); break; // Office - Upbeat
        case 2: startSequencer(SONG_LEVEL2); break; // Dungeon - Dark
        case 3: startSequencer(SONG_LEVEL3); break; // Factory - Industrial
        case 4: startSequencer(SONG_LEVEL4); break; // Boss - Epic
        default: startSequencer(SONG_LEVEL1); break;
    }
}

// --- SFX ---

function playSound(type) {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;

    if (type === 'shoot') {
        // Laser/Gun
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(masterGain);

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.2);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

        osc.start(now);
        osc.stop(now + 0.3);

        // Impact Noise
        const noise = createNoiseBuffer();
        const bs = audioCtx.createBufferSource();
        bs.buffer = noise;
        const ngain = audioCtx.createGain();
        bs.connect(ngain);
        ngain.connect(masterGain);
        ngain.gain.setValueAtTime(0.1, now);
        ngain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        bs.start(now);
        bs.stop(now + 0.1);

    } else if (type === 'hit') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(masterGain);

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.linearRampToValueAtTime(20, now + 0.2);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);

    } else if (type === 'collect') {
        // Happy Chime
        const mkNote = (f, t, d) => playNote({
            type1: 'sine', type2: 'triangle', detune: 5,
            attack: 0.01, decay: 0.1, sustain: 0.1, release: 0.3,
            vol: 0.4, reverb: true
        }, f, now + t, d);

        mkNote(880, 0, 0.1);
        mkNote(1174, 0.05, 0.1);
        mkNote(1760, 0.1, 0.2);

    } else if (type === 'money') {
        // Cha-ching! Cash register / coin sound
        // High metallic ping (coin drop)
        const mkCoin = (f, t, d) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(masterGain);
            gain.connect(reverbNode);

            osc.type = 'square';
            osc.frequency.setValueAtTime(f, now + t);
            osc.frequency.exponentialRampToValueAtTime(f * 0.8, now + t + d);

            gain.gain.setValueAtTime(0.2, now + t);
            gain.gain.exponentialRampToValueAtTime(0.01, now + t + d);

            osc.start(now + t);
            osc.stop(now + t + d + 0.1);
        };

        // Coin clink sounds (ascending metallic tones)
        mkCoin(2400, 0, 0.08);
        mkCoin(3200, 0.05, 0.08);
        mkCoin(4000, 0.1, 0.1);

        // Cash register "ding" (bell sound)
        const bell = audioCtx.createOscillator();
        const bellGain = audioCtx.createGain();
        bell.connect(bellGain);
        bellGain.connect(masterGain);
        bellGain.connect(reverbNode);

        bell.type = 'sine';
        bell.frequency.setValueAtTime(1318.5, now + 0.15); // E6 note
        bellGain.gain.setValueAtTime(0.3, now + 0.15);
        bellGain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

        bell.start(now + 0.15);
        bell.stop(now + 0.5);

    } else if (type === 'door') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(masterGain);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.linearRampToValueAtTime(50, now + 1.0);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0, now + 1.0);
        osc.start(now);
        osc.stop(now + 1.0);
    } else if (type === 'step') {
        // Subtle Noise click
        const noise = createNoiseBuffer();
        const bs = audioCtx.createBufferSource();
        bs.buffer = noise;
        const gain = audioCtx.createGain();
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 400;

        bs.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain); // No reverb for steps usually

        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        bs.start(now);
        bs.stop(now + 0.05);
    } else if (type === 'alert') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(masterGain);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.linearRampToValueAtTime(880, now + 0.2);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);

    } else if (type === 'door_open') {
        // Heavy door creaking/sliding sound
        // Low frequency sweep with noise
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(masterGain);

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(80, now);
        osc.frequency.linearRampToValueAtTime(40, now + 0.3);
        osc.frequency.linearRampToValueAtTime(60, now + 0.5);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0.2, now + 0.2);
        gain.gain.linearRampToValueAtTime(0, now + 0.5);

        osc.start(now);
        osc.stop(now + 0.5);

        // Creak noise overlay
        const noise = createNoiseBuffer();
        const bs = audioCtx.createBufferSource();
        bs.buffer = noise;
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 300;
        filter.Q.value = 5;
        const ngain = audioCtx.createGain();

        bs.connect(filter);
        filter.connect(ngain);
        ngain.connect(masterGain);

        ngain.gain.setValueAtTime(0.08, now);
        ngain.gain.linearRampToValueAtTime(0.12, now + 0.2);
        ngain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

        bs.start(now);
        bs.stop(now + 0.5);

    } else if (type === 'enemy_death') {
        // Satisfying defeat sound - descending pitch with impact
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(masterGain);
        gain.connect(reverbNode);

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.4);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

        osc.start(now);
        osc.stop(now + 0.5);

        // Impact thud
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.connect(gain2);
        gain2.connect(masterGain);

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(80, now + 0.1);
        osc2.frequency.exponentialRampToValueAtTime(30, now + 0.3);

        gain2.gain.setValueAtTime(0, now);
        gain2.gain.linearRampToValueAtTime(0.3, now + 0.1);
        gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

        osc2.start(now);
        osc2.stop(now + 0.4);

    } else if (type === 'elevator') {
        // Mechanical ascending sound - motor hum with rising tone
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(masterGain);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(60, now);
        osc.frequency.linearRampToValueAtTime(120, now + 0.8);
        osc.frequency.linearRampToValueAtTime(100, now + 1.0);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0.2, now + 0.3);
        gain.gain.linearRampToValueAtTime(0.15, now + 0.8);
        gain.gain.linearRampToValueAtTime(0, now + 1.0);

        osc.start(now);
        osc.stop(now + 1.0);

        // Motor rumble
        const noise = createNoiseBuffer();
        const bs = audioCtx.createBufferSource();
        bs.buffer = noise;
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 200;
        const ngain = audioCtx.createGain();

        bs.connect(filter);
        filter.connect(ngain);
        ngain.connect(masterGain);

        ngain.gain.setValueAtTime(0.05, now);
        ngain.gain.linearRampToValueAtTime(0.08, now + 0.5);
        ngain.gain.exponentialRampToValueAtTime(0.01, now + 1.0);

        bs.start(now);
        bs.stop(now + 1.0);

        // Ding at the end
        setTimeout(() => {
            if (!audioCtx) return;
            const ding = audioCtx.createOscillator();
            const dgain = audioCtx.createGain();
            ding.connect(dgain);
            dgain.connect(masterGain);
            dgain.connect(reverbNode);

            ding.type = 'sine';
            ding.frequency.value = 880;
            dgain.gain.setValueAtTime(0.2, audioCtx.currentTime);
            dgain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

            ding.start(audioCtx.currentTime);
            ding.stop(audioCtx.currentTime + 0.5);
        }, 800);

    } else if (type === 'boss_roar') {
        // Intimidating low growl with distortion
        const osc = audioCtx.createOscillator();
        const osc2 = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        const filter = audioCtx.createBiquadFilter();

        osc.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);
        gain.connect(reverbNode);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(200, now);
        filter.frequency.linearRampToValueAtTime(400, now + 0.3);
        filter.frequency.linearRampToValueAtTime(150, now + 1.0);
        filter.Q.value = 5;

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(50, now);
        osc.frequency.linearRampToValueAtTime(80, now + 0.2);
        osc.frequency.linearRampToValueAtTime(40, now + 1.0);

        osc2.type = 'square';
        osc2.frequency.setValueAtTime(52, now);
        osc2.frequency.linearRampToValueAtTime(82, now + 0.2);
        osc2.frequency.linearRampToValueAtTime(42, now + 1.0);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0.4, now + 0.2);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 1.2);

        osc.start(now);
        osc2.start(now);
        osc.stop(now + 1.2);
        osc2.stop(now + 1.2);

    } else if (type === 'fanfare') {
        // Victory celebration - major chord arpeggio
        const mkNote = (f, t, d) => playNote({
            type1: 'square', type2: 'sawtooth', detune: 5,
            attack: 0.02, decay: 0.1, sustain: 0.6, release: 0.5,
            cutoff: 2000, res: 1, vol: 0.3, reverb: true
        }, f, now + t, d);

        // C Major arpeggio going up
        mkNote(523.25, 0, 0.2);      // C5
        mkNote(659.25, 0.15, 0.2);   // E5
        mkNote(783.99, 0.30, 0.2);   // G5
        mkNote(1046.50, 0.45, 0.4);  // C6

        // Final triumphant chord
        setTimeout(() => {
            if (!audioCtx) return;
            const t = audioCtx.currentTime;
            mkNote(523.25, 0, 0.8);   // C5
            mkNote(659.25, 0, 0.8);   // E5
            mkNote(783.99, 0, 0.8);   // G5
            mkNote(1046.50, 0, 0.8);  // C6
        }, 600);
    }
}
