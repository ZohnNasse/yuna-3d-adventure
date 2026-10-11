// 나무흔들기 미니게임 — 숫자 열매 수집
// 목표: 합이 10이 되도록 열매 주우기 (4~7세 덧셈 학습)

let number_trees = [];
let current_sum = 0;
const fruits = [];

function create_number_tree(x, z) {
    const tree = new THREE.Group();
    
    // 나무 몸체
    const trunkGeo = new THREE.CylinderGeometry(0.15, 0.2, 1.5, 8);
    const trunkMat = new THREE.MeshPhongMaterial({ color: 0x8B4513, specular: 0x333333, shininess: 20 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 0.75;
    trunk.castShadow = true;
    tree.add(trunk);
    
    // 나뭇잎
    const leavesGeo = new THREE.SphereGeometry(0.8, 16, 12);
    const leavesMat = new THREE.MeshPhongMaterial({ color: 0x228B22, specular: 0x55FF55, shininess: 30 });
    const leaves = new THREE.Mesh(leavesGeo, leavesMat);
    leaves.position.y = 1.8;
    leaves.castShadow = true;
    tree.add(leaves);
    
    tree.position.set(x, 0, z);
    tree.userData.lastShake = 0;
    tree.userData.isFruitTree = true;
    
    scene.add(tree);
    number_trees.push(tree);
    return tree;
}

function shake_tree(tree) {
    const now = Date.now();
    if (now - tree.userData.lastShake < 2000) return false; // 2초 쿨타임
    
    tree.userData.lastShake = now;
    
    // 흔들림 애니메이션
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
    
    // 열매 떨어뜨리기 (1~3개)
    const numFruits = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < numFruits; i++) {
        spawn_fruit(tree);
    }
    
    return true;
}

function spawn_fruit(tree) {
    // 1~9 랜덤 숫자
    const value = Math.floor(Math.random() * 9) + 1;
    
    // 열매 메쉬
    const fruitGeo = new THREE.SphereGeometry(0.15, 12, 8);
    const fruitMat = new THREE.MeshPhongMaterial({ 
        color: 0xFF6B6B, 
        specular: 0xFFFFFF, 
        shininess: 80,
        emissive: 0x331111
    });
    const fruit = new THREE.Mesh(fruitGeo, fruitMat);
    
    // 나무 주변 랜덤 위치
    const offset = (Math.random() - 0.5) * 1.5;
    fruit.position.set(
        tree.position.x + offset,
        2.0,
        tree.position.z + (Math.random() - 0.5) * 1.5
    );
    
    // 숫자 표시 (스프라이트)
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
    fruits.push(fruit);
    
    return fruit;
}

function update_fruits() {
    const now = Date.now();
    for (let i = fruits.length - 1; i >= 0; i--) {
        const fruit = fruits[i];
        
        // 중력
        if (fruit.position.y > fruit.userData.groundY) {
            fruit.userData.vy -= 0.001;
            fruit.position.y += fruit.userData.vy;
        } else {
            fruit.position.y = fruit.userData.groundY;
            fruit.userData.vy = 0;
        }
        
        // 수명 초과 시 제거
        if (now - fruit.userData.created > fruit.userData.lifetime) {
            scene.remove(fruit);
            fruits.splice(i, 1);
        }
    }
}

function collect_fruits_near_player() {
    let collected = 0;
    for (let i = fruits.length - 1; i >= 0; i--) {
        const fruit = fruits[i];
        const dist = Math.sqrt(
            (character.position.x - fruit.position.x) ** 2 +
            (character.position.z - fruit.position.z) ** 2
        );
        if (dist < 0.8) {
            collected += fruit.userData.value;
            create_sparkles(fruit.position.x, fruit.position.y, fruit.position.z, 0xFFD700, 8);
            scene.remove(fruit);
            fruits.splice(i, 1);
        }
    }
    
    if (collected > 0) {
        current_sum += collected;
        score += collected;
        update_hud();
        
        if (current_sum >= 10) {
            score += 50;
            show_message("🎉 10 만들었다!");
            current_sum = 0;
        }
    }
    return collected;
}

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
    hud.innerHTML = '<div>🌳 현재 합: ' + current_sum + '/10</div><div>🏆 점수: ' + score + '</div>';
}

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
        document.body.appendChild(msg);
    }
    msg.textContent = text;
    msg.style.display = 'block';
    setTimeout(() => { msg.style.display = 'none'; }, 1500);
}

function shake_nearest_tree() {
    let nearest = null;
    let nearestDist = Infinity;
    
    for (const tree of number_trees) {
        const dist = Math.sqrt(
            (character.position.x - tree.position.x) ** 2 +
            (character.position.z - tree.position.z) ** 2
        );
        if (dist < nearestDist && dist < 2.5) {
            nearest = tree;
            nearestDist = dist;
        }
    }
    
    if (nearest) {
        shake_tree(nearest);
    }
}

// 게임 초기화 시 나무 생성
function setup_number_trees() {
    create_number_tree(12, 5);
    create_number_tree(-8, 10);
    create_number_tree(5, -12);
    
    // 나무 흔들기 터치 이벤트
    window.addEventListener('keydown', (e) => {
        if (e.code === 'KeyE') {
            shake_nearest_tree();
        }
    });
}

// 메인 게임 루프에 통합
window.number_trees = number_trees;
window.update_fruits = update_fruits;
window.collect_fruits_near_player = collect_fruits_near_player;
window.update_hud = update_hud;
window.setup_number_trees = setup_number_trees;
window.shake_nearest_tree = shake_nearest_tree;