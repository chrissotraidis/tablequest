/**
 * RENDERER & RAYCASTER
 */
let rays = []; // For rendering sprites correctly
let texDataCache = {};

function getTexData(name) {
    // If not cached or (optional) texture updated, fetch it
    // Since images load async, we might want to refresh if we cached the fallback noise
    // For now, let's assume assets are preloaded or we accept one-time cache.
    // To be safe, let's check a flag or just cache once.
    if (!texDataCache[name]) {
        if (!textures[name]) return null;
        const tCtx = textures[name].getContext('2d');
        const iData = tCtx.getImageData(0, 0, 128, 128);
        texDataCache[name] = new Uint32Array(iData.data.buffer);
    }
    return texDataCache[name];
}

function drawGame() {
    // Clear Floor/Ceiling
    ctx.fillStyle = '#333'; // Floor
    ctx.fillRect(0, SCREEN_HEIGHT / 2, SCREEN_WIDTH, SCREEN_HEIGHT / 2);
    ctx.fillStyle = '#111'; // Ceiling
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT / 2);

    if (gameState === 'menu') {
        // drawMenu(); // REMOVED: Using HD HTML Menu
        return;
    }

    // Draw 3D View (Scaled to leave room for HUD if we want, or just overlay)
    // Let's overlay for now to keep aspect ratio simple, or just draw bar at bottom.
    // The raycasting loop uses SCREEN_HEIGHT. We should probably limit the view to SCREEN_HEIGHT - 64.

    // Casting Rays
    // Casting Rays
    rays = [];
    const viewHeight = SCREEN_HEIGHT; // Full screen view

    // Draw Floor/Ceiling restricted to viewHeight
    const floorData = getTexData('floor');
    const ceilData = getTexData('ceil');
    const SIZE = 128; // Texture resolution

    if (floorData && ceilData) {
        // Raycast Floor & Ceiling
        const buffer = ctx.createImageData(SCREEN_WIDTH, viewHeight);
        const buf32 = new Uint32Array(buffer.data.buffer);

        // Pre-calculate direction vectors for left/right ray
        const dirX = Math.cos(player.rot);
        const dirY = Math.sin(player.rot);
        const planeX = -Math.sin(player.rot) * (FOV / 1.5); // Approximation
        const planeY = Math.cos(player.rot) * (FOV / 1.5);

        for (let y = Math.floor(viewHeight / 2); y < viewHeight; y++) {
            // Horizontal line distance
            const p = y - viewHeight / 2;
            const posZ = 0.5 * viewHeight;
            const rowDistance = posZ / p;

            // Proper Floor Casting Math
            // RayDir0 = dir - plane
            // RayDir1 = dir + plane
            // We use a simplified loop per pixel to match standard raycasting

            // Actually, let's stick to the per-column method angle if we want ease,
            // but for a flat floor, row-based scanning is faster and correct for affine mapping.
            // Let's use the standard "Lodev" loop style for correct floor mapping.

            const rayDirX0 = dirX - planeX;
            const rayDirY0 = dirY - planeY;
            const rayDirX1 = dirX + planeX;
            const rayDirY1 = dirY + planeY;

            const rowStepX = rowDistance * (rayDirX1 - rayDirX0) / SCREEN_WIDTH;
            const rowStepY = rowDistance * (rayDirY1 - rayDirY0) / SCREEN_WIDTH;

            let floorX = player.x + rowDistance * rayDirX0;
            let floorY = player.y + rowDistance * rayDirY0;

            for (let x = 0; x < SCREEN_WIDTH; x++) {
                // Scale factor: larger = bigger tiles = less visible "swimming"
                const FLOOR_TEXTURE_SCALE = 4.0;
                const scaledFloorX = floorX / FLOOR_TEXTURE_SCALE;
                const scaledFloorY = floorY / FLOOR_TEXTURE_SCALE;

                const tx = Math.floor(scaledFloorX * SIZE) & (SIZE - 1);
                const ty = Math.floor(scaledFloorY * SIZE) & (SIZE - 1);

                floorX += rowStepX;
                floorY += rowStepY;

                // Floor
                const floorColor = floorData[ty * SIZE + tx];
                // Apply a simple distance fade (fog)
                // Since this is 32-bit int color, it's hard to modify directly without unpacking.
                // We'll skip per-pixel fog on floor for now or do it post-process overlay.
                buf32[y * SCREEN_WIDTH + x] = floorColor;

                // Ceiling (symmetrical)
                buf32[(viewHeight - y - 1) * SCREEN_WIDTH + x] = ceilData[ty * SIZE + tx];
            }
        }
        ctx.putImageData(buffer, 0, 0);

        // Gradient overlay for depth/shadow
        const grad = ctx.createRadialGradient(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, 10, SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, SCREEN_HEIGHT);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, 'rgba(0,0,0,0.8)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    } else {
        // Fallback
        ctx.fillStyle = '#333';
        ctx.fillRect(0, viewHeight / 2, SCREEN_WIDTH, viewHeight / 2);
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, SCREEN_WIDTH, viewHeight / 2);
    }

    for (let x = 0; x < SCREEN_WIDTH; x++) {
        const rayAngle = (player.rot - FOV / 2.0) + (x / SCREEN_WIDTH) * FOV;
        const eyeX = Math.cos(rayAngle);
        const eyeY = Math.sin(rayAngle);

        let distToWall = 0;
        let hitWall = false;
        let wallType = 0;

        let testX = Math.floor(player.x);
        let testY = Math.floor(player.y);
        let stepX = Math.sign(eyeX);
        let stepY = Math.sign(eyeY);
        let sideDistX = (stepX < 0 ? player.x - testX : testX + 1 - player.x) / Math.abs(eyeX);
        let sideDistY = (stepY < 0 ? player.y - testY : testY + 1 - player.y) / Math.abs(eyeY);
        let deltaDistX = Math.abs(1 / eyeX);
        let deltaDistY = Math.abs(1 / eyeY);
        let side = 0;

        while (!hitWall && distToWall < MAX_DEPTH) {
            if (sideDistX < sideDistY) {
                sideDistX += deltaDistX;
                testX += stepX;
                side = 0;
            } else {
                sideDistY += deltaDistY;
                testY += stepY;
                side = 1;
            }
            if (testX < 0 || testX >= mapWidth || testY < 0 || testY >= mapHeight) {
                hitWall = true; distToWall = MAX_DEPTH;
            } else {
                if (worldMap[testY * mapWidth + testX] > 0) {
                    hitWall = true;
                    wallType = worldMap[testY * mapWidth + testX];
                }
            }
        }

        if (side === 0) distToWall = (testX - player.x + (1 - stepX) / 2) / eyeX;
        else distToWall = (testY - player.y + (1 - stepY) / 2) / eyeY;

        let correctedDist = distToWall * Math.cos(rayAngle - player.rot);

        // Calculate Height based on viewHeight
        const ceiling = viewHeight / 2.0 - viewHeight / correctedDist;
        const floor = viewHeight - ceiling;
        const wallHeight = floor - ceiling;

        let wallX;
        if (side == 0) wallX = player.y + distToWall * eyeY;
        else wallX = player.x + distToWall * eyeX;
        wallX -= Math.floor(wallX);

        // Texture Setup
        let tex = textures['wall'];
        if (wallType === 2) tex = textures['wood'];
        else if (wallType === 9) tex = textures['door']; // Elevator
        else if (wallType === 3) tex = textures['door'];
        else if (wallType === 4) tex = textures['gate'];
        else if (wallType === 5) tex = textures['stone'];    // Dungeon stone
        else if (wallType === 6) tex = textures['concrete']; // Industrial
        else if (wallType === 7) tex = textures['office'];   // Office panels
        else if (wallType === 8) tex = textures['metal'];    // Metal wall

        // Calculate texture X coordinate (0-127)
        // Calculate texture X coordinate (0-127)
        // Fix scanning/mirroring by inverting coordinate based on side/direction
        let texX = Math.floor(wallX * 128);
        if (side === 0 && eyeX > 0) texX = 128 - texX - 1;
        if (side === 1 && eyeY < 0) texX = 128 - texX - 1;

        ctx.globalAlpha = 1;
        if (distToWall < MAX_DEPTH) {
            // Draw texture strip
            // Source: texX, 0, width: 1, height: 128
            // Dest: x, ceiling, width: 1, height: wallHeight
            ctx.drawImage(tex, texX, 0, 1, 128, x, ceiling, 1, wallHeight);

            if (side === 1) {
                ctx.fillStyle = `rgba(0,0,0,0.3)`;
                ctx.fillRect(x, ceiling, 1, wallHeight);
            }
            ctx.fillStyle = `rgba(0,0,0,${Math.min(1, distToWall / 25)})`;
            ctx.fillRect(x, ceiling, 1, wallHeight);
        }
        rays[x] = distToWall;
    }

    // Draw Sprites needs to know viewHeight too
    drawSprites(viewHeight);

    // Draw Weapon needs to be adjusted
    drawWeapon(viewHeight);

    // Draw HUD
    // drawStatusBar(); // REMOVED: Using HTML HUD

    // Interaction Prompt
    const checkDist = 1.0;
    const checkX = Math.floor(player.x + Math.cos(player.rot) * checkDist);
    const checkY = Math.floor(player.y + Math.sin(player.rot) * checkDist);

    if (checkX >= 0 && checkX < mapWidth && checkY >= 0 && checkY < mapHeight) {
        if (worldMap[checkY * mapWidth + checkX] === 3) {
            // Facing Door
            ctx.textAlign = 'center';
            ctx.font = 'bold 20px "Courier New"';
            const pulse = (Math.sin(Date.now() / 200) + 1) / 2;
            ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + pulse * 0.5})`;
            ctx.shadowColor = 'black';
            ctx.shadowBlur = 4;
            ctx.fillText("OPEN [E]", SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 20);
            ctx.shadowBlur = 0;
        }
    }
}

function drawSprites(viewHeight = SCREEN_HEIGHT) {
    // 1. Calculate distance to each sprite
    gameObjects.forEach(sprite => {
        sprite.dist = Math.sqrt((player.x - sprite.x) ** 2 + (player.y - sprite.y) ** 2);
    });

    // 2. Sort far to near
    gameObjects.sort((a, b) => b.dist - a.dist);

    // 3. Project and Draw
    gameObjects.forEach(sprite => {
        if (!sprite.active && sprite.state !== 'dead') return;
        if (sprite.dist < 0.2) return; // Clipping

        const dx = sprite.x - player.x;
        const dy = sprite.y - player.y;

        const spriteDir = Math.atan2(dy, dx) - player.rot;
        let spriteAngle = spriteDir;
        while (spriteAngle < -Math.PI) spriteAngle += Math.PI * 2;
        while (spriteAngle > Math.PI) spriteAngle -= Math.PI * 2;

        if (Math.abs(spriteAngle) < FOV / 1.5) {
            const screenX = (0.5 * (spriteAngle / (FOV / 2)) + 0.5) * SCREEN_WIDTH;
            const spriteHeight = Math.abs(viewHeight / sprite.dist); // Use viewHeight
            const spriteTop = (viewHeight - spriteHeight) / 2; // Center in viewHeight
            const spriteWidth = spriteHeight;

            const checkX = Math.floor(Math.max(0, Math.min(SCREEN_WIDTH - 1, screenX)));

            // Basic Z-check
            if (checkX >= 0 && checkX < SCREEN_WIDTH && rays[checkX] > sprite.dist) {
                let img = null;
                if (sprite.type === 'table') img = sprites['table'];
                else if (sprite.type === 'ammo') img = sprites['ammo'];
                else if (sprite.type === 'health') img = sprites['health'];
                else if (sprite.type === 'money') img = sprites['money'];
                else if (sprite.type === 'goldBar') img = sprites['goldBar'];
                else if (sprite.type === 'weaponPickup') img = sprites['weaponPickup_' + sprite.weaponType];
                else if (sprite.type === 'enemy') {
                    const suffix = (sprite.variant !== undefined) ? '_' + sprite.variant : '_0';
                    if (sprite.state === 'dead') img = sprites['enemy_dead' + suffix];
                    else if (sprite.state === 'pain') img = sprites['enemy_pain' + suffix];
                    else img = sprites['enemy_idle' + suffix];
                }

                if (img) {
                    ctx.drawImage(img, screenX - spriteWidth / 2, spriteTop + (sprite.dist > 0 ? 20 / sprite.dist : 0), spriteWidth, spriteHeight);
                } else if (sprite.type === 'projectile') {
                    // Draw Projectile (Paint Blob)
                    const size = spriteWidth / 3;
                    ctx.fillStyle = sprite.color || '#ff4400';

                    // Lower player projectiles so they don't block view
                    const yOffset = (sprite.owner === 'player') ? spriteHeight * 0.8 : 0;

                    ctx.beginPath();
                    ctx.arc(screenX, spriteTop + spriteHeight / 2 + yOffset, size, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            }
        }
    });
}

// function drawStatusBar() { ... } REMOVED


function drawMenu() {
    // Epic Background Gradient
    const grad = ctx.createLinearGradient(0, 0, 0, SCREEN_HEIGHT);
    grad.addColorStop(0, '#000040');
    grad.addColorStop(0.5, '#000080'); // Wolf3D Blue
    grad.addColorStop(1, '#000040');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    // Vignette
    const rad = ctx.createRadialGradient(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, SCREEN_HEIGHT / 4, SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, SCREEN_HEIGHT);
    rad.addColorStop(0, 'rgba(0,0,0,0)');
    rad.addColorStop(1, 'rgba(0,0,0,0.6)');
    ctx.fillStyle = rad;
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);


    // Read This Screen
    if (showReadThis) {
        ctx.fillStyle = 'rgba(0,0,0,0.9)'; // Darker
        ctx.fillRect(20, 20, SCREEN_WIDTH - 40, SCREEN_HEIGHT - 40);
        ctx.strokeStyle = MENU_COLORS.highlight;
        ctx.lineWidth = 4;
        ctx.strokeRect(20, 20, SCREEN_WIDTH - 40, SCREEN_HEIGHT - 40);

        ctx.fillStyle = MENU_COLORS.text;
        ctx.font = 'bold 16px "Courier New"';
        ctx.textAlign = 'center';
        ctx.fillText("INSTRUCTIONS", SCREEN_WIDTH / 2, 50);

        ctx.font = '12px "Courier New"';
        ctx.fillStyle = '#ddd';

        // Manual Lines
        const lines = [
            "Sandy needs her tables!",
            "Explore the floors, find tables.",
            "Shoot Designers with paint.",
            "Open doors with [E].",
            "",
            "CONTROLS:",
            "WASD/Arrows : Move",
            "SPACE       : Fire Paint",
            "E           : Open Door",
            "ESC         : Menu/Pause"
        ];

        let ly = 80;
        lines.forEach(line => {
            ctx.fillText(line, SCREEN_WIDTH / 2, ly);
            ly += 16;
        });

        ctx.fillStyle = MENU_COLORS.highlight;
        ctx.font = '14px "Courier New"';
        ctx.fillText("PRESS ENTER TO RETURN", SCREEN_WIDTH / 2, SCREEN_HEIGHT - 40);
        return;
    }

    // Animated Title
    const time = Date.now() / 500;
    const sway = Math.sin(time) * 5;

    ctx.save();
    ctx.translate(0, sway);

    ctx.shadowColor = 'black';
    ctx.shadowOffsetX = 4;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = MENU_COLORS.highlight;
    ctx.font = 'bold 36px "Verdana"'; // Bigger font
    ctx.textAlign = 'center';

    // Draw Title with stroke
    ctx.strokeStyle = '#3e2723';
    ctx.lineWidth = 2;
    ctx.strokeText("SANDY'S", SCREEN_WIDTH / 2, 60);
    ctx.fillText("SANDY'S", SCREEN_WIDTH / 2, 60);

    ctx.strokeText("TABLE QUEST", SCREEN_WIDTH / 2, 100);
    ctx.fillText("TABLE QUEST", SCREEN_WIDTH / 2, 100);

    ctx.restore();

    ctx.shadowColor = 'transparent';

    // Menu Items
    ctx.font = 'bold 20px "Courier New"';
    const startY = 140;
    const gap = 25;

    menuItems.forEach((item, idx) => {
        const isSelected = (idx === menuIdx);
        let prefix = "";

        if (isSelected) {
            ctx.fillStyle = '#fff';
            // Pulsing cursor
            const pulse = (Math.sin(Date.now() / 150) + 1) / 2; // 0 to 1
            const alpha = 0.5 + pulse * 0.5;

            // Draw Paintbrush Cursor
            ctx.fillStyle = `rgba(0, 0, 255, ${alpha})`;
            ctx.fillRect(50, startY + idx * gap - 12, 15, 6);
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(40, startY + idx * gap - 12, 10, 6); // Handle

            ctx.fillStyle = '#fff';
            ctx.shadowColor = '#00f';
            ctx.shadowBlur = 10 * pulse;
            prefix = "> ";
        } else {
            ctx.fillStyle = '#888';
            ctx.shadowBlur = 0;
            prefix = "  ";
        }

        ctx.textAlign = 'left';
        ctx.fillText(item, 80, startY + idx * gap);
        ctx.shadowBlur = 0;
    });

    // Version / Footer
    ctx.fillStyle = '#555';
    ctx.font = '8px "Courier New"';
    ctx.textAlign = 'center';
    ctx.fillText("v1.0 - The Furniture Operations", SCREEN_WIDTH / 2, SCREEN_HEIGHT - 5);
}

function drawWeapon(viewHeight = SCREEN_HEIGHT) {
    // Get current weapon type
    const weaponKey = player.weapons[player.currentWeapon];

    if (weaponKey === 'tableLeg') {
        drawTableLegWeapon(viewHeight);
    } else {
        drawPaintbrushWeapon(viewHeight);
    }
}

function drawPaintbrushWeapon(viewHeight = SCREEN_HEIGHT) {
    // Paintbrush (Original weapon)
    const kick = gunOffset;
    const sway = Math.sin(Date.now() / 300) * 5;

    const centerX = SCREEN_WIDTH / 2;
    const baseY = SCREEN_HEIGHT - 30;
    const S = 0.5;

    const wx = centerX + 80 + (kick * 2) + sway;
    const wy = baseY + (kick * 10);

    ctx.save();
    ctx.translate(wx, wy);
    const angle = -0.3 - (kick * 0.08);
    ctx.rotate(angle);
    ctx.scale(S, S);

    // 1. Handle (Wood)
    const gradHandle = ctx.createLinearGradient(-15, 0, 15, 0);
    gradHandle.addColorStop(0, '#5D4037');
    gradHandle.addColorStop(0.5, '#8D6E63');
    gradHandle.addColorStop(1, '#4E342E');
    ctx.fillStyle = gradHandle;
    ctx.beginPath();
    ctx.rect(-15, -200, 30, 200);
    ctx.fill();

    // 2. Ferrule (Metal part)
    const gradMetal = ctx.createLinearGradient(-16, -260, 16, -260);
    gradMetal.addColorStop(0, '#9E9E9E');
    gradMetal.addColorStop(0.3, '#F5F5F5');
    gradMetal.addColorStop(0.6, '#BDBDBD');
    gradMetal.addColorStop(1, '#757575');
    ctx.fillStyle = gradMetal;
    ctx.fillRect(-17, -260, 34, 60);

    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(-17, -250, 34, 2);
    ctx.fillRect(-17, -220, 34, 2);

    // 3. Bristles
    ctx.fillStyle = '#D7CCC8';
    ctx.beginPath();
    ctx.moveTo(-16, -260);
    ctx.lineTo(16, -260);
    ctx.lineTo(24, -340);
    ctx.quadraticCurveTo(0, -360, -24, -340);
    ctx.closePath();
    ctx.fill();

    // 4. Paint on Tip
    const paintColor = `hsl(${Date.now() / 10 % 360}, 100%, 50%)`;
    ctx.fillStyle = paintColor;
    ctx.beginPath();
    ctx.moveTo(-20, -310);
    ctx.lineTo(20, -310);
    ctx.lineTo(24, -340);
    ctx.quadraticCurveTo(0, -360, -24, -340);
    ctx.closePath();
    ctx.fill();

    // 5. Texture lines
    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = -18; i <= 18; i += 3) {
        ctx.moveTo(i, -260);
        ctx.quadraticCurveTo(i * 1.2, -300, i * 1.5, -340);
    }
    ctx.stroke();

    ctx.restore();
}

function drawTableLegWeapon(viewHeight = SCREEN_HEIGHT) {
    // Table Leg - Heavy melee weapon with swing animation
    const kick = gunOffset;
    const sway = Math.sin(Date.now() / 200) * 2;

    const centerX = SCREEN_WIDTH / 2;
    const baseY = SCREEN_HEIGHT - 20;
    const S = 0.6;

    // Melee swing: translate horizontally and rotate more dramatically
    const swingProgress = kick / 30; // 0 to 1 during attack
    const swingX = swingProgress * -60; // Swing from right to left
    const swingAngle = swingProgress * 0.8; // Big rotation during swing

    const wx = centerX + 70 + swingX + sway;
    const wy = baseY;

    ctx.save();
    ctx.translate(wx, wy);
    const angle = -0.2 - swingAngle;
    ctx.rotate(angle);
    ctx.scale(S, S);

    // Motion blur effect during swing
    if (kick > 10) {
        ctx.globalAlpha = 0.3;
        ctx.save();
        ctx.translate(40, 0);
        ctx.rotate(0.2);
        drawTableLegShape();
        ctx.restore();
        ctx.globalAlpha = 1;
    }

    drawTableLegShape();

    ctx.restore();
}

// Separated shape drawing for motion blur
function drawTableLegShape() {
    // 1. Main leg shaft (wooden)
    const gradWood = ctx.createLinearGradient(-20, 0, 20, 0);
    gradWood.addColorStop(0, '#5D4037');
    gradWood.addColorStop(0.3, '#8D6E63');
    gradWood.addColorStop(0.7, '#795548');
    gradWood.addColorStop(1, '#4E342E');
    ctx.fillStyle = gradWood;
    ctx.fillRect(-18, -280, 36, 280);

    // 2. Wood grain texture
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = -12; i <= 12; i += 6) {
        ctx.moveTo(i, 0);
        ctx.lineTo(i, -280);
    }
    ctx.stroke();

    // 3. Broken jagged top
    ctx.fillStyle = gradWood;
    ctx.beginPath();
    ctx.moveTo(-18, -280);
    ctx.lineTo(-12, -310);
    ctx.lineTo(-4, -290);
    ctx.lineTo(4, -320);
    ctx.lineTo(12, -295);
    ctx.lineTo(18, -305);
    ctx.lineTo(18, -280);
    ctx.closePath();
    ctx.fill();

    // 4. Splintered edges
    ctx.strokeStyle = '#3E2723';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-10, -285);
    ctx.lineTo(-14, -300);
    ctx.moveTo(6, -290);
    ctx.lineTo(4, -315);
    ctx.moveTo(14, -285);
    ctx.lineTo(16, -298);
    ctx.stroke();

    // 5. Foot mounting bracket
    ctx.fillStyle = '#3E2723';
    ctx.fillRect(-22, -10, 44, 20);

    // 6. Metal screws
    ctx.fillStyle = '#9E9E9E';
    ctx.beginPath();
    ctx.arc(-12, 0, 3, 0, Math.PI * 2);
    ctx.arc(12, 0, 3, 0, Math.PI * 2);
    ctx.fill();
}

