/**
 * CONFIGURATION & CONSTANTS
 */
const SCREEN_WIDTH = 320;
const SCREEN_HEIGHT = 200; // Rendering resolution (upscaled by CSS)
const TICK_RATE = 30;
const FOV = Math.PI / 3;
const BLOCK_SIZE = 64;
const MAP_SIZE = 64;
const MINI_MAP_SCALE = 0.2;
const MAX_DEPTH = 50; // Max render distance in blocks (Increased for visibility)

// --- Menu Config ---
const MENU_COLORS = {
    bg: '#000080', // Wolf3D Dark Blue
    border: '#aaa',
    text: '#eee',
    highlight: '#d9a066', // Gold/Wood
    shadow: '#000'
};
