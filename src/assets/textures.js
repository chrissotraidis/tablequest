/**
 * TEXTURE GENERATION
 * Procedurally generates wall textures.
 */
const textures = {};

function createTexture(name, color, type = 'solid') {
    const SIZE = 128;
    const cvs = document.createElement('canvas');
    cvs.width = SIZE;
    cvs.height = SIZE;
    const ctx = cvs.getContext('2d');

    // Base Color
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, SIZE, SIZE);

    // Add Noise
    if (type !== 'elevator' && type !== 'metal') {
        const noiseData = ctx.getImageData(0, 0, SIZE, SIZE);
        for (let i = 0; i < noiseData.data.length; i += 4) {
            const noise = (Math.random() - 0.5) * 30;
            noiseData.data[i] += noise;
            noiseData.data[i + 1] += noise;
            noiseData.data[i + 2] += noise;
        }
        ctx.putImageData(noiseData, 0, 0);
    }

    if (type === 'brick') {
        const brickH = 24;
        const brickW = 40;
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        for (let y = 0; y < SIZE; y += brickH) ctx.fillRect(0, y, SIZE, 2);
        for (let y = 0; y < SIZE; y += brickH) {
            const offset = (y / brickH) % 2 === 0 ? 0 : brickW / 2;
            for (let x = offset; x < SIZE; x += brickW) ctx.fillRect(x, y, 2, brickH);
        }
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        for (let y = 0; y < SIZE; y += brickH) {
            const offset = (y / brickH) % 2 === 0 ? 0 : brickW / 2;
            for (let x = offset; x < SIZE; x += brickW) ctx.fillRect(x + 2, y + 2, brickW - 4, 2);
        }
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        for (let i = 0; i < 200; i++) ctx.fillRect(Math.random() * SIZE, Math.random() * SIZE, 2, 2);

    } else if (type === 'stone') {
        // Large irregular stone blocks
        ctx.strokeStyle = 'rgba(0,0,0,0.6)';
        ctx.lineWidth = 3;
        const stoneH = 32;
        for (let y = 0; y < SIZE; y += stoneH) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(SIZE, y + (Math.random() - 0.5) * 8);
            ctx.stroke();
        }
        for (let x = 0; x < SIZE; x += 40 + Math.random() * 20) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x + (Math.random() - 0.5) * 10, SIZE);
            ctx.stroke();
        }
        // Moss/dirt patches
        ctx.fillStyle = 'rgba(30, 60, 30, 0.2)';
        for (let i = 0; i < 50; i++) {
            ctx.fillRect(Math.random() * SIZE, Math.random() * SIZE, 4 + Math.random() * 6, 4 + Math.random() * 6);
        }

    } else if (type === 'concrete') {
        // Industrial concrete with cracks
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 15; i++) {
            ctx.beginPath();
            ctx.moveTo(Math.random() * SIZE, Math.random() * SIZE);
            for (let j = 0; j < 5; j++) {
                ctx.lineTo(ctx.canvas.width * Math.random(), ctx.canvas.height * Math.random());
            }
            ctx.stroke();
        }
        // Stains
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        for (let i = 0; i < 30; i++) {
            ctx.beginPath();
            ctx.arc(Math.random() * SIZE, Math.random() * SIZE, 5 + Math.random() * 10, 0, Math.PI * 2);
            ctx.fill();
        }

    } else if (type === 'office') {
        // Office wall panels with vertical stripes
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        for (let x = 0; x < SIZE; x += 32) {
            ctx.fillRect(x, 0, 2, SIZE);
        }
        // Horizontal divider
        ctx.fillStyle = 'rgba(50,50,50,0.3)';
        ctx.fillRect(0, SIZE / 2 - 4, SIZE, 8);
        // Subtle texture
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        for (let i = 0; i < 100; i++) {
            ctx.fillRect(Math.random() * SIZE, Math.random() * SIZE, 3, 3);
        }

    } else if (type === 'metal') {
        // Brushed metal panels
        const grad = ctx.createLinearGradient(0, 0, SIZE, 0);
        grad.addColorStop(0, '#666');
        grad.addColorStop(0.3, '#999');
        grad.addColorStop(0.5, '#777');
        grad.addColorStop(0.7, '#888');
        grad.addColorStop(1, '#666');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, SIZE, SIZE);
        // Rivets
        ctx.fillStyle = '#444';
        for (let y = 16; y < SIZE; y += 32) {
            for (let x = 16; x < SIZE; x += 32) {
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        // Panel lines
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.strokeRect(4, 4, SIZE - 8, SIZE - 8);

    } else if (type === 'carpet') {
        // Office carpet with pattern
        ctx.fillStyle = 'rgba(0,0,0,0.05)';
        for (let y = 0; y < SIZE; y += 8) {
            for (let x = (y % 16 === 0) ? 0 : 4; x < SIZE; x += 8) {
                ctx.fillRect(x, y, 4, 4);
            }
        }

    } else if (type === 'tile') {
        // Floor/ceiling tile - subtle grid pattern, minimal noise for stable visuals
        // Draw tile grid lines
        ctx.strokeStyle = 'rgba(0,0,0,0.15)';
        ctx.lineWidth = 2;
        const tileSize = 64;
        for (let y = 0; y <= SIZE; y += tileSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(SIZE, y);
            ctx.stroke();
        }
        for (let x = 0; x <= SIZE; x += tileSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, SIZE);
            ctx.stroke();
        }
        // Subtle highlight on tile edges
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.lineWidth = 1;
        for (let y = 2; y < SIZE; y += tileSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(SIZE, y);
            ctx.stroke();
        }
        for (let x = 2; x < SIZE; x += tileSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, SIZE);
            ctx.stroke();
        }

    } else if (type === 'wood') {
        ctx.fillStyle = 'rgba(30, 10, 0, 0.2)';
        for (let i = 0; i < SIZE; i += 2) {
            ctx.fillRect(i, 0, 1 + Math.random(), SIZE);
        }
        ctx.strokeStyle = 'rgba(50, 20, 0, 0.8)';
        ctx.lineWidth = 3;
        ctx.strokeRect(2, 2, SIZE - 4, SIZE - 4);
        ctx.fillStyle = 'rgba(40, 15, 0, 0.3)';
        for (let k = 0; k < 3; k++) {
            ctx.beginPath();
            ctx.ellipse(Math.random() * SIZE, Math.random() * SIZE, 5, 10, 0, 0, Math.PI * 2);
            ctx.fill();
        }

    } else if (type === 'elevator') {
        const grad = ctx.createLinearGradient(0, 0, SIZE, 0);
        grad.addColorStop(0, '#888');
        grad.addColorStop(0.2, '#ccc');
        grad.addColorStop(0.5, '#999');
        grad.addColorStop(0.8, '#bbb');
        grad.addColorStop(1, '#888');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, SIZE, SIZE);
        ctx.fillStyle = '#222';
        ctx.fillRect(SIZE / 2 - 2, 0, 4, SIZE);
        ctx.fillStyle = '#111';
        ctx.fillRect(SIZE * 0.7, SIZE * 0.4, 20, 30);
        ctx.fillStyle = '#0f0';
        ctx.shadowColor = 'lime';
        ctx.shadowBlur = 10;
        ctx.fillRect(SIZE * 0.7 + 6, SIZE * 0.4 + 10, 8, 8);
        ctx.shadowBlur = 0;

    } else if (type === 'gate') {
        ctx.fillStyle = '#222';
        ctx.fillRect(0, 0, SIZE, SIZE);
        ctx.fillStyle = '#555';
        ctx.fillRect(0, 0, SIZE, 10);
        ctx.fillRect(0, SIZE - 10, SIZE, 10);
        ctx.fillRect(0, 0, 10, SIZE);
        ctx.fillRect(SIZE - 10, 0, 10, SIZE);
        const barWidth = 8;
        const gap = (SIZE - 20) / 4;
        ctx.fillStyle = '#777';
        for (let x = 10 + gap / 2; x < SIZE - 10; x += gap) {
            ctx.fillRect(x - barWidth / 2, 10, barWidth, SIZE - 20);
            ctx.fillStyle = '#aaa';
            ctx.fillRect(x - barWidth / 2 + 2, 10, 2, SIZE - 20);
            ctx.fillStyle = '#777';
        }
    }

    if (typeof ASSET_DATA !== 'undefined' && ASSET_DATA[name]) {
        const img = new Image();
        img.onload = function () {
            ctx.drawImage(img, 0, 0, SIZE, SIZE);
        };
        img.src = ASSET_DATA[name];
    }

    textures[name] = cvs;
}

// Generate Standard Textures
createTexture('wall', '#777', 'brick');      // Type 1: Red brick wall
createTexture('wood', '#8B5a2b', 'wood');    // Type 2: Wooden panels
createTexture('door', '#555', 'elevator');   // Type 3: Metal door
createTexture('floor', '#444', 'tile');      // Floor - tile pattern for stable visuals
createTexture('ceil', '#333', 'tile');       // Ceiling - tile pattern for stable visuals
createTexture('gate', '#222', 'gate');       // Type 4: Locked gate

// NEW TEXTURES for variety
createTexture('stone', '#556', 'stone');     // Type 5: Dungeon stone
createTexture('concrete', '#665', 'concrete'); // Type 6: Industrial concrete
createTexture('office', '#8899aa', 'office'); // Type 7: Office wall panels
createTexture('metal', '#667', 'metal');     // Type 8: Metal wall
createTexture('carpet', '#446', 'carpet');   // For floor variety
