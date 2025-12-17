/**
 * GAME STATE & LOGIC
 */

// Menu State
let menuIdx = 0;
const menuItems = ['NEW GAME', 'LEVEL SELECT', 'INSTRUCTIONS', 'QUIT'];
let showReadThis = false;
let showLevelSelect = false;
let levelSelectIdx = 0;

// Weapon Definitions
const WEAPONS = {
    paintbrush: {
        name: 'PAINTBRUSH',
        type: 'ranged',
        damage: 15,
        cooldown: 15,
        ammoCost: 1,
        projectileColor: () => `hsl(${Math.random() * 360}, 100%, 50%)`, // Rainbow
        description: 'A colorful paintbrush for flinging paint!'
    },
    tableLeg: {
        name: 'TABLE LEG',
        type: 'melee',
        damage: 40,        // High melee damage
        cooldown: 30,      // Slow swing
        ammoCost: 0,       // No ammo for melee!
        range: 1.5,        // Melee range in world units
        arc: Math.PI / 2,  // 90 degree swing arc
        description: 'Swing this heavy table leg at close range!'
    }
};

// Game State
let player = {
    x: 0, y: 0, dir: 0, // x, y in block coords
    rot: 0, // Rotation in radians
    speed: 0.06,
    rotSpeed: 0.012, // Smoother rotation (was 0.02)
    health: 100,
    ammo: 20,
    tables: 0,
    weapons: ['paintbrush'], // Unlocked weapons
    currentWeapon: 0          // Index into weapons array
};

// 0: Empty, 1: Wall, 2: Wood Wall, 9: Elevator
let worldMap = [];
let mapWidth = 0;
let mapHeight = 0;
let gameObjects = []; // Enemies, Items
let level = 1;
let requiredTables = 0;
let gameState = 'start'; // start, menu, play, win, lose
let gunOffset = 0; // Animation for gun
let gunCoolDown = 0;
let lastStepTime = 0; // For audio timing

// Enemy stats by variant type
function getEnemyStats(variant) {
    const types = {
        0: { detectRange: 8, attackRange: 5, moveSpeed: 0.02, attackCooldown: 3500, health: 25 },
        1: { detectRange: 10, attackRange: 6, moveSpeed: 0.03, attackCooldown: 2500, health: 35 },
        2: { detectRange: 12, attackRange: 8, moveSpeed: 0.04, attackCooldown: 2000, health: 50 },
        'boss': { detectRange: 20, attackRange: 15, moveSpeed: 0.025, attackCooldown: 1500, health: 500 }
    };
    return types[variant] || types[0];
}

function loadLevel(lvlIdx) {
    if (lvlIdx >= levels.length) {
        showScreen('victory-screen');
        gameState = 'victory';
        return;
    }

    level = lvlIdx + 1;
    const layout = levels[lvlIdx];
    mapHeight = layout.length;
    mapWidth = layout[0].length;
    worldMap = new Int8Array(mapWidth * mapHeight);
    gameObjects = [];
    player.tables = 0;
    requiredTables = 0;

    for (let y = 0; y < mapHeight; y++) {
        for (let x = 0; x < mapWidth; x++) {
            const char = layout[y][x];
            let type = 0;
            if (char === '#') type = 1;      // Brick wall
            else if (char === 'W') type = 2; // Wood
            else if (char === 'E') type = 9; // Elevator
            else if (char === '+') type = 3; // Door
            else if (char === 'X') type = 4; // Elevator Gate (Locked)
            else if (char === 'B') type = 5; // Stone/dungeon block
            else if (char === 'C') type = 6; // Concrete
            else if (char === 'O') type = 7; // Office panel
            else if (char === 'M') type = 8; // Metal wall

            worldMap[y * mapWidth + x] = type;

            // Objects
            if (char === 'S') { player.x = x + 0.5; player.y = y + 0.5; player.rot = 0; } // Face East
            else if (char === 'T') { gameObjects.push({ x: x + 0.5, y: y + 0.5, type: 'table', active: true }); requiredTables++; }
            else if (char === 'D') {
                gameObjects.push({
                    x: x + 0.5, y: y + 0.5,
                    type: 'enemy',
                    active: true,
                    health: 30,
                    state: 'idle',
                    lastAttackTime: 0,
                    variant: Math.floor(Math.random() * 3)
                });
            }
            else if (char === 'G') {
                // Boss enemy - The Head Designer
                const bossStats = getEnemyStats('boss');
                gameObjects.push({
                    x: x + 0.5, y: y + 0.5,
                    type: 'enemy',
                    active: true,
                    health: bossStats.health,
                    state: 'idle',
                    lastAttackTime: 0,
                    variant: 'boss',
                    isBoss: true
                });
            }
            else if (char === 'A') { gameObjects.push({ x: x + 0.5, y: y + 0.5, type: 'ammo', active: true }); }
            else if (char === 'H') { gameObjects.push({ x: x + 0.5, y: y + 0.5, type: 'health', active: true }); }
            else if (char === 'L') { gameObjects.push({ x: x + 0.5, y: y + 0.5, type: 'weaponPickup', weaponType: 'tableLeg', active: true }); }
        }
    }

    hudFloor.innerText = level;
    updateHUD();

    // Start level-specific music
    startLevelMusic(level);
}

function spawnProjectile(x, y, targetX, targetY, owner = 'enemy', color = null, damage = 15) {
    const dx = targetX - x;
    const dy = targetY - y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const speed = 0.15; // Projectile speed

    gameObjects.push({
        type: 'projectile',
        active: true,
        owner: owner, // 'player' or 'enemy'
        x: x,
        y: y,
        vx: (dx / dist) * speed,
        vy: (dy / dist) * speed,
        dist: 0, // For renderer sorting
        color: color || (owner === 'player' ? `hsl(${Math.random() * 360}, 100%, 50%)` : '#ff4400'),
        damage: damage
    });
}

function fireWeapon() {
    // Get current weapon stats
    const weaponKey = player.weapons[player.currentWeapon];
    const weapon = WEAPONS[weaponKey];

    if (gunCoolDown > 0) return;

    // Check ammo for ranged weapons only
    if (weapon.type === 'ranged' && player.ammo < weapon.ammoCost) return;

    // Deduct ammo (melee has 0 cost)
    player.ammo -= weapon.ammoCost;
    gunCoolDown = weapon.cooldown;
    gunOffset = weapon.type === 'melee' ? 30 : 20; // Bigger swing for melee

    if (weapon.type === 'melee') {
        meleeAttack(weapon);
        playSound('hit'); // Whoosh sound for swing
    } else {
        // Ranged attack - spawn projectile
        playSound('shoot');
        const projectileX = player.x + Math.cos(player.rot) * 0.2;
        const projectileY = player.y + Math.sin(player.rot) * 0.2;
        const targetX = player.x + Math.cos(player.rot) * 10;
        const targetY = player.y + Math.sin(player.rot) * 10;
        spawnProjectile(projectileX, projectileY, targetX, targetY, 'player', weapon.projectileColor(), weapon.damage);
    }

    updateHUD();
}

// Melee attack - hit all enemies in front within range and arc
function meleeAttack(weapon) {
    const range = weapon.range || 1.5;
    const arc = weapon.arc || Math.PI / 2; // 90 degrees default

    let hitSomething = false;

    gameObjects.forEach(obj => {
        if (obj.type !== 'enemy' || !obj.active || obj.state === 'dead') return;

        // Distance check
        const dx = obj.x - player.x;
        const dy = obj.y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > range) return;

        // Angle check - is enemy within swing arc?
        const angleToEnemy = Math.atan2(dy, dx);
        let angleDiff = angleToEnemy - player.rot;
        // Normalize to -PI to PI
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        if (Math.abs(angleDiff) < arc / 2) {
            // HIT!
            hitSomething = true;
            obj.health -= weapon.damage;
            obj.state = 'pain';
            setTimeout(() => { if (obj.state === 'pain') obj.state = 'chase'; }, 200);

            if (obj.health <= 0) {
                obj.state = 'dead';
                obj.active = false;
                playSound('enemy_death');

                // Boss defeat check
                if (obj.isBoss) {
                    gameState = 'credits';
                    showScreen('credits-screen');
                    playSound('fanfare');
                    setTimeout(() => {
                        hideScreens();
                        gameState = 'menu';
                        showReadThis = false;
                        updateMenuDOM();
                    }, 10000);
                }
            }
        }
    });

    if (hitSomething) {
        playSound('hit');
    }
}

// Switch to weapon by slot number (1-indexed)
function switchWeapon(slot) {
    const index = slot - 1;
    if (index >= 0 && index < player.weapons.length) {
        player.currentWeapon = index;
        const weaponKey = player.weapons[player.currentWeapon];
        const weapon = WEAPONS[weaponKey];
        // Play switch sound and show notification
        playSound('collect');
        updateHUD();
    }
}

function tryOpenDoor() {
    // Check block in front of player
    const checkDist = 1.0;
    const checkX = Math.floor(player.x + Math.cos(player.rot) * checkDist);
    const checkY = Math.floor(player.y + Math.sin(player.rot) * checkDist);

    if (checkX >= 0 && checkX < mapWidth && checkY >= 0 && checkY < mapHeight) {
        const idx = checkY * mapWidth + checkX;
        // If it's a door (Type 3) or Elevator (Type 9)
        if (worldMap[idx] === 3) { // Normal Door
            worldMap[idx] = 0; // Open it (make empty)
            playSound('door_open');
        } else if (worldMap[idx] === 4) {
            // Check if locked
            if (player.tables < requiredTables) {
                // Locked sound?
                // playSound('alert'); 
            } else {
                // Should open automatically via update(), but allow manual try if adjacent
            }
        } else if (worldMap[idx] === 4) {
            // Check if locked
            if (player.tables < requiredTables) {
                // Locked sound?
                // playSound('alert'); 
                // Maybe show message "LOCKED"
            } else {
                // Should open automatically, but this allows manual check if needed
                // Actually logic will auto-open, but let's keep it robust
            }
        }
    }
}

// Simple Ray marcher for Line of Sight
function checkLineOfSight(x1, y1, x2, y2) {
    const steps = Math.ceil(Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2) * 4);
    const dx = (x2 - x1) / steps;
    const dy = (y2 - y1) / steps;
    for (let i = 0; i < steps; i++) {
        const cx = Math.floor(x1 + dx * i);
        const cy = Math.floor(y1 + dy * i);
        if (worldMap[cy * mapWidth + cx] > 0) return false;
    }
    return true;
}

function update(dt) {
    if (gameState !== 'play') return;

    // Rotation
    if (input.left) player.rot -= player.rotSpeed;
    if (input.right) player.rot += player.rotSpeed;

    // Interaction
    if (input.open) {
        input.open = false; // distinct press
        tryOpenDoor();
    }

    // Movement
    let moveStep = player.speed;
    let newX = player.x;
    let newY = player.y;
    let moved = false;

    if (input.up) {
        newX += Math.cos(player.rot) * moveStep;
        newY += Math.sin(player.rot) * moveStep;
        moved = true;
    }
    if (input.down) {
        newX -= Math.cos(player.rot) * moveStep;
        newY -= Math.sin(player.rot) * moveStep;
        moved = true;
    }

    // Footsteps sound
    if (moved) {
        if (performance.now() - lastStepTime > 400) { // 400ms between steps
            playSound('step');
            lastStepTime = performance.now();
        }
    }

    // Wall Collision
    // Wall Collision with Padding (Radius)
    const BUFFER = 0.3; // Distance to keep from wall

    // Check Y Movement
    // If moving down (newY < player.y), check newY - BUFFER
    // If moving up (newY > player.y), check newY + BUFFER
    let checkY = newY + (newY > player.y ? BUFFER : -BUFFER);
    if (worldMap[Math.floor(checkY) * mapWidth + Math.floor(player.x)] === 0) {
        player.y = newY;
    }

    // Check X Movement
    let checkX = newX + (newX > player.x ? BUFFER : -BUFFER);
    if (worldMap[Math.floor(player.y) * mapWidth + Math.floor(checkX)] === 0) {
        player.x = newX;
    }

    // Object Interaction
    gameObjects.forEach(obj => {
        if (!obj.active && obj.state !== 'dead') return;
        const dx = player.x - obj.x;
        const dy = player.y - obj.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 0.5) {
            if (obj.type === 'table' && obj.active) {
                obj.active = false;
                player.tables++;
                playSound('collect');
                updateHUD();
            } else if (obj.type === 'ammo' && obj.active) {
                obj.active = false;
                player.ammo += 10;
                playSound('collect');
                updateHUD();
            } else if (obj.type === 'health' && obj.active && player.health < 100) {
                obj.active = false;
                player.health = Math.min(100, player.health + 25);
                playSound('collect');
                updateHUD();
            } else if (obj.type === 'weaponPickup' && obj.active) {
                // Check if player already has this weapon
                if (!player.weapons.includes(obj.weaponType)) {
                    obj.active = false;
                    player.weapons.push(obj.weaponType);
                    player.currentWeapon = player.weapons.length - 1; // Auto-equip new weapon
                    playSound('collect');
                    updateHUD();
                }
            }

            // Check Elevator Condition
            if (player.tables >= requiredTables) {
                // Unlock Gates
                let opened = false;
                for (let i = 0; i < worldMap.length; i++) {
                    if (worldMap[i] === 4) {
                        worldMap[i] = 0; // Remove gate
                        opened = true;
                    }
                }
                if (opened) {
                    playSound('elevator');
                    // Notification?
                    const hudFloor = document.getElementById('hud-floor');
                    if (hudFloor) hudFloor.style.color = '#0f0'; // Green text
                }
            }
        }

        // Enemy AI
        if (obj.type === 'enemy' && obj.active && obj.state !== 'dead') {
            const hasLos = checkLineOfSight(player.x, player.y, obj.x, obj.y);

            // Get type-specific stats
            const stats = getEnemyStats(obj.variant);

            // --- STATE MACHINE ---

            // IDLE: Patrol in place or wait
            if (obj.state === 'idle') {
                // Patrol movement (small random movements)
                if (!obj.patrolTimer) obj.patrolTimer = 0;
                obj.patrolTimer += 1;

                if (obj.patrolTimer > 60) { // Every ~1 second
                    obj.patrolTimer = 0;
                    // Small random movement
                    const patrolDirX = (Math.random() - 0.5) * 0.3;
                    const patrolDirY = (Math.random() - 0.5) * 0.3;
                    const newX = obj.x + patrolDirX;
                    const newY = obj.y + patrolDirY;
                    // Only move if not hitting wall
                    if (worldMap[Math.floor(newY) * mapWidth + Math.floor(newX)] === 0) {
                        obj.x = newX;
                        obj.y = newY;
                    }
                }

                // Alert logic - spot player
                if (hasLos && dist < stats.detectRange) {
                    obj.state = 'alert';
                    obj.alertTimer = 30; // Brief alert before chase
                    // Boss has a special roar sound
                    if (obj.isBoss) {
                        playSound('boss_roar');
                    } else {
                        playSound('alert');
                    }
                }
            }

            // ALERT: Brief pause when spotting player
            if (obj.state === 'alert') {
                obj.alertTimer--;
                if (obj.alertTimer <= 0) {
                    obj.state = 'chase';
                }
            }

            // CHASE: Move toward player
            if (obj.state === 'chase') {
                if (dist > 1.5) {
                    // Move toward player with type-specific speed
                    const moveSpeed = stats.moveSpeed;
                    const dirX = (player.x - obj.x);
                    const dirY = (player.y - obj.y);
                    const dirLen = Math.sqrt(dirX * dirX + dirY * dirY);

                    const newX = obj.x + (dirX / dirLen) * moveSpeed;
                    const newY = obj.y + (dirY / dirLen) * moveSpeed;

                    // Wall collision
                    if (worldMap[Math.floor(newY) * mapWidth + Math.floor(obj.x)] === 0) {
                        obj.y = newY;
                    }
                    if (worldMap[Math.floor(obj.y) * mapWidth + Math.floor(newX)] === 0) {
                        obj.x = newX;
                    }
                }

                // Lose sight - return to idle after delay
                if (!hasLos) {
                    if (!obj.lostSightTimer) obj.lostSightTimer = 0;
                    obj.lostSightTimer++;
                    if (obj.lostSightTimer > 120) { // ~2 seconds
                        obj.state = 'idle';
                        obj.lostSightTimer = 0;
                    }
                } else {
                    obj.lostSightTimer = 0;
                }
            }

            // ATTACK: Fire at player from range
            if (hasLos && dist < stats.attackRange && obj.state === 'chase') {
                const now = performance.now();
                if (now - obj.lastAttackTime > stats.attackCooldown) {
                    obj.lastAttackTime = now;
                    spawnProjectile(obj.x, obj.y, player.x, player.y, 'enemy');
                    playSound('shoot');
                }
            }
        }

        // Projectile Logic
        if (obj.type === 'projectile' && obj.active) {
            const nextX = obj.x + obj.vx;
            const nextY = obj.y + obj.vy;

            // Wall Collision
            if (worldMap[Math.floor(nextY) * mapWidth + Math.floor(nextX)] > 0) {
                obj.active = false; // Hit wall
                return;
            }

            // Collision Logic
            // 1. Player Collision (if enemy projectile)
            if (obj.owner === 'enemy') {
                const dx = player.x - nextX;
                const dy = player.y - nextY;
                if (Math.sqrt(dx * dx + dy * dy) < 0.3) {
                    obj.active = false;
                    player.health -= 3; // Reduced Damage (was 5)
                    playSound('hit');
                    // Damage Flash
                    const overlay = document.getElementById('damage-overlay');
                    if (overlay) {
                        overlay.style.opacity = 0.5;
                        setTimeout(() => overlay.style.opacity = 0, 100);
                    }
                    updateHUD();

                    if (player.health <= 0) {
                        gameState = 'lose';
                        showScreen('game-over-screen');
                    }
                    return;
                }
            }
            // 2. Enemy Collision (if player projectile)
            else if (obj.owner === 'player') {
                for (let i = 0; i < gameObjects.length; i++) {
                    const enemy = gameObjects[i];
                    if (enemy.type === 'enemy' && enemy.active && enemy.state !== 'dead') {
                        const dist = Math.sqrt((enemy.x - nextX) ** 2 + (enemy.y - nextY) ** 2);
                        if (dist < 0.3) {
                            obj.active = false;
                            enemy.health -= obj.damage || 15;
                            enemy.state = 'pain';
                            setTimeout(() => { if (enemy.state === 'pain') enemy.state = 'chase'; }, 200);
                            playSound('hit');
                            if (enemy.health <= 0) {
                                enemy.state = 'dead';
                                enemy.active = false;
                                playSound('enemy_death');

                                // Check if this was the boss - trigger credits!
                                if (enemy.isBoss) {
                                    gameState = 'credits';
                                    showScreen('credits-screen');
                                    playSound('fanfare');
                                    // After credits, return to main menu
                                    setTimeout(() => {
                                        hideScreens();
                                        gameState = 'menu';
                                        showReadThis = false;
                                        updateMenuDOM();
                                    }, 10000); // 10 second credits
                                }
                            }
                            return;
                        }
                    }
                }
            }

            obj.x = nextX;
            obj.y = nextY;
        }
    });

    // Elevator Check - Only works on levels that have a next level (not boss level)
    // Boss level (4) should end via boss defeat -> credits, not elevator
    if (level < levels.length) {
        const blockX = Math.floor(player.x + Math.cos(player.rot) * 0.5);
        const blockY = Math.floor(player.y + Math.sin(player.rot) * 0.5);
        if (worldMap[blockY * mapWidth + blockX] === 9) {
            if (player.tables >= requiredTables) {
                playSound('elevator');
                gameState = 'transition';
                showScreen('win-screen');
                setTimeout(() => {
                    loadLevel(level); // index is level-1, so this loads next
                    gameState = 'play';
                    hideScreens();
                    updateHUD();
                }, 2000);
            }
        }
    }

    // Gun Anim
    if (gunCoolDown > 0) gunCoolDown--;
    // Recoil recovery
    if (gunOffset > 0) gunOffset -= 2;
    // Ensure gunOffset doesn't drift
    if (gunOffset < 0) gunOffset = 0;
}

// --- Menu Logic ---

function menuNav(dir) {
    if (showReadThis) return; // Locked in sub-screen

    if (showLevelSelect) {
        // Navigate level select submenu
        levelSelectIdx += dir;
        if (levelSelectIdx < 0) levelSelectIdx = levels.length - 1;
        if (levelSelectIdx >= levels.length) levelSelectIdx = 0;
        playSound('step');
        updateMenuDOM();
        return;
    }

    menuIdx += dir;
    if (menuIdx < 0) menuIdx = menuItems.length - 1;
    if (menuIdx >= menuItems.length) menuIdx = 0;
    playSound('step'); // Reuse step sound for blip
    updateMenuDOM();
}

function menuSelect() {
    if (showReadThis) {
        showReadThis = false;
        updateMenuDOM();
        return;
    }

    if (showLevelSelect) {
        // Select a level and start game
        startGameAtLevel(levelSelectIdx);
        return;
    }

    const item = menuItems[menuIdx];
    if (item === 'NEW GAME') {
        startGame();
    } else if (item === 'LEVEL SELECT') {
        showLevelSelect = true;
        levelSelectIdx = 0;
        updateMenuDOM();
    } else if (item === 'INSTRUCTIONS') {
        showReadThis = true;
        updateMenuDOM();
    } else if (item === 'QUIT') {
        // Just reload page
        location.reload();
    }
}

function startGameAtLevel(lvlIdx) {
    initAudio();
    player.health = 100;
    player.ammo = 50;
    loadLevel(lvlIdx);
    gameState = 'play';
    hideScreens();
    showLevelSelect = false;
    updateMenuDOM();
    document.getElementById('hud').classList.remove('hidden');
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

function handleGlobalInputs() {
    if (input.escape) {
        input.escape = false; // Interact once
        if (gameState === 'play') {
            gameState = 'menu';
            showReadThis = false;
            showLevelSelect = false;
            updateMenuDOM();
        } else if (gameState === 'menu') {
            // If in a submenu, go back to main menu
            if (showReadThis || showLevelSelect) {
                showReadThis = false;
                showLevelSelect = false;
                updateMenuDOM();
                return;
            }
            // Only resume if we actually started a game
            if (player.health > 0) {
                gameState = 'play';
                document.getElementById('hd-menu').classList.add('hidden');
            }
        }
    }
}

function updateMenuDOM() {
    const menuEl = document.getElementById('hd-menu');
    const itemsEl = document.getElementById('menu-items');
    const instrEl = document.getElementById('menu-instructions');
    const levelEl = document.getElementById('menu-level-select');
    console.log("updateMenuDOM State:", gameState);

    if (gameState === 'menu') {
        menuEl.classList.remove('hidden');
        if (showReadThis) {
            instrEl.classList.remove('hidden');
            itemsEl.classList.add('hidden');
            if (levelEl) levelEl.classList.add('hidden');
        } else if (showLevelSelect) {
            if (levelEl) {
                levelEl.classList.remove('hidden');
                // Update level select items
                const levelItems = levelEl.querySelectorAll('.level-item');
                levelItems.forEach((el, idx) => {
                    if (idx === levelSelectIdx) el.classList.add('selected');
                    else el.classList.remove('selected');
                });
            }
            itemsEl.classList.add('hidden');
            instrEl.classList.add('hidden');
        } else {
            instrEl.classList.add('hidden');
            if (levelEl) levelEl.classList.add('hidden');
            itemsEl.classList.remove('hidden');
            // Update selection
            const items = document.querySelectorAll('.menu-item');
            items.forEach((el, idx) => {
                if (idx === menuIdx) el.classList.add('selected');
                else el.classList.remove('selected');
            });
        }
    } else {
        menuEl.classList.add('hidden');
    }
}
