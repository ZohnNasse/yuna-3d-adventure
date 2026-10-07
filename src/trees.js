// Number Fruit Tree Mini-Game
// Shake trees to drop numbered fruits (1-9), collect them to make sums of 10

let currentSum = 0;
let score = 0;
let trees = [];

// Create a number fruit tree
function create_number_tree(x, z) {
    const treeGroup = new THREE.Group();
    
    // Trunk
    const trunkGeo = new THREE.CylinderGeometry(0.15, 0.2, 1.5, 8);
    const trunkMat = new THREE.MeshPhongMaterial({ color: 0x8B4513, specular: 0x333333, shininess: 20 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 0.75;
    trunk.castShadow = true;
    treeGroup.add(trunk);
    
    // Leaves (sphere)
    const leavesGeo = new THREE.SphereGeometry(0.8, 16, 12);
    const leavesMat = new THREE.MeshPhongMaterial({ color: 0x228B22, specular: 0x55FF55, shininess: 30 });
    const leaves = new THREE.Mesh(leavesGeo, leavesMat);
    leaves.position.y = 1.8;
    leaves.castShadow = true;
    treeGroup.add(leaves);
    
    // Fruits array (empty initially)
    treeGroup.userData.fruits = [];
    treeGroup.userData.trunk = trunk;
    treeGroup.userData.leaves = leaves;
    treeGroup.userData.lastShake = 0;
    
    treeGroup.position.set(x, 0, z);
    scene.add(treeGroup);
    
    return treeGroup;
}

// Shake the tree and drop fruits
function shake_tree(tree) {
    const now = Date.now();
    if (now - tree.userData.lastShake < 2000) return false;
    
    tree.userData.lastShake = now;
    
    // Shake animation
    const origX = tree.position.x;
    const shakeDuration = 500;
    const shakeStart = Date.now();
    
    function animateShake() {
        const elapsed = Date.now() - shakeStart;
        if (elapsed < shakeDuration) {
            const intensity = (shakeDuration - elapsed) / shakeDuration * 0.1;
            tree.position.x = origX + (Math.random() - 0.5) * intensity;
            requestAnimationFrame(animateShake);
        } else {
            tree.position.x = origX;
        }
    }
    animateShake();
    
    // Drop 1-3 fruits
    const numFruits = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < numFruits; i++) {
        spawn_fruit(tree);
    }
    
    return true;
}

// Spawn a numbered fruit
function spawn_fruit(tree) {
    const value = Math.floor(Math.random() * 9) + 1;
    
    const fruitGeo = new THREE.SphereGeometry(0.15, 12, 8);
    const fruitMat = new THREE.MeshPhongMaterial({ 
        color: 0xFF6B6B, 
        specular: 0xFFFFFF, 
        shininess: 80,
        emissive: 0x331111
    });
    const fruit = new THREE.Mesh(fruitGeo, fruitMat);
    
    // Random position near tree
    const offset = (Math.random() - 0.5) * 1.5;
    fruit.position.set(
        tree.position.x + offset,
        2.0,
        tree.position.z + (Math.random() - 0.5) * 1.5
    );
    
    // Add value label (using sprite)
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(255, 215, 0, 0.9)';
    ctx.beginPath();
    ctx.arc(32, 32, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(value), 32, 32);
    
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.position.set(0, 0.25, 0);
    sprite.scale.set(0.4, 0.4, 1);
    fruit.add(sprite);
    
    fruit.castShadow = true;
    fruit.userData.value = value;
    fruit.userData.vy = 0;
    fruit.userData.groundY = 0.15;
    fruit.userData.lifetime = 5000;
    fruit.userData.created = Date.now();
    
    scene.add(fruit);
    tree.userData.fruits.push(fruit);
    
    return fruit;
}

// Update all fruit trees (physics, gravity)
function update_trees() {
    const now = Date.now();
    
    for (const tree of trees) {
        // Update fruits
        for (let i = tree.userData.fruits.length - 1; i >= 0; i--) {
            const fruit = tree.userData.fruits[i];
            
            // Gravity
            if (fruit.position.y > fruit.userData.groundY) {
                fruit.userData.vy -= 0.001;
                fruit.position.y += fruit.userData.vy;
            } else {
                fruit.position.y = fruit.userData.groundY;
                fruit.userData.vy = 0;
            }
            
            // Lifetime
            if (now - fruit.userData.created > fruit.userData.lifetime) {
                scene.remove(fruit);
                tree.userData.fruits.splice(i, 1);
            }
        }
    }
}

// Collect fruits near player
function collect_fruits(player) {
    let collected = 0;
    
    for (const tree of trees) {
        for (let i = tree.userData.fruits.length - 1; i >= 0; i--) {
            const fruit = tree.userData.fruits[i];
            
            const dist = Math.sqrt(
                (player.position.x - fruit.position.x) ** 2 +
                (player.position.z - fruit.position.z) ** 2
            );
            
            if (dist < 0.8) {
                collected += fruit.userData.value;
                
                // Sparkle effect
                create_sparkles(fruit.position.x, fruit.position.y, fruit.position.z, 0xFFD700, 8);
                
                // Remove fruit
                scene.remove(fruit);
                tree.userData.fruits.splice(i, 1);
            }
        }
    }
    
    if (collected > 0) {
        currentSum += collected;
        score += collected;
        update_hud();
        
        if (currentSum >= 10) {
            score += 50;
            show_message("🎉 10 만들었다!");
            currentSum = 0;
        }
    }
    
    return collected;
}

// Update HUD with current sum
function update_hud() {
    let hud = document.getElementById('game-hud');
    if (!hud) {
        hud = document.createElement('div');
        hud.id = 'game-hud';
        hud.style.position = 'fixed';
        hud.style.top = '10px';
        hud.style.right = '10px';
        hud.style.background = 'rgba(0,0,0,0.7)';
        hud.style.color = 'white';
        hud.style.padding = '10px 15px';
        hud.style.borderRadius = '8px';
        hud.style.fontFamily = 'Arial';
        hud.style.fontSize = '16px';
        hud.style.zIndex = '1000';
        document.body.appendChild(hud);
    }
    
    hud.innerHTML = `
        <div>🌳 현재 합: ${currentSum}/10</div>
        <div>🏆 점수: ${score}</div>
    `;
}

// Show temporary message
function show_message(text) {
    let msg = document.getElementById('game-message');
    if (!msg) {
        msg = document.createElement('div');
        msg.id = 'game-message';
        msg.style.position = 'fixed';
        msg.style.top = '50%';
        msg.style.left = '50%';
        msg.style.transform = 'translate(-50%, -50%)';
        msg.style.background = 'rgba(0,0,0,0.8)';
        msg.style.color = 'gold';
        msg.style.padding = '20px 30px';
        msg.style.borderRadius = '15px';
        msg.style.fontFamily = 'Arial';
        msg.style.fontSize = '24px';
        msg.style.fontWeight = 'bold';
        msg.style.zIndex = '1001';
        msg.style.display = 'none';
        document.body.appendChild(msg);
    }
    
    msg.textContent = text;
    msg.style.display = 'block';
    setTimeout(() => { msg.style.display = 'none'; }, 2000);
}

// Create particle sparkles
function create_sparkles(x, y, z, color, count) {
    for (let i = 0; i < count; i++) {
        const sparkleGeo = new THREE.OctahedronGeometry(0.05, 0);
        const sparkleMat = new THREE.MeshBasicMaterial({ 
            color: color,
            transparent: true,
            opacity: 1.0
        });
        const sparkle = new THREE.Mesh(sparkleGeo, sparkleMat);
        sparkle.position.set(x, y, z);
        
        const angle = (i / count) * Math.PI * 2;
        const speed = 0.02 + Math.random() * 0.02;
        sparkle.userData.vx = Math.cos(angle) * speed;
        sparkle.userData.vy = 0.01 + Math.random() * 0.02;
        sparkle.userData.vz = Math.sin(angle) * speed;
        sparkle.userData.lifetime = 1000;
        sparkle.userData.created = Date.now();
        
        scene.add(sparkle);
    }
}

// Update sparkles (should be called in game loop)
function update_sparkles() {
    const now = Date.now();
    const toRemove = [];
    
    scene.traverse((obj) => {
        if (obj.userData && obj.userData.lifetime && obj.userData.created) {
            if (now - obj.userData.created > obj.userData.lifetime) {
                toRemove.push(obj);
            } else if (obj.userData.vx) {
                obj.position.x += obj.userData.vx;
                obj.position.y += obj.userData.vy;
                obj.position.z += obj.userData.vz;
                obj.userData.vy -= 0.0005;
            }
        }
    });
    
    toRemove.forEach(obj => {
        scene.remove(obj);
    });
}

// Export functions
window.trees_module = {
    create_number_tree,
    shake_tree,
    update_trees,
    collect_fruits,
    update_hud,
    show_message,
    update_sparkles
};
