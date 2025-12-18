/**
 * SPRITE GENERATION
 * Procedurally generates entity sprites.
 */
const sprites = {};

function createSprite(name, drawFn, width = 64, height = 64) {
    const cvs = document.createElement('canvas');
    cvs.width = width;
    cvs.height = height;
    const ctx = cvs.getContext('2d');
    drawFn(ctx);
    sprites[name] = cvs;
    return cvs.toDataURL(); // Return base64 for HUD usage if needed
}

// Helper for Enemy Variance - Enhanced with unique features
function createEnemy(nameSuffix, config) {
    const { suitColor, shirtColor, tieColor, hasGlasses, hasMustache, hatColor } = config;

    createSprite('enemy_idle' + nameSuffix, (ctx) => {
        // Body/Suit
        ctx.fillStyle = suitColor;
        ctx.fillRect(18, 28, 28, 36);

        // Shoulders
        ctx.fillRect(12, 30, 8, 12);
        ctx.fillRect(44, 30, 8, 12);

        // Head
        ctx.fillStyle = '#E8C4A0'; // Skin
        ctx.beginPath();
        ctx.ellipse(32, 16, 12, 14, 0, 0, Math.PI * 2);
        ctx.fill();

        // Hair
        ctx.fillStyle = '#3d2314';
        ctx.beginPath();
        ctx.arc(32, 10, 12, Math.PI, 0);
        ctx.fill();

        // Hat (optional)
        if (hatColor) {
            ctx.fillStyle = hatColor;
            ctx.fillRect(18, 2, 28, 8);
            ctx.fillRect(22, 0, 20, 4);
        }

        // Face features
        ctx.fillStyle = '#000';
        ctx.fillRect(24, 14, 4, 4); // Left eye
        ctx.fillRect(36, 14, 4, 4); // Right eye

        // Glasses (optional)
        if (hasGlasses) {
            ctx.strokeStyle = '#222';
            ctx.lineWidth = 2;
            ctx.strokeRect(22, 12, 8, 8);
            ctx.strokeRect(34, 12, 8, 8);
            ctx.beginPath();
            ctx.moveTo(30, 16);
            ctx.lineTo(34, 16);
            ctx.stroke();
        }

        // Mustache (optional)
        if (hasMustache) {
            ctx.fillStyle = '#3d2314';
            ctx.fillRect(26, 22, 12, 3);
        }

        // Mouth
        ctx.fillStyle = '#000';
        ctx.fillRect(28, 24, 8, 2);

        // Shirt
        ctx.fillStyle = shirtColor;
        ctx.fillRect(28, 28, 8, 14);

        // Tie
        ctx.fillStyle = tieColor;
        ctx.beginPath();
        ctx.moveTo(32, 30);
        ctx.lineTo(28, 42);
        ctx.lineTo(32, 44);
        ctx.lineTo(36, 42);
        ctx.closePath();
        ctx.fill();
    });

    createSprite('enemy_pain' + nameSuffix, (ctx) => {
        // Body
        ctx.fillStyle = suitColor;
        ctx.fillRect(18, 28, 28, 36);
        ctx.fillRect(12, 30, 8, 12);
        ctx.fillRect(44, 30, 8, 12);

        // Head (tilted)
        ctx.save();
        ctx.translate(32, 20);
        ctx.rotate(0.15);
        ctx.fillStyle = '#E8C4A0';
        ctx.beginPath();
        ctx.ellipse(0, -4, 12, 14, 0, 0, Math.PI * 2);
        ctx.fill();

        // Pain expression
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.moveTo(-10, -2);
        ctx.lineTo(-4, 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(4, 2);
        ctx.lineTo(10, -2);
        ctx.stroke();

        // Open mouth
        ctx.fillStyle = '#600';
        ctx.beginPath();
        ctx.ellipse(0, 6, 5, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Red flash overlay
        ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
        ctx.fillRect(0, 0, 64, 64);
    });

    createSprite('enemy_dead' + nameSuffix, (ctx) => {
        // Body lying down
        ctx.fillStyle = suitColor;
        ctx.fillRect(6, 48, 52, 12);

        // Arms splayed
        ctx.fillRect(2, 52, 10, 6);
        ctx.fillRect(52, 52, 10, 6);

        // Head
        ctx.fillStyle = '#E8C4A0';
        ctx.beginPath();
        ctx.ellipse(10, 54, 8, 6, -0.5, 0, Math.PI * 2);
        ctx.fill();

        // Paint splatter
        ctx.fillStyle = '#f00';
        ctx.beginPath();
        ctx.arc(32, 54, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#c00';
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.arc(20 + Math.random() * 28, 48 + Math.random() * 12, 3 + Math.random() * 4, 0, Math.PI * 2);
            ctx.fill();
        }
    });
}

// Sprite: Table
createSprite('table', (ctx) => {
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(10, 20, 44, 10); // Top
    ctx.fillRect(14, 30, 6, 30); // Leg L
    ctx.fillRect(44, 30, 6, 30); // Leg R
    ctx.fillStyle = '#A0522D'; // Highlight
    ctx.fillRect(12, 22, 40, 4);
});

// === ENEMY TYPES ===
// Type 0: Guard - Blue suit, basic
createEnemy('_0', {
    suitColor: '#1a3c6e',
    shirtColor: '#ffffff',
    tieColor: '#aa2222',
    hasGlasses: false,
    hasMustache: false,
    hatColor: null
});

// Type 1: Manager - Gray suit with glasses
createEnemy('_1', {
    suitColor: '#4a4a5a',
    shirtColor: '#e8e8f0',
    tieColor: '#333366',
    hasGlasses: true,
    hasMustache: false,
    hatColor: null
});

// Type 2: Executive - Black suit with hat
createEnemy('_2', {
    suitColor: '#1a1a1a',
    shirtColor: '#f0f0f0',
    tieColor: '#aa8800',
    hasGlasses: true,
    hasMustache: true,
    hatColor: '#2a2a2a'
});

// Type 3: BOSS - The Head Designer - Giant, intimidating
createEnemy('_boss', {
    suitColor: '#440000',       // Deep red suit
    shirtColor: '#1a1a1a',      // Black shirt
    tieColor: '#ffcc00',        // Gold tie
    hasGlasses: false,
    hasMustache: true,
    hatColor: '#220000'         // Dark red crown-like hat
});

// Sprite: Ammo (Paint Bucket)
createSprite('ammo', (ctx) => {
    ctx.fillStyle = '#bbb';
    ctx.fillRect(20, 20, 24, 30);
    ctx.fillStyle = '#00f'; // Blue paint
    ctx.fillRect(22, 22, 20, 10);
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(32, 20, 10, Math.PI, 0); ctx.stroke(); // Handle
});

// Sprite: Health (Fritos Bag)
createSprite('health', (ctx) => {
    if (typeof ASSET_DATA !== 'undefined' && ASSET_DATA.fritos) {
        const img = new Image();
        img.onload = () => {
            // High-res clear
            ctx.clearRect(0, 0, 256, 256);

            // Shadow (scaled up 4x from original 32,56,16,6)
            ctx.fillStyle = 'rgba(0,0,0,0.4)';
            ctx.beginPath();
            ctx.ellipse(128, 224, 64, 24, 0, 0, Math.PI * 2);
            ctx.fill();

            // Draw Bag (Centered and sized to fit 256x256)
            // Scaling up the previous 12,10,40,44 rect by ~4x
            ctx.drawImage(img, 48, 40, 160, 176);
        };
        img.src = ASSET_DATA.fritos;
    } else {
        // Fallback Error Box (Scaled)
        ctx.fillStyle = '#ff00ff';
        ctx.fillRect(64, 64, 128, 128);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 60px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText("?", 128, 128);
    }
}, 256, 256); // Use 256x256 resolution

// Sprite: Table Money (Gold Coin Stack)
createSprite('money', (ctx) => {
    // Gold coin stack with $ symbol
    ctx.fillStyle = '#d4af37'; // Gold base
    ctx.beginPath();
    ctx.ellipse(32, 48, 22, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#c9a227'; // Darker middle coin
    ctx.beginPath();
    ctx.ellipse(32, 40, 20, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d4af37'; // Top coin
    ctx.beginPath();
    ctx.ellipse(32, 32, 18, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    // $ symbol
    ctx.fillStyle = '#8b7500';
    ctx.font = 'bold 18px serif';
    ctx.textAlign = 'center';
    ctx.fillText('$', 32, 38);
    // Shine highlight
    ctx.fillStyle = 'rgba(255, 255, 200, 0.4)';
    ctx.beginPath();
    ctx.ellipse(26, 28, 6, 3, -0.3, 0, Math.PI * 2);
    ctx.fill();
});

// Sprite: Gold Bar (High Value Pickup)
createSprite('goldBar', (ctx) => {
    // Shiny gold ingot shape
    ctx.fillStyle = '#d4af37'; // Gold

    // 3D bar effect - top
    ctx.beginPath();
    ctx.moveTo(16, 32);
    ctx.lineTo(32, 24);
    ctx.lineTo(48, 32);
    ctx.lineTo(32, 40);
    ctx.closePath();
    ctx.fill();

    // Front face
    ctx.fillStyle = '#c9a227';
    ctx.beginPath();
    ctx.moveTo(16, 32);
    ctx.lineTo(32, 40);
    ctx.lineTo(32, 52);
    ctx.lineTo(16, 44);
    ctx.closePath();
    ctx.fill();

    // Right face
    ctx.fillStyle = '#b8960f';
    ctx.beginPath();
    ctx.moveTo(32, 40);
    ctx.lineTo(48, 32);
    ctx.lineTo(48, 44);
    ctx.lineTo(32, 52);
    ctx.closePath();
    ctx.fill();

    // Shine highlight
    ctx.fillStyle = 'rgba(255, 255, 200, 0.5)';
    ctx.beginPath();
    ctx.ellipse(28, 30, 8, 4, -0.5, 0, Math.PI * 2);
    ctx.fill();
});

// Sprite: Table Leg Weapon Pickup
createSprite('weaponPickup_tableLeg', (ctx) => {
    // Glow effect
    ctx.shadowColor = '#ffcc00';
    ctx.shadowBlur = 15;

    // Table leg (wooden, broken at top)
    const gradWood = ctx.createLinearGradient(24, 0, 40, 0);
    gradWood.addColorStop(0, '#5D4037');
    gradWood.addColorStop(0.3, '#8D6E63');
    gradWood.addColorStop(0.7, '#795548');
    gradWood.addColorStop(1, '#4E342E');

    ctx.fillStyle = gradWood;
    // Main leg shaft
    ctx.fillRect(26, 10, 12, 50);

    // Broken/jagged top
    ctx.beginPath();
    ctx.moveTo(26, 10);
    ctx.lineTo(28, 5);
    ctx.lineTo(32, 12);
    ctx.lineTo(35, 4);
    ctx.lineTo(38, 10);
    ctx.lineTo(38, 10);
    ctx.lineTo(26, 10);
    ctx.fill();

    // Wood grain lines
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(28, 15); ctx.lineTo(28, 55);
    ctx.moveTo(32, 12); ctx.lineTo(32, 58);
    ctx.moveTo(36, 15); ctx.lineTo(36, 55);
    ctx.stroke();

    // Foot pad at bottom
    ctx.fillStyle = '#3E2723';
    ctx.fillRect(24, 55, 16, 6);

    ctx.shadowBlur = 0;
});

// HUD Face - Sandy (Happy)
const faceHappy = createSprite('face_happy', (ctx) => {
    // Background
    ctx.fillStyle = '#444'; ctx.fillRect(0, 0, 64, 64);

    // Skin (Slightly more matured tone)
    ctx.fillStyle = '#e0ac69';
    ctx.beginPath(); ctx.arc(32, 32, 26, 0, Math.PI * 2); ctx.fill();

    // Hair (Short Brown Bob)
    ctx.fillStyle = '#5D4037';
    ctx.beginPath();
    ctx.arc(32, 28, 28, Math.PI, 0); // Top
    ctx.lineTo(58, 45); // Right side
    ctx.lineTo(50, 45); // Trim
    ctx.lineTo(50, 28);
    ctx.lineTo(14, 28);
    ctx.lineTo(14, 45); // Left side trim
    ctx.lineTo(6, 45);
    ctx.fill();

    // Wrinkles (Age lines)
    ctx.strokeStyle = '#c68c53';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(20, 40); ctx.lineTo(24, 42); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(44, 40); ctx.lineTo(40, 42); ctx.stroke();

    // Eyes
    ctx.fillStyle = '#000';
    ctx.fillRect(20, 28, 6, 6); ctx.fillRect(38, 28, 6, 6);

    // Glasses
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.strokeRect(18, 26, 10, 10);
    ctx.strokeRect(36, 26, 10, 10);
    ctx.beginPath(); ctx.moveTo(28, 31); ctx.lineTo(36, 31); ctx.stroke(); // Bridge

    // Smile
    ctx.beginPath(); ctx.arc(32, 48, 8, 0, Math.PI); ctx.stroke();
});

// HUD Face - Sandy (Ouch)
const faceOuch = createSprite('face_ouch', (ctx) => {
    // Background
    ctx.fillStyle = '#444'; ctx.fillRect(0, 0, 64, 64);

    // Skin
    ctx.fillStyle = '#e0ac69';
    ctx.beginPath(); ctx.arc(32, 32, 26, 0, Math.PI * 2); ctx.fill();

    // Hair
    ctx.fillStyle = '#5D4037';
    ctx.beginPath(); ctx.arc(32, 28, 28, Math.PI, 0); ctx.lineTo(58, 45); ctx.lineTo(6, 45); ctx.fill();

    // Glasses (Askew)
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.save();
    ctx.translate(32, 32);
    ctx.rotate(0.2);
    ctx.strokeRect(-14, -6, 10, 10);
    ctx.strokeRect(4, -6, 10, 10);
    ctx.beginPath(); ctx.moveTo(-4, -1); ctx.lineTo(4, -1); ctx.stroke();
    ctx.restore();

    // Eyes (Closed/Wince)
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(18, 28); ctx.lineTo(26, 32); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(36, 32); ctx.lineTo(44, 28); ctx.stroke();

    // Mouth (Ouch)
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(32, 52, 6, 0, Math.PI * 2); ctx.fill();
});
