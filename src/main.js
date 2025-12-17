/**
 * MAIN ENTRY POINT
 */

// Global Canvas refs (populated when page loads)
let canvas;
let ctx;
let hudHealth;
let hudAmmo;
let hudTables;
let hudFloor;
let hudScore;
let faceImg;
let animationFrameId;
let lastTime = 0;

function initGame() {
    try {
        console.log("Initializing Game... VERSION 3.0 (Advanced Levels)");
        canvas = document.getElementById('gameCanvas');
        if (!canvas) throw new Error("Canvas element '#gameCanvas' not found!");

        ctx = canvas.getContext('2d', { alpha: false });
        hudHealth = document.getElementById('hud-health');
        hudAmmo = document.getElementById('hud-ammo');
        hudTables = document.getElementById('hud-tables');
        hudFloor = document.getElementById('hud-floor');
        hudScore = document.getElementById('hud-score');
        faceImg = document.getElementById('face-img');

        initInput();
        simulateLoading();
    } catch (e) {
        console.error("Game Init Failed:", e);
        alert("Game Error: " + e.message);
    }
}

// Simplified and Robust Loading Logic
function simulateLoading() {
    const bar = document.getElementById('load-bar');
    const text = document.getElementById('load-text');
    let width = 0;

    // Safety Force Start
    let loaded = false;

    const interval = setInterval(() => {
        if (loaded) return;

        width += 2; // Consistent speed
        if (width > 100) width = 100;

        if (bar) bar.style.width = width + "%";

        // Flavor Text
        if (width === 30 && text) text.innerText = "Polishing Pixels...";
        if (width === 60 && text) text.innerText = "Building World...";
        if (width === 90 && text) text.innerText = "Readying Tables...";

        if (width >= 100) {
            loaded = true;
            clearInterval(interval);
            if (text) {
                text.innerText = "PRESS ENTER TO START";
                text.classList.add('press-enter');
            }

            const onStart = (e) => {
                console.log("Interaction detected:", e.type, e.code);
                if (e.code === 'Enter' || e.type === 'click') {
                    console.log("Transitioning to Menu...");
                    window.removeEventListener('keydown', onStart);
                    window.removeEventListener('click', onStart); // Allow click too

                    const screen = document.getElementById('loading-screen');
                    if (screen) {
                        screen.style.transition = 'opacity 0.5s';
                        screen.style.opacity = '0';
                        setTimeout(() => {
                            console.log("Hiding loading screen");
                            screen.classList.add('hidden');
                        }, 500);
                    }

                    gameState = 'menu';
                    console.log("State set to:", gameState);
                    lastTime = performance.now();
                    requestAnimationFrame(gameLoop);

                    initAudio();
                    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
                    startMenuMusic();

                    updateHUD();
                    updateMenuDOM();
                    console.log("Menu DOM updated called.");
                }
            };

            window.addEventListener('keydown', onStart);
            window.addEventListener('click', onStart); // Fallback interaction
        }
    }, 50);
}

let introTimeout = null;
let introState = 'scrolling'; // 'scrolling' or 'waiting'

function startIntro() {
    initAudio();
    gameState = 'intro';
    introState = 'scrolling';
    hideScreens();
    document.getElementById('hd-menu').classList.add('hidden');
    document.getElementById('intro-screen').classList.remove('hidden');
    document.getElementById('intro-start-prompt').classList.add('hidden');

    // Reset and restart the intro container
    const container = document.querySelector('.intro-container');
    const skipText = document.querySelector('.intro-skip');
    if (container) {
        container.style.display = 'block';
        container.style.top = '100%';
        container.style.animation = 'none';
        container.offsetHeight; // Force reflow
        container.style.animation = 'introScroll 90s linear forwards';
    }
    if (skipText) {
        skipText.style.display = 'block';
    }

    startIntroMusic();

    // After scroll ends, show start prompt
    introTimeout = setTimeout(() => {
        showIntroStartPrompt();
    }, 92000);

    // Listen for skip/start
    window.addEventListener('keydown', handleIntroInput);
}

function showIntroStartPrompt() {
    introState = 'waiting';
    const container = document.querySelector('.intro-container');
    const skipText = document.querySelector('.intro-skip');
    if (container) container.style.display = 'none';
    if (skipText) skipText.style.display = 'none';
    document.getElementById('intro-start-prompt').classList.remove('hidden');
}

function handleIntroInput(e) {
    if (gameState !== 'intro') return;

    if (e.code === 'Enter' || e.code === 'Space') {
        if (introState === 'scrolling') {
            // Skip to the prompt
            if (introTimeout) {
                clearTimeout(introTimeout);
                introTimeout = null;
            }
            showIntroStartPrompt();
        } else if (introState === 'waiting') {
            // Start the game
            finishIntro();
        }
    }
}

function finishIntro() {
    window.removeEventListener('keydown', handleIntroInput);
    document.getElementById('intro-screen').classList.add('hidden');
    actuallyStartGame();
}

function skipIntro() {
    if (introTimeout) {
        clearTimeout(introTimeout);
        introTimeout = null;
    }
    window.removeEventListener('keydown', handleIntroInput);
    document.getElementById('intro-screen').classList.add('hidden');
    actuallyStartGame();
}

function actuallyStartGame() {
    player.health = 100;
    player.ammo = 50;
    loadLevel(0);
    gameState = 'play';
    hideScreens();
    updateMenuDOM();
    document.getElementById('hud').classList.remove('hidden');
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

function startGame() {
    // Start the intro sequence instead of jumping right into the game
    startIntro();
}

function hideScreens() {
    document.querySelectorAll('.screen').forEach(el => el.classList.add('hidden'));
    document.getElementById('intro-screen')?.classList.add('hidden');
}

function showScreen(id) {
    document.getElementById(id).classList.remove('hidden');
}

function updateHUD() {
    if (!hudHealth) return;
    hudHealth.innerText = Math.floor(player.health) + "%";
    hudAmmo.innerText = player.ammo;
    hudTables.innerText = player.tables + "/" + requiredTables;
    if (hudScore) hudScore.innerText = player.score.toLocaleString();

    // Green when complete
    if (player.tables >= requiredTables) {
        hudTables.style.color = '#0f0';
        hudTables.style.textShadow = '0 0 5px #0f0';
    } else {
        hudTables.style.color = '#fff';
        hudTables.style.textShadow = 'none';
    }

    // Weapon display
    const hudWeapon = document.getElementById('hud-weapon');
    const hudWeaponSlot = document.getElementById('hud-weapon-slot');
    if (hudWeapon && player.weapons && player.weapons.length > 0) {
        const weaponKey = player.weapons[player.currentWeapon];
        const weapon = WEAPONS[weaponKey];
        hudWeapon.innerText = weapon ? weapon.name : 'PAINTBRUSH';
        if (hudWeaponSlot) {
            hudWeaponSlot.innerText = '[' + (player.currentWeapon + 1) + ']';
        }
    }

    // Ensure src is updated properly
    const newSrc = player.health > 50 ? faceHappy : faceOuch;
    if (faceImg.src !== newSrc) {
        faceImg.src = newSrc;
    }
}

// --- Main Loop ---
function gameLoop(timestamp) {
    // Loop runs for menu, play, win, lose (if we want anims there)
    // if (gameState !== 'play') return; 

    const dt = timestamp - lastTime;
    lastTime = timestamp;

    handleGlobalInputs();
    update(dt);
    drawGame();

    animationFrameId = requestAnimationFrame(gameLoop);
}

// Start
// Robust Entry Point
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
} else {
    initGame();
}
