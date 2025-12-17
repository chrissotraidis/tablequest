/**
 * INPUT HANDLING
 */
let input = {
    up: false, down: false, left: false, right: false, shoot: false, enter: false, open: false, escape: false,
    menuUp: false, menuDown: false, menuSelect: false // One-shot inputs for menu
};

function initInput() {
    window.addEventListener('keydown', (e) => {
        if (gameState === 'play') {
            if (e.code === 'ArrowUp' || e.code === 'KeyW') input.up = true;
            if (e.code === 'ArrowDown' || e.code === 'KeyS') input.down = true;
            if (e.code === 'ArrowLeft' || e.code === 'KeyA') input.left = true;
            if (e.code === 'ArrowRight' || e.code === 'KeyD') input.right = true;
            if (e.code === 'KeyE') input.open = true;
            if (e.code === 'Space') {
                if (!input.shoot && gameState === 'play') fireWeapon();
                input.shoot = true;
            }
            // Weapon switching (1, 2, 3)
            if (e.code === 'Digit1') switchWeapon(1);
            if (e.code === 'Digit2') switchWeapon(2);
            if (e.code === 'Digit3') switchWeapon(3);
        } else if (gameState === 'menu') {
            if (e.code === 'ArrowUp' || e.code === 'KeyW') { menuNav(-1); }
            if (e.code === 'ArrowDown' || e.code === 'KeyS') { menuNav(1); }
            if (e.code === 'Enter' || e.code === 'Space') { menuSelect(); }
        }

        // Global
        if (e.code === 'Enter') input.enter = true;
        if (e.code === 'Escape') input.escape = true;
    });

    window.addEventListener('keyup', (e) => {
        if (e.code === 'ArrowUp' || e.code === 'KeyW') input.up = false;
        if (e.code === 'ArrowDown' || e.code === 'KeyS') input.down = false;
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') input.left = false;
        if (e.code === 'ArrowRight' || e.code === 'KeyD') input.right = false;
        if (e.code === 'KeyE') input.open = false;
        if (e.code === 'Space') input.shoot = false;
        if (e.code === 'Enter') input.enter = false;
        if (e.code === 'Escape') input.escape = false;
    });
}
