const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, 'src');
const DIST_DIR = path.join(__dirname, 'dist');
const OUTPUT_FILE = path.join(DIST_DIR, 'tablequest.html');

// Order matters for concatenation!
const JS_FILES = [
    'config.js',
    'engine/audio.js',
    'assets/image_data.js', // [NEW] Asset Data (Moved before textures)
    'assets/textures.js',
    'assets/sprites.js',
    'engine/input.js',
    'game/levels.js',
    'game/state.js',
    'engine/renderer.js',
    'main.js'
];

function build() {
    console.log("Building Sandy's Table Quest...");

    if (!fs.existsSync(DIST_DIR)) {
        fs.mkdirSync(DIST_DIR);
    }

    // Read Template
    let html = fs.readFileSync(path.join(SRC_DIR, 'index.html'), 'utf8');

    // Concatenate JS
    let fullScript = '';
    JS_FILES.forEach(file => {
        const filePath = path.join(SRC_DIR, file);
        if (fs.existsSync(filePath)) {
            console.log(`  Adding ${file}`);
            const content = fs.readFileSync(filePath, 'utf8');
            fullScript += `\n/* --- ${file} --- */\n` + content + '\n';
        } else {
            console.error(`  ERROR: File not found: ${filePath}`);
            process.exit(1);
        }
    });

    // Inject into HTML
    // Inject into HTML
    html = html.replace('// %%SCRIPTS%%', () => fullScript);

    // Minimize whitespace in HTML (simple)
    // html = html.replace(/\n\s*\n/g, '\n'); 

    fs.writeFileSync(OUTPUT_FILE, html);
    console.log(`Build complete! Output: ${OUTPUT_FILE}`);
}

build();
