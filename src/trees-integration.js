// Number fruit trees integration
// Place 3 trees, add shake interaction, integrate with game loop

let numberTrees = [];
let currentSum = 0;

// Create 3 number fruit trees at strategic locations
function setup_number_trees() {
    numberTrees.push(window.trees_module.create_number_tree(12, 5));
    numberTrees.push(window.trees_module.create_number_tree(-8, 10));
    numberTrees.push(window.trees_module.create_number_tree(5, -12));
}

// Shake nearest tree to character
function shake_nearest_tree() {
    let nearest = null;
    let nearestDist = Infinity;
    
    for (const tree of numberTrees) {
        const dist = Math.sqrt(
            (character.position.x - tree.position.x) ** 2 +
            (character.position.z - tree.position.z) ** 2
        );
        if (dist < nearestDist && dist < 3.0) {
            nearest = tree;
            nearestDist = dist;
        }
    }
    
    if (nearest) {
        window.trees_module.shake_tree(nearest);
    }
}

// Bind keyboard shortcut (S to shake)
document.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 's' && !e.shiftKey && !e.ctrlKey && !e.altKey) {
        if (!moving) { // Only shake when not moving
            shake_nearest_tree();
        }
    }
});

// Update trees in game loop (call from animate)
function update_trees_in_loop() {
    window.trees_module.update_trees();
    window.trees_module.update_sparkles();
    collect_fruits_from_trees();
}

function collect_fruits_from_trees() {
    let collected = 0;
    for (const tree of numberTrees) {
        collected += window.trees_module.collect_fruits(tree, character);
    }
    if (collected > 0) {
        window.trees_module.update_hud();
    }
}

// Show initial message
window.trees_module.show_message("🌳 나무에走近해서 S 키로 흔들면 열매가 떨어져요!");

// Initialize trees when game starts
document.getElementById('start-btn').addEventListener('click', () => {
    setTimeout(() => {
        setup_number_trees();
        window.trees_module.update_hud();
    }, 1000);
});

// Export for game loop integration
window.number_trees = {
    setup: setup_number_trees,
    update: update_trees_in_loop,
    shake_nearest: shake_nearest_tree
};
